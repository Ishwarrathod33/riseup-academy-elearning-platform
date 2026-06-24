"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "./BrandMark";
import { cn } from "@/lib/cn";
import { useAuth, UserMenu } from "@/features/auth";

export function AppNavbar() {
  const pathname = usePathname() ?? "/";
  const { isAuthenticated, loading, user } = useAuth();

  const navItems: { href: string; label: string; active: (path: string) => boolean; show: boolean }[] = [
    { href: "/", label: "Home", active: (p) => p === "/", show: true },
    {
      href: "/about",
      label: "About",
      active: (p) => p === "/about",
      show: true,
    },
    {
      href: "/courses",
      label: "Courses",
      active: (p) => p === "/courses" || p.startsWith("/courses/"),
      show: true,
    },
    {
      href: "/dashboard",
      label: "Dashboard",
      active: (p) => p.startsWith("/dashboard"),
      show: user?.role === "STUDENT",
    },
    {
      href: "/admin",
      label: "Admin",
      active: (p) => p.startsWith("/admin"),
      show: user?.role === "ADMIN",
    },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/90 bg-white/95 shadow-sm backdrop-blur-sm">
      <div className="mx-auto flex min-h-[56px] max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8 sm:gap-4">
        <BrandMark variant="header" />

        <nav className="flex max-w-[min(100%,28rem)] flex-1 items-center justify-center gap-1 overflow-x-auto sm:max-w-none sm:gap-1.5" aria-label="Main">
          {navItems
            .filter((x) => x.show)
            .map(({ href, label, active }) => {
              const isActive = active(pathname);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "whitespace-nowrap rounded-xl px-3 py-2 text-sm transition-all duration-200",
                    isActive
                      ? "bg-violet-100 font-semibold text-violet-900 shadow-sm ring-1 ring-violet-200/70"
                      : "font-medium text-gray-600 hover:bg-gray-50 hover:text-violet-800 active:scale-[0.98]"
                  )}
                >
                  {label}
                </Link>
              );
            })}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {loading && !isAuthenticated ? (
            <div className="h-9 w-20 animate-pulse rounded-2xl bg-gray-100" aria-hidden />
          ) : isAuthenticated ? (
            <UserMenu />
          ) : (
            <>
              <Link
                href="/register"
                className="inline-flex min-h-[40px] items-center justify-center rounded-2xl border border-violet-200 bg-white px-3 py-2 text-sm font-semibold text-violet-800 shadow-sm transition hover:border-violet-300 hover:bg-violet-50 active:scale-[0.98] sm:min-h-[44px] sm:px-4"
              >
                Register
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-[40px] items-center justify-center rounded-2xl bg-violet-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-800 hover:shadow active:scale-[0.98] sm:min-h-[44px] sm:px-5"
              >
                Login
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
