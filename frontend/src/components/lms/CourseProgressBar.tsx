"use client";

import * as React from "react";

export function CourseProgressBar({ percent }: { percent: number }) {
  const safe = Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : 0;
  return (
    <div className="rounded-3xl border bg-background p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Course Progress</div>
        <div className="text-sm font-semibold text-primary">{safe}%</div>
      </div>
      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${safe}%` }}
          aria-label={`Course progress: ${safe}%`}
        />
      </div>
      <div className="mt-2 text-xs text-muted-foreground">Videos + quiz attempts update your progress.</div>
    </div>
  );
}

