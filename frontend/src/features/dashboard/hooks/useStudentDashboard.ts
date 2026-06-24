"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BookOpen, CreditCard, Percent, Trophy } from "lucide-react";
import { apiFetch, ApiError, getErrorMessage } from "@/lib/api";
import { getMe } from "@/lib/auth";
import { STORAGE_KEYS } from "@/lib/constants";
import { formatINR, pct } from "@/lib/format";
import { computeOverallProgress } from "../lib/progress";
import type {
  DashboardStat,
  EnrolledCourse,
  EnrolledCourseWithProgress,
  LectureProgressItem,
  QuizAttempt,
  ResumeTarget,
  StudentProfile,
  TabId,
} from "../types";

function isLectureCompleted(row: LectureProgressItem | undefined): boolean {
  if (!row) return false;
  if (row.completedAt) return true;
  return row.lastProgressPct >= 100;
}

export function useStudentDashboard() {
  const router = useRouter();

  const [token, setToken] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<TabId>("courses");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [profile, setProfile] = React.useState<StudentProfile | null>(null);
  const [lectureProgressItems, setLectureProgressItems] = React.useState<LectureProgressItem[]>([]);

  const [courses, setCourses] = React.useState<EnrolledCourseWithProgress[]>([]);
  const [payments, setPayments] = React.useState<any[]>([]);
  const [attendanceSessions, setAttendanceSessions] = React.useState<any[]>([]);
  const [assignments, setAssignments] = React.useState<any[]>([]);
  const [certificates, setCertificates] = React.useState<any[]>([]);
  const [liveClasses, setLiveClasses] = React.useState<any[]>([]);
  const [quizAttemptsSubmitted, setQuizAttemptsSubmitted] = React.useState(0);
  /** Increment to re-run the dashboard data effect (retry / refresh). */
  const [reloadTick, setReloadTick] = React.useState(0);

  React.useEffect(() => {
    const t = localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!t) {
      router.push("/login");
      return;
    }
    setToken(t);
  }, [router]);

  const refetch = React.useCallback(() => {
    setReloadTick((n) => n + 1);
  }, []);

  React.useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const meRes = await getMe();
        if (cancelled) return;

        setProfile(meRes.user);
        if (meRes.user.profileIncomplete) {
          setLoading(false);
          router.replace("/complete-profile");
          return;
        }

        const [my, results, progressMy, pay, att, asg, cert, live] = await Promise.all([
          apiFetch<{ enrollments: Array<{ course: EnrolledCourse }> }>("/api/courses/my"),
          apiFetch<{ attempts: QuizAttempt[] }>("/api/lms/results/my"),
          apiFetch<{ items: LectureProgressItem[] }>("/api/lms/progress/my"),
          apiFetch<{ payments: any[] }>("/api/payments/my"),
          apiFetch<{ sessions: any[] }>("/api/lms/attendance/my"),
          apiFetch<{ assignments: any[] }>("/api/lms/assignments"),
          apiFetch<{ certificates: any[] }>("/api/lms/certificates/my"),
          apiFetch<{ liveClasses: any[] }>("/api/lms/live-classes/my"),
        ]);

        if (cancelled) return;

        setLectureProgressItems(progressMy.items ?? []);

        const enrolled = (my.enrollments ?? []).map((e) => e.course);
        const attempts = results.attempts ?? [];
        const submittedQuizAttempts = attempts.filter((a) => a.submittedAt).length;
        setQuizAttemptsSubmitted(submittedQuizAttempts);

        const quizPercentByQuizId: Record<string, number> = {};
        for (const a of attempts) {
          const total = Number(a.total) || 0;
          const score = Number(a.score) || 0;
          const key = String(a.quiz.id);
          if (quizPercentByQuizId[key] === undefined) {
            quizPercentByQuizId[key] = total > 0 ? Math.floor((score / total) * 100) : 0;
          }
        }

        const progressByLectureId = new Map<string, LectureProgressItem>();
        for (const item of progressMy.items ?? []) {
          progressByLectureId.set(item.lecture.id, item);
        }

        const courseDetails = await Promise.all(
          enrolled.map(async (c) => {
            const d = await apiFetch<{ course: any }>(`/api/courses/${encodeURIComponent(c.id)}`, { method: "GET" });
            return d.course;
          })
        );

        if (cancelled) return;

        const progressList: EnrolledCourseWithProgress[] = [];

        for (let i = 0; i < enrolled.length; i++) {
          const course = enrolled[i];
          const detail = courseDetails[i];
          const lectureIds: string[] = (detail.lectures ?? []).map((l: { id: string }) => l.id);

          const lectureProgressMap: Record<string, number> = {};
          for (const lid of lectureIds) {
            const row = progressByLectureId.get(lid);
            lectureProgressMap[lid] = typeof row?.lastProgressPct === "number" ? row.lastProgressPct : 0;
          }

          const completedLectures = lectureIds.filter((lid) =>
            isLectureCompleted(progressByLectureId.get(lid))
          ).length;

          const lectureAvg =
            lectureIds.length > 0
              ? lectureIds.reduce((s, id) => s + (lectureProgressMap[id] ?? 0), 0) / lectureIds.length
              : 0;

          const courseQuizIds: string[] = (detail.quizzes ?? []).map((q: { id: string }) => q.id);
          const quizAvg =
            courseQuizIds.length > 0
              ? courseQuizIds.reduce((s: number, id: string) => s + (quizPercentByQuizId[id] ?? 0), 0) /
                courseQuizIds.length
              : 0;

          const overall = computeOverallProgress(lectureAvg, quizAvg, courseQuizIds.length > 0);

          progressList.push({
            ...course,
            progressPct: overall,
            totalLectures: lectureIds.length,
            completedLectures,
          });
        }

        setCourses(progressList);
        setPayments(pay.payments ?? []);
        setAttendanceSessions(att.sessions ?? []);
        setAssignments(asg.assignments ?? []);
        setCertificates(cert.certificates ?? []);
        setLiveClasses(live.liveClasses ?? []);
      } catch (e: unknown) {
        if (cancelled) return;
        if (e instanceof ApiError && e.isUnauthorized) {
          localStorage.removeItem(STORAGE_KEYS.accessToken);
          router.push("/login");
          return;
        }
        setError(getErrorMessage(e, "Unable to load your dashboard. Please try again."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token, router, reloadTick]);

  const pendingAssignments = assignments.filter((a) => !a.submission);
  const submittedAssignments = assignments.filter((a) => !!a.submission);

  const overallProgressAvg = React.useMemo(() => {
    if (!courses.length) return 0;
    return Math.round(courses.reduce((s, c) => s + c.progressPct, 0) / courses.length);
  }, [courses]);

  const completedLessonsCount = React.useMemo(() => {
    return courses.reduce((s, c) => s + (c.completedLectures ?? 0), 0);
  }, [courses]);

  const weeklyProgressPct = React.useMemo(() => {
    const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = lectureProgressItems.filter((row) => {
      const updated = new Date(row.updatedAt).getTime();
      return Number.isFinite(updated) && updated >= since;
    });
    if (!recent.length) return 0;
    const avg = recent.reduce((s, r) => s + (Number(r.lastProgressPct) || 0), 0) / recent.length;
    return Math.round(avg);
  }, [lectureProgressItems]);

  const paymentsDoneCount = React.useMemo(() => payments.filter((p) => p.status === "PAID").length, [payments]);

  const resumeTarget = React.useMemo((): ResumeTarget | null => {
    if (!lectureProgressItems.length || !courses.length) return null;
    const enrolledIds = new Set(courses.map((c) => c.id));
    const sorted = [...lectureProgressItems]
      .filter((p) => enrolledIds.has(p.lecture.courseId))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    const top = sorted[0];
    if (!top) return null;
    const course = courses.find((c) => c.id === top.lecture.courseId);
    return {
      courseId: top.lecture.courseId,
      courseTitle: top.lecture.course.title,
      lectureId: top.lecture.id,
      lectureTitle: top.lecture.title,
      courseProgressPct: course?.progressPct ?? 0,
      lectureProgressPct: top.lastProgressPct,
    };
  }, [lectureProgressItems, courses]);

  const fallbackCourse = React.useMemo(() => {
    if (!courses.length) return null;
    return courses[0];
  }, [courses]);

  const statCards = React.useMemo<DashboardStat[]>(
    () => [
      { label: "Courses enrolled", value: courses.length, icon: BookOpen, accent: "violet" },
      { label: "Overall progress", value: `${overallProgressAvg}%`, icon: Percent, accent: "orange" },
      { label: "Quizzes attempted", value: quizAttemptsSubmitted, icon: Trophy, accent: "indigo" },
      { label: "Payments done", value: paymentsDoneCount, icon: CreditCard, accent: "emerald" },
    ],
    [courses.length, overallProgressAvg, quizAttemptsSubmitted, paymentsDoneCount]
  );

  function logout() {
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    router.push("/login");
  }

  function navigateResume() {
    if (resumeTarget) {
      router.push(
        `/courses/${encodeURIComponent(resumeTarget.courseId)}?lecture=${encodeURIComponent(resumeTarget.lectureId)}`
      );
      return;
    }
    if (fallbackCourse) {
      router.push(`/courses/${encodeURIComponent(fallbackCourse.id)}`);
    }
  }

  return {
    loading,
    error,
    tab,
    setTab,
    profile,
    courses,
    payments,
    attendanceSessions,
    assignments,
    certificates,
    liveClasses,
    pendingAssignments,
    submittedAssignments,
    overallProgressAvg,
    completedLessonsCount,
    weeklyProgressPct,
    resumeTarget,
    fallbackCourse,
    statCards,
    logout,
    navigateResume,
    refetch,
    router,
    formatINR,
    pct,
    lectureProgressItems,
  };
}

export type StudentDashboardVM = ReturnType<typeof useStudentDashboard>;
