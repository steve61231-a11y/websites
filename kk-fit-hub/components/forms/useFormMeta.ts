"use client";

import { useCallback, useState } from "react";
import { uuid } from "@/lib/uuid";
import { storedUtm } from "./UtmCapture";

const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];

/**
 * Hidden attribution and protection fields (PRD 3, 8.1): `source`, UTM
 * values and an idempotency key that protects against double submits.
 */
export function useFormMeta(params: URLSearchParams) {
  const [idempotencyKey, setKey] = useState(() => uuid());
  const source = params.get("source")?.slice(0, 60) || undefined;
  const utm: Record<string, string> = typeof window === "undefined" ? {} : storedUtm();
  for (const k of utmKeys) {
    const v = params.get(k);
    if (v) utm[k] = v.slice(0, 120);
  }
  const renew = useCallback(() => setKey(uuid()), []);
  return { idempotencyKey, source, utm, renew };
}
