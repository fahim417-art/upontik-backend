import { Router } from "express";
import { createReview, getPendingReviews, getPublicReviews } from "../controllers/review.controller.js";
import { authenticate, optionalAuthenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { ReviewSchema } from "../validators/schemas.js";

const router = Router();

router.get("/public", getPublicReviews);
router.get("/pending", authenticate, getPendingReviews);
router.post("/", optionalAuthenticate, validate(ReviewSchema), createReview);

export default router;
