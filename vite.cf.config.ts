import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const root = path.dirname(fileURLToPath(import.meta.url));

/**
 * Cloudflare static SPA. No Nitro, no Vercel, no PGLite, no SSR.
 * Signaling lives in workers/index.js (Worker + /api/rtc).
 */
export default defineConfig({
  plugins: [tailwindcss(), viteReact()],
  resolve: {
    alias: {
      "@": path.join(root, "src"),
    },
  },
  publicDir: "public",
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: "cf-index.html",
    },
  },
});
