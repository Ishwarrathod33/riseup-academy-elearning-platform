"use client";

import * as React from "react";

type ToastContextValue = (message: string, variant?: "success" | "error") => void;

const ToastContext = React.createContext<ToastContextValue>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [variant, setVariant] = React.useState<"success" | "error">("success");

  const show = React.useCallback((msg: string, v: "success" | "error" = "success") => {
    setMessage(msg);
    setVariant(v);
    setOpen(true);
    window.setTimeout(() => setOpen(false), 4000);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {open ? (
        <div
          role="status"
          className={`fixed bottom-4 left-1/2 z-[100] max-w-md -translate-x-1/2 rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 sm:left-auto sm:right-6 sm:translate-x-0 ${
            variant === "success"
              ? "border-emerald-200 bg-emerald-50/95 text-emerald-900 ring-1 ring-emerald-100"
              : "border-red-200 bg-red-50/95 text-red-900 ring-1 ring-red-100"
          }`}
        >
          {message}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return React.useContext(ToastContext);
}
