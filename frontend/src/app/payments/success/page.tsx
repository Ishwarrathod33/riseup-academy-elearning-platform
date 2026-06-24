"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function PaymentSuccessContent() {
  const params = useSearchParams();
  const courseId = params.get("courseId");

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Card className="animate-fade-up rounded-2xl border-gray-200 shadow-sm">
        <CardContent className="p-8">
          <div className="text-2xl font-bold text-green-600">Payment Successful</div>
          <div className="mt-2 text-sm text-muted-foreground">
            Your enrollment has been activated{courseId ? ` for course ${courseId}` : ""}.
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/dashboard">
              <Button className="rounded-2xl bg-violet-700 hover:bg-violet-800">Go to Dashboard</Button>
            </Link>
            <Link href="/courses">
              <Button variant="outline" className="rounded-2xl border-gray-200">
                Browse More Courses
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <React.Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-12 text-center text-sm text-muted-foreground">Loading…</div>
      }
    >
      <PaymentSuccessContent />
    </React.Suspense>
  );
}
