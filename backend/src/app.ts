import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import fs from "fs";
import path from "path";
import { limiter } from "./middleware/rateLimit.js";
import { router } from "./routes/index.js";
import { env } from "./config/env.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cookieParser());

  app.use((req, _res, next) => {
    // eslint-disable-next-line no-console
    console.log(req.method, req.url);
    next();
  });

  // Ensure local upload directory exists (dev v1; production should use object storage).
  const uploadDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    })
  );

  // Security: Apply rate limiting BEFORE body parsing to prevent
  // CPU/Memory exhaustion from massive payload parsing (DoS protection).
  app.use(limiter);

  // Razorpay webhooks must be verified against the raw request body.
  // This route will not use the global JSON parser.
  app.use("/api/payments/webhook", express.raw({ type: "*/*" }));

  // Skip JSON/urlencoded parsing for Razorpay webhook route (signature depends on raw body).
  app.use((req, res, next) => {
    if (req.originalUrl.startsWith("/api/payments/webhook")) return next();
    return express.json({ limit: "10mb" })(req, res, next);
  });

  app.use((req, res, next) => {
    if (req.originalUrl.startsWith("/api/payments/webhook")) return next();
    return express.urlencoded({ extended: false, limit: "10mb" })(req, res, next);
  });

  // Local dev uploads (use S3/Cloudinary for production).
  app.use("/uploads", express.static("uploads"));

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/api", router);

  const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
    // eslint-disable-next-line no-console
    console.error(err);
    if (res.headersSent) {
      next(err);
      return;
    }
    
    // Security & Dev UX: Don't leak stack traces in prod, but allow custom HTTP error statuses
    const isProd = process.env.NODE_ENV === "production";
    const status = err.status || 500;
    res.status(status).json({ 
      message: isProd && status === 500 ? "Internal Server Error" : err.message,
      ...(isProd ? {} : { stack: err.stack })
    });
  };
  app.use(errorHandler);

  return app;
}
