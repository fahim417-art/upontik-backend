import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICartItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  selectedVariant?: string;
}

export interface ICart extends Document {
  userId?: mongoose.Types.ObjectId;
  guestToken?: string;
  items: ICartItem[];
  couponCode?: string;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    selectedVariant: { type: String },
  },
  { _id: false }
);

const CartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    guestToken: { type: String, index: true },
    items: [CartItemSchema],
    couponCode: { type: String },
  },
  { timestamps: true }
);

export const Cart: Model<ICart> =
  mongoose.models.Cart || mongoose.model<ICart>("Cart", CartSchema);
