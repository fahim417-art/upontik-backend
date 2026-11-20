import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

let isConnected = false;

export async function connectDatabase(): Promise<typeof mongoose> {
  if (isConnected) {
    return mongoose;
  }

  let primaryUri = process.env.MONGODB_URI || "mongodb://localhost:27017/upontik";
  // Ensure database name is included if ending with trailing slash
  if (primaryUri.endsWith(".mongodb.net/")) {
    primaryUri = `${primaryUri}upontik?retryWrites=true&w=majority`;
  }

  console.log(`[Database] Attempting connection to MongoDB: ${primaryUri.includes("@") ? "MongoDB Atlas" : primaryUri}`);

  try {
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    });
    isConnected = true;
    console.log("[Database] Successfully connected to MongoDB.");
    return mongoose;
  } catch (primaryErr: any) {
    console.error(`[Database] MongoDB connection failed: ${primaryErr.message}`);
    throw new Error(`Database connection failed: ${primaryErr.message}. Ensure MONGODB_URI is correctly configured.`);
  }
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function disconnectDatabase(): Promise<void> {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
  }
}
