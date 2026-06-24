"use client";

import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EnrolledCourseWithProgress, ResumeTarget } from "../types";

type Props = {
  resume: ResumeTarget | null;
  fallbackCourse: EnrolledCourseWithProgress | null;
  onResume: () => void;
  onBrowse: () => void;
};

export function ContinueLearningBanner({ resume, fallbackCourse, onResume, onBrowse }: Props) {
  const hasResume = !!resume;
  const hasFallback = !!fallbackCourse;

  return (
    <div className="rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-700 to-violet-800 p-6 text-white shadow-md shadow-violet-900/10 ring-1 ring-white/10 md:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold md:text-xl">Continue learning</h3>
            {hasResume ? (
              <>
                <p className="mt-1 text-sm text-violet-100">
                  Resume <span className="font-semibold text-white">{resume.lectureTitle}</span>
                  <span className="text-violet-200"> · </span>
                  <span className="font-medium text-white">{resume.courseTitle}</span>
                </p>
                <p className="mt-2 text-xs text-violet-200">
                  Lecture {Math.round(resume.lectureProgressPct)}% · Course {Math.round(resume.courseProgressPct)}%
                </p>
              </>
            ) : hasFallback ? (
              <>
                <p className="mt-1 text-sm text-violet-100">
                  Start with <span className="font-semibold text-white">{fallbackCourse.title}</span>
                  {fallbackCourse.level ? ` · ${fallbackCourse.level}` : ""}
                </p>
                <p className="mt-2 text-xs text-violet-200">
                  {fallbackCourse.completedLectures}/{fallbackCourse.totalLectures} lectures completed ·{" "}
                  {Math.round(fallbackCourse.progressPct)}% overall
                </p>
              </>
            ) : (
              <p className="mt-1 max-w-xl text-sm text-violet-100">
                Enroll in a course to unlock lessons, quizzes, and assignments tailored to your goals.
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {hasResume || hasFallback ? (
            <Button
              className="h-11 rounded-2xl border-0 bg-white font-semibold text-violet-800 shadow-sm transition hover:bg-violet-50 hover:shadow active:scale-[0.98]"
              onClick={onResume}
            >
              {hasResume ? "Resume" : "Start course"}
            </Button>
          ) : null}
          <Button
            variant="outline"
            className="h-11 rounded-2xl border-white/70 bg-transparent font-semibold text-white hover:bg-white/10 hover:text-white"
            onClick={onBrowse}
          >
            Browse courses
          </Button>
        </div>
      </div>
    </div>
  );
}
