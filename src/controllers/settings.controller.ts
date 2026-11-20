import { Request, Response } from "express";
import { StoreSetting } from "../models/StoreSetting.js";

export async function getStoreSettings(_req: Request, res: Response): Promise<void> {
  let settings: any = await StoreSetting.findOne().lean();
  if (!settings) {
    settings = await StoreSetting.create({});
  }

  res.status(200).json({
    success: true,
    data: settings,
  });
}
