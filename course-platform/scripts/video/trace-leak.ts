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
// pattern inverted. For each 6-second segment of the leak we take away the
// original picture (fitting brightness and contrast, so filters and re-encodes
// don't fool it), correlate what is left with the pattern, and get one soft
// bit: positive = a, negative = b. Then every watermark id is scored against
// those bits. The pattern spans the whole frame and many seconds, so it
// survives re-encoding, downscaling and level changes.

import { spawn, type ChildProcessByStdio } from "node:child_process";
import { existsSync } from "node:fs";
import type { Readable } from "node:stream";
import { parseArgs } from "node:util";
import { FINGERPRINT_LENGTH, MAX_WATERMARK_ID, SEGMENT_SECONDS, fingerprintBits } from "../../src/lib/video/derive.ts";
import { patternAt, windowAt } from "./fingerprint.ts";
import { fail, ffprobe, fmtSeconds, isMain } from "./lib.ts";

/** Analysis frames: small and grey is all the pattern needs. */
const FPS = 10;
const LONG_SIDE = 160;

export type Candidate = { id: number; score: number; confidence: number; matches: number };

export type TraceResult = {
  segments: number; // segments of the leak that were read
  observed: number; // distinct fingerprint positions seen (max 20)
  bits: Array<number | null>; // per position, in noise units (σ): > 0 = a, < 0 = b
  candidates: Candidate[]; // best first
  total: number; // ids searched
};

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

/** Decode a video to small grey frames at FPS, starting `skip` seconds in. */
function decode(file: string, w: number, h: number, skip: number) {
  const args = ["-v", "error"];
  if (skip > 0) args.push("-ss", String(skip));
  args.push("-i", file, "-map", "0:v:0", "-vf", `fps=${FPS}:start_time=0,scale=${w}:${h}:flags=area,format=gray`, "-f", "rawvideo", "pipe:1");
  const child = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] }) as ChildProcessByStdio<null, Readable, Readable>;
  let err = "";
  child.stderr.on("data", (d) => (err = (err + d).slice(-2000)));
  const done = new Promise<void>((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (code, signal) => (code === 0 || signal ? resolve() : reject(new Error(`ffmpeg couldn't read ${file}:\n${err.trim()}`))));
  });
  done.catch(() => {}); // checked below
  return { next: frameReader(child.stdout, w * h), stop: () => child.kill(), done };
}

/** Unit-norm pattern sampled at pixel centres of a w x h grid. */
function grid(w: number, h: number, f: (u: number, v: number) => number) {
  const p = new Float64Array(w * h);
  let norm = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const val = f((x + 0.5) / w, (y + 0.5) / h);
      p[y * w + x] = val;
      norm += val * val;
    }
  }
  norm = Math.sqrt(norm);
  for (let i = 0; i < p.length; i++) p[i] /= norm;
  return p;
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
  const sumOf = all.map((p) => p.reduce((a, b) => a + b, 0));

  const src = decode(o.source, w, h, Math.max(0, offset));
  const leak = decode(o.leak, w, h, Math.max(0, -offset));
  const start = Math.max(0, offset); // source time of the first frame

  // Per segment: weighted correlation with the pattern (index 0) and each decoy.
  const acc: Float64Array[] = [];
  const r = new Float64Array(n);
  try {
    for (let f = 0; ; f++) {
      const [s, l] = await Promise.all([src.next(), leak.next()]);
      if (!s || !l) break;
      const t = start + f / FPS;
      const weight = windowAt(t);
      if (weight < 1e-3) continue;
      // Fit leak ≈ gain * source + offset, keep what's left over.
      let ms = 0;
      let ml = 0;
      for (let i = 0; i < n; i++) {
        ms += s[i];
        ml += l[i];
      }
      ms /= n;
      ml /= n;
      let ss = 0;
      let sl = 0;
      for (let i = 0; i < n; i++) {
        const ds = s[i] - ms;
        ss += ds * ds;
        sl += ds * (l[i] - ml);
      }
      const gain = ss > n * 0.25 ? sl / ss : 0; // a flat frame has nothing to fit
      for (let i = 0; i < n; i++) r[i] = l[i] - ml - gain * (s[i] - ms);
      const k = Math.floor(t / SEGMENT_SECONDS);
      while (acc.length <= k) acc.push(new Float64Array(all.length));
      for (let p = 0; p < all.length; p++) {
        const q = all[p];
        let dot = 0;
        for (let i = 0; i < n; i++) dot += r[i] * q[i];
        acc[k][p] += weight * (dot - 0 * sumOf[p]);
      }
    }
  } finally {
    src.stop();
    leak.stop();
  }
  await Promise.all([src.done, leak.done]);

  // Noise level: how much the decoys pick up, pooled over every segment.
  const read = acc.filter((a) => a.some((x) => x !== 0));
  let noise = 0;
  let count = 0;
  for (const a of read) {
    for (let p = 1; p < a.length; p++) {
      noise += a[p] * a[p];
      count++;
    }
  }
  const sigma = Math.sqrt(noise / Math.max(1, count)) || 1;

  // Soft bit per fingerprint position (segments repeat every 20).
  const bits: Array<number | null> = new Array(FINGERPRINT_LENGTH).fill(null);
  acc.forEach((a, k) => {
    if (!a.some((x) => x !== 0)) return;
    const b = k % FINGERPRINT_LENGTH;
    bits[b] = (bits[b] ?? 0) + a[0] / sigma;
  });
  const observed = bits.filter((b) => b !== null).length;
  const strength = bits.reduce<number>((sum, b) => sum + Math.abs(b ?? 0), 0) || 1;

  const candidates: Candidate[] = [];
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
    candidates.push({ id, score, confidence: score / strength, matches });
  }
  candidates.sort((a, b) => b.score - a.score || a.id - b.id);
  return { segments: read.length, observed, bits, candidates, total: maxId + 1 };
}

