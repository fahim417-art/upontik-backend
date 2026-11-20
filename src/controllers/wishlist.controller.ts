import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { Wishlist } from "../models/Wishlist.js";
import { Product } from "../models/Product.js";

export async function getWishlist(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(200).json({ success: true, data: [] });
    return;
  }

  const wishlist = await Wishlist.findOne({ userId: req.user.userId }).populate({
    path: "productIds",
    match: { status: "published" },
  });

  res.status(200).json({
    success: true,
    data: wishlist?.productIds || [],
  });
}

export async function toggleWishlist(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: "Please sign in to save pieces to your wishlist",
    });
    return;
  }

  const { productId } = req.body;
  if (!productId) {
    res.status(400).json({ success: false, error: "Product ID required" });
    return;
  }

  let wishlist = await Wishlist.findOne({ userId: req.user.userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({
      userId: req.user.userId,
      productIds: [productId],
    });
    res.status(200).json({
      success: true,
      message: "Piece saved to wishlist",
      isWishlisted: true,
      data: wishlist.productIds,
    });
    return;
  }

  const index = wishlist.productIds.findIndex((id) => String(id) === String(productId));
  let isWishlisted = false;
  if (index > -1) {
    wishlist.productIds.splice(index, 1);
  } else {
    wishlist.productIds.push(productId as any);
    isWishlisted = true;
  }

  await wishlist.save();

  res.status(200).json({
    success: true,
    message: isWishlisted ? "Piece saved to wishlist" : "Piece removed from wishlist",
    isWishlisted,
    data: wishlist.productIds,
  });
}
