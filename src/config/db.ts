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
    console.warn(`[Database] Primary MongoDB connection failed (${primaryErr.message}).`);

    // In production, strictly require MongoDB Atlas
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Production database connection failed: ${primaryErr.message}. Ensure MONGODB_URI is correctly configured.`);
    }

    // In development mode, dynamically start in-process MongoDB engine via MongoMemoryServer
    console.log("[Database] Initializing in-process MongoDB instance for local development...");
    try {
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      console.log(`[Database] In-process MongoDB instance ready at: ${memoryUri}`);

      await mongoose.connect(memoryUri);
      isConnected = true;
      console.log("[Database] Connected to in-process MongoDB instance.");
      return mongoose;
    } catch (memErr: any) {
      console.error("[Database] Failed to start in-process MongoDB:", memErr.message);
      throw primaryErr;
    }
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
