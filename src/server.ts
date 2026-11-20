import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import { runSeed } from "./seeds/seed.js";

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    console.log("[Server] Connecting to MongoDB...");
    await connectDatabase();

    // Auto-seed initial baseline data if database is fresh
    try {
      await runSeed(false);
    } catch (seedErr) {
      console.warn("[Server] Auto-seed warning:", seedErr);
    }

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`===============================================`);
      console.log(`  UPONTIK REST API Server running on port ${PORT}`);
      console.log(`  Health Check: http://localhost:${PORT}/api/health`);
      console.log(`  Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`===============================================`);
    });

    const shutdown = async () => {
      console.log("\n[Server] Shutting down gracefully...");
      server.close(() => {
        console.log("[Server] Closed HTTP server.");
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("[Server] Fatal error on startup:", error);
    process.exit(1);
  }
}

startServer();
