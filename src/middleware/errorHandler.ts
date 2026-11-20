import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("[Error Handler]", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "An unexpected internal server error occurred.";

  res.status(statusCode).json({
    success: false,
    error: message,
    code: err.code || "INTERNAL_SERVER_ERROR",
    ...(process.env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
  });
}
