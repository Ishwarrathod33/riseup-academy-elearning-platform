import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type JwtAccessPayload = {
  sub: string; // userId
  role: "ADMIN" | "STUDENT" | "TEACHER";
  tokenVersion: number;
};

export function signAccessToken(payload: JwtAccessPayload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN_SECONDS,
    audience: "riseup-access",
    issuer: "riseup-backend",
  });
}

export function signRefreshToken(payload: JwtAccessPayload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN_SECONDS,
    audience: "riseup-refresh",
    issuer: "riseup-backend",
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    audience: "riseup-access",
    issuer: "riseup-backend",
  }) as JwtAccessPayload;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    audience: "riseup-refresh",
    issuer: "riseup-backend",
  }) as JwtAccessPayload;
}

