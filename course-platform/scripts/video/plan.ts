// Decide which lesson videos the GitHub Action should package.
//
//   node scripts/video/plan.ts --course the-prod [--folder <Drive folder link or id>]
//     [--only 2.3,4.1] [--force true] [--allow-unset] [--listing files.json]
//
// Lists the course's Google Drive folder (shared as "Anyone with the link"),
// takes every video whose name starts with a lesson code ("2.3 - Camera
// Sensor.mp4" -> 2.3) and compares it with streams.json: a video is packaged
// when it's new, when it was replaced in Drive (different file id), or when
// --force is set. --only limits the run to some codes.
//
// The folder comes from --folder or from content/videos/<course>.json
// ("driveFolder"). Prints the GitHub Actions matrix as JSON and, in Actions,
// sets the step outputs `matrix` and `count`.
// --listing reads a JSON list of {id, path} instead of asking Drive, and
// --streams reads another streams.json (tests).
// --allow-unset: no folder set yet is not an error (for the daily schedule).

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { parseArgs } from "node:util";
import { APP_DIR, codeFromName, compareCodes, fail, isMain, notice, run, setOutput, streamsFile, summary, warn } from "./lib.ts";

const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".m4v", ".mkv", ".webm", ".avi", ".mts", ".m2ts", ".mpg", ".mpeg", ".wmv", ".3gp"]);

export type DriveFile = { id: string; path: string };
export type Job = { code: string; driveId: string; name: string; reason: "new" | "replaced" | "forced" };

/** Folder link or bare id -> a link gdown understands. */
export function folderUrl(folder: string) {
  const f = folder.trim();
  if (/^[\w-]{10,}$/.test(f)) return `https://drive.google.com/drive/folders/${f}`;
  return f;
}

const truthy = (v: string | undefined) => /^(1|true|yes|on)$/i.test(v?.trim() ?? "");

/** List a shared Drive folder (and its subfolders) with gdown, without downloading. */
async function listDrive(url: string): Promise<DriveFile[]> {
  const py = [
    "import json, sys, gdown",
    "files = gdown.download_folder(url=sys.argv[1], skip_download=True, quiet=True)",
    "print(json.dumps([{'id': f.id, 'path': f.path} for f in files]))",
  ].join("\n");
  let stdout: string;
  try {
    ({ stdout } = await run("python3", ["-c", py, url]));
  } catch (e) {
    const detail = (e as Error).message;
    if (/No module named .?gdown/.test(detail)) fail("gdown isn't installed. Run: pip install gdown");
    fail(
      `Couldn't open the Google Drive folder ${url}.\n` +
        `Make sure the link is right and the folder is shared as "Anyone with the link" (Viewer): ` +
        `in Drive, right-click the folder > Share > General access > Anyone with the link.\n` +
        `Details: ${detail.trim().split("\n").at(-1)?.slice(0, 300)}`,
    );
  }
  return JSON.parse(stdout.trim().split("\n").at(-1) || "[]");
}

/** The pure decision, separate from Drive so it can be tested. */
export function planJobs(o: {
  files: DriveFile[];
  streams: Record<string, { driveId?: string }>;
  only?: string[];
  force?: boolean;
}) {
  const notes: string[] = [];
  const videos = o.files.filter((f) => VIDEO_EXTENSIONS.has(extname(f.path).toLowerCase()));
  const unnamed = videos.filter((f) => !codeFromName(basename(f.path)));
  if (unnamed.length) {
    notes.push(`warn:These videos don't start with a lesson number like "2.3 - " and were skipped: ${unnamed.map((f) => f.path).join(", ")}`);
  }

  const byCode = new Map<string, DriveFile[]>();
  for (const f of videos) {
    const code = codeFromName(basename(f.path));
    if (code) byCode.set(code, [...(byCode.get(code) ?? []), f]);
  }
  const only = o.only?.length ? new Set(o.only.map((c) => codeFromName(c) ?? c.trim())) : null;
  for (const c of only ?? []) if (!byCode.has(c)) notes.push(`warn:${c} was asked for but there is no video for it in the folder.`);

  const jobs: Job[] = [];
  const upToDate: string[] = [];
  for (const code of [...byCode.keys()].sort(compareCodes)) {
    if (only && !only.has(code)) continue;
    const files = byCode.get(code)!;
    if (files.length > 1) {
      notes.push(`warn:${code} has ${files.length} videos (${files.map((f) => f.path).join(", ")}). Keep only one, then run again. Skipped.`);
      continue;
    }
    const [f] = files;
    const current = Object.hasOwn(o.streams, code) ? o.streams[code] : undefined;
    const reason = !current ? "new" : current.driveId !== f.id ? "replaced" : o.force ? "forced" : null;
    if (reason) jobs.push({ code, driveId: f.id, name: basename(f.path), reason });
    else upToDate.push(code);
  }
  if (upToDate.length) {
    notes.push(`info:Already packaged from the same Drive file (run with force to redo): ${upToDate.join(", ")}`);
  }
  return { jobs, notes, videos: videos.length, named: videos.length - unnamed.length, files: o.files.length };
}

