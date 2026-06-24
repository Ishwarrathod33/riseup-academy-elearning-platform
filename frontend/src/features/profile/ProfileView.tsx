"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, Pencil, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RequireAuth, useAuth } from "@/features/auth";
import { getMe, updateProfile } from "@/lib/auth";
import { getErrorMessage } from "@/lib/api";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  phone: z
    .string()
    .min(1, "Phone is required")
    .min(8, "Enter a valid phone number")
    .max(32),
});

type ProfileForm = z.infer<typeof profileSchema>;

function ProfileReadOnly({ form, createdAt }: { form: UseFormReturn<ProfileForm>; createdAt: string | null }) {
  const name = useWatch({ control: form.control, name: "name" });
  const email = useWatch({ control: form.control, name: "email" });
  const phone = useWatch({ control: form.control, name: "phone" });
  const joined =
    createdAt != null
      ? new Date(createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
      : "—";

  return (
    <dl className="space-y-5">
      <div className="rounded-2xl border border-gray-100 bg-slate-50/80 px-4 py-3">
        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Full name</dt>
        <dd className="mt-1 text-base font-semibold text-gray-900">{name?.trim() || "—"}</dd>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-slate-50/80 px-4 py-3">
        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Email</dt>
        <dd className="mt-1 text-base font-medium text-gray-900">{email?.trim() || "—"}</dd>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-slate-50/80 px-4 py-3">
        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Phone</dt>
        <dd className="mt-1 text-base font-medium text-gray-900">{phone?.trim() || "—"}</dd>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-slate-50/80 px-4 py-3">
        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Member since</dt>
        <dd className="mt-1 text-base font-medium text-gray-900">{joined}</dd>
      </div>
    </dl>
  );
}

function ProfileInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startEdit = searchParams.get("edit") === "1";
  const { refreshUser } = useAuth();

  const [loading, setLoading] = React.useState(true);
  const [createdAt, setCreatedAt] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState(startEdit);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", email: "", phone: "" },
  });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { user } = await getMe();
        if (cancelled) return;
        setCreatedAt(user.createdAt);
        form.reset({
          name: user.name ?? "",
          email: user.email ?? "",
          phone: user.phone ?? "",
        });
      } catch {
        router.replace("/login");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form, router]);

  React.useEffect(() => {
    setEditing(startEdit);
  }, [startEdit]);

  async function onSave(data: ProfileForm) {
    setError(null);
    setSaving(true);
    try {
      await updateProfile({
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
      });
      await refreshUser();
      setEditing(false);
      router.replace("/profile");
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Could not save profile"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-violet-700 transition hover:text-violet-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <Card className="border-gray-200/90 shadow-lg ring-1 ring-gray-100/80">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="font-display text-2xl">My profile</CardTitle>
            <CardDescription className="mt-1">Manage your RiseUp Academy account details.</CardDescription>
          </div>
          {!editing ? (
            <Button
              type="button"
              variant="outline"
              className="shrink-0 rounded-2xl border-violet-200 font-semibold"
              onClick={() => setEditing(true)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {editing ? (
            <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Full name</label>
                <Input {...form.register("name")} className="min-h-[44px]" />
                {form.formState.errors.name ? (
                  <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <Input type="email" {...form.register("email")} className="min-h-[44px]" />
                {form.formState.errors.email ? (
                  <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Phone</label>
                <Input type="tel" {...form.register("phone")} className="min-h-[44px]" />
                {form.formState.errors.phone ? (
                  <p className="text-sm text-red-600">{form.formState.errors.phone.message}</p>
                ) : null}
              </div>
              {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div> : null}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button type="submit" className="min-h-[44px] rounded-2xl font-semibold" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving…" : "Save changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-[44px] rounded-2xl"
                  disabled={saving}
                  onClick={async () => {
                    try {
                      const { user } = await getMe();
                      form.reset({
                        name: user.name ?? "",
                        email: user.email ?? "",
                        phone: user.phone ?? "",
                      });
                    } catch {
                      /* ignore */
                    }
                    setEditing(false);
                    router.replace("/profile");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <ProfileReadOnly form={form} createdAt={createdAt} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function ProfileView() {
  return (
    <RequireAuth>
      <Suspense
        fallback={
          <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm font-medium text-gray-600">Loading profile…</div>
        }
      >
        <ProfileInner />
      </Suspense>
    </RequireAuth>
  );
}
