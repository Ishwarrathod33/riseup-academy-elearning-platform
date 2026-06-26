"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/api";

type LectureProgress = {
  lastPositionSec: number;
  lastProgressPct: number;
  completedAt?: string | Date | null;
};

export function VideoLecturePlayer({
  lecture,
  accessToken,
  onProgressPctChange,
}: {
  lecture: {
    id: string;
    title: string;
    videoUrl: string;
    durationSec?: number | null;
    notesUrl?: string | null;
    pdfUrl?: string | null;
  } | null;
  accessToken: string | null;
  onProgressPctChange?: (lectureId: string, pct: number) => void;
}) {
  const [progress, setProgress] = React.useState<LectureProgress | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const lastSentRef = React.useRef<number>(0);
  const lastPositionRef = React.useRef<number>(0);
  const [sending, setSending] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"video" | "notes" | "pdf">("video");
  const [localError, setLocalError] = React.useState<string | null>(null);

  const authHeaders: Record<string, string> = {};
  if (accessToken) authHeaders.Authorization = `Bearer ${accessToken}`;

  async function fetchLectureProgress(lectureId: string) {
    const r = await fetch(`${API_BASE_URL}/api/lms/progress/lecture/${lectureId}`, {
      method: "GET",
      headers: { ...authHeaders },
      credentials: "include",
    });
    const data = await r.json().catch(() => null);
    if (!r.ok) throw new Error(data?.error ?? "Failed to load progress");
    return data?.progress as LectureProgress | null;
  }

  async function postProgress(lectureId: string, positionSec: number, durationSec: number | null | undefined) {
    const dur = durationSec ?? undefined;
    const r = await fetch(`${API_BASE_URL}/api/lms/progress/lecture/${lectureId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      credentials: "include",
      body: JSON.stringify({ positionSec: Math.floor(positionSec), durationSec: dur ? Math.floor(dur) : undefined }),
    });
    if (!r.ok) {
      const data = await r.json().catch(() => null);
      throw new Error(data?.error ?? "Failed to update progress");
    }
    const data = await r.json().catch(() => null);
    return data?.progress as LectureProgress;
  }

  // When lecture changes, load its progress and seek.
  React.useEffect(() => {
    setLocalError(null);
    setProgress(null);
    setActiveTab("video");
    if (!lecture || !accessToken) return;

    let cancelled = false;
    fetchLectureProgress(lecture.id)
      .then((p) => {
        if (cancelled) return;
        setProgress(p);
        if (videoRef.current && p?.lastPositionSec) {
          videoRef.current.currentTime = p.lastPositionSec;
        }
        if (onProgressPctChange && typeof p?.lastProgressPct === "number") {
          onProgressPctChange(lecture.id, p.lastProgressPct);
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setLocalError(e?.message ?? "Progress load failed");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lecture?.id, accessToken]);

  function shouldSendProgress(positionSec: number) {
    const now = Date.now();
    if (!lastSentRef.current) return true;
    const lastSentAgo = now - lastSentRef.current;
    if (lastSentAgo < 5000) return false; // throttle
    if (Math.abs(positionSec - lastPositionRef.current) < 8) return false;
    return true;
  }

  async function handleTimeUpdate() {
    const v = videoRef.current;
    if (!v || !lecture || !accessToken) return;

    const positionSec = v.currentTime;
    const durationSec = v.duration;

    if (!shouldSendProgress(positionSec)) return;

    lastSentRef.current = Date.now();
    lastPositionRef.current = positionSec;
    setSending(true);

    try {
      const updated = await postProgress(lecture.id, positionSec, Number.isFinite(durationSec) ? durationSec : null);
      setProgress(updated);
      if (onProgressPctChange && typeof (updated as any)?.lastProgressPct === "number") {
        onProgressPctChange(lecture.id, (updated as any).lastProgressPct);
      }
    } catch (e: any) {
      setLocalError(e?.message ?? "Progress update failed");
    } finally {
      setSending(false);
    }
  }

  async function markComplete() {
    if (!lecture || !accessToken) return;
    const v = videoRef.current;
    const durationSec = v?.duration ?? null;
    const pos = durationSec && Number.isFinite(durationSec) ? durationSec : (progress?.lastPositionSec ?? 0);
    setSending(true);
    try {
      const updated = await postProgress(lecture.id, pos, durationSec);
      setProgress(updated);
      if (onProgressPctChange && typeof (updated as any)?.lastProgressPct === "number") {
        onProgressPctChange(lecture.id, (updated as any).lastProgressPct);
      }
    } catch (e: any) {
      setLocalError(e?.message ?? "Failed to mark complete");
    } finally {
      setSending(false);
    }
  }

  async function handleEnded() {
    const v = videoRef.current;
    if (!v || !lecture || !accessToken) return;
    const durationSec = v.duration;
    try {
      await postProgress(lecture.id, durationSec, durationSec);
    } catch {
      // swallow
    }
  }
  
  if (!lecture) {
    return (
      <div className="rounded-3xl border bg-background p-6 text-sm text-muted-foreground shadow-soft">
        Select a lecture to start learning.
      </div>
    );
  }

  const notesUrl = lecture.notesUrl ?? null;
  const pdfUrl = lecture.pdfUrl ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-lg font-bold">{lecture.title}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {progress ? `Progress: ${Math.round(progress.lastProgressPct)}%` : "Progress will appear after you start"}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={activeTab === "video" ? "default" : "outline"}
            onClick={() => setActiveTab("video")}
          >
            Video
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeTab === "notes" ? "default" : "outline"}
            onClick={() => setActiveTab("notes")}
            disabled={!notesUrl}
          >
            Notes
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeTab === "pdf" ? "default" : "outline"}
            onClick={() => setActiveTab("pdf")}
            disabled={!pdfUrl}
          >
            PDF
          </Button>
        </div>
      </div>

      {localError ? <div className="rounded-xl border bg-red-50 p-3 text-sm text-red-700">{localError}</div> : null}

      {activeTab === "video" ? (
        <div className="rounded-3xl border bg-background p-3 shadow-soft">
         <video
            key={lecture.id}
            ref={videoRef}
            src={lecture.videoUrl}
            className="w-full max-h-[500px] rounded-2xl object-contain bg-black"
            controls
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
          >
            
          </video>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              {sending ? "Updating progress..." : "Progress auto-saves while video plays"}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={markComplete} disabled={sending}>
              Mark complete
            </Button>
          </div>
        </div>
      ) : null}

      {activeTab === "notes" ? (
        <div className="rounded-3xl border bg-background p-3 shadow-soft">
          {notesUrl ? (
            <iframe src={notesUrl} className="h-[520px] w-full rounded-2xl" title="Notes" />
          ) : (
            <div className="text-sm text-muted-foreground">No notes for this lecture.</div>
          )}
        </div>
      ) : null}

      {activeTab === "pdf" ? (
        <div className="rounded-3xl border bg-background p-3 shadow-soft">
          {pdfUrl ? (
            <iframe src={pdfUrl} className="h-[520px] w-full rounded-2xl" title="PDF" />
          ) : (
            <div className="text-sm text-muted-foreground">No PDF for this lecture.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

