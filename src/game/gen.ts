import {
  ACACIA_LEAVES,
  ACACIA_LOG,
  AIR,
  AMETHYST,
  ANDESITE,
  BAMBOO,
  BASALT,
  BEDROCK,
  BIRCH_LEAVES,
  BIRCH_LOG,
  BLACKSTONE,
  BLUE_ICE,
  BRAIN_CORAL,
  CACTUS,
  CHERRY_LEAVES,
  CHERRY_LOG,
  CLAY,
  COAL_ORE,
  COBBLE,
  COPPER_ORE,
  CRIMSON_NYLIUM,
  CRIMSON_STEM,
  DARK_OAK_LEAVES,
  DARK_OAK_LOG,
  DEAD_BUSH,
  DEEPSLATE,
  DIAMOND_ORE,
  DIORITE,
  DIRT,
  DRIPSTONE,
  EMERALD_ORE,
  END_PORTAL,
  END_PORTAL_FRAME,
  END_STONE,
  FERN,
  FIRE_CORAL,
  GLOWSTONE,
  GOLD_ORE,
  GRANITE,
  GRASS,
  GRAVEL,
  ICE,
  IRON_ORE,
  JUNGLE_LEAVES,
  JUNGLE_LOG,
  KELP,
  LAPIS_ORE,
  LAVA,
  MAGMA,
  MYCELIUM,
  NETHERRACK,
  OAK_LEAVES,
  OAK_LOG,
  OBSIDIAN,
  PACKED_ICE,
  PALE_LEAVES,
  PALE_OAK_LOG,
  PODZOL,
  POPPY,
  REDSTONE_ORE,
  RED_MUSHROOM_BLOCK,
  RED_SAND,
  SAND,
  SANDSTONE,
  SCULK,
  SEAGRASS,
  SHROOMLIGHT,
  SNOW,
  SNOW_BLOCK,
  SOUL_SAND,
  SOUL_SOIL,
  SPRUCE_LEAVES,
  SPRUCE_LOG,
  STONE,
  SUGAR_CANE,
  TALL_GRASS,
  TERRACOTTA,
  TUFF,
  WARPED_NYLIUM,
  WARPED_STEM,
  WARPED_WART,
  WATER,
  DANDELION,
  CORNFLOWER,
  ALLIUM,
  BROWN_MUSHROOM_BLOCK,
  MUSHROOM_STEM,
  NETHER_WART_BLOCK,
  QUARTZ_ORE,
  ANCIENT_DEBRIS,
  STONE_BRICKS,
  IRON_BLOCK,
  QUARTZ_BLOCK,
  NETHER_BRICKS,
  NETHER_PORTAL,
} from "./blocks";
import { BIOMES, pickNether, pickOverworld, type Biome, type BiomeId } from "./biomes";
import { hash2, hash3, mixSeed, mulberry32 } from "./rng";
import { CHUNK_H, CHUNK_W, SEA_LEVEL, type Dim } from "./types";
import { createNoise2D, createNoise3D } from "simplex-noise";

export interface ChunkData {
  blocks: Uint16Array;
  biomes: Uint8Array;
}

const BIOME_INDEX: BiomeId[] = [
  "plains", "forest", "birch_forest", "dark_forest", "taiga", "snowy_taiga", "jungle",
  "bamboo_jungle", "desert", "savanna", "swamp", "mangrove", "ocean", "frozen_ocean",
  "warm_ocean", "mountains", "snowy_peaks", "badlands", "cherry_grove", "mushroom",
  "flower_forest", "meadow", "beach", "stony_shore", "ice_spikes", "pale_garden",
  "sunflower_plains", "grove", "nether_wastes", "crimson_forest", "warped_forest",
  "soul_sand_valley", "basalt_deltas", "the_end", "end_midlands", "end_highlands",
];

const BIOME_TO_I = new Map<BiomeId, number>(BIOME_INDEX.map((b, i) => [b, i]));

export function biomeAtIndex(i: number): Biome {
  return BIOMES[BIOME_INDEX[i] ?? "plains"]!;
}

