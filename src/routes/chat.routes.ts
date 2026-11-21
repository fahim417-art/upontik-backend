import { Router } from "express";
import {
  sendCustomerMessage,
  getCustomerMessages,
  markCustomerMessagesSeen,
  getAdminConversations,
  getAdminSessionMessages,
  sendAdminReply,
} from "../controllers/chat.controller.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

// Public customer routes
router.post("/message", sendCustomerMessage);
router.get("/messages", getCustomerMessages);
router.post("/seen", markCustomerMessagesSeen);

// Protected admin support routes
router.get("/admin/conversations", authenticate, requireAdmin, getAdminConversations);
router.get("/admin/messages/:sessionId", authenticate, requireAdmin, getAdminSessionMessages);
router.post("/admin/reply", authenticate, requireAdmin, sendAdminReply);

export default router;
