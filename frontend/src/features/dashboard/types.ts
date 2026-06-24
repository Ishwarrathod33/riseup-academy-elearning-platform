import type { LucideIcon } from "lucide-react";

export type TabId = "courses" | "payments" | "attendance" | "assignments" | "certificates" | "live";

export type EnrolledCourse = {
  id: string;
  title: string;
  level: string;
  price: number;
  currency: string;
  demoVideoUrl?: string | null;
  coverImageUrl?: string | null;
};

export type EnrolledCourseWithProgress = EnrolledCourse & {
  progressPct: number;
  totalLectures: number;
  completedLectures: number;
};

/** Last lecture the student interacted with (from /api/lms/progress/my). */
export type ResumeTarget = {
  courseId: string;
  courseTitle: string;
  lectureId: string;
  lectureTitle: string;
  courseProgressPct: number;
  lectureProgressPct: number;
};

export type LectureProgressItem = {
  id: string;
  lastProgressPct: number;
  lastPositionSec: number;
  completedAt: string | null;
  updatedAt: string;
  lecture: {
    id: string;
    title: string;
    courseId: string;
    sequence: number;
    course: { id: string; title: string };
  };
};

export type StudentProfile = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
  /** True when name is missing — user should visit /complete-profile */
  profileIncomplete?: boolean;
};

export type QuizAttempt = {
  id: string;
  quiz: { id: string; title: string; courseId: string; passingScore?: number | null };
  score: number;
  total: number;
  submittedAt?: string | null;
};

export type DashboardStat = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent: "violet" | "orange" | "indigo" | "emerald";
};
