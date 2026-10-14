"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

/** Undo toast (PRD 15): status changes, notes and check results save
 * instantly, with a 5-second undo. */
type ToastItem = { id: number; message: string; undo?: () => void | Promise<void>; tone?: "ok" | "error" };
const ToastContext = createContext<(t: Omit<ToastItem, "id">) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((t: Omit<ToastItem, "id">) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ ...t, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), 5000);
  }, []);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <ToastContext value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 lg:bottom-6">
        {toast && (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex max-w-md items-center gap-4 rounded-full px-5 py-3 text-[15px] shadow-float animate-[kk-fade_var(--dur-small)_var(--ease-out)_both] ${
              toast.tone === "error" ? "bg-orange-700 text-white" : "bg-ink-900 text-canvas"
            }`}
          >
            <span>{toast.message}</span>
            {toast.undo && (
              <button
                type="button"
                className="min-h-9 font-semibold text-green-300 underline-offset-4 hover:underline"
                onClick={async () => {
                  const undo = toast.undo;
                  setToast(null);
                  await undo?.();
                }}
              >
                Undo
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext>
  );
}
