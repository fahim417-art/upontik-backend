import { Request, Response } from "express";
import { HomepageCMS } from "../models/HomepageCMS.js";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { DEFAULT_HOMEPAGE_CMS } from "../seeds/seedData.js";

export async function getHomepageData(_req: Request, res: Response): Promise<void> {
  let cms: any = await HomepageCMS.findOne().lean();
  if (!cms || !cms.heroSlides || cms.heroSlides.length === 0) {
    if (cms) {
      await HomepageCMS.deleteOne({ _id: cms._id });
    }
    cms = (await HomepageCMS.create(DEFAULT_HOMEPAGE_CMS)).toObject();
  }

  const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1 }).lean();
  const featuredProducts = await Product.find({ featured: true, status: "published" }).limit(8).lean();
  const newArrivals = await Product.find({ newArrival: true, status: "published" }).limit(8).lean();

  res.status(200).json({
    success: true,
    data: {
      cms,
      categories,
      featuredProducts,
      newArrivals,
    },
  });
}
