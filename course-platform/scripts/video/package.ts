// Package one lesson video as encrypted, fingerprinted HLS.
//
//   VIDEO_SECRET=... node scripts/video/package.ts --input "2.3 - Camera Sensor.mp4" \
//     --course the-prod --code 2.3 --out out [--drive-id 1AbC... --source-name "2.3 - Camera Sensor.mp4"]
//
// For each quality (1080p, 720p, 480p, never above the source) the video is
// decoded and scaled once, then encoded twice: variant a with the invisible
// fingerprint pattern added, variant b with it subtracted. Both are cut into
// 6-second HLS segments that line up exactly across every quality and variant.
// Each segment is AES-128 encrypted with its own key (derived from
// VIDEO_SECRET, never stored) and written to out/<course>/<code>/<version>/<name>.ts.
// out/meta.json is this video's streams.json entry plus course and code; the
// GitHub Action merges it in with merge.ts.

import { spawn } from "node:child_process";
import { createCipheriv } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { availableParallelism, tmpdir } from "node:os";
import { basename, join } from "node:path";
import { parseArgs } from "node:util";
import { SEGMENT_SECONDS, segmentIv, segmentKey, segmentPath, type SegmentRef, type Variant } from "../../src/lib/video/derive.ts";
import { geqExpression } from "./fingerprint.ts";
import { fail, ffprobe, fmtSeconds, isMain, pool, runBytes, sha256File } from "./lib.ts";

/** Fingerprint strength in luma levels (video range is 16-235). Picked by
 *  selftest.ts: the smallest that still reads back with a clear margin from a
 *  360p crf 32 re-encode of a rip, while a and b stay visually identical. */
export const AMP = 2;

/** Quality ladder. Only rungs at or below the source's short side are made. */
export const LADDER = [
  { id: "1080", size: 1080, crf: 21, maxrate: 3500, bufsize: 7000, audio: 128 },
  { id: "720", size: 720, crf: 22, maxrate: 1800, bufsize: 3600, audio: 128 },
  { id: "480", size: 480, crf: 23, maxrate: 800, bufsize: 1600, audio: 96 },
];

const VARIANTS: Variant[] = ["a", "b"];

type Rung = (typeof LADDER)[number] & { width: number; height: number };

export type Rendition = {
  id: string;
  width: number;
  height: number;
  bandwidth: number;
  averageBandwidth: number;
  codecs: string;
};

/** One streams.json entry (what the server reads). */
export type StreamEntry = {
  version: string;
  duration: number;
  segments: number[];
  renditions: Rendition[];
  driveId?: string;
  sourceName: string;
  packagedAt: string;
};

export type Meta = { course: string; code: string } & StreamEntry;

export type PackageOptions = {
  input: string;
  course: string;
  code: string;
  out: string;
  secret: string;
  driveId?: string;
  sourceName?: string;
  amp?: number;
  log?: (line: string) => void;
};

type Source = { width: number; height: number; duration: number; fps: [number, number] | null; hasAudio: boolean; hdr: boolean };

const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);

/** Size, length, frame rate and audio of the upload. */
async function probeSource(input: string): Promise<Source> {
  let info;
  try {
    info = await ffprobe(input);
  } catch {
    throw new Error(`ffmpeg can't read ${basename(input)}. Is it a video file?`);
  }
  const v = info.streams.find((s) => s.codec_type === "video" && !s.disposition?.attached_pic);
  if (!v) throw new Error(`${basename(input)} has no video track.`);
  let width = Number(v.width);
  let height = Number(v.height);
  // Non-square pixels (old camcorders): use the display width.
  const sar = String(v.sample_aspect_ratio ?? "1:1").split(":").map(Number);
  if (sar[0] > 0 && sar[1] > 0 && sar[0] !== sar[1]) width = width * (sar[0] / sar[1]);
  // Phones store portrait video sideways plus a rotation flag; ffmpeg turns it upright.
  const rotation = Number(v.side_data_list?.find((d: { rotation?: number }) => d.rotation !== undefined)?.rotation ?? v.tags?.rotate ?? 0);
  if (Math.abs(rotation) % 180 === 90) [width, height] = [height, width];
  const duration = Number(info.format.duration ?? v.duration);
  if (!(duration > 0)) throw new Error(`${basename(input)} has no duration. Is the upload complete?`);
  const [num, den] = String(v.avg_frame_rate || v.r_frame_rate || "0/0").split("/").map(Number);
  return {
    width,
    height,
    duration,
    fps: num > 0 && den > 0 ? [num, den] : null,
    hasAudio: info.streams.some((s) => s.codec_type === "audio"),
    // iPhones film HDR (HLG) by default; it looks washed out unless converted.
    hdr: ["smpte2084", "arib-std-b67"].includes(String(v.color_transfer)),
  };
}

