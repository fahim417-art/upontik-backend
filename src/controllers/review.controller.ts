import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { Review } from "../models/Review.js";

export async function createReview(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { productId, customerName, rating, title, comment } = req.body;

  const review = await Review.create({
    productId,
    userId: req.user?.userId || undefined,
    customerName,
    rating,
    title,
    comment,
    isVerifiedPurchase: true,
    status: "approved",
  });

  res.status(201).json({
    success: true,
    message: "Thank you. Your review has been recorded.",
    data: review,
  });
}
