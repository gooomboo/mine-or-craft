/**
 * WebRTC signaling for Mine or Craft lobbies.
 * One Durable Object per room — same /api/rtc contract as the client.
 */

export interface Env {
  ROOMS: DurableObjectNamespace;
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

const ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;
const PEER_TTL_MS = 30_000;
const SIGNAL_TTL_MS = 60_000;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

type Peer = { name: string; lastSeen: number };
type Signal = {
  id: number;
  to: string;
  from: string;
  kind: string;
  payload: unknown;
  created: number;
};

export class SignalingRoom {
  peers = new Map<string, Peer>();
  signals: Signal[] = [];
  nextId = 1;

  constructor(
    readonly ctx: DurableObjectState,
    readonly env: Env,
  ) {}

  private prune(now: number) {
    for (const [id, p] of this.peers) {
      if (now - p.lastSeen > PEER_TTL_MS) this.peers.delete(id);
    }
    this.signals = this.signals.filter((s) => now - s.created < SIGNAL_TTL_MS);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const now = Date.now();
    this.prune(now);

    if (request.method === "GET") {
      const peer = url.searchParams.get("peer") ?? "";
      const name = (url.searchParams.get("name") ?? "").slice(0, 64);
      const since = Number(url.searchParams.get("since") ?? 0);
      if (!ID_RE.test(peer)) return json({ error: "invalid query" }, 400);
      this.peers.set(peer, { name, lastSeen: now });
      const inbox = this.signals.filter((s) => s.to === peer && s.id > since).slice(0, 200);
      return json({
        peers: [...this.peers.entries()].map(([id, p]) => ({ id, name: p.name })),
        signals: inbox.map((s) => ({
          id: s.id,
          from: s.from,
          kind: s.kind,
          payload: s.payload,
        })),
      });
    }

    if (request.method === "POST") {
      let body: {
        op?: string;
        room?: string;
        from?: string;
        to?: string;
        peer?: string;
        kind?: string;
        payload?: unknown;
      };
      try {
        body = (await request.json()) as typeof body;
      } catch {
        return json({ error: "invalid JSON" }, 400);
      }
      if (body.op === "signal") {
        const from = body.from ?? "";
        const to = body.to ?? "";
        const kind = body.kind ?? "";
        if (!ID_RE.test(from) || !ID_RE.test(to) || !["offer", "answer", "ice"].includes(kind)) {
          return json({ error: "invalid request" }, 400);
        }
        this.signals.push({
          id: this.nextId++,
          to,
          from,
          kind,
          payload: body.payload,
          created: now,
        });
      } else if (body.op === "leave") {
        const peer = body.peer ?? "";
        if (ID_RE.test(peer)) this.peers.delete(peer);
      } else {
        return json({ error: "invalid request" }, 400);
      }
      return json({ ok: true });
    }

    return json({ error: "method not allowed" }, 405);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== "/api/rtc") {
      return env.ASSETS.fetch(request);
    }

    let room = url.searchParams.get("room");
    if (request.method === "GET") {
      if (!room || !ID_RE.test(room)) return json({ error: "invalid query" }, 400);
      const stub = env.ROOMS.get(env.ROOMS.idFromName(room));
      return stub.fetch(request);
    }

    if (request.method === "POST") {
      let body: { room?: string };
      try {
        body = (await request.json()) as { room?: string };
      } catch {
        return json({ error: "invalid JSON" }, 400);
      }
      room = body.room ?? "";
      if (!ID_RE.test(room)) return json({ error: "invalid request" }, 400);
      const stub = env.ROOMS.get(env.ROOMS.idFromName(room));
      return stub.fetch(
        new Request(request.url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }),
      );
    }

    return json({ error: "method not allowed" }, 405);
  },
};
