"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { STORAGE_KEYS } from "@/lib/constants";

type Props = {
  children: React.ReactNode;
};

/**
 * Blocks content until auth is resolved; redirects to /login if no valid session.
 */
export function RequireAuth({ children }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (loading) return;
    const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.accessToken) : null;
    if (!token || !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-200 border-t-violet-700" />
          <p className="text-sm font-medium text-gray-600">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
