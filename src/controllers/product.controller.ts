import { Request, Response } from "express";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { Review } from "../models/Review.js";

export async function getProducts(req: Request, res: Response): Promise<void> {
  const {
    category,
    sort,
    search,
    minPrice,
    maxPrice,
    inStock,
    featured,
    bestSeller,
    newArrival,
    page = "1",
    limit = "12",
  } = req.query;

  const query: any = { status: "published" };

  if (category) {
    const matchedCategory = await Category.findOne({ slug: String(category) });
    if (matchedCategory) {
      query.categoryId = matchedCategory._id;
    }
  }

  if (featured === "true") query.featured = true;
  if (bestSeller === "true") query.bestSeller = true;
  if (newArrival === "true") query.newArrival = true;
  if (inStock === "true") query.stock = { $gt: 0 };

  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined) query.price.$gte = parseFloat(String(minPrice));
    if (maxPrice !== undefined) query.price.$lte = parseFloat(String(maxPrice));
  }

  if (search) {
    const s = String(search).trim();
    query.$or = [
      { name: { $regex: s, $options: "i" } },
      { description: { $regex: s, $options: "i" } },
      { sku: { $regex: s, $options: "i" } },
    ];
  }

  let sortOption: any = { createdAt: -1 };
  if (sort === "price_asc") sortOption = { price: 1 };
  else if (sort === "price_desc") sortOption = { price: -1 };
  else if (sort === "bestseller") sortOption = { bestSeller: -1, createdAt: -1 };

  const pageNum = parseInt(String(page), 10) || 1;
  const limitNum = parseInt(String(limit), 10) || 12;
  const skip = (pageNum - 1) * limitNum;

  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate("categoryId", "name slug")
    .sort(sortOption)
    .skip(skip)
    .limit(limitNum)
    .lean();

  res.status(200).json({
    success: true,
    data: products,
    meta: {
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      limit: limitNum,
    },
  });
}

export async function getProductBySlug(req: Request, res: Response): Promise<void> {
  const { slug } = req.params;
  const product = await Product.findOne({ slug })
    .populate("categoryId", "name slug")
    .lean();

  if (!product) {
    res.status(404).json({
      success: false,
      error: "Product not found",
    });
    return;
  }

  // Related products
  const related = await Product.find({
    categoryId: (product.categoryId as any)?._id || product.categoryId,
    _id: { $ne: product._id },
    status: "published",
  })
    .limit(4)
    .lean();

  // Approved reviews
  const reviews = await Review.find({
    productId: product._id,
    status: "approved",
  })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    data: {
      product,
      relatedProducts: related,
      reviews,
    },
  });
}

export async function searchProducts(req: Request, res: Response): Promise<void> {
  const queryStr = String(req.query.q || "").trim();
  if (!queryStr) {
    res.status(200).json({
      success: true,
      data: { products: [], categories: [] },
    });
    return;
  }

  const products = await Product.find({
    status: "published",
    $or: [
      { name: { $regex: queryStr, $options: "i" } },
      { description: { $regex: queryStr, $options: "i" } },
      { sku: { $regex: queryStr, $options: "i" } },
    ],
  })
    .limit(8)
    .lean();

  const categories = await Category.find({
    isActive: true,
    $or: [
      { name: { $regex: queryStr, $options: "i" } },
      { description: { $regex: queryStr, $options: "i" } },
    ],
  }).lean();

  res.status(200).json({
    success: true,
    data: { products, categories },
  });
}
