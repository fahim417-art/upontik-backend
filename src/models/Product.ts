import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProductImage {
  url: string;
  alt: string;
  isMain?: boolean;
}

export interface IProductVariant {
  name: string;
  options: string[];
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription?: string;
  categoryId: mongoose.Types.ObjectId;
  categorySlug?: string;
  collectionIds?: mongoose.Types.ObjectId[];
  images: IProductImage[];
  price: number;
  salePrice?: number;
  currency: string;
  variants?: IProductVariant[];
  stock: number;
  lowStockThreshold: number;
  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
  status: "draft" | "published" | "archived";
  dimensions?: {
    length?: string;
    width?: string;
    height?: string;
  };
  materials?: string;
  careInstructions?: string;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, index: "text" },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: { type: String, required: true },
    shortDescription: { type: String },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    categorySlug: { type: String, index: true },
    collectionIds: [{ type: Schema.Types.ObjectId, ref: "Collection" }],
    images: [
      {
        url: { type: String, required: true },
        alt: { type: String, default: "" },
        isMain: { type: Boolean, default: false },
      },
    ],
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0 },
    currency: { type: String, default: "BDT" },
    variants: [
      {
        name: { type: String, required: true },
        options: [{ type: String }],
      },
    ],
    stock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    featured: { type: Boolean, default: false, index: true },
    bestSeller: { type: Boolean, default: false, index: true },
    newArrival: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
      index: true,
    },
    dimensions: {
      length: { type: String },
      width: { type: String },
      height: { type: String },
    },
    materials: { type: String },
    careInstructions: { type: String },
    seoTitle: { type: String },
    seoDescription: { type: String },
  },
  { timestamps: true }
);

ProductSchema.index({ categoryId: 1, status: 1, createdAt: -1 });
ProductSchema.index({ featured: 1, status: 1 });
ProductSchema.index({ price: 1, status: 1 });

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
