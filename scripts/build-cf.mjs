#!/usr/bin/env node
/**
 * Cloudflare-safe static build for `npx wrangler deploy`.
 * - Does NOT run db:migrate
 * - Does NOT use the Vercel nitro preset
 * - Does NOT need DATABASE_URL
 * Output: dist/client/index.html + assets.
 * wrangler.jsonc then ships dist/client as Worker static assets.
 */
import { spawnSync } from "node:child_process";
import { existsSync, renameSync, writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: "inherit", env: { ...process.env, CF_PAGES: "1" } });
  if (r.status) process.exit(r.status ?? 1);
}

const esbuildInstall = join(root, "node_modules/esbuild/install.js");
if (existsSync(esbuildInstall)) {
  spawnSync(process.execPath, [esbuildInstall], { stdio: "inherit" });
}

run(process.execPath, [
  join(root, "node_modules/vite/bin/vite.js"),
  "build",
  "--config",
  "vite.cf.config.ts",
]);

const out = join(root, "dist/client");
mkdirSync(out, { recursive: true });
const from = join(out, "cf-index.html");
const to = join(out, "index.html");
if (existsSync(from)) renameSync(from, to);

if (!existsSync(to)) {
  console.error("[build:cf] dist/client/index.html is missing. Cloudflare would 404.");
  process.exit(1);
}

let html = readFileSync(to, "utf8");
html = html.replaceAll("cf-index.html", "index.html");
writeFileSync(to, html);

const redirects = join(out, "_redirects");
if (!existsSync(redirects)) {
  writeFileSync(redirects, "/api/* /api/:splat 200\n/* /index.html 200\n");
}

console.log("[build:cf] static SPA ready at dist/client");
