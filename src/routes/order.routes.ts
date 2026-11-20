import { Router } from "express";
import { getOrderById, getCustomerOrders, cancelCustomerOrder } from "../controllers/order.controller.js";
import { authenticate, optionalAuthenticate } from "../middleware/auth.js";

const router = Router();

router.get("/my-orders", authenticate, getCustomerOrders);
router.get("/", authenticate, getCustomerOrders);
router.get("/track/:id", optionalAuthenticate, getOrderById);
router.get("/:id", optionalAuthenticate, getOrderById);
router.post("/:id/cancel", optionalAuthenticate, cancelCustomerOrder);

export default router;
