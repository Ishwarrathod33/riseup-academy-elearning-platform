import { verifyAccessToken } from "../lib/jwt.js";
import { env } from "../config/env.js";
export function requireAuth(req, res, next) {
    const cookieToken = req.cookies?.access_token;
    const header = req.headers.authorization;
    const bearerToken = header && header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : undefined;
    const token = cookieToken ?? bearerToken;
    if (!token)
        return res.status(401).json({ error: "Missing auth token" });
    try {
        const payload = verifyAccessToken(token);
        req.user = {
            userId: payload.sub,
            role: payload.role,
            tokenVersion: payload.tokenVersion,
        };
        return next();
    }
    catch (_err) {
        // Avoid leaking JWT verification details.
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}
export function requireRole(roles) {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ error: "Unauthorized" });
        if (!roles.includes(req.user.role))
            return res.status(403).json({ error: "Forbidden" });
        // env referenced to ensure env module is loaded (side effects: dotenv config).
        void env;
        return next();
    };
}
