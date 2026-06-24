"use client";

import * as React from "react";
import { RequireAuth } from "@/features/auth";
import { StudentDashboardView, useStudentDashboard } from "@/features/dashboard";
import { useAuth } from "@/features/auth";
import { useRouter } from "next/navigation";

function DashboardContent() {
  const vm = useStudentDashboard();
  return <StudentDashboardView {...vm} />;
}

function DashboardRoleGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (user.role !== "STUDENT") {
      router.replace(user.role === "ADMIN" ? "/admin" : "/courses");
    }
  }, [loading, user, router]);

  if (!user || loading || user.role !== "STUDENT") return null;
  return <>{children}</>;
}

export default function StudentDashboardPage() {
  return (
    <RequireAuth>
      <DashboardRoleGate>
        <DashboardContent />
      </DashboardRoleGate>
    </RequireAuth>
  );
}
