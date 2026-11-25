import { Request, Response } from "express";
import mongoose from "mongoose";
import { ChatMessage } from "../models/ChatMessage.js";
import { User } from "../models/User.js";
import { Order } from "../models/Order.js";
import { AuthenticatedRequest } from "../middleware/auth.js";

// Customer sends a message
export async function sendCustomerMessage(req: Request, res: Response): Promise<void> {
  const { sessionId, customerId, message, senderName, senderEmail, senderPhone } = req.body;

  if (!sessionId || !message || !String(message).trim()) {
    res.status(400).json({ success: false, error: "Session ID and message are required." });
    return;
  }

  const chat = await ChatMessage.create({
    sessionId: String(sessionId).trim(),
    customerId: customerId ? String(customerId).trim() : undefined,
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

// Customer marks admin replies as seen
export async function markCustomerMessagesSeen(req: Request, res: Response): Promise<void> {
  const { sessionId } = req.body;

  if (!sessionId) {
    res.status(400).json({ success: false, error: "Session ID required." });
    return;
  }

  const now = new Date();
  await ChatMessage.updateMany(
    { sessionId: String(sessionId), sender: "admin", isRead: false },
    { isRead: true, readAt: now }
  );

  res.status(200).json({ success: true, seenAt: now });
}

// Admin: Get all conversations grouped by sessionId
export async function getAdminConversations(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const conversations = await ChatMessage.aggregate([
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$sessionId",
        customerId: { $first: "$customerId" },
        lastMessage: { $first: "$message" },
        lastSender: { $first: "$sender" },
        lastUpdated: { $first: "$createdAt" },
        customerNames: {
          $push: {
            $cond: [{ $eq: ["$sender", "customer"] }, "$senderName", "$$REMOVE"],
          },
        },
        customerEmails: {
          $push: {
            $cond: [{ $eq: ["$sender", "customer"] }, "$senderEmail", "$$REMOVE"],
          },
        },
        customerPhones: {
          $push: {
            $cond: [{ $eq: ["$sender", "customer"] }, "$senderPhone", "$$REMOVE"],
          },
        },
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

  // Enrich conversations with real User record & order count so admin name never overwrites customer name
  const validUserIds = conversations
    .map((c) => c.customerId || (String(c._id).startsWith("cust_") ? String(c._id).replace("cust_", "") : ""))
    .filter((id) => mongoose.Types.ObjectId.isValid(id));

  const users = validUserIds.length
    ? await User.find({ _id: { $in: validUserIds } })
        .select("name email phone")
        .lean()
    : [];
  const userMap = new Map(users.map((u: any) => [String(u._id), u]));

  const orderCounts = validUserIds.length
    ? await Order.aggregate([
        { $match: { userId: { $in: validUserIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
        { $group: { _id: "$userId", count: { $sum: 1 } } },
      ])
    : [];
  const orderCountMap = new Map(orderCounts.map((o: any) => [String(o._id), o.count]));

  const enriched = conversations.map((c: any) => {
    const resolvedCustomerId =
      c.customerId || (String(c._id).startsWith("cust_") ? String(c._id).replace("cust_", "") : "");
    const userDoc: any = userMap.get(resolvedCustomerId);
    const firstValidCustName = (c.customerNames || []).find(
      (n: string) => n && n !== "Customer" && n !== "Visitor"
    );

    return {
      _id: c._id,
      customerId: resolvedCustomerId || undefined,
      lastMessage: c.lastMessage,
      lastSender: c.lastSender,
      lastUpdated: c.lastUpdated,
      customerName: userDoc?.name || firstValidCustName || (c.customerNames && c.customerNames[0]) || "Patron",
      customerEmail: userDoc?.email || (c.customerEmails && c.customerEmails[0]) || "",
      customerPhone: userDoc?.phone || (c.customerPhones && c.customerPhones[0]) || "",
      orderCount: orderCountMap.get(resolvedCustomerId) || 0,
      unreadCount: c.unreadCount,
      totalMessages: c.totalMessages,
    };
  });

  res.status(200).json({ success: true, data: enriched });
}

// Admin: Delete an entire conversation thread
export async function deleteAdminConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { sessionId } = req.params;
  if (!sessionId) {
    res.status(400).json({ success: false, error: "Session ID is required." });
    return;
  }

  const result = await ChatMessage.deleteMany({ sessionId });
  res.status(200).json({
    success: true,
    message: `Conversation deleted (${result.deletedCount} messages removed).`,
  });
}

// Admin: Get specific session messages
export async function getAdminSessionMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { sessionId } = req.params;

  const messages = await ChatMessage.find({ sessionId })
    .sort({ createdAt: 1 })
    .lean();

  // Mark all customer messages in this session as read by admin
  await ChatMessage.updateMany({ sessionId, sender: "customer", isRead: false }, { isRead: true, readAt: new Date() });

  res.status(200).json({ success: true, data: messages });
}

// Admin: Reply to customer session
export async function sendAdminReply(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { sessionId, customerId, message } = req.body;

  if (!sessionId || !message || !String(message).trim()) {
    res.status(400).json({ success: false, error: "Session ID and reply message required." });
    return;
  }

  const adminName = req.user?.name || "UPONTIK Studio Support";

  const reply = await ChatMessage.create({
    sessionId: String(sessionId).trim(),
    customerId: customerId ? String(customerId).trim() : undefined,
    sender: "admin",
    senderName: adminName,
    message: String(message).trim(),
    isRead: false, // Customer has not seen it yet!
  });

  res.status(201).json({ success: true, data: reply });
}
