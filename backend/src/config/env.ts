import { z } from "zod";
import dotenv from "dotenv";

function parseEnv() {
  dotenv.config();

  const schema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(8080),

    CORS_ORIGIN: z.string().default("http://localhost:3000"),
    FRONTEND_URL: z.string().optional(),

    DATABASE_URL: z.string().min(1),

    JWT_ACCESS_SECRET: z.string().min(20),
    JWT_REFRESH_SECRET: z.string().min(20),
    JWT_ACCESS_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().default(15 * 60),
    JWT_REFRESH_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().default(7 * 24 * 60 * 60),

    OTP_TTL_SECONDS: z.coerce.number().int().positive().default(10 * 60),
    OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),

    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().optional(),

    // SMS provider is optional (for dev you can enable console OTP).
    SMS_PROVIDER: z.enum(["twilio", "console"]).default("console"),
    TWILIO_ACCOUNT_SID: z.string().optional(),
    TWILIO_AUTH_TOKEN: z.string().optional(),
    TWILIO_FROM_NUMBER: z.string().optional(),

    // Razorpay (optional — payments/create returns a dummy payload when unset)
    RAZORPAY_KEY_ID: z.string().optional(),
    RAZORPAY_KEY_SECRET: z.string().optional(),
    RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
    RAZORPAY_CURRENCY: z.string().default("INR"),
  });

  return schema.parse(process.env);
}

export const env = parseEnv();

