// Merge freshly packaged videos into the course's streams.json.
//
//   node scripts/video/merge.ts --course the-prod metas/   (folders are searched for meta.json)
//   node scripts/video/merge.ts --course the-prod out/meta.json [more meta.json ...]
//
// Each meta.json is written by package.ts (one streams.json entry plus course
// and code). Entries are replaced whole, codes are sorted (0.1, 2.3, 2.10)
// and the file is written the same way every time, so diffs stay small.
// --streams <file> writes somewhere else (for tests).

import { existsSync } from "node:fs";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { compareCodes, fail, isMain, streamsFile, summary, warn } from "./lib.ts";
import type { Meta, StreamEntry } from "./package.ts";

const KEY_ORDER = ["version", "duration", "segments", "renditions", "source", "packagedAt"];
const RENDITION_ORDER = ["id", "width", "height", "bandwidth", "averageBandwidth", "codecs"];

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

function ordered(obj: Record<string, Json>, order: string[]) {
  const keys = [...order.filter((k) => k in obj), ...Object.keys(obj).filter((k) => !order.includes(k)).sort()];
  return Object.fromEntries(keys.map((k) => [k, obj[k]]));
}

const isPlain = (v: Json) => v === null || typeof v !== "object";

/** JSON with 2-space indents, but short lists of numbers and the rendition
 *  objects on one line each, like the example in the build spec. */
function format(value: Json, indent = ""): string {
  if (isPlain(value)) return JSON.stringify(value);
  const inner = indent + "  ";
  if (Array.isArray(value)) {
    if (!value.length) return "[]";
    if (value.every(isPlain)) return `[${value.map((v) => JSON.stringify(v)).join(", ")}]`;
    return `[\n${value.map((v) => inner + format(v, inner)).join(",\n")}\n${indent}]`;
  }
  const entries = Object.entries(value);
  if (!entries.length) return "{}";
  if (indent.length >= 6 && entries.every(([, v]) => isPlain(v))) {
    return `{ ${entries.map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(", ")} }`;
  }
  return `{\n${entries.map(([k, v]) => `${inner}${JSON.stringify(k)}: ${format(v, inner)}`).join(",\n")}\n${indent}}`;
}

/** streams.json text: codes sorted, keys in a fixed order. */
export function formatStreams(streams: Record<string, StreamEntry>) {
  const sorted: Record<string, Json> = {};
  for (const code of Object.keys(streams).sort(compareCodes)) {
    const entry = ordered(streams[code] as unknown as Record<string, Json>, KEY_ORDER);
    if (Array.isArray(entry.renditions)) {
      entry.renditions = entry.renditions.map((r) => (r && typeof r === "object" && !Array.isArray(r) ? ordered(r, RENDITION_ORDER) : r));
    }
    sorted[code] = entry;
  }
  return format(sorted) + "\n";
}

/** Why a meta.json can't be used, or null if it's fine. */
export function problemWith(m: Partial<Meta>, course: string): string | null {
  if (m.course !== course) return `it is for course "${m.course}", not "${course}"`;
  if (typeof m.code !== "string" || !/^\d+\.\d+$/.test(m.code)) return `bad code ${JSON.stringify(m.code)}`;
  if (typeof m.version !== "string" || !/^[0-9a-f]{8}$/.test(m.version)) return "bad version";
  if (!Array.isArray(m.segments) || !m.segments.length || !m.segments.every((d) => typeof d === "number" && d > 0)) return "bad segments";
  if (typeof m.duration !== "number" || !(m.duration > 0)) return "bad duration";
  if (!Array.isArray(m.renditions) || !m.renditions.length) return "no renditions";
  for (const r of m.renditions) {
    if (!r || typeof r.id !== "string" || !/^[0-9A-Za-z]{1,16}$/.test(r.id) || !(r.bandwidth > 0) || !(r.width > 0) || !(r.height > 0)) {
      return `bad rendition ${JSON.stringify(r)}`;
    }
  }
  return null;
}

/** All meta.json files in the given files and folders (searched recursively). */
async function findMetas(paths: string[]) {
  const found: string[] = [];
  const walk = async (p: string) => {
    const s = await stat(p).catch(() => null);
    if (!s) return warn(`${p} doesn't exist; skipped.`);
    if (s.isFile()) return void found.push(p);
    for (const e of (await readdir(p, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      if (e.isDirectory()) await walk(join(p, e.name));
      else if (e.name === "meta.json") found.push(join(p, e.name));
    }
  };
  for (const p of paths) await walk(p);
  return found;
}

export async function merge(o: { course: string; paths: string[]; streams?: string }) {
  const file = o.streams ?? streamsFile(o.course);
  const streams: Record<string, StreamEntry> = existsSync(file) ? JSON.parse(await readFile(file, "utf8")) : {};
  const metas: Meta[] = [];
  for (const p of await findMetas(o.paths)) {
    let m: Meta;
    try {
      m = JSON.parse(await readFile(p, "utf8"));
    } catch {
      warn(`${p} isn't valid JSON; skipped.`);
      continue;
    }
    const problem = problemWith(m, o.course);
    if (problem) warn(`${p} skipped: ${problem}.`);
    else metas.push(m);
  }
  // Two packagings of one code (shouldn't happen): the newest wins.
  metas.sort((a, b) => String(a.packagedAt).localeCompare(String(b.packagedAt)));

  const added: string[] = [];
  const updated: string[] = [];
  for (const m of metas) {
    const entry: Partial<Meta> = { ...m };
    delete entry.course;
    delete entry.code;
    (m.code in streams ? updated : added).push(m.code);
    streams[m.code] = entry as StreamEntry;
  }
  const text = formatStreams(streams);
  const before = existsSync(file) ? await readFile(file, "utf8") : "";
  if (text !== before) await writeFile(file, text);
  return { file, added: [...new Set(added)].sort(compareCodes), updated: [...new Set(updated)].sort(compareCodes), changed: text !== before, total: Object.keys(streams).length };
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { course: { type: "string", default: "the-prod" }, streams: { type: "string" } },
  });
  if (!positionals.length) fail("Usage: node scripts/video/merge.ts --course the-prod <meta.json files or folders>");
  const res = await merge({ course: values.course!, paths: positionals, streams: values.streams });
  const parts = [res.added.length && `added ${res.added.join(", ")}`, res.updated.length && `updated ${res.updated.join(", ")}`].filter(Boolean);
  const line = parts.length ? `streams.json: ${parts.join("; ")} (${res.total} videos in total).` : "streams.json: no packaged videos to add.";
  console.log(res.changed ? line : `${line} No change to the file.`);
  summary(`### streams.json\n${line}`);
}

if (isMain(import.meta.url)) await main();