function idx(x: number, y: number, z: number): number {
  return x + z * CHUNK_W + y * CHUNK_W * CHUNK_W;
}

export function makeNoises(seed: number) {
  const n2 = (s: number) => createNoise2D(mulberry32(mixSeed(seed, s)));
  const n3 = (s: number) => createNoise3D(mulberry32(mixSeed(seed, s)));
  return {
    cont: n2(1),
    eros: n2(2),
    pv: n2(3),
    temp: n2(4),
    rain: n2(5),
    cave: n3(6),
    cheese: n3(7),
    ore: n3(8),
    neth: n2(9),
    nethH: n2(10),
    warp: n3(11),
  };
}

export type Noises = ReturnType<typeof makeNoises>;

function fbm2(n: (x: number, y: number) => number, x: number, z: number, oct = 4, s = 0.5): number {
  let a = 0, amp = 1, f = 1, nrm = 0;
  for (let i = 0; i < oct; i++) {
    a += n(x * f, z * f) * amp;
    nrm += amp;
    amp *= s;
    f *= 2;
  }
  return a / nrm;
}

export function sampleColumn(noises: Noises, wx: number, wz: number) {
  const cont = fbm2(noises.cont, wx * 0.0022, wz * 0.0022, 5, 0.5);
  const eros = fbm2(noises.eros, wx * 0.004, wz * 0.004, 4, 0.55);
  const pv = fbm2(noises.pv, wx * 0.006, wz * 0.006, 3, 0.5);
  const temp = (fbm2(noises.temp, wx * 0.0014, wz * 0.0014, 3, 0.5) + 1) * 0.5 * 2.0;
  const rain = (fbm2(noises.rain, wx * 0.0016, wz * 0.0016, 3, 0.5) + 1) * 0.5;
  let h = SEA_LEVEL + cont * 18 + pv * 10 - eros * 8;
  if (cont > 0.35) h += (cont - 0.35) * 48;
  if (cont < -0.15) h = SEA_LEVEL - 8 + cont * 16;
  h += noises.cont(wx * 0.04, wz * 0.04) * 1.6;
  const height = Math.max(4, Math.min(CHUNK_H - 8, Math.floor(h)));
  const biome = pickOverworld(temp, rain, height, cont);
  return { height, biome, cont, temp, rain };
}

function set(blocks: Uint16Array, x: number, y: number, z: number, id: number) {
  if (x < 0 || z < 0 || x >= CHUNK_W || z >= CHUNK_W || y < 0 || y >= CHUNK_H) return;
  blocks[idx(x, y, z)] = id;
}

function get(blocks: Uint16Array, x: number, y: number, z: number): number {
  if (x < 0 || z < 0 || x >= CHUNK_W || z >= CHUNK_W || y < 0 || y >= CHUNK_H) return 0;
  return blocks[idx(x, y, z)]!;
}

function treeOak(blocks: Uint16Array, x: number, y: number, z: number, log = OAK_LOG, leaf = OAK_LEAVES, h = 5) {
  for (let i = 0; i < h; i++) set(blocks, x, y + i, z, log);
  const top = y + h;
  for (let dy = -2; dy <= 2; dy++) {
    const r = dy === -2 || dy === 2 ? 1 : 2;
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        if (Math.abs(dx) === r && Math.abs(dz) === r && dy !== 0) continue;
        if (get(blocks, x + dx, top + dy, z + dz) === AIR) set(blocks, x + dx, top + dy, z + dz, leaf);
      }
    }
  }
}

function treeSpruce(blocks: Uint16Array, x: number, y: number, z: number) {
  const h = 7;
  for (let i = 0; i < h; i++) set(blocks, x, y + i, z, SPRUCE_LOG);
  for (let dy = 2; dy < h; dy++) {
    const r = dy < h - 2 ? (dy % 2 === 0 ? 2 : 1) : 1;
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        if (dx === 0 && dz === 0) continue;
        if (get(blocks, x + dx, y + dy, z + dz) === AIR) set(blocks, x + dx, y + dy, z + dz, SPRUCE_LEAVES);
      }
    }
  }
  set(blocks, x, y + h, z, SPRUCE_LEAVES);
}