/** The rungs to make for this source, sized to its aspect ratio. */
export function ladderFor(width: number, height: number): Rung[] {
  const short = Math.min(width, height);
  let rungs = LADDER.filter((r) => r.size <= short);
  // Smaller than 480p: one rendition at the source size.
  if (!rungs.length) rungs = [{ ...LADDER[LADDER.length - 1], id: String(even(short)), size: even(short) }];
  return rungs.map((r) => ({ ...r, width: even((width * r.size) / short), height: even((height * r.size) / short) }));
}

/** ffmpeg arguments for one rung: decode and scale once, split into a (+pattern)
 *  and b (-pattern), encode both to 6-second HLS segments in `dir`. */
function rungArgs(input: string, src: Source, r: Rung, dir: string, amp: number) {
  const threads = Math.max(1, availableParallelism());
  // 50/60 fps: halve it. Lessons don't need it and it doubles size and encode time.
  const fps = src.fps && src.fps[0] / src.fps[1] > 31 ? `fps=${src.fps[0]}/${src.fps[1] * 2},` : "";
  // HDR to normal (SDR) video, after scaling so it works on fewer pixels.
  const toSdr = src.hdr ? "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv," : "";
  // The pattern is computed on a 64x64 grid (cheap), scaled up, and added with
  // blend grainmerge (A + B - 128) for a or grainextract (A - B + 128) for b.
  // Gray scaled with tv range on both sides keeps 128 = no change.
  // (Measured: this is the fastest way. A full-size pattern with blend
  // expressions is ~17x slower, a static pattern image with eq ~25% slower.)
  const graph = [
    `[0:v]${fps}split=2[t][s]`,
    `[t]scale=64:64:flags=neighbor,format=gray,geq=lum='${geqExpression(amp)}',` +
      `scale=${r.width}:${r.height}:flags=bilinear:in_range=tv:out_range=tv:threads=${threads},format=yuv420p,split=2[pa][pb]`,
    `[s]scale=${r.width}:${r.height}:flags=bicubic:threads=${threads},${toSdr}format=yuv420p,setsar=1,split=2[ra][rb]`,
    `[ra][pa]blend=all_mode=grainmerge[va]`,
    `[rb][pb]blend=all_mode=grainextract[vb]`,
  ].join(";");
  const args = ["-hide_banner", "-loglevel", "error", "-nostats", "-progress", "pipe:1", "-stats_period", "20", "-y", "-i", input, "-filter_complex", graph];
  for (const v of VARIANTS) {
    args.push("-map", `[v${v}]`);
    if (src.hasAudio) args.push("-map", "0:a:0");
    args.push(
      "-map_metadata", "-1",
      "-map_chapters", "-1",
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-profile:v", "high",
      "-pix_fmt", "yuv420p",
      "-crf", String(r.crf),
      "-maxrate", `${r.maxrate}k`,
      "-bufsize", `${r.bufsize}k`,
      // A keyframe exactly every 6 s and nowhere else, so segments line up everywhere.
      "-g", "100000",
      "-force_key_frames", `expr:gte(t,n_forced*${SEGMENT_SECONDS})`,
      "-sc_threshold", "0",
    );
    if (src.hdr) args.push("-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709");
    if (src.hasAudio) args.push("-c:a", "aac", "-b:a", `${r.audio}k`, "-ac", "2", "-ar", "48000");
    args.push(
      "-max_muxing_queue_size", "4096",
      "-f", "hls",
      "-hls_time", String(SEGMENT_SECONDS),
      "-hls_playlist_type", "vod",
      "-hls_segment_type", "mpegts",
      "-hls_segment_filename", join(dir, v, "%05d.ts"),
      join(dir, v, "index.m3u8"),
    );
  }
  return args;
}

