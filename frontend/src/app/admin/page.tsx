"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL, apiFetch } from "@/lib/api";
import { STORAGE_KEYS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Course = {
  id: string;
  title: string;
  tagline?: string | null;
  description?: string | null;
  level: string;
  price: number;
  currency: string;
  demoVideoUrl?: string | null;
  coverImageUrl?: string | null;
  subjects?: Array<{ id?: string; name: string }>;
};

type Lecture = {
  id: string;
  title: string;
  videoUrl: string;
  notesUrl?: string | null;
  pdfUrl?: string | null;
  sequence: number;
  durationSec?: number | null;
};

type QuizQuestionDraft = {
  prompt: string;
  options: string[];
  correctIndex: number;
  marks: number;
};

type QuizDraft = {
  title: string;
  description?: string;
  totalMarks: number;
  passingScore: number;
  questions: QuizQuestionDraft[];
};

type AssignmentDraft = {
  title: string;
  description?: string;
  dueAt?: string;
};

type StudentRow = {
  userId: string;
  email?: string | null;
  phone?: string | null;
  progressPct: number;
  attendance: { present: number; absent: number; leave: number; attendancePct: number };
};

type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  audience: string;
  course?: { id: string; title: string; level?: string | null } | null;
  createdAt: string;
};

type AttendanceSessionRow = { id: string; title: string; startsAt: string };

type AttendanceStudentMarking = {
  userId: string;
  email?: string | null;
  phone?: string | null;
  status: "PRESENT" | "ABSENT" | "LEAVE" | null;
  note: string | null;
  recordedAt: string | null;
};

type MarkingFormRow = {
  userId: string;
  status: "PRESENT" | "ABSENT" | "LEAVE";
  note?: string;
};

type AdminSection = "courses" | "lectures" | "content" | "students" | "announcements" | "attendance";