async function main() {
  const { values } = parseArgs({
    options: {
      course: { type: "string", default: "the-prod" },
      folder: { type: "string" },
      only: { type: "string" },
      force: { type: "string" },
      "allow-unset": { type: "boolean" },
      listing: { type: "string" },
      streams: { type: "string" },
    },
  });
  const course = values.course!.trim() || "the-prod";
  if (!/^[a-z0-9][a-z0-9-]*$/.test(course)) fail(`"${course}" isn't a course id like "the-prod".`);

  const nothing = () => {
    setOutput("matrix", JSON.stringify({ include: [] }));
    setOutput("count", "0");
    console.log(JSON.stringify({ include: [] }));
  };

  // Where the videos are: --folder, else content/videos/<course>.json.
  const settingsFile = join(APP_DIR, "content", "videos", `${course}.json`);
  let folder = values.folder?.trim() ?? "";
  if (!folder && existsSync(settingsFile)) {
    try {
      folder = String(JSON.parse(await readFile(settingsFile, "utf8")).driveFolder ?? "").trim();
    } catch {
      fail(`course-platform/content/videos/${course}.json isn't valid JSON. It should look like {"driveFolder": "https://drive.google.com/drive/folders/..."}.`);
    }
  }
  if (!folder && !values.listing) {
    const msg =
      `No Google Drive folder is set for ${course}. Paste the folder's share link into ` +
      `course-platform/content/videos/${course}.json as {"driveFolder": "https://drive.google.com/drive/folders/..."}, ` +
      `or give it as "folder" when running the workflow.`;
    if (values["allow-unset"]) {
      notice(msg + " Nothing to do.");
      return nothing();
    }
    fail(msg);
  }

  const files: DriveFile[] = values.listing ? JSON.parse(await readFile(values.listing, "utf8")) : await listDrive(folderUrl(folder));
  if (!files.length) {
    fail(`The Google Drive folder ${folder || values.listing} looks empty. Upload the lesson videos (named like "2.3 - Camera Sensor.mp4"), and check it's shared as "Anyone with the link".`);
  }

  const file = values.streams ?? streamsFile(course);
  const streams = existsSync(file) ? JSON.parse(await readFile(file, "utf8")) : {};
  const only = values.only?.split(/[\s,]+/).filter(Boolean);
  const plan = planJobs({ files, streams, only, force: truthy(values.force) });
  if (!plan.videos) {
    fail(`None of the ${plan.files} files in the Drive folder is a video (.mp4, .mov, ...). Upload the lessons named like "2.3 - Camera Sensor.mp4".`);
  }
  if (!plan.named) {
    fail(`None of the ${plan.videos} videos in the Drive folder starts with a lesson number. Rename them like "2.3 - Camera Sensor.mp4" (the number first).`);
  }
  for (const n of plan.notes) (n.startsWith("warn:") ? warn : notice)(n.slice(n.indexOf(":") + 1));

  const matrix = { include: plan.jobs.map(({ code, driveId, name }) => ({ code, driveId, name })) };
  console.error(
    plan.jobs.length
      ? `${plan.jobs.length} of ${plan.videos} videos to package:\n` + plan.jobs.map((j) => `  ${j.code.padEnd(5)} ${j.reason.padEnd(8)} ${j.name}`).join("\n")
      : "Nothing to package.",
  );
  setOutput("matrix", JSON.stringify(matrix));
  setOutput("count", String(plan.jobs.length));
  summary(
    plan.jobs.length
      ? `### Videos to package (${course})\n| Code | Why | File |\n| --- | --- | --- |\n` +
          plan.jobs.map((j) => `| ${j.code} | ${j.reason} | ${j.name.replace(/\|/g, "\\|")} |`).join("\n")
      : `### Videos (${course})\nNothing to package: every video is already up to date.`,
  );
  console.log(JSON.stringify(matrix));
}

if (isMain(import.meta.url)) await main();
