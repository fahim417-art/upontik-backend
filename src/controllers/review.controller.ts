import { Request, Response } from "express";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { Review } from "../models/Review.js";
import { Order } from "../models/Order.js";

export async function createReview(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { productId, orderId, customerName, rating, title, comment, images } = req.body;

  const review = await Review.create({
    productId,
    orderId: orderId && mongoose.Types.ObjectId.isValid(orderId) ? orderId : undefined,
    userId: req.user?.userId || undefined,
    customerName: customerName || req.user?.name || "UPONTIK Patron",
    rating,
    title: title?.trim() || "Verified Patron Review",
    comment,
    images: Array.isArray(images) ? images.slice(0, 5) : [],
    isVerifiedPurchase: true,
    status: "approved",
  });

  res.status(201).json({
    success: true,
    message: "Thank you. Your review has been recorded.",
    data: review,
  });
}

export async function getPendingReviews(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user?.userId) {
    res.status(200).json({ success: true, data: [] });
    return;
  }

  const userId = req.user.userId;
  const deliveredOrders = await Order.find({
    userId,
    orderStatus: "delivered",
  })
    .sort({ updatedAt: -1 })
    .lean();

  if (deliveredOrders.length === 0) {
    res.status(200).json({ success: true, data: [] });
    return;
  }

  const existingReviews = await Review.find({ userId })
    .select("orderId productId")
    .lean();

  const reviewedKeys = new Set(
    existingReviews.map((r: any) =>
      r.orderId ? `${String(r.orderId)}_${String(r.productId)}` : String(r.productId)
    )
  );

  const pendingItems: any[] = [];
  for (const order of deliveredOrders) {
    for (const item of order.items || []) {
      const orderProductKey = `${String(order._id)}_${String(item.productId)}`;
      const productOnlyKey = String(item.productId);
      if (!reviewedKeys.has(orderProductKey) && !reviewedKeys.has(productOnlyKey)) {
        pendingItems.push({
          orderId: String(order._id),
          orderNumber: order.orderNumber,
          deliveredAt: order.updatedAt,
          productId: String(item.productId),
          productName: item.productName,
          productSlug: item.productSlug,
          productImage: item.productImage,
        });
      }
    }
  }

  res.status(200).json({ success: true, data: pendingItems });
}

export async function getPublicReviews(_req: Request, res: Response): Promise<void> {
  const reviews = await Review.find({ status: "approved" })
    .sort({ createdAt: -1 })
    .limit(12)
    .populate("productId", "name slug images")
    .lean();

  res.status(200).json({ success: true, data: reviews });
}
