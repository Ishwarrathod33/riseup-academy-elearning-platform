import { PrismaClient } from "@prisma/client";
// Prevent exhausting database connections in dev with hot reload.
const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
if (process.env.NODE_ENV !== "production")
    globalForPrisma.prisma = prisma;
