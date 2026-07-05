"use client";

import { cn } from "@/lib/cn";
import type { TabId } from "../types";

const TABS: { id: TabId; label: string }[] = [
  { id: "courses", label: "My Courses" },
  { id: "payments", label: "Payments" },
  { id: "certificates", label: "Certificates" },
  { id: "live", label: "Live Classes" },
];

type Props = {
  tab: TabId;
  onChange: (id: TabId) => void;
  /** Optional counts (e.g. pending assignments) — shown as a small badge when &gt; 0 */
  badges?: Partial<Record<TabId, number>>;
};

export function DashboardTabBar({ tab, onChange, badges }: Props) {
  return (
    <div className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 pt-1 [scrollbar-width:thin]">
      {TABS.map(({ id, label }) => {
        const active = tab === id;
        const n = badges?.[id];
        const showBadge = typeof n === "number" && n > 0;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              "snap-start shrink-0 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98]",
              active
                ? "bg-violet-700 text-white shadow-md ring-1 ring-violet-500/30"
                : "border border-gray-200 bg-white text-gray-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800"
            )}
          >
            <span className="inline-flex items-center gap-1.5">
              {label}
              {showBadge ? (
                <span
                  className={cn(
                    "min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                    active ? "bg-white/20 text-white" : "bg-orange-100 text-orange-900 ring-1 ring-orange-200/80"
                  )}
                >
                  {n > 99 ? "99+" : n}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
