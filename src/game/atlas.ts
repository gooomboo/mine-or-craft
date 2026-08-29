import * as THREE from "three";
import { BLOCKS, BLOCK_COUNT, FIRE, GRASS, LAVA, WATER } from "./blocks";

export const TILE = 16;
export const ATLAS_TILES = 32;
export const ATLAS_SIZE = TILE * ATLAS_TILES;

export interface Atlas {
  texture: THREE.CanvasTexture;
  canvas: HTMLCanvasElement;
  uv(tile: number): { u0: number; v0: number; u1: number; v1: number };
  tileOf(id: number, face: 0 | 1 | 2): number;
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, c: string) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, 1, 1);
}

function hex(n: number): string {
  return `#${(n & 0xffffff).toString(16).padStart(6, "0")}`;
}

function shade(color: number, f: number): number {
  const r = Math.max(0, Math.min(255, Math.round(((color >> 16) & 255) * f)));
  const g = Math.max(0, Math.min(255, Math.round(((color >> 8) & 255) * f)));
  const b = Math.max(0, Math.min(255, Math.round((color & 255) * f)));
  return (r << 16) | (g << 8) | b;
}

function mix(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

function hash(n: number): number {
  n |= 0;
  n = Math.imul(n ^ (n >>> 16), 2246822519);
  n = Math.imul(n ^ (n >>> 13), 3266489917);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function noiseTile(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  base: number,
  variation = 0.18,
  seed = 1,
) {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const n = hash(x * 113 + y * 91 + seed * 17);
      const f = 1 - variation / 2 + n * variation;
      px(ctx, ox + x, oy + y, hex(shade(base, f)));
    }
  }
}

function speckles(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  color: number,
  density: number,
  seed: number,
) {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      if (hash(x * 73 + y * 41 + seed * 9) < density) {
        px(ctx, ox + x, oy + y, hex(color));
      }
    }
  }
}

function stripes(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  c1: number,
  c2: number,
  seed: number,
  vertical = false,
) {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const k = vertical ? x : y;
      const band = Math.floor(k / 2 + hash(seed + k) * 0.4);
      const n = hash(x * 13 + y * 29 + seed);
      const c = band % 2 === 0 ? c1 : c2;
      px(ctx, ox + x, oy + y, hex(shade(c, 0.92 + n * 0.16)));
    }
  }
}

function blades(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  base: number,
  seed: number,
) {
  // Dense turf with height variation so grass tops read as blades, not noise.
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const n = hash(x * 19 + y * 47 + seed * 11);
      const row = 0.78 + (y / TILE) * 0.22;
      const c = shade(mix(base, 0x2e6a1c, n * 0.35), row + n * 0.12);
      px(ctx, ox + x, oy + y, hex(c));
    }
  }
  for (let i = 0; i < 28; i++) {
    const x = Math.floor(hash(seed * 3 + i) * TILE);
    const h = 3 + Math.floor(hash(seed * 7 + i * 3) * 6);
    const tip = hash(i * 13 + seed) > 0.5 ? shade(base, 1.28) : shade(base, 0.72);
    for (let k = 0; k < h; k++) {
      const yy = (Math.floor(hash(seed + i * 5) * TILE) + k) % TILE;
      const sway = Math.floor(hash(i + k * 9) * 3) - 1;
      px(ctx, ox + ((x + sway + TILE) % TILE), oy + yy, hex(tip));
    }
  }
}

function ore(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  stone: number,
  fleck: number,
  seed: number,
) {
  noiseTile(ctx, ox, oy, stone, 0.16, seed);
  speckles(ctx, ox, oy, fleck, 0.12, seed + 3);
  speckles(ctx, ox, oy, shade(fleck, 1.25), 0.05, seed + 9);
}

