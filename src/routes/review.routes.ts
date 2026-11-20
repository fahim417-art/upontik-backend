import { Router } from "express";
import { createReview } from "../controllers/review.controller.js";
import { optionalAuthenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { ReviewSchema } from "../validators/schemas.js";

const router = Router();

router.post("/", optionalAuthenticate, validate(ReviewSchema), createReview);

export default router;
