import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReview extends Document {
  productId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  customerName: string;
  rating: number;
  title?: string;
  comment: string;
  images: string[];
  isVerifiedPurchase: boolean;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    customerName: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: "Verified Patron Review", trim: true },
    comment: { type: String, required: true },
    images: { type: [String], default: [] },
    isVerifiedPurchase: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
      index: true,
    },
  },
  { timestamps: true }
);

export const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);
