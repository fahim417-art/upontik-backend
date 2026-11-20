import { Router, Request, Response } from "express";
import authRoutes from "./auth.routes.js";
import categoryRoutes from "./category.routes.js";
import productRoutes from "./product.routes.js";
import wishlistRoutes from "./wishlist.routes.js";
import checkoutRoutes from "./checkout.routes.js";
import orderRoutes from "./order.routes.js";
import couponRoutes from "./coupon.routes.js";
import homepageRoutes from "./homepage.routes.js";
import settingsRoutes from "./settings.routes.js";
import reviewRoutes from "./review.routes.js";
import adminRoutes from "./admin.routes.js";
import newsletterRoutes from "./newsletter.routes.js";
import { authenticate } from "../middleware/auth.js";
import { getCustomerOrders } from "../controllers/order.controller.js";
import { updateProfile } from "../controllers/auth.controller.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/checkout", checkoutRoutes);
router.use("/orders", orderRoutes);
router.use("/coupons", couponRoutes);
router.use("/homepage", homepageRoutes);
router.use("/newsletter", newsletterRoutes);
router.use("/store-settings", settingsRoutes);
router.use("/reviews", reviewRoutes);
router.use("/admin", adminRoutes);

// Direct account routes for customer dashboard
router.get("/account/orders", authenticate, getCustomerOrders);
router.patch("/account/profile", authenticate, updateProfile);

// Health check endpoint
router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

export default router;
