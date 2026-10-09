import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// Bundles the Phase 1 demo into one self-contained HTML file for sharing a
// preview link. Next.js APIs are swapped for small client-side shims.
const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Embed images referenced as "/stills/name.jpg", "/thumbs/<course>/name.jpg" or "/certificates/name.jpg"
// so the preview is one file.
function inlineStills(): Plugin {
  return {
    name: "inline-stills",
    enforce: "pre",
    transform(code, id) {
      if (!/\/src\/.*\.(t|j)sx?$/.test(id) || !/\/(stills|thumbs|certificates)\//.test(code)) return;
      const names = new Set<string>();
      const out = code.replace(/(=)?(["'])\/((?:stills|certificates|thumbs\/[\w-]+)\/[\w-]+)\.jpg\2/g, (_m, eq: string | undefined, _q, file: string) => {
        names.add(file);
        const id = `__img_${file.replace(/[^\w]/g, "_")}`;
        return eq ? `={${id}}` : id; // JSX attributes need braces
      });
      const imports = [...names].map((f) => `import __img_${f.replace(/[^\w]/g, "_")} from ${JSON.stringify(here(`../public/${f}.jpg`) + "?inline")};`).join("\n");
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
