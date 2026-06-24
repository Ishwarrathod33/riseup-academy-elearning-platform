"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { API_BASE_URL } from "@/lib/api";

type QuizQuestion = {
  id: string;
  prompt: string;
  optionsJson: any;
  marks: number;
};

export function QuizPlayer({
  quiz,
  accessToken,
  onAttemptFinished,
}: {
  quiz: { id: string; title: string; totalMarks?: number | null; passingScore?: number | null };
  accessToken: string | null;
  onAttemptFinished?: () => void;
}) {
  const [phase, setPhase] = React.useState<"idle" | "loading" | "taking" | "submitted">("idle");
  const [questions, setQuestions] = React.useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = React.useState<Record<string, number>>({});
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{
    score: number;
    total: number;
    percentage: number;
    passed: boolean;
  } | null>(null);

  async function loadQuizQuestions() {
    setPhase("loading");
    setError(null);
    const r = await fetch(`${API_BASE_URL}/api/lms/quizzes/${quiz.id}`, {
      method: "GET",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      credentials: "include",
    });
    const data = await r.json().catch(() => null);
    if (!r.ok) throw new Error(data?.error ?? "Failed to load quiz");
    setQuestions((data?.quiz?.questions ?? []) as QuizQuestion[]);
    setAnswers({});
    setResult(null);
    setPhase("taking");
  }

  async function submitQuiz() {
    if (!questions.length) return;
    setBusy(true);
    setError(null);
    try {
      for (const q of questions) {
        if (answers[q.id] === undefined) {
          throw new Error("Please select answers for all questions.");
        }
      }

      const r = await fetch(`${API_BASE_URL}/api/lms/quizzes/${quiz.id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ answers }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(data?.error ?? "Quiz submit failed");
      setResult({
        score: data?.score ?? 0,
        total: data?.total ?? 0,
        percentage: data?.percentage ?? 0,
        passed: !!data?.passed,
      });
      setPhase("submitted");
      onAttemptFinished?.();
    } catch (e: any) {
      setError(e?.message ?? "Failed to submit quiz");
    } finally {
      setBusy(false);
    }
  }

  const isSubmitted = phase === "submitted";

  return (
    <Card className="animate-fade-up">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-bold">{quiz.title}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {quiz.totalMarks ? `Total Marks: ${quiz.totalMarks}` : "Total Marks: —"}{" "}
              {quiz.passingScore !== null && quiz.passingScore !== undefined
                ? ` | Passing: ${quiz.passingScore}%`
                : null}
            </div>
          </div>
          {phase === "idle" ? (
            <Button onClick={loadQuizQuestions} disabled={busy}>
              Start Quiz
            </Button>
          ) : null}
        </div>

        {phase === "loading" ? <div className="mt-4 text-sm text-muted-foreground">Loading questions...</div> : null}

        {phase === "taking" ? (
          <div className="mt-6 space-y-5">
            {questions.map((q, idx) => {
              const options = Array.isArray(q.optionsJson) ? q.optionsJson : [];
              return (
                <div key={q.id} className="rounded-2xl border bg-background p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold">
                      Q{idx + 1}. {q.prompt}
                    </div>
                    <div className="text-xs text-muted-foreground">{q.marks} mark(s)</div>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {options.map((opt: string, optionIndex: number) => {
                      const checked = answers[q.id] === optionIndex;
                      return (
                        <label
                          key={`${q.id}_${optionIndex}`}
                          className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2 ${
                            checked ? "border-primary bg-primary/10" : "bg-background"
                          }`}
                        >
                          <span className="text-sm">{opt}</span>
                          <input
                            type="radio"
                            name={`q_${q.id}`}
                            checked={checked}
                            onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: optionIndex }))}
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="flex gap-3 flex-wrap">
              <Button onClick={submitQuiz} disabled={busy}>
                {busy ? "Submitting..." : "Submit Quiz"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setPhase("idle");
                  setQuestions([]);
                  setAnswers({});
                  setResult(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        {isSubmitted && result ? (
          <div className="mt-6 rounded-2xl border bg-background p-4">
            <div className="text-sm font-semibold">
              Score: {result.score}/{result.total} ({result.percentage}%)
            </div>
            <div className={`mt-2 text-sm font-semibold ${result.passed ? "text-green-600" : "text-red-600"}`}>
              {result.passed ? "Passed" : "Not Passed"}
            </div>
          </div>
        ) : null}

        {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      </CardContent>
    </Card>
  );
}

