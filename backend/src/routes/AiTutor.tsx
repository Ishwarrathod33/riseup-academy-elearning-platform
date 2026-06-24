"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Bot, User, Loader2 } from "lucide-react";

type Message = {
  role: "user" | "model";
  text: string;
};

export function AiTutor() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: "Hello! I'm your RiseUp AI Tutor. How can I help you with your studies or assignments today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      // Map history for the Gemini API (excluding the current user message)
      const history = messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      // Assuming your standard storage key approach from ARCHITECTURE.md
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

      const response = await fetch(`${API_BASE}/api/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: userMessage, history }),
      });

      if (!response.ok) throw new Error("Failed to fetch response");

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "model", text: data.text }]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "Sorry, I'm having trouble connecting right now. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[500px] max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-violet-50 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white shadow-sm">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-bold text-violet-950">RiseUp AI Tutor</h2>
          <p className="text-xs font-medium text-violet-600">Powered by Gemini 1.5</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
        {messages.map((msg, index) => (
          <div key={index} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "model" && (
              <div className="w-8 h-8 rounded-full bg-violet-200 flex-shrink-0 flex items-center justify-center text-violet-700 mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${msg.role === "user" ? "bg-violet-600 text-white rounded-br-sm" : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"}`}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-600 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-violet-200 flex-shrink-0 flex items-center justify-center text-violet-700 mt-1">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm p-4 flex items-center gap-3 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
              <span className="text-sm font-medium text-gray-500">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSend} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your AI tutor a question..."
            className="flex-1 rounded-full border border-gray-300 px-5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim()} 
            className="rounded-full bg-violet-600 hover:bg-violet-700 h-11 w-11 p-0 flex items-center justify-center flex-shrink-0 shadow-sm transition-transform active:scale-95 disabled:active:scale-100"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}