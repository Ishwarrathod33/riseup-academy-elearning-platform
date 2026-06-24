"use client";

import Link from "next/link";
import { BookOpen, LogOut, Pencil, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "./AuthProvider";
import { getDisplayName, getUserInitials } from "./user-display";

export function UserMenu() {
  const { user, loading, logout } = useAuth();

  if (loading && !user) {
    return (
      <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-violet-100 ring-2 ring-violet-100/80" aria-hidden />
    );
  }

  if (!user) return null;

  const initials = getUserInitials(user);
  const name = getDisplayName(user);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-violet-800 text-sm font-bold text-white shadow-md ring-2 ring-violet-200/80 transition hover:ring-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
          aria-label="Account menu"
        >
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
          {user.email ? <p className="truncate text-xs text-gray-500">{user.email}</p> : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex cursor-pointer items-center gap-2">
            <User className="h-4 w-4 text-violet-600" />
            View Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile?edit=1" className="flex cursor-pointer items-center gap-2">
            <Pencil className="h-4 w-4 text-orange-500" />
            Edit Profile
          </Link>
        </DropdownMenuItem>
        {user.role === "ADMIN" ? (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="flex cursor-pointer items-center gap-2">
              <BookOpen className="h-4 w-4 text-violet-600" />
              Admin Panel
            </Link>
          </DropdownMenuItem>
        ) : null}
        {user.role === "STUDENT" ? (
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="flex cursor-pointer items-center gap-2">
              <BookOpen className="h-4 w-4 text-violet-600" />
              My Courses
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 text-red-700 focus:bg-red-50 focus:text-red-800"
          onSelect={(e) => {
            e.preventDefault();
            void logout();
          }}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
