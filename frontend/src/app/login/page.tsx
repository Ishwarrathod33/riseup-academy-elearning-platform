"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { loginWithPassword, requestOtp, verifyOtp } from "@/lib/auth";
import { ApiError, getErrorMessage } from "@/lib/api";
import { STORAGE_KEYS } from "@/lib/constants";
import { useAuth } from "@/features/auth";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

type LoginForm = z.infer<typeof loginSchema>;

function persistSessionAfterAuth(resp: { accessToken: string; profileIncomplete: boolean }, extras?: { identifier?: string; channel?: "email" | "phone" }) {
  localStorage.setItem(STORAGE_KEYS.accessToken, resp.accessToken);
  if (extras?.identifier !== undefined) {
    localStorage.setItem(STORAGE_KEYS.profileIdentifier, extras.identifier.trim());
  }
  if (extras?.channel) {
    localStorage.setItem(STORAGE_KEYS.profileChannel, extras.channel);
  }
  if (!localStorage.getItem(STORAGE_KEYS.profileJoinedAt)) {
    localStorage.setItem(STORAGE_KEYS.profileJoinedAt, new Date().toISOString());
  }
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSessionFromStorage } = useAuth();
  const [mode, setMode] = React.useState<"password" | "otp">("password");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const [pwBusy, setPwBusy] = React.useState(false);
  const [pwError, setPwError] = React.useState<string | null>(null);

  async function onPasswordLogin(data: LoginForm) {
    setPwError(null);
    setPwBusy(true);
    try {
      const resp = await loginWithPassword({ email: data.email.trim(), password: data.password });
      persistSessionAfterAuth(resp);
      await setSessionFromStorage();

      const redirect = searchParams.get("redirect");
      if (redirect) {
        router.push(redirect);
        return;
      }

      if (resp.profileIncomplete) {
        router.push("/complete-profile");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        setPwError("Invalid email or password");
      } else {
        setPwError(getErrorMessage(err, "Login failed"));
      }
    } finally {
      setPwBusy(false);
    }
  }

  // OTP state
  const [channel, setChannel] = React.useState<"email" | "phone">("email");
  const [identifier, setIdentifier] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [phase, setPhase] = React.useState<"request" | "verify">("request");
  const [debugOtp, setDebugOtp] = React.useState<string | null>(null);
  const [otpBusy, setOtpBusy] = React.useState(false);
  const [otpError, setOtpError] = React.useState<string | null>(null);

  async function onRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setOtpError(null);
    setOtpBusy(true);
    try {
      const resp = await requestOtp({ identifier, channel });
      setDebugOtp(resp.debug ?? null);
      setPhase("verify");
    } catch (err: unknown) {
      setOtpError(getErrorMessage(err, "Failed to request OTP"));
    } finally {
      setOtpBusy(false);
    }
  }

  async function onVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setOtpError(null);
    setOtpBusy(true);
    try {
      const resp = await verifyOtp({ identifier, channel, otp });
      persistSessionAfterAuth(resp, { identifier, channel });
      await setSessionFromStorage();

      const redirect = searchParams.get("redirect");
      if (redirect) {
        router.push(redirect);
        return;
      }

      if (resp.profileIncomplete) {
        router.push("/complete-profile");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      setOtpError(getErrorMessage(err, "Invalid OTP"));
    } finally {
      setOtpBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in with email & password, or use OTP.</p>
      </div>

      <div className="mx-auto max-w-2xl">
        <Card className="animate-fade-up border-gray-200/90 shadow-lg ring-1 ring-gray-100/80">
          <CardHeader className="space-y-3">
            <div className="flex gap-2 rounded-2xl border border-gray-100 bg-slate-50/80 p-1">
              <button
                type="button"
                className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  mode === "password" ? "bg-white text-violet-900 shadow-sm ring-1 ring-violet-200/80" : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => setMode("password")}
              >
                Email & password
              </button>
              <button
                type="button"
                className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  mode === "otp" ? "bg-white text-violet-900 shadow-sm ring-1 ring-violet-200/80" : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => setMode("otp")}
              >
                Sign in with OTP
              </button>
            </div>
            <div>
              <CardTitle className="text-xl">{mode === "password" ? "Login" : phase === "request" ? "Request OTP" : "Verify OTP"}</CardTitle>
              <CardDescription className="mt-1">
                {mode === "password"
                  ? "Use the email and password you registered with."
                  : `We will send a one-time code to your ${channel}.`}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {mode === "password" ? (
              <form onSubmit={handleSubmit(onPasswordLogin)} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    {...register("email")}
                    className="min-h-[44px]"
                  />
                  {errors.email ? <p className="text-sm text-red-600">{errors.email.message}</p> : null}
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...register("password")}
                    className="min-h-[44px]"
                  />
                  {errors.password ? <p className="text-sm text-red-600">{errors.password.message}</p> : null}
                </div>
                {pwError ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{pwError}</div> : null}
                <Button type="submit" className="min-h-[44px] w-full rounded-2xl font-semibold" disabled={pwBusy}>
                  {pwBusy ? "Signing in…" : "Login"}
                </Button>
                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-sm font-semibold text-violet-700 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  New here?{" "}
                  <Link href="/register" className="font-semibold text-violet-700 underline-offset-4 hover:underline">
                    Create an account
                  </Link>
                </p>
              </form>
            ) : (
              <form onSubmit={phase === "request" ? onRequestOtp : onVerifyOtp} className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={channel === "email" ? "default" : "outline"}
                    className="flex-1 rounded-xl"
                    onClick={() => {
                      setChannel("email");
                      setPhase("request");
                      setDebugOtp(null);
                      setOtp("");
                    }}
                    disabled={otpBusy}
                  >
                    Email
                  </Button>
                  <Button
                    type="button"
                    variant={channel === "phone" ? "default" : "outline"}
                    className="flex-1 rounded-xl"
                    onClick={() => {
                      setChannel("phone");
                      setPhase("request");
                      setDebugOtp(null);
                      setOtp("");
                    }}
                    disabled={otpBusy}
                  >
                    Phone
                  </Button>
                </div>

                {phase === "request" ? (
                  <>
                    <div>
                      <Input
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder={channel === "email" ? "you@example.com" : "+91 9xxxxxxxxx"}
                        required
                        className="min-h-[44px]"
                      />
                    </div>
                    {debugOtp ? (
                      <div className="rounded-xl border bg-secondary/50 p-3 text-sm">
                        <span className="font-semibold">Dev OTP:</span> {debugOtp}
                      </div>
                    ) : null}
                    {otpError ? <div className="text-sm text-red-600">{otpError}</div> : null}
                    <Button type="submit" className="min-h-[44px] w-full rounded-2xl font-semibold" disabled={otpBusy || !identifier.trim()}>
                      {otpBusy ? "Sending..." : "Send OTP"}
                    </Button>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="mb-2 text-sm text-muted-foreground">
                        Code sent to <span className="font-medium">{identifier}</span>
                      </div>
                      <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP" required className="min-h-[44px]" />
                    </div>
                    {otpError ? <div className="text-sm text-red-600">{otpError}</div> : null}
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" className="min-h-[44px] flex-1 rounded-xl" disabled={otpBusy} onClick={() => setPhase("request")}>
                        Resend
                      </Button>
                      <Button type="submit" className="min-h-[44px] flex-1 rounded-2xl font-semibold" disabled={otpBusy || otp.trim().length < 4}>
                        {otpBusy ? "Verifying..." : "Verify & login"}
                      </Button>
                    </div>
                  </>
                )}
                <p className="text-center text-sm text-muted-foreground">
                  Prefer password?{" "}
                  <button type="button" className="font-semibold text-violet-700 underline-offset-4 hover:underline" onClick={() => setMode("password")}>
                    Use email & password
                  </button>
                </p>
              </form>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={<div className="mx-auto max-w-5xl px-4 py-10 text-center text-sm text-muted-foreground">Loading...</div>}
    >
      <LoginPageInner />
    </React.Suspense>
  );
}
