"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type Hls from "hls.js";
import type { ErrorData } from "hls.js";
import { useDemo } from "@/lib/demo-store";
import type { Lesson } from "@/lib/types";

// Plays a protected lesson video (lesson.stream) in the player's <video>.
//
// 1. POST /api/video/session for a short-lived playlist URL. The server only
//    releases keys for a window of segments around the start point, and the
//    window grows a little faster than real time.
// 2. Play it with hls.js (loaded on demand), or natively on old iPhones.
// 3. A seek outside the window, or a key the server refuses (expired, video
//    updated, too far ahead), gets a new session from that point. The viewer
//    sees a short spinner and playback carries on.
//
// Nothing loads until the first play, so opening a lesson costs no session
// and no data.

export type StreamStatus = "idle" | "loading" | "ready" | "error";

/** A playback session from POST /api/video/session. */
export type StreamSession = {
  src: string;
  duration: number;
  segmentSeconds: number;
  from: number; // segment index the key window starts at
  window: { ahead: number; back: number; pace: number };
  label?: string;
  at: number; // performance.now() when it arrived
};

// Buffer ahead about as far as a new session's keys reach (6 segments).
const BUFFER = { maxBufferLength: 30, maxMaxBufferLength: 36, backBufferLength: 30 };
// The window grows a segment every 2.4 s (6 s / 2.5). A key just past its
// edge that isn't needed for a few seconds is worth waiting for: retry it on
// that beat a few times. One needed now means a new session instead.
const KEY_WAIT_MS = 2400;
const KEY_WAIT_RETRIES = 4;
const KEY_WAIT_LEAD_S = 3;
const SEEK_DEBOUNCE_MS = 250;
const MAX_RETRIES = 3; // automatic recoveries in a row before showing the error
const RETRY_DELAY_MS = 600; // waits 0, 0.6 s, 1.2 s

const GENERIC = "The video stopped loading. Check your connection and try again.";
const UNSUPPORTED = "This browser can't play protected video. Try a recent Chrome, Safari, Edge or Firefox.";

/** A session request that failed, with a message for the viewer. */
class SessionError extends Error {
  constructor(
    message: string,
    readonly final: boolean, // retrying won't help (signed out, locked, missing)
  ) {
    super(message);
  }
}

function sessionError(status: number) {
  if (status === 401) return new SessionError("Your session has ended. Sign in again to keep watching.", true);
  if (status === 403) return new SessionError("This video isn't unlocked on your account yet.", true);
  if (status === 404) return new SessionError("This video isn't ready yet. Please check back soon.", true);
  if (status === 429) return new SessionError("Too many restarts in a short time. Wait a minute, then try again.", true);
  return new SessionError("The video couldn't start. Please try again in a moment.", false);
}

/** Can playback from `seconds` start on this session's keys? It needs that
 *  segment and the next one now; later keys open faster than they're played. */
export function inWindow(s: StreamSession, seconds: number, now = performance.now()) {
  const seg = s.segmentSeconds;
  const last = Math.max(0, Math.ceil(s.duration / seg) - 1);
  const index = Math.min(last, Math.max(0, Math.floor(seconds / seg)));
  const elapsed = Math.max(0, now - s.at) / 1000;
  const min = Math.max(0, s.from - s.window.back);
  const max = s.from + s.window.ahead + Math.floor((elapsed / seg) * s.window.pace);
  return index >= min && Math.min(last, index + 1) <= max;
}

async function fetchSession(
  video: { course: string; code: string },
  from: number,
  viewer: { name: string; email: string } | null,
  signal: AbortSignal,
): Promise<StreamSession> {
  let res: Response;
  try {
    res = await fetch("/api/video/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // The demo identity only counts while the server has VIDEO_DEV_OPEN=1.
      body: JSON.stringify({ ...video, from, ...(viewer ? { demo: { name: viewer.name, email: viewer.email } } : {}) }),
      signal,
    });
  } catch (e) {
    if (signal.aborted) throw e;
    throw new SessionError(GENERIC, false);
  }
  if (!res.ok) throw sessionError(res.status);
  const s = (await res.json().catch(() => null)) as Omit<StreamSession, "at"> | null;
  if (!s || typeof s.src !== "string" || !s.src.startsWith("/api/video/") || !(s.segmentSeconds > 0) || !s.window) {
    throw new SessionError(GENERIC, false);
  }
  return { ...s, at: performance.now() };
}

/** Pause, and make sure listeners hear it: an element emptied for a reload
 *  is already paused but never said so (see teardown). */
function pauseNow(el: HTMLVideoElement) {
  if (!el.paused) el.pause();
  else el.dispatchEvent(new Event("pause"));
}

