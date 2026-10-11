// The shared secret maths for protected video. Used by the packager
// (scripts/video/*, run by the GitHub Action) and by the server routes, so
// both sides agree on every key, IV and file name without storing any of them.
//
// One secret, VIDEO_SECRET, is set in two places: the GitHub Action (to
// encrypt) and the website's server (to hand out keys). Everything else is
// derived from it with HMAC-SHA256 and a label, so a leaked segment name or IV
// says nothing about any key.
//
// Plain TypeScript with no imports: Node runs it directly (type stripping)
// and Next bundles it for the server. Web Crypto only.

export const SEGMENT_SECONDS = 6;

/** Each student's copy carries their watermark id in which of two variants
 *  (a/b) every segment comes from. 16-bit id + 4-bit check = 20 segments
 *  (2 minutes) per repeat. */
export const FINGERPRINT_ID_BITS = 16;
export const FINGERPRINT_CHECK_BITS = 4;
export const FINGERPRINT_LENGTH = FINGERPRINT_ID_BITS + FINGERPRINT_CHECK_BITS;
export const MAX_WATERMARK_ID = 2 ** FINGERPRINT_ID_BITS - 1;

export type Variant = "a" | "b";

const enc = new TextEncoder();
const keyCache = new Map<string, Promise<CryptoKey>>();

function hmacKey(secret: string) {
  let k = keyCache.get(secret);
  if (!k) {
    k = crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    keyCache.set(secret, k);
  }
  return k;
}

export async function hmac(secret: string, message: string): Promise<Uint8Array> {
  if (!secret || secret.length < 32) throw new Error("VIDEO_SECRET must be at least 32 characters");
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(message));
  return new Uint8Array(sig);
}

export function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Identifies one encrypted segment file. */
export type SegmentRef = {
  course: string; // "the-prod"
  code: string; // "2.3"
  version: string; // content hash of the source upload, e.g. "3f9a1c2e"
  rendition: string; // "1080", "720", "480"
  variant: Variant;
  index: number; // 0-based segment number
};

const ref = (r: SegmentRef) => `${r.course}|${r.code}|${r.version}|${r.rendition}|${r.variant}|${r.index}`;

/** 16-byte AES-128 key for one segment. */
export async function segmentKey(secret: string, r: SegmentRef) {
  return (await hmac(secret, `key|${ref(r)}`)).slice(0, 16);
}

/** 16-byte IV for one segment (public: it's written in the playlist). */
export async function segmentIv(secret: string, r: SegmentRef) {
  return (await hmac(secret, `iv|${ref(r)}`)).slice(0, 16);
}

/** Unguessable file name, so the storage bucket can be public: names can't be
 *  listed or guessed, and a student only ever sees their own variant's names. */
export async function segmentName(secret: string, r: SegmentRef) {
  return `${toHex((await hmac(secret, `name|${ref(r)}`)).slice(0, 12))}.ts`;
}

/** Storage path of a segment: `<course>/<code>/<version>/<name>`. */
export async function segmentPath(secret: string, r: SegmentRef) {
  return `${r.course}/${r.code}/${r.version}/${await segmentName(secret, r)}`;
}

/** The 20-bit codeword for a watermark id: 16 id bits then a 4-bit check. */
export function fingerprintBits(watermarkId: number): number[] {
  if (!Number.isInteger(watermarkId) || watermarkId < 0 || watermarkId > MAX_WATERMARK_ID) {
    throw new Error(`watermark id must be 0–${MAX_WATERMARK_ID}`);
  }
  const bits: number[] = [];
  for (let i = FINGERPRINT_ID_BITS - 1; i >= 0; i--) bits.push((watermarkId >> i) & 1);
  // Check nibble: XOR of the four id nibbles, inverted so id 0 isn't all-a.
  let check = 0xf;
  for (let i = 0; i < FINGERPRINT_ID_BITS; i += 4) check ^= (watermarkId >> i) & 0xf;
  for (let i = FINGERPRINT_CHECK_BITS - 1; i >= 0; i--) bits.push((check >> i) & 1);
  return bits;
}

/** Which variant segment `index` comes from for this student. */
export function variantFor(watermarkId: number, index: number): Variant {
  return fingerprintBits(watermarkId)[index % FINGERPRINT_LENGTH] ? "b" : "a";
}
