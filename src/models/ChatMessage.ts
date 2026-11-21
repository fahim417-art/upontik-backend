import mongoose, { Schema, Document, Model } from "mongoose";

export interface IChatMessage extends Document {
  sessionId: string;
  sender: "customer" | "admin";
  senderName: string;
  senderEmail?: string;
  senderPhone?: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    sessionId: { type: String, required: true, index: true },
    sender: { type: String, enum: ["customer", "admin"], required: true },
    senderName: { type: String, default: "Visitor" },
    senderEmail: { type: String, trim: true },
    senderPhone: { type: String, trim: true },
    message: { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const ChatMessage: Model<IChatMessage> =
  mongoose.models.ChatMessage || mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);
