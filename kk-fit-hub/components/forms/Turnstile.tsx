"use client";

import Script from "next/script";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

/**
 * Cloudflare Turnstile, loaded only on form pages (PRD 12). Runs in
 * "execute" mode: a fresh token is requested for each submission or upload,
 * and a challenge only appears if Cloudflare needs one. Without a site key
 * (local development) it returns an empty token and the server skips it.
 */
type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  execute: (id: string) => void;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export type TurnstileHandle = { getToken: () => Promise<string> };

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export const Turnstile = forwardRef<TurnstileHandle>(function Turnstile(_, ref) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const pending = useRef<{ resolve: (t: string) => void; reject: (e: Error) => void } | null>(null);
  const [loaded, setLoaded] = useState(() => typeof window !== "undefined" && Boolean(window.turnstile));

  useEffect(() => {
    if (!siteKey || !loaded || !box.current || !window.turnstile || widget.current) return;
    widget.current = window.turnstile.render(box.current, {
      sitekey: siteKey,
      execution: "execute",
      appearance: "interaction-only",
      callback: (token: string) => {
        pending.current?.resolve(token);
        pending.current = null;
      },
      "error-callback": () => {
        pending.current?.reject(new Error("turnstile"));
        pending.current = null;
      },
    });
    return () => {
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, [loaded]);

  const getToken = useCallback(async () => {
    if (!siteKey) return "";
    const api = window.turnstile;
    const id = widget.current;
    if (!api || !id) throw new Error("turnstile not ready");
    return new Promise<string>((resolve, reject) => {
      pending.current = { resolve, reject };
      api.reset(id);
      api.execute(id);
      setTimeout(() => {
        if (pending.current) {
          pending.current.reject(new Error("turnstile timeout"));
          pending.current = null;
        }
      }, 30_000);
    });
  }, []);

  useImperativeHandle(ref, () => ({ getToken }), [getToken]);

  if (!siteKey) return null;
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setLoaded(true)}
      />
      <div ref={box} className="mt-4 empty:hidden" />
    </>
  );
});
