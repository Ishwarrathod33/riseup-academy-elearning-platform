"use client";

import * as React from "react";
import { Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FileText, Library } from "lucide-react";
import { apiFetch, API_BASE_URL, getErrorMessage } from "@/lib/api";
import { computeOverallProgress } from "@/lib/learning-progress";
import { STORAGE_KEYS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CourseProgressBar } from "@/components/lms/CourseProgressBar";
import { VideoLecturePlayer } from "@/components/lms/VideoLecturePlayer";
import { QuizPlayer } from "@/components/lms/QuizPlayer";
import { AssignmentsSection } from "@/components/lms/AssignmentsSection";

type CourseDetails = {
  course: {
    id: string;
    title: string;
    level: string;
    description?: string | null;
    price: number;
    currency: string;
    subjects: { id: string; name: string }[];
    lectures: {
      id: string;
      title: string;
      videoUrl: string;
      durationSec?: number | null;
      notesUrl?: string | null;
      pdfUrl?: string | null;
      sequence?: number;
    }[];
    quizzes: { id: string; title: string; totalMarks: number; passingScore: number }[];
  };
};

function CourseDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between">
        <div className="space-y-3">
          <div className="h-4 w-24 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-9 w-56 max-w-full animate-pulse rounded-lg bg-gray-200" />
          <div className="h-4 w-full max-w-lg animate-pulse rounded bg-gray-100" />
        </div>
        <div className="h-28 w-full shrink-0 animate-pulse rounded-3xl bg-gray-100 md:w-[380px]" />
      </div>
      <div className="grid gap-6 md:grid-cols-12">
        <div className="space-y-3 md:col-span-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[72px] animate-pulse rounded-2xl border border-gray-100 bg-white" />
          ))}
        </div>
        <div className="space-y-4 md:col-span-8">
          <div className="h-[320px] animate-pulse rounded-3xl border border-gray-100 bg-gray-50" />
          <div className="h-40 animate-pulse rounded-3xl border border-gray-100 bg-gray-50" />
        </div>
      </div>
    </div>
  );
}

