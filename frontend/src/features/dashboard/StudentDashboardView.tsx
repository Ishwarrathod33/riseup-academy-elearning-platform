"use client";

import {
  Award,
  BarChart3,
  BookOpen,
  Brain,
  ClipboardList,
  CheckCircle2,
  GraduationCap,
  Radio,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DashboardTabBar,
  EmptyState,
  StudentProfileCard,
} from "./components";
import type { StudentDashboardVM } from "./hooks/useStudentDashboard";

export function StudentDashboardView(vm: StudentDashboardVM) {
  const {
    loading,
    error,
    tab,
    setTab,
    courses,
    payments,
    attendanceSessions,
    certificates,
    liveClasses,
    profile,
    pendingAssignments,
    submittedAssignments,
    resumeTarget,
    fallbackCourse,
    completedLessonsCount,
    weeklyProgressPct,
    navigateResume,
    refetch,
    router,
    formatINR,
    pct,
  } = vm;

  const hasCourses = courses.length > 0;
  const lastCourseTitle = resumeTarget?.courseTitle ?? fallbackCourse?.title ?? "";
  const lastCourseProgressPct = resumeTarget?.courseProgressPct ?? fallbackCourse?.progressPct ?? 0;
  const lastLessonTitle = resumeTarget?.lectureTitle ?? null;

  const quizCourseId = resumeTarget?.courseId ?? fallbackCourse?.id ?? courses[0]?.id ?? null;
  const firstLiveClass = liveClasses[0] as any | undefined;

  const recommendedCourses = [
    { title: "JEE Crash Course", level: "JEE", priceHint: "Best for 60–90 day prep" },
    { title: "MHT CET Complete", level: "MHT CET", priceHint: "Targeted practice + mocks" },
    { title: "Spoken English Sprint", level: "English", priceHint: "Daily speaking drills" },
    { title: "Math Problem Solving", level: "Mathematics", priceHint: "Concepts + fast practice" },
  ] as const;

  const progressWidth = `${Math.max(0, Math.min(100, Math.round(lastCourseProgressPct)))}%`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/80">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 md:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">RiseUp Academy</p>
            <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Your learning hub</h1>
            <p className="mt-2 max-w-lg text-sm text-gray-600">Track progress, payments, and classes — all in one place.</p>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm ring-1 ring-gray-100/60 md:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="h-16 w-16 shrink-0 animate-pulse rounded-2xl bg-violet-100" />
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                  <div className="h-7 w-48 max-w-full animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-full max-w-md animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-2xl border border-gray-100 bg-white shadow-sm ring-1 ring-gray-100/50"
                />
              ))}
            </div>
            <div className="h-36 animate-pulse rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-100/50 to-violet-50/50" />
            <div className="h-24 animate-pulse rounded-2xl border border-orange-100 bg-orange-50/40" />
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-100/60">
              <div className="mb-3 h-3 w-20 animate-pulse rounded bg-gray-200" />
              <div className="flex gap-2 overflow-hidden">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="h-10 w-24 shrink-0 animate-pulse rounded-2xl bg-gray-100" />
                ))}
              </div>
            </div>
          </div>
        ) : error ? (
          <Card className="mt-8 border-red-200/90 bg-red-50/90 shadow-sm ring-1 ring-red-100">
            <CardContent className="p-8">
              <p className="text-sm font-semibold text-red-900">{error}</p>
              <p className="mt-2 text-sm text-red-800/90">Check your connection and that the API is running.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  className="min-h-[44px] rounded-2xl bg-violet-700 shadow-sm hover:bg-violet-800"
                  onClick={() => refetch()}
                >
                  Try again
                </Button>
                <Button variant="outline" className="min-h-[44px] rounded-2xl" onClick={() => router.push("/login")}>
                  Back to login
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mt-8 space-y-6">
              <StudentProfileCard profile={profile} />

              {/* CONTINUE LEARNING */}
              <section className="rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/70 to-white p-5 shadow-sm ring-1 ring-violet-100/40 md:p-6">
                {hasCourses ? (
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Continue Learning</p>
                      <div className="inline-flex items-center gap-2 rounded-2xl bg-violet-100/60 px-3 py-1 text-xs font-semibold text-violet-800 ring-1 ring-violet-100/70">
                        <BookOpen className="h-4 w-4" />
                        Last accessed
                      </div>
                      <h2 className="font-display mt-3 text-lg font-bold text-gray-900 md:text-xl">
                        {lastCourseTitle}
                      </h2>
                      {lastLessonTitle ? (
                        <p className="mt-1 text-sm text-gray-600">
                          Resume from: <span className="font-semibold text-gray-900">{lastLessonTitle}</span>
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-gray-600">Pick up where you left off.</p>
                      )}

                      <div className="mt-4">
                        <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-gray-500">
                          <span>Progress</span>
                          <span className="tabular-nums text-violet-800">{pct(lastCourseProgressPct)}%</span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 ring-1 ring-inset ring-gray-100/80">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-600 via-violet-600 to-violet-500 transition-all duration-500 ease-out"
                            style={{ width: progressWidth }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Button
                        className="min-h-[44px] rounded-2xl bg-violet-700 px-6 font-semibold text-white shadow-sm transition hover:bg-violet-800 hover:shadow active:scale-[0.98]"
                        onClick={navigateResume}
                      >
                        Resume Learning
                      </Button>
                      <p className="mt-2 text-center text-xs text-gray-500">Continue your next lesson & quizzes.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 text-center">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Continue Learning</p>
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 ring-1 ring-violet-100/80">
                      <GraduationCap className="h-7 w-7" />
                    </div>
                    <h2 className="font-display text-xl font-bold text-gray-900">Start your first course today</h2>
                    <p className="max-w-md text-sm text-gray-600">
                      Browse our programs and begin learning with live classes and daily practice quizzes.
                    </p>
                    <Button
                      className="min-h-[44px] rounded-2xl bg-violet-700 px-6 font-semibold text-white shadow-sm transition hover:bg-violet-800 hover:shadow active:scale-[0.98]"
                      onClick={() => router.push("/courses")}
                    >
                      Browse Courses
                    </Button>
                  </div>
                )}
              </section>

              {/* QUICK ACTIONS */}
              <section>
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-bold text-gray-900 md:text-xl">Quick Actions</h2>
                    <p className="mt-1 text-sm text-gray-600">One tap to keep your momentum.</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <Card className="rounded-2xl border-gray-200/90 shadow-sm ring-1 ring-gray-100/60 transition hover:-translate-y-0.5 hover:border-violet-200/70 hover:shadow-md">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 ring-1 ring-violet-100/70">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-gray-900">Browse Courses</p>
                          <p className="mt-1 text-xs text-muted-foreground">Pick your next program</p>
                        </div>
                      </div>
                      <Button
                        className="mt-4 w-full rounded-2xl bg-violet-700 px-4 font-semibold text-white shadow-sm transition hover:bg-violet-800 active:scale-[0.98]"
                        onClick={() => router.push("/courses")}
                      >
                        Browse Courses
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-gray-200/90 shadow-sm ring-1 ring-gray-100/60 transition hover:-translate-y-0.5 hover:border-violet-200/70 hover:shadow-md">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 ring-1 ring-orange-100/70">
                          <Radio className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-gray-900">Join Live Class</p>
                          <p className="mt-1 text-xs text-muted-foreground">Start learning in real time</p>
                        </div>
                      </div>
                      <Button
                        className="mt-4 w-full rounded-2xl border border-orange-200/70 bg-white px-4 font-semibold text-orange-700 shadow-sm transition hover:bg-orange-50 active:scale-[0.98]"
                        onClick={() => {
                          if (firstLiveClass?.url) {
                            window.open(firstLiveClass.url as string, "_blank", "noreferrer");
                            return;
                          }
                          router.push("/courses");
                        }}
                      >
                        Join Live Class
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-gray-200/90 shadow-sm ring-1 ring-gray-100/60 transition hover:-translate-y-0.5 hover:border-violet-200/70 hover:shadow-md">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 ring-1 ring-violet-100/70">
                          <Brain className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-gray-900">Practice Quiz</p>
                          <p className="mt-1 text-xs text-muted-foreground">Test & improve quickly</p>
                        </div>
                      </div>
                      <Button
                        className="mt-4 w-full rounded-2xl bg-violet-700 px-4 font-semibold text-white shadow-sm transition hover:bg-violet-800 active:scale-[0.98]"
                        onClick={() => {
                          if (quizCourseId) {
                            router.push(`/courses/${encodeURIComponent(quizCourseId)}#quizzes`);
                            return;
                          }
                          router.push("/courses");
                        }}
                      >
                        Practice Quiz
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* MY COURSES */}
              <section>
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-bold text-gray-900 md:text-xl">My Courses</h2>
                    <p className="mt-1 text-sm text-gray-600">Keep track of your progress in one place.</p>
                  </div>
                </div>

                {courses.length ? (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-2">
                    {courses.map((c) => {
                      const width = `${Math.max(0, Math.min(100, Math.round(c.progressPct)))}%`;
                      return (
                        <Card
                          key={c.id}
                          className="group rounded-2xl border-gray-200/90 bg-white shadow-sm ring-1 ring-gray-100/50 transition duration-200 hover:border-violet-200/70 hover:shadow-md"
                        >
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-800 ring-1 ring-violet-100/70">
                                  {c.level}
                                </span>
                                <h3 className="font-display mt-2 truncate text-lg font-bold text-gray-900">{c.title}</h3>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-sm font-bold text-gray-900">{pct(c.progressPct)}%</p>
                                <p className="text-xs text-gray-500">Progress</p>
                              </div>
                            </div>

                            <div className="mt-4">
                              <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 ring-1 ring-inset ring-gray-100/80">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-violet-600 via-violet-600 to-violet-500 transition-all duration-500 ease-out"
                                  style={{ width }}
                                />
                              </div>
                            </div>

                            <Button
                              className="mt-5 w-full rounded-2xl bg-violet-700 px-4 font-semibold text-white shadow-sm transition hover:bg-violet-800 active:scale-[0.98]"
                              onClick={() => router.push(`/courses/${encodeURIComponent(c.id)}`)}
                            >
                              Continue
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200/90 bg-gradient-to-b from-slate-50 to-white px-5 py-12 text-center shadow-sm">
                    <p className="font-display text-lg font-bold text-gray-900">Start your first course today</p>
                    <p className="mt-2 text-sm text-gray-600">Explore programs and begin learning right away.</p>
                    <Button
                      className="mt-5 rounded-2xl bg-violet-700 px-6 font-semibold text-white shadow-sm transition hover:bg-violet-800 active:scale-[0.98]"
                      onClick={() => router.push("/courses")}
                    >
                      Browse Courses
                    </Button>
                  </div>
                )}
              </section>

              {/* RECOMMENDED COURSES */}
              <section>
                <div className="mb-3">
                  <h2 className="font-display text-lg font-bold text-gray-900 md:text-xl">Recommended Courses</h2>
                  <p className="mt-1 text-sm text-gray-600">Based on what students like you are learning.</p>
                </div>

                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  {recommendedCourses.map((rc) => (
                    <Card
                      key={rc.title}
                      className="rounded-2xl border-gray-200/90 bg-white shadow-sm ring-1 ring-gray-100/50 transition hover:border-violet-200/70 hover:shadow-md"
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <span className="inline-flex rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-700 ring-1 ring-orange-100/70">
                              {rc.level}
                            </span>
                            <h3 className="font-display mt-2 text-base font-bold text-gray-900">{rc.title}</h3>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">{rc.priceHint}</p>
                        <Button
                          className="mt-4 w-full rounded-2xl bg-violet-700 px-4 font-semibold text-white shadow-sm transition hover:bg-violet-800 active:scale-[0.98]"
                          onClick={() => router.push("/courses")}
                        >
                          Explore
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {/* PROGRESS ANALYTICS */}
              <section>
                <div className="mb-3">
                  <h2 className="font-display text-lg font-bold text-gray-900 md:text-xl">Progress Analytics</h2>
                  <p className="mt-1 text-sm text-gray-600">Your week at a glance.</p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Card className="rounded-2xl border-gray-200/90 bg-white shadow-sm ring-1 ring-gray-100/50">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-violet-700" />
                        <p className="font-display text-sm font-bold text-gray-900">Weekly progress</p>
                      </div>
                      <p className="mt-3 text-3xl font-bold text-violet-800">{pct(weeklyProgressPct)}%</p>
                      <div className="mt-3">
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 ring-1 ring-inset ring-gray-100/80">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-600 via-violet-600 to-violet-500 transition-all duration-500 ease-out"
                            style={{ width: `${Math.max(0, Math.min(100, Math.round(weeklyProgressPct)))}%` }}
                          />
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">Last 7 days</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-gray-200/90 bg-white shadow-sm ring-1 ring-gray-100/50">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-orange-600" />
                        <p className="font-display text-sm font-bold text-gray-900">Completed lessons</p>
                      </div>
                      <p className="mt-3 text-3xl font-bold text-gray-900">{completedLessonsCount}</p>
                      <p className="mt-2 text-sm text-muted-foreground">Keep going — consistency wins.</p>
                    </CardContent>
                  </Card>
                </div>
              </section>

              <div className="rounded-2xl border border-gray-200/90 bg-white p-4 shadow-sm ring-1 ring-gray-100/60 md:p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Sections</p>
                <DashboardTabBar
                  tab={tab}
                  onChange={setTab}
                  badges={{ }}
                />
              </div>
            </div>

            <div className="mt-8 pb-10">
              {tab === "courses" ? (
                <div className="space-y-4">
                  {courses.length ? (
                    <div className="grid gap-4 md:grid-cols-2 md:gap-5">
                      {courses.map((c) => (
                        <Card
                          key={c.id}
                          className="group overflow-hidden rounded-2xl border-gray-200/90 bg-white shadow-sm ring-1 ring-gray-100/50 transition duration-200 hover:border-violet-200/80 hover:shadow-md"
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <span className="inline-block rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-800 ring-1 ring-violet-100">
                                  {c.level}
                                </span>
                                <h3 className="font-display mt-2 text-lg font-bold text-gray-900 transition group-hover:text-violet-900">
                                  {c.title}
                                </h3>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-sm font-bold text-gray-900">{formatINR(c.price, c.currency)}</p>
                                <p className="text-xs text-gray-500">Enrolled</p>
                              </div>
                            </div>
                            <p className="mt-3 text-xs font-medium text-gray-600">
                              Lectures:{" "}
                              <span className="tabular-nums text-gray-900">
                                {c.completedLectures}/{c.totalLectures || "—"}
                              </span>{" "}
                              completed
                            </p>
                            <div className="mt-4">
                              <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-gray-500">
                                <span>Course progress</span>
                                <span className="tabular-nums text-violet-800">{pct(c.progressPct)}%</span>
                              </div>
                              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 ring-1 ring-inset ring-gray-100/80">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-violet-600 via-violet-600 to-violet-500 transition-all duration-500 ease-out"
                                  style={{ width: `${pct(c.progressPct)}%` }}
                                />
                              </div>
                            </div>
                            <div className="mt-5 flex flex-wrap gap-2">
                              <Button
                                className="min-h-[44px] flex-1 rounded-2xl bg-violet-700 font-semibold shadow-sm transition hover:bg-violet-800 hover:shadow active:scale-[0.98]"
                                onClick={() => router.push(`/courses/${encodeURIComponent(c.id)}`)}
                              >
                                Continue
                              </Button>
                              <Button
                                variant="outline"
                                className="min-h-[44px] flex-1 rounded-2xl border-gray-200 font-semibold transition hover:border-violet-200 hover:bg-violet-50 active:scale-[0.98]"
                                onClick={() => router.push(`/courses/${encodeURIComponent(c.id)}#quizzes`)}
                              >
                                Take Quiz
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={GraduationCap}
                      title="No courses yet"
                      description="Explore our catalog and enroll to unlock lessons, quizzes, and assignments tailored to your goals."
                      actionLabel="Explore Courses"
                      onAction={() => router.push("/courses")}
                    />
                  )}
                </div>
              ) : null}

              {tab === "payments" ? (
                <Card className="rounded-2xl border-gray-200/90 shadow-sm ring-1 ring-gray-100/50">
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-violet-600" />
                      <h2 className="font-display text-lg font-bold">Payment history</h2>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">Secure payments recorded for your account.</p>
                    <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-200">
                      <table className="min-w-[720px] w-full border-separate border-spacing-0 text-sm">
                        <thead>
                          <tr className="bg-violet-50/80 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            <th className="px-4 py-3">Course</th>
                            <th className="px-4 py-3">Amount</th>
                            <th className="px-4 py-3">Method</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.length ? (
                            payments.map((p: any) => (
                              <tr key={p.id} className="border-t border-gray-200 transition hover:bg-violet-50/40">
                                <td className="px-4 py-4">
                                  <div className="font-semibold text-gray-900">{p.course?.title ?? "—"}</div>
                                  <div className="text-xs text-muted-foreground">{p.course?.level ?? ""}</div>
                                </td>
                                <td className="px-4 py-4 font-semibold">{formatINR(Number(p.amount ?? 0), p.currency ?? "INR")}</td>
                                <td className="px-4 py-4 text-muted-foreground">{p.method ?? "—"}</td>
                                <td className="px-4 py-4">
                                  <span
                                    className={`inline-flex rounded-xl px-2.5 py-1 text-xs font-semibold ${
                                      p.status === "PAID"
                                        ? "border border-green-200 bg-green-50 text-green-800"
                                        : p.status === "FAILED"
                                          ? "border border-red-200 bg-red-50 text-red-800"
                                          : "border border-violet-100 bg-secondary text-foreground"
                                    }`}
                                  >
                                    {p.status}
                                  </span>
                                </td>
                                <td className="px-4 py-4 text-muted-foreground">
                                  {p.createdAt ? new Date(p.createdAt).toLocaleString() : "—"}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="px-4 py-14 text-center">
                                <Wallet className="mx-auto h-10 w-10 text-violet-300" />
                                <p className="mt-3 font-semibold text-gray-900">No payments yet</p>
                                <p className="mt-1 text-sm text-muted-foreground">Enroll in a course to see your receipts here.</p>
                                <Button className="mt-4 rounded-2xl bg-violet-700 hover:bg-violet-800" onClick={() => router.push("/courses")}>
                                  Browse courses
                                </Button>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {tab === "attendance" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {attendanceSessions.length ? (
                    attendanceSessions.map((s: any) => {
                      const status = s.record?.status as string | undefined;
                      const note = s.record?.note as string | undefined;
                      const statusColor =
                        status === "PRESENT"
                          ? "border-green-200 bg-green-50 text-green-800"
                          : status === "ABSENT"
                            ? "border-red-200 bg-red-50 text-red-800"
                            : status === "LEAVE"
                              ? "border-amber-200 bg-amber-50 text-amber-900"
                              : "border-violet-100 bg-secondary text-foreground";
                      return (
                        <Card key={s.id} className="rounded-2xl border-gray-200/90 shadow-sm ring-1 ring-gray-100/50 transition-shadow hover:border-violet-100 hover:shadow-md">
                          <CardContent className="p-6">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.title}</p>
                            <p className="mt-1 font-display text-lg font-bold text-gray-900">{new Date(s.startsAt).toLocaleString()}</p>
                            <div className="mt-4">
                              <span className={`inline-flex rounded-xl border px-3 py-1 text-xs font-semibold ${statusColor}`}>
                                {status ?? "NOT MARKED"}
                              </span>
                            </div>
                            {note ? <p className="mt-3 text-sm text-muted-foreground">Note: {note}</p> : null}
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <div className="md:col-span-2">
                      <EmptyState
                        icon={ClipboardList}
                        title="No attendance records"
                        description="Your class attendance will show up here once your institute marks sessions."
                        actionLabel="View courses"
                        onAction={() => router.push("/courses")}
                      />
                    </div>
                  )}
                </div>
              ) : null}

              

              {tab === "certificates" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {certificates.length ? (
                    certificates.map((c: any) => (
                      <Card key={c.id} className="rounded-2xl border-gray-200/90 shadow-sm ring-1 ring-gray-100/50 transition-shadow hover:border-violet-100 hover:shadow-md">
                        <CardContent className="p-6">
                          <p className="text-xs font-semibold uppercase text-muted-foreground">{c.course?.level ?? "Certificate"}</p>
                          <p className="font-display mt-1 text-lg font-bold">{c.course?.title ?? "—"}</p>
                          <p className="mt-2 text-sm text-muted-foreground">{c.issuedAt ? `Issued ${new Date(c.issuedAt).toLocaleDateString()}` : "—"}</p>
                          <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/30 p-4 text-sm text-muted-foreground">
                            {c.metadata ? "Certificate metadata on file." : "Certificate details will appear when issued."}
                          </div>
                          <Button
                             className="mt-4 w-full rounded-2xl bg-violet-700 hover:bg-violet-800"
                              onClick={() => {
                                window.location.href =
                                  `http://localhost:8080/api/lms/certificates/${c.id}/download`;
                              }}
                          >
                            Download Certificate
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="md:col-span-2">
                      <EmptyState
                        icon={Award}
                        title="No certificates yet"
                        description="Complete courses and assessments to earn certificates."
                        actionLabel="Explore courses"
                        onAction={() => router.push("/courses")}
                      />
                    </div>
                  )}
                </div>
              ) : null}

              {tab === "live" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {liveClasses.length ? (
                    liveClasses.map((lc: any) => (
                      <Card key={lc.id} className="rounded-2xl border-gray-200/90 shadow-sm ring-1 ring-gray-100/50 transition-shadow hover:border-violet-100 hover:shadow-md">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <Radio className="h-4 w-4 text-red-500" />
                            Live
                          </div>
                          <p className="font-display mt-2 text-lg font-bold text-gray-900">{lc.title}</p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {lc.startsAt ? `Starts: ${new Date(lc.startsAt).toLocaleString()}` : "Schedule TBA"}
                          </p>
                          <a
                            href={lc.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-800"
                          >
                            Join live class
                          </a>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="md:col-span-2">
                      <EmptyState
                        icon={Radio}
                        title="No live classes scheduled"
                        description="When your teachers schedule live sessions, they will appear here with join links."
                        actionLabel="Browse courses"
                        onAction={() => router.push("/courses")}
                      />
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
