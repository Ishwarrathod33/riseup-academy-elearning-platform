import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
export function signAccessToken(payload) {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
        expiresIn: env.JWT_ACCESS_EXPIRES_IN_SECONDS,
        audience: "riseup-access",
        issuer: "riseup-backend",
    });
}
export function signRefreshToken(payload) {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN_SECONDS,
        audience: "riseup-refresh",
        issuer: "riseup-backend",
    });
}
export function verifyAccessToken(token) {
    return jwt.verify(token, env.JWT_ACCESS_SECRET, {
        audience: "riseup-access",
        issuer: "riseup-backend",
    });
}
export function verifyRefreshToken(token) {
    return jwt.verify(token, env.JWT_REFRESH_SECRET, {
        audience: "riseup-refresh",
        issuer: "riseup-backend",
    });
}
