"use client";

import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200/90 bg-gradient-to-b from-slate-50 to-white px-6 py-16 text-center shadow-sm sm:px-10">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-violet-50 text-violet-700 shadow-sm ring-1 ring-violet-100/80">
        <Icon className="h-8 w-8" strokeWidth={1.5} />
      </div>
      <h3 className="mt-6 font-display text-lg font-bold text-gray-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-600">{description}</p>
      {actionLabel && onAction ? (
        <Button
          className="mt-8 min-h-[44px] rounded-2xl bg-violet-700 px-8 font-semibold shadow-sm transition hover:bg-violet-800 hover:shadow active:scale-[0.98]"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
