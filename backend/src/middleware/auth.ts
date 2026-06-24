import type { NextFunction, Response } from "express";
import { verifyAccessToken } from "../lib/jwt.js";
import { env } from "../config/env.js";
import type { AuthedRequest } from "../types/authedRequest.js";

export type { AuthedRequest };

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const cookieToken = req.cookies?.access_token as string | undefined;
  const header = req.headers.authorization;
  const bearerToken = header && header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : undefined;
  const token = cookieToken ?? bearerToken;
  if (!token) return res.status(401).json({ error: "Missing auth token" });

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      userId: payload.sub,
      role: payload.role,
      tokenVersion: payload.tokenVersion,
    };
    return next();
  } catch (_err) {
    // Avoid leaking JWT verification details.
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(roles: Array<"ADMIN" | "STUDENT" | "TEACHER">) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
    // env referenced to ensure env module is loaded (side effects: dotenv config).
    void env;
    return next();
  };
}

