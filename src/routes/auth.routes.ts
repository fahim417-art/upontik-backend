import { Router } from "express";
import { register, login, logout, getMe, updateProfile } from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { RegisterSchema, LoginSchema } from "../validators/schemas.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/register", validate(RegisterSchema), register);
router.post("/login", validate(LoginSchema), login);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);
router.patch("/profile", authenticate, updateProfile);

export default router;
