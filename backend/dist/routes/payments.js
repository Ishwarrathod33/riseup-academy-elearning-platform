import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import Razorpay from "razorpay";
import { env } from "../config/env.js";
import { prisma } from "../prismaClient.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncRoute } from "../middleware/asyncRoute.js";
export const paymentsRouter = Router();
function isRazorpayConfigured() {
    const id = env.RAZORPAY_KEY_ID?.trim() ?? "";
    const secret = env.RAZORPAY_KEY_SECRET?.trim() ?? "";
    return id.length > 0 && secret.length > 0;
}
const createPaymentSchema = z.object({
    courseId: z.string().min(1),
});
paymentsRouter.post("/create", requireAuth, asyncRoute(async (req, res) => {
    try {
        const body = createPaymentSchema.safeParse(req.body);
        if (!body.success)
            return res.status(400).json({ error: body.error.flatten() });
        const { courseId } = body.data;
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course || !course.isActive)
            return res.status(404).json({ error: "Course not found" });
        // Free courses: bypass Razorpay entirely and enroll immediately.
        if (course.price <= 0) {
            const userId = req.user.userId;
            await prisma.enrollment.upsert({
                where: { userId_courseId: { userId, courseId } },
                update: {},
                create: { userId, courseId, status: "ACTIVE" },
            });
            return res.json({ enrolled: true });
        }
        const amountPaise = Math.round(course.price * 100); // INR
        const receipt = `rcpt_${crypto.randomBytes(10).toString("hex")}`;
        if (!isRazorpayConfigured()) {
            return res.status(500).json({
                error: "Razorpay not configured",
            });
        }
        let order;
        try {
            const razorpay = new Razorpay({
                key_id: env.RAZORPAY_KEY_ID,
                key_secret: env.RAZORPAY_KEY_SECRET,
            });
            order = (await razorpay.orders.create({
                amount: amountPaise,
                currency: env.RAZORPAY_CURRENCY,
                receipt,
                payment_capture: true,
            }));
        }
        catch (rpErr) {
            throw rpErr;
        }
        const userId = req.user.userId;
        await prisma.payment.create({
            data: {
                userId,
                courseId,
                razorpayOrderId: String(order.id),
                amount: amountPaise,
                currency: order.currency,
                status: "PENDING",
                method: "razorpay",
                planId: courseId, // v1 mapping
            },
        });
        return res.json({
            keyId: env.RAZORPAY_KEY_ID,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            courseTitle: course.title,
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
}));
paymentsRouter.get("/my", requireAuth, asyncRoute(async (req, res) => {
    const userId = req.user.userId;
    const payments = await prisma.payment.findMany({
        where: { userId },
        include: { course: { select: { id: true, title: true, level: true } } },
        orderBy: { createdAt: "desc" },
    });
    return res.json({ payments });
}));
const verifyPaymentSchema = z.object({
    razorpayOrderId: z.string().min(1),
    razorpayPaymentId: z.string().min(1),
    razorpaySignature: z.string().min(1),
});
function computeRazorpaySignature(orderId, paymentId) {
    const secret = env.RAZORPAY_KEY_SECRET ?? "";
    return crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
}
paymentsRouter.post("/verify", requireAuth, asyncRoute(async (req, res) => {
    const body = verifyPaymentSchema.safeParse(req.body);
    if (!body.success)
        return res.status(400).json({ error: body.error.flatten() });
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body.data;
    const expected = computeRazorpaySignature(razorpayOrderId, razorpayPaymentId);
    if (expected !== razorpaySignature)
        return res.status(400).json({ error: "Invalid signature" });
    const payment = await prisma.payment.findUnique({ where: { razorpayOrderId: razorpayOrderId } });
    if (!payment)
        return res.status(404).json({ error: "Payment not found" });
    if (payment.userId !== req.user.userId)
        return res.status(403).json({ error: "Forbidden" });
    if (payment.status === "PAID")
        return res.json({ ok: true, enrolled: true });
    const updated = await prisma.payment.update({
        where: { id: payment.id },
        data: {
            razorpayPaymentId,
            status: "PAID",
        },
    });
    // Enroll student into the course (idempotent).
    if (updated.courseId) {
        await prisma.enrollment.upsert({
            where: { userId_courseId: { userId: updated.userId, courseId: updated.courseId } },
            update: {},
            create: { userId: updated.userId, courseId: updated.courseId, status: "ACTIVE" },
        });
    }
    return res.json({ ok: true, enrolled: true });
}));
// Razorpay webhook (server-to-server). Keep it separate from "verify" used by frontend.
paymentsRouter.post("/webhook", asyncRoute(async (req, res) => {
    const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET?.trim() ?? "";
    if (!webhookSecret) {
        return res.status(503).json({ error: "Webhook not configured" });
    }
    const signature = req.headers["x-razorpay-signature"];
    const rawBody = req.body;
    if (!signature || typeof signature !== "string")
        return res.status(400).json({ error: "Missing signature" });
    if (!rawBody || !(rawBody instanceof Buffer)) {
        return res.status(400).json({ error: "Missing raw body" });
    }
    const rawString = rawBody.toString("utf8");
    const expected = crypto.createHmac("sha256", webhookSecret).update(rawString).digest("hex");
    if (expected !== signature)
        return res.status(400).json({ error: "Invalid webhook signature" });
    let payload;
    try {
        payload = JSON.parse(rawString);
    }
    catch {
        return res.status(400).json({ error: "Invalid webhook JSON" });
    }
    const event = payload?.event;
    const paymentEntity = payload?.payload?.payment?.entity;
    if (!paymentEntity)
        return res.json({ ok: true });
    const orderId = paymentEntity.order_id;
    const paymentId = paymentEntity.id;
    const status = paymentEntity.status;
    const payment = await prisma.payment.findUnique({ where: { razorpayOrderId: orderId } });
    if (!payment)
        return res.json({ ok: true });
    const nextStatus = status === "captured" ? "PAID" : "FAILED";
    const updated = await prisma.payment.update({
        where: { id: payment.id },
        data: { razorpayPaymentId: paymentId, status: nextStatus },
    });
    if (updated.status === "PAID" && updated.courseId) {
        await prisma.enrollment.upsert({
            where: { userId_courseId: { userId: updated.userId, courseId: updated.courseId } },
            update: {},
            create: { userId: updated.userId, courseId: updated.courseId, status: "ACTIVE" },
        });
    }
    return res.json({ ok: true, event });
}));
