import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStoreSetting extends Document {
  storeName: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  officeAddress: string;
  currency: string;
  currencySymbol: string;
  defaultDeliveryChargeInsideDhaka: number;
  defaultDeliveryChargeOutsideDhaka: number;
  freeShippingThreshold: number;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    pinterest?: string;
  };
  policies: {
    shippingPolicy?: string;
    returnPolicy?: string;
  };
  updatedAt: Date;
}

const StoreSettingSchema = new Schema<IStoreSetting>(
  {
    storeName: { type: String, default: "উপন্তিক - Upontik Handicraft" },
    tagline: {
      type: String,
      default: "Tradition, Woven Into Modern Living.",
    },
    supportEmail: { type: String, default: "ummetanzila264@gmail.com" },
    supportPhone: { type: String, default: "+880 1917-720875" },
    officeAddress: {
      type: String,
      default: "Konabari, Gazipur, Gazipur, Bangladesh, 1702",
    },
    currency: { type: String, default: "BDT" },
    currencySymbol: { type: String, default: "৳" },
    defaultDeliveryChargeInsideDhaka: { type: Number, default: 80 },
    defaultDeliveryChargeOutsideDhaka: { type: Number, default: 130 },
    freeShippingThreshold: { type: Number, default: 5000 },
    socialLinks: {
      instagram: { type: String, default: "https://instagram.com/upontik" },
      facebook: { type: String, default: "https://www.facebook.com/share/1CYhYuFu83/" },
      pinterest: { type: String, default: "https://pinterest.com/upontik" },
    },
    policies: {
      shippingPolicy: {
        type: String,
        default:
          "Standard delivery inside Dhaka arrives in 48-72 hours. Regional couriers across Bangladesh complete in 3-5 business days.",
      },
      returnPolicy: {
        type: String,
        default:
          "Handcrafted pieces in unworn condition with tags may be exchanged within 7 days.",
      },
    },
  },
  { timestamps: true }
);

export const StoreSetting: Model<IStoreSetting> =
  mongoose.models.StoreSetting ||
  mongoose.model<IStoreSetting>("StoreSetting", StoreSettingSchema);
