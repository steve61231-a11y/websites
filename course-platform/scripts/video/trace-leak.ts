// Find which student a leaked copy of a lesson came from.
//
//   node scripts/video/trace-leak.ts --leak leak.mp4 --source "2.3 - Camera Sensor.mp4" [--offset 30] [--max-id 500]
//
// --source is the original upload (from the Drive folder), not the packaged
// copy. --offset is where the leak starts in the source, in seconds, if the
// leaker cut off the beginning (negative if they added an intro). --max-id
// limits the search to watermark ids actually given out.
//
// Every student's copy is built from a different mix of segment variants a/b
// (see derive.ts). Variant a carries a faint bright/dark pattern, b the same
// pattern inverted. For every frame we fit the leak as "the original picture
// through some brightness/contrast/gamma curve, plus some amount of the
// pattern", leaving out pixels that are clipped to black or white, so level
// changes and re-encodes don't fool it. Summed over each 6-second segment that
// gives one soft bit: positive = a, negative = b. Then every watermark id is
// scored against those bits. The pattern spans the whole frame and many
// seconds, so it survives re-encoding and downscaling.

import { spawn, type ChildProcessByStdio } from "node:child_process";
import { existsSync } from "node:fs";
import type { Readable } from "node:stream";
import { parseArgs } from "node:util";
import { FINGERPRINT_LENGTH, MAX_WATERMARK_ID, SEGMENT_SECONDS, fingerprintBits } from "../../src/lib/video/derive.ts";
import { patternAt, windowAt } from "./fingerprint.ts";
import { fail, ffprobe, fmtSeconds, isMain } from "./lib.ts";

/** Analysis frames: small and luma only is all the pattern needs. */
const FPS = 10;
const LONG_SIDE = 160;
/** Pixels this close to 0 or 255 may be clipped, so they don't tell us anything. */
const CLIP = 4;

export type Candidate = {
  id: number;
  score: number; // sum of the bits that agree minus those that don't, in σ
  confidence: number; // 0..1: how likely this id is, if the leak carries a fingerprint at all
  matches: number; // bits that agree
};

export type TraceResult = {
  segments: number; // segments of the leak that were read
  observed: number; // distinct fingerprint positions seen (max 20)
  bits: Array<number | null>; // per position, in noise units (σ): > 0 = a, < 0 = b
  candidates: Candidate[]; // best first
  total: number; // ids searched
};

/** A bit this many noise units from zero is trusted. Pure noise gets past it
 *  1 time in 80, so all of a clip's bits getting past it by luck is hopeless. */
export const SURE_BIT = 2.5;

function frameReader(stream: Readable, size: number) {
  const it = stream[Symbol.asyncIterator]() as AsyncIterator<Buffer>;
  let buf = Buffer.alloc(0);
  return async (): Promise<Buffer | null> => {
    while (buf.length < size) {
      const r = await it.next();
      if (r.done) return null;
      buf = buf.length ? Buffer.concat([buf, r.value]) : r.value;
    }
    const frame = buf.subarray(0, size);
    buf = buf.subarray(size);
    return frame;
  };
}

/** Decode a video to small frames at FPS, starting `skip` seconds in. Only
 *  the luma plane is used: yuv420p, not "gray", which stretches 16-235 to
 *  0-255 and would clip the pattern on white backgrounds. */
function decode(file: string, w: number, h: number, skip: number) {
  const args = ["-v", "error"];
  if (skip > 0) args.push("-ss", String(skip));
  // setpts: count from the first picture, whatever the container's start time.
  const vf = `setpts=PTS-STARTPTS,fps=${FPS}:start_time=0,scale=${w}:${h}:flags=area,format=yuv420p`;
  args.push("-i", file, "-map", "0:v:0", "-vf", vf, "-f", "rawvideo", "pipe:1");
  const child = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] }) as ChildProcessByStdio<null, Readable, Readable>;
  let err = "";
  child.stderr.on("data", (d) => (err = (err + d).slice(-2000)));
  const done = new Promise<void>((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (code, signal) => (code === 0 || signal ? resolve() : reject(new Error(`ffmpeg couldn't read ${file}:\n${err.trim()}`))));
  });
  done.catch(() => {}); // checked below
  return { next: frameReader(child.stdout, (w * h * 3) / 2), stop: () => child.kill(), done };
}

