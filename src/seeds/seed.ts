import bcrypt from "bcryptjs";
import { connectDatabase, disconnectDatabase } from "../config/db.js";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { Coupon } from "../models/Coupon.js";
import { HomepageCMS } from "../models/HomepageCMS.js";
import { StoreSetting } from "../models/StoreSetting.js";
import {
  SEED_CATEGORIES,
  SEED_PRODUCTS,
  DEFAULT_HOMEPAGE_CMS,
  SEED_COUPONS,
} from "./seedData.js";

export async function runSeed(dropExisting = false): Promise<void> {
  console.log("[Seed] Starting MongoDB seeding...");

  if (dropExisting) {
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Coupon.deleteMany({});
    await HomepageCMS.deleteMany({});
    await StoreSetting.deleteMany({});
  }

  // 1. Categories
  const categoryCount = await Category.countDocuments();
  if (categoryCount === 0 || dropExisting) {
    console.log("[Seed] Seeding 5 primary categories...");
    for (const cat of SEED_CATEGORIES) {
      await Category.findOneAndUpdate(
        { slug: cat.slug },
        {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          image: cat.image,
          displayOrder: cat.displayOrder,
          isActive: cat.isActive,
          seoTitle: cat.seoTitle,
          seoDescription: cat.seoDescription,
        },
        { upsert: true, new: true }
      );
    }
  }

  // 2. Products
  const productCount = await Product.countDocuments();
  if (productCount === 0 || dropExisting) {
    console.log("[Seed] Seeding curated artisan products...");
    const allCategories = await Category.find().lean();
    for (const prod of SEED_PRODUCTS) {
      const cat = allCategories.find((c) => c.slug === prod.categorySlug);
      await Product.findOneAndUpdate(
        { slug: prod.slug },
        {
          name: prod.name,
          slug: prod.slug,
          sku: prod.sku,
          description: prod.description,
          shortDescription: prod.shortDescription,
          categoryId: cat?._id,
          categorySlug: prod.categorySlug,
          images: prod.images,
          price: prod.price,
          salePrice: prod.salePrice,
          currency: prod.currency || "BDT",
          stock: prod.stock,
          lowStockThreshold: prod.lowStockThreshold || 5,
          featured: prod.featured ?? false,
          bestSeller: prod.bestSeller ?? false,
          newArrival: prod.newArrival ?? false,
          status: prod.status || "published",
          dimensions: prod.dimensions,
          materials: prod.materials,
          careInstructions: prod.careInstructions,
          variants: prod.variants || [],
        },
        { upsert: true, new: true }
      );
    }
  }

  // 3. Coupons
  const couponCount = await Coupon.countDocuments();
  if (couponCount === 0 || dropExisting) {
    console.log("[Seed] Seeding promotional coupons...");
    for (const c of SEED_COUPONS) {
      await Coupon.findOneAndUpdate(
        { code: c.code },
        { ...c },
        { upsert: true, new: true }
      );
    }
  }

  // 4. Admin User
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@upontik.com").toLowerCase();
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    console.log("[Seed] Seeding master administrator...");
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || "AdminUpontik2026!", 12);
    await User.create({
      name: process.env.ADMIN_NAME || "UPONTIK Master Administrator",
      email: adminEmail,
      passwordHash,
      role: "admin",
      isEmailVerified: true,
    });
  }

  // 5. Homepage CMS
  const existingCMS = await HomepageCMS.findOne();
  if (!existingCMS || dropExisting || !existingCMS.heroSlides || existingCMS.heroSlides.length === 0) {
    console.log("[Seed] Seeding homepage editorial content...");
    if (existingCMS) {
      await HomepageCMS.deleteOne({ _id: existingCMS._id });
    }
    await HomepageCMS.create(DEFAULT_HOMEPAGE_CMS);
  }

  // 6. Store Settings
  const existingSettings = await StoreSetting.findOne();
  if (!existingSettings || dropExisting) {
    console.log("[Seed] Seeding store settings...");
    if (existingSettings && dropExisting) {
      await StoreSetting.deleteOne({ _id: existingSettings._id });
    }
    await StoreSetting.create({
      storeName: "উপন্তিক - Upontik Handicraft",
      currency: "BDT",
      freeShippingThreshold: 5000,
      standardShippingFee: 120,
      vatPercentage: 5,
      supportEmail: "ummetanzila264@gmail.com",
      supportPhone: "+880 1917-720875",
      officeAddress: "Konabari, Gazipur, Gazipur, Bangladesh, 1702",
      socialLinks: {
        facebook: "https://www.facebook.com/share/1CYhYuFu83/",
        instagram: "https://instagram.com/upontik",
      },
    });
  }

  console.log("[Seed] Seeding completed successfully!");
}

// If executed directly from CLI:
const isDirectRun = process.argv[1]?.replace(/\\/g, "/").endsWith("seed.ts") || process.argv[1]?.replace(/\\/g, "/").endsWith("seed.js");
if (isDirectRun) {
  (async () => {
    try {
      await connectDatabase();
      await runSeed(process.argv.includes("--drop"));
      await disconnectDatabase();
      process.exit(0);
    } catch (err) {
      console.error("[Seed Error]", err);
      process.exit(1);
    }
  })();
}
