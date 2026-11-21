import { Request, Response } from "express";
import { ChatMessage } from "../models/ChatMessage.js";
import { AuthenticatedRequest } from "../middleware/auth.js";

// Customer sends a message
export async function sendCustomerMessage(req: Request, res: Response): Promise<void> {
  const { sessionId, message, senderName, senderEmail, senderPhone } = req.body;

  if (!sessionId || !message || !String(message).trim()) {
    res.status(400).json({ success: false, error: "Session ID and message are required." });
    return;
  }

  const chat = await ChatMessage.create({
    sessionId: String(sessionId).trim(),
    sender: "customer",
    senderName: senderName?.trim() || "Customer",
    senderEmail: senderEmail?.trim() || undefined,
    senderPhone: senderPhone?.trim() || undefined,
    message: String(message).trim(),
    isRead: false,
  });

  res.status(201).json({ success: true, data: chat });
}

// Customer retrieves conversation messages
export async function getCustomerMessages(req: Request, res: Response): Promise<void> {
  const { sessionId } = req.query;

  if (!sessionId) {
    res.status(400).json({ success: false, error: "Session ID required." });
    return;
  }

  const messages = await ChatMessage.find({ sessionId: String(sessionId) })
    .sort({ createdAt: 1 })
    .lean();

  res.status(200).json({ success: true, data: messages });
}

// Admin: Get all conversations grouped by sessionId
export async function getAdminConversations(_req: AuthenticatedRequest, res: Response): Promise<void> {
  // Aggregate recent conversations
  const conversations = await ChatMessage.aggregate([
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$sessionId",
        lastMessage: { $first: "$message" },
        lastSender: { $first: "$sender" },
        lastUpdated: { $first: "$createdAt" },
        customerName: { $first: "$senderName" },
        customerEmail: { $first: "$senderEmail" },
        customerPhone: { $first: "$senderPhone" },
        unreadCount: {
          $sum: {
            $cond: [{ $and: [{ $eq: ["$sender", "customer"] }, { $eq: ["$isRead", false] }] }, 1, 0],
          },
        },
        totalMessages: { $sum: 1 },
      },
    },
    { $sort: { lastUpdated: -1 } },
  ]);

  res.status(200).json({ success: true, data: conversations });
}

// Admin: Get specific session messages
export async function getAdminSessionMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { sessionId } = req.params;

  const messages = await ChatMessage.find({ sessionId })
    .sort({ createdAt: 1 })
    .lean();

  // Mark all customer messages in this session as read
  await ChatMessage.updateMany({ sessionId, sender: "customer", isRead: false }, { isRead: true });

  res.status(200).json({ success: true, data: messages });
}

// Admin: Reply to customer session
export async function sendAdminReply(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { sessionId, message } = req.body;

  if (!sessionId || !message || !String(message).trim()) {
    res.status(400).json({ success: false, error: "Session ID and reply message required." });
    return;
  }

  const adminName = req.user?.name || "UPONTIK Studio Support";

  const reply = await ChatMessage.create({
    sessionId: String(sessionId).trim(),
    sender: "admin",
    senderName: adminName,
    message: String(message).trim(),
    isRead: true,
  });

  res.status(201).json({ success: true, data: reply });
}
