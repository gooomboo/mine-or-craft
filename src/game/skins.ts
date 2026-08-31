export const SKIN_PRESETS = [
  { id: "steve", name: "Steve", shirt: "#3a78c8", pants: "#3a4a8a", skin: "#e0c090", hair: "#3a2a18" },
  { id: "alex", name: "Alex", shirt: "#6aaa3a", pants: "#6b4a28", skin: "#f0c8a0", hair: "#d87828" },
  { id: "noor", name: "Noor", shirt: "#c45c4a", pants: "#2a2a32", skin: "#8a5530", hair: "#1a1a14" },
  { id: "sunny", name: "Sunny", shirt: "#e0a018", pants: "#3a6a8a", skin: "#f0d0a8", hair: "#6b3a18" },
  { id: "ari", name: "Ari", shirt: "#7a48a8", pants: "#2a2a32", skin: "#c89060", hair: "#2a1a10" },
  { id: "zuri", name: "Zuri", shirt: "#2a8a7a", pants: "#3a2a28", skin: "#6b3a20", hair: "#1a0a08" },
  { id: "pale", name: "Pale", shirt: "#3a3a42", pants: "#1a1a1e", skin: "#e8e0d0", hair: "#f0f0e8" },
  { id: "creeper", name: "Creeper", shirt: "#4a8a3a", pants: "#3a6a2a", skin: "#5aaa3a", hair: "#2a5a1a" },
  { id: "ender", name: "Ender", shirt: "#1a1a22", pants: "#0a0a14", skin: "#1a1a22", hair: "#0a0a10" },
  { id: "bee", name: "Bee", shirt: "#f0c832", pants: "#1a1a1a", skin: "#f0e0a0", hair: "#1a1a1a" },
] as const;

export type SkinPart = "head" | "body" | "armL" | "armR" | "legL" | "legR";
export type SkinFace = "front" | "back" | "left" | "right" | "top" | "bottom";

export const SKIN_PARTS: SkinPart[] = ["head", "body", "armL", "armR", "legL", "legR"];
export const SKIN_FACES: SkinFace[] = ["front", "back", "left", "right", "top", "bottom"];

export const PART_SIZE: Record<SkinPart, { w: number; h: number }> = {
  head: { w: 8, h: 8 },
  body: { w: 8, h: 12 },
  armL: { w: 4, h: 12 },
  armR: { w: 4, h: 12 },
  legL: { w: 4, h: 12 },
  legR: { w: 4, h: 12 },
};

export type SkinPixels = Record<string, number[]>;

export interface SkinData {
  id: string;
  name: string;
  shirt: string;
  pants: string;
  skin: string;
  hair: string;
  pixels?: SkinPixels;
}

export function faceKey(part: SkinPart, face: SkinFace) {
  return `${part}:${face}`;
}

export function hexToNum(s: string) {
  const n = parseInt(String(s).replace("#", ""), 16);
  return Number.isFinite(n) ? n : 0xc68642;
}

export function numToHex(n: number) {
  return `#${(n & 0xffffff).toString(16).padStart(6, "0")}`;
}

export function shadeNum(n: number, f: number) {
  const r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 255) * f)));
  const g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 255) * f)));
  const b = Math.max(0, Math.min(255, Math.round((n & 255) * f)));
  return (r << 16) | (g << 8) | b;
}

function fillFace(w: number, h: number, color: number) {
  return Array.from({ length: w * h }, () => color);
}

function px(arr: number[], w: number, x: number, y: number, c: number) {
  if (x < 0 || y < 0 || x >= w) return;
  const i = y * w + x;
  if (i >= 0 && i < arr.length) arr[i] = c;
}

