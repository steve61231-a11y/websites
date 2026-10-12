import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// Bundles the Phase 1 demo into one self-contained HTML file for sharing a
// preview link. Next.js APIs are swapped for small client-side shims.
const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Images referenced as "/stills/name.jpg", "/thumbs/<course>/name.jpg" or
// "/certificates/name.jpg" become relative paths and are published next to the
// page (preview/dist/images.json lists them), so the page itself stays small
// enough to open anywhere. Inlining them made a 4 MB page that failed to load.
const images = new Set<string>();
function relativeStills(): Plugin {
  return {
    name: "relative-stills",
    enforce: "pre",
    transform(code, id) {
      if (!/\/src\/.*\.(t|j)sx?$/.test(id) || !/\/(stills|thumbs|certificates)\//.test(code)) return;
      const out = code.replace(/(["'])\/((?:stills|certificates|thumbs\/[\w-]+)\/[\w-]+\.jpg)\1/g, (_m, q: string, file: string) => {
        images.add(file);
        return `${q}${file}${q}`;
      });
      return { code: out, map: null };
    },
    closeBundle() {
      writeFileSync(here("./dist/images.json"), JSON.stringify([...images].sort(), null, 2));
    },
  };
}

export default defineConfig({
  root: here("."),
  plugins: [relativeStills(), react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: [
      { find: "next/link", replacement: here("./shims/link.tsx") },
      { find: "next/navigation", replacement: here("./shims/navigation.ts") },
      { find: "next/font/google", replacement: here("./shims/font.ts") },
      { find: "next/dynamic", replacement: here("./shims/dynamic.tsx") },
      // No key server in the preview: lessons always use the stand-in player.
      { find: /^.*\/streams\.json$/, replacement: here("./shims/streams.json") },
      { find: /^hls\.js$/, replacement: here("./shims/hls.ts") },
      { find: /^@\//, replacement: here("../src/") },
    ],
  },
  build: { outDir: here("./dist"), emptyOutDir: true },
});
