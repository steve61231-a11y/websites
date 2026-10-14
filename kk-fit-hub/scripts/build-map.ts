/**
 * Builds the simplified Kenya county map used by "Where we work" (PRD 6.11).
 * Pre-simplifies the IEBC county boundaries to an inline SVG under 40 KB,
 * so the site needs no map library.
 *
 *   npx tsx scripts/build-map.ts [path/to/counties.geojson]
 *
 * Without a path the source is downloaded from
 * github.com/mikelmaron/kenya-election-data (IEBC county boundaries).
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCE =
  "https://raw.githubusercontent.com/mikelmaron/kenya-election-data/master/data/counties.geojson";
const OUT = path.join(__dirname, "..", "content", "kenya-map.json");
const WIDTH = 400;
const TOLERANCE = 0.7; // in output pixels

type Position = [number, number];
type Feature = {
  properties: { COUNTY_NAM: string | null };
  geometry: { type: "Polygon"; coordinates: Position[][] } | { type: "MultiPolygon"; coordinates: Position[][][] };
};

function titleCase(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*-\s*/g, "-")
    .replace(/(^|[\s-])([a-z])/g, (_, p: string, c: string) => p + c.toUpperCase())
    .replace("Elegeyo", "Elgeyo")
    .replace("Tharaka-Nithi", "Tharaka-Nithi");
}

function perpendicular(p: Position, a: Position, b: Position): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  if (dx === 0 && dy === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  return Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / Math.hypot(dx, dy);
}

function simplify(points: Position[], tolerance: number): Position[] {
  if (points.length < 3) return points;
  let maxDist = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicular(points[i], points[0], points[points.length - 1]);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }
  if (maxDist <= tolerance) return [points[0], points[points.length - 1]];
  const left = simplify(points.slice(0, index + 1), tolerance);
  const right = simplify(points.slice(index), tolerance);
  return [...left.slice(0, -1), ...right];
}

async function main() {
  const input = process.argv[2];
  const raw = input ? await readFile(input, "utf8") : await (await fetch(SOURCE)).text();
  const data = JSON.parse(raw) as { features: Feature[] };
  const features = data.features.filter((f) => f.properties.COUNTY_NAM);

  const polygons = (f: Feature): Position[][][] =>
    f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const f of features)
    for (const poly of polygons(f))
      for (const [x, y] of poly[0]) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }

  // Equirectangular projection scaled by cos(latitude); Kenya sits on the equator.
  const kx = Math.cos((((minY + maxY) / 2) * Math.PI) / 180);
  const scale = WIDTH / ((maxX - minX) * kx);
  const height = Math.round((maxY - minY) * scale);
  const project = ([x, y]: Position): Position => [(x - minX) * kx * scale, (maxY - y) * scale];

  const counties = new Map<string, string[]>();
  for (const f of features) {
    const name = titleCase(f.properties.COUNTY_NAM ?? "");
    for (const poly of polygons(f)) {
      const ring = simplify(poly[0].map(project), TOLERANCE);
      if (ring.length < 4) continue;
      const d =
        "M" +
        ring
          .slice(0, -1)
          .map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`)
          .join("L") +
        "Z";
      counties.set(name, [...(counties.get(name) ?? []), d]);
    }
  }

  const out = {
    source: "IEBC county boundaries via github.com/mikelmaron/kenya-election-data",
    viewBox: `0 0 ${WIDTH} ${height}`,
    counties: [...counties.entries()]
      .map(([name, parts]) => ({ name, d: parts.join("") }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
  const json = JSON.stringify(out);
  await writeFile(OUT, json + "\n");
  console.log(`${out.counties.length} counties, ${(json.length / 1024).toFixed(1)} KB → ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
