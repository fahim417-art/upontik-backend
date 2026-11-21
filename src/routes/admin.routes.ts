import { Router } from "express";
import {
  getDashboardMetrics,
  getAllProductsAdmin,
  createProductAdmin,
  updateProductAdmin,
  deleteProductAdmin,
  getAllCategoriesAdmin,
  createCategoryAdmin,
  updateCategoryAdmin,
  getAllOrdersAdmin,
  updateOrderStatusAdmin,
  getHomepageCMSAdmin,
  updateHomepageCMSAdmin,
  getAllCustomersAdmin,
  getAllCouponsAdmin,
  createCouponAdmin,
  deleteCouponAdmin,
  updateStoreSettingsAdmin,
} from "../controllers/admin.controller.js";
import { getNewsletterSubscribers } from "../controllers/newsletter.controller.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { ProductSchema, CategorySchema, CouponSchema } from "../validators/schemas.js";

const router = Router();

// Protect all admin routes
router.use(authenticate, requireAdmin);

// Dashboard
router.get("/metrics", getDashboardMetrics);
router.get("/dashboard", getDashboardMetrics);

// Products
router.get("/products", getAllProductsAdmin);
router.post("/products", validate(ProductSchema), createProductAdmin);
router.put("/products/:id", updateProductAdmin);
router.patch("/products/:id", updateProductAdmin);
router.delete("/products/:id", deleteProductAdmin);

// Categories
router.get("/categories", getAllCategoriesAdmin);
router.post("/categories", validate(CategorySchema), createCategoryAdmin);
router.put("/categories/:id", updateCategoryAdmin);
router.patch("/categories/:id", updateCategoryAdmin);

// Orders
router.get("/orders", getAllOrdersAdmin);
router.patch("/orders/:id", updateOrderStatusAdmin);
router.patch("/orders/:id/status", updateOrderStatusAdmin);
router.put("/orders/:id", updateOrderStatusAdmin);

// Homepage CMS
router.get("/homepage-cms", getHomepageCMSAdmin);
router.put("/homepage-cms", updateHomepageCMSAdmin);
router.get("/homepage", getHomepageCMSAdmin);
router.put("/homepage", updateHomepageCMSAdmin);

// Customers
router.get("/customers", getAllCustomersAdmin);

// Coupons
router.get("/coupons", getAllCouponsAdmin);
router.post("/coupons", validate(CouponSchema), createCouponAdmin);
router.delete("/coupons/:id", deleteCouponAdmin);

// Store Settings
router.put("/settings", updateStoreSettingsAdmin);
router.patch("/settings", updateStoreSettingsAdmin);

// Newsletter Subscribers
router.get("/newsletter/subscribers", getNewsletterSubscribers);

export default router;
