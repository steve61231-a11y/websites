"use client";

import { useSyncExternalStore } from "react";
import type { ProgressState, QuizAttempt } from "./progress";

// Phase 1 demo persistence. Everything here maps 1:1 to Supabase tables in
// Phase 2: user → profiles, enrolled → enrollments, completedLessons →
// lesson_progress, quizAttempts → quiz_attempts, certificates → certificates.

export type Certificate = {
  number: string;
  courseId: string;
  name: string;
  issuedAt: string;
};

export type DemoState = ProgressState & {
  ready: boolean;
  user: { name: string; email: string } | null;
  enrolled: string[];
  positions: Record<string, number>;
  certificates: Certificate[];
  purchaseEmail: string | null;
  purchaseName: string | null;
};

const KEY = "the-prod-demo-v1";

const empty: DemoState = {
  ready: false,
  user: null,
  enrolled: [],
  completedLessons: {},
  quizAttempts: {},
  positions: {},
  certificates: [],
  purchaseEmail: null,
  purchaseName: null,
};

let state: DemoState = empty;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    state = { ...empty, ...(raw ? JSON.parse(raw) : {}), ready: true };
  } catch {
    state = { ...empty, ready: true };
  }
}

function set(update: (s: DemoState) => Partial<DemoState>) {
  load();
  state = { ...state, ...update(state) };
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...state, ready: undefined }));
  } catch {
    // Storage can be unavailable (private mode); the demo still works in memory.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDemo() {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return state;
    },
    () => empty,
  );
}

export const demo = {
  purchase(courseId: string, email: string, name: string) {
    set((s) => ({
      purchaseEmail: email.toLowerCase(),
      purchaseName: name,
      enrolled: s.enrolled.includes(courseId) ? s.enrolled : [...s.enrolled, courseId],
    }));
  },
  signIn(email: string) {
    const fallback = email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    // Demo authorization: entitlement follows the purchase email, never the login alone.
    set((s) => {
      const purchased = s.purchaseEmail === email.toLowerCase();
      return {
        user: { email, name: (purchased && s.purchaseName) || fallback },
        enrolled: purchased ? s.enrolled : [],
      };
    });
  },
  signInAsSample(courseId: string) {
    set((s) => ({
      user: { name: "Amani Wanjiru", email: "amani@example.com" },
      enrolled: s.enrolled.includes(courseId) ? s.enrolled : [...s.enrolled, courseId],
    }));
  },
  signOut() {
    set(() => ({ user: null }));
  },
  updateName(name: string) {
    set((s) => ({ user: s.user ? { ...s.user, name } : null }));
  },
  completeLesson(lessonId: string) {
    set((s) =>
      s.completedLessons[lessonId]
        ? {}
        : { completedLessons: { ...s.completedLessons, [lessonId]: new Date().toISOString() } },
    );
  },
  savePosition(lessonId: string, seconds: number) {
    set((s) => ({ positions: { ...s.positions, [lessonId]: seconds } }));
  },
  recordAttempt(quizId: string, attempt: QuizAttempt) {
    set((s) => ({
      quizAttempts: { ...s.quizAttempts, [quizId]: [...(s.quizAttempts[quizId] ?? []), attempt] },
    }));
  },
  issueCertificate(courseId: string, code: string): Certificate {
    load();
    const existing = state.certificates.find((c) => c.courseId === courseId);
    if (existing) return existing;
    const year = new Date().getFullYear();
    const seq = String(100 + Math.floor(Math.random() * 900)).padStart(6, "0");
    const cert: Certificate = {
      number: `CERT-${year}-${code}-${seq}`,
      courseId,
      name: state.user?.name ?? "Student",
      issuedAt: new Date().toISOString(),
    };
    set((s) => ({ certificates: [...s.certificates, cert] }));
    return cert;
  },
  /** Demo shortcut: complete everything up to the final module. */
  fastForward(lessonIds: string[], quizIds: string[]) {
    const now = new Date().toISOString();
    set((s) => ({
      completedLessons: Object.fromEntries(lessonIds.map((id) => [id, s.completedLessons[id] ?? now])),
      quizAttempts: Object.fromEntries(
        quizIds.map((id) => [id, [{ score: 4, total: 4, passed: true, answers: {}, at: now }]]),
      ),
      certificates: [],
    }));
  },
  resetProgress() {
    set(() => ({ completedLessons: {}, quizAttempts: {}, positions: {}, certificates: [] }));
  },
  resetAll() {
    set(() => ({ ...empty, ready: true }));
  },
};
