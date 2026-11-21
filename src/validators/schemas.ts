import { z } from "zod";

export const RegisterSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const CheckoutSchema = z.object({
  customerInformation: z.object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().min(10, "Valid phone number is required (min 10 digits)"),
  }),
  shippingAddress: z.object({
    address: z.string().min(5, "Delivery address is required"),
    city: z.string().min(2, "City is required"),
    district: z.string().min(2, "District is required"),
    postalCode: z.string().optional(),
  }),
  paymentMethod: z.enum(["cod", "bkash", "nagad", "sslcommerz"]).default("cod"),
  couponCode: z.string().optional(),
  orderNotes: z.string().optional(),
  accountPassword: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product ID required"),
        quantity: z.number().int().min(1, "Quantity must be at least 1"),
        selectedVariant: z.string().optional(),
      })
    )
    .min(1, "Order must contain at least one piece"),
});

export const ProductSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  slug: z.string().optional(),
  sku: z.string().min(2, "SKU is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  shortDescription: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  images: z
    .array(
      z.object({
        url: z.string().url("Valid image URL required"),
        alt: z.string().default(""),
        isMain: z.boolean().default(false),
      })
    )
    .min(1, "At least one image is required"),
  price: z.number().min(0, "Price must be non-negative"),
  salePrice: z.number().min(0).optional(),
  currency: z.string().default("BDT"),
  stock: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  featured: z.boolean().default(false),
  bestSeller: z.boolean().default(false),
  newArrival: z.boolean().default(false),
  status: z.enum(["draft", "published", "archived"]).default("published"),
  dimensions: z
    .object({
      length: z.string().optional(),
      width: z.string().optional(),
      height: z.string().optional(),
    })
    .optional(),
  materials: z.string().optional(),
  careInstructions: z.string().optional(),
});

export const CategorySchema = z.object({
  name: z.string().min(2, "Category name is required"),
  slug: z.string().optional(),
  description: z.string().min(5, "Description is required"),
  image: z.string().url("Valid cover image URL is required"),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const CouponSchema = z.object({
  code: z.string().min(2, "Coupon code is required").transform((c) => c.toUpperCase()),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().min(1, "Discount value must be at least 1"),
  minOrderValue: z.number().min(0).default(0),
  maxDiscount: z.number().min(0).optional(),
  expiryDate: z.string().or(z.date()),
  usageLimit: z.number().int().optional(),
  isActive: z.boolean().default(true),
});

export const ReviewSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  customerName: z.string().min(2, "Your name is required"),
  rating: z.number().int().min(1).max(5, "Rating must be between 1 and 5"),
  title: z.string().min(2, "Review title is required"),
  comment: z.string().min(5, "Review comment must be at least 5 characters"),
});