function treeJungle(blocks: Uint16Array, x: number, y: number, z: number) {
  const h = 10;
  for (let i = 0; i < h; i++) {
    set(blocks, x, y + i, z, JUNGLE_LOG);
    set(blocks, x + 1, y + i, z, JUNGLE_LOG);
    set(blocks, x, y + i, z + 1, JUNGLE_LOG);
    set(blocks, x + 1, y + i, z + 1, JUNGLE_LOG);
  }
  const top = y + h;
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        if (Math.abs(dx) + Math.abs(dz) > 5) continue;
        if (get(blocks, x + dx, top + dy, z + dz) === AIR) set(blocks, x + dx, top + dy, z + dz, JUNGLE_LEAVES);
      }
    }
  }
}

function giantMushroom(blocks: Uint16Array, x: number, y: number, z: number, red: boolean) {
  const cap = red ? RED_MUSHROOM_BLOCK : BROWN_MUSHROOM_BLOCK;
  const h = 6;
  for (let i = 0; i < h; i++) set(blocks, x, y + i, z, MUSHROOM_STEM);
  const r = red ? 2 : 3;
  for (let dx = -r; dx <= r; dx++) {
    for (let dz = -r; dz <= r; dz++) {
      set(blocks, x + dx, y + h, z + dz, cap);
      if (red && (Math.abs(dx) === r || Math.abs(dz) === r)) {
        for (let dy = 0; dy < 3; dy++) set(blocks, x + dx, y + h - dy, z + dz, cap);
      }
    }
  }
}

function netherFungus(blocks: Uint16Array, x: number, y: number, z: number, warped: boolean) {
  const stem = warped ? WARPED_STEM : CRIMSON_STEM;
  const wart = warped ? WARPED_WART : NETHER_WART_BLOCK;
  const h = 5 + ((x * 13 + z) % 4);
  for (let i = 0; i < h; i++) set(blocks, x, y + i, z, stem);
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      set(blocks, x + dx, y + h, z + dz, wart);
    }
  }
  set(blocks, x, y + h - 1, z, SHROOMLIGHT);
}

function genDuel(blocks: Uint16Array, biomes: Uint8Array, cx: number, cz: number) {
  biomes.fill(BIOME_TO_I.get("plains") ?? 0);
  const floor = 32;
  for (let z = 0; z < CHUNK_W; z++) {
    for (let x = 0; x < CHUNK_W; x++) {
      const wx = cx * CHUNK_W + x;
      const wz = cz * CHUNK_W + z;
      const ax = Math.abs(wx);
      const az = Math.abs(wz);
      set(blocks, x, 0, z, BEDROCK);
      if (ax > 30 || az > 30) {
        for (let y = 1; y <= 10; y++) set(blocks, x, y, z, LAVA);
        continue;
      }
      if (ax > 24 || az > 24) {
        for (let y = 1; y <= 46; y++) set(blocks, x, y, z, BLACKSTONE);
        if (ax === 25 && wz % 4 === 0) set(blocks, x, 46, z, GLOWSTONE);
        if (az === 25 && wx % 4 === 0) set(blocks, x, 46, z, GLOWSTONE);
        continue;
      }
      const check = (wx + wz) & 1;
      set(blocks, x, floor, z, check ? STONE_BRICKS : QUARTZ_BLOCK);
      for (let y = 1; y < floor; y++) set(blocks, x, y, z, BLACKSTONE);
      if (ax <= 2 && az <= 2) set(blocks, x, floor, z, OBSIDIAN);
      if (Math.abs(wz + 16) <= 1 && ax <= 2) set(blocks, x, floor, z, IRON_BLOCK);
      if (Math.abs(wz - 16) <= 1 && ax <= 2) set(blocks, x, floor, z, IRON_BLOCK);
      if (wx === -22 && wz >= -2 && wz <= 2) {
        for (let y = floor + 1; y <= floor + 4; y++) {
          if (wz === -2 || wz === 2 || y === floor + 1 || y === floor + 4) set(blocks, x, y, z, OBSIDIAN);
          else set(blocks, x, y, z, NETHER_PORTAL);
        }
      }
      if (wx === 22 && wz >= -1 && wz <= 1 && az <= 1) {
        set(blocks, x, floor + 1, z, END_PORTAL_FRAME);
        if (wz === 0) set(blocks, x, floor + 1, z, END_PORTAL);
      }
      if ((wx % 8 === 0 && wz % 8 === 0) && ax < 22 && az < 22) set(blocks, x, 44, z, GLOWSTONE);
    }
  }
}

