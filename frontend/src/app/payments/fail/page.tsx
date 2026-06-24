"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PaymentFailPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Card className="animate-fade-up">
        <CardContent className="p-8">
          <div className="text-2xl font-bold text-red-600">Payment Failed</div>
          <div className="mt-2 text-sm text-muted-foreground">
            Your enrollment was not activated. You can try again from Courses.
          </div>
          <div className="mt-6 flex gap-3 flex-wrap">
            <Link href="/courses">
              <Button>Browse Courses</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">Go to Dashboard</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

