// Turns the single-file preview build (preview/dist/index.html) into the page
// fragment the Artifact publisher expects: <title> first, no doctype or
// html/head/body wrappers. Usage: npm run preview:artifact [out.html]
import { readFileSync, writeFileSync } from "node:fs";

const out = process.argv[2] ?? "preview/dist/artifact.html";
let html = readFileSync("preview/dist/index.html", "utf8");
const title = html.match(/<title>[\s\S]*?<\/title>/)?.[0] ?? "<title>THE PROD</title>";
html = html
  .replace(title, "")
  .replace(/<!doctype html>/i, "")
  .replace(/<\/?(html|head|body)\b[^>]*>/gi, "");
writeFileSync(out, `${title}\n${html.trim()}\n`);
console.log(`Wrote ${out} (${(Buffer.byteLength(html) / 1e6).toFixed(2)} MB)`);