export function generateDefaultPixels(base: { shirt: string; pants: string; skin: string; hair: string; id?: string }): SkinPixels {
  const skin = hexToNum(base.skin);
  const hair = hexToNum(base.hair);
  const shirt = hexToNum(base.shirt);
  const pants = hexToNum(base.pants);
  const shoe = 0x1a1a1a;
  const eyeW = 0xf4f0e8;
  const eyeP = base.id === "ender" ? 0xc45ce6 : 0x1a1a22;
  const out: SkinPixels = {};

  for (const part of SKIN_PARTS) {
    const { w, h } = PART_SIZE[part];
    for (const face of SKIN_FACES) {
      let col = skin;
      if (part === "head") col = face === "top" || face === "back" ? hair : skin;
      else if (part === "body" || part === "armL" || part === "armR") col = shirt;
      else col = pants;
      if (face === "left" || face === "bottom") col = shadeNum(col, 0.72);
      if (face === "right") col = shadeNum(col, 0.88);
      if (face === "back") col = shadeNum(col, 0.82);
      const arr = fillFace(w, h, col);

      if (part === "head" && (face === "top" || face === "back")) {
        for (let i = 0; i < arr.length; i++) arr[i] = hair;
      }
      if (part === "head" && face === "front") {
        for (let y = 0; y < 3; y++) for (let x = 0; x < w; x++) px(arr, w, x, y, hair);
        px(arr, w, 1, 3, eyeW);
        px(arr, w, 2, 3, eyeP);
        px(arr, w, 5, 3, eyeW);
        px(arr, w, 6, 3, eyeP);
        px(arr, w, 1, 4, eyeW);
        px(arr, w, 5, 4, eyeW);
        px(arr, w, 3, 6, 0x8a5040);
        px(arr, w, 4, 6, 0x8a5040);
        if (base.id === "creeper") {
          for (let y = 3; y <= 6; y++) for (let x = 2; x <= 5; x++) px(arr, w, x, y, 0x1a1a1a);
          px(arr, w, 2, 3, 0x1a1a1a);
          px(arr, w, 5, 3, 0x1a1a1a);
          px(arr, w, 3, 5, 0x5aaa3a);
          px(arr, w, 4, 5, 0x5aaa3a);
        }
        if (base.id === "ender") {
          px(arr, w, 2, 3, 0xc45ce6);
          px(arr, w, 5, 3, 0xc45ce6);
        }
        if (base.id === "bee") {
          for (let y = 0; y < 3; y++) for (let x = 0; x < w; x++) px(arr, w, x, y, 0x1a1a1a);
        }
      }
      if ((part === "armL" || part === "armR") && face === "front") {
        for (let y = 8; y < h; y++) for (let x = 0; x < w; x++) px(arr, w, x, y, skin);
      }
      if ((part === "legL" || part === "legR") && (face === "front" || face === "back")) {
        for (let y = h - 2; y < h; y++) for (let x = 0; x < w; x++) px(arr, w, x, y, shoe);
      }
      if (part === "body" && face === "front") {
        px(arr, w, 2, 4, shadeNum(shirt, 1.15));
        px(arr, w, 5, 4, shadeNum(shirt, 1.15));
        if (base.id === "bee") {
          for (let y = 0; y < h; y++) {
            const stripe = Math.floor(y / 3) % 2 === 0 ? 0xf0c832 : 0x1a1a1a;
            for (let x = 0; x < w; x++) px(arr, w, x, y, stripe);
          }
        }
      }
      out[faceKey(part, face)] = arr;
    }
  }
  return out;
}

export function withPixels(s: SkinData): SkinData {
  if (s.pixels && Object.keys(s.pixels).length > 10) return s;
  return { ...s, pixels: generateDefaultPixels(s) };
}

export function getFace(pixels: SkinPixels | undefined, part: SkinPart, face: SkinFace): number[] {
  const { w, h } = PART_SIZE[part];
  const arr = pixels?.[faceKey(part, face)];
  if (arr && arr.length === w * h) return arr;
  return fillFace(w, h, 0xc68642);
}

export function setFacePixel(pixels: SkinPixels, part: SkinPart, face: SkinFace, x: number, y: number, color: number) {
  const { w, h } = PART_SIZE[part];
  const key = faceKey(part, face);
  const arr = (pixels[key] ?? fillFace(w, h, 0xc68642)).slice();
  if (x >= 0 && y >= 0 && x < w && y < h) arr[y * w + x] = color;
  pixels[key] = arr;
}

