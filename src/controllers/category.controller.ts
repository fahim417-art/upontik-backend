import { Request, Response } from "express";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";

export async function getCategories(_req: Request, res: Response): Promise<void> {
  const categories = await Category.find({ isActive: true })
    .sort({ displayOrder: 1 })
    .lean();

  res.status(200).json({
    success: true,
    data: categories,
  });
}

export async function getCategoryBySlug(req: Request, res: Response): Promise<void> {
  const { slug } = req.params;
  const category = await Category.findOne({ slug }).lean();

  if (!category) {
    res.status(404).json({
      success: false,
      error: "Category not found",
    });
    return;
  }

  const products = await Product.find({
    categoryId: category._id,
    status: "published",
  })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    data: {
      category,
      products,
      totalProducts: products.length,
    },
  });
}
