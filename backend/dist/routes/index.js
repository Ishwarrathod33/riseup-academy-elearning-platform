import { Router } from "express";
import { authRouter, handleGetMe } from "./auth.js";
import { coursesRouter } from "./courses.js";
import { paymentsRouter } from "./payments.js";
import { lmsRouter } from "./lms.js";
import { adminRouter } from "./admin.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncRoute } from "../middleware/asyncRoute.js";
export const router = Router();
/** Alias for clients that expect `GET /api/me` (same as `GET /api/auth/me`). */
router.get("/me", requireAuth, asyncRoute(handleGetMe));
router.use("/auth", authRouter);
router.use("/courses", coursesRouter);
router.use("/payments", paymentsRouter);
router.use("/lms", lmsRouter);
router.use("/admin", adminRouter);
