"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { resetPasswordByToken } from "@/lib/auth";
import { getErrorMessage } from "@/lib/api";
import { useToast } from "@/components/providers/toast-provider";

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm your password"),
  })
  .refine((d) => d.newPassword.length >= 8, {
    message: "Password must be at least 8 characters",
    path: ["newPassword"],
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetForm = z.infer<typeof resetPasswordSchema>;

function ResetPasswordPageInner() {
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") ?? "";
  const [success, setSuccess] = React.useState(false);

  const resetForm = useForm<ResetForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetForm) {
    if (!token) {
      toast("Missing reset token.", "error");
      return;
    }
    try {
      await resetPasswordByToken({ token, newPassword: values.newPassword });
      setSuccess(true);
      window.setTimeout(() => router.push("/login"), 900);
    } catch (err: unknown) {
      toast(getErrorMessage(err, "Failed to reset password"), "error");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Create new password</h1>
        <p className="mt-2 text-sm text-muted-foreground">Choose a password you can remember.</p>
      </div>

      <Card className="animate-fade-up border-gray-200/90 shadow-lg ring-1 ring-gray-100/80">
        <CardContent className="pt-6">
          {success ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                Password updated successfully
              </div>
              <div className="text-center text-sm text-muted-foreground">
                Redirecting to login...
              </div>
            </div>
          ) : (
            <form onSubmit={resetForm.handleSubmit(onSubmit)} className="space-y-4">
              {!token ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  Invalid or missing reset link.
                </div>
              ) : null}

              <div className="space-y-2">
                <label htmlFor="rp-new-password" className="text-sm font-medium text-gray-700">
                  New Password
                </label>
                <Input
                  id="rp-new-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Minimum 8 characters"
                  {...resetForm.register("newPassword")}
                  className="min-h-[44px]"
                />
                {resetForm.formState.errors.newPassword ? (
                  <p className="text-sm text-red-600">{resetForm.formState.errors.newPassword.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label htmlFor="rp-confirm-password" className="text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <Input
                  id="rp-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirm your password"
                  {...resetForm.register("confirmPassword")}
                  className="min-h-[44px]"
                />
                {resetForm.formState.errors.confirmPassword ? (
                  <p className="text-sm text-red-600">{resetForm.formState.errors.confirmPassword.message}</p>
                ) : null}
              </div>

              <Button type="submit" className="min-h-[44px] w-full rounded-2xl font-semibold" disabled={!token || resetForm.formState.isSubmitting}>
                {resetForm.formState.isSubmitting ? "Resetting..." : "Reset Password"}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Remembered it?{" "}
                <Link href="/login" className="font-semibold text-violet-700 underline-offset-4 hover:underline">
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <React.Suspense
      fallback={<div className="mx-auto max-w-md px-4 py-10 text-center text-sm text-muted-foreground">Loading...</div>}
    >
      <ResetPasswordPageInner />
    </React.Suspense>
  );
}

