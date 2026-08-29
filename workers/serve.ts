export interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const tryIndex = path === "/" || path === "" || !path.includes(".");
    const first = tryIndex
      ? new Request(new URL("/index.html", url), request)
      : request;
    let res = await env.ASSETS.fetch(first);
    if (res.status === 404 && request.method === "GET") {
      res = await env.ASSETS.fetch(new Request(new URL("/index.html", url), request));
    }
    return res;
  },
};
