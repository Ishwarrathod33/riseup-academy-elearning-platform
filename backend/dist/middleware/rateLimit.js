// Simple in-memory rate limiter.
// For production + multi-instance deployments, replace with Redis-based storage.
const buckets = new Map();
const WINDOW_MS = 60_000; // 1 minute
const MAX = 120; // requests per window per IP
export function limiter(req, res, next) {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        "unknown";
    const now = Date.now();
    const existing = buckets.get(ip);
    if (!existing || existing.resetAt <= now) {
        buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
        return next();
    }
    if (existing.count >= MAX) {
        return res.status(429).json({ error: "Too many requests" });
    }
    existing.count += 1;
    buckets.set(ip, existing);
    return next();
}
