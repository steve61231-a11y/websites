// Tests for the protected-video key server logic. No network, no Next.
//   node scripts/video/test-server.ts
// Covers: token sign/verify (tamper, expiry), playlists (one key per segment,
// relative key URIs, absolute CDN URLs, the student's own a/b variant), the
// paced key window, key release, the session rate limits and the demo viewer.

import assert from "node:assert/strict";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import {
  FINGERPRINT_LENGTH,
  SEGMENT_SECONDS,
  segmentIv,
  segmentKey,
  segmentPath,
  toHex,
  variantFor,
  type SegmentRef,
  type Variant,
} from "../../src/lib/video/derive.ts";
import { KEY_WINDOW, keyWindow, masterPlaylist, mediaPlaylist, releaseKey, segmentAt, type VideoStream } from "../../src/lib/video/hls.ts";
import { allowSession, resetRateLimits, SESSION_LIMITS } from "../../src/lib/video/rate-limit.ts";
import { signToken, TOKEN_TTL_MS, verifyToken, type TokenPayload } from "../../src/lib/video/token.ts";

const SECRET = "test-secret-0123456789abcdef-0123456789";
const OTHER_SECRET = "another-secret-0123456789abcdef-012345";
const CDN = "https://media.example.com";
const course = "the-prod";
const code = "2.3";

// 41 segments: long enough for two fingerprint repeats and a short last one.
const stream: VideoStream = {
  version: "3f9a1c2e",
  duration: 40 * 6 + 4.48,
  segments: [...Array(40).fill(6), 4.48],
  renditions: [
    { id: "1080", width: 1920, height: 1080, bandwidth: 4200000, averageBandwidth: 2600000, codecs: "avc1.640028,mp4a.40.2" },
    { id: "720", width: 1280, height: 720, bandwidth: 2200000, averageBandwidth: 1400000, codecs: "avc1.64001f,mp4a.40.2" },
  ],
};

