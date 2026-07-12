import type { Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prismaClient.js";
import { Prisma, type User } from "@prisma/client";
import { sha256Hex, generateOtp, normalizeIdentifier, otpExpiresAt } from "../lib/otp.js";
import { sendEmailOtp, sendEmailPasswordResetLink, sendPhoneOtp } from "../lib/sendOtp.js";
import { requireAuth } from "../middleware/auth.js";
import type { AuthedRequest } from "../types/authedRequest.js";
import { asyncRoute } from "../middleware/asyncRoute.js";
import { env } from "../config/env.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import crypto from "crypto";

export const authRouter = Router();

/** Digits-only phone for storage / uniqueness (min 10 digits). */
export function normalizePhoneDigits(raw: string) {
  const d = raw.replace(/\D/g, "");
  return d.length >= 10 ? d : null;
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const isProd = process.env.NODE_ENV === "production";

  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "none",
    maxAge: env.JWT_ACCESS_EXPIRES_IN_SECONDS * 1000,
    path: "/",
  });

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "none",
    maxAge: env.JWT_REFRESH_EXPIRES_IN_SECONDS * 1000,
    path: "/api/auth",
  });
}

async function issueSession(user: Pick<User, "id" | "role" | "tokenVersion">, res: Response) {
  const payload = {
    sub: user.id,
    role: user.role,
    tokenVersion: user.tokenVersion,
  };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const refreshTokenHash = sha256Hex(refreshToken);

  await prisma.refreshToken.updateMany({
    where: { userId: user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: new Date(Date.now() + env.JWT_REFRESH_EXPIRES_IN_SECONDS * 1000),
    },
  });

  setAuthCookies(res, accessToken, refreshToken);

  return accessToken;
}

const registerSchema = z.object({
  name: z.string().min(2).max(120).trim(),
  email: z.string().email(),
  phone: z.string().min(8).max(32),
  password: z.string().min(6).max(128),
});

authRouter.post("/register", asyncRoute(async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { name, email, phone, password } = parsed.data;
    const emailNorm = normalizeIdentifier(email);
    const phoneNorm = normalizePhoneDigits(phone);
    if (!phoneNorm) return res.status(400).json({ error: "Enter a valid phone number (at least 10 digits)." });

    const [emailUser, phoneUser] = await Promise.all([
      prisma.user.findUnique({ where: { email: emailNorm } }),
      prisma.user.findFirst({ where: { phone: phoneNorm } }),
    ]);

    // Fully registered accounts (have a password) cannot be claimed again
    if (emailUser?.passwordHash) {
      return res.status(409).json({ error: "Email already registered" });
    }
    if (phoneUser?.passwordHash && emailUser?.id !== phoneUser.id) {
      return res.status(409).json({ error: "Phone number already registered" });
    }

    const passwordHash = await hashPassword(password);

    // OTP-only placeholders (no password): upgrade them instead of rejecting as "duplicate"
    if (emailUser && !emailUser.passwordHash) {
      if (phoneUser && phoneUser.id !== emailUser.id) {
        if (phoneUser.passwordHash) {
          return res.status(409).json({ error: "Phone number already registered" });
        }
        const user = await prisma.$transaction(async (tx) => {
          await tx.user.update({ where: { id: phoneUser.id }, data: { phone: null } });
          return tx.user.update({
            where: { id: emailUser.id },
            data: { name, phone: phoneNorm, passwordHash },
          });
        });
        const accessToken = await issueSession(user, res);
        return res.json({ accessToken, profileIncomplete: false });
      }
      const user = await prisma.user.update({
        where: { id: emailUser.id },
        data: { name, phone: phoneNorm, passwordHash },
      });
      const accessToken = await issueSession(user, res);
      return res.json({ accessToken, profileIncomplete: false });
    }

    if (phoneUser && !phoneUser.passwordHash && !emailUser) {
      const user = await prisma.user.update({
        where: { id: phoneUser.id },
        data: { name, email: emailNorm, passwordHash },
      });
      const accessToken = await issueSession(user, res);
      return res.json({ accessToken, profileIncomplete: false });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email: emailNorm,
        phone: phoneNorm,
        passwordHash,
        role: "STUDENT",
      },
    });

    const accessToken = await issueSession(user, res);
    return res.json({ accessToken, profileIncomplete: false });
  } catch (e: unknown) {
    // eslint-disable-next-line no-console
    console.error("[POST /api/auth/register]", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        const fields = (e.meta as { target?: string[] } | undefined)?.target?.join(", ") ?? "email or phone";
        return res.status(409).json({ error: `This ${fields} is already registered.` });
      }
    }
    const devMsg = env.NODE_ENV === "development" && e instanceof Error ? e.message : "Registration failed. Please try again.";
    return res.status(500).json({ error: devMsg });
  }
}));

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/login", asyncRoute(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const emailNorm = normalizeIdentifier(parsed.data.email);
  const user = await prisma.user.findUnique({ where: { email: emailNorm } });
  if (!user) return res.status(401).json({ error: "Invalid email or password" });
  if (!user.isActive) return res.status(403).json({ error: "Account disabled" });
  if (!user.passwordHash) {
    return res.status(401).json({
      error: "This account uses OTP login. Use “Sign in with OTP” or set a password from account settings.",
    });
  }

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid email or password" });

  const accessToken = await issueSession(user, res);
  const profileIncomplete = !(user.name && user.name.trim().length > 0);
  return res.json({ accessToken, profileIncomplete });
}));

