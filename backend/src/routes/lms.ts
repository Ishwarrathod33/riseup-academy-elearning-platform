import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prismaClient.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncRoute } from "../middleware/asyncRoute.js";
import multer from "multer";
import path from "path";
import fs from "fs";

export const lmsRouter = Router();

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const assignmentUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const allowed = [".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx"];
      const finalExt = allowed.includes(ext) ? ext : ".bin";
      const name = `as_${Date.now()}_${Math.random().toString(16).slice(2)}${finalExt}`;
      cb(null, name);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = [".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx"];
    if (!allowed.includes(ext)) return cb(null, false);
    return cb(null, true);
  },
});

// Lecture list for a course (student).
lmsRouter.get("/lectures", requireAuth, asyncRoute(async (req, res) => {
  const courseId = String(req.query.courseId ?? "");
  if (!courseId) return res.status(400).json({ error: "courseId required" });

  const lectures = await prisma.lecture.findMany({
    where: { courseId },
    orderBy: { sequence: "asc" },
    select: { id: true, title: true, videoUrl: true, durationSec: true, sequence: true, notesUrl: true, pdfUrl: true },
  });
  return res.json({ lectures });
}));

lmsRouter.get("/progress/lecture/:lectureId", requireAuth, asyncRoute(async (req, res) => {
  const lectureId = req.params.lectureId;
  const userId = req.user!.userId;

  const progress = await prisma.lectureProgress.findUnique({
    where: { lectureId_userId: { lectureId, userId } },
  }).catch(() => null);

  if (!progress) return res.json({ progress: null });
  return res.json({ progress });
}));

/** All lecture progress for the current student (for dashboard / resume). */
lmsRouter.get("/progress/my", requireAuth, asyncRoute(async (req, res) => {
  const userId = req.user!.userId;
  const rows = await prisma.lectureProgress.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      lecture: {
        select: {
          id: true,
          title: true,
          courseId: true,
          sequence: true,
          course: { select: { id: true, title: true } },
        },
      },
    },
  });

  return res.json({
    items: rows.map((r) => ({
      id: r.id,
      lastProgressPct: r.lastProgressPct,
      lastPositionSec: r.lastPositionSec,
      completedAt: r.completedAt,
      updatedAt: r.updatedAt,
      lecture: r.lecture,
    })),
  });
}));

const progressSchema = z.object({
  positionSec: z.coerce.number().int().nonnegative(),
  durationSec: z.coerce.number().int().nonnegative().optional(),
});

lmsRouter.post("/progress/lecture/:lectureId", requireAuth, asyncRoute(async (req, res) => {
  const lectureId = req.params.lectureId;
  const userId = req.user!.userId;

  const body = progressSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });
  const { positionSec, durationSec } = body.data;

  const progressPct =
    durationSec && durationSec > 0
      ? Math.max(0, Math.min(100, Math.floor((positionSec / durationSec) * 100)))
      : undefined;

  const next = await prisma.lectureProgress.upsert({
    where: { lectureId_userId: { lectureId, userId } },
    update: {
      lastPositionSec: positionSec,
      ...(progressPct !== undefined ? { lastProgressPct: progressPct } : {}),
      ...(progressPct !== undefined && progressPct >= 100 ? { completedAt: new Date() } : {}),
    },
    create: {
      lectureId,
      userId,
      lastPositionSec: positionSec,
      lastProgressPct: progressPct ?? 0,
      completedAt: progressPct !== undefined && progressPct >= 100 ? new Date() : undefined,
    },
    include: { lecture: true },
  });

  return res.json({ progress: next });
}));

// Quiz delivery.
lmsRouter.get("/quizzes/:quizId", requireAuth, asyncRoute(async (req, res) => {
  const quizId = req.params.quizId;
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        orderBy: { id: "asc" },
        select: { id: true, prompt: true, optionsJson: true, marks: true },
      },
    },
  });
  if (!quiz) return res.status(404).json({ error: "Quiz not found" });
  return res.json({ quiz });
}));

const quizSubmitSchema = z.object({
  answers: z.record(z.string().min(1), z.coerce.number().int().nonnegative()),
});

lmsRouter.post("/quizzes/:quizId/submit", requireAuth, asyncRoute(async (req, res) => {
  const quizId = req.params.quizId;
  const userId = req.user!.userId;

  const body = quizSubmitSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });

  const quizWithQuestions = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: true },
  });

  if (!quizWithQuestions) return res.status(404).json({ error: "Quiz not found" });

  const answers = body.data.answers;
  const total = quizWithQuestions.questions.reduce((sum, q) => sum + q.marks, 0);
  let score = 0;

  for (const q of quizWithQuestions.questions) {
    const selectedIndex = answers[q.id];
    if (selectedIndex !== undefined && selectedIndex === q.correctIndex) {
      score += q.marks;
    }
  }

  const existing = await prisma.quizAttempt.findFirst({
    where: { quizId, userId },
  });

  if (existing) {
    await prisma.quizAttempt.update({
      where: { id: existing.id },
      data: {
        answersJson: body.data.answers,
        submittedAt: new Date(),
        score,
        total,
      },
    });
  } else {
    await prisma.quizAttempt.create({
      data: {
        quizId,
        userId,
        answersJson: body.data.answers,
        submittedAt: new Date(),
        score,
        total,
      },
    });
  }

  const percentage = total > 0 ? Math.floor((score / total) * 100) : 0;
  const passed = percentage >= quizWithQuestions.passingScore;

  return res.json({ ok: true, score, total, percentage, passed });
}));

