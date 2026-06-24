import type { AuthUser } from "@/lib/auth";

export function getUserInitials(user: AuthUser | null): string {
  const name = user?.name?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  const email = user?.email?.trim();
  if (email) return email.slice(0, 2).toUpperCase();
  const phone = user?.phone?.trim();
  if (phone) return phone.slice(-2);
  return "?";
}

export function getDisplayName(user: AuthUser | null): string {
  return user?.name?.trim() || user?.email?.trim() || user?.phone?.trim() || "Student";
}
