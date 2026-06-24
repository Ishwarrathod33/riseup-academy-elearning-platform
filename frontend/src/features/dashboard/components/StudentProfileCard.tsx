"use client";

import { Calendar, Mail, Smartphone } from "lucide-react";
import {
  displayNameFromStudentProfile,
  firstNameFromProfile,
  getInitialsFromStudentProfile,
} from "../lib/student-profile";
import type { StudentProfile } from "../types";

type Props = {
  profile: StudentProfile | null;
};

export function StudentProfileCard({ profile }: Props) {
  const name = profile?.name?.trim() ?? null;
  const email = profile?.email?.trim() ?? null;
  const phone = profile?.phone?.trim() ?? null;
  const initials = getInitialsFromStudentProfile(name, email, phone);
  const displayName = displayNameFromStudentProfile(name, email, phone);
  const first = firstNameFromProfile(name);
  const joined = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : null;

  return (
    <div className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-sm ring-1 ring-gray-100/60 md:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-700 to-violet-800 text-lg font-bold text-white shadow-md ring-2 ring-violet-100">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
              {first ? `Welcome back, ${first} 👋` : "Welcome back 👋"}
            </p>
            <h2 className="font-display truncate text-xl font-bold text-gray-900 sm:text-2xl">{displayName}</h2>
            <p className="mt-2 text-sm text-gray-600">Ready to continue your learning?</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {email ? (
                <span className="inline-flex max-w-full items-center gap-1.5 truncate">
                  <Mail className="h-4 w-4 shrink-0 text-violet-600" />
                  <span className="truncate">{email}</span>
                </span>
              ) : null}
              {phone ? (
                <span className="inline-flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 shrink-0 text-violet-600" />
                  <span>{phone}</span>
                </span>
              ) : null}
              {!name && !email && !phone ? <span className="text-gray-500">Complete your profile to add your name</span> : null}
              {joined ? (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 shrink-0 text-orange-500" />
                  Joined {joined}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
