import { memo, useEffect, useRef } from "react";
import { atlasTileCanvas, getSharedAtlas } from "@/game/atlas";
import { BLOCKS } from "@/game/blocks";
import { getDef } from "@/game/items";

function hex(n: number) {
  return `#${(n & 0xffffff).toString(16).padStart(6, "0")}`;
}
function shade(color: number, f: number) {
  const r = Math.max(0, Math.min(255, Math.round(((color >> 16) & 255) * f)));
  const g = Math.max(0, Math.min(255, Math.round(((color >> 8) & 255) * f)));
  const b = Math.max(0, Math.min(255, Math.round((color & 255) * f)));
  return (r << 16) | (g << 8) | b;
}

function drawIso(ctx: CanvasRenderingContext2D, size: number, top: HTMLCanvasElement, side: HTMLCanvasElement) {
  const x0 = size / 2;
  const y0 = size * 0.1;
  const hw = size * 0.46;
  const hh = size * 0.24;
  const deep = size * 0.48;
  const topPts: [number, number][] = [
    [x0, y0],
    [x0 + hw, y0 + hh],
    [x0, y0 + hh * 2],
    [x0 - hw, y0 + hh],
  ];
  const leftPts: [number, number][] = [
    [x0 - hw, y0 + hh],
    [x0, y0 + hh * 2],
    [x0, y0 + hh * 2 + deep],
    [x0 - hw, y0 + hh + deep],
  ];
  const rightPts: [number, number][] = [
    [x0 + hw, y0 + hh],
    [x0, y0 + hh * 2],
    [x0, y0 + hh * 2 + deep],
    [x0 + hw, y0 + hh + deep],
  ];
  const face = (pts: [number, number][], img: HTMLCanvasElement, bri: number) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0]![0], pts[0]![1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]![0], pts[i]![1]);
    ctx.closePath();
    ctx.clip();
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const minx = Math.min(...xs);
    const miny = Math.min(...ys);
    ctx.filter = `brightness(${bri})`;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, minx, miny, Math.max(...xs) - minx, Math.max(...ys) - miny);
    ctx.restore();
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = Math.max(1, size / 36);
    ctx.beginPath();
    ctx.moveTo(pts[0]![0], pts[0]![1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]![0], pts[i]![1]);
    ctx.closePath();
    ctx.stroke();
  };
  face(topPts, top, 1.18);
  face(leftPts, side, 0.7);
  face(rightPts, side, 0.92);
}

function p16(draw: (p: (x: number, y: number, c: number) => void) => void) {
  const c = document.createElement("canvas");
  c.width = 16;
  c.height = 16;
  const g = c.getContext("2d")!;
  const p = (x: number, y: number, col: number) => {
    if (x < 0 || y < 0 || x > 15 || y > 15) return;
    g.fillStyle = hex(col);
    g.fillRect(x, y, 1, 1);
  };
  draw(p);
  return c;
}

