import { Router } from "express";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireAuth } from "../middleware/auth.js";
import { asyncRoute } from "../middleware/asyncRoute.js";
export const aiRouter = Router();
/**
 * Request body validation
 */
const chatSchema = z.object({
    message: z.string().min(1, "Message is required"),
    history: z
        .array(z.object({
        role: z.enum(["user", "model"]),
        parts: z.array(z.object({
            text: z.string(),
        })),
    }))
        .optional(),
});
/**
 * POST /api/ai/chat
 * Protected Route
 */
aiRouter.post("/chat", requireAuth, asyncRoute(async (req, res) => {
    /**
     * Validate body
     */
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            success: false,
            error: parsed.error.flatten(),
        });
    }
    const { message, history = [] } = parsed.data;
    /**
     * Check API Key
     */
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({
            success: false,
            error: "GEMINI_API_KEY is not configured",
        });
    }
    /**
     * Initialize Gemini
     */
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: `
You are RiseUp Academy AI Tutor.

Rules:
1. Be helpful, friendly, motivating.
2. Explain clearly for students.
3. Help with coding, exams, learning plans, math, English.
4. Do not give direct cheating answers.
5. Guide step-by-step.
6. Keep answers structured and easy.
`,
    });
    /**
     * Start chat session with previous history
     */
    const chat = model.startChat({
        history: history,
    });
    /**
     * Send user message
     */
    const result = await chat.sendMessage(message);
    const reply = result.response.text();
    /**
     * Return response
     */
    return res.status(200).json({
        success: true,
        text: reply,
    });
}));
