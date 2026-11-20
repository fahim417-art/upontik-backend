import { Router } from "express";
import { getHomepageData } from "../controllers/homepage.controller.js";

const router = Router();

router.get("/", getHomepageData);

export default router;
