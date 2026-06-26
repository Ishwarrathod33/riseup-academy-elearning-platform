import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prismaClient.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncRoute } from "../middleware/asyncRoute.js";
import multer from "multer";
import fs from "fs";
import path from "path";

export const adminRouter = Router();

const adminOnly = [requireAuth, requireRole(["ADMIN"])] as const;

// Local upload (dev). Production should use S3/Cloudinary + presigned URLs.
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads"),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    const name = `${Date.now()}_${Math.random().toString(16).slice(2)}${ext}`.toLowerCase();
    cb(null, name);
  },
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

adminRouter.post("/uploads", ...adminOnly, upload.single("file"), asyncRoute(async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file uploaded" });
  // Return an absolute URL so the frontend can load media correctly.
  const protocol = (req.headers["x-forwarded-proto"] as string | undefined) ?? req.protocol;
  const host = req.get("host");
  return res.json({ url: `${protocol}://${host}/uploads/${file.filename}` });
}));

// Courses CRUD
const courseCreateSchema = z.object({
  title: z.string().min(1),
  tagline: z.string().optional(),
  description: z.string().optional(),
  level: z.string().min(1),
  price: z.coerce.number().int().nonnegative(),
  currency: z.string().optional().default("INR"),
  demoVideoUrl: z.string().url().optional(),
  coverImageUrl: z.string().url().optional(),
  subjects: z.array(z.string().min(1)).min(1),
});

adminRouter.post("/courses", ...adminOnly, asyncRoute(async (req, res) => {
  const body = courseCreateSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });

  const created = await prisma.course.create({
    data: {
      title: body.data.title,
      tagline: body.data.tagline,
      description: body.data.description,
      level: body.data.level,
      price: body.data.price,
      currency: body.data.currency,
      demoVideoUrl: body.data.demoVideoUrl,
      coverImageUrl: body.data.coverImageUrl,
      subjects: { create: body.data.subjects.map((s) => ({ name: s })) },
    },
  });

  return res.json({ course: created });
}));

const courseUpdateSchema = courseCreateSchema.partial();
adminRouter.put("/courses/:courseId", ...adminOnly, asyncRoute(async (req, res) => {
  const body = courseUpdateSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });

  const { courseId } = req.params;
  const updated = await prisma.course.update({
    where: { id: courseId },
    data: {
      ...(body.data.title !== undefined ? { title: body.data.title } : {}),
      ...(body.data.tagline !== undefined ? { tagline: body.data.tagline } : {}),
      ...(body.data.description !== undefined ? { description: body.data.description } : {}),
      ...(body.data.level !== undefined ? { level: body.data.level } : {}),
      ...(body.data.price !== undefined ? { price: body.data.price } : {}),
      ...(body.data.currency !== undefined ? { currency: body.data.currency } : {}),
      ...(body.data.demoVideoUrl !== undefined ? { demoVideoUrl: body.data.demoVideoUrl } : {}),
      ...(body.data.coverImageUrl !== undefined ? { coverImageUrl: body.data.coverImageUrl } : {}),
      ...(body.data.subjects !== undefined
        ? {
            subjects: {
              deleteMany: {},
              create: body.data.subjects.map((s) => ({ name: s })),
            },
          }
        : {}),
    },
  });

  return res.json({ course: updated });
}));

adminRouter.delete("/courses/:courseId", ...adminOnly, asyncRoute(async (req, res) => {
  const { courseId } = req.params;
  await prisma.course.update({ where: { id: courseId }, data: { isActive: false } });
  return res.json({ ok: true });
}));

// Lectures
const lectureCreateSchema = z.object({
  title: z.string().min(1),
  videoUrl: z.string().url().min(1),
  notesUrl: z.string().url().optional(),
  pdfUrl: z.string().url().optional(),
  sequence: z.coerce.number().int().nonnegative(),
  durationSec: z.coerce.number().int().nonnegative().optional(),
});

adminRouter.post("/courses/:courseId/lectures", ...adminOnly, asyncRoute(async (req, res) => {
  const body = lectureCreateSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });

  const { courseId } = req.params;
  const created = await prisma.lecture.create({
    data: { courseId, ...body.data, durationSec: body.data.durationSec },
  });

  return res.json({ lecture: created });
}));
const lectureUpdateSchema = lectureCreateSchema.partial();

