import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prismaClient.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncRoute } from "../middleware/asyncRoute.js";

export const coursesRouter = Router();

const adminOnly = [requireAuth, requireRole(["ADMIN"])] as const;

const courseUpsertSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  level: z.string().min(1),
  price: z.coerce.number().int().nonnegative(),
});

// Admin: create course (public API path, admin-only).
coursesRouter.post("/", ...adminOnly, asyncRoute(async (req, res) => {
  const body = courseUpsertSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });

  const created = await prisma.course.create({
    data: {
      title: body.data.title,
      description: body.data.description,
      level: body.data.level,
      price: body.data.price,
      currency: "INR",
      tagline: undefined,
      // Map the provided level into at least one subject so the course is usable by the app.
      subjects: { create: [{ name: body.data.level }] },
    },
  });

  return res.json({ course: created });
}));

// Admin: update course (public API path, admin-only).
coursesRouter.put("/:courseId", ...adminOnly, asyncRoute(async (req, res) => {
  const body = courseUpsertSchema.partial().safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });

  const { courseId } = req.params;

  const updated = await prisma.course.update({
    where: { id: courseId },
    data: {
      ...(body.data.title !== undefined ? { title: body.data.title } : {}),
      ...(body.data.description !== undefined ? { description: body.data.description } : {}),
      ...(body.data.price !== undefined ? { price: body.data.price } : {}),
      ...(body.data.level !== undefined ? { level: body.data.level } : {}),
      ...(body.data.level !== undefined
        ? {
            subjects: {
              deleteMany: {},
              create: [{ name: body.data.level }],
            },
          }
        : {}),
    },
    include: { subjects: true },
  });

  return res.json({ course: updated });
}));

// Admin: delete course (soft delete via `isActive=false`).
coursesRouter.delete("/:courseId", ...adminOnly, asyncRoute(async (req, res) => {
  const { courseId } = req.params;
  await prisma.course.update({ where: { id: courseId }, data: { isActive: false } });
  return res.json({ ok: true });
}));

coursesRouter.get("/", asyncRoute(async (_req, res) => {
  try {
    const courses = await prisma.course.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        description: true,
        level: true,
        price: true,
        currency: true,
        demoVideoUrl: true,
        coverImageUrl: true,
        subjects: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ courses: courses ?? [] });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.json({ courses: [] });
  }
}));

// Student enrolled courses.
coursesRouter.get("/my", requireAuth, asyncRoute(async (req, res) => {
  const userId = req.user!.userId;
  const enrollments = await prisma.enrollment.findMany({
    where: { userId, status: "ACTIVE" },
    include: { course: { select: { id: true, title: true, level: true, price: true, currency: true, demoVideoUrl: true, coverImageUrl: true } } },
    orderBy: { startAt: "desc" },
  });

  return res.json({
    enrollments: enrollments.map((e) => ({ ...e, course: e.course })),
  });
}));

coursesRouter.get("/:courseId", asyncRoute(async (req, res) => {
  const courseId = req.params.courseId;
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      subjects: true,
      lectures: {
        orderBy: { sequence: "asc" },
        select: { id: true, title: true, videoUrl: true, notesUrl: true, pdfUrl: true, sequence: true, durationSec: true },
      },
      quizzes: { select: { id: true, title: true, totalMarks: true, passingScore: true } },
    },
  });
  if (!course) return res.status(404).json({ error: "Not found" });
  return res.json({ course });
}));

