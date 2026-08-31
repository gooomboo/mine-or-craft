/**
 * Cloudflare Pages Function shim.
 * Real signaling lives in workers/index.js so `npx wrangler deploy` works
 * on the Workers dashboard form.
 */
export { onRequest } from "../../workers/index.js";
