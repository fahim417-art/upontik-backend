import { Router } from "express";
import { validateCoupon } from "../controllers/coupon.controller.js";
import { getActivePublicCoupons } from "../controllers/admin.controller.js";

const router = Router();

router.post("/validate", validateCoupon);
router.get("/active", getActivePublicCoupons);

export default router;
