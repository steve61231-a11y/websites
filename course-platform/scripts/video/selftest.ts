// End-to-end test of the video packager and the leak tracer. Needs ffmpeg.
//
//   node scripts/video/selftest.ts [--amp 2] [--tune 1,1.5,2,3,4] [--seconds 123] [--work dir] [--keep]
//
// 1. Makes a test lesson: a moving test card on a big flat white backdrop
//    (like a product shot) with a tone, 1080p30.
// 2. Packages it with a test secret, then checks: every segment is encrypted
//    (not readable as video), decrypts with the derive.ts keys into a valid
//    MPEG-TS, and has the same timing in every quality and variant; plaintext
//    is cleaned up; meta.json looks right.
// 3. Builds "student rips" for watermark ids 12345, 7 and 40000 (decrypt the
//    student's own a/b mix, join, remux), damages them like a pirate would
//    (360p crf 32 re-encode, brightness/contrast/gamma changes, the 480p copy)
//    and checks trace-leak.ts names the right student with every bit clear.
//    A clean re-encode of the original must not match anyone.
// 4. Reports the fingerprint strength (AMP), how different a and b look
//    (PSNR, higher = more alike) and the encode speed.
//
// --tune runs step 3 for several AMP values and reports the smallest that
// passes, to pick AMP in package.ts. Exits non-zero on any failure.
//
// The test is 123 s long: the fingerprint repeats every 20 segments (2 min),
// so a shorter clip can't tell apart ids that differ only in the last bits.

import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { FINGERPRINT_LENGTH, SEGMENT_SECONDS, segmentPath, variantFor, type SegmentRef, type Variant } from "../../src/lib/video/derive.ts";
import { decryptSegment, ffprobe, fmtSeconds, pool, run, driveHash } from "./lib.ts";
import { AMP, packageVideo, type Meta } from "./package.ts";
import { SURE_BIT, isStrongMatch, traceLeak, verdict, type TraceResult } from "./trace-leak.ts";

const SECRET = "selftest-secret-0123456789abcdef-0123456789";
const COURSE = "the-prod";
const CODE = "9.1";
/** Every bit of the plain 360p crf 32 re-encode must be at least this many
 *  noise units clear (AMP is tuned on it). The other rips must be a strong
 *  match: every bit agrees and is at least SURE_BIT clear. */
const MARGIN = 4;

/** Rips to trace: who leaked, which quality they saved, and what they did to it. */
const RIPS = [
  { id: 12345, rendition: "1080", damage: "scale=-2:360", note: "1080p rip, re-encoded 360p crf 32", margin: MARGIN },
  { id: 7, rendition: "720", damage: "scale=-2:360,eq=contrast=1.15:brightness=-0.03:saturation=1.3", note: "720p rip, more contrast, darker, 360p crf 32", margin: 0 },
  { id: 40000, rendition: "480", damage: "scale=-2:360,eq=gamma=1.25", note: "480p rip, gamma changed, 360p crf 32", margin: 0 },
];

let failures = 0;
function check(ok: boolean, message: string) {
  console.log(`${ok ? "ok  " : "FAIL"} ${message}`);
  if (!ok) failures++;
  return ok;
}

const ffmpeg = (args: string[]) => run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args]);

/** A product-shot-like test lesson: white sweep, moving test card, tone. */
async function makeSource(file: string, seconds: number) {
  await ffmpeg([
    "-f", "lavfi", "-i", `color=c=white:s=1920x1080:r=30:d=${seconds}`,
    "-f", "lavfi", "-i", `testsrc2=s=880x660:r=30:d=${seconds}`,
    "-f", "lavfi", "-i", `sine=frequency=440:sample_rate=48000:duration=${seconds}`,
    "-filter_complex",
    // Soft grey floor at the bottom like a sweep, card drifting left and right.
    `[0:v]drawbox=y=820:w=iw:h=260:color=0xe4e4e4:t=fill[bg];` +
      `[bg][1:v]overlay=x='300+260*sin(t/5)':y=160:shortest=1,format=yuv420p[v]`,
    "-map", "[v]", "-map", "2:a",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "16",
    "-c:a", "aac", "-b:a", "160k",
    "-movflags", "+faststart",
    file,
  ]);
}

const refOf = (meta: Meta, rendition: string, variant: Variant, index: number): SegmentRef => ({
  course: meta.course,
  code: meta.code,
  version: meta.version,
  rendition,
  variant,
  index,
});

async function decrypted(out: string, meta: Meta, rendition: string, variant: Variant, index: number) {
  const ref = refOf(meta, rendition, variant, index);
  return decryptSegment(SECRET, ref, await readFile(join(out, await segmentPath(SECRET, ref))));
}