// hls.js is big, so it's only fetched for the first protected video played.
let hlsModule: Promise<typeof Hls | null> | null = null;
function loadHls() {
  hlsModule ??= import("hls.js").then(
    (m) => m.default,
    () => {
      hlsModule = null; // let the next attempt try again
      return null;
    },
  );
  return hlsModule;
}

/**
 * Drives `video` for a protected lesson. `position` is the player's time
 * display: where to start, and where to come back to after a reload.
 * `busy()` is true while the stream is (re)loading, when the element's own
 * time jumps around and should be ignored. `pause()` also works mid-reload,
 * when the element is paused already but the player still shows playing.
 */
export function useSecureStream(video: RefObject<HTMLVideoElement | null>, stream: Lesson["stream"], position: number) {
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState<string | null>(null);
  const { user } = useDemo();
  const viewer = useRef(user);
  const where = useRef(position);
  const loading = useRef(false);
  const actions = useRef({ retry: () => {}, pause: () => {} });

  useEffect(() => {
    viewer.current = user;
    where.current = position;
  });

  const course = stream?.course;
  const code = stream?.code;

  useEffect(() => {
    const found = video.current;
    if (!course || !code || !found) return;
    const el: HTMLVideoElement = found;
    const ref = { course, code };

    let alive = true;
    let state: StreamStatus = "idle";
    let hls: Hls | null = null;
    let session: StreamSession | null = null;
    let request: AbortController | null = null;
    let seekTimer: ReturnType<typeof setTimeout> | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false; // hls.js loading held while the viewer scrubs
    let failures = 0;
    let resumeAt = 0; // where the last (re)load started
    let resume = false; // play once (re)loaded
    let playAfterRetry = false;
    let nativeStart = -1; // native HLS: seek here once metadata is in

    function set(next: StreamStatus, message: string | null = null) {
      state = next;
      loading.current = next === "loading";
      setStatus(next);
      setError(message);
    }

    const here = () => (loading.current || el.readyState === 0 ? where.current : el.currentTime);
    /** Does segment `index` start far enough ahead of the playhead to wait for its key? */
    const ahead = (index: number, seg: number) => Number.isFinite(index) && index * seg - here() > KEY_WAIT_LEAD_S;
    /** Segment index from a key URL, `.../key/<rendition>/<index>?t=...`. */
    const keyIndex = (url = "") => Number(/\/key\/[^/?]+\/(\d+)/.exec(url)?.[1]);
    const wantsPlay = () => (state === "loading" ? resume : !el.paused);

    /** Stop everything and leave the element empty. Emptying it pauses it
     *  without a pause event, so the player keeps showing "playing" through
     *  a reload; fail() tells it otherwise. */
    function teardown() {
      clearTimeout(seekTimer);
      clearTimeout(retryTimer);
      request?.abort();
      request = null;
      session = null;
      stopped = false;
      nativeStart = -1;
      if (hls) {
        hls.destroy();
        hls = null;
      } else if (el.hasAttribute("src")) {
        el.removeAttribute("src");
        el.load();
      }
    }

    /** Get a session starting at `at` seconds and play it from there. */
    async function load(at: number, play: boolean) {
      teardown();
      set("loading");
      resume = play;
      resumeAt = at;
      const ctrl = new AbortController();
      request = ctrl;
      let HlsClass: typeof Hls | null;
      let s: StreamSession;
      try {
        [HlsClass, s] = await Promise.all([loadHls(), fetchSession(ref, at, viewer.current, ctrl.signal)]);
      } catch (e) {
        if (!alive || ctrl.signal.aborted) return;
        request = null;
        if (e instanceof SessionError && !e.final) recover();
        else fail(e instanceof SessionError ? e.message : GENERIC);
        return;
      }
      if (!alive || request !== ctrl) return;
      request = null;
      session = s;
      if (s.label) setLabel(s.label);
      const start = Math.max(0, Math.min(at, s.duration - 0.5));

      if (HlsClass?.isSupported()) {
        const H = HlsClass;
        const keys = H.DefaultConfig.keyLoadPolicy.default;
        const h = new H({
          ...BUFFER,
          startPosition: start,
          capLevelToPlayerSize: true,
          keyLoadPolicy: {
            default: {
              ...keys,
              errorRetry: {
                maxNumRetry: KEY_WAIT_RETRIES,
                retryDelayMs: KEY_WAIT_MS,
                maxRetryDelayMs: KEY_WAIT_MS,
                backoff: "linear",
                // hls.js's loader asks this before it reports an error.
                shouldRetry: (_config, count, _timeout, response, retry) =>
                  retry || (response?.code === 429 && count < KEY_WAIT_RETRIES && ahead(keyIndex(response.url), s.segmentSeconds)),
              },
            },
          },
        });
        hls = h;
        let mediaRecovered = false;
        h.on(H.Events.MANIFEST_PARSED, () => {
          if (h === hls && resume && el.paused) el.play().catch(() => {});
        });
        h.on(H.Events.ERROR, (_event, data: ErrorData) => {
          if (h !== hls || state === "error") return;
          const http = data.response?.code ?? 0;
          // The key server's "get a new session": token expired, video
          // re-uploaded, or a key outside this session's window.
          if (data.type === H.ErrorTypes.NETWORK_ERROR && (http === 401 || http === 410 || http === 429)) {
            // Still waiting on a key ahead (hls.js tries another rendition).
            if (http === 429 && !data.fatal && data.frag && data.frag.start - here() > KEY_WAIT_LEAD_S) return;
            return recover();
          }
          if (!data.fatal) return;
          if (data.type === H.ErrorTypes.MEDIA_ERROR && !mediaRecovered) {
            mediaRecovered = true;
            h.recoverMediaError();
            return;
          }
          recover();
        });
        h.loadSource(s.src);
        h.attachMedia(el);
      } else if (el.canPlayType("application/vnd.apple.mpegurl")) {
        nativeStart = start;
        el.src = s.src;
      } else {
        fail(UNSUPPORTED);
      }
    }

    /** Something broke mid-stream: start again from here, a few times at most. */
    function recover() {
      if (state === "error") return;
      const at = here();
      const play = wantsPlay();
      if (++failures > MAX_RETRIES) return fail(GENERIC, play);
      teardown();
      resume = play;
      set("loading");
      retryTimer = setTimeout(() => void load(at, resume), RETRY_DELAY_MS * (failures - 1));
    }

    function fail(message: string, play = wantsPlay()) {
      teardown();
      playAfterRetry = play;
      set("error", message);
      pauseNow(el);
    }

    function retry() {
      if (state !== "error") return;
      failures = 0;
      const play = playAfterRetry || !el.paused;
      void load(here(), play);
      // Called from a click: start play() inside the gesture for iOS.
      if (play && el.paused) el.play().catch(() => {});
    }

    function ready() {
      if (state !== "loading" || !session) return;
      set("ready");
      // The viewer moved the playhead while it loaded: go there now.
      if (Math.abs(where.current - el.currentTime) > 1) el.currentTime = where.current;
    }

    // Element events
    function onPlay() {
      if (state === "idle") void load(here(), true);
      else if (state === "error") retry();
      else if (state === "loading") resume = true;
    }
    function onPause() {
      if (state === "loading") resume = false;
    }
    function onLoadedMetadata() {
      if (nativeStart < 0) return;
      if (nativeStart > 0) el.currentTime = nativeStart;
      nativeStart = -1;
      if (resume && el.paused) el.play().catch(() => {});
    }
    function onSeeking() {
      if (state !== "ready" || !session) return;
      const s = session;
      clearTimeout(seekTimer);
      // Don't ask for keys the server will refuse while the viewer scrubs.
      if (hls && !stopped && !inWindow(s, el.currentTime)) {
        stopped = true;
        hls.stopLoad();
      }
      seekTimer = setTimeout(() => {
        if (!alive || state !== "ready" || session !== s) return;
        const at = el.currentTime;
        if (!inWindow(s, at)) return void load(at, !el.paused);
        if (stopped && hls) {
          stopped = false;
          hls.startLoad(at);
        }
      }, SEEK_DEBOUNCE_MS);
    }
    function onTimeUpdate() {
      // A segment of clean playback since the last reload: reset the count.
      if (failures && state === "ready" && session && el.currentTime > resumeAt + session.segmentSeconds) failures = 0;
    }
    function onError() {
      // Native HLS reports a refused key as a media error; hls.js has its own.
      if (!hls && session && state !== "error") recover();
    }

    const events: [string, () => void][] = [
      ["play", onPlay],
      ["pause", onPause],
      ["loadedmetadata", onLoadedMetadata],
      ["canplay", ready],
      ["playing", ready],
      ["seeking", onSeeking],
      ["timeupdate", onTimeUpdate],
      ["error", onError],
    ];
    for (const [name, fn] of events) el.addEventListener(name, fn);
    actions.current = { retry, pause: () => pauseNow(el) };

    return () => {
      alive = false;
      for (const [name, fn] of events) el.removeEventListener(name, fn);
      actions.current = { retry: () => {}, pause: () => {} };
      teardown();
      loading.current = false;
    };
  }, [video, course, code]);

  const retry = useCallback(() => actions.current.retry(), []);
  const busy = useCallback(() => loading.current, []);
  const pause = useCallback(() => actions.current.pause(), []);

  return { status, error, retry, label, busy, pause };
}
