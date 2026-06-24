import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

/** Consistent horizontal padding with main app shell (navbar/footer). */
export function PageContainer({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}