function bricks(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  color: number,
  seed: number,
) {
  ctx.fillStyle = hex(shade(color, 0.55));
  ctx.fillRect(ox, oy, TILE, TILE);
  const mortar = hex(shade(color, 0.4));
  for (let row = 0; row < 4; row++) {
    const y = row * 4;
    for (let x = 0; x < TILE; x++) px(ctx, ox + x, oy + y, mortar);
    const off = row % 2 === 0 ? 0 : 8;
    for (let col = 0; col < 2; col++) {
      const x = (col * 8 + off) % TILE;
      for (let yy = 0; yy < 4; yy++) px(ctx, ox + x, oy + y + yy, mortar);
    }
    for (let yy = 1; yy < 4; yy++) {
      for (let xx = 0; xx < TILE; xx++) {
        if (hash(xx + yy * 16 + row * 40 + seed) > 0.12) {
          px(ctx, ox + xx, oy + y + yy, hex(shade(color, 0.9 + hash(xx * 3 + seed) * 0.2)));
        }
      }
    }
  }
}

function waterFrame(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  color: number,
  t: number,
) {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const w =
        Math.sin((x + t * 4.2) * 0.55) * 0.45 +
        Math.sin((y * 1.15 + t * 2.6) * 0.7) * 0.35 +
        Math.sin((x * 0.4 + y * 0.6 + t) * 0.9) * 0.2;
      const foam = w > 0.72 ? 0.28 : w > 0.45 ? 0.08 : 0;
      const n = 0.72 + w * 0.22;
      const deep = mix(color, 0x0a2a48, 0.25);
      px(ctx, ox + x, oy + y, hex(shade(mix(deep, 0xb8e4ff, foam), n)));
    }
  }
}

function fireFrame(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  t: number,
) {
  ctx.clearRect(ox, oy, TILE, TILE);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const heat = 1 - y / TILE;
      const wave = Math.sin(x * 0.9 + t * 6 + y * 0.2) * 0.15;
      const flicker = hash(x * 9 + Math.floor(t * 10) * 17 + y) * 0.55 + 0.45;
      const v = heat * flicker + wave;
      if (v < 0.18) continue;
      const c =
        v > 0.82 ? 0xfff6c8 : v > 0.62 ? 0xffd060 : v > 0.42 ? 0xff8a20 : v > 0.28 ? 0xe04810 : 0x7a1808;
      px(ctx, ox + x, oy + y, hex(c));
    }
  }
}

function grassSide(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  dirt: number,
  grass: number,
) {
  noiseTile(ctx, ox, oy, dirt, 0.2, 11);
  speckles(ctx, ox, oy, shade(dirt, 0.7), 0.08, 12);
  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < TILE; x++) {
      const n = hash(x * 19 + y * 7);
      const fringe = 3 + Math.floor(hash(x * 31) * 4);
      if (y < fringe && (y === 0 || n > 0.18 + y * 0.1)) {
        const blade = mix(grass, 0x3d7a28, n * 0.4);
        px(ctx, ox + x, oy + y, hex(shade(blade, 0.92 + n * 0.22)));
      }
    }
  }
}

function logSide(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  bark: number,
  seed: number,
) {
  stripes(ctx, ox, oy, bark, shade(bark, 0.75), seed, true);
  speckles(ctx, ox, oy, shade(bark, 0.55), 0.08, seed);
}

function logTop(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  inner: number,
) {
  noiseTile(ctx, ox, oy, inner, 0.1, 4);
  ctx.strokeStyle = hex(shade(inner, 0.6));
  ctx.lineWidth = 1;
  ctx.strokeRect(ox + 1, oy + 1, TILE - 3, TILE - 3);
  ctx.strokeRect(ox + 4, oy + 4, TILE - 9, TILE - 9);
}

function leaves(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  color: number,
  seed: number,
) {
  ctx.clearRect(ox, oy, TILE, TILE);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const n = hash(x * 17 + y * 29 + seed);
      if (n < 0.28) continue;
      px(ctx, ox + x, oy + y, hex(shade(color, 0.75 + n * 0.4)));
    }
  }
}

