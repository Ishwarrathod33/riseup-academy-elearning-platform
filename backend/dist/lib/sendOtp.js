import nodemailer from "nodemailer";
import { env } from "../config/env.js";
export async function sendEmailOtp(params) {
    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.SMTP_FROM) {
        // Development fallback: still allow the flow via console OTP.
        return { ok: false, error: "SMTP not configured" };
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
    return { ok: true };
}
export async function sendEmailPasswordResetLink(params) {
    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.SMTP_FROM) {
        return { ok: false, error: "SMTP not configured" };
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
    return { ok: true };
}
export async function sendPhoneOtp(params) {
    // For production you'd wire a real SMS provider (Twilio/Vonage/etc).
    // Here we support a "console" provider out of the box.
    if (env.SMS_PROVIDER === "console") {
        // eslint-disable-next-line no-console
        console.log(`[OTP console] to=${params.toPhone} otp=${params.otp}`);
        return { ok: true, debug: "console" };
    }
    // Optional: Twilio integration without hard dependency.
    if (env.SMS_PROVIDER === "twilio") {
        if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM_NUMBER) {
            return { ok: false, error: "Twilio env vars missing" };
        }
        const twilioMod = await import("twilio").catch(() => null);
        if (!twilioMod) {
            return { ok: false, error: "Twilio package not installed" };
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const twilio = twilioMod.default ?? twilioMod;
        const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
            from: env.TWILIO_FROM_NUMBER,
            to: params.toPhone,
            body: `Your RiseUp OTP code is: ${params.otp}`,
        });
        return { ok: true };
    }
    return { ok: false, error: "Unknown SMS provider" };
}