/** Run ffmpeg, logging its progress every 20 s. */
function ffmpeg(args: string[], label: string, duration: number, log: (l: string) => void) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
    let err = "";
    child.stderr.on("data", (d) => (err = (err + d).slice(-4000)));
    child.stdout.on("data", (d: Buffer) => {
      const m = String(d).match(/out_time_us=(\d+)[\s\S]*speed=\s*([\d.]+)x/);
      if (m && Number(m[1]) > 1e6) log(`  ${label}: ${fmtSeconds(Number(m[1]) / 1e6)} of ${fmtSeconds(duration)} (${m[2]}x)`);
    });
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg (${label}) failed:\n${err.trim()}`))));
  });
}

/** EXTINF durations (as written) and segment files of a media playlist. */
function parsePlaylist(text: string) {
  const durations: string[] = [];
  const files: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith("#EXTINF:")) durations.push(line.slice(8).split(",")[0].trim());
    else if (line && !line.startsWith("#")) files.push(line.trim());
  }
  if (!files.length || files.length !== durations.length) throw new Error("ffmpeg wrote an empty or broken playlist");
  return { durations, files };
}

/** RFC 6381 codec string for the H.264 stream in a segment, read from its SPS. */
async function videoCodec(file: string) {
  const es = await runBytes("ffmpeg", ["-v", "error", "-i", file, "-map", "0:v:0", "-c", "copy", "-frames:v", "1", "-f", "h264", "pipe:1"]);
  for (let i = 0; i + 6 < es.length; i++) {
    if (es[i] === 0 && es[i + 1] === 0 && es[i + 2] === 1 && (es[i + 3] & 0x1f) === 7) {
      return "avc1." + [es[i + 4], es[i + 5], es[i + 6]].map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  }
  throw new Error(`no H.264 SPS found in ${file}`);
}

async function audioCodec(file: string) {
  const a = (await ffprobe(file)).streams.find((s) => s.codec_type === "audio");
  if (!a) return null;
  const aot: Record<string, number> = { LC: 2, "HE-AAC": 5, "HE-AACv2": 29 };
  return `mp4a.40.${aot[a.profile] ?? 2}`;
}

export async function packageVideo(o: PackageOptions) {
  const log = o.log ?? ((l: string) => console.log(l));
  const amp = o.amp ?? AMP;
  if (!/^[a-z0-9][a-z0-9-]*$/.test(o.course)) throw new Error(`course "${o.course}" should look like "the-prod"`);
  if (!/^\d+\.\d+$/.test(o.code)) throw new Error(`code "${o.code}" should look like "2.3"`);
  if (!existsSync(o.input)) throw new Error(`can't find ${o.input}`);
  const started = Date.now();

  const src = await probeSource(o.input);
  const version = (await sha256File(o.input)).slice(0, 8);
  const rungs = ladderFor(src.width, src.height);
  log(
    `${o.code}: ${Math.round(src.width)}x${src.height}${src.hdr ? " HDR (converting to SDR)" : ""}, ${fmtSeconds(src.duration)}, ` +
      `version ${version}, renditions ${rungs.map((r) => `${r.width}x${r.height}`).join(" ")}${src.hasAudio ? "" : " (no audio)"}`,
  );

  const tmp = await mkdtemp(join(tmpdir(), `video-${o.code}-`));
  try {
    // One ffmpeg per rung, in parallel: faster than one process with six
    // outputs because filtering isn't stuck on one thread.
    await Promise.all(
      rungs.map(async (r) => {
        for (const v of VARIANTS) await mkdir(join(tmp, r.id, v), { recursive: true });
        await ffmpeg(rungArgs(o.input, src, r, join(tmp, r.id), amp), `${r.id}p`, src.duration, log);
      }),
    );
    const encodedAt = Date.now();

    // Every rendition and variant must have identical segment timing, or
    // mixing a/b per segment and switching quality would break playback.
    const lists = new Map<string, ReturnType<typeof parsePlaylist>>();
    for (const r of rungs) for (const v of VARIANTS) lists.set(`${r.id}${v}`, parsePlaylist(await readFile(join(tmp, r.id, v, "index.m3u8"), "utf8")));
    const [firstKey, first] = [...lists][0];
    for (const [key, list] of lists) {
      if (list.durations.length !== first.durations.length) {
        throw new Error(`${key} has ${list.durations.length} segments but ${firstKey} has ${first.durations.length}`);
      }
      list.durations.forEach((d, i) => {
        if (d !== first.durations[i]) throw new Error(`segment ${i} is ${d} s in ${key} but ${first.durations[i]} s in ${firstKey}`);
      });
    }
    const segments = first.durations.map((d) => Number(Number(d).toFixed(3)));
    const total = segments.reduce((a, b) => a + b, 0);

    // Encrypt every segment with its own key into out/<segmentPath>.
    const jobs: Array<{ r: Rung; v: Variant; i: number }> = [];
    for (const r of rungs) for (const v of VARIANTS) for (let i = 0; i < segments.length; i++) jobs.push({ r, v, i });
    const sizes = new Map<string, number[]>();
    for (const r of rungs) for (const v of VARIANTS) sizes.set(`${r.id}${v}`, new Array(segments.length).fill(0));
    await mkdir(join(o.out, o.course, o.code, version), { recursive: true });
    await pool(jobs, 8, async ({ r, v, i }) => {
      const ref: SegmentRef = { course: o.course, code: o.code, version, rendition: r.id, variant: v, index: i };
      const plain = await readFile(join(tmp, r.id, v, lists.get(`${r.id}${v}`)!.files[i]));
      const cipher = createCipheriv("aes-128-cbc", await segmentKey(o.secret, ref), await segmentIv(o.secret, ref));
      const data = Buffer.concat([cipher.update(plain), cipher.final()]);
      await writeFile(join(o.out, await segmentPath(o.secret, ref)), data);
      sizes.get(`${r.id}${v}`)![i] = data.length;
    });

    const renditions: Rendition[] = [];
    for (const r of rungs) {
      let peak = 0;
      let bytes = 0;
      for (const v of VARIANTS) {
        const s = sizes.get(`${r.id}${v}`)!;
        s.forEach((b, i) => {
          // Peak over real segments; a tiny last one (a keyframe in 0.2 s) would overstate it.
          if (segments[i] >= 1 || segments.length === 1) peak = Math.max(peak, (b * 8) / segments[i]);
          bytes += b;
        });
      }
      const dir = join(tmp, r.id);
      const avcs = await Promise.all(VARIANTS.map((v) => videoCodec(join(dir, v, lists.get(`${r.id}${v}`)!.files[0]))));
      const avc = avcs.sort().at(-1)!; // a and b match; if not, the higher level is safe
      const aac = await audioCodec(join(dir, "a", lists.get(`${r.id}a`)!.files[0]));
      renditions.push({
        id: r.id,
        width: r.width,
        height: r.height,
        bandwidth: Math.ceil(peak),
        averageBandwidth: Math.ceil((bytes * 8) / VARIANTS.length / total),
        codecs: aac ? `${avc},${aac}` : avc,
      });
    }

    const meta: Meta = {
      course: o.course,
      code: o.code,
      version,
      duration: Number(total.toFixed(3)),
      segments,
      renditions,
      ...(o.driveId ? { driveId: o.driveId } : {}),
      sourceName: o.sourceName || basename(o.input),
      packagedAt: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
    };
    await mkdir(o.out, { recursive: true });
    await writeFile(join(o.out, "meta.json"), JSON.stringify(meta, null, 2) + "\n");

    const seconds = (Date.now() - started) / 1000;
    const stats = {
      seconds,
      encodeSeconds: (encodedAt - started) / 1000,
      speed: src.duration / seconds,
      files: jobs.length,
      bytes: [...sizes.values()].flat().reduce((a, b) => a + b, 0),
    };
    log(
      `${o.code}: ${segments.length} segments x ${rungs.length} renditions x 2 variants = ${stats.files} encrypted files, ` +
        `${(stats.bytes / 1e6).toFixed(1)} MB, in ${fmtSeconds(seconds)} (${stats.speed.toFixed(2)}x real time)`,
    );
    return { meta, stats };
  } finally {
    // Plaintext segments never leave this machine.
    await rm(tmp, { recursive: true, force: true });
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      input: { type: "string" },
      course: { type: "string" },
      code: { type: "string" },
      out: { type: "string" },
      "drive-id": { type: "string" },
      "source-name": { type: "string" },
      amp: { type: "string" }, // for selftest.ts tuning only
    },
  });
  if (!values.input || !values.course || !values.code || !values.out) {
    fail("Usage: VIDEO_SECRET=... node scripts/video/package.ts --input <file> --course the-prod --code 2.3 --out <dir> [--drive-id X --source-name N]");
  }
  const secret = process.env.VIDEO_SECRET ?? "";
  if (secret.length < 32) fail("VIDEO_SECRET is missing or shorter than 32 characters.");
  if (!(await stat(values.input).catch(() => null))?.isFile()) fail(`Can't find the video file ${values.input}.`);
  try {
    await packageVideo({
      input: values.input,
      course: values.course,
      code: values.code,
      out: values.out,
      secret,
      driveId: values["drive-id"],
      sourceName: values["source-name"],
      amp: values.amp ? Number(values.amp) : undefined,
    });
  } catch (e) {
    fail(`Packaging ${values.code} failed: ${(e as Error).message}`);
  }
}

if (isMain(import.meta.url)) await main();
