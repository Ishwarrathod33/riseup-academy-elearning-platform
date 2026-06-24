import nodemailer from "nodemailer";
import { env } from "../config/env.js";

export type OtpDelivery =
  | { ok: true; debug?: string }
  | { ok: false; error: string };

export async function sendEmailOtp(params: {
  toEmail: string;
  otp: string;
}) {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.SMTP_FROM) {
    // Development fallback: still allow the flow via console OTP.
    return { ok: false, error: "SMTP not configured" } satisfies OtpDelivery;
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: false,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: params.toEmail,
    subject: "Your RiseUp OTP Code",
    text: `Your OTP code is: ${params.otp}\n\nIt will expire shortly.`,
  });

  return { ok: true } satisfies OtpDelivery;
}

export async function sendEmailPasswordResetLink(params: { toEmail: string; resetLink: string }) {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.SMTP_FROM) {
    return { ok: false, error: "SMTP not configured" } satisfies OtpDelivery;
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: false,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: params.toEmail,
    subject: "Reset your RiseUp password",
    text: `We received a request to reset your RiseUp password.\n\nReset link:\n${params.resetLink}\n\nThis link expires in 30 minutes.`,
  });

  return { ok: true } satisfies OtpDelivery;
}

export async function sendPhoneOtp(params: { toPhone: string; otp: string }) {
  // For production you'd wire a real SMS provider (Twilio/Vonage/etc).
  // Here we support a "console" provider out of the box.
  if (env.SMS_PROVIDER === "console") {
    // eslint-disable-next-line no-console
    console.log(`[OTP console] to=${params.toPhone} otp=${params.otp}`);
    return { ok: true, debug: "console" } satisfies OtpDelivery;
  }

  // Optional: Twilio integration without hard dependency.
  if (env.SMS_PROVIDER === "twilio") {
    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM_NUMBER) {
      return { ok: false, error: "Twilio env vars missing" } satisfies OtpDelivery;
    }

    const twilioMod = await import("twilio").catch(() => null);
    if (!twilioMod) {
      return { ok: false, error: "Twilio package not installed" } satisfies OtpDelivery;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const twilio = (twilioMod as any).default ?? twilioMod;
    const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      from: env.TWILIO_FROM_NUMBER,
      to: params.toPhone,
      body: `Your RiseUp OTP code is: ${params.otp}`,
    });
    return { ok: true } satisfies OtpDelivery;
  }

  return { ok: false, error: "Unknown SMS provider" } satisfies OtpDelivery;
}

