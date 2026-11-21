import { Response } from "express";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { Product } from "../models/Product.js";
import { Coupon } from "../models/Coupon.js";
import { Order } from "../models/Order.js";
import { StoreSetting } from "../models/StoreSetting.js";
import { User } from "../models/User.js";
import { generateOrderNumber, hashPassword, comparePassword } from "../utils/helpers.js";
import { signToken, setAuthCookie } from "../utils/jwt.js";

export async function processCheckout(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      customerInformation,
      shippingAddress,
      paymentMethod = "cod",
      couponCode,
      orderNotes,
      items,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: "Your bag is empty." });
      return;
    }

    const settings = await StoreSetting.findOne();

    // 1. Authoritative verification of all line items directly from MongoDB
    const validatedItems: any[] = [];
    let subtotal = 0;

    for (const item of items) {
      let product = null;
      if (mongoose.Types.ObjectId.isValid(item.productId)) {
        product = await Product.findById(item.productId);
      }
      if (!product) {
        product = await Product.findOne({
          $or: [{ slug: item.productId }, { sku: item.productId }],
        });
      }

      if (!product || product.status !== "published") {
        res.status(404).json({
          success: false,
          error: `A requested product is no longer available in the catalogue.`,
        });
        return;
      }

      // Strict stock verification
      if (product.stock < item.quantity) {
        res.status(400).json({
          success: false,
          error: `Insufficient stock for "${product.name}". Only ${product.stock} available.`,
        });
        return;
      }

      // Authoritative pricing from DB - client price is never trusted
      const unitPrice = product.salePrice && product.salePrice > 0 ? product.salePrice : product.price;
      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;

      const mainImage = product.images.find((img) => img.isMain)?.url || product.images[0]?.url || "";

      validatedItems.push({
        productId: product._id,
        productName: product.name,
        productSlug: product.slug,
        productImage: mainImage,
        sku: product.sku,
        price: unitPrice,
        quantity: item.quantity,
        selectedVariant: item.selectedVariant || "Standard",
        itemTotal,
      });
    }

    // 2. Authoritative Coupon Verification
    let discount = 0;
    let verifiedCouponCode: string | undefined = undefined;

    if (couponCode && String(couponCode).trim()) {
      const cleanCode = String(couponCode).toUpperCase().trim();
      const coupon = await Coupon.findOne({ code: cleanCode, isActive: true });
      if (coupon && (!coupon.expiryDate || new Date(coupon.expiryDate) >= new Date())) {
        if (!coupon.minOrderValue || subtotal >= coupon.minOrderValue) {
          if (coupon.discountType === "percentage") {
            discount = Math.round((subtotal * coupon.discountValue) / 100);
            if (coupon.maxDiscount && discount > coupon.maxDiscount) {
              discount = coupon.maxDiscount;
            }
          } else {
            discount = coupon.discountValue;
          }
          verifiedCouponCode = coupon.code;
        }
      }
    }

    // 3. Authoritative Delivery Calculation based on District
    const isInsideDhaka =
      shippingAddress?.district?.toLowerCase().includes("dhaka") ||
      shippingAddress?.city?.toLowerCase().includes("dhaka");

    const freeThreshold = settings?.freeShippingThreshold || 5000;
    let deliveryCharge =
      subtotal >= freeThreshold
        ? 0
        : isInsideDhaka
        ? settings?.defaultDeliveryChargeInsideDhaka || 80
        : settings?.defaultDeliveryChargeOutsideDhaka || 130;

    const total = Math.max(0, subtotal - discount + deliveryCharge);
    const orderNumber = generateOrderNumber();

    // 4. Atomic stock decrement in MongoDB
    for (const item of validatedItems) {
      if (mongoose.Types.ObjectId.isValid(item.productId)) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.quantity },
        });
      } else {
        await Product.findOneAndUpdate(
          { $or: [{ slug: item.productSlug }, { sku: item.sku }] },
          { $inc: { stock: -item.quantity } }
        );
      }
    }

    // 5. Enforce Customer ID & User Account
    let resolvedUserId = req.user?.userId;
    let tokenForNewUser: string | undefined = undefined;

    if (!resolvedUserId) {
      const cleanEmail = customerInformation?.email?.toLowerCase().trim();
      const existingUser = cleanEmail ? await User.findOne({ email: cleanEmail }) : null;

      if (existingUser) {
        if (req.body.accountPassword) {
          const isMatch = await comparePassword(req.body.accountPassword, existingUser.passwordHash);
          if (!isMatch) {
            res.status(401).json({
              success: false,
              error: "এই ইমেইলে পূর্বের একটি একাউন্ট রয়েছে। সঠিক পাসওয়ার্ড দিন অথবা সাইন ইন করুন।",
              code: "INVALID_CREDENTIALS",
            });
            return;
          }
          resolvedUserId = String(existingUser._id);
          tokenForNewUser = signToken({
            userId: String(existingUser._id),
            email: existingUser.email,
            role: existingUser.role,
            name: existingUser.name,
          });
          setAuthCookie(res, tokenForNewUser);
        } else {
          res.status(401).json({
            success: false,
            error: "অর্ডার কনফার্ম করার জন্য কাস্টমার আইডি প্রয়োজন। অনুগ্রহ করে একাউন্ট তৈরি করুন অথবা সাইন-ইন করুন।",
            code: "CUSTOMER_ACCOUNT_REQUIRED",
          });
          return;
        }
      } else if (req.body.accountPassword) {
        // Auto-create brand new Customer ID
        if (String(req.body.accountPassword).length < 6) {
          res.status(400).json({
            success: false,
            error: "কাস্টমার আইডির পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।",
          });
          return;
        }

        const passwordHash = await hashPassword(req.body.accountPassword);
        const newUser = await User.create({
          name: customerInformation.fullName,
          email: cleanEmail,
          phone: customerInformation.phone,
          passwordHash,
          role: "customer",
          isEmailVerified: true,
          addresses: [
            {
              fullName: customerInformation.fullName,
              phone: customerInformation.phone,
              address: shippingAddress.address,
              city: shippingAddress.city,
              district: shippingAddress.district,
              postalCode: shippingAddress.postalCode,
              isDefault: true,
            },
          ],
        });

        resolvedUserId = String(newUser._id);
        tokenForNewUser = signToken({
          userId: String(newUser._id),
          email: newUser.email,
          role: newUser.role,
          name: newUser.name,
        });
        setAuthCookie(res, tokenForNewUser);
      } else {
        res.status(401).json({
          success: false,
          error: "অর্ডার করার পূর্বে অনুগ্রহ করে কাস্টমার আইডি তৈরি করুন অথবা লগইন করুন।",
          code: "CUSTOMER_ACCOUNT_REQUIRED",
        });
        return;
      }
    }

    // Create Order in MongoDB
    const order = await Order.create({
      orderNumber,
      userId: resolvedUserId,
      customerInformation,
      shippingAddress,
      items: validatedItems,
      subtotal,
      discount,
      deliveryCharge,
      total,
      couponCode: verifiedCouponCode,
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
      orderStatus: "pending",
      orderNotes,
      statusHistory: [
        {
          status: "pending",
          note: "Order placed by customer via studio checkout",
          updatedAt: new Date(),
          updatedBy: req.user?.name || customerInformation?.fullName || "Customer",
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Your order has been recorded successfully.",
      data: {
        orderId: String(order._id),
        orderNumber: order.orderNumber,
        total: order.total,
        subtotal: order.subtotal,
        deliveryCharge: order.deliveryCharge,
        items: order.items,
        orderStatus: order.orderStatus,
        customerId: resolvedUserId,
        token: tokenForNewUser,
      },
    });
  } catch (error: any) {
    console.error("[Checkout] Error processing checkout:", error);
    res.status(500).json({
      success: false,
      error: error?.message || "An unexpected error occurred during checkout.",
    });
  }
}
