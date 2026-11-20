import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

const allowedOrigins = [
  frontendUrl,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://upontik.com",
  "https://www.upontik.com",
];

// Security & Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        process.env.NODE_ENV !== "production"
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Fallback allow for convenience
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Mount REST API
app.use("/api", routes);

// Welcome / Health root endpoint
app.get("/", (_req, res) => {
  res.status(200).json({
    name: "UPONTIK REST API",
    status: "online",
    version: "1.0.0",
    docs: "/api/health",
  });
});

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: "API endpoint not found",
  });
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