function plant(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  color: number,
  seed: number,
) {
  ctx.clearRect(ox, oy, TILE, TILE);
  const stem = shade(color, 0.62);
  const leaf = shade(color, 1.05);
  const dark = shade(color, 0.75);
  // Stem with a slight sway
  for (let y = 2; y < TILE; y++) {
    const sway = y > 8 ? Math.floor((y - 8) / 4) : 0;
    px(ctx, ox + 7 + sway, oy + y, hex(stem));
    px(ctx, ox + 8 + sway, oy + y, hex(shade(stem, 1.15)));
  }
  // Paired leaves along the stem
  for (let i = 0; i < 5; i++) {
    const y = 4 + i * 2;
    const len = 3 + (i % 2);
    for (let k = 1; k <= len; k++) {
      px(ctx, ox + 7 - k, oy + y - Math.floor(k / 2), hex(k === len ? leaf : dark));
      px(ctx, ox + 8 + k, oy + y + 1 - Math.floor(k / 2), hex(k === len ? leaf : dark));
    }
  }
  // Flower / seed head
  const head = hash(seed) > 0.45 ? 0xe8d84a : hash(seed * 3) > 0.5 ? 0xe07090 : leaf;
  px(ctx, ox + 7, oy + 1, hex(head));
  px(ctx, ox + 8, oy + 1, hex(head));
  px(ctx, ox + 6, oy + 2, hex(shade(head, 0.85)));
  px(ctx, ox + 9, oy + 2, hex(shade(head, 0.85)));
  px(ctx, ox + 7, oy + 2, hex(shade(head, 1.2)));
  px(ctx, ox + 8, oy + 2, hex(shade(head, 1.2)));
}

const PATTERN_COUNT = 48;

function drawPattern(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  pattern: number,
  color: number,
) {
  switch (pattern % PATTERN_COUNT) {
    case 0:
      noiseTile(ctx, ox, oy, color, 0.16, 1);
      break;
    case 1:
      noiseTile(ctx, ox, oy, color, 0.28, 2);
      break;
    case 2:
      stripes(ctx, ox, oy, color, shade(color, 0.7), 3, false);
      break;
    case 3:
      stripes(ctx, ox, oy, color, shade(color, 0.7), 4, true);
      break;
    case 4:
      bricks(ctx, ox, oy, color, 5);
      break;
    case 5:
      ore(ctx, ox, oy, shade(color, 0.85), shade(color, 1.4), 6);
      break;
    case 6:
      blades(ctx, ox, oy, color, 7);
      break;
    case 7:
      leaves(ctx, ox, oy, color, 8);
      break;
    case 8:
      noiseTile(ctx, ox, oy, color, 0.1, 9);
      speckles(ctx, ox, oy, shade(color, 1.3), 0.1, 10);
      break;
    case 9:
      logSide(ctx, ox, oy, color, 11);
      break;
    default: {
      noiseTile(ctx, ox, oy, color, 0.12 + (pattern % 7) * 0.03, pattern);
      if (pattern % 3 === 0) speckles(ctx, ox, oy, shade(color, 0.6), 0.07, pattern);
      if (pattern % 5 === 0) speckles(ctx, ox, oy, shade(color, 1.3), 0.06, pattern + 1);
    }
  }
}

