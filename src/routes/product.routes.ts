import { Router } from "express";
import { getProducts, getProductBySlug, searchProducts } from "../controllers/product.controller.js";

const router = Router();

router.get("/search", searchProducts);
router.get("/", getProducts);
router.get("/:slug", getProductBySlug);

export default router;
