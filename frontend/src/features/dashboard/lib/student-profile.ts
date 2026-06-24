export function getInitials(identifier: string, channel: "email" | "phone"): string {
  if (!identifier.trim()) return "RU";
  if (channel === "email") {
    const local = identifier.split("@")[0] ?? "";
    const parts = local.split(/[._-]/).filter(Boolean);
    if (parts.length >= 2 && parts[0][0] && parts[1][0]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return local.slice(0, 2).toUpperCase();
  }
  const digits = identifier.replace(/\D/g, "");
  return digits.slice(-2) || "ST";
}

export function displayStudentName(identifier: string, channel: "email" | "phone"): string {
  if (!identifier.trim()) return "Student";
  if (channel === "email") {
    const local = identifier.split("@")[0] ?? "";
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return identifier.trim();
}

/** Prefer API user fields (source of truth). */
export function getInitialsFromProfile(email: string | null, phone: string | null): string {
  if (email?.trim()) return getInitials(email.trim(), "email");
  if (phone?.trim()) return getInitials(phone.trim(), "phone");
  return "RU";
}

export function displayNameFromProfile(email: string | null, phone: string | null): string {
  if (email?.trim()) return displayStudentName(email.trim(), "email");
  if (phone?.trim()) return displayStudentName(phone.trim(), "phone");
  return "Student";
}

/** Initials: full name first (e.g. Ishwar Rathod → IR), else email/phone heuristics. */
export function getInitialsFromStudentProfile(
  name: string | null | undefined,
  email: string | null,
  phone: string | null
): string {
  const n = name?.trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2 && parts[0][0] && parts[1][0]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  }
  return getInitialsFromProfile(email, phone);
}

/** Display name: prefer saved full name, then email local-part, then phone. */
export function displayNameFromStudentProfile(
  name: string | null | undefined,
  email: string | null,
  phone: string | null
): string {
  if (name?.trim()) return name.trim();
  return displayNameFromProfile(email, phone);
}

/** First word of full name for “Welcome back, Ishwar”. */
export function firstNameFromProfile(name: string | null | undefined): string | null {
  if (!name?.trim()) return null;
  const first = name.trim().split(/\s+/)[0];
  return first ? first.charAt(0).toUpperCase() + first.slice(1) : null;
}
