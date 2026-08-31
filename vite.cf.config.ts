import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * Cloudflare Pages static SPA. No Nitro, no Vercel, no PGLite, no SSR.
 * Signaling lives in functions/api/rtc.js (Pages Function, in-memory).
 */
export default defineConfig({
  plugins: [tailwindcss(), viteReact()],
  resolve: { tsconfigPaths: true },
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
