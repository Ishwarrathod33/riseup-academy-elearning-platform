"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api";
import { getMe, updateProfile } from "@/lib/auth";
import { STORAGE_KEYS } from "@/lib/constants";

export default function CompleteProfilePage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!token) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    getMe()
      .then((d) => {
        if (cancelled) return;
        if (d.user.name?.trim()) {
          router.replace("/dashboard");
          return;
        }
        setName("");
        setEmail(d.user.email?.trim() ?? "");
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        router.replace("/login");
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Please enter your full name (at least 2 characters).");
      return;
    }
    setBusy(true);
    try {
      const emailVal = email.trim();
      await updateProfile({
        name: trimmed,
        ...(emailVal ? { email: emailVal } : {}),
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Could not save profile."));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="h-48 animate-pulse rounded-2xl bg-violet-100/50" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Card className="border-violet-200/80 shadow-sm ring-1 ring-violet-100/60">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Complete your profile</CardTitle>
          <CardDescription>
            Add your name so we can personalize your dashboard. Email is optional if you already use phone login.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-gray-700">
                Full name <span className="text-red-600">*</span>
              </label>
              <Input
                id="fullName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ishwar Rathod"
                required
                minLength={2}
                autoComplete="name"
                className="h-11"
              />
            </div>
            <div>
              <label htmlFor="emailOpt" className="mb-1.5 block text-sm font-medium text-gray-700">
                Email <span className="text-gray-400">(optional)</span>
              </label>
              <Input
                id="emailOpt"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="h-11"
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => router.push("/courses")}>
                Browse courses
              </Button>
              <Button type="submit" className="rounded-xl bg-violet-700 hover:bg-violet-800" disabled={busy}>
                {busy ? "Saving…" : "Save & continue"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Your name is required to unlock the full dashboard. You can browse courses anytime; the dashboard asks for your name first.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