/** Every 188th byte is 0x47 in a real MPEG-TS. */
function looksLikeTs(data: Buffer) {
  if (data.length < 188 * 3) return false;
  for (let i = 0; i < Math.min(data.length - 187, 188 * 50); i += 188) if (data[i] !== 0x47) return false;
  return true;
}

/** Packaging checks: layout, encryption, decryption, timing, meta. */
async function checkPackage(out: string, meta: Meta, seconds: number, tmp: string) {
  const expected = Math.ceil(seconds / SEGMENT_SECONDS);
  check(/^[0-9a-f]{8}$/.test(meta.version), `version is a content hash (${meta.version})`);
  check(meta.segments.length === expected, `${meta.segments.length} segments (expected ${expected})`);
  check(
    meta.segments.slice(0, -1).every((d) => d === SEGMENT_SECONDS),
    `every segment but the last is ${SEGMENT_SECONDS} s (last ${meta.segments.at(-1)} s)`,
  );
  check(Math.abs(meta.duration - seconds) < 0.1, `duration ${meta.duration} s`);
  check(meta.renditions.map((r) => r.id).join(",") === "1080,720,480", `renditions ${meta.renditions.map((r) => `${r.id} ${r.width}x${r.height}`).join(", ")}`);
  for (const r of meta.renditions) {
    check(/^avc1\.64[0-9a-f]{4},mp4a\.40\.2$/.test(r.codecs), `${r.id} codecs ${r.codecs}`);
    check(
      r.bandwidth >= r.averageBandwidth && r.averageBandwidth > 0,
      `${r.id} bandwidth peak ${(r.bandwidth / 1e6).toFixed(2)} Mb/s, average ${(r.averageBandwidth / 1e6).toFixed(2)} Mb/s`,
    );
  }
  check(meta.source === driveHash("selftest-drive-id") && !("driveId" in meta) && !("sourceName" in meta), "only a hash of the Drive id recorded");

  // Only encrypted segments and meta.json in the output.
  const dir = join(out, meta.course, meta.code, meta.version);
  const files = (await readdir(dir)).sort();
  const expectedFiles = meta.segments.length * meta.renditions.length * 2;
  check(files.length === expectedFiles && files.every((f) => /^[0-9a-f]{24}\.ts$/.test(f)), `${files.length} segment files with unguessable names`);
  check((await readdir(out)).sort().join(",") === `meta.json,${meta.course}`, "nothing else in the output folder");

  // Each file: encrypted, decrypts with its own key, plays, same timing everywhere.
  const starts = new Map<number, Set<string>>();
  let encrypted = 0;
  let valid = 0;
  let sameSize = 0;
  const jobs: Array<{ r: string; v: Variant; i: number }> = [];
  for (const r of meta.renditions) for (const v of ["a", "b"] as Variant[]) for (let i = 0; i < meta.segments.length; i++) jobs.push({ r: r.id, v, i });
  await pool(jobs, 4, async ({ r, v, i }) => {
    const ref = refOf(meta, r, v, i);
    const raw = await readFile(join(out, await segmentPath(SECRET, ref)));
    if (raw.length % 16 === 0 && !looksLikeTs(raw)) encrypted++;
    const plain = await decryptSegment(SECRET, ref, raw);
    if (plain.length === raw.length) sameSize++;
    if (!looksLikeTs(plain)) return;
    const file = join(tmp, `${r}${v}${i}.ts`);
    await writeFile(file, plain);
    const info = await ffprobe(file);
    await rm(file);
    const video = info.streams.find((s) => s.codec_type === "video");
    const audio = info.streams.find((s) => s.codec_type === "audio");
    if (!video || !audio) return;
    valid++;
    if (!starts.has(i)) starts.set(i, new Set());
    starts.get(i)!.add(Number(video.start_time).toFixed(3));
  });
  check(encrypted === jobs.length, `${encrypted}/${jobs.length} segments are encrypted (not readable as MPEG-TS)`);
  check(sameSize === 0, "decryption strips PKCS#7 padding");
  check(valid === jobs.length, `${valid}/${jobs.length} decrypt with their derive.ts key and IV into valid MPEG-TS (ffprobe)`);
  const aligned = [...starts.values()].every((s) => s.size === 1);
  check(aligned && starts.size === meta.segments.length, "segment start times identical across every rendition and variant");
  const t = [...starts.entries()].sort((a, b) => a[0] - b[0]).map(([, s]) => Number([...s][0]));
  const gaps = t.slice(1).map((x, i) => x - t[i]);
  check(
    gaps.every((g, i) => Math.abs(g - meta.segments[i]) < 0.002),
    `segment start times match meta.json durations (${gaps.length} gaps)`,
  );

  // A wrong key must not decrypt (sanity check of the key derivation).
  const wrong = { ...refOf(meta, "1080", "a", 1) };
  const raw = await readFile(join(out, await segmentPath(SECRET, refOf(meta, "1080", "a", 0))));
  let wrongOk = false;
  try {
    wrongOk = looksLikeTs(await decryptSegment(SECRET, wrong, raw));
  } catch {
    // bad padding: expected
  }
  check(!wrongOk, "segment 0 does not decrypt with segment 1's key");
}

