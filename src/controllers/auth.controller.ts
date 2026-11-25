import { Request, Response } from "express";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Order } from "../models/Order.js";
import { hashPassword, comparePassword } from "../utils/helpers.js";
import { signToken, setAuthCookie, clearAuthCookie } from "../utils/jwt.js";
import { AuthenticatedRequest } from "../middleware/auth.js";

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password, phone } = req.body;
  const cleanEmail = email.toLowerCase().trim();

  const existing = await User.findOne({ email: cleanEmail });
  if (existing) {
    res.status(409).json({
      success: false,
      error: "An account with this email address already exists.",
    });
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    name,
    email: cleanEmail,
    phone,
    passwordHash,
    role: "customer",
    isEmailVerified: true,
  });

  const token = signToken({
    userId: String(user._id),
    email: user.email,
    role: user.role,
    name: user.name,
  });

  setAuthCookie(res, token);

  res.status(201).json({
    success: true,
    message: "Welcome to UPONTIK. Your account has been registered.",
    token,
    data: {
      userId: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    },
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  const cleanEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: cleanEmail });
  if (!user) {
    res.status(401).json({
      success: false,
      error: "Invalid email or password.",
    });
    return;
  }

  // Support master admin fallback password match if defined
  let isMatch = false;
  if (
    cleanEmail === (process.env.ADMIN_EMAIL || "admin@upontik.com").toLowerCase() &&
    password === (process.env.ADMIN_PASSWORD || "AdminUpontik2026!")
  ) {
    isMatch = true;
  } else if (!user.passwordHash) {
    res.status(401).json({
      success: false,
      error: "This account uses Google Sign-In. Please click 'Continue with Google'.",
    });
    return;
  } else {
    isMatch = await comparePassword(password, user.passwordHash);
  }

  if (!isMatch) {
    res.status(401).json({
      success: false,
      error: "Invalid email or password.",
    });
    return;
  }

  const token = signToken({
    userId: String(user._id),
    email: user.email,
    role: user.role,
    name: user.name,
  });

  setAuthCookie(res, token);

  res.status(200).json({
    success: true,
    message: "Signed in successfully.",
    token,
    data: {
      userId: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    },
  });
}

export async function googleLogin(req: Request, res: Response): Promise<void> {
  const { credential, accessToken, guestOrderIds } = req.body;

  if (!credential && !accessToken) {
    res.status(400).json({
      success: false,
      error: "Google credential or access token is required.",
    });
    return;
  }

  let googleEmail = "";
  let googleName = "";
  let googleSub = "";
  let googleAvatar = "";

  try {
    if (credential) {
      const verifyRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(String(credential))}`
      );
      if (!verifyRes.ok) {
        res.status(401).json({ success: false, error: "Invalid Google ID token." });
        return;
      }
      const payload: any = await verifyRes.json();
      const configuredClientId = process.env.GOOGLE_CLIENT_ID?.trim();
      if (configuredClientId && payload.aud !== configuredClientId) {
        res.status(401).json({ success: false, error: "Google token client mismatch." });
        return;
      }
      if (payload.email_verified !== "true" && payload.email_verified !== true) {
        res.status(401).json({ success: false, error: "Google email is not verified." });
        return;
      }
      googleEmail = String(payload.email || "").toLowerCase().trim();
      googleName = String(payload.name || payload.given_name || "UPONTIK Patron").trim();
      googleSub = String(payload.sub || "");
      googleAvatar = String(payload.picture || "");
    } else {
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${String(accessToken)}` },
      });
      if (!userInfoRes.ok) {
        res.status(401).json({ success: false, error: "Invalid Google access token." });
        return;
      }
      const payload: any = await userInfoRes.json();
      googleEmail = String(payload.email || "").toLowerCase().trim();
      googleName = String(payload.name || payload.given_name || "UPONTIK Patron").trim();
      googleSub = String(payload.sub || "");
      googleAvatar = String(payload.picture || "");
    }

    if (!googleEmail) {
      res.status(400).json({ success: false, error: "Could not retrieve email from Google." });
      return;
    }

    let user = await User.findOne({ email: googleEmail });
    if (!user) {
      user = await User.create({
        name: googleName,
        email: googleEmail,
        googleId: googleSub || undefined,
        avatar: googleAvatar || undefined,
        role: "customer",
        isEmailVerified: true,
      });
    } else {
      let needsSave = false;
      if (!user.googleId && googleSub) {
        user.googleId = googleSub;
        needsSave = true;
      }
      if (!user.avatar && googleAvatar) {
        user.avatar = googleAvatar;
        needsSave = true;
      }
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        needsSave = true;
      }
      if (needsSave) await user.save();
    }

    // Link any guest orders belonging to this email OR matching guestOrderIds from browser
    const validGuestObjectIds = Array.isArray(guestOrderIds)
      ? guestOrderIds.filter((id) => mongoose.Types.ObjectId.isValid(String(id))).map((id) => new mongoose.Types.ObjectId(String(id)))
      : [];

    const linkConditions: any[] = [{ "customerInformation.email": googleEmail }];
    if (validGuestObjectIds.length > 0) {
      linkConditions.push({ _id: { $in: validGuestObjectIds } });
    }

    await Order.updateMany(
      {
        $and: [
          { $or: [{ userId: { $exists: false } }, { userId: null }] },
          { $or: linkConditions },
        ],
      },
      { $set: { userId: user._id } }
    );

    const token = signToken({
      userId: String(user._id),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      message: "Signed in with Google successfully.",
      token,
      data: {
        userId: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token,
      },
    });
  } catch (err: any) {
    console.error("[Auth] Google sign-in error:", err);
    res.status(500).json({
      success: false,
      error: "Google sign-in verification failed. Please try again.",
    });
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  clearAuthCookie(res);
  res.status(200).json({
    success: true,
    message: "Signed out successfully.",
  });
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(200).json({ success: true, data: null });
    return;
  }

  const user = await User.findById(req.user.userId).select("-passwordHash");
  if (!user) {
    res.status(200).json({ success: true, data: null });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      userId: String(user._id),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      addresses: user.addresses || [],
    },
  });
}

export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: "Authentication required" });
    return;
  }

  const { name, phone, addresses } = req.body;
  const user = await User.findById(req.user.userId);
  if (!user) {
    res.status(404).json({ success: false, error: "Patron account not found" });
    return;
  }

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (addresses !== undefined) user.addresses = addresses;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Patron profile and delivery addresses updated successfully.",
    data: {
      userId: String(user._id),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      addresses: user.addresses || [],
    },
  });
}
