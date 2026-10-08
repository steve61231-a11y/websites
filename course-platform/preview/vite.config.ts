import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// Bundles the Phase 1 demo into one self-contained HTML file for sharing a
// preview link. Next.js APIs are swapped for small client-side shims.
const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Embed the studio stills referenced as "/stills/name.jpg" so the preview is one file.
function inlineStills(): Plugin {
  return {
    name: "inline-stills",
    enforce: "pre",
    transform(code, id) {
      if (!/\/src\/.*\.(t|j)sx?$/.test(id) || !code.includes("/stills/")) return;
      const names = new Set<string>();
      const out = code.replace(/(=)?(["'])\/stills\/([\w-]+)\.jpg\2/g, (_m, eq: string | undefined, _q, name: string) => {
        names.add(name);
        const id = `__still_${name.replace(/-/g, "_")}`;
        return eq ? `={${id}}` : id; // JSX attributes need braces
      });
      const imports = [...names].map((n) => `import __still_${n.replace(/-/g, "_")} from ${JSON.stringify(here(`../public/stills/${n}.jpg`) + "?inline")};`).join("\n");
      return { code: `${imports}\n${out}`, map: null };
    },
  };
}

export default defineConfig({
  root: here("."),
  plugins: [inlineStills(), react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: [
      { find: "next/link", replacement: here("./shims/link.tsx") },
      { find: "next/navigation", replacement: here("./shims/navigation.ts") },
      { find: "next/font/google", replacement: here("./shims/font.ts") },
      { find: "next/dynamic", replacement: here("./shims/dynamic.tsx") },
      { find: /^@\//, replacement: here("../src/") },
    ],
  },
    build: { outDir: here("./dist"), emptyOutDir: true },
});