// Results (student): quiz attempts summary.
lmsRouter.get("/results/my", requireAuth, asyncRoute(async (req, res) => {
  const userId = req.user!.userId;
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId },
    orderBy: { submittedAt: "desc" },
    include: { quiz: { select: { id: true, title: true, courseId: true, passingScore: true } } },
  });

  return res.json({ attempts });
}));

// Certificates (student).
lmsRouter.get("/certificates/my", requireAuth, asyncRoute(async (req, res) => {
  const userId = req.user!.userId;
  const certificates = await prisma.certificate.findMany({
    where: { userId },
    orderBy: { issuedAt: "desc" },
    include: { course: { select: { id: true, title: true, level: true } } },
  });
  return res.json({ certificates });
}));

// Assignments list (student).
lmsRouter.get("/assignments", requireAuth, asyncRoute(async (req, res) => {
  const userId = req.user!.userId;
  const enrollments = await prisma.enrollment.findMany({ where: { userId } });
  const courseIds = enrollments.map((e) => e.courseId);

  const assignments = await prisma.assignment.findMany({
    where: courseIds.length ? { courseId: { in: courseIds } } : undefined,
    orderBy: { dueAt: "asc" },
    select: {
      id: true,
      courseId: true,
      title: true,
      description: true,
      dueAt: true,
    },
  });

  // Attach user's submission status if any.
  const assignmentIds = assignments.map((a) => a.id);
  const submissions = assignmentIds.length
    ? await prisma.assignmentSubmission.findMany({
        where: { userId, assignmentId: { in: assignmentIds } },
        select: { assignmentId: true, submittedAt: true, attachmentUrl: true, gradeScore: true, answerText: true },
      })
    : [];

  const subMap = new Map(submissions.map((s) => [s.assignmentId, s]));

  return res.json({
    assignments: assignments.map((a) => ({
      ...a,
      submission: subMap.get(a.id) ?? null,
    })),
  });
}));

// Attendance (student).
lmsRouter.get("/attendance/my", requireAuth, asyncRoute(async (req, res) => {
  const userId = req.user!.userId;
  const enrollments = await prisma.enrollment.findMany({ where: { userId, status: "ACTIVE" }, select: { courseId: true } });
  const courseIds = enrollments.map((e) => e.courseId);
  if (!courseIds.length) return res.json({ sessions: [] });

  const sessions = await prisma.attendanceSession.findMany({
    where: { courseId: { in: courseIds } },
    orderBy: { startsAt: "desc" },
    include: {
      records: {
        where: { userId },
        select: { status: true, note: true, recordedAt: true },
      },
    },
  });

  return res.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      courseId: s.courseId,
      title: s.title,
      startsAt: s.startsAt,
      record: s.records[0] ?? null,
    })),
  });
}));

// Live classes (student).
lmsRouter.get("/live-classes/my", requireAuth, asyncRoute(async (req, res) => {
  const userId = req.user!.userId;
  const enrollments = await prisma.enrollment.findMany({ where: { userId, status: "ACTIVE" }, select: { courseId: true } });
  const courseIds = enrollments.map((e) => e.courseId);
  if (!courseIds.length) return res.json({ liveClasses: [] });

  const liveClasses = await prisma.liveClass.findMany({
    where: { courseId: { in: courseIds } },
    orderBy: { startsAt: "desc" },
    select: { id: true, courseId: true, title: true, url: true, startsAt: true },
  });

  return res.json({ liveClasses });
}));

const assignmentSubmitSchema = z.object({
  answerText: z.string().optional(),
  attachmentUrl: z.string().url().optional(),
});

lmsRouter.post("/assignments/:assignmentId/submit", requireAuth, asyncRoute(async (req, res) => {
  const assignmentId = req.params.assignmentId;
  const userId = req.user!.userId;

  const body = assignmentSubmitSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });

  const { answerText, attachmentUrl } = body.data;

  await prisma.assignmentSubmission.upsert({
    where: { assignmentId_userId: { assignmentId, userId } },
    update: { answerText: answerText ?? undefined, attachmentUrl: attachmentUrl ?? undefined },
    create: { assignmentId, userId, answerText: answerText ?? undefined, attachmentUrl: attachmentUrl ?? undefined },
  });

  return res.json({ ok: true });
}));

// Upload assignment attachment (student -> returns URL for submit payload).
lmsRouter.post("/uploads/assignment", requireAuth, assignmentUpload.single("file"), asyncRoute(async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file uploaded" });
  const protocol = (req.headers["x-forwarded-proto"] as string | undefined) ?? req.protocol;
  const host = req.get("host");
  return res.json({ url: `${protocol}://${host}/uploads/${file.filename}` });
}));