function drawTool(kind: string, tint: number) {
  const wood = 0x6b4423;
  const woodL = 0x8a6230;
  const t = tint;
  const tl = shade(tint, 1.28);
  const td = shade(tint, 0.68);
  return p16((p) => {
    if (kind === "sword") {
      for (let i = 0; i < 11; i++) {
        p(13 - i, 1 + i, t);
        p(12 - i, 1 + i, tl);
        p(13 - i, 2 + i, td);
      }
      p(5, 10, 0x888888);
      p(6, 9, 0xbbbbbb);
      p(4, 11, 0x666666);
      p(3, 12, woodL);
      p(2, 13, wood);
      p(4, 13, wood);
      p(1, 14, wood);
    } else if (kind === "pickaxe") {
      for (let i = 0; i < 10; i++) {
        p(4 + i, 12 - i, i % 2 ? woodL : wood);
        p(5 + i, 12 - i, wood);
      }
      for (let x = 6; x <= 14; x++) p(x, 2, t);
      p(6, 3, td);
      p(14, 3, td);
      p(7, 1, tl);
      p(13, 1, tl);
      p(10, 1, tl);
    } else if (kind === "axe") {
      for (let i = 0; i < 10; i++) p(4 + i, 12 - i, wood);
      for (let y = 1; y <= 6; y++) {
        p(11, y, t);
        p(12, y, tl);
        p(13, y, td);
      }
      p(10, 2, t);
      p(10, 3, t);
      p(14, 3, td);
    } else if (kind === "shovel") {
      for (let i = 0; i < 10; i++) p(5 + i, 13 - i, wood);
      p(13, 2, t);
      p(12, 2, tl);
      p(13, 3, t);
      p(14, 3, td);
      p(12, 3, t);
      p(13, 1, tl);
    } else if (kind === "hoe") {
      for (let i = 0; i < 10; i++) p(4 + i, 12 - i, wood);
      p(12, 2, t);
      p(13, 2, tl);
      p(14, 2, t);
      p(14, 3, td);
      p(11, 2, t);
    } else if (kind === "bow") {
      for (let i = 0; i < 12; i++) p(3, 2 + i, wood);
      p(4, 2, woodL);
      p(4, 13, woodL);
      for (let i = 0; i < 10; i++) p(5 + (i < 5 ? i : 9 - i), 3 + i, 0xe8e0c8);
    } else if (kind === "food") {
      p(6, 4, t);
      p(7, 3, tl);
      p(8, 3, tl);
      p(9, 4, t);
      for (let y = 5; y <= 11; y++) for (let x = 5; x <= 10; x++) p(x, y, y < 7 ? tl : t);
      p(7, 2, 0x3d7a32);
      p(8, 1, 0x3d7a32);
      p(6, 12, td);
      p(9, 12, td);
    } else if (kind === "pearl") {
      for (let y = 4; y <= 11; y++) for (let x = 4; x <= 11; x++) {
        const d = Math.hypot(x - 7.5, y - 7.5);
        if (d < 4.2) p(x, y, d < 2 ? tl : d < 3.2 ? t : td);
      }
    } else if (kind === "bucket") {
      for (let y = 6; y <= 13; y++) for (let x = 4; x <= 11; x++) p(x, y, 0x8a8a8a);
      for (let y = 7; y <= 12; y++) for (let x = 5; x <= 10; x++) p(x, y, t);
      p(4, 5, 0xbbbbbb);
      p(11, 5, 0xbbbbbb);
      p(5, 5, 0x888888);
      p(10, 5, 0x888888);
    } else if (kind === "armor") {
      for (let y = 3; y <= 12; y++) for (let x = 4; x <= 11; x++) p(x, y, t);
      p(5, 4, tl);
      p(10, 4, tl);
      p(6, 8, td);
      p(9, 8, td);
      p(7, 2, t);
      p(8, 2, t);
    } else if (kind === "boat") {
      for (let x = 2; x <= 13; x++) p(x, 11, t);
      for (let x = 3; x <= 12; x++) p(x, 12, td);
      p(2, 10, tl);
      p(13, 10, tl);
      for (let y = 8; y <= 10; y++) {
        p(2, y, t);
        p(13, y, t);
      }
      p(7, 7, wood);
      p(7, 6, woodL);
      p(7, 5, wood);
    } else if (kind === "potion") {
      for (let y = 8; y <= 14; y++) for (let x = 5; x <= 10; x++) p(x, y, t);
      p(6, 7, tl);
      p(9, 7, tl);
      p(7, 4, 0xe8e8e8);
      p(8, 4, 0xe8e8e8);
      p(7, 5, 0xc8c8c8);
      p(8, 5, 0xc8c8c8);
      p(6, 6, 0xe8e8e8);
      p(9, 6, 0xe8e8e8);
    } else if (kind === "elytra") {
      for (let i = 0; i < 8; i++) {
        p(3, 4 + i, t);
        p(12, 4 + i, t);
        p(4 + (i < 4 ? i : 7 - i), 5 + i, tl);
        p(11 - (i < 4 ? i : 7 - i), 5 + i, td);
      }
    } else {
      for (let y = 4; y <= 11; y++) for (let x = 5; x <= 10; x++) p(x, y, (x + y) % 2 ? t : tl);
      p(7, 3, tl);
      p(8, 3, tl);
      p(6, 12, td);
      p(9, 12, td);
    }
  });
}

function drawItem(canvas: HTMLCanvasElement, id: number, size: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, size, size);
  ctx.imageSmoothingEnabled = false;
  const def = getDef(id);
  const block = id > 0 && id < 10000 ? BLOCKS[id] : null;
  if (block) {
    try {
      const atlas = getSharedAtlas();
      const top = atlasTileCanvas(atlas.tileOf(id, 1));
      const side = atlasTileCanvas(atlas.tileOf(id, 0));
      if (block.shape === "cross") {
        ctx.drawImage(top, 0, 0, size, size);
        return;
      }
      drawIso(ctx, size, top, side);
      return;
    } catch {
      /* fall through */
    }
  }
  const tint = def?.tint ?? 0x888888;
  let kind = "gem";
  const key = "key" in (def ?? {}) ? String((def as { key?: string }).key ?? "") : "";
  if (def?.tool) kind = def.tool;
  else if (def?.slot) kind = "armor";
  else if (def?.food) kind = "food";
  else if (def?.place === 6 || def?.place === 7 || key.includes("bucket")) kind = "bucket";
  else if (key.includes("pearl") || key.includes("eye")) kind = "pearl";
  else if (key.includes("bow")) kind = "bow";
  else if (key.includes("boat") || key.includes("raft")) kind = "boat";
  else if (key.includes("elytra")) kind = "elytra";
  else if (key.includes("potion") || key.includes("bottle") || key.includes("stew") || key.includes("soup")) kind = "potion";
  const sprite = drawTool(kind, tint);
  ctx.drawImage(sprite, 0, 0, size, size);
}

const IconCanvas = memo(function IconCanvas({ id, size }: { id: number; size: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.width = size;
    c.height = size;
    drawItem(c, id, size);
  }, [id, size]);
  return <canvas ref={ref} width={size} height={size} className="h-full w-full" style={{ imageRendering: "pixelated" }} />;
});

export const ItemIcon = memo(function ItemIcon({
  id,
  count,
  size = 36,
}: {
  id: number;
  count?: number;
  size?: number;
}) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <IconCanvas id={id} size={size} />
      {count != null && count > 1 && (
        <span className="hud-num absolute right-0 bottom-0 text-[11px] font-semibold leading-none text-fg drop-shadow-[1px_1px_0_#000]">
          {count}
        </span>
      )}
    </div>
  );
});
