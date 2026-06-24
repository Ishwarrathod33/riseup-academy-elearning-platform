import crypto from "crypto";
import { env } from "../config/env.js";
export function generateOtp() {
    // 6-digit numeric OTP.
    const n = Math.floor(100000 + Math.random() * 900000);
    return String(n);
}
export function sha256Hex(input) {
    return crypto.createHash("sha256").update(input).digest("hex");
}
export function normalizeIdentifier(identifier) {
    return identifier.trim().toLowerCase();
}
export function otpExpiresAt() {
    return new Date(Date.now() + env.OTP_TTL_SECONDS * 1000);
}
