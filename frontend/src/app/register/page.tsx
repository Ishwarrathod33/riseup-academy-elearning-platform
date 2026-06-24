"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { registerAccount } from "@/lib/auth";
import { STORAGE_KEYS } from "@/lib/constants";
import { getErrorMessage } from "@/lib/api";
import { useToast } from "@/components/providers/toast-provider";

const registerFormSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(120),
    email: z.string().min(1, "Email is required").email("Enter a valid email"),
    phone: z
      .string()
      .min(1, "Phone is required")
      .min(8, "Enter a valid phone number")
      .max(32),
    password: z.string().min(6, "Password must be at least 6 characters").max(128),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerFormSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    // Registration should never auto-login; ensure any previous session is cleared.
    // (Backend may issue tokens/cookies, but we must not keep an existing access token around.)
    try {
      localStorage.removeItem(STORAGE_KEYS.accessToken);
      localStorage.removeItem(STORAGE_KEYS.profileIdentifier);
      localStorage.removeItem(STORAGE_KEYS.profileChannel);
      localStorage.removeItem(STORAGE_KEYS.profileJoinedAt);
    } catch {
      // ignore (e.g. storage blocked)
    }
  }, []);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Sync browser autofill into form state (autofill doesn't fire onChange)
  const syncAutofill = React.useCallback(() => {
    const form = formRef.current;
    if (!form) return;
    const fields: (keyof RegisterForm)[] = ["name", "email", "phone", "password", "confirmPassword"];
    fields.forEach((field) => {
      const el = form.querySelector(`[name="${field}"]`) as HTMLInputElement | null;
      if (el?.value) setValue(field, el.value, { shouldValidate: true });
    });
  }, [setValue]);

  React.useEffect(() => {
    const t1 = setTimeout(syncAutofill, 100);
    const t2 = setTimeout(syncAutofill, 400);
    const t3 = setTimeout(syncAutofill, 800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [syncAutofill]);

  // Re-sync on first user interaction (some browsers autofill on focus)
  React.useEffect(() => {
    const handler = () => {
      syncAutofill();
      window.removeEventListener("focus", handler);
      window.removeEventListener("click", handler);
    };
    window.addEventListener("focus", handler, true);
    window.addEventListener("click", handler, true);
    return () => {
      window.removeEventListener("focus", handler, true);
      window.removeEventListener("click", handler, true);
    };
  }, [syncAutofill]);

  async function onSubmit(data: RegisterForm) {
    setFormError(null);
    setBusy(true);
    try {
      const { name, email, phone, password } = data;
      await registerAccount({ name, email, phone, password });
      // Do not store JWT — user must log in explicitly
      try {
        localStorage.removeItem(STORAGE_KEYS.accessToken);
      } catch {
        // ignore
      }
      setSuccess(true);
      toast("✅ Account created successfully! Please login to continue.", "success");
      window.setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, "Registration failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-lg px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900">Create your account</h1>
        <p className="mt-2 text-sm text-muted-foreground">Join RiseUp Academy and start learning today.</p>
      </div>

      <Card className="border-gray-200/90 shadow-lg ring-1 ring-gray-100/80">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">Register</CardTitle>
          <CardDescription>Email is your username. You&apos;ll sign in with email and password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                Full name <span className="text-red-500">*</span>
              </label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="name"
                    name="name"
                    autoComplete="name"
                    placeholder="Your full name"
                    className="min-h-[44px]"
                  />
                )}
              />
              {errors.name ? <p className="text-sm text-red-600">{errors.name.message}</p> : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="min-h-[44px]"
                  />
                )}
              />
              {errors.email ? <p className="text-sm text-red-600">{errors.email.message}</p> : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Phone number <span className="text-red-500">*</span>
              </label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+91 98765 43210"
                    className="min-h-[44px]"
                  />
                )}
              />
              <p className="text-xs text-muted-foreground">At least 10 digits (spaces ok).</p>
              {errors.phone ? <p className="text-sm text-red-600">{errors.phone.message}</p> : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Min. 6 characters"
                    className="min-h-[44px]"
                  />
                )}
              />
              {errors.password ? <p className="text-sm text-red-600">{errors.password.message}</p> : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirm password <span className="text-red-500">*</span>
              </label>
              <Controller
                name="confirmPassword"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Repeat password"
                    className="min-h-[44px]"
                  />
                )}
              />
              {errors.confirmPassword ? <p className="text-sm text-red-600">{errors.confirmPassword.message}</p> : null}
            </div>

            {success ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
                ✅ Account created successfully! Redirecting to login…
              </div>
            ) : null}
            {formError ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</div> : null}

            <Button type="submit" className="min-h-[44px] w-full rounded-2xl font-semibold" disabled={busy || success}>
              {busy ? "Creating account…" : "Create account"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-violet-700 underline-offset-4 hover:underline">
                Login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
