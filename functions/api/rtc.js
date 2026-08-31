/**
 * Cloudflare Pages Function for WebRTC signaling.
 * In-memory only — no Postgres, no PGLite, no Node fs.
 * Host + joiners must hit the same isolate (same region, within ~30s).
 * This is the piece that makes Online work after you connect the GitHub repo
 * to Cloudflare Pages. Do not import the rest of the app from here.
 */

const rooms = globalThis.__mocRooms ?? (globalThis.__mocRooms = new Map());

function getRoom(id) {
  let r = rooms.get(id);
  if (!r) {
    r = { peers: new Map(), signals: [], nextId: 1 };
    rooms.set(id, r);
  }
  return r;
}

function prune(r, now) {
  for (const [id, p] of r.peers) {
    if (now - p.at > 30_000) r.peers.delete(id);
  }
  r.signals = r.signals.filter((s) => now - s.at < 60_000).slice(-400);
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
}

const ID = /^[a-zA-Z0-9_-]{1,64}$/;

export async function onRequest(context) {
  const req = context.request;
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,POST,OPTIONS",
        "access-control-allow-headers": "content-type",
      },
    });
  }
  const now = Date.now();
  try {
    if (req.method === "GET") {
      const url = new URL(req.url);
      const room = url.searchParams.get("room") || "";
      const peer = url.searchParams.get("peer") || "";
      const name = (url.searchParams.get("name") || "").slice(0, 64);
      const since = Number(url.searchParams.get("since") || 0) || 0;
      if (!ID.test(room) || !ID.test(peer)) return json({ error: "invalid query" }, 400);
      const r = getRoom(room);
      prune(r, now);
      r.peers.set(peer, { id: peer, name, at: now });
      return json({
        peers: [...r.peers.values()].map((p) => ({ id: p.id, name: p.name })),
        signals: r.signals
          .filter((s) => s.to === peer && s.id > since)
          .slice(0, 200)
          .map((s) => ({ id: s.id, from: s.from, kind: s.kind, payload: s.payload })),
      });
    }
    if (req.method === "POST") {
      const body = await req.json();
      if (body?.op === "leave") {
        const r = rooms.get(body.room);
        if (r) r.peers.delete(body.peer);
        return json({ ok: true });
      }
      if (body?.op === "signal") {
        if (!ID.test(body.room || "") || !ID.test(body.from || "") || !ID.test(body.to || "")) {
          return json({ error: "invalid request" }, 400);
        }
        const r = getRoom(body.room);
        r.signals.push({
          id: r.nextId++,
          from: body.from,
          to: body.to,
          kind: body.kind,
          payload: body.payload,
          at: now,
        });
        return json({ ok: true });
      }
      return json({ error: "invalid request" }, 400);
    }
    return json({ error: "method not allowed" }, 405);
  } catch {
    return json({ error: "signaling failed" }, 500);
  }
}