export function generateChunk(
  seed: number,
  cx: number,
  cz: number,
  dim: Dim,
  noises: Noises,
  arena?: "duel" | null,
): ChunkData {
  const blocks = new Uint16Array(CHUNK_W * CHUNK_H * CHUNK_W);
  const biomes = new Uint8Array(CHUNK_W * CHUNK_W);
  const rng = mulberry32(mixSeed(seed, cx * 341 + cz * 913));

  if (arena === "duel") {
    genDuel(blocks, biomes, cx, cz);
    return { blocks, biomes };
  }
  if (dim === "nether") {
    genNether(blocks, biomes, seed, cx, cz, noises, rng);
    return { blocks, biomes };
  }
  if (dim === "end") {
    genEnd(blocks, biomes, seed, cx, cz, rng);
    return { blocks, biomes };
  }

  const cols: { height: number; biome: BiomeId }[] = new Array(CHUNK_W * CHUNK_W);
  for (let z = 0; z < CHUNK_W; z++) {
    for (let x = 0; x < CHUNK_W; x++) {
      const wx = cx * CHUNK_W + x;
      const wz = cz * CHUNK_W + z;
      const s = sampleColumn(noises, wx, wz);
      cols[x + z * CHUNK_W] = s;
      biomes[x + z * CHUNK_W] = BIOME_TO_I.get(s.biome) ?? 0;
    }
  }

  for (let z = 0; z < CHUNK_W; z++) {
    for (let x = 0; x < CHUNK_W; x++) {
      const col = cols[x + z * CHUNK_W]!;
      const b = BIOMES[col.biome]!;
      const h = col.height;
      const wx = cx * CHUNK_W + x;
      const wz = cz * CHUNK_W + z;
      set(blocks, x, 0, z, BEDROCK);
      if (rng() < 0.4) set(blocks, x, 1, z, BEDROCK);

      for (let y = 1; y < CHUNK_H; y++) {
        const deep = y < 16;
        const stoneId = deep
          ? (noises.ore(wx * 0.08, y * 0.08, wz * 0.08) > 0.35 ? DEEPSLATE : y < 8 ? DEEPSLATE : STONE)
          : STONE;
        if (y > h) {
          if (y <= SEA_LEVEL) {
            const water = b.waterIce && y === SEA_LEVEL ? ICE : WATER;
            set(blocks, x, y, z, water);
            if (y === SEA_LEVEL && b.id === "warm_ocean" && rng() < 0.08) {
              set(blocks, x, y - 1, z, rng() < 0.5 ? BRAIN_CORAL : FIRE_CORAL);
            }
          }
          continue;
        }
        let id: number;
        if (y === h) {
          if (h < SEA_LEVEL - 1) id = b.id.includes("ocean") || b.id === "beach" ? SAND : GRAVEL;
          else id = b.surface;
        } else if (y >= h - 3) {
          id = b.fill;
        } else {
          id = stoneId;
          if (y < 40 && noises.ore(wx * 0.12, y * 0.12, wz * 0.12) > 0.55) {
            if (rng() < 0.08) id = ANDESITE;
            else if (rng() < 0.08) id = DIORITE;
            else if (rng() < 0.08) id = GRANITE;
            else if (rng() < 0.05) id = TUFF;
          }
        }
        if (b.id === "badlands" && y > h - 8 && y <= h) {
          const band = (h - y) % 5;
          id = band === 0 ? TERRACOTTA : band === 1 ? RED_SAND : band === 2 ? TERRACOTTA : SANDSTONE;
        }
        set(blocks, x, y, z, id);
      }

      // caves
      for (let y = 4; y < h - 2; y++) {
        const c1 = noises.cave(wx * 0.05, y * 0.07, wz * 0.05);
        const c2 = noises.cheese(wx * 0.03, y * 0.04, wz * 0.03);
        const spaghetti = Math.abs(c1) < 0.07 + (y < 20 ? 0.03 : 0);
        const cheese = c2 > 0.55 && y < 48;
        if (spaghetti || cheese) {
          const cur = get(blocks, x, y, z);
          if (cur !== BEDROCK && cur !== WATER) {
            set(blocks, x, y, z, y < 8 && rng() < 0.3 ? LAVA : AIR);
          }
        }
      }

      // ores
      for (let y = 2; y < h; y++) {
        if (get(blocks, x, y, z) !== STONE && get(blocks, x, y, z) !== DEEPSLATE) continue;
        const o = noises.ore(wx * 0.18 + 10, y * 0.18, wz * 0.18);
        if (o > 0.72 && y < 70 && rng() < 0.35) set(blocks, x, y, z, COAL_ORE);
        else if (o > 0.78 && y < 52 && rng() < 0.22) set(blocks, x, y, z, IRON_ORE);
        else if (o > 0.82 && y < 40 && rng() < 0.12) set(blocks, x, y, z, COPPER_ORE);
        else if (o > 0.86 && y < 32 && rng() < 0.08) set(blocks, x, y, z, GOLD_ORE);
        else if (o > 0.88 && y < 24 && rng() < 0.08) set(blocks, x, y, z, REDSTONE_ORE);
        else if (o > 0.89 && y < 28 && rng() < 0.06) set(blocks, x, y, z, LAPIS_ORE);
        else if (o > 0.92 && y < 16 && rng() < 0.05) set(blocks, x, y, z, DIAMOND_ORE);
        else if (o > 0.9 && y > 40 && rng() < 0.03) set(blocks, x, y, z, EMERALD_ORE);
      }

      if (b.snow && get(blocks, x, h + 1, z) === AIR) set(blocks, x, h + 1, z, SNOW);
      if (Math.abs(noises.cave(wx * 0.02, 8, wz * 0.02)) < 0.04 && h > 20 && rng() < 0.02) {
        set(blocks, x, 12, z, AMETHYST);
      }
    }
  }

  // surface decorations
  for (let z = 2; z < CHUNK_W - 2; z++) {
    for (let x = 2; x < CHUNK_W - 2; x++) {
      const col = cols[x + z * CHUNK_W]!;
      const b = BIOMES[col.biome]!;
      const h = col.height;
      if (h < SEA_LEVEL) {
        if (b.id === "warm_ocean" && rng() < 0.15) set(blocks, x, h + 1, z, KELP);
        else if (h < SEA_LEVEL - 1 && rng() < 0.12) set(blocks, x, h + 1, z, SEAGRASS);
        continue;
      }
      const ground = get(blocks, x, h, z);
      if (ground === AIR || ground === WATER) continue;
      const r = hash2(cx * CHUNK_W + x, cz * CHUNK_W + z, seed);
      if (r < b.treeChance) {
        if (b.tree === "oak") treeOak(blocks, x, h + 1, z, OAK_LOG, OAK_LEAVES, 4 + (r * 30) % 3);
        else if (b.tree === "birch") treeOak(blocks, x, h + 1, z, BIRCH_LOG, BIRCH_LEAVES, 5);
        else if (b.tree === "dark") treeOak(blocks, x, h + 1, z, DARK_OAK_LOG, DARK_OAK_LEAVES, 6);
        else if (b.tree === "spruce") treeSpruce(blocks, x, h + 1, z);
        else if (b.tree === "jungle") treeJungle(blocks, x, h + 1, z);
        else if (b.tree === "acacia") treeOak(blocks, x, h + 1, z, ACACIA_LOG, ACACIA_LEAVES, 5);
        else if (b.tree === "cherry") treeOak(blocks, x, h + 1, z, CHERRY_LOG, CHERRY_LEAVES, 5);
        else if (b.tree === "pale") treeOak(blocks, x, h + 1, z, PALE_OAK_LOG, PALE_LEAVES, 6);
        else if (b.tree === "cactus") {
          const ch = 2 + (r * 10) % 3;
          for (let i = 1; i <= ch; i++) set(blocks, x, h + i, z, CACTUS);
        } else if (b.tree === "mushroom") giantMushroom(blocks, x, h + 1, z, r > 0.03);
      } else if (r < b.treeChance + b.flowerChance) {
        const flowers = [DANDELION, POPPY, CORNFLOWER, ALLIUM];
        set(blocks, x, h + 1, z, flowers[Math.floor(r * 80) % flowers.length]!);
      } else if (r < b.treeChance + b.flowerChance + b.grassChance) {
        set(blocks, x, h + 1, z, r * 100 % 1 < 0.2 ? FERN : TALL_GRASS);
      } else if (b.id === "desert" && r < 0.02) {
        set(blocks, x, h + 1, z, DEAD_BUSH);
      } else if (b.id === "bamboo_jungle" && r < 0.2) {
        const bh = 4 + (r * 40) % 6;
        for (let i = 1; i <= bh; i++) set(blocks, x, h + i, z, BAMBOO);
      } else if ((b.id === "swamp" || b.id === "mangrove") && r < 0.04 && h <= SEA_LEVEL + 1) {
        for (let i = 1; i <= 3; i++) set(blocks, x, h + i, z, SUGAR_CANE);
      }
      if (b.snow && get(blocks, x, h + 1, z) === AIR) set(blocks, x, h + 1, z, SNOW);
      if (b.id === "ice_spikes" && r < 0.06) {
        const sh = 8 + (r * 80) % 12;
        for (let i = 0; i < sh; i++) set(blocks, x, h + 1 + i, z, i > sh - 3 ? PACKED_ICE : BLUE_ICE);
      }
    }
  }

  // water lakes
  if (rng() < 0.08) {
    const lx = 4 + Math.floor(rng() * 8);
    const lz = 4 + Math.floor(rng() * 8);
    const col = cols[lx + lz * CHUNK_W]!;
    if (col.height > SEA_LEVEL + 2) {
      const y = col.height - 1;
      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          if (Math.abs(dx) + Math.abs(dz) <= 3) {
            set(blocks, lx + dx, y, lz + dz, WATER);
            set(blocks, lx + dx, y - 1, lz + dz, CLAY);
          }
        }
      }
    }
  }

  // stronghold portal room near origin-ish
  const strongCx = Math.floor(((seed % 400) - 200) / CHUNK_W);
  const strongCz = Math.floor((((seed * 7) % 400) - 200) / CHUNK_W);
  if (cx === strongCx && cz === strongCz) {
    carveStronghold(blocks);
  }

  void GRAVEL;
  void PODZOL;
  void MYCELIUM;
  void DRIPSTONE;
  void SANDSTONE;
  void COBBLE;
  void OBSIDIAN;
  return { blocks, biomes };
}

