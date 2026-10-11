// Small helpers shared by the video scripts (package, trace-leak, selftest,
// plan, merge). Node only, no dependencies.

import { spawn, type SpawnOptions } from "node:child_process";
import { createDecipheriv, createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { segmentIv, segmentKey, type SegmentRef } from "../../src/lib/video/derive.ts";

/** Print a plain-English error and stop. Shows as an annotation in GitHub Actions. */
export function fail(message: string): never {
  const prefix = process.env.GITHUB_ACTIONS ? "::error::" : "Error: ";
  console.error(prefix + message.replace(/\n/g, process.env.GITHUB_ACTIONS ? "%0A" : "\n"));
  process.exit(1);
}

export function warn(message: string) {
  console.warn((process.env.GITHUB_ACTIONS ? "::warning::" : "Warning: ") + message);
}

/** True when this file is the script Node was started with. */
export function isMain(metaUrl: string) {
  return !!process.argv[1] && fileURLToPath(metaUrl) === resolve(process.argv[1]);
}

export type RunResult = { stdout: string; stderr: string };

/** Run a command, collect its output, reject with the tail of stderr on failure. */
export function run(cmd: string, args: string[], opts: SpawnOptions & { input?: string } = {}): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { ...opts, stdio: ["pipe", "pipe", "pipe"] });
    const out: Buffer[] = [];
    const err: Buffer[] = [];
    child.stdout!.on("data", (d) => out.push(d));
    child.stderr!.on("data", (d) => err.push(d));
    child.on("error", reject);
    child.on("close", (code) => {
      const stdout = Buffer.concat(out).toString();
      const stderr = Buffer.concat(err).toString();
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${cmd} exited with ${code}\n${stderr.trim().split("\n").slice(-15).join("\n")}`));
    });
    child.stdin!.end(opts.input ?? "");
  });
}

/** Like run(), but returns stdout as bytes (for raw video). */
export function runBytes(cmd: string, args: string[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    const out: Buffer[] = [];
    const err: Buffer[] = [];
    child.stdout.on("data", (d) => out.push(d));
    child.stderr.on("data", (d) => err.push(d));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(Buffer.concat(out));
      else reject(new Error(`${cmd} exited with ${code}\n${Buffer.concat(err).toString().trim().split("\n").slice(-15).join("\n")}`));
    });
  });
}

export async function ffprobe(file: string) {
  const { stdout } = await run("ffprobe", ["-v", "error", "-show_format", "-show_streams", "-of", "json", file]);
  return JSON.parse(stdout) as {
    format: { duration?: string; size?: string; format_name?: string };
    streams: Array<Record<string, any>>; // eslint-disable-line @typescript-eslint/no-explicit-any
  };
}

export function sha256File(file: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const h = createHash("sha256");
    createReadStream(file)
      .on("data", (d) => h.update(d))
      .on("error", reject)
      .on("end", () => resolve(h.digest("hex")));
  });
}

/** Decrypt one segment the way a player does (AES-128-CBC, PKCS#7). */
export async function decryptSegment(secret: string, ref: SegmentRef, data: Buffer) {
  const d = createDecipheriv("aes-128-cbc", await segmentKey(secret, ref), await segmentIv(secret, ref));
  return Buffer.concat([d.update(data), d.final()]);
}

/** Run async jobs with at most `limit` at a time. */
export async function pool<T>(items: T[], limit: number, job: (item: T, i: number) => Promise<void>) {
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      await job(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

/** "2.3 - Camera Sensor.mp4" -> "2.3". Codes are <day>.<lesson>. */
export function codeFromName(name: string) {
  const m = name.trim().match(/^(\d{1,2})\s*\.\s*(\d{1,2})(?!\d)/);
  return m ? `${Number(m[1])}.${Number(m[2])}` : null;
}

/** Sort "0.1" < "2.3" < "2.10" < "10.1". */
export function compareCodes(a: string, b: string) {
  const [a1, a2] = a.split(".").map(Number);
  const [b1, b2] = b.split(".").map(Number);
  return a1 - b1 || a2 - b2 || a.localeCompare(b);
}

export function fmtSeconds(s: number) {
  const m = Math.floor(s / 60);
  return m ? `${m} min ${Math.round(s - m * 60)} s` : `${s.toFixed(1)} s`;
}