export async function handleGetMe(req: AuthedRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  const profileIncomplete = !(user.name && user.name.trim().length > 0);
  return res.json({ user: { ...user, profileIncomplete } });
}

const otpRequestSchema = z.object({
  identifier: z.string().min(3),
  channel: z.enum(["email", "phone"]),
});

authRouter.post("/otp/request", asyncRoute(async (req, res) => {
  const body = otpRequestSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });

  const { identifier, channel } = body.data;
  const normalized = normalizeIdentifier(identifier);

  const otp = generateOtp();
  const otpHash = sha256Hex(otp);

  const maxAttempts = env.OTP_MAX_ATTEMPTS;

  if (channel === "email") {
    await prisma.user.upsert({
      where: { email: normalized },
      update: {},
      create: { role: "STUDENT", email: normalized },
    });
  } else {
    await prisma.user.upsert({
      where: { phone: normalized },
      update: {},
      create: { role: "STUDENT", phone: normalized },
    });
  }

  await prisma.otpChallenge.create({
    data: {
      identifier: normalized,
      channel,
      otpHash,
      expiresAt: otpExpiresAt(),
      attempts: 0,
      maxAttempts,
    },
  });

  const delivery =
    channel === "email"
      ? await sendEmailOtp({ toEmail: normalized, otp })
      : await sendPhoneOtp({ toPhone: normalized, otp });

  if (!delivery.ok) {
    return res.status(500).json({ error: delivery.error });
  }

  const payload: { ok: true; debug?: string } = { ok: true };
  if ("debug" in delivery && typeof delivery.debug === "string") {
    payload.debug = delivery.debug;
  }
  return res.json(payload);
}));

const otpVerifySchema = z.object({
  identifier: z.string().min(3),
  channel: z.enum(["email", "phone"]),
  otp: z.string().min(4).max(8),
});

authRouter.post("/otp/verify", asyncRoute(async (req, res) => {
  const body = otpVerifySchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });

  const { identifier, channel, otp } = body.data;
  const normalized = normalizeIdentifier(identifier);

  const challenge = await prisma.otpChallenge.findFirst({
    where: { identifier: normalized, channel },
    orderBy: { createdAt: "desc" },
  });

  if (!challenge) return res.status(400).json({ error: "OTP not found" });
  if (challenge.expiresAt.getTime() < Date.now()) return res.status(400).json({ error: "OTP expired" });
  if (challenge.attempts >= challenge.maxAttempts) return res.status(429).json({ error: "OTP attempts exceeded" });

  const otpHash = sha256Hex(otp);
  if (otpHash !== challenge.otpHash) {
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });
    return res.status(400).json({ error: "Invalid OTP" });
  }

  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: { verifiedAt: new Date() },
  });

  const userWhere =
    channel === "email" ? { email: normalized } : { phone: normalized };

  const user = await prisma.user.findUnique({ where: userWhere }).catch(() => null);
  if (!user) return res.status(500).json({ error: "User not found after OTP verification" });
  if (!user.isActive) return res.status(403).json({ error: "Account disabled" });

  const accessToken = await issueSession(user, res);

  const profileIncomplete = !(user.name && user.name.trim().length > 0);

  return res.json({ accessToken, profileIncomplete });
}));

const updateMeSchema = z.object({
  name: z.string().min(2).max(120).trim(),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  phone: z.string().min(8).max(32).optional(),
});

authRouter.get("/me", requireAuth, asyncRoute(handleGetMe));

authRouter.put("/me", requireAuth, asyncRoute(async (req, res) => {
  const parsed = updateMeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const userId = req.user!.userId;
  const { name, email, phone } = parsed.data;

  const data: { name: string; email?: string | null; phone?: string | null } = { name };

  if (email !== undefined) {
    const nextEmail = email === "" ? null : normalizeIdentifier(email);
    if (nextEmail) {
      const taken = await prisma.user.findFirst({
        where: { email: nextEmail, NOT: { id: userId } },
        select: { id: true },
      });
      if (taken) return res.status(409).json({ error: "Email already in use" });
    }
    data.email = nextEmail;
  }

  if (phone !== undefined) {
    const phoneNorm = normalizePhoneDigits(phone);
    if (!phoneNorm) return res.status(400).json({ error: "Enter a valid phone number (at least 10 digits)." });
    const taken = await prisma.user.findFirst({
      where: { phone: phoneNorm, NOT: { id: userId } },
      select: { id: true },
    });
    if (taken) return res.status(409).json({ error: "Phone number already in use" });
    data.phone = phoneNorm;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });

  const profileIncomplete = !(user.name && user.name.trim().length > 0);
  return res.json({ user: { ...user, profileIncomplete } });
}));

