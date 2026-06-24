"use client";

import { cn } from "@/lib/cn";
import type { DashboardStat } from "../types";

const accentIcon: Record<DashboardStat["accent"], string> = {
  violet: "bg-violet-700 text-white",
  orange: "bg-orange-500 text-white",
  indigo: "bg-indigo-600 text-white",
  emerald: "bg-emerald-600 text-white",
};

export function DashboardStatCards({ stats }: { stats: DashboardStat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className={cn(
            "rounded-2xl border border-gray-200/90 bg-white p-4 shadow-sm ring-1 ring-gray-100/50 transition duration-200",
            "hover:-translate-y-0.5 hover:border-violet-200/80 hover:shadow-md"
          )}
        >
          <div className={cn("inline-flex rounded-xl p-2.5 shadow-sm", accentIcon[s.accent])}>
            <s.icon className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-gray-500">{s.label}</p>
          <p className="font-display mt-1 text-2xl font-bold tracking-tight text-gray-900">{s.value}</p>
        </div>
      ))}
    </div>
  );
}