function carveStronghold(blocks: Uint16Array) {
  const y = 18;
  for (let x = 3; x < 13; x++) {
    for (let z = 3; z < 13; z++) {
      for (let yy = y; yy < y + 6; yy++) set(blocks, x, yy, z, AIR);
      set(blocks, x, y, z, STONE);
    }
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const x = 8 + Math.round(Math.cos(a) * 3);
    const z = 8 + Math.round(Math.sin(a) * 3);
    set(blocks, x, y + 1, z, END_PORTAL_FRAME);
  }
  set(blocks, 8, y + 1, 8, END_PORTAL);
}

function genNether(
  blocks: Uint16Array,
  biomes: Uint8Array,
  seed: number,
  cx: number,
  cz: number,
  noises: Noises,
  rng: () => number,
) {
  for (let z = 0; z < CHUNK_W; z++) {
    for (let x = 0; x < CHUNK_W; x++) {
      const wx = cx * CHUNK_W + x;
      const wz = cz * CHUNK_W + z;
      const bid = pickNether(wx, wz, noises.neth(wx * 0.01, wz * 0.01));
      biomes[x + z * CHUNK_W] = BIOME_TO_I.get(bid) ?? 28;
      const b = BIOMES[bid]!;
      const floor = 28 + Math.floor(fbm2(noises.nethH, wx * 0.03, wz * 0.03, 3) * 8);
      const ceil = 80 - Math.floor(fbm2(noises.neth, wx * 0.04, wz * 0.04, 3) * 8);
      set(blocks, x, 0, z, BEDROCK);
      set(blocks, x, CHUNK_H - 1, z, BEDROCK);
      for (let y = 1; y < CHUNK_H - 1; y++) {
        if (y <= floor) {
          let id = b.surface;
          if (y < floor - 2) id = NETHERRACK;
          if (bid === "soul_sand_valley") id = y === floor ? SOUL_SAND : SOUL_SOIL;
          if (bid === "basalt_deltas") id = rng() < 0.2 ? MAGMA : BASALT;
          if (bid === "crimson_forest" && y === floor) id = CRIMSON_NYLIUM;
          if (bid === "warped_forest" && y === floor) id = WARPED_NYLIUM;
          set(blocks, x, y, z, id);
        } else if (y >= ceil) {
          set(blocks, x, y, z, NETHERRACK);
        } else if (y < 12) {
          set(blocks, x, y, z, LAVA);
        }
        const o = noises.ore(wx * 0.15, y * 0.15, wz * 0.15);
        if (o > 0.8 && get(blocks, x, y, z) === NETHERRACK) {
          if (rng() < 0.15) set(blocks, x, y, z, QUARTZ_ORE);
          else if (rng() < 0.02 && y < 22) set(blocks, x, y, z, ANCIENT_DEBRIS);
          else if (rng() < 0.05) set(blocks, x, y, z, GOLD_ORE);
        }
      }
      if (rng() < 0.04 && ceil - floor > 20) {
        const gy = floor + 8 + Math.floor(rng() * 20);
        set(blocks, x, gy, z, GLOWSTONE);
      }
    }
  }
  if ((hash2(cx, cz, seed) > 0.86) && Math.abs(cx) + Math.abs(cz) > 1) {
    const wy = 48;
    for (let x = 0; x < CHUNK_W; x++) {
      for (let z = 0; z < 3; z++) {
        set(blocks, x, wy, z + 6, NETHER_BRICKS);
        if (x % 4 === 0) set(blocks, x, wy + 1, z + 6, NETHER_BRICKS);
      }
    }
    for (let i = 0; i < 6; i++) set(blocks, 8, wy + 1 + i, 7, NETHER_BRICKS);
  }
  for (let z = 2; z < CHUNK_W - 2; z++) {
    for (let x = 2; x < CHUNK_W - 2; x++) {
      const bid = BIOME_INDEX[biomes[x + z * CHUNK_W]!] ?? "nether_wastes";
      if (bid === "crimson_forest" && rng() < 0.08) {
        let y = 40;
        while (y > 4 && get(blocks, x, y, z) === AIR) y--;
        netherFungus(blocks, x, y + 1, z, false);
      }
      if (bid === "warped_forest" && rng() < 0.08) {
        let y = 40;
        while (y > 4 && get(blocks, x, y, z) === AIR) y--;
        netherFungus(blocks, x, y + 1, z, true);
      }
      if (bid === "basalt_deltas" && rng() < 0.06) {
        let y = 40;
        while (y > 4 && get(blocks, x, y, z) === AIR) y--;
        const h = 4 + Math.floor(rng() * 8);
        for (let i = 0; i < h; i++) set(blocks, x, y + 1 + i, z, BASALT);
      }
      if (bid === "soul_sand_valley" && rng() < 0.04) {
        let y = 40;
        while (y > 4 && get(blocks, x, y, z) === AIR) y--;
        for (let i = 0; i < 6; i++) set(blocks, x, y + 1 + i, z, BONE_BLOCK_SAFE);
      }
    }
  }
  void BLACKSTONE;
}

