/**
 * Processes a photo for the site (PRD 9): exports AVIF and WebP at 640, 960,
 * 1280 and 1920 px wide into public/media/, keeping alpha for the cutout.
 * Grade photos (lifted blacks, -10–15% saturation, warm highlights, faint
 * green shadows) before running this; background removal for the strike
 * photo is done in a professional tool first (PNG master, 2400px+).
 *
 *   npx tsx scripts/process-photos.ts <master file> <photo id>
 *   e.g. npx tsx scripts/process-photos.ts ~/kennedy-strike.png kennedy-strike
 *
 * Then set `src` (the 1920 WebP), `width` and `height` for that id in
 * content/media.ts, and for the strike photo its `strikePoint`.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const widths = [640, 960, 1280, 1920];

async function main() {
  const [input, id] = process.argv.slice(2);
  if (!input || !id) throw new Error("Usage: process-photos.ts <master file> <photo id>");
  const outDir = path.join(__dirname, "..", "public", "media");
  await mkdir(outDir, { recursive: true });
  const meta = await sharp(input).metadata();
  if ((meta.height ?? 0) < 1600 && id === "kennedy-strike") {
    console.warn(`Warning: ${meta.height}px tall. The PRD asks for at least 1600px and a sharp fist; reshoot if needed.`);
  }
  for (const w of widths) {
    const base = sharp(input).rotate().resize({ width: w, withoutEnlargement: true });
    await base.clone().avif({ quality: 55, effort: 6 }).toFile(path.join(outDir, `${id}-${w}.avif`));
    await base.clone().webp({ quality: 78, alphaQuality: 90 }).toFile(path.join(outDir, `${id}-${w}.webp`));
  }
  const ratio = (meta.height ?? 1) / (meta.width ?? 1);
  console.log(`Done. In content/media.ts set "${id}": src "/media/${id}-1920.webp", width 1920, height ${Math.round(1920 * ratio)}.`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
