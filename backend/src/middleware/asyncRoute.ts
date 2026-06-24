import type { NextFunction, RequestHandler, Response } from "express";
import type { AuthedRequest } from "../types/authedRequest.js";

/**
 * Wraps an async Express handler so rejections become 500 JSON responses
 * instead of UnhandledPromiseRejection.
 */
export function asyncRoute(
  fn: (req: AuthedRequest, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req as AuthedRequest, res, next)).catch((error: unknown) => {
      // eslint-disable-next-line no-console
      console.error(error);
      if (res.headersSent) {
        next(error);
        return;
      }
      res.status(500).json({ message: "Server error" });
    });
  };
}