const BONE_BLOCK_SAFE = 108;

function genEnd(blocks: Uint16Array, biomes: Uint8Array, seed: number, cx: number, cz: number, rng: () => number) {
  biomes.fill(BIOME_TO_I.get("the_end") ?? 33);
  const dist = Math.hypot(cx, cz);
  if (cx === 0 && cz === 0) {
    for (let z = 0; z < CHUNK_W; z++) {
      for (let x = 0; x < CHUNK_W; x++) {
        const dx = x - 8, dz = z - 8;
        if (dx * dx + dz * dz < 80) {
          for (let y = 40; y < 48; y++) set(blocks, x, y, z, END_STONE);
        }
      }
    }
    set(blocks, 8, 48, 8, BEDROCK);
    const pillars = [
      [3, 3],
      [3, 12],
      [12, 3],
      [12, 12],
      [8, 2],
      [8, 13],
      [2, 8],
      [13, 8],
    ];
    for (const [px, pz] of pillars) {
      const h = 8 + ((px + pz) % 5);
      for (let y = 48; y < 48 + h; y++) set(blocks, px, y, pz, OBSIDIAN);
      set(blocks, px, 48 + h, pz, BEDROCK);
    }
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (i === 1 && j === 1) set(blocks, 7 + i, 48, 7 + j, END_PORTAL);
        else set(blocks, 7 + i, 48, 7 + j, END_PORTAL_FRAME);
      }
    }
    return;
  }
  if (dist < 1.6) return;
  for (let z = 0; z < CHUNK_W; z++) {
    for (let x = 0; x < CHUNK_W; x++) {
      const n = hash2(cx * CHUNK_W + x, cz * CHUNK_W + z, seed);
      if (n > 0.62) {
        const h = 42 + Math.floor(n * 12);
        const top = h + 4 + Math.floor(n * 8);
        for (let y = h; y < top; y++) set(blocks, x, y, z, END_STONE);
        if (n > 0.92 && rng() < 0.2) {
          for (let i = 0; i < 4; i++) set(blocks, x, top + i, z, 157);
          set(blocks, x, top + 4, z, 158);
        }
      }
    }
  }
}

