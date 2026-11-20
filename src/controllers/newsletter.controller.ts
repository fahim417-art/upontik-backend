import { Request, Response } from "express";
import { NewsletterSubscriber } from "../models/NewsletterSubscriber.js";

export async function subscribeNewsletter(req: Request, res: Response): Promise<void> {
  try {
    const { email, source } = req.body;
    if (!email || typeof email !== "string" || !email.includes("@")) {
      res.status(400).json({
        success: false,
        error: "Please provide a valid email address.",
      });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await NewsletterSubscriber.findOne({ email: cleanEmail });

    if (existing) {
      if (existing.status === "unsubscribed") {
        existing.status = "active";
        await existing.save();
      }
      res.status(200).json({
        success: true,
        message: "You are already a valued patron of Letters from UPONTIK.",
        data: existing,
      });
      return;
    }

    const subscriber = await NewsletterSubscriber.create({
      email: cleanEmail,
      source: source || "homepage_footer",
      status: "active",
    });

    res.status(201).json({
      success: true,
      message: "Thank you for subscribing to Letters from UPONTIK.",
      data: subscriber,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Subscription failed. Please try again.",
    });
  }
}

export async function getNewsletterSubscribers(_req: Request, res: Response): Promise<void> {
  try {
    const subscribers = await NewsletterSubscriber.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({
      success: true,
      data: subscribers,
      total: subscribers.length,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve subscribers.",
    });
  }
}
