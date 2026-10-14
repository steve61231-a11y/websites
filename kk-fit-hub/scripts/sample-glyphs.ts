/**
 * Samples the activity glyphs into particle targets at build time (PRD 12,
 * loading strategy 7): public/media/particles.bin holds, for each glyph in
 * `particleGlyphOrder`, POINTS (x, y) pairs as unsigned bytes over the
 * 24 × 24 glyph box. The hub scene maps particles onto them.
 *
 *   npx tsx scripts/sample-glyphs.ts
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { glyphShapes, particleGlyphOrder, PARTICLE_POINTS, type GlyphShape } from "../content/glyphs";

type P = [number, number];

/** Flattens an SVG path (M L H V C Z, absolute and relative) to polylines. */
function pathToPolylines(d: string): P[][] {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const lines: P[][] = [];
  let cur: P = [0, 0];
  let start: P = [0, 0];
  let line: P[] = [];
  let cmd = "";
  let i = 0;
  const num = () => parseFloat(tokens[i++]);
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) cmd = tokens[i++];
    const rel = cmd === cmd.toLowerCase();
    switch (cmd.toUpperCase()) {
      case "M": {
        const p: P = [num(), num()];
        cur = rel ? [cur[0] + p[0], cur[1] + p[1]] : p;
        start = cur;
        if (line.length) lines.push(line);
        line = [cur];
        cmd = rel ? "l" : "L";
        break;
      }
      case "L": {
        const p: P = [num(), num()];
        cur = rel ? [cur[0] + p[0], cur[1] + p[1]] : p;
        line.push(cur);
        break;
      }
      case "H": {
        const x = num();
        cur = [rel ? cur[0] + x : x, cur[1]];
        line.push(cur);
        break;
      }
      case "V": {
        const y = num();
        cur = [cur[0], rel ? cur[1] + y : y];
        line.push(cur);
        break;
      }
      case "C": {
        const c = [num(), num(), num(), num(), num(), num()];
        const p1: P = rel ? [cur[0] + c[0], cur[1] + c[1]] : [c[0], c[1]];
        const p2: P = rel ? [cur[0] + c[2], cur[1] + c[3]] : [c[2], c[3]];
        const p3: P = rel ? [cur[0] + c[4], cur[1] + c[5]] : [c[4], c[5]];
        for (let t = 1; t <= 12; t++) {
          const u = t / 12;
          const a = (1 - u) ** 3, b = 3 * (1 - u) ** 2 * u, cc = 3 * (1 - u) * u * u, e = u ** 3;
          line.push([a * cur[0] + b * p1[0] + cc * p2[0] + e * p3[0], a * cur[1] + b * p1[1] + cc * p2[1] + e * p3[1]]);
        }
        cur = p3;
        break;
      }
      case "Z": {
        line.push(start);
        cur = start;
        break;
      }
      default:
        throw new Error(`Unsupported path command ${cmd}`);
    }
  }
  if (line.length) lines.push(line);
  return lines;
}

function shapeToPolylines(s: GlyphShape): P[][] {
  if (s.kind === "path") return pathToPolylines(s.d);
  if (s.kind === "circle") {
    const pts: P[] = [];
    for (let k = 0; k <= 48; k++) pts.push([s.cx + s.r * Math.cos((k / 48) * 2 * Math.PI), s.cy + s.r * Math.sin((k / 48) * 2 * Math.PI)]);
    return [pts];
  }
  const { x, y, width: w, height: h } = s;
  return [[[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]]];
}

/** Evenly spaced points along all strokes, with jitter across the stroke width. */
function sample(shapes: GlyphShape[], n: number, rand: () => number): P[] {
  const segs: { a: P; b: P; len: number }[] = [];
  for (const s of shapes)
    for (const line of shapeToPolylines(s))
      for (let k = 1; k < line.length; k++) {
        const a = line[k - 1], b = line[k];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (len > 0) segs.push({ a, b, len });
      }
  const total = segs.reduce((sum, s) => sum + s.len, 0);
  const out: P[] = [];
  for (let k = 0; k < n; k++) {
    let at = rand() * total;
    const seg = segs.find((s) => (at -= s.len) <= 0) ?? segs[segs.length - 1];
    const t = rand();
    const nx = -(seg.b[1] - seg.a[1]) / seg.len, ny = (seg.b[0] - seg.a[0]) / seg.len;
    const w = (rand() - 0.5) * 1.2; // stroke thickness, in glyph units
    out.push([seg.a[0] + (seg.b[0] - seg.a[0]) * t + nx * w, seg.a[1] + (seg.b[1] - seg.a[1]) * t + ny * w]);
  }
  return out;
}

async function main() {
  let seed = 42;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const bytes = new Uint8Array(particleGlyphOrder.length * PARTICLE_POINTS * 2);
  particleGlyphOrder.forEach((id, g) => {
    sample(glyphShapes[id], PARTICLE_POINTS, rand).forEach(([x, y], k) => {
      const o = (g * PARTICLE_POINTS + k) * 2;
      bytes[o] = Math.max(0, Math.min(255, Math.round((x / 24) * 255)));
      bytes[o + 1] = Math.max(0, Math.min(255, Math.round((y / 24) * 255)));
    });
  });
  const out = path.join(__dirname, "..", "public", "media", "particles.bin");
  await writeFile(out, bytes);
  console.log(`${particleGlyphOrder.length} glyphs × ${PARTICLE_POINTS} points → ${out} (${(bytes.length / 1024).toFixed(1)} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