authRouter.post("/logout", requireAuth, asyncRoute(async (req, res) => {
  const refresh = req.cookies?.refresh_token as string | undefined;
  if (refresh) {
    try {
      const payload = verifyRefreshToken(refresh);
      const hash = sha256Hex(refresh);
      await prisma.refreshToken.updateMany({
        where: { userId: payload.sub, tokenHash: hash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      // ignore
    }
  }

  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/api/auth" });
  return res.json({ ok: true });
}));

authRouter.post("/refresh", asyncRoute(async (req, res) => {
  const refresh = req.cookies?.refresh_token as string | undefined;
  if (!refresh) return res.status(401).json({ error: "Missing refresh token" });

  let payload: { sub: string; role: string; tokenVersion: number };
  try {
    payload = verifyRefreshToken(refresh) as any;
  } catch {
    return res.status(401).json({ error: "Invalid refresh token" });
  }

  const stored = await prisma.refreshToken.findFirst({
    where: { userId: payload.sub, revokedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!stored) return res.status(401).json({ error: "Refresh token revoked" });
  if (stored.tokenHash !== sha256Hex(refresh)) return res.status(401).json({ error: "Refresh token mismatch" });
  if (stored.expiresAt.getTime() < Date.now()) return res.status(401).json({ error: "Refresh token expired" });

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.tokenVersion !== payload.tokenVersion) return res.status(401).json({ error: "Token version mismatch" });

  const nextAccessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    tokenVersion: user.tokenVersion,
  });

  const isProd = process.env.NODE_ENV === "production";
  res.cookie("access_token", nextAccessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    maxAge: env.JWT_ACCESS_EXPIRES_IN_SECONDS * 1000,
    path: "/",
  });

  return res.json({ accessToken: nextAccessToken });
}));

const forgotSchema = z.object({
  email: z.string().email(),
});

authRouter.post("/password/forgot", asyncRoute(async (req, res) => {
  const body = forgotSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });
  const email = body.data.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  // Always respond ok to prevent account enumeration.
  if (!user) return res.json({ ok: true });

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256Hex(token);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  const baseUrl = (env.FRONTEND_URL ?? env.CORS_ORIGIN).replace(/\/$/, "");
  const resetLink = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

  try {
    const delivery = await sendEmailPasswordResetLink({ toEmail: email, resetLink });
    if (!delivery.ok && env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log(`[DEV] password reset link for ${email}: ${resetLink}`);
    }
  } catch (e) {
    if (env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[WARN] Failed to send password reset email", e);
    }
  }

  return res.json({ ok: true });
}));

const resetSchema = z.object({
  email: z.string().email(),
  token: z.string().min(20),
  newPassword: z.string().min(8),
});

authRouter.post("/password/reset", asyncRoute(async (req, res) => {
  const body = resetSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });

  const { email, token, newPassword } = body.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ error: "Invalid reset request" });

  const tokenHash = sha256Hex(token);
  const reset = await prisma.passwordResetToken.findFirst({
    where: { userId: user.id, tokenHash, usedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!reset) return res.status(400).json({ error: "Invalid reset token" });
  if (reset.expiresAt.getTime() < Date.now()) return res.status(400).json({ error: "Reset token expired" });

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, tokenVersion: { increment: 1 } },
  });

  await prisma.passwordResetToken.update({
    where: { id: reset.id },
    data: { usedAt: new Date() },
  });

  return res.json({ ok: true });
}));

const resetByTokenSchema = z.object({
  token: z.string().min(20),
  newPassword: z.string().min(8),
});

authRouter.post("/password/reset-by-token", asyncRoute(async (req, res) => {
  const body = resetByTokenSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });

  const { token, newPassword } = body.data;
  const tokenHash = sha256Hex(token);

  const reset = await prisma.passwordResetToken.findFirst({
    where: { tokenHash, usedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!reset) return res.status(400).json({ error: "Invalid reset token" });
  if (reset.expiresAt.getTime() < Date.now()) return res.status(400).json({ error: "Reset token expired" });

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: reset.userId },
    data: { passwordHash, tokenVersion: { increment: 1 } },
  });

  await prisma.passwordResetToken.update({
    where: { id: reset.id },
    data: { usedAt: new Date() },
  });

  return res.json({ ok: true });
}));

