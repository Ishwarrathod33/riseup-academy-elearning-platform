import { apiFetch } from "./api";
import { STORAGE_KEYS } from "./constants";

export type RegisterInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthUser = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role?: string;
  createdAt: string;
  profileIncomplete?: boolean;
};

export async function registerAccount(input: RegisterInput) {
  return apiFetch<{ accessToken: string; profileIncomplete: boolean }>("/api/auth/register", {
    method: "POST",
    json: input,
    auth: false,
  });
}

export async function loginWithPassword(input: LoginInput) {
  return apiFetch<{ accessToken: string; profileIncomplete: boolean }>("/api/auth/login", {
    method: "POST",
    json: input,
    auth: false,
  });
}

export async function forgotPassword(input: { email: string }) {
  return apiFetch<{ ok: true }>("/api/auth/password/forgot", {
    method: "POST",
    json: input,
    auth: false,
  });
}

export async function resetPassword(input: { email: string; token: string; newPassword: string }) {
  return apiFetch<{ ok: true }>("/api/auth/password/reset", {
    method: "POST",
    json: input,
    auth: false,
  });
}

export async function resetPasswordByToken(input: { token: string; newPassword: string }) {
  return apiFetch<{ ok: true }>("/api/auth/password/reset-by-token", {
    method: "POST",
    json: input,
    auth: false,
  });
}

/** Current user — uses `GET /api/me` (alias of `/api/auth/me`). */
export async function getMe() {
  return apiFetch<{ user: AuthUser }>("/api/me");
}

export type OtpChannel = "email" | "phone";

export async function requestOtp(params: { identifier: string; channel: OtpChannel }) {
  return apiFetch<{ ok: true; debug?: string | undefined }>("/api/auth/otp/request", {
    method: "POST",
    json: params,
  });
}

export async function verifyOtp(params: { identifier: string; channel: OtpChannel; otp: string }) {
  return apiFetch<{ accessToken: string; profileIncomplete: boolean }>("/api/auth/otp/verify", {
    method: "POST",
    json: params,
    auth: false,
  });
}

export async function updateProfile(params: { name: string; email?: string; phone?: string }) {
  return apiFetch<{ user: AuthUser }>("/api/auth/me", {
    method: "PUT",
    json: params,
  });
}

export async function refreshAccessToken() {
  return apiFetch<{ accessToken: string }>("/api/auth/refresh", {
    method: "POST",
    auth: false,
    json: {},
  });
}

export async function logout() {
  try {
    await apiFetch<{ ok: true }>("/api/auth/logout", { method: "POST" });
  } finally {
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEYS.accessToken);
  }
}