adminRouter.put(
  "/lectures/:lectureId",
  ...adminOnly,
  asyncRoute(async (req, res) => {
    const body = lectureUpdateSchema.safeParse(req.body);

    if (!body.success) {
      return res.status(400).json({
        error: body.error.flatten(),
      });
    }

    const updated = await prisma.lecture.update({
      where: {
        id: req.params.lectureId,
      },
      data: {
        ...(body.data.title !== undefined && { title: body.data.title }),
        ...(body.data.videoUrl !== undefined && { videoUrl: body.data.videoUrl }),
        ...(body.data.notesUrl !== undefined && { notesUrl: body.data.notesUrl }),
        ...(body.data.pdfUrl !== undefined && { pdfUrl: body.data.pdfUrl }),
        ...(body.data.sequence !== undefined && { sequence: body.data.sequence }),
        ...(body.data.durationSec !== undefined && {
          durationSec: body.data.durationSec,
        }),
      },
    });

    return res.json({ lecture: updated });
  })
);
adminRouter.delete(
  "/lectures/:lectureId",
  ...adminOnly,
  asyncRoute(async (req, res) => {
    const lecture = await prisma.lecture.findUnique({
      where: { id: req.params.lectureId },
    });

    if (!lecture) {
      return res.status(404).json({
        message: "Lecture not found",
      });
    }

    function deleteLocalFile(fileUrl?: string | null) {
      if (!fileUrl) return;

      try {
        const filename = path.basename(fileUrl);
        const filePath = path.join(process.cwd(), "uploads", filename);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error("File delete failed:", err);
      }
    }

    deleteLocalFile(lecture.videoUrl);
    deleteLocalFile(lecture.notesUrl);
    deleteLocalFile(lecture.pdfUrl);

    await prisma.lecture.delete({
      where: {
        id: lecture.id,
      },
    });

    return res.json({
      ok: true,
      message: "Lecture deleted successfully",
    });
  })
);
// Quizzes
const quizQuestionSchema = z.object({
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  correctIndex: z.coerce.number().int().nonnegative(),
  marks: z.coerce.number().int().positive().optional().default(1),
});

const quizCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  totalMarks: z.coerce.number().int().nonnegative().optional(),
  passingScore: z.coerce.number().int().nonnegative().optional(),
  questions: z.array(quizQuestionSchema).min(1),
});

adminRouter.post("/courses/:courseId/quizzes", ...adminOnly, asyncRoute(async (req, res) => {
  const body = quizCreateSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });

  const { courseId } = req.params;

  const quiz = await prisma.quiz.create({
    data: {
      courseId,
      title: body.data.title,
      description: body.data.description,
      totalMarks: body.data.totalMarks ?? undefined,
      passingScore: body.data.passingScore ?? undefined,
      questions: {
        create: body.data.questions.map((q) => ({
          prompt: q.prompt,
          optionsJson: q.options,
          correctIndex: q.correctIndex,
          marks: q.marks,
        })),
      },
    },
    include: { questions: true },
  });

  return res.json({ quiz });
}));

// Assignments
const assignmentCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueAt: z.string().datetime().optional(),
});

adminRouter.post("/courses/:courseId/assignments", ...adminOnly, asyncRoute(async (req, res) => {
  const body = assignmentCreateSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });

  const { courseId } = req.params;
  const created = await prisma.assignment.create({
    data: {
      courseId,
      title: body.data.title,
      description: body.data.description,
      dueAt: body.data.dueAt ? new Date(body.data.dueAt) : undefined,
      createdById: req.user!.userId,
    },
  });

  return res.json({ assignment: created });
}));

// Attendance sessions (admin)
const attendanceSessionCreateSchema = z.object({
  title: z.string().min(1),
  startsAt: z.string().datetime(),
});

adminRouter.post("/courses/:courseId/attendance-sessions", ...adminOnly, asyncRoute(async (req, res) => {
  const body = attendanceSessionCreateSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });

  const session = await prisma.attendanceSession.create({
    data: {
      courseId: req.params.courseId,
      title: body.data.title,
      startsAt: new Date(body.data.startsAt),
      createdById: req.user!.userId,
    },
  });

  return res.json({ session });
}));

