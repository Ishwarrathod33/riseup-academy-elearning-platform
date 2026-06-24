"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { API_BASE_URL } from "@/lib/api";

type Assignment = {
  id: string;
  courseId: string;
  title: string;
  description?: string | null;
  dueAt?: string | Date | null;
  submission?: {
    attachmentUrl?: string | null;
    answerText?: string | null;
    submittedAt?: string | Date | null;
  } | null;
};

export function AssignmentsSection({
  courseId,
  accessToken,
  onSubmitted,
}: {
  courseId: string;
  accessToken: string | null;
  onSubmitted?: () => void;
}) {
  const [assignments, setAssignments] = React.useState<Assignment[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [answerText, setAnswerText] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  async function loadAssignments() {
    setError(null);
    setSuccess(null);
    const r = await fetch(`${API_BASE_URL}/api/lms/assignments`, {
      method: "GET",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      credentials: "include",
    });
    const data = await r.json().catch(() => null);
    if (!r.ok) throw new Error(data?.error ?? "Failed to load assignments");

    const list = (data?.assignments ?? []) as Assignment[];
    // If endpoint includes all enrolled courses, filter by this course.
    const forCourse = list.filter((a) => a.courseId === courseId);
    setAssignments(forCourse);
    setSelectedId(forCourse[0]?.id ?? null);
  }

  React.useEffect(() => {
    if (!accessToken) return;
    loadAssignments().catch((e) => setError(e?.message ?? "Failed"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, accessToken]);

  React.useEffect(() => {
    const asg = assignments.find((a) => a.id === selectedId) ?? null;
    setAnswerText(asg?.submission?.answerText ?? "");
    setFile(null);
    setError(null);
    setSuccess(null);
  }, [selectedId]);

  async function uploadAttachment(f: File) {
    const form = new FormData();
    form.append("file", f);
    const token = accessToken;

    const r = await fetch(`${API_BASE_URL}/api/lms/uploads/assignment`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
      body: form,
    });
    const data = await r.json().catch(() => null);
    if (!r.ok) throw new Error(data?.error ?? "Upload failed");
    return data?.url as string;
  }

  async function submit() {
    if (!selectedId) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      let attachmentUrl: string | undefined = undefined;
      if (file) {
        attachmentUrl = await uploadAttachment(file);
      }

      const r = await fetch(`${API_BASE_URL}/api/lms/assignments/${selectedId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          answerText: answerText.trim() ? answerText.trim() : undefined,
          ...(attachmentUrl ? { attachmentUrl } : {}),
        }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(data?.error ?? "Submit failed");

      setSuccess("Submitted successfully.");
      setFile(null);
      onSubmitted?.();
      await loadAssignments();
    } catch (e: any) {
      setError(e?.message ?? "Failed to submit");
    } finally {
      setBusy(false);
    }
  }

  const selected = assignments.find((a) => a.id === selectedId) ?? null;

  return (
    <Card className="animate-fade-up">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-bold">Assignments</div>
            <div className="mt-1 text-sm text-muted-foreground">Upload answers and submit before due date.</div>
          </div>
        </div>

        {!assignments.length ? (
          <div className="mt-5 rounded-2xl border bg-background p-4 text-sm text-muted-foreground">No assignments yet.</div>
        ) : null}

        {assignments.length ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="space-y-3">
              {assignments.map((a) => {
                const active = a.id === selectedId;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedId(a.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      active ? "border-primary bg-primary/10" : "bg-background"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold">{a.title}</div>
                      {a.submission ? <div className="text-xs font-semibold text-green-600">Submitted</div> : null}
                    </div>
                    {a.dueAt ? <div className="mt-1 text-xs text-muted-foreground">Due: {new Date(a.dueAt).toLocaleString()}</div> : null}
                  </button>
                );
              })}
            </div>

            <div>
              {selected ? (
                <div className="rounded-3xl border bg-background p-4">
                  <div className="text-sm font-semibold">{selected.title}</div>
                  {selected.description ? <div className="mt-2 text-sm text-muted-foreground">{selected.description}</div> : null}
                  {selected.submission?.attachmentUrl ? (
                    <div className="mt-3 text-sm">
                      <div className="font-semibold">Previous attachment</div>
                      <a className="text-primary hover:underline" href={selected.submission.attachmentUrl} target="_blank" rel="noreferrer">
                        View/Download
                      </a>
                    </div>
                  ) : null}

                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="text-sm font-semibold">Answer (text)</div>
                      <textarea
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        rows={6}
                        placeholder="Write your solution here..."
                      />
                    </div>

                    <div>
                      <div className="text-sm font-semibold">Attachment (optional)</div>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        className="mt-2 w-full text-sm"
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      />
                      {file ? <div className="mt-2 text-xs text-muted-foreground">Selected: {file.name}</div> : null}
                    </div>

                    {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
                    {success ? <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div> : null}

                    <Button onClick={submit} disabled={busy}>
                      {busy ? "Submitting..." : "Submit Assignment"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

