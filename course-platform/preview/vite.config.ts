import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// Bundles the Phase 1 demo into one self-contained HTML file for sharing a
// preview link. Next.js APIs are swapped for small client-side shims.
const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  root: here("."),
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: [
      { find: "next/link", replacement: here("./shims/link.tsx") },
      { find: "next/navigation", replacement: here("./shims/navigation.ts") },
      { find: "next/font/google", replacement: here("./shims/font.ts") },
      { find: /^@\//, replacement: here("../src/") },
    ],
  },
  build: { outDir: here("./dist"), emptyOutDir: true },
});