function ProgressBar({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(100, Math.round(value || 0)));
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${safe}%` }} />
    </div>
  );
}

async function uploadAdminFile(params: { token: string; file: File }) {
  const form = new FormData();
  form.append("file", params.file);
  const r = await fetch(`${API_BASE_URL}/api/admin/uploads`, {
    method: "POST",
    headers: { Authorization: `Bearer ${params.token}` },
    body: form,
    credentials: "include",
  });
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error(data?.error ?? "Upload failed");
  return data?.url as string;
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [token, setToken] = React.useState<string | null>(null);
  const [section, setSection] = React.useState<AdminSection>("courses");

  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const [courses, setCourses] = React.useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = React.useState<string>("");

  // Courses modal (add/edit)
  const [courseModalOpen, setCourseModalOpen] = React.useState(false);
  const [editingCourseId, setEditingCourseId] = React.useState<string | null>(null);
  const [courseForm, setCourseForm] = React.useState({
    title: "",
    tagline: "",
    description: "",
    level: "",
    price: "0",
    currency: "INR",
    subjectsCsv: "",
    demoVideoFile: null as File | null,
    coverImageFile: null as File | null,
    demoVideoUrl: "",
    coverImageUrl: "",
  });

  const [lectures, setLectures] = React.useState<Lecture[]>([]);
  const [lectureForm, setLectureForm] = React.useState({
    title: "",
    sequence: 0,
    durationSec: "",
    videoFile: null as File | null,
    notesFile: null as File | null,
    pdfFile: null as File | null,
  });

  const [quizDraft, setQuizDraft] = React.useState<QuizDraft>({
    title: "",
    description: "",
    totalMarks: 100,
    passingScore: 40,
    questions: [
      { prompt: "", options: ["", "", "", ""], correctIndex: 0, marks: 1 },
    ],
  });

  const [assignmentDraft, setAssignmentDraft] = React.useState<AssignmentDraft>({
    title: "",
    description: "",
    dueAt: "",
  });

  const [students, setStudents] = React.useState<StudentRow[]>([]);

  const [announcements, setAnnouncements] = React.useState<AnnouncementRow[]>([]);
  const [announcementForm, setAnnouncementForm] = React.useState({
    title: "",
    body: "",
    audience: "ALL" as "ALL" | "STUDENTS" | "ADMINS",
    courseId: "",
  });

  const [attendanceSessions, setAttendanceSessions] = React.useState<AttendanceSessionRow[]>([]);
  const [selectedSessionId, setSelectedSessionId] = React.useState<string>("");
  const [attendanceCreateForm, setAttendanceCreateForm] = React.useState({ title: "", startsAt: "" });
  const [attendanceMarkingStudents, setAttendanceMarkingStudents] = React.useState<AttendanceStudentMarking[]>([]);
  const [attendanceMarkingForm, setAttendanceMarkingForm] = React.useState<MarkingFormRow[]>([]);

  React.useEffect(() => {
    const t = localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!t) {
      router.push("/login");
      return;
    }
    setToken(t);
  }, [router]);

  async function loadCourses() {
    const data = await fetch(`${API_BASE_URL}/api/courses`, { cache: "no-store" }).then((r) => r.json());
    const list = data?.courses ?? [];
    setCourses(list);
    if (!selectedCourseId && list[0]?.id) setSelectedCourseId(list[0].id);
  }

  async function loadLectures(courseId: string) {
    const data = await fetch(`${API_BASE_URL}/api/courses/${encodeURIComponent(courseId)}`, { cache: "no-store" }).then((r) =>
      r.ok ? r.json() : null
    );
    const lecturesList = data?.course?.lectures ?? [];
    // Ensure sequence sort.
    lecturesList.sort((a: any, b: any) => (a.sequence ?? 0) - (b.sequence ?? 0));
    setLectures(lecturesList);
  }

  async function loadAnnouncements() {
    if (!token) return;
    const data = await apiFetch<{ announcements: AnnouncementRow[] }>("/api/admin/announcements", {
      method: "GET",
    });
    setAnnouncements(data.announcements ?? []);
  }

  React.useEffect(() => {
    if (!token) return;
    setError(null);
    setSuccess(null);
    loadCourses().catch((e: any) => setError(e?.message ?? "Failed to load courses"));
    loadAnnouncements().catch(() => {});
  }, [token]);

  React.useEffect(() => {
    if (!selectedCourseId) return;
    loadLectures(selectedCourseId).catch(() => {});
  }, [selectedCourseId]);

  React.useEffect(() => {
    // When the lecture list changes, auto-suggest the next sequence number
    // if the admin hasn't typed a lecture title yet.
    setLectureForm((prev) => {
      if (prev.title.trim()) return prev;
      const lastSeq = lectures.length ? lectures[lectures.length - 1]?.sequence ?? 0 : 0;
      return { ...prev, sequence: lastSeq + 1 };
    });
  }, [lectures]);

  async function onOpenAddCourse() {
    setEditingCourseId(null);
    setCourseForm({
      title: "",
      tagline: "",
      description: "",
      level: "",
      price: "0",
      currency: "INR",
      subjectsCsv: "",
      demoVideoFile: null,
      coverImageFile: null,
      demoVideoUrl: "",
      coverImageUrl: "",
    });
    setCourseModalOpen(true);
  }

  async function onOpenEditCourse(course: Course) {
    setEditingCourseId(course.id);
    setCourseForm({
      title: course.title ?? "",
      tagline: course.tagline ?? "",
      description: course.description ?? "",
      level: course.level ?? "",
      price: String(course.price ?? 0),
      currency: course.currency ?? "INR",
      subjectsCsv: (course.subjects ?? []).map((s) => s.name).join(", "),
      demoVideoFile: null,
      coverImageFile: null,
      demoVideoUrl: course.demoVideoUrl ?? "",
      coverImageUrl: course.coverImageUrl ?? "",
    });
    setCourseModalOpen(true);
  }

  async function onSaveCourse() {
    if (!token) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const price = Number(courseForm.price);
      if (!Number.isFinite(price) || price < 0) throw new Error("Invalid price");
      const payload = {
        title: courseForm.title,
        description: courseForm.description || undefined,
        level: courseForm.level,
        price,
      };

      if (!editingCourseId) {
        await apiFetch<{ course: Course }>("/api/courses", {
          method: "POST",
          json: payload,
        });
        setSuccess("Course created.");
      } else {
        await apiFetch(`/api/courses/${editingCourseId}`, {
          method: "PUT",
          json: payload,
        });
        setSuccess("Course updated.");
      }

      setCourseModalOpen(false);
      await loadCourses();
    } catch (e: any) {
      setError(e?.message ?? "Failed to save course");
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteCourse(courseId: string) {
    if (!token) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await apiFetch(`/api/courses/${courseId}`, { method: "DELETE" });
      setSuccess("Course deleted.");
      await loadCourses();
      if (selectedCourseId === courseId) setSelectedCourseId(courses[0]?.id ?? "");
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete course");
    } finally {
      setBusy(false);
    }
  }

  async function onUploadLecture() {
    if (!token) return;
    if (!selectedCourseId) return;
    if (!lectureForm.title.trim()) return setError("Lecture title required.");
    if (!lectureForm.videoFile) return setError("Video file required.");
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const videoUrl = await uploadAdminFile({ token, file: lectureForm.videoFile });
      const notesUrl = lectureForm.notesFile ? await uploadAdminFile({ token, file: lectureForm.notesFile }) : undefined;
      const pdfUrl = lectureForm.pdfFile ? await uploadAdminFile({ token, file: lectureForm.pdfFile }) : undefined;

      await apiFetch(`/api/admin/courses/${encodeURIComponent(selectedCourseId)}/lectures`, {
        method: "POST",
        json: {
          title: lectureForm.title.trim(),
          videoUrl,
          notesUrl,
          pdfUrl,
          sequence: lectureForm.sequence ?? 0,
          durationSec: lectureForm.durationSec ? Number(lectureForm.durationSec) : undefined,
        },
      });

      setSuccess("Lecture uploaded.");
      setLectureForm({
        title: "",
        sequence: lectures.length ? lectures[lectures.length - 1]?.sequence + 1 : 0,
        durationSec: "",
        videoFile: null,
        notesFile: null,
        pdfFile: null,
      });
      await loadLectures(selectedCourseId);
    } catch (e: any) {
      setError(e?.message ?? "Failed to upload lecture");
    } finally {
      setBusy(false);
    }
  }

  async function onCreateQuiz() {
    if (!token) return;
    if (!selectedCourseId) return;
    if (!quizDraft.title.trim()) return setError("Quiz title required.");
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        title: quizDraft.title.trim(),
        description: quizDraft.description?.trim() || undefined,
        totalMarks: Number(quizDraft.totalMarks),
        passingScore: Number(quizDraft.passingScore),
        questions: quizDraft.questions.map((q) => ({
          prompt: q.prompt.trim(),
          options: (() => {
            const optionVals = q.options.map((o) => o.trim());
            const correctVal = optionVals[q.correctIndex];
            if (!correctVal) throw new Error("Correct option must be filled for every question.");

            const nonEmpty = optionVals.filter(Boolean);
            if (nonEmpty.length < 2) throw new Error("Each question must have at least 2 filled options.");

            const idx = nonEmpty.indexOf(correctVal);
            if (idx < 0) throw new Error("Correct option not found among filled options.");

            // Keep only filled options (backend stores optionsJson and correctIndex refers to this list).
            return nonEmpty;
          })(),
          correctIndex: (() => {
            const optionVals = q.options.map((o) => o.trim());
            const correctVal = optionVals[q.correctIndex];
            const nonEmpty = optionVals.filter(Boolean);
            return Math.max(0, nonEmpty.indexOf(correctVal));
          })(),
          marks: Number(q.marks),
        })),
      };

      if (payload.questions.some((q: any) => !q.prompt || !q.options || q.options.length < 2)) {
        throw new Error("Fix quiz questions/options.");
      }
      await apiFetch(`/api/admin/courses/${encodeURIComponent(selectedCourseId)}/quizzes`, {
        method: "POST",
        json: payload,
      });

      setSuccess("Quiz created.");
      setQuizDraft({
        title: "",
        description: "",
        totalMarks: 100,
        passingScore: 40,
        questions: [{ prompt: "", options: ["", "", "", ""], correctIndex: 0, marks: 1 }],
      });
    } catch (e: any) {
      setError(e?.message ?? "Failed to create quiz");
    } finally {
      setBusy(false);
    }
  }

  async function onCreateAssignment() {
    if (!token) return;
    if (!selectedCourseId) return;
    if (!assignmentDraft.title.trim()) return setError("Assignment title required.");
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const dueIso = assignmentDraft.dueAt ? new Date(assignmentDraft.dueAt).toISOString() : undefined;
      await apiFetch(`/api/admin/courses/${encodeURIComponent(selectedCourseId)}/assignments`, {
        method: "POST",
        json: {
          title: assignmentDraft.title.trim(),
          description: assignmentDraft.description?.trim() || undefined,
          dueAt: dueIso,
        },
      });

      setSuccess("Assignment created.");
      setAssignmentDraft({ title: "", description: "", dueAt: "" });
    } catch (e: any) {
      setError(e?.message ?? "Failed to create assignment");
    } finally {
      setBusy(false);
    }
  }

  async function loadStudentsForCourse(courseId: string) {
    if (!token) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await apiFetch<{ course: any; students: StudentRow[] }>(`/api/admin/students?courseId=${encodeURIComponent(courseId)}`, {
        method: "GET",
      });
      setStudents(data.students ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load students");
    } finally {
      setBusy(false);
    }
  }

  React.useEffect(() => {
    if (!token) return;
    if (section === "students" && selectedCourseId) {
      loadStudentsForCourse(selectedCourseId).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, selectedCourseId, token]);

  async function onCreateAnnouncement() {
    if (!token) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await apiFetch("/api/admin/announcements", {
        method: "POST",
        json: {
          title: announcementForm.title.trim(),
          body: announcementForm.body.trim(),
          audience: announcementForm.audience,
          courseId: announcementForm.courseId ? announcementForm.courseId : undefined,
        },
      });
      setSuccess("Announcement posted.");
      setAnnouncementForm({ title: "", body: "", audience: "ALL", courseId: "" });
      await loadAnnouncements();
    } catch (e: any) {
      setError(e?.message ?? "Failed to post announcement");
    } finally {
      setBusy(false);
    }
  }

  async function loadAttendanceSessions(courseId: string) {
    const data = await apiFetch<{ sessions: AttendanceSessionRow[] }>(`/api/admin/courses/${encodeURIComponent(courseId)}/attendance-sessions`, {
      method: "GET",
    });
    setAttendanceSessions(data.sessions ?? []);
    if (!data.sessions?.length) setSelectedSessionId("");
    else if (!selectedSessionId) setSelectedSessionId(data.sessions[0].id);
  }

  async function loadAttendanceMarkingData(sessionId: string) {
    const data = await apiFetch<{
      session: AttendanceSessionRow & { course: { id: string; title: string } };
      students: AttendanceStudentMarking[];
    }>(`/api/admin/attendance-sessions/${encodeURIComponent(sessionId)}/marking-data`, { method: "GET" });

    setAttendanceMarkingStudents(data.students ?? []);
    // Default marking form rows.
    setAttendanceMarkingForm(
      (data.students ?? []).map((s) => ({
        userId: s.userId,
        status: (s.status ?? "PRESENT") as any,
        note: s.note ?? undefined,
      }))
    );
  }

  React.useEffect(() => {
    if (!token) return;
    if (section !== "attendance") return;
    if (!selectedCourseId) return;
    loadAttendanceSessions(selectedCourseId).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, selectedCourseId, token]);

  React.useEffect(() => {
    if (!token) return;
    if (section !== "attendance") return;
    if (!selectedSessionId) return;
    loadAttendanceMarkingData(selectedSessionId).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSessionId, section, token]);

  async function onCreateAttendanceSession() {
    if (!token) return;
    if (!selectedCourseId) return;
    if (!attendanceCreateForm.title.trim()) return setError("Session title required.");
    if (!attendanceCreateForm.startsAt) return setError("Start time required.");
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const startsIso = attendanceCreateForm.startsAt ? new Date(attendanceCreateForm.startsAt).toISOString() : undefined;
      if (!startsIso) throw new Error("Invalid start time");
      await apiFetch(`/api/admin/courses/${encodeURIComponent(selectedCourseId)}/attendance-sessions`, {
        method: "POST",
        json: { title: attendanceCreateForm.title.trim(), startsAt: startsIso },
      });
      setSuccess("Attendance session created.");
      setAttendanceCreateForm({ title: "", startsAt: "" });
      await loadAttendanceSessions(selectedCourseId);
    } catch (e: any) {
      setError(e?.message ?? "Failed to create attendance session");
    } finally {
      setBusy(false);
    }
  }

  async function onSaveAttendanceMarks() {
    if (!token) return;
    if (!selectedSessionId) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        records: attendanceMarkingForm.map((r) => ({
          userId: r.userId,
          status: r.status,
          note: r.note ?? undefined,
        })),
      };
      await apiFetch(`/api/admin/attendance-sessions/${encodeURIComponent(selectedSessionId)}/mark`, {
        method: "POST",
        json: payload,
      });
      setSuccess("Attendance saved.");
      await loadAttendanceMarkingData(selectedSessionId);
    } catch (e: any) {
      setError(e?.message ?? "Failed to save attendance");
    } finally {
      setBusy(false);
    }
  }

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) ?? null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm font-semibold text-primary">Admin</div>
          <div className="mt-1 text-2xl font-bold">RiseUp Academy Control Panel</div>
          <div className="mt-2 text-sm text-muted-foreground">
            Manage courses, lectures, quizzes, assignments, students, attendance, and announcements.
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => router.push("/courses")}>
            Student View
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              localStorage.removeItem(STORAGE_KEYS.accessToken);
              router.push("/login");
            }}
          >
            Logout
          </Button>
        </div>
      </div>

      {error ? <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {success ? (
        <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{success}</div>
      ) : null}

      <div className="mt-7 grid gap-6 md:grid-cols-[280px_1fr]">
        <Card className="rounded-3xl border bg-background p-3 shadow-soft">
          <CardHeader className="p-4">
            <CardTitle className="text-base">Dashboard Sections</CardTitle>
            <CardDescription>Select a module.</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              {(
                [
                  ["courses", "Course Management"],
                  ["lectures", "Lectures Upload"],
                  ["content", "Quizzes & Assignments"],
                  ["students", "Students & Progress"],
                  ["announcements", "Announcements"],
                  ["attendance", "Attendance Marking"],
                ] as Array<[AdminSection, string]>
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSection(id)}
                  className={`w-full rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition ${
                    section === id ? "border-primary bg-primary/10" : "bg-background hover:bg-secondary/50 text-muted-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
              <div className="text-sm font-semibold text-muted-foreground">Course context</div>
              <select
                className="w-full rounded-2xl border bg-background px-4 py-3 text-sm"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.level})
                  </option>
                ))}
              </select>
              <Button variant="outline" onClick={() => onOpenAddCourse()}>
                Add Course
              </Button>
            </div>
          </div>

          {section === "courses" ? (
            <Card className="rounded-3xl shadow-soft">
              <CardHeader>
                <CardTitle>Course Management</CardTitle>
                <CardDescription>Add, edit, or deactivate courses.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {!courses.length ? (
                  <div className="rounded-2xl border bg-background p-6 text-sm text-muted-foreground">
                    No courses yet. Click <span className="font-semibold text-primary">Add Course</span>.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {courses.map((c) => (
                      <div key={c.id} className="rounded-3xl border bg-background p-5 animate-fade-up">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-primary">{c.level}</div>
                            <div className="mt-1 text-lg font-bold">{c.title}</div>
                            <div className="mt-2 text-sm font-semibold">
                              {c.currency} {c.price}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button onClick={() => onOpenEditCourse(c)} size="sm">
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onDeleteCourse(c.id)}
                              disabled={busy}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {section === "lectures" ? (
            <Card className="rounded-3xl shadow-soft">
              <CardHeader>
                <CardTitle>Lecture Upload</CardTitle>
                <CardDescription>Upload video, notes, and PDFs for the selected course.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-6 md:grid-cols-[420px_1fr]">
                  <div className="rounded-3xl border bg-background p-5">
                    <div className="text-sm font-semibold text-primary">Upload new lecture</div>
                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground">Lecture Title</div>
                        <input
                          className="mt-2 w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none"
                          value={lectureForm.title}
                          onChange={(e) => setLectureForm((p) => ({ ...p, title: e.target.value }))}
                        />
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground">Sequence</div>
                          <input
                            type="number"
                            className="mt-2 w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none"
                            value={lectureForm.sequence}
                            onChange={(e) => setLectureForm((p) => ({ ...p, sequence: Number(e.target.value) }))}
                          />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground">Duration (sec)</div>
                          <input
                            type="number"
                            className="mt-2 w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none"
                            value={lectureForm.durationSec}
                            onChange={(e) => setLectureForm((p) => ({ ...p, durationSec: e.target.value }))}
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground">Video (required)</div>
                        <input
                          type="file"
                          accept="video/*"
                          className="mt-2 w-full text-sm"
                          onChange={(e) => setLectureForm((p) => ({ ...p, videoFile: e.target.files?.[0] ?? null }))}
                        />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground">Notes (optional)</div>
                        <input
                          type="file"
                          className="mt-2 w-full text-sm"
                          onChange={(e) => setLectureForm((p) => ({ ...p, notesFile: e.target.files?.[0] ?? null }))}
                        />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground">PDF (optional)</div>
                        <input
                          type="file"
                          accept=".pdf,image/*,.doc,.docx"
                          className="mt-2 w-full text-sm"
                          onChange={(e) => setLectureForm((p) => ({ ...p, pdfFile: e.target.files?.[0] ?? null }))}
                        />
                      </div>
                      <Button className="w-full" onClick={onUploadLecture} disabled={busy || !selectedCourseId}>
                        {busy ? "Uploading..." : "Upload Lecture"}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-primary">Existing Lectures</div>
                    <div className="mt-3 space-y-3">
                      {lectures.length ? (
                        lectures.map((l) => (
                          <div key={l.id} className="rounded-3xl border bg-background p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold">{l.sequence}. {l.title}</div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                  Video: {l.videoUrl ? "Ready" : "—"} · Notes: {l.notesUrl ? "Yes" : "No"} · PDF: {l.pdfUrl ? "Yes" : "No"}
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">ID: {l.id.slice(0, 8)}…</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-3xl border bg-background p-6 text-sm text-muted-foreground">No lectures uploaded yet.</div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {section === "content" ? (
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="rounded-3xl shadow-soft">
                <CardHeader>
                  <CardTitle>Quiz Creation</CardTitle>
                  <CardDescription>Create MCQ quizzes with scoring.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground">Quiz Title</div>
                      <input
                        className="mt-2 w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none"
                        value={quizDraft.title}
                        onChange={(e) => setQuizDraft((p) => ({ ...p, title: e.target.value }))}
                      />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground">Description (optional)</div>
                      <input
                        className="mt-2 w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none"
                        value={quizDraft.description ?? ""}
                        onChange={(e) => setQuizDraft((p) => ({ ...p, description: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground">Total Marks</div>
                        <input
                          type="number"
                          className="mt-2 w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none"
                          value={quizDraft.totalMarks}
                          onChange={(e) => setQuizDraft((p) => ({ ...p, totalMarks: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground">Passing Score (%)</div>
                        <input
                          type="number"
                          className="mt-2 w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none"
                          value={quizDraft.passingScore}
                          onChange={(e) => setQuizDraft((p) => ({ ...p, passingScore: Number(e.target.value) }))}
                        />
                      </div>
                    </div>

                    <div className="rounded-3xl border bg-background p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold">Questions</div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setQuizDraft((p) => ({
                              ...p,
                              questions: [
                                ...p.questions,
                                { prompt: "", options: ["", "", "", ""], correctIndex: 0, marks: 1 },
                              ],
                            }))
                          }
                        >
                          Add Question
                        </Button>
                      </div>

                      <div className="mt-4 space-y-4">
                        {quizDraft.questions.map((q, idx) => (
                          <div key={idx} className="rounded-2xl border bg-background p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm font-semibold">Q{idx + 1}</div>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setQuizDraft((p) => ({
                                    ...p,
                                    questions: p.questions.filter((_x, i) => i !== idx),
                                  }))
                                }
                                disabled={quizDraft.questions.length <= 1}
                              >
                                Remove
                              </Button>
                            </div>

                            <div className="mt-3">
                              <div className="text-xs font-semibold text-muted-foreground">Prompt</div>
                              <input
                                className="mt-2 w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none"
                                value={q.prompt}
                                onChange={(e) =>
                                  setQuizDraft((p) => ({
                                    ...p,
                                    questions: p.questions.map((qq, i) => (i === idx ? { ...qq, prompt: e.target.value } : qq)),
                                  }))
                                }
                              />
                            </div>

                            <div className="mt-3 grid gap-2">
                              {q.options.map((opt, oidx) => (
                                <div key={oidx} className="flex items-center gap-2">
                                  <input
                                    className="w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none"
                                    value={opt}
                                    onChange={(e) =>
                                      setQuizDraft((p) => ({
                                        ...p,
                                        questions: p.questions.map((qq, i) =>
                                          i === idx
                                            ? {
                                                ...qq,
                                                options: qq.options.map((x, j) => (j === oidx ? e.target.value : x)),
                                              }
                                            : qq
                                        ),
                                      }))
                                    }
                                  />
                                  <input
                                    type="radio"
                                    name={`correct_${idx}`}
                                    checked={q.correctIndex === oidx}
                                    onChange={() =>
                                      setQuizDraft((p) => ({
                                        ...p,
                                        questions: p.questions.map((qq, i) => (i === idx ? { ...qq, correctIndex: oidx } : qq)),
                                      }))
                                    }
                                  />
                                </div>
                              ))}
                            </div>

                            <div className="mt-3">
                              <div className="text-xs font-semibold text-muted-foreground">Marks (per question)</div>
                              <input
                                type="number"
                                className="mt-2 w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none"
                                value={q.marks}
                                onChange={(e) =>
                                  setQuizDraft((p) => ({
                                    ...p,
                                    questions: p.questions.map((qq, i) => (i === idx ? { ...qq, marks: Number(e.target.value) } : qq)),
                                  }))
                                }
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button className="w-full" onClick={onCreateQuiz} disabled={busy || !selectedCourseId}>
                      {busy ? "Creating..." : "Create Quiz"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl shadow-soft">
                <CardHeader>
                  <CardTitle>Assignment Creation</CardTitle>
                  <CardDescription>Create assignments and set due date.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground">Assignment Title</div>
                      <input
                        className="mt-2 w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none"
                        value={assignmentDraft.title}
                        onChange={(e) => setAssignmentDraft((p) => ({ ...p, title: e.target.value }))}
                      />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground">Description (optional)</div>
                      <textarea
                        className="mt-2 w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none"
                        value={assignmentDraft.description ?? ""}
                        onChange={(e) => setAssignmentDraft((p) => ({ ...p, description: e.target.value }))}
                        rows={4}
                      />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground">Due Date</div>
                      <input
                        type="datetime-local"
                        className="mt-2 w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none"
                        value={assignmentDraft.dueAt ?? ""}
                        onChange={(e) => setAssignmentDraft((p) => ({ ...p, dueAt: e.target.value }))}
                      />
                    </div>
                    <Button className="w-full" onClick={onCreateAssignment} disabled={busy || !selectedCourseId}>
                      {busy ? "Creating..." : "Create Assignment"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {section === "students" ? (
            <Card className="rounded-3xl shadow-soft">
              <CardHeader>
                <CardTitle>Students & Progress</CardTitle>
                <CardDescription>Track each student’s progress and attendance for the selected course.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {!selectedCourse ? (
                  <div className="rounded-2xl border bg-background p-6 text-sm text-muted-foreground">Select a course.</div>
                ) : students.length ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-[900px] w-full border-separate border-spacing-0">
                      <thead>
                        <tr className="text-left text-xs text-muted-foreground">
                          <th className="py-3 pr-4">Student</th>
                          <th className="py-3 pr-4">Progress</th>
                          <th className="py-3 pr-4">Attendance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((s) => (
                          <tr key={s.userId} className="border-t">
                            <td className="py-4 pr-4">
                              <div className="text-sm font-semibold">{s.email ?? s.phone ?? s.userId}</div>
                              <div className="mt-1 text-xs text-muted-foreground">User ID: {s.userId.slice(0, 8)}…</div>
                            </td>
                            <td className="py-4 pr-4">
                              <div className="flex items-center gap-3">
                                <div className="w-[120px]">
                                  <ProgressBar value={s.progressPct} />
                                </div>
                                <div className="text-sm font-semibold text-primary">{s.progressPct}%</div>
                              </div>
                            </td>
                            <td className="py-4 pr-4">
                              <div className="text-sm font-semibold">{s.attendance.attendancePct}%</div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                Present: {s.attendance.present} · Absent: {s.attendance.absent} · Leave: {s.attendance.leave}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-2xl border bg-background p-6 text-sm text-muted-foreground">
                    No students enrolled in this course yet.
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {section === "announcements" ? (
            <div className="grid gap-6 md:grid-cols-[420px_1fr]">
              <Card className="rounded-3xl shadow-soft">
                <CardHeader>
                  <CardTitle>Create Announcement</CardTitle>
                  <CardDescription>Send updates to students or admins.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground">Title</div>
                      <input
                        className="mt-2 w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none"
                        value={announcementForm.title}
                        onChange={(e) => setAnnouncementForm((p) => ({ ...p, title: e.target.value }))}
                      />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground">Body</div>
                      <textarea
                        className="mt-2 w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none"
                        value={announcementForm.body}
                        onChange={(e) => setAnnouncementForm((p) => ({ ...p, body: e.target.value }))}
                        rows={5}
                      />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground">Audience</div>
                        <select
                          className="mt-2 w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none"
                          value={announcementForm.audience}
                          onChange={(e) => setAnnouncementForm((p) => ({ ...p, audience: e.target.value as any }))}
                        >
                          <option value="ALL">All</option>
                          <option value="STUDENTS">Students</option>
                          <option value="ADMINS">Admins</option>
                        </select>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground">Course (optional)</div>
                        <select
                          className="mt-2 w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none"
                          value={announcementForm.courseId}
                          onChange={(e) => setAnnouncementForm((p) => ({ ...p, courseId: e.target.value }))}
                        >
                          <option value="">All Courses</option>
                          {courses.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.title} ({c.level})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <Button className="w-full" onClick={onCreateAnnouncement} disabled={busy}>
                      {busy ? "Posting..." : "Post Announcement"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl shadow-soft">
                <CardHeader>
                  <CardTitle>Recent Announcements</CardTitle>
                  <CardDescription>Latest posts (max 50).</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {announcements.length ? (
                    <div className="space-y-3">
                      {announcements.map((a) => (
                        <div key={a.id} className="rounded-3xl border bg-background p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-bold">{a.title}</div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                Audience: {a.audience} {a.course?.title ? `· Course: ${a.course.title}` : ""}
                              </div>
                              <div className="mt-2 text-sm text-muted-foreground">{a.body}</div>
                              <div className="mt-2 text-xs text-muted-foreground">Posted: {new Date(a.createdAt).toLocaleString()}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border bg-background p-6 text-sm text-muted-foreground">No announcements yet.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}

          {section === "attendance" ? (
            <div className="grid gap-6 md:grid-cols-[420px_1fr]">
              <Card className="rounded-3xl shadow-soft">
                <CardHeader>
                  <CardTitle>Attendance Sessions</CardTitle>
                  <CardDescription>Create a session and mark student attendance.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="rounded-3xl border bg-background p-4">
                      <div className="text-sm font-semibold">Create New Session</div>
                      <div className="mt-3 space-y-3">
                        <input
                          className="w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none"
                          placeholder="Session title (e.g., Session 1 - Unit Test)"
                          value={attendanceCreateForm.title}
                          onChange={(e) => setAttendanceCreateForm((p) => ({ ...p, title: e.target.value }))}
                        />
                        <input
                          type="datetime-local"
                          className="w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none"
                          value={attendanceCreateForm.startsAt}
                          onChange={(e) => setAttendanceCreateForm((p) => ({ ...p, startsAt: e.target.value }))}
                        />
                        <Button className="w-full" onClick={onCreateAttendanceSession} disabled={busy || !selectedCourseId}>
                          {busy ? "Creating..." : "Create Session"}
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-3xl border bg-background p-4">
                      <div className="text-sm font-semibold">Choose Session</div>
                      <div className="mt-3 space-y-2">
                        {attendanceSessions.length ? (
                          attendanceSessions.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => setSelectedSessionId(s.id)}
                              className={`w-full rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition ${
                                selectedSessionId === s.id ? "border-primary bg-primary/10" : "bg-background hover:bg-secondary/50 text-muted-foreground"
                              }`}
                            >
                              <div className="font-semibold">{s.title}</div>
                              <div className="mt-1 text-xs text-muted-foreground">{new Date(s.startsAt).toLocaleString()}</div>
                            </button>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground">No sessions yet.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl shadow-soft">
                <CardHeader>
                  <CardTitle>Mark Attendance</CardTitle>
                  <CardDescription>{selectedSessionId ? "Select status for each student and add note if needed." : "Select a session."}</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {!selectedSessionId ? (
                    <div className="rounded-2xl border bg-background p-6 text-sm text-muted-foreground">Pick a session to mark attendance.</div>
                  ) : attendanceMarkingStudents.length ? (
                    <div className="space-y-4">
                      {attendanceMarkingForm.length ? (
                        attendanceMarkingForm.map((row) => {
                          const s = attendanceMarkingStudents.find((x) => x.userId === row.userId);
                          return (
                            <div key={row.userId} className="rounded-3xl border bg-background p-4">
                              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                  <div className="text-sm font-bold">{s?.email ?? s?.phone ?? row.userId}</div>
                                  <div className="mt-1 text-xs text-muted-foreground">User: {row.userId.slice(0, 8)}…</div>
                                </div>
                                <div className="flex gap-3">
                                  <select
                                    className="rounded-2xl border bg-background px-4 py-3 text-sm"
                                    value={row.status}
                                    onChange={(e) => {
                                      const status = e.target.value as any;
                                      setAttendanceMarkingForm((prev) => prev.map((p) => (p.userId === row.userId ? { ...p, status } : p)));
                                    }}
                                  >
                                    <option value="PRESENT">Present</option>
                                    <option value="ABSENT">Absent</option>
                                    <option value="LEAVE">Leave</option>
                                  </select>
                                </div>
                              </div>
                              <div className="mt-3">
                                <div className="text-xs font-semibold text-muted-foreground">Note (optional)</div>
                                <input
                                  className="mt-2 w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none"
                                  value={row.note ?? ""}
                                  onChange={(e) => {
                                    const note = e.target.value;
                                    setAttendanceMarkingForm((prev) =>
                                      prev.map((p) => (p.userId === row.userId ? { ...p, note: note || undefined } : p))
                                    );
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="rounded-2xl border bg-background p-6 text-sm text-muted-foreground">
                          No students to mark.
                        </div>
                      )}
                      <Button className="w-full" onClick={onSaveAttendanceMarks} disabled={busy}>
                        {busy ? "Saving..." : "Save Attendance"}
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-2xl border bg-background p-6 text-sm text-muted-foreground">
                      No enrolled students found for this session/course.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </div>

      {courseModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl border bg-background p-6 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xl font-bold">{editingCourseId ? "Edit Course" : "Add Course"}</div>
                <div className="mt-1 text-sm text-muted-foreground">Add or update course details for students.</div>
              </div>
              <Button variant="outline" onClick={() => setCourseModalOpen(false)}>
                Close
              </Button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground">Title</div>
                  <input
                    className="mt-2 w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none"
                    value={courseForm.title}
                    onChange={(e) => setCourseForm((p) => ({ ...p, title: e.target.value }))}
                  />
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground">Level (JEE / MHT CET / English)</div>
                  <input
                    className="mt-2 w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none"
                    value={courseForm.level}
                    onChange={(e) => setCourseForm((p) => ({ ...p, level: e.target.value }))}
                  />
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground">Price (INR)</div>
                  <input
                    type="number"
                    className="mt-2 w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none"
                    value={courseForm.price}
                    onChange={(e) => setCourseForm((p) => ({ ...p, price: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground">Description</div>
                  <textarea
                    className="mt-2 w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none"
                    value={courseForm.description}
                    onChange={(e) => setCourseForm((p) => ({ ...p, description: e.target.value }))}
                    rows={5}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button className="flex-1" onClick={onSaveCourse} disabled={busy}>
                {busy ? "Saving..." : editingCourseId ? "Save Changes" : "Add Course"}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setCourseModalOpen(false)} disabled={busy}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