export function createAtlas(): Atlas {
  const canvas = document.createElement("canvas");
  canvas.width = ATLAS_SIZE;
  canvas.height = ATLAS_SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, ATLAS_SIZE, ATLAS_SIZE);

  const special: Record<number, number> = {};
  let next = 0;
  const alloc = (n = 1) => {
    const id = next;
    next += n;
    return id;
  };

  const STONE_T = alloc();
  const DIRT_T = alloc();
  const GRASS_TOP_T = alloc();
  const GRASS_SIDE_T = alloc();
  const SAND_T = alloc();
  const WATER_T = alloc();
  const LAVA_T = alloc();
  const LOG_SIDE_T = alloc();
  const LOG_TOP_T = alloc();
  const LEAVES_T = alloc();
  const COBBLE_T = alloc();
  const PLANKS_T = alloc();
  const BEDROCK_T = alloc();
  const ORE_COAL_T = alloc();
  const ORE_IRON_T = alloc();
  const ORE_GOLD_T = alloc();
  const ORE_DIA_T = alloc();
  const OBSIDIAN_T = alloc();
  const NETHERRACK_T = alloc();
  const END_T = alloc();
  const SNOW_T = alloc();
  const ICE_T = alloc();
  const FIRE_T = alloc();
  const PLANT_T = alloc();
  const GLASS_T = alloc();
  const CRAFT_T = alloc();
  const FURNACE_T = alloc();
  const CHEST_T = alloc();
  const TORCH_T = alloc();
  const PORTAL_T = alloc();

  special[1] = GRASS_SIDE_T;
  special[2] = DIRT_T;
  special[3] = STONE_T;
  special[4] = BEDROCK_T;
  special[5] = SAND_T;
  special[6] = WATER_T;
  special[7] = LAVA_T;
  special[8] = LOG_SIDE_T;
  special[9] = LEAVES_T;
  special[10] = COBBLE_T;
  special[18] = COBBLE_T;
  special[19] = PLANKS_T;
  special[29] = OBSIDIAN_T;
  special[30] = NETHERRACK_T;
  special[34] = END_T;
  special[38] = CRAFT_T;
  special[39] = FURNACE_T;
  special[40] = CHEST_T;
  special[42] = TORCH_T;
  special[36] = PORTAL_T;
  special[76] = FIRE_T;
  special[21] = ICE_T;
  special[75] = SNOW_T;
  special[43] = GLASS_T;

  function blit(tile: number, draw: (ox: number, oy: number) => void) {
    const col = tile % ATLAS_TILES;
    const row = Math.floor(tile / ATLAS_TILES);
    draw(col * TILE, row * TILE);
  }

  blit(STONE_T, (x, y) => noiseTile(ctx, x, y, 0x7a7a7a, 0.18, 1));
  blit(DIRT_T, (x, y) => {
    noiseTile(ctx, x, y, 0x866446, 0.22, 2);
    speckles(ctx, x, y, 0x6a4a28, 0.08, 3);
  });
  blit(GRASS_TOP_T, (x, y) => blades(ctx, x, y, 0x5a9a3c, 4));
  blit(GRASS_SIDE_T, (x, y) => grassSide(ctx, x, y, 0x866446, 0x5a9a3c));
  blit(SAND_T, (x, y) => {
    noiseTile(ctx, x, y, 0xdbd09a, 0.14, 5);
    speckles(ctx, x, y, 0xc8b878, 0.1, 6);
  });
  blit(WATER_T, (x, y) => waterFrame(ctx, x, y, 0x3a78c8, 0));
  blit(LAVA_T, (x, y) => waterFrame(ctx, x, y, 0xe06818, 1.7));
  blit(LOG_SIDE_T, (x, y) => logSide(ctx, x, y, 0x6b5530, 7));
  blit(LOG_TOP_T, (x, y) => logTop(ctx, x, y, 0x8a6a3a));
  blit(LEAVES_T, (x, y) => leaves(ctx, x, y, 0x3d7a32, 8));
  blit(COBBLE_T, (x, y) => {
    noiseTile(ctx, x, y, 0x6e6e6e, 0.2, 9);
    speckles(ctx, x, y, 0x4a4a4a, 0.12, 10);
    speckles(ctx, x, y, 0x9a9a9a, 0.08, 11);
  });
  blit(PLANKS_T, (x, y) => stripes(ctx, x, y, 0xb8945a, 0x8a6230, 12, false));
  blit(BEDROCK_T, (x, y) => {
    noiseTile(ctx, x, y, 0x2a2a32, 0.3, 13);
    speckles(ctx, x, y, 0x111118, 0.2, 14);
  });
  blit(ORE_COAL_T, (x, y) => ore(ctx, x, y, 0x7a7a7a, 0x1a1a1a, 15));
  blit(ORE_IRON_T, (x, y) => ore(ctx, x, y, 0x7a7a7a, 0xc8b09a, 16));
  blit(ORE_GOLD_T, (x, y) => ore(ctx, x, y, 0x7a7a7a, 0xf0c832, 17));
  blit(ORE_DIA_T, (x, y) => ore(ctx, x, y, 0x7a7a7a, 0x5adce6, 18));
  blit(OBSIDIAN_T, (x, y) => {
    noiseTile(ctx, x, y, 0x1a0a28, 0.25, 19);
    speckles(ctx, x, y, 0x4a20a0, 0.08, 20);
  });
  blit(NETHERRACK_T, (x, y) => {
    noiseTile(ctx, x, y, 0x6a3030, 0.22, 21);
    speckles(ctx, x, y, 0x3a1010, 0.1, 22);
  });
  blit(END_T, (x, y) => noiseTile(ctx, x, y, 0xd8d8a0, 0.12, 23));
  blit(SNOW_T, (x, y) => {
    noiseTile(ctx, x, y, 0xf2f6fa, 0.08, 24);
    speckles(ctx, x, y, 0xffffff, 0.1, 25);
  });
  blit(ICE_T, (x, y) => {
    noiseTile(ctx, x, y, 0xa8d4e8, 0.1, 26);
    speckles(ctx, x, y, 0xffffff, 0.08, 27);
  });
  blit(FIRE_T, (x, y) => fireFrame(ctx, x, y, 0));
  blit(PLANT_T, (x, y) => plant(ctx, x, y, 0x5a9a3c, 28));
  blit(GLASS_T, (x, y) => {
    ctx.fillStyle = "rgba(180,210,230,0.35)";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.strokeStyle = "rgba(220,240,255,0.7)";
    ctx.strokeRect(x + 1, y + 1, TILE - 3, TILE - 3);
  });
  blit(CRAFT_T, (x, y) => {
    stripes(ctx, x, y, 0x8a6230, 0x6b4a20, 29);
    ctx.fillStyle = hex(0x3a2a10);
    ctx.fillRect(x + 3, y + 3, 10, 10);
    ctx.fillStyle = hex(0xc8a05a);
    ctx.fillRect(x + 5, y + 5, 6, 6);
  });
  blit(FURNACE_T, (x, y) => {
    noiseTile(ctx, x, y, 0x6a6a6a, 0.12, 30);
    ctx.fillStyle = hex(0x1a1a1a);
    ctx.fillRect(x + 4, y + 7, 8, 6);
    ctx.fillStyle = hex(0xf07818);
    ctx.fillRect(x + 6, y + 9, 4, 3);
  });
  blit(CHEST_T, (x, y) => {
    ctx.fillStyle = hex(0x8a6230);
    ctx.fillRect(x, y, TILE, TILE);
    ctx.strokeStyle = hex(0x3a2a10);
    ctx.strokeRect(x + 1, y + 1, TILE - 3, TILE - 3);
    ctx.fillStyle = hex(0xf0c832);
    ctx.fillRect(x + 7, y + 7, 2, 3);
  });
  blit(TORCH_T, (x, y) => {
    ctx.clearRect(x, y, TILE, TILE);
    ctx.fillStyle = hex(0x8a6230);
    ctx.fillRect(x + 7, y + 6, 2, 10);
    ctx.fillStyle = hex(0xf0c84a);
    ctx.fillRect(x + 6, y + 2, 4, 5);
    ctx.fillStyle = hex(0xfff2a0);
    ctx.fillRect(x + 7, y + 3, 2, 2);
  });
  blit(PORTAL_T, (x, y) => {
    for (let yy = 0; yy < TILE; yy++) {
      for (let xx = 0; xx < TILE; xx++) {
        const n = hash(xx * 11 + yy * 19);
        const c = mix(0x2a0860, 0xb07aff, 0.3 + n * 0.5);
        px(ctx, x + xx, y + yy, hex(c));
      }
    }
  });

  const patternStart = next;
  for (let p = 0; p < 200 && next < ATLAS_TILES * ATLAS_TILES; p++) {
    const tile = alloc();
    const hue = (p * 47) % 360;
    const col = 0x808080;
    blit(tile, (x, y) => drawPattern(ctx, x, y, p, col));
    void hue;
  }
  void patternStart;

  const inset = 0.5 / ATLAS_SIZE;

  const atlas: Atlas = {
    canvas,
    texture: new THREE.CanvasTexture(canvas),
    uv(tile: number) {
      const col = tile % ATLAS_TILES;
      const row = Math.floor(tile / ATLAS_TILES);
      const u0 = col / ATLAS_TILES + inset;
      const v1 = 1 - row / ATLAS_TILES - inset;
      const u1 = (col + 1) / ATLAS_TILES - inset;
      const v0 = 1 - (row + 1) / ATLAS_TILES + inset;
      return { u0, v0, u1, v1 };
    },
    tileOf(id: number, face: 0 | 1 | 2) {
      if (id === GRASS) return face === 1 ? GRASS_TOP_T : face === 2 ? DIRT_T : GRASS_SIDE_T;
      if (id === WATER) return WATER_T;
      if (id === LAVA) return LAVA_T;
      if (id === FIRE) return FIRE_T;
      if (id === 8 || id === 67 || id === 69 || (id >= 77 && id <= 81) || id === 87 || id === 88 || id === 133) {
        return face === 1 || face === 2 ? LOG_TOP_T : LOG_SIDE_T;
      }
      if (special[id] !== undefined) return special[id]!;
      const b = BLOCKS[id];
      if (!b) return STONE_T;
      if (b.shape === "cross") return PLANT_T;
      if (b.cutout) return LEAVES_T;
      if (b.category === "ore") return [ORE_COAL_T, ORE_IRON_T, ORE_GOLD_T, ORE_DIA_T][id % 4]!;
      if (b.category === "wood") return face === 1 ? LOG_TOP_T : PLANKS_T;
      if (b.category === "wool" || b.category === "concrete") return STONE_T;
      if (b.category === "glass") return GLASS_T;
      if (b.category === "nether") return NETHERRACK_T;
      if (b.category === "end") return END_T;
      if (b.category === "stone" || b.tool === "pickaxe") return id % 3 === 0 ? COBBLE_T : STONE_T;
      if (b.tool === "shovel") return DIRT_T;
      return patternStart + (id % 180);
    },
  };

  atlas.texture.magFilter = THREE.NearestFilter;
  atlas.texture.minFilter = THREE.NearestFilter;
  atlas.texture.generateMipmaps = false;
  atlas.texture.colorSpace = THREE.SRGBColorSpace;
  atlas.texture.needsUpdate = true;

  // keep water/fire animation handle
  (atlas as Atlas & { animate: (t: number) => void }).animate = (t: number) => {
    blit(WATER_T, (x, y) => waterFrame(ctx, x, y, 0x3a78c8, t));
    blit(LAVA_T, (x, y) => waterFrame(ctx, x, y, 0xe06818, t * 0.6 + 1));
    blit(FIRE_T, (x, y) => fireFrame(ctx, x, y, t));
    atlas.texture.needsUpdate = true;
  };

  void BLOCK_COUNT;
  return atlas;
}

export function animateAtlas(atlas: Atlas, t: number) {
  const fn = (atlas as Atlas & { animate?: (t: number) => void }).animate;
  fn?.(t);
}
