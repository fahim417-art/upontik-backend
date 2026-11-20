import { Router } from "express";
import { getStoreSettings } from "../controllers/settings.controller.js";

const router = Router();

router.get("/", getStoreSettings);

export default router;
