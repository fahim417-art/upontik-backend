import { Router } from "express";
import { processCheckout } from "../controllers/checkout.controller.js";
import { validate } from "../middleware/validate.js";
import { CheckoutSchema } from "../validators/schemas.js";
import { optionalAuthenticate } from "../middleware/auth.js";

const router = Router();

router.post("/", optionalAuthenticate, validate(CheckoutSchema), processCheckout);

export default router;
