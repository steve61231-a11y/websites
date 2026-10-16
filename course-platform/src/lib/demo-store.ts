"use client";

import { useSyncExternalStore } from "react";
import type { ProgressState, QuizAttempt } from "./progress";
import { backendOn } from "./backend";
import type { Receipt } from "./receipt";
import { authedFetch, browser } from "./supabase-browser";

// The app's single source of student state, in two modes:
//  * Demo (no Supabase settings): a sample student, saved in this browser.
//  * Backend (see lib/backend.ts): the same shape, loaded from /api/me after
//    sign-in. Changes show at once, and are sent to the server, which
//    re-checks them (enrolment, unlock rules, quiz grading) and keeps the
//    record. user → profiles, enrolled → enrollments, completedLessons →
//    lesson_progress, quizAttempts → quiz_attempts, certificates → certificates.

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
  /** The last purchase's receipt (demo; in production it lives server-side). */
  receipt: Receipt | null;
};

const KEY = "the-prod-demo-v2"; // bump to start every visitor fresh

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
  receipt: null,
};

let state: DemoState = empty;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  if (backendOn) {
    state = { ...empty }; // not ready until we know whether someone is signed in
    void hydrate();
    return;
  }
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
  if (!backendOn) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ ...state, ready: undefined }));
    } catch {
      // Storage can be unavailable (private mode); the demo still works in memory.
    }
  }
  listeners.forEach((l) => l());
}

// ---- backend mode ------------------------------------------------------------

type Me = {
  user: { name: string; email: string };
  enrolled: string[];
  completedLessons: Record<string, string>;
  quizAttempts: ProgressState["quizAttempts"];
  positions: Record<string, number>;
  certificates: Certificate[];
};

async function fetchMe() {
  try {
    const res = await authedFetch("/api/me");
    if (!res.ok) {
      set(() => ({ ...empty, ready: true }));
      return;
    }
    const me = (await res.json()) as Me;
    set(() => ({ ready: true, user: me.user, enrolled: me.enrolled, completedLessons: me.completedLessons, quizAttempts: me.quizAttempts, positions: me.positions, certificates: me.certificates }));
  } catch {
    set(() => ({ ready: true }));
  }
}

async function hydrate() {
  try {
    const sb = await browser();
    const { data } = await sb.auth.getSession();
    if (data.session) await fetchMe();
    else set(() => ({ ready: true }));
    sb.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) void fetchMe();
      if (event === "SIGNED_OUT") set(() => ({ ...empty, ready: true }));
    });
  } catch {
    set(() => ({ ready: true }));
  }
}

/** Tells the server about a change. If it refuses (or can't be reached), reload the truth. */
function send(body: Record<string, unknown>) {
  return authedFetch("/api/progress", { method: "POST", body: JSON.stringify(body) }).then(
    async (res) => {
      if (!res.ok) await fetchMe();
    },
    () => fetchMe(),
  );
}

async function api(path: string, init: RequestInit) {
  const res = await authedFetch(path, init);
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error(typeof body.error === "string" ? body.error : "Something went wrong. Please try again.");
  return body;
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
  purchase(courseId: string, email: string, name: string, receipt: Receipt | null = null) {
    set((s) => ({
      purchaseEmail: email.toLowerCase(),
      purchaseName: name,
      receipt,
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
    if (backendOn) {
      void browser().then((sb) => sb.auth.signOut());
      set(() => ({ ...empty, ready: true }));
      return;
    }
    set(() => ({ user: null }));
  },
  updateName(name: string) {
    set((s) => ({ user: s.user ? { ...s.user, name } : null }));
    if (backendOn) void api("/api/me", { method: "PATCH", body: JSON.stringify({ name }) }).catch(() => fetchMe());
  },
  /** Backend: emails a 6-digit code. Only people who have bought something can sign in. */
  async requestCode(email: string): Promise<string | null> {
    const sb = await browser();
    const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    if (!error) return null;
    if (/not allowed|not found|signups/i.test(error.message)) return "We couldn't find a purchase for that email. Use the email you paid with, or get access first.";
    if (/rate|seconds|too many/i.test(error.message)) return "Please wait a minute before asking for another code.";
    return "We couldn't send the code. Please try again.";
  },
  /** Backend: checks the code. On success the app loads the student's data. */
  async verifyCode(email: string, token: string): Promise<string | null> {
    const sb = await browser();
    const { error } = await sb.auth.verifyOtp({ email, token, type: "email" });
    if (error) return "That code didn't work. Check it and try again, or ask for a new one.";
    await fetchMe(); // so the next page already knows who this is
    return null;
  },
  async signInWithGoogle() {
    const sb = await browser();
    await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/learn` } });
  },
  completeLesson(lessonId: string) {
    if (backendOn && !state.completedLessons[lessonId]) void send({ action: "lesson", lessonId });
    set((s) =>
      s.completedLessons[lessonId]
        ? {}
        : { completedLessons: { ...s.completedLessons, [lessonId]: new Date().toISOString() } },
    );
  },
  savePosition(lessonId: string, seconds: number) {
    if (backendOn) void send({ action: "position", lessonId, seconds: Math.floor(seconds) });
    set((s) => ({ positions: { ...s.positions, [lessonId]: seconds } }));
  },
  recordAttempt(quizId: string, attempt: QuizAttempt) {
    // Shown at once; in backend mode the server re-grades it and the app reloads the saved result.
    if (backendOn) void send({ action: "quiz", quizId, answers: attempt.answers }).then(() => fetchMe());
    set((s) => ({
      quizAttempts: { ...s.quizAttempts, [quizId]: [...(s.quizAttempts[quizId] ?? []), attempt] },
    }));
  },
  async issueCertificate(courseId: string, code: string, name?: string): Promise<Certificate> {
    load();
    const existing = state.certificates.find((c) => c.courseId === courseId);
    if (existing) return existing;
    if (backendOn) {
      const body = (await api("/api/certificate", { method: "POST", body: JSON.stringify({ courseId, name }) })) as { certificate: Certificate };
      set((s) => ({ certificates: [...s.certificates.filter((c) => c.courseId !== courseId), body.certificate] }));
      return body.certificate;
    }
    const year = new Date().getFullYear();
    const seq = String(100 + Math.floor(Math.random() * 900)).padStart(6, "0");
    const cert: Certificate = {
      number: `CERT-${year}-${code}-${seq}`,
      courseId,
      name: name?.trim() || state.user?.name || "Student",
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