let passed = 0;
async function test(name: string, fn: () => unknown) {
  try {
    await fn();
    passed++;
    console.log(`ok   ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

const now = Date.UTC(2026, 9, 11, 12, 0, 0);
function payload(over: Partial<TokenPayload> = {}): TokenPayload {
  return {
    v: 1,
    sub: "user-1",
    w: 4242,
    c: course,
    k: code,
    ver: stream.version,
    f: 10,
    iat: now,
    exp: now + TOKEN_TTL_MS,
    sid: "sid",
    ...over,
  };
}

const b64url = (s: string) => Buffer.from(s).toString("base64url");
const ref = (variant: Variant, index: number, rendition = "1080"): SegmentRef => ({
  course,
  code,
  version: stream.version,
  rendition,
  variant,
  index,
});

// ---- Tokens -----------------------------------------------------------------

await test("token: sign then verify round-trips the payload", async () => {
  const p = payload();
  const token = await signToken(SECRET, p);
  assert.match(token, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  const check = await verifyToken(SECRET, token, now + 1000);
  assert.deepEqual(check, { ok: true, payload: p });
});

await test("token: tampered payload, signature or secret is rejected", async () => {
  const token = await signToken(SECRET, payload());
  const [pp, sig] = token.split(".");
  // Change the watermark id and keep the old signature.
  const forged = b64url(JSON.stringify(payload({ w: 1 })));
  assert.deepEqual(await verifyToken(SECRET, `${forged}.${sig}`, now), { ok: false, reason: "signature" });
  // Flip one signature character.
  const flipped = sig.slice(0, 5) + (sig[5] === "A" ? "B" : "A") + sig.slice(6);
  assert.deepEqual(await verifyToken(SECRET, `${pp}.${flipped}`, now), { ok: false, reason: "signature" });
  // The last character carries 2 unused bits: "+1" spells the same bytes
  // differently, and only the canonical spelling is accepted.
  const respelled = sig.slice(0, -1) + String.fromCharCode(sig.charCodeAt(sig.length - 1) + 1);
  assert.deepEqual(Buffer.from(respelled, "base64url"), Buffer.from(sig, "base64url"));
  assert.deepEqual(await verifyToken(SECRET, `${pp}.${respelled}`, now), { ok: false, reason: "signature" });
  // Truncated signature.
  assert.deepEqual(await verifyToken(SECRET, `${pp}.${sig.slice(0, -3)}`, now), { ok: false, reason: "signature" });
  // Signed with another secret.
  assert.deepEqual(await verifyToken(OTHER_SECRET, token, now), { ok: false, reason: "signature" });
});

await test("token: expiry", async () => {
  const token = await signToken(SECRET, payload());
  assert.equal((await verifyToken(SECRET, token, now + TOKEN_TTL_MS - 1)).ok, true);
  assert.deepEqual(await verifyToken(SECRET, token, now + TOKEN_TTL_MS), { ok: false, reason: "expired" });
  assert.equal(TOKEN_TTL_MS, 2 * 60 * 60 * 1000);
});

await test("token: malformed input never throws", async () => {
  for (const bad of [null, undefined, "", "abc", "a.b.c", "!!!.???", ".", "x.", ".x", "a".repeat(3000)]) {
    const check = await verifyToken(SECRET, bad, now);
    assert.equal(check.ok, false, String(bad));
  }
  // Correctly signed but not a token payload.
  const { hmac } = await import("../../src/lib/video/derive.ts");
  const pp = b64url(JSON.stringify({ v: 2, sub: "x" }));
  const sig = Buffer.from(await hmac(SECRET, `token|${pp}`)).toString("base64url");
  assert.deepEqual(await verifyToken(SECRET, `${pp}.${sig}`, now), { ok: false, reason: "malformed" });
});

// ---- Playlists --------------------------------------------------------------

const TOKEN = await signToken(SECRET, payload());
const PLAYLIST_URL = `https://school.example/api/video/${course}/${code}/1080.m3u8?t=${TOKEN}`;

await test("master playlist: one variant per rendition, token carried", () => {
  const text = masterPlaylist(stream, TOKEN);
  const lines = text.trim().split("\n");
  assert.equal(lines[0], "#EXTM3U");
  assert.equal(lines[1], "#EXT-X-VERSION:3");
  assert.equal(lines.filter((l) => l.startsWith("#EXT-X-STREAM-INF:")).length, 2);
  assert.ok(text.includes('#EXT-X-STREAM-INF:BANDWIDTH=4200000,AVERAGE-BANDWIDTH=2600000,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2"'));
  assert.ok(lines.includes(`1080.m3u8?t=${TOKEN}`));
  assert.ok(lines.includes(`720.m3u8?t=${TOKEN}`));
  const variant = new URL(`720.m3u8?t=${TOKEN}`, `https://school.example/api/video/${course}/${code}/master.m3u8?t=x`);
  assert.equal(variant.pathname, `/api/video/${course}/${code}/720.m3u8`);
});

type Entry = { keyUri: string; iv: string; duration: number; url: string };
function parseMedia(text: string) {
  const lines = text.trim().split("\n");
  const entries: Entry[] = [];
  let key: { keyUri: string; iv: string } | null = null;
  let duration = 0;
  for (const line of lines) {
    const k = line.match(/^#EXT-X-KEY:METHOD=AES-128,URI="([^"]+)",IV=0x([0-9a-f]{32})$/);
    if (k) key = { keyUri: k[1], iv: k[2] };
    else if (line.startsWith("#EXTINF:")) duration = parseFloat(line.slice(8));
    else if (!line.startsWith("#")) {
      assert.ok(key, "every segment has a key line before it");
      entries.push({ ...key, duration, url: line });
      key = null; // a fresh key line for every segment
    }
  }
  return { lines, entries };
}

await test("media playlist: header, one key per segment, relative key URIs, absolute CDN URLs", async () => {
  const w = 4242;
  const text = await mediaPlaylist({ secret: SECRET, cdnUrl: CDN, course, code, stream, rendition: "1080", watermarkId: w, token: TOKEN });
  const { lines, entries } = parseMedia(text);
  assert.deepEqual(lines.slice(0, 5), [
    "#EXTM3U",
    "#EXT-X-VERSION:3",
    "#EXT-X-TARGETDURATION:6",
    "#EXT-X-MEDIA-SEQUENCE:0",
    "#EXT-X-PLAYLIST-TYPE:VOD",
  ]);
  assert.equal(lines.at(-1), "#EXT-X-ENDLIST");
  assert.equal(entries.length, stream.segments.length);
  assert.equal(lines.filter((l) => l.startsWith("#EXT-X-KEY:")).length, stream.segments.length);
  for (const [i, e] of entries.entries()) {
    assert.equal(e.keyUri, `key/1080/${i}?t=${TOKEN}`);
    const resolved = new URL(e.keyUri, PLAYLIST_URL);
    assert.equal(resolved.pathname, `/api/video/${course}/${code}/key/1080/${i}`);
    assert.equal(resolved.searchParams.get("t"), TOKEN);
    assert.equal(e.duration, stream.segments[i]);
    const variant = variantFor(w, i);
    assert.equal(e.url, `${CDN}/${await segmentPath(SECRET, ref(variant, i))}`);
    assert.match(e.url, /^https:\/\/media\.example\.com\/the-prod\/2\.3\/3f9a1c2e\/[0-9a-f]{24}\.ts$/);
    assert.equal(e.iv, toHex(await segmentIv(SECRET, ref(variant, i))));
  }
});

await test("media playlist: variants follow the watermark id, and differ between students", async () => {
  const a = parseMedia(await mediaPlaylist({ secret: SECRET, cdnUrl: CDN, course, code, stream, rendition: "720", watermarkId: 1, token: TOKEN })).entries;
  const b = parseMedia(await mediaPlaylist({ secret: SECRET, cdnUrl: CDN, course, code, stream, rendition: "720", watermarkId: 2, token: TOKEN })).entries;
  let differ = 0;
  for (let i = 0; i < a.length; i++) {
    const same = variantFor(1, i) === variantFor(2, i);
    assert.equal(a[i].url === b[i].url, same, `segment ${i}`);
    if (!same) differ++;
  }
  assert.ok(differ > 0);
  // Both variants of a segment have different names.
  assert.notEqual(await segmentPath(SECRET, ref("a", 0)), await segmentPath(SECRET, ref("b", 0)));
  // The pattern repeats every FINGERPRINT_LENGTH segments.
  for (let i = 0; i + FINGERPRINT_LENGTH < a.length; i++) assert.equal(variantFor(1, i), variantFor(1, i + FINGERPRINT_LENGTH));
});

await test("media playlist: TARGETDURATION covers a long last segment", async () => {
  const odd: VideoStream = { ...stream, segments: [6, 6.4, 3] };
  const text = await mediaPlaylist({ secret: SECRET, cdnUrl: CDN, course, code, stream: odd, rendition: "1080", watermarkId: 7, token: TOKEN });
  assert.ok(text.includes("#EXT-X-TARGETDURATION:6\n"));
  const longer: VideoStream = { ...stream, segments: [6, 6.6] };
  const text2 = await mediaPlaylist({ secret: SECRET, cdnUrl: CDN, course, code, stream: longer, rendition: "1080", watermarkId: 7, token: TOKEN });
  assert.ok(text2.includes("#EXT-X-TARGETDURATION:7\n"));
});

// ---- Paced window -----------------------------------------------------------

await test("window: constants match the spec", () => {
  assert.deepEqual(KEY_WINDOW, { ahead: 6, back: 2, pace: 2.5 });
  assert.equal(SEGMENT_SECONDS, 6);
});

await test("window: maths", () => {
  assert.deepEqual(keyWindow(10, 0), { min: 8, max: 16 });
  assert.deepEqual(keyWindow(0, 0), { min: 0, max: 6 });
  assert.deepEqual(keyWindow(1, 0), { min: 0, max: 7 });
  // 6 s of real time = 1 segment of playback = 2.5 segments of keys.
  assert.deepEqual(keyWindow(10, 6000), { min: 8, max: 18 });
  assert.deepEqual(keyWindow(10, 12000), { min: 8, max: 21 });
  assert.deepEqual(keyWindow(10, 60000), { min: 8, max: 41 });
  // Clock skew: a token from the "future" doesn't shrink or grow the window.
  assert.deepEqual(keyWindow(10, -5000), { min: 8, max: 16 });
});

await test("segmentAt: seconds to segment index", () => {
  assert.equal(segmentAt(stream, 0), 0);
  assert.equal(segmentAt(stream, 5.99), 0);
  assert.equal(segmentAt(stream, 6), 1);
  assert.equal(segmentAt(stream, 61), 10);
  assert.equal(segmentAt(stream, 242), 40);
  assert.equal(segmentAt(stream, 99999), 40);
  assert.equal(segmentAt(stream, -3), 0);
  assert.equal(segmentAt(stream, Number.NaN), 0);
});

// ---- Key release ------------------------------------------------------------

await test("key: equals segmentKey for the student's own variant, never the other", async () => {
  const token = await signToken(SECRET, payload({ w: 4242, f: 10 }));
  const check = await verifyToken(SECRET, token, now);
  assert.ok(check.ok);
  for (let i = 8; i <= 16; i++) {
    const result = await releaseKey(SECRET, check.payload, stream, "1080", i, now);
    assert.equal(result.status, 200, `segment ${i}`);
    if (result.status !== 200) continue;
    const mine = variantFor(4242, i);
    const other: Variant = mine === "a" ? "b" : "a";
    assert.equal(result.key.length, 16);
    assert.deepEqual(result.key, await segmentKey(SECRET, ref(mine, i)));
    assert.notDeepEqual(result.key, await segmentKey(SECRET, ref(other, i)));
  }
});

await test("key: outside the paced window is 429, and the window grows with time", async () => {
  const p = payload({ f: 10 });
  assert.equal((await releaseKey(SECRET, p, stream, "1080", 7, now)).status, 429); // behind BACK
  assert.equal((await releaseKey(SECRET, p, stream, "1080", 17, now)).status, 429); // past AHEAD
  assert.equal((await releaseKey(SECRET, p, stream, "1080", 17, now + 6000)).status, 200);
  assert.equal((await releaseKey(SECRET, p, stream, "1080", 19, now + 6000)).status, 429);
  assert.equal((await releaseKey(SECRET, p, stream, "1080", 40, now + 60000)).status, 200);
});

await test("key: unknown rendition or index is 404, old version is 410", async () => {
  const p = payload({ f: 0 });
  assert.equal((await releaseKey(SECRET, p, stream, "4k", 0, now)).status, 404);
  assert.equal((await releaseKey(SECRET, p, stream, "1080", 41, now + 3600000)).status, 404);
  assert.equal((await releaseKey(SECRET, p, stream, "1080", -1, now)).status, 404);
  assert.equal((await releaseKey(SECRET, p, stream, "1080", 1.5, now)).status, 404);
  assert.equal((await releaseKey(SECRET, payload({ ver: "00000000" }), stream, "1080", 0, now)).status, 410);
});

await test("key + playlist: a segment encrypted by the packager decrypts with the released key", async () => {
  const w = 31337;
  const token = await signToken(SECRET, payload({ w, f: 0 }));
  const check = await verifyToken(SECRET, token, now);
  assert.ok(check.ok);
  const { entries } = parseMedia(await mediaPlaylist({ secret: SECRET, cdnUrl: CDN, course, code, stream, rendition: "720", watermarkId: w, token }));
  // Pretend to be the packager: encrypt both variants of each early segment.
  const files = new Map<string, Buffer>();
  const plain = new Map<string, Buffer>();
  for (let i = 0; i < 6; i++) {
    for (const v of ["a", "b"] as const) {
      const r = ref(v, i, "720");
      const body = randomBytes(188 * 7 + i);
      const cipher = createCipheriv("aes-128-cbc", await segmentKey(SECRET, r), await segmentIv(SECRET, r));
      const url = `${CDN}/${await segmentPath(SECRET, r)}`;
      files.set(url, Buffer.concat([cipher.update(body), cipher.final()]));
      plain.set(url, body);
    }
  }
  // Pretend to be the player: playlist URL + IV, key from the key server.
  for (let i = 0; i < 6; i++) {
    const e = entries[i];
    const encrypted = files.get(e.url);
    assert.ok(encrypted, `segment ${i} URL exists in the bucket`);
    const result = await releaseKey(SECRET, check.payload, stream, "720", i, now);
    assert.equal(result.status, 200);
    if (result.status !== 200) continue;
    const decipher = createDecipheriv("aes-128-cbc", result.key, Buffer.from(e.iv, "hex"));
    assert.deepEqual(Buffer.concat([decipher.update(encrypted), decipher.final()]), plain.get(e.url));
  }
});

// ---- Rate limits ------------------------------------------------------------

await test("rate limit: 30 sessions per student per video per 10 minutes", () => {
  resetRateLimits();
  const t = now;
  for (let i = 0; i < 30; i++) assert.equal(allowSession("u1", course, "2.3", t + i), true, `session ${i}`);
  assert.equal(allowSession("u1", course, "2.3", t + 100), false);
  assert.equal(allowSession("u1", course, "2.4", t + 100), true); // another video is fine
  assert.equal(allowSession("u2", course, "2.3", t + 100), true); // another student is fine
  assert.equal(allowSession("u1", course, "2.3", t + 10 * 60 * 1000 + 1), true); // window slid
});

await test("rate limit: 60 sessions per student per hour across videos", () => {
  resetRateLimits();
  let t = now;
  for (let i = 0; i < 60; i++) assert.equal(allowSession("u1", course, `v${i % 4}`, (t += 1000)), true, `session ${i}`);
  assert.equal(allowSession("u1", course, "v9", (t += 1000)), false);
  assert.equal(allowSession("u1", course, "v9", now + 60 * 60 * 1000 + 1001), true);
  assert.deepEqual(
    SESSION_LIMITS.map((l) => [l.max, l.windowMs]),
    [
      [60, 3600000],
      [30, 600000],
    ],
  );
  resetRateLimits();
});

// ---- Demo viewer ------------------------------------------------------------

await test("access: VIDEO_DEV_OPEN demo viewer, refused in production without the override", async () => {
  const env = process.env as Record<string, string | undefined>;
  const saved = { open: env.VIDEO_DEV_OPEN, prod: env.VIDEO_DEV_OPEN_IN_PRODUCTION, node: env.NODE_ENV };
  const { canWatch, demoWatermarkId, getViewer } = await import("../../src/lib/video/access.ts");
  const req = new Request("https://school.example/api/video/session", { method: "POST" });
  const video = { course, code };
  const quiet = console.warn;
  const quietErr = console.error;
  console.warn = () => {};
  console.error = () => {};
  try {
    delete env.VIDEO_DEV_OPEN;
    assert.equal(await getViewer(req, video, { email: "jane@example.com" }), null);

    env.VIDEO_DEV_OPEN = "1";
    env.NODE_ENV = "development";
    const v = await getViewer(req, video, { name: "Jane", email: " Jane@Example.com " });
    assert.ok(v);
    assert.equal(v.userId, "demo:jane@example.com");
    assert.equal(v.label, "Jane · jane@example.com");
    assert.equal(v.watermarkId, await demoWatermarkId("jane@example.com"));
    assert.equal(await canWatch(v, video), true);

    env.NODE_ENV = "production";
    delete env.VIDEO_DEV_OPEN_IN_PRODUCTION;
    assert.equal(await getViewer(req, video, { email: "jane@example.com" }), null);
    assert.equal(await canWatch(v, video), false);
    env.VIDEO_DEV_OPEN_IN_PRODUCTION = "1";
    assert.ok(await getViewer(req, video, { email: "jane@example.com" }));
  } finally {
    console.warn = quiet;
    console.error = quietErr;
    for (const [k, val] of [
      ["VIDEO_DEV_OPEN", saved.open],
      ["VIDEO_DEV_OPEN_IN_PRODUCTION", saved.prod],
      ["NODE_ENV", saved.node],
    ] as const) {
      if (val === undefined) delete env[k];
      else env[k] = val;
    }
  }
  for (const email of ["a@b.c", "jane@example.com", "x".repeat(200)]) {
    const id = await demoWatermarkId(email);
    assert.ok(Number.isInteger(id) && id >= 1 && id <= 65535, email);
    assert.equal(id, await demoWatermarkId(email.toUpperCase()));
  }
});

console.log(`\n${passed} tests passed`);
