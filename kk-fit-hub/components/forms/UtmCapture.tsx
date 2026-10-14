"use client";

import { useEffect } from "react";

const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
export const UTM_STORAGE_KEY = "kk-utm";

/** Remembers UTM parameters from the landing page for this visit, so they
 * are stored with a submission made on a later page (PRD 3). */
export function UtmCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const found = Object.fromEntries(keys.flatMap((k) => (params.get(k) ? [[k, params.get(k)!.slice(0, 120)]] : [])));
      if (Object.keys(found).length > 0) sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(found));
    } catch {
      // Storage can be unavailable (private mode); attribution is best-effort.
    }
  }, []);
  return null;
}

export function storedUtm(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}