/** A pattern sampled at the pixel centres of a w x h grid. */
function grid(w: number, h: number, f: (u: number, v: number) => number) {
  const p = new Float64Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p[y * w + x] = f((x + 0.5) / w, (y + 0.5) / h);
  return p;
}

/** Solve the square system m x = b (m is k x k, row-major) in place. */
function solve(m: Float64Array, b: Float64Array, k: number) {
  for (let c = 0; c < k; c++) {
    let pivot = c;
    for (let r = c + 1; r < k; r++) if (Math.abs(m[r * k + c]) > Math.abs(m[pivot * k + c])) pivot = r;
    if (Math.abs(m[pivot * k + c]) < 1e-12) return null;
    if (pivot !== c) {
      for (let j = 0; j < k; j++) [m[c * k + j], m[pivot * k + j]] = [m[pivot * k + j], m[c * k + j]];
      [b[c], b[pivot]] = [b[pivot], b[c]];
    }
    for (let r = c + 1; r < k; r++) {
      const f = m[r * k + c] / m[c * k + c];
      if (!f) continue;
      for (let j = c; j < k; j++) m[r * k + j] -= f * m[c * k + j];
      b[r] -= f * b[c];
    }
  }
  for (let c = k - 1; c >= 0; c--) {
    let sum = b[c];
    for (let j = c + 1; j < k; j++) sum -= m[c * k + j] * b[j];
    b[c] = sum / m[c * k + c];
  }
  return b;
}

const TAU = 2 * Math.PI;
/** Look-alike patterns the fingerprint is not made of. What they pick up is
 *  noise (re-encoding errors, motion), which tells us how big noise is. */
const DECOYS: Array<(u: number, v: number) => number> = [
  (u, v) => Math.sin(TAU * u) * Math.cos(TAU * v),
  (u, v) => Math.cos(TAU * u) * Math.sin(TAU * v),
  (u, v) => Math.sin(TAU * u) * Math.sin(TAU * v),
  (u, v) => Math.cos(2 * TAU * u) * Math.cos(TAU * v),
  (u, v) => Math.cos(TAU * u) * Math.cos(2 * TAU * v),
  (u, v) => Math.sin(2 * TAU * u) * Math.cos(TAU * v),
  (u, v) => Math.cos(TAU * u) * Math.sin(2 * TAU * v),
  (u, v) => Math.cos(2 * TAU * u) * Math.cos(2 * TAU * v),
];

