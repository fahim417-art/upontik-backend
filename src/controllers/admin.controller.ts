import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { Order } from "../models/Order.js";
import { User } from "../models/User.js";
import { Coupon } from "../models/Coupon.js";
import { HomepageCMS } from "../models/HomepageCMS.js";
import { StoreSetting } from "../models/StoreSetting.js";
import { Review } from "../models/Review.js";
import { slugify } from "../utils/helpers.js";

// 1. Dashboard Metrics
export async function getDashboardMetrics(_req: Request, res: Response): Promise<void> {
  const orders = await Order.find().sort({ createdAt: -1 }).lean();
  const products = await Product.find().lean();
  const categories = await Category.find().lean();
  const customers = await User.find({ role: "customer" }).lean();

  let totalRevenue = 0;
  let pendingOrders = 0;
  let deliveredOrders = 0;
  let processingOrders = 0;

  orders.forEach((o) => {
    if (o.orderStatus !== "cancelled") {
      totalRevenue += o.total || 0;
    }
    if (o.orderStatus === "pending") pendingOrders++;
    if (o.orderStatus === "delivered") deliveredOrders++;
    if (o.orderStatus === "processing") processingOrders++;
  });

  const lowStockProducts = products.filter(
    (p) => p.stock <= (p.lowStockThreshold || 5)
  );

  res.status(200).json({
    success: true,
    data: {
      totalRevenue,
      totalOrders: orders.length,
      pendingOrders,
      deliveredOrders,
      processingOrders,
      totalCustomers: customers.length,
      totalProducts: products.length,
      totalCategories: categories.length,
      lowStockCount: lowStockProducts.length,
      lowStockProducts: lowStockProducts.slice(0, 5),
      recentOrders: orders.slice(0, 8),
    },
  });
}

// 2. Product Management
export async function getAllProductsAdmin(_req: Request, res: Response): Promise<void> {
  const products = await Product.find()
    .populate("categoryId", "name slug")
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({ success: true, data: products });
}

export async function createProductAdmin(req: Request, res: Response): Promise<void> {
  const data = req.body;
  const slug = data.slug || slugify(data.name);

  const product = await Product.create({
    ...data,
    slug,
  });

  res.status(201).json({
    success: true,
    message: "Artisan product created successfully.",
    data: product,
  });
}

export async function updateProductAdmin(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const updated = await Product.findByIdAndUpdate(id, req.body, { new: true });

  if (!updated) {
    res.status(404).json({ success: false, error: "Product not found" });
    return;
  }

  res.status(200).json({
    success: true,
    message: "Product updated successfully.",
    data: updated,
  });
}

export async function deleteProductAdmin(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const deleted = await Product.findByIdAndDelete(id);

  if (!deleted) {
    res.status(404).json({ success: false, error: "Product not found" });
    return;
  }

  res.status(200).json({
    success: true,
    message: "Product removed from catalog.",
  });
}

// 3. Category Management
export async function getAllCategoriesAdmin(_req: Request, res: Response): Promise<void> {
  const categories = await Category.find().sort({ displayOrder: 1 }).lean();
  res.status(200).json({ success: true, data: categories });
}

export async function createCategoryAdmin(req: Request, res: Response): Promise<void> {
  const data = req.body;
  const slug = data.slug || slugify(data.name);

  const category = await Category.create({
    ...data,
    slug,
  });

  res.status(201).json({
    success: true,
    message: "Category established.",
    data: category,
  });
}

export async function updateCategoryAdmin(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const updated = await Category.findByIdAndUpdate(id, req.body, { new: true });

  if (!updated) {
    res.status(404).json({ success: false, error: "Category not found" });
    return;
  }

  res.status(200).json({
    success: true,
    message: "Category updated.",
    data: updated,
  });
}

// 4. Order Management
export async function getAllOrdersAdmin(req: Request, res: Response): Promise<void> {
  const { status } = req.query;
  const filter: any = {};
  if (status && status !== "all") {
    filter.orderStatus = status;
  }

  const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();
  res.status(200).json({ success: true, data: orders });
}

export async function updateOrderStatusAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { status, note, courierName, trackingNumber, trackingUrl, estimatedDelivery } = req.body;

  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
  const order = await Order.findOne({
    $or: [
      { orderNumber: id },
      ...(isObjectId ? [{ _id: id }] : []),
    ],
  });

  if (!order) {
    res.status(404).json({ success: false, error: "Order not found" });
    return;
  }

  if (status) {
    order.orderStatus = status;
  }
  if (courierName !== undefined) {
    order.courierName = courierName;
  }
  if (trackingNumber !== undefined) {
    order.trackingNumber = trackingNumber;
  }
  if (trackingUrl !== undefined) {
    order.trackingUrl = trackingUrl;
  }
  if (estimatedDelivery !== undefined) {
    order.estimatedDelivery = estimatedDelivery;
  }

  const effectiveStatus = status || order.orderStatus;
  const historyNote =
    note ||
    (trackingNumber
      ? `Dispatched with ${courierName || "Courier"} (Tracking: ${trackingNumber})`
      : `Status updated to ${effectiveStatus}`);

  order.statusHistory.push({
    status: effectiveStatus,
    note: historyNote,
    updatedAt: new Date(),
    updatedBy: req.user?.name || "Admin Studio",
  });

  await order.save();

  res.status(200).json({
    success: true,
    message: `Order status advanced to ${order.orderStatus}`,
    data: order,
  });
}

// 5. Homepage CMS
export async function getHomepageCMSAdmin(_req: Request, res: Response): Promise<void> {
  let cms: any = await HomepageCMS.findOne().lean();
  if (!cms) {
    cms = await HomepageCMS.create({});
  }
  res.status(200).json({ success: true, data: cms });
}

export async function updateHomepageCMSAdmin(req: Request, res: Response): Promise<void> {
  let cms = await HomepageCMS.findOne();
  if (!cms) {
    cms = await HomepageCMS.create(req.body);
  } else {
    Object.assign(cms, req.body);
    await cms.save();
  }

  res.status(200).json({
    success: true,
    message: "Homepage CMS updated live.",
    data: cms,
  });
}

// 6. Customers Directory
export async function getAllCustomersAdmin(_req: Request, res: Response): Promise<void> {
  const customers = await User.find({ role: "customer" })
    .select("-passwordHash")
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({ success: true, data: customers });
}

// 7. Coupons Management
export async function getAllCouponsAdmin(_req: Request, res: Response): Promise<void> {
  const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
  res.status(200).json({ success: true, data: coupons });
}

export async function createCouponAdmin(req: Request, res: Response): Promise<void> {
  const coupon = await Coupon.create(req.body);
  res.status(201).json({
    success: true,
    message: "Promotional coupon created.",
    data: coupon,
  });
}

// 8. Store Settings
export async function updateStoreSettingsAdmin(req: Request, res: Response): Promise<void> {
  let settings = await StoreSetting.findOne();
  if (!settings) {
    settings = await StoreSetting.create(req.body);
  } else {
    Object.assign(settings, req.body);
    await settings.save();
  }

  res.status(200).json({
    success: true,
    message: "Store settings saved.",
    data: settings,
  });
}