const attendanceMarkSchema = z.object({
  records: z.array(
    z.object({
      userId: z.string().min(1),
      status: z.enum(["PRESENT", "ABSENT", "LEAVE"]),
      note: z.string().optional(),
    })
  ),
});

adminRouter.post("/attendance-sessions/:sessionId/mark", ...adminOnly, asyncRoute(async (req, res) => {
  const body = attendanceMarkSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });

  const { sessionId } = req.params;

  for (const r of body.data.records) {
    await prisma.attendanceRecord.upsert({
      where: { sessionId_userId: { sessionId, userId: r.userId } },
      update: { status: r.status, note: r.note },
      create: { sessionId, userId: r.userId, status: r.status, note: r.note },
    });
  }

  return res.json({ ok: true });
}));

// Announcements
const announcementCreateSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  audience: z.enum(["ALL", "STUDENTS", "ADMINS"]).optional(),
  courseId: z.string().optional(),
});

adminRouter.post("/announcements", ...adminOnly, asyncRoute(async (req, res) => {
  const body = announcementCreateSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });

  const created = await prisma.announcement.create({
    data: {
      title: body.data.title,
      body: body.data.body,
      audience: body.data.audience ?? "ALL",
      courseId: body.data.courseId,
      createdById: req.user!.userId,
    },
  });

  return res.json({ announcement: created });
}));

// Admin: list announcements (for dashboard).
adminRouter.get("/announcements", ...adminOnly, asyncRoute(async (_req, res) => {
  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      course: { select: { id: true, title: true, level: true } },
      createdBy: { select: { id: true, email: true, phone: true } },
    },
  });

  return res.json({ announcements });
}));

// Admin: list attendance sessions for a course.
adminRouter.get("/courses/:courseId/attendance-sessions", ...adminOnly, asyncRoute(async (req, res) => {
  const courseId = req.params.courseId;
  const sessions = await prisma.attendanceSession.findMany({
    where: { courseId },
    orderBy: { startsAt: "desc" },
    take: 30,
    select: { id: true, title: true, startsAt: true },
  });
  return res.json({ sessions });
}));

// Admin: fetch marking data for one attendance session.
adminRouter.get("/attendance-sessions/:sessionId/marking-data", ...adminOnly, asyncRoute(async (req, res) => {
  const sessionId = req.params.sessionId;

  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    include: { course: { select: { id: true, title: true } } },
  });
  if (!session) return res.status(404).json({ error: "Session not found" });

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: session.courseId, status: "ACTIVE" },
    select: { userId: true },
  });
  const userIds = enrollments.map((e) => e.userId);

  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, phone: true },
      })
    : [];

  const records = userIds.length
    ? await prisma.attendanceRecord.findMany({
        where: { sessionId, userId: { in: userIds } },
        select: { userId: true, status: true, note: true, recordedAt: true },
      })
    : [];

  const recMap = new Map(records.map((r) => [r.userId, r]));

  return res.json({
    session,
    students: users.map((u) => {
      const r = recMap.get(u.id);
      return {
        userId: u.id,
        email: u.email,
        phone: u.phone,
        status: r?.status ?? null,
        note: r?.note ?? null,
        recordedAt: r?.recordedAt ?? null,
      };
    }),
  });
}));

