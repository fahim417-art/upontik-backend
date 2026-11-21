import { Request, Response } from "express";
import { Coupon } from "../models/Coupon.js";

export async function validateCoupon(req: Request, res: Response): Promise<void> {
  const { code, subtotal } = req.body;

  if (!code) {
    res.status(400).json({ success: false, error: "Coupon code required" });
    return;
  }

  const cleanCode = String(code).toUpperCase().trim();
  const coupon = await Coupon.findOne({ code: cleanCode, isActive: true });

  if (!coupon) {
    res.status(404).json({ success: false, error: "Invalid or inactive coupon code" });
    return;
  }

  const now = new Date();
  if (coupon.startDate && new Date(coupon.startDate) > now) {
    res.status(400).json({ success: false, error: "This coupon is not yet active" });
    return;
  }

  if (coupon.expiryDate && new Date(coupon.expiryDate) < now) {
    res.status(400).json({ success: false, error: "This coupon code has expired" });
    return;
  }

  const parsedSubtotal = Number(subtotal) || 0;
  if (coupon.minOrderValue && parsedSubtotal < coupon.minOrderValue) {
    res.status(400).json({
      success: false,
      error: `Minimum order amount of ৳${coupon.minOrderValue.toLocaleString()} required for this coupon`,
    });
    return;
  }

  let discountAmount = 0;
  if (coupon.discountType === "percentage") {
    discountAmount = Math.round((parsedSubtotal * coupon.discountValue) / 100);
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount;
    }
  } else {
    discountAmount = coupon.discountValue;
  }

  res.status(200).json({
    success: true,
    data: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
    },
    message: `Coupon "${coupon.code}" applied! You saved ৳${discountAmount.toLocaleString()}`,
  });
}
