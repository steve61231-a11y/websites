import { hmac, MAX_WATERMARK_ID } from "./derive.ts";

// Short-lived playback tokens. One token = one student watching one video
// from one position. It rides in the playlist and key URLs (`?t=`), so it is
// self-contained and signed: the key server needs no database lookup.
//
// Format: base64url(JSON payload) + "." + base64url(HMAC(VIDEO_SECRET, "token|" + payloadPart))

export const TOKEN_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export type TokenPayload = {
  v: 1;
  sub: string; // user id
  w: number; // watermark id, picks the a/b variant of every segment
  c: string; // course, e.g. "the-prod"
  k: string; // video code, e.g. "2.3"
  ver: string; // stream version the token was issued for
  f: number; // segment index the paced window starts from
  iat: number; // issued at, ms
  exp: number; // expires at, ms
  sid: string; // random session id
};

export type TokenCheck =
  | { ok: true; payload: TokenPayload }
  | { ok: false; reason: "malformed" | "signature" | "expired" };

const enc = new TextEncoder();
const dec = new TextDecoder();

function toB64url(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(s)) return null;
  try {
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

/** Compare without leaking where the first difference is. */
function sameBytes(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

const signature = async (secret: string, payloadPart: string) => hmac(secret, `token|${payloadPart}`);

export function newSessionId() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return toB64url(bytes);
}

export async function signToken(secret: string, payload: TokenPayload) {
  const payloadPart = toB64url(enc.encode(JSON.stringify(payload)));
  return `${payloadPart}.${toB64url(await signature(secret, payloadPart))}`;
}

function isPayload(p: unknown): p is TokenPayload {
  if (!p || typeof p !== "object") return false;
  const t = p as Record<string, unknown>;
  return (
    t.v === 1 &&
    typeof t.sub === "string" &&
    Number.isInteger(t.w) &&
    (t.w as number) >= 0 &&
    (t.w as number) <= MAX_WATERMARK_ID &&
    typeof t.c === "string" &&
    typeof t.k === "string" &&
    typeof t.ver === "string" &&
    Number.isInteger(t.f) &&
    (t.f as number) >= 0 &&
    typeof t.iat === "number" &&
    typeof t.exp === "number" &&
    typeof t.sid === "string"
  );
}

/** Check signature and expiry. Never throws on bad input. */
export async function verifyToken(secret: string, token: string | null | undefined, now = Date.now()): Promise<TokenCheck> {
  if (!token || token.length > 2048) return { ok: false, reason: "malformed" };
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, reason: "malformed" };
  const [payloadPart, sigPart] = parts;
  if (!fromB64url(sigPart) || !fromB64url(payloadPart)) return { ok: false, reason: "malformed" };
  // Signature first, so nothing from an unsigned payload is ever parsed.
  // Compared as text, so only the one canonical encoding is accepted.
  const expected = toB64url(await signature(secret, payloadPart));
  if (!sameBytes(enc.encode(sigPart), enc.encode(expected))) return { ok: false, reason: "signature" };
  let payload: unknown;
  try {
    payload = JSON.parse(dec.decode(fromB64url(payloadPart)!));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (!isPayload(payload)) return { ok: false, reason: "malformed" };
  if (now >= payload.exp) return { ok: false, reason: "expired" };
  return { ok: true, payload };
}