export function floodFace(pixels: SkinPixels, part: SkinPart, face: SkinFace, x: number, y: number, color: number) {
  const { w, h } = PART_SIZE[part];
  const arr = getFace(pixels, part, face).slice();
  const start = y * w + x;
  if (start < 0 || start >= arr.length) return;
  const target = arr[start]!;
  if (target === color) return;
  const stack = [start];
  while (stack.length) {
    const i = stack.pop()!;
    if (arr[i] !== target) continue;
    arr[i] = color;
    const px = i % w;
    const py = (i / w) | 0;
    if (px > 0) stack.push(i - 1);
    if (px < w - 1) stack.push(i + 1);
    if (py > 0) stack.push(i - w);
    if (py < h - 1) stack.push(i + w);
  }
  pixels[faceKey(part, face)] = arr;
}

export function drawSkinPreview(ctx: CanvasRenderingContext2D, skin: SkinData, dw: number, dh: number) {
  const s = withPixels(skin);
  const px = s.pixels!;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, dw, dh);
  const cell = Math.max(1, Math.floor(Math.min(dw / 16, dh / 32)));
  const ox = Math.floor((dw - 16 * cell) / 2);
  const oy = Math.floor((dh - 32 * cell) / 2);
  const blit = (part: SkinPart, face: SkinFace, dx: number, dy: number, mirror = false) => {
    const { w, h } = PART_SIZE[part];
    const arr = getFace(px, part, face);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const sx = mirror ? w - 1 - x : x;
        const c = arr[y * w + sx] ?? 0;
        ctx.fillStyle = numToHex(c);
        ctx.fillRect(ox + (dx + x) * cell, oy + (dy + y) * cell, cell, cell);
      }
    }
  };
  blit("head", "front", 4, 0, true);
  blit("armR", "front", 0, 8, true);
  blit("body", "front", 4, 8, true);
  blit("armL", "front", 12, 8, true);
  blit("legR", "front", 4, 20, true);
  blit("legL", "front", 8, 20, true);
}

export const SKIN_PALETTE = [
  0x1a1a1a, 0x3a3a3a, 0x7a7a7a, 0xc8c8c8, 0xf4f0e8, 0xe0c090, 0xf0c8a0, 0x8a5530, 0x6b3a18, 0x3a2a18, 0x8a5040,
  0x3a78c8, 0x3a4a8a, 0x6aaa3a, 0x3d7a32, 0xc45c4a, 0xe0a018, 0xf0c832, 0x7a48a8, 0x2a8a7a, 0x5adce6, 0xc45ce6,
  0x1a1a22, 0x4a8a3a, 0xd87828, 0xe8e0d0, 0x6b4a28, 0xc89060,
];

export function skinToJSON(s: SkinData): string {
  return JSON.stringify(s);
}

export function skinFromJSON(raw: string): SkinData | null {
  try {
    const o = JSON.parse(raw) as SkinData;
    if (!o || typeof o.shirt !== "string") return null;
    return o;
  } catch {
    return null;
  }
}