export async function traceLeak(o: { leak: string; source: string; offset?: number; maxId?: number }): Promise<TraceResult> {
  const offset = o.offset ?? 0;
  const maxId = Math.min(MAX_WATERMARK_ID, Math.max(0, Math.floor(o.maxId ?? MAX_WATERMARK_ID)));
  const v = (await ffprobe(o.source)).streams.find((s) => s.codec_type === "video");
  if (!v) throw new Error(`${o.source} has no video`);
  let [sw, sh] = [Number(v.width), Number(v.height)];
  const rotation = Number(v.side_data_list?.find((d: { rotation?: number }) => d.rotation !== undefined)?.rotation ?? 0);
  if (Math.abs(rotation) % 180 === 90) [sw, sh] = [sh, sw];
  const w = sw >= sh ? LONG_SIDE : Math.round((LONG_SIDE * sw) / sh / 2) * 2;
  const h = sw >= sh ? Math.round((LONG_SIDE * sh) / sw / 2) * 2 : LONG_SIDE;
  const n = w * h;

  const pattern = grid(w, h, patternAt);
  const decoys = DECOYS.map((f) => grid(w, h, f));
  const all = [pattern, ...decoys];

  const src = decode(o.source, w, h, Math.max(0, offset));
  const leak = decode(o.leak, w, h, Math.max(0, -offset));
  const start = Math.max(0, offset); // source time of the first frame

  // Per segment: weighted pattern (index 0) and decoy amounts, and the sum of
  // squared weights (how much was read).
  const acc: Float64Array[] = [];
  const w2: number[] = [];
  // Least squares per frame: leak = cubic curve of the source + pattern + decoys.
  const CURVE = 4;
  const k = CURVE + all.length;
  const m = new Float64Array(k * k);
  const b = new Float64Array(k);
  const x = new Float64Array(k);
  try {
    for (let f = 0; ; f++) {
      const [s, l] = await Promise.all([src.next(), leak.next()]);
      if (!s || !l) break;
      const t = start + f / FPS;
      const weight = windowAt(t);
      if (weight < 1e-3) continue;
      m.fill(0);
      b.fill(0);
      let used = 0;
      for (let i = 0; i < n; i++) {
        const sv = s[i];
        const lv = l[i];
        if (sv < CLIP || sv > 255 - CLIP || lv < CLIP || lv > 255 - CLIP) continue;
        used++;
        const u = (sv - 128) / 128;
        x[0] = 1;
        x[1] = u;
        x[2] = u * u;
        x[3] = u * u * u;
        for (let p = 0; p < all.length; p++) x[CURVE + p] = all[p][i];
        for (let a = 0; a < k; a++) {
          const xa = x[a];
          b[a] += xa * lv;
          for (let c = a; c < k; c++) m[a * k + c] += xa * x[c];
        }
      }
      if (used < n / 4) continue; // mostly clipped: nothing to read
      for (let a = 0; a < k; a++) for (let c = 0; c < a; c++) m[a * k + c] = m[c * k + a];
      // A flat frame makes the curve terms redundant; a touch of damping keeps it solvable.
      for (let a = 1; a < CURVE; a++) m[a * k + a] += 1e-6 * used;
      const coef = solve(m, b, k);
      if (!coef) continue;
      const seg = Math.floor(t / SEGMENT_SECONDS);
      while (acc.length <= seg) {
        acc.push(new Float64Array(all.length));
        w2.push(0);
      }
      for (let p = 0; p < all.length; p++) acc[seg][p] += weight * coef[CURVE + p];
      w2[seg] += weight * weight;
    }
  } finally {
    src.stop();
    leak.stop();
  }
  await Promise.all([src.done, leak.done]);

  // Noise level per unit of reading: how much the decoys pick up, pooled over
  // every segment. A segment's noise grows as sqrt(w2) (cautious for partly
  // read segments).
  let noise = 0;
  let reading = 0;
  acc.forEach((a, k) => {
    for (let p = 1; p < a.length; p++) noise += a[p] * a[p];
    reading += (a.length - 1) * w2[k];
  });
  const sigma = Math.sqrt(noise / reading) || 1;

  // Soft bit per fingerprint position (segments repeat every 20), in noise
  // units, so repeats add up to stronger bits.
  const sums = new Array<number>(FINGERPRINT_LENGTH).fill(0);
  const reads = new Array<number>(FINGERPRINT_LENGTH).fill(0);
  acc.forEach((a, k) => {
    sums[k % FINGERPRINT_LENGTH] += a[0];
    reads[k % FINGERPRINT_LENGTH] += w2[k];
  });
  const bits = sums.map((sum, b) => (reads[b] > 0 ? sum / (sigma * Math.sqrt(reads[b])) : null));
  const read = w2.filter((x) => x > 0);
  const observed = bits.filter((b) => b !== null).length;

  const scored: Array<Omit<Candidate, "confidence">> = [];
  for (let id = 0; id <= maxId; id++) {
    const code = fingerprintBits(id);
    let score = 0;
    let matches = 0;
    for (let b = 0; b < FINGERPRINT_LENGTH; b++) {
      const z = bits[b];
      if (z === null) continue;
      const sign = code[b] ? -1 : 1; // a = +, b = -
      score += sign * z;
      if (sign * z > 0) matches++;
    }
    scored.push({ id, score, matches });
  }
  scored.sort((a, b) => b.score - a.score || a.id - b.id);

  // Confidence = probability of each id given the bits, if the leak is
  // fingerprinted: each bit is ±strength plus unit noise, so the likelihood of
  // an id grows as exp(strength * score). Strength is estimated from the best
  // fit. Pure noise gives a weak strength and spreads the probability thin.
  const strength = observed ? Math.max(0, scored[0].score / observed) : 0;
  const top = strength * (scored[0]?.score ?? 0);
  let sum = 0;
  for (const c of scored) sum += Math.exp(strength * c.score - top);
  const candidates = scored.map((c) => ({ ...c, confidence: Math.exp(strength * c.score - top) / sum }));
  return { segments: read.length, observed, bits, candidates, total: maxId + 1 };
}