/** One-line conclusion for a person reading the output. */
export function verdict(res: TraceResult) {
  const [top, next] = res.candidates;
  if (!top || res.observed === 0) return "No full segment could be read. Is the leak at least 6 seconds long and the offset right?";
  const ties = res.candidates.filter((c) => Math.abs(c.score - top.score) < 1e-9).length;
  const weakest = Math.min(...res.bits.filter((b): b is number => b !== null).map(Math.abs));
  const gap = next ? top.confidence - next.confidence : 1;
  const partial = res.observed < FINGERPRINT_LENGTH;
  if (ties > 1) {
    return `${ties} ids fit equally well: only ${res.observed} of ${FINGERPRINT_LENGTH} fingerprint segments were seen (a full read needs ${FINGERPRINT_LENGTH * SEGMENT_SECONDS / 60} minutes of video). Check the top ones against who had access, or trace a longer leak.`;
  }
  if (top.matches === res.observed && weakest >= 2 && gap >= 0.1) {
    return `Strong match: watermark id ${top.id}. All ${res.observed} bits agree${partial ? ` (only ${res.observed} of ${FINGERPRINT_LENGTH} seen, so confirm with a longer clip)` : ""} and the next best id is ${gap.toFixed(2)} behind.`;
  }
  if (top.confidence >= 0.5 && gap >= 0.1) {
    return `Likely watermark id ${top.id} (${top.matches}/${res.observed} bits agree). Some bits are weak; a longer or better copy would confirm it.`;
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
  const strengths = res.bits.filter((b): b is number => b !== null).map(Math.abs).sort((a, b) => a - b);
  console.log(`Leak:    ${values.leak}`);
  console.log(`Source:  ${values.source}${offset ? ` from ${fmtSeconds(offset)}` : ""}`);
  console.log(`Read ${res.segments} segments: ${res.observed} of ${FINGERPRINT_LENGTH} fingerprint bits (${((Date.now() - started) / 1000).toFixed(1)} s).`);
  if (strengths.length) {
    console.log(`Bits:    ${shown}   strength: weakest ${strengths[0].toFixed(1)}σ, median ${strengths[Math.floor(strengths.length / 2)].toFixed(1)}σ`);
  }
  console.log(`\nTop candidates (of ${res.total} ids):`);
  for (const [i, c] of res.candidates.slice(0, 5).entries()) {
    console.log(`  ${i + 1}. id ${String(c.id).padEnd(6)} confidence ${c.confidence.toFixed(2).padStart(5)}   ${c.matches}/${res.observed} bits match`);
  }
  console.log(`\n${verdict(res)}`);
}

if (isMain(import.meta.url)) await main();