/** Join the decrypted segments a student with this watermark id would get. */
async function buildRip(out: string, meta: Meta, rendition: string, pick: (i: number) => Variant, file: string) {
  const parts: Buffer[] = [];
  for (let i = 0; i < meta.segments.length; i++) parts.push(await decrypted(out, meta, rendition, pick(i), i));
  await writeFile(file + ".ts", Buffer.concat(parts));
  await ffmpeg(["-i", file + ".ts", "-c", "copy", "-bsf:a", "aac_adtstoasc", file]);
  await rm(file + ".ts");
}

/** PSNR (luma, dB) between two videos. */
async function psnr(a: string, b: string) {
  const graph = "[0:v]setpts=PTS-STARTPTS[a];[1:v]setpts=PTS-STARTPTS[b];[a][b]psnr";
  const { stderr } = await run("ffmpeg", ["-hide_banner", "-nostats", "-i", a, "-i", b, "-lavfi", graph, "-f", "null", "-"]);
  const m = stderr.match(/PSNR y:([\d.]+|inf)/);
  return m ? (m[1] === "inf" ? Infinity : Number(m[1])) : NaN;
}

function describe(res: TraceResult) {
  const s = res.bits.filter((b): b is number => b !== null).map(Math.abs).sort((a, b) => a - b);
  const [top, next] = res.candidates;
  return {
    weakest: s[0] ?? 0,
    median: s[Math.floor(s.length / 2)] ?? 0,
    line:
      `top id ${top.id} (${(top.confidence * 100).toFixed(1)}%, ${top.matches}/${res.observed} bits), ` +
      `next id ${next.id} (${(next.confidence * 100).toFixed(3)}%), bits weakest ${s[0]?.toFixed(1)}σ median ${s[Math.floor(s.length / 2)]?.toFixed(1)}σ`,
  };
}

/** Package at one AMP and trace every rip. `weakest` is the weakest bit of the
 *  plain re-encode, or 0 if any rip was not a strong match. */
async function trial(o: { source: string; seconds: number; work: string; amp: number; full: boolean }) {
  const out = join(o.work, `out-${o.amp}`);
  const tmp = join(o.work, "tmp");
  await rm(out, { recursive: true, force: true });
  await mkdir(tmp, { recursive: true });
  // package.ts keeps plaintext segments in the temp folder; point it at ours to check cleanup.
  const prevTmp = process.env.TMPDIR;
  process.env.TMPDIR = tmp;
  let meta: Meta;
  let speed: number;
  try {
    console.log(`\nPackaging at AMP ${o.amp} ...`);
    const res = await packageVideo({
      input: o.source,
      course: COURSE,
      code: CODE,
      out,
      secret: SECRET,
      driveId: "selftest-drive-id",
      sourceName: "9.1 - Self Test.mp4",
      amp: o.amp,
      log: (l) => console.log("  " + l.trim()),
    });
    meta = res.meta;
    speed = res.stats.speed;
  } finally {
    if (prevTmp === undefined) delete process.env.TMPDIR;
    else process.env.TMPDIR = prevTmp;
  }
  check((await readdir(tmp)).length === 0, "no plaintext segments left in the temp folder");
  if (o.full) {
    const meta2 = JSON.parse(await readFile(join(out, "meta.json"), "utf8")) as Meta;
    check(meta2.course === COURSE && meta2.code === CODE && meta2.version === meta.version, "meta.json written with course and code");
    await checkPackage(out, meta, o.seconds, tmp);
  }

  // How different do a and b look? The whole 1080p video, all-a vs all-b.
  const allA = join(tmp, "all-a.mp4");
  const allB = join(tmp, "all-b.mp4");
  await buildRip(out, meta, "1080", () => "a", allA);
  await buildRip(out, meta, "1080", () => "b", allB);
  const abPsnr = await psnr(allA, allB);
  const srcPsnr = await psnr(o.source, allA);
  await rm(allA);
  await rm(allB);

  let weakest = Infinity;
  for (const rip of RIPS) {
    const file = join(tmp, `rip-${rip.id}.mp4`);
    const leak = join(tmp, `leak-${rip.id}.mp4`);
    await buildRip(out, meta, rip.rendition, (i) => variantFor(rip.id, i), file);
    const ripLength = Number((await ffprobe(file)).format.duration);
    if (o.full) check(Math.abs(ripLength - meta.duration) < 0.2, `rip for id ${rip.id} plays for ${ripLength.toFixed(2)} s`);
    await ffmpeg(["-i", file, "-vf", rip.damage, "-c:v", "libx264", "-preset", "veryfast", "-crf", "32", "-c:a", "aac", "-b:a", "64k", leak]);
    await rm(file);
    const res = await traceLeak({ leak, source: o.source });
    await rm(leak);
    const d = describe(res);
    if (rip.margin) weakest = Math.min(weakest, d.weakest);
    const ok = res.candidates[0].id === rip.id && res.observed === FINGERPRINT_LENGTH && isStrongMatch(res) && d.weakest >= rip.margin;
    if (!ok) weakest = 0;
    check(ok, `id ${rip.id} (${rip.note}): ${d.line}`);
    if (!ok) console.log(`     ${verdict(res)}`);
  }

  // A copy that never went through the player has no fingerprint: no one is accused.
  let clean: TraceResult | null = null;
  if (o.full) {
    const leak = join(tmp, "clean.mp4");
    await ffmpeg(["-i", o.source, "-vf", "scale=-2:360", "-c:v", "libx264", "-preset", "veryfast", "-crf", "32", "-an", leak]);
    clean = await traceLeak({ leak, source: o.source });
    await rm(leak);
    const d = describe(clean);
    check(!isStrongMatch(clean) && clean.candidates[0].confidence < 0.9, `clean re-encode of the original matches no one: ${d.line}`);
    console.log(`     ${verdict(clean)}`);
  }
  await rm(out, { recursive: true, force: true });
  return { amp: o.amp, weakest, abPsnr, srcPsnr, speed, meta };
}