export function findSpawn(seed: number, noises: Noises): { x: number; y: number; z: number } {
  const prefer = (id: string) =>
    id === "plains" ||
    id === "forest" ||
    id === "flower_forest" ||
    id === "sunflower_plains" ||
    id === "meadow" ||
    id === "savanna" ||
    id === "birch_forest";
  const cold = (id: string) =>
    id.includes("snow") || id.includes("ice") || id.includes("frozen") || id === "grove" || id === "taiga";
  let fallback: { x: number; y: number; z: number } | null = null;
  for (let r = 0; r < 80; r++) {
    const x = ((r * 19 + seed) % 96) - 48;
    const z = ((r * 31 + seed * 3) % 96) - 48;
    const s = sampleColumn(noises, x, z);
    const id = BIOMES[s.biome]!.id;
    if (s.height < SEA_LEVEL || s.height >= 72 || id.includes("ocean")) continue;
    const pos = { x: x + 0.5, y: s.height + 2, z: z + 0.5 };
    if (prefer(id)) return pos;
    if (!cold(id) && !fallback) fallback = pos;
  }
  return fallback ?? { x: 0.5, y: SEA_LEVEL + 4, z: 0.5 };
}

export function strongholdChunk(seed: number): { cx: number; cz: number } {
  return {
    cx: Math.floor(((seed % 400) - 200) / CHUNK_W),
    cz: Math.floor((((seed * 7) % 400) - 200) / CHUNK_W),
  };
}
