"use client";

import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onAsk: () => void;
};

export function AiDoubtCard({ onAsk }: Props) {
  return (
    <div className="rounded-2xl border border-orange-200/80 bg-gradient-to-br from-orange-50/90 to-white p-6 shadow-sm ring-1 ring-orange-100/50 md:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-sm">
            <Bot className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-gray-900">Ask AI Doubt Solver</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">Get quick concept checks between classes (beta).</p>
          </div>
        </div>
        <Button
          className="h-11 shrink-0 rounded-2xl bg-orange-500 px-6 font-semibold text-white shadow-sm transition hover:bg-orange-600 hover:shadow active:scale-[0.98]"
          onClick={onAsk}
        >
          Ask Question
        </Button>
      </div>
    </div>
  );
}
