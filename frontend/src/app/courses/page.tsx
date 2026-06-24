"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RazorpayCheckoutButton } from "@/features/courses";

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = React.useState<any[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    fetch(`${API_BASE_URL}/api/courses`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load courses"))))
      .then((d) => {
        if (!mounted) return;
        setCourses(d.courses ?? []);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e?.message ?? "Failed");
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 md:py-12">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Courses</h1>
          <p className="mt-1 text-sm text-gray-600">Pick your stream and enroll securely.</p>
        </div>
        <Button
          variant="outline"
          className="w-fit min-h-[40px] rounded-2xl border-gray-200 bg-white shadow-sm transition hover:border-violet-200 hover:bg-violet-50 active:scale-[0.98]"
          onClick={() => router.push("/login")}
        >
          Login / OTP
        </Button>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200/90 bg-red-50/90 p-4 text-sm text-red-800 ring-1 ring-red-100">{error}</div>
      ) : null}

      <div className="mt-8 grid gap-4 md:grid-cols-3 md:gap-5">
        {(courses.length ? courses : []).map((c) => (
          <Card
            key={c.id}
            className="animate-fade-up rounded-2xl border-gray-200/90 shadow-sm ring-1 ring-gray-100/50 transition hover:border-violet-200/70 hover:shadow-md"
          >
            <CardHeader>
              <CardTitle className="text-violet-700">{c.level}</CardTitle>
              <div className="mt-2 text-xl font-bold">{c.title}</div>
              {c.description ? <div className="mt-2 text-sm text-muted-foreground">{c.description}</div> : null}
              <div className="mt-4 text-sm font-semibold">
                ₹{c.price} <span className="text-xs font-normal text-muted-foreground">/ course</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Subjects:{" "}
                {(c.subjects ?? []).length ? c.subjects.map((s: any) => s.name).join(", ") : "—"}
              </div>
              {c.demoVideoUrl ? (
                <div className="text-sm text-muted-foreground">
                  Demo:{" "}
                  <a className="font-semibold text-primary hover:underline" href={c.demoVideoUrl} target="_blank" rel="noreferrer">
                    Watch
                  </a>
                </div>
              ) : null}
              <RazorpayCheckoutButton courseId={c.id} />
            </CardContent>
          </Card>
        ))}

        {!courses.length && !error ? (
          <div className="md:col-span-3 rounded-2xl border border-dashed border-gray-200/90 bg-gradient-to-b from-slate-50 to-white p-10 text-center text-sm text-gray-600 shadow-sm ring-1 ring-gray-100/60 animate-fade-up">
            <p className="font-medium text-gray-900">No courses yet</p>
            <p className="mt-2">
              Ask your admin to add courses from{" "}
              <code className="rounded-md bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-800 ring-1 ring-violet-100">/admin</code>
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