export function loadCustomSkins(): SkinData[] {
  try {
    const raw = localStorage.getItem("moc.skins.v1");
    return raw ? (JSON.parse(raw) as SkinData[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomSkins(list: SkinData[]) {
  try {
    localStorage.setItem("moc.skins.v1", JSON.stringify(list));
  } catch {
    /* */
  }
}

export function resolveSkin(id: string): SkinData {
  const preset = SKIN_PRESETS.find((s) => s.id === id);
  if (preset) return withPixels({ id: preset.id, name: preset.name, shirt: preset.shirt, pants: preset.pants, skin: preset.skin, hair: preset.hair });
  try {
    const live = localStorage.getItem("moc.skin.live");
    if (id === "live" && live) return withPixels(JSON.parse(live) as SkinData);
  } catch {
    /* */
  }
  const custom = loadCustomSkins().find((s) => s.id === id);
  if (custom) return withPixels(custom);
  try {
    const market = loadMarket().find((s) => s.id === id);
    if (market) return withPixels(market);
  } catch {
    /* */
  }
  const first = SKIN_PRESETS[0]!;
  return withPixels({ id: first.id, name: first.name, shirt: first.shirt, pants: first.pants, skin: first.skin, hair: first.hair });
}

export function saveLiveSkin(s: SkinData) {
  try {
    localStorage.setItem("moc.skin.live", JSON.stringify({ ...s, id: "live" }));
  } catch {
    /* */
  }
}

export interface MarketSkin extends SkinData {
  seller: string;
  price: number;
}

const MARKET_KEY = "moc.market.v1";

export function loadMarket(): MarketSkin[] {
  try {
    const raw = localStorage.getItem(MARKET_KEY);
    return raw ? (JSON.parse(raw) as MarketSkin[]) : [];
  } catch {
    return [];
  }
}

export function saveMarket(list: MarketSkin[]) {
  try {
    localStorage.setItem(MARKET_KEY, JSON.stringify(list));
  } catch {
    /* */
  }
}

export function scanSkinSafe(skin: SkinData): { ok: boolean; msg: string } {
  const data = withPixels(skin);
  const px = data.pixels ?? {};
  const skinTone = hexToNum(data.skin);
  const isSkinish = (c: number) => {
    const r = (c >> 16) & 255;
    const g = (c >> 8) & 255;
    const b = c & 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    const pink = r > 140 && g > 40 && g < 170 && b > 40 && b < 170 && r > g + 20 && r > b;
    const flesh = r > 90 && g > 50 && b > 30 && r >= g && g >= b - 20 && sat < 0.65 && r - b > 20;
    return pink || flesh;
  };
  const body = px["body:front"] ?? [];
  if (body.length >= 8 * 12) {
    let skinCount = 0;
    let hot = 0;
    let clothed = 0;
    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 8; x++) {
        const c = body[y * 8 + x] ?? 0;
        if (isSkinish(c) || Math.abs(c - skinTone) < 0x202020) skinCount++;
        else clothed++;
        if (y >= 8 && x >= 2 && x <= 5 && isSkinish(c)) {
          const r = (c >> 16) & 255;
          const g = (c >> 8) & 255;
          if (r > 160 && g < 120) hot++;
        }
      }
    }
    const nude = skinCount > clothed * 1.4 && skinCount > 48;
    if (hot >= 6 || nude) {
      return { ok: false, msg: "Safety scan blocked this skin. Keep it family-friendly." };
    }
  }
  const legs = (px["legL:front"] ?? []).concat(px["legR:front"] ?? []);
  let legHot = 0;
  for (const c of legs) {
    const r = (c >> 16) & 255;
    const g = (c >> 8) & 255;
    const b = c & 255;
    if (r > 180 && g < 110 && b < 130) legHot++;
  }
  if (legHot > 18) return { ok: false, msg: "Safety scan blocked this skin. Keep it family-friendly." };
  return { ok: true, msg: "Scan passed." };
}

export function publishSkin(skin: SkinData, seller: string, price: number): { ok: boolean; msg: string } {
  const scan = scanSkinSafe(skin);
  if (!scan.ok) return scan;
  const list = loadMarket();
  const id = `m-${Date.now()}`;
  const p = Math.max(10, Math.min(5000, Math.floor(price) || 50));
  list.unshift({ ...withPixels(skin), id, name: skin.name || "Custom", seller, price: p });
  saveMarket(list.slice(0, 40));
  return { ok: true, msg: `Listed for ${p} XP.` };
}

export function buyMarketSkin(
  id: string,
  buyer: string,
  xp: number,
): { ok: boolean; msg: string; cost: number; seller: string; skin?: MarketSkin } {
  const list = loadMarket();
  const item = list.find((s) => s.id === id);
  if (!item) return { ok: false, msg: "Skin gone.", cost: 0, seller: "" };
  if (item.seller.toLowerCase() === buyer.toLowerCase()) return { ok: false, msg: "That's your listing.", cost: 0, seller: item.seller };
  if (xp < item.price) return { ok: false, msg: `Need ${item.price} XP.`, cost: 0, seller: item.seller };
  return { ok: true, msg: `Bought ${item.name}.`, cost: item.price, seller: item.seller, skin: item };
}

export function searchSkins(query: string): SkinData[] {
  const q = query.trim().toLowerCase();
  const list: SkinData[] = [];
  for (const p of SKIN_PRESETS) list.push(withPixels({ id: p.id, name: p.name, shirt: p.shirt, pants: p.pants, skin: p.skin, hair: p.hair }));
  for (const c of loadCustomSkins()) list.push(withPixels(c));
  for (const m of loadMarket()) list.push(withPixels(m));
  if (!q) return list;
  return list.filter((s) => `${s.name} ${s.id}`.toLowerCase().includes(q));
}
