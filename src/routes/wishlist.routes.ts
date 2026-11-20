import { Router } from "express";
import { getWishlist, toggleWishlist } from "../controllers/wishlist.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate, getWishlist);
router.post("/", authenticate, toggleWishlist);

export default router;