// Admin: list students with progress + attendance summary for one course.
adminRouter.get("/students", ...adminOnly, asyncRoute(async (req, res) => {
  const courseId = typeof req.query.courseId === "string" ? req.query.courseId : undefined;
  if (!courseId) return res.status(400).json({ error: "courseId query param is required" });

  const [course, enrollments, lectures, quizzes, sessions] = await Promise.all([
    prisma.course.findUnique({ where: { id: courseId }, select: { id: true, title: true } }),
    prisma.enrollment.findMany({
      where: { courseId, status: "ACTIVE" },
      select: { userId: true },
    }),
    prisma.lecture.findMany({ where: { courseId }, select: { id: true } }),
    prisma.quiz.findMany({ where: { courseId }, select: { id: true } }),
    prisma.attendanceSession.findMany({
      where: { courseId },
      orderBy: { startsAt: "desc" },
      take: 20,
      select: { id: true },
    }),
  ]);

  if (!course) return res.status(404).json({ error: "Course not found" });

  const userIds = enrollments.map((e) => e.userId);
  const lectureIds = lectures.map((l) => l.id);
  const quizIds = quizzes.map((q) => q.id);
  const sessionIds = sessions.map((s) => s.id);

  if (!userIds.length) {
    return res.json({ course, students: [] });
  }

  const [users, lectureProgresses, quizAttempts, attendanceRecords] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, phone: true },
    }),
    lectureIds.length
      ? prisma.lectureProgress.findMany({
          where: { userId: { in: userIds }, lectureId: { in: lectureIds } },
          select: { userId: true, lectureId: true, lastProgressPct: true },
        })
      : Promise.resolve([] as any[]),
    quizIds.length
      ? prisma.quizAttempt.findMany({
          where: { userId: { in: userIds }, quizId: { in: quizIds } },
          orderBy: { submittedAt: "desc" },
          select: { userId: true, quizId: true, score: true, total: true, submittedAt: true },
        })
      : Promise.resolve([] as any[]),
    sessionIds.length
      ? prisma.attendanceRecord.findMany({
          where: { sessionId: { in: sessionIds }, userId: { in: userIds } },
          select: { userId: true, status: true },
        })
      : Promise.resolve([] as any[]),
  ]);

  // Latest quiz percentage per user+quiz (because quizAttempts are ordered by submittedAt desc).
  const latestQuizPct = new Map<string, number>();
  for (const a of quizAttempts) {
    const key = `${a.userId}:${a.quizId}`;
    if (latestQuizPct.has(key)) continue;
    const total = a.total ?? 0;
    const score = a.score ?? 0;
    const pct = total > 0 ? Math.floor((score / total) * 100) : 0;
    latestQuizPct.set(key, pct);
  }

  const lectureDiv = lectureIds.length || 1;
  const lectureSumByUser = new Map<string, { sum: number }>();
  for (const uid of userIds) lectureSumByUser.set(uid, { sum: 0 });
  for (const p of lectureProgresses) {
    const cur = lectureSumByUser.get(p.userId) ?? { sum: 0 };
    cur.sum += p.lastProgressPct ?? 0;
    lectureSumByUser.set(p.userId, cur);
  }

  const quizDiv = quizIds.length || 1;
  const quizSumByUser = new Map<string, { sum: number }>();
  for (const uid of userIds) quizSumByUser.set(uid, { sum: 0 });
  for (const uid of userIds) {
    if (!quizIds.length) continue;
    let sum = 0;
    for (const qid of quizIds) {
      sum += latestQuizPct.get(`${uid}:${qid}`) ?? 0;
    }
    quizSumByUser.set(uid, { sum });
  }

  const attendanceCounts = new Map<string, { PRESENT: number; ABSENT: number; LEAVE: number }>();
  for (const uid of userIds) attendanceCounts.set(uid, { PRESENT: 0, ABSENT: 0, LEAVE: 0 });
  for (const r of attendanceRecords) {
    const cur = attendanceCounts.get(r.userId) ?? { PRESENT: 0, ABSENT: 0, LEAVE: 0 };
    const st = r.status as string;
    if (st === "PRESENT") cur.PRESENT += 1;
    else if (st === "ABSENT") cur.ABSENT += 1;
    else if (st === "LEAVE") cur.LEAVE += 1;
    attendanceCounts.set(r.userId, cur);
  }

  const hasQuizzes = quizIds.length > 0;

  const students = users.map((u) => {
    const lectureAvg = lectureIds.length ? Math.round((lectureSumByUser.get(u.id)?.sum ?? 0) / lectureDiv) : 0;
    const quizAvg = hasQuizzes
      ? Math.round((quizSumByUser.get(u.id)?.sum ?? 0) / quizDiv)
      : 0;
    const progressPct = hasQuizzes ? Math.round(lectureAvg * 0.7 + quizAvg * 0.3) : lectureAvg;

    const counts = attendanceCounts.get(u.id) ?? { PRESENT: 0, ABSENT: 0, LEAVE: 0 };
    const present = counts.PRESENT;
    const absent = counts.ABSENT;
    const attendancePct = present + absent > 0 ? Math.round((present / (present + absent)) * 100) : 0;

    return {
      userId: u.id,
      email: u.email,
      phone: u.phone,
      progressPct,
      attendance: {
        present,
        absent,
        leave: counts.LEAVE,
        attendancePct,
      },
    };
  });

  return res.json({ course, students });
}));