/** Bit strengths, weakest first. */
function strengths(res: TraceResult) {
  return res.bits.filter((b): b is number => b !== null).map(Math.abs).sort((a, b) => a - b);
}

/** True when the leak clearly names `top`: every bit read is strong and agrees with it. */
export function isStrongMatch(res: TraceResult) {
  const [top] = res.candidates;
  const s = strengths(res);
  return !!top && res.observed > 0 && top.matches === res.observed && s[0] >= SURE_BIT && top.confidence >= 0.99;
}

/** One-line conclusion for a person reading the output. */
export function verdict(res: TraceResult) {
  const [top] = res.candidates;
  if (!top || res.observed === 0) return "No full segment could be read. Is the leak at least 6 seconds long and the offset right?";
  const s = strengths(res);
  const median = s[Math.floor(s.length / 2)];
  const ties = res.candidates.filter((c) => Math.abs(c.score - top.score) < 1e-9).length;
  const partial = res.observed < FINGERPRINT_LENGTH;
  const full = `${(FINGERPRINT_LENGTH * SEGMENT_SECONDS) / 60} minutes`;
  if (median < SURE_BIT) {
    return "No fingerprint found. The copy may not come from the course player, may be too damaged, cropped or mirrored, or the source or offset may be wrong.";
  }
  if (ties > 1) {
    return `${ties} ids fit equally well: only ${res.observed} of ${FINGERPRINT_LENGTH} fingerprint segments were seen (a full read needs ${full} of video). Check the top ones against who had access, or trace a longer copy.`;
  }
  if (isStrongMatch(res)) {
    return `Strong match: watermark id ${top.id}. All ${res.observed} bits are clear and agree${partial ? ` (only ${res.observed} of ${FINGERPRINT_LENGTH} seen; a full read needs ${full} of video)` : ""}.`;
  }
  if (top.confidence >= 0.9) {
    return `Likely watermark id ${top.id} (${top.matches}/${res.observed} bits agree, weakest ${s[0].toFixed(1)}σ). A longer or better copy would confirm it.`;
  }
  return "No clear match. The copy may be too damaged, cropped or mirrored, from another video, or the offset may be wrong.";
}

async function main() {
  const { values } = parseArgs({
    options: {
      leak: { type: "string" },
      source: { type: "string" },
      offset: { type: "string" },
      "max-id": { type: "string" },
    },
  });
  if (!values.leak || !values.source) fail("Usage: node scripts/video/trace-leak.ts --leak leak.mp4 --source original.mp4 [--offset seconds] [--max-id N]");
  for (const f of [values.leak, values.source]) if (!existsSync(f)) fail(`Can't find ${f}.`);
  const offset = values.offset ? Number(values.offset) : 0;
  if (!Number.isFinite(offset)) fail("--offset must be a number of seconds.");
  const started = Date.now();
  let res: TraceResult;
  try {
    res = await traceLeak({ leak: values.leak, source: values.source, offset, maxId: values["max-id"] ? Number(values["max-id"]) : undefined });
  } catch (e) {
    fail((e as Error).message);
  }

  const shown = res.bits.map((b) => (b === null ? "?" : b > 0 ? "a" : "b")).join("");
  const s = strengths(res);
  console.log(`Leak:    ${values.leak}`);
  console.log(`Source:  ${values.source}${offset ? ` from ${fmtSeconds(offset)}` : ""}`);
  console.log(`Read ${res.segments} segments: ${res.observed} of ${FINGERPRINT_LENGTH} fingerprint bits (${((Date.now() - started) / 1000).toFixed(1)} s).`);
  if (s.length) console.log(`Bits:    ${shown}   strength: weakest ${s[0].toFixed(1)}σ, median ${s[Math.floor(s.length / 2)].toFixed(1)}σ`);
  console.log(`\nTop candidates (of ${res.total} ids):`);
  for (const [i, c] of res.candidates.slice(0, 5).entries()) {
    const pct = c.confidence >= 0.9995 ? ">99.9" : (c.confidence * 100).toFixed(1);
    console.log(`  ${i + 1}. id ${String(c.id).padEnd(6)} confidence ${pct.padStart(5)}%   ${c.matches}/${res.observed} bits match`);
  }
  console.log(`\n${verdict(res)}`);
}

if (isMain(import.meta.url)) await main();
