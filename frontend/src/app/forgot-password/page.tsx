"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { forgotPassword } from "@/lib/auth";
import { getErrorMessage } from "@/lib/api";
import { useToast } from "@/components/providers/toast-provider";

const requestSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

type RequestForm = z.infer<typeof requestSchema>;

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [emailSent, setEmailSent] = React.useState(false);

  const requestForm = useForm<RequestForm>({
    resolver: zodResolver(requestSchema),
    defaultValues: { email: "" },
  });

  async function onRequest(values: RequestForm) {
    try {
      await forgotPassword({ email: values.email.trim() });
      setEmailSent(true);
    } catch (err: unknown) {
      toast(getErrorMessage(err, "Failed to start password reset"), "error");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Forgot your password?</h1>
        <p className="mt-2 text-sm text-muted-foreground">Enter your email and we&apos;ll send a reset link.</p>
      </div>

      <Card className="animate-fade-up border-gray-200/90 shadow-lg ring-1 ring-gray-100/80">
        <CardContent className="pt-6">
          {emailSent ? (
            <div className="space-y-5">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                We have sent a password reset link to your email.
              </div>
              <div className="flex justify-center">
                <Link
                  href="/login"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-violet-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-800 active:scale-[0.98]"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={requestForm.handleSubmit(onRequest)} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="fp-email" className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  id="fp-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...requestForm.register("email")}
                  className="min-h-[44px]"
                />
                {requestForm.formState.errors.email ? (
                  <p className="text-sm text-red-600">{requestForm.formState.errors.email.message}</p>
                ) : null}
              </div>

              <Button type="submit" className="min-h-[44px] w-full rounded-2xl font-semibold" disabled={requestForm.formState.isSubmitting}>
                {requestForm.formState.isSubmitting ? "Sending..." : "Send Reset Link"}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Remembered your password?{" "}
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

