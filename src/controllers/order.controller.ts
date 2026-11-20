import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { Order } from "../models/Order.js";

export async function getOrderById(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;

  const order = await Order.findOne({
    $or: [{ orderNumber: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
  }).lean();

  if (!order) {
    res.status(404).json({ success: false, error: "Order not found" });
    return;
  }

  res.status(200).json({
    success: true,
    data: order,
  });
}

export async function getCustomerOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: "Authentication required" });
    return;
  }

  const userEmail = req.user.email ? req.user.email.toLowerCase().trim() : "";
  const query: any = {
    $or: [
      { userId: req.user.userId },
      ...(userEmail ? [{ "customerInformation.email": userEmail }] : []),
    ],
  };

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    data: orders,
  });
}

export async function cancelCustomerOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;

  const order = await Order.findOne({
    $or: [{ orderNumber: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
  });

  if (!order) {
    res.status(404).json({ success: false, error: "Order not found" });
    return;
  }

  if (req.user && req.user.role !== "admin" && order.userId && String(order.userId) !== req.user.userId) {
    res.status(403).json({ success: false, error: "Unauthorized to cancel this order" });
    return;
  }

  if (order.orderStatus !== "pending") {
    res.status(400).json({
      success: false,
      error: `Cannot cancel an order in '${order.orderStatus}' status.`,
    });
    return;
  }

  order.orderStatus = "cancelled";
  order.statusHistory.push({
    status: "cancelled",
    note: "Order cancelled by customer",
    updatedAt: new Date(),
    updatedBy: req.user?.name || "Customer",
  });

  await order.save();

  res.status(200).json({
    success: true,
    message: "Order cancelled successfully",
    data: order,
  });
}
