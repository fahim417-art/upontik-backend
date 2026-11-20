import { Request, Response, NextFunction } from "express";
import { verifyToken, AUTH_COOKIE_NAME, TokenPayload } from "../utils/jwt.js";

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
  const headerToken = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : undefined;

  const token = cookieToken || headerToken;

  if (!token) {
    res.status(401).json({
      success: false,
      error: "Authentication required to access this resource",
    });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({
      success: false,
      error: "Invalid or expired session. Please sign in again.",
    });
    return;
  }

  req.user = payload;
  next();
}

export function optionalAuthenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
  const headerToken = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : undefined;

  const token = cookieToken || headerToken;
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: "Authentication required for administrative console",
    });
    return;
  }

  if (req.user.role !== "admin") {
    res.status(403).json({
      success: false,
      error: "Forbidden: Administrative privileges required",
    });
    return;
  }

  next();
}