function CourseDetailInner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = String((params as { courseId?: string }).courseId ?? "");

  const [accessToken, setAccessToken] = React.useState<string | null>(null);
  const [course, setCourse] = React.useState<CourseDetails["course"] | null>(null);
  const [lectures, setLectures] = React.useState<CourseDetails["course"]["lectures"]>([]);
  const [quizzes, setQuizzes] = React.useState<CourseDetails["course"]["quizzes"]>([]);

  const [selectedLectureId, setSelectedLectureId] = React.useState<string | null>(null);
  const [selectedQuizId, setSelectedQuizId] = React.useState<string | null>(null);
  const [lectureProgressById, setLectureProgressById] = React.useState<Record<string, number>>({});
  const [quizProgressByQuizId, setQuizProgressByQuizId] = React.useState<Record<string, number>>({});
  const [overallProgress, setOverallProgress] = React.useState(0);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const selectedLecture = React.useMemo(() => {
    if (!selectedLectureId) return null;
    return lectures.find((l) => l.id === selectedLectureId) ?? null;
  }, [lectures, selectedLectureId]);

  const selectedQuiz = React.useMemo(() => {
    if (!selectedQuizId) return null;
    return quizzes.find((q) => q.id === selectedQuizId) ?? null;
  }, [quizzes, selectedQuizId]);

  function recomputeOverallProgress(nextLectureMap?: Record<string, number>, nextQuizMap?: Record<string, number>) {
    const lectureMap = nextLectureMap ?? lectureProgressById;
    const quizMap = nextQuizMap ?? quizProgressByQuizId;

    const lectureIds = lectures.map((l) => l.id);
    const quizIds = quizzes.map((q) => q.id);

    const lectureAvg =
      lectureIds.length > 0
        ? lectureIds.reduce((sum, id) => sum + (typeof lectureMap[id] === "number" ? lectureMap[id] : 0), 0) /
          lectureIds.length
        : 0;

    const quizAvg =
      quizIds.length > 0
        ? quizIds.reduce((sum, id) => sum + (typeof quizMap[id] === "number" ? quizMap[id] : 0), 0) / quizIds.length
        : 0;

    return computeOverallProgress(lectureAvg, quizAvg, quizIds.length > 0);
  }

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!token) {
      const redirect = encodeURIComponent(`/courses/${encodeURIComponent(courseId)}`);
      router.push(`/login?redirect=${redirect}`);
      return;
    }
    setAccessToken(token);
  }, [router]);

  React.useEffect(() => {
    let cancelled = false;
    if (!courseId) return;

    setLoading(true);
    setError(null);

    apiFetch<CourseDetails>(`/api/courses/${encodeURIComponent(courseId)}`, { method: "GET", auth: true })
      .then((d) => {
        if (cancelled) return;
        setCourse(d.course);
        setLectures(d.course.lectures ?? []);
        setQuizzes(d.course.quizzes ?? []);
        const first = d.course.lectures?.[0]?.id ?? null;
        setSelectedLectureId(first);
        setSelectedQuizId(d.course.quizzes?.[0]?.id ?? null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(getErrorMessage(e, "Failed to load course"));
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  /** Deep link: /courses/[id]?lecture=... (e.g. from dashboard Resume). */
  React.useEffect(() => {
    const lid = searchParams.get("lecture");
    if (!lid || !lectures.length) return;
    if (lectures.some((l) => l.id === lid)) setSelectedLectureId(lid);
  }, [searchParams, lectures]);

  React.useEffect(() => {
    if (!accessToken || !lectures.length) return;
    let cancelled = false;

    async function load() {
      const map: Record<string, number> = {};
      await Promise.all(
        lectures.map(async (l) => {
          try {
            const r = await fetch(`${API_BASE_URL}/api/lms/progress/lecture/${l.id}`, {
              method: "GET",
              headers: { Authorization: `Bearer ${accessToken}` },
              credentials: "include",
            });
            const data = await r.json().catch(() => null);
            if (!r.ok) return;
            const p = data?.progress;
            map[l.id] = typeof p?.lastProgressPct === "number" ? p.lastProgressPct : 0;
          } catch {
            map[l.id] = 0;
          }
        })
      );
      if (cancelled) return;
      setLectureProgressById(map);
      setOverallProgress(recomputeOverallProgress(map));
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, lectures.length]);

  React.useEffect(() => {
    if (!accessToken || !quizzes.length) return;
    let cancelled = false;

    async function loadQuizAttempts() {
      try {
        const r = await fetch(`${API_BASE_URL}/api/lms/results/my`, {
          method: "GET",
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: "include",
        });
        const data = await r.json().catch(() => null);
        if (!r.ok) return;

        const attempts = (data?.attempts ?? []) as any[];
        const map: Record<string, number> = {};
        for (const a of attempts) {
          const quizId = a?.quiz?.id ?? a?.quizId ?? null;
          const score = typeof a?.score === "number" ? a.score : 0;
          const total = typeof a?.total === "number" ? a.total : 0;
          if (!quizId) continue;
          const key = String(quizId);
          if (map[key] === undefined) {
            const pct = total > 0 ? Math.floor((score / total) * 100) : 0;
            map[key] = pct;
          }
        }
        if (cancelled) return;
        setQuizProgressByQuizId(map);
      } catch {
        // ignore
      }
    }

    loadQuizAttempts();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, quizzes.length]);

  React.useEffect(() => {
    if (!lectures.length && !quizzes.length) return;
    setOverallProgress(recomputeOverallProgress());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lectureProgressById, quizProgressByQuizId]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {loading ? <CourseDetailSkeleton /> : null}

      {!loading && error ? (
        <Card className="rounded-3xl border-red-200/90 bg-red-50/90 shadow-sm ring-1 ring-red-100">
          <CardContent className="p-6 sm:p-8">
            <p className="text-sm font-semibold text-red-900">{error}</p>
            <p className="mt-2 text-sm text-red-800/90">Check that the course exists and you are online.</p>
            <Button className="mt-6 rounded-2xl" variant="outline" onClick={() => router.push("/courses")}>
              Back to courses
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {course && !loading ? (
        <>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-sm font-semibold text-violet-700">{course.level}</div>
              <div className="mt-1 font-display text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">{course.title}</div>
              {course.description ? <div className="mt-2 max-w-2xl text-sm text-gray-600">{course.description}</div> : null}
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                {(course.subjects ?? []).map((s) => (
                  <span key={s.id} className="rounded-full border border-gray-200 bg-white px-3 py-1 font-medium text-gray-700">
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="md:w-[380px]">
              <CourseProgressBar percent={overallProgress} />
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-12">
            <div className="md:col-span-4">
              <Card className="sticky top-28 rounded-3xl border border-gray-200/90 bg-white shadow-sm ring-1 ring-gray-100/60">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Library className="h-4 w-4 text-violet-600" />
                    Lectures
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{lectures.length} lessons</p>
                  <div className="mt-3 space-y-2">
                    {lectures.map((l) => {
                      const p = lectureProgressById[l.id] ?? 0;
                      const active = l.id === selectedLectureId;
                      return (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => setSelectedLectureId(l.id)}
                          className={`w-full rounded-2xl border p-3 text-left transition hover:border-violet-200 hover:bg-violet-50/50 ${
                            active ? "border-violet-400 bg-violet-50 ring-1 ring-violet-200/60" : "border-gray-200 bg-white"
                          }`}
                        >
                          <div className="text-sm font-semibold text-gray-900">{l.title}</div>
                          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                            <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-500" style={{ width: `${p}%` }} />
                          </div>
                          <div className="mt-1 text-xs text-gray-500">{Math.round(p)}% complete</div>
                        </button>
                      );
                    })}
                    {!lectures.length ? <div className="text-sm text-gray-500">No lectures yet.</div> : null}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6 md:col-span-8">
              <Card className="overflow-hidden rounded-3xl border border-gray-200/90 bg-white shadow-sm ring-1 ring-gray-100/60">
                <CardContent className="p-5 sm:p-6">
                  <VideoLecturePlayer
                    lecture={selectedLecture}
                    accessToken={accessToken}
                    onProgressPctChange={(lectureId, pctVal) => {
                      setLectureProgressById((prev) => {
                        const next = { ...prev, [lectureId]: pctVal };
                        setOverallProgress(recomputeOverallProgress(next));
                        return next;
                      });
                    }}
                  />
                </CardContent>
              </Card>

              {selectedLecture && (selectedLecture.notesUrl || selectedLecture.pdfUrl) ? (
                <Card className="rounded-3xl border border-gray-200/90 bg-slate-50/50 shadow-sm ring-1 ring-gray-100/50">
                  <CardContent className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
                    <FileText className="h-5 w-5 shrink-0 text-orange-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">Resources for this lecture</p>
                      <p className="text-xs text-gray-600">Open notes & PDF from the Video / Notes / PDF tabs on the player, or use the links below.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedLecture.notesUrl ? (
                        <a
                          href={selectedLecture.notesUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-9 items-center justify-center rounded-xl border border-violet-200 bg-white px-3 text-sm font-semibold text-violet-800 transition hover:bg-violet-50"
                        >
                          Notes
                        </a>
                      ) : null}
                      {selectedLecture.pdfUrl ? (
                        <a
                          href={selectedLecture.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-9 items-center justify-center rounded-xl bg-violet-700 px-3 text-sm font-semibold text-white transition hover:bg-violet-800"
                        >
                          PDF
                        </a>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {selectedQuiz ? (
                <div id="quizzes" className="overflow-hidden rounded-3xl border border-gray-200/90 bg-white shadow-sm ring-1 ring-gray-100/60">
                  <div className="border-b border-gray-100 bg-violet-50/40 px-5 py-4 sm:px-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-violet-800">Quiz</div>
                        <div className="font-display text-xl font-bold text-gray-900">{selectedQuiz.title}</div>
                      </div>
                      <select
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 shadow-sm sm:w-auto"
                        value={selectedQuizId ?? ""}
                        onChange={(e) => setSelectedQuizId(e.target.value)}
                        aria-label="Select quiz"
                      >
                        {(quizzes ?? []).map((q) => (
                          <option key={q.id} value={q.id}>
                            {q.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="p-5 pt-4 sm:p-6 sm:pt-5">
                    <QuizPlayer
                      quiz={selectedQuiz}
                      accessToken={accessToken}
                      onAttemptFinished={async () => {
                        if (!accessToken) return;
                        const r = await fetch(`${API_BASE_URL}/api/lms/results/my`, {
                          method: "GET",
                          headers: { Authorization: `Bearer ${accessToken}` },
                          credentials: "include",
                        });
                        const data = await r.json().catch(() => null);
                        const attempts = (data?.attempts ?? []) as any[];
                        const map: Record<string, number> = {};
                        for (const a of attempts) {
                          const quizId = a?.quiz?.id ?? a?.quizId ?? null;
                          const score = typeof a?.score === "number" ? a.score : 0;
                          const total = typeof a?.total === "number" ? a.total : 0;
                          if (!quizId) continue;
                          const key = String(quizId);
                          if (map[key] === undefined) {
                            const pctVal = total > 0 ? Math.floor((score / total) * 100) : 0;
                            map[key] = pctVal;
                          }
                        }
                        setQuizProgressByQuizId(map);
                      }}
                    />
                  </div>
                </div>
              ) : null}

              <AssignmentsSection
                courseId={courseId}
                accessToken={accessToken}
                onSubmitted={() => {
                  // refresh could be added
                }}
              />
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-dashed border-gray-200 bg-slate-50/50 p-5 text-sm text-gray-600">
            Progress syncs automatically while you watch. Quiz scores count toward your course completion.
          </div>
        </>
      ) : null}

      {!loading ? (
        <div className="mt-8 flex flex-wrap gap-3">
          <Button type="button" variant="outline" className="rounded-2xl" onClick={() => router.push("/courses")}>
            Back to courses
          </Button>
          <Button type="button" className="rounded-2xl bg-violet-700 hover:bg-violet-800" onClick={() => router.push("/dashboard")}>
            Dashboard
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default function CourseDetailPage() {
  return (
    <Suspense fallback={<CourseDetailSkeleton />}>
      <CourseDetailInner />
    </Suspense>
  );
}
