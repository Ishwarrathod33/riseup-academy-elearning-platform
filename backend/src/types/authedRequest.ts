import type { Request } from "express";

/** Express request after `requireAuth` (`file` comes from Multer via @types/multer on `Request`). */
export type AuthedRequest = Request & {
  user?: { userId: string; role: "ADMIN" | "STUDENT" | "TEACHER"; tokenVersion: number };
};