async function main() {
  const { values } = parseArgs({
    options: {
      amp: { type: "string" },
      tune: { type: "string" },
      seconds: { type: "string" },
      work: { type: "string" },
      keep: { type: "boolean" },
    },
  });
  const seconds = Number(values.seconds ?? 123);
  if (!(seconds > 0)) throw new Error("--seconds must be a positive number");
  if (seconds < FINGERPRINT_LENGTH * SEGMENT_SECONDS) console.log(`Note: under ${FINGERPRINT_LENGTH * SEGMENT_SECONDS} s not every fingerprint bit is seen, so the rip checks will fail.`);
  const work = values.work ? values.work : await mkdtemp(join(tmpdir(), "video-selftest-"));
  await mkdir(work, { recursive: true });
  const started = Date.now();

  try {
    const source = join(work, "source.mp4");
    console.log(`Making a ${seconds} s 1080p30 test lesson in ${work} ...`);
    await makeSource(source, seconds);

    if (values.tune) {
      const amps = values.tune.split(",").map(Number).filter((n) => n > 0).sort((a, b) => a - b);
      const results = [];
      for (const amp of amps) results.push(await trial({ source, seconds, work, amp, full: false }));
      console.log("\nAMP   weakest bit   PSNR a vs b   PSNR source vs a   pass");
      for (const r of results) {
        console.log(
          `${String(r.amp).padEnd(5)} ${(r.weakest.toFixed(1) + "σ").padStart(11)}   ${r.abPsnr.toFixed(1).padStart(8)} dB   ${r.srcPsnr.toFixed(1).padStart(13)} dB   ${r.weakest >= MARGIN ? "yes" : "no"}`,
        );
      }
      const best = results.find((r) => r.weakest >= MARGIN);
      console.log(best ? `\nSmallest AMP that passes with every bit ≥ ${MARGIN}σ: ${best.amp} (package.ts has ${AMP})` : "\nNo AMP passed.");
      failures = 0; // tuning reports, it doesn't judge
      if (!best) failures = 1;
    } else {
      const amp = values.amp ? Number(values.amp) : AMP;
      const r = await trial({ source, seconds, work, amp, full: true });
      console.log(`\nFingerprint AMP ${amp} luma levels (±${amp} of 219; bits must clear ${MARGIN}σ, ${SURE_BIT}σ counts as clear)`);
      console.log(`PSNR a vs b: ${r.abPsnr.toFixed(1)} dB (luma; 45+ dB = no visible difference). Source vs packaged 1080p: ${r.srcPsnr.toFixed(1)} dB`);
      console.log(`Encode speed: ${r.speed.toFixed(2)}x real time (${fmtSeconds(seconds)} of 1080p30 into 3 qualities x 2 variants)`);
    }
  } finally {
    if (!values.keep && !values.work) await rm(work, { recursive: true, force: true });
  }
  console.log(`\n${failures ? `${failures} check(s) FAILED` : "All checks passed"} in ${fmtSeconds((Date.now() - started) / 1000)}.`);
  process.exitCode = failures ? 1 : 0;
}

await main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
