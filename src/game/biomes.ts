export type BiomeId =
  | "plains"
  | "forest"
  | "birch_forest"
  | "dark_forest"
  | "taiga"
  | "snowy_taiga"
  | "jungle"
  | "bamboo_jungle"
  | "desert"
  | "savanna"
  | "swamp"
  | "mangrove"
  | "ocean"
  | "frozen_ocean"
  | "warm_ocean"
  | "mountains"
  | "snowy_peaks"
  | "badlands"
  | "cherry_grove"
  | "mushroom"
  | "flower_forest"
  | "meadow"
  | "beach"
  | "stony_shore"
  | "ice_spikes"
  | "pale_garden"
  | "sunflower_plains"
  | "grove"
  | "nether_wastes"
  | "crimson_forest"
  | "warped_forest"
  | "soul_sand_valley"
  | "basalt_deltas"
  | "the_end"
  | "end_midlands"
  | "end_highlands";

export interface Biome {
  id: BiomeId;
  name: string;
  temp: number;
  rain: number;
  surface: number;
  fill: number;
  waterIce: boolean;
  tree: "oak" | "birch" | "spruce" | "jungle" | "acacia" | "dark" | "cherry" | "pale" | "none" | "cactus" | "mushroom" | "crimson" | "warped";
  treeChance: number;
  grassChance: number;
  flowerChance: number;
  snow: boolean;
  fog: number;
  waterColor: number;
  sky: number;
}

export const BIOMES: Record<BiomeId, Biome> = {
  plains: { id: "plains", name: "Plains", temp: 0.8, rain: 0.4, surface: 1, fill: 2, waterIce: false, tree: "oak", treeChance: 0.012, grassChance: 0.22, flowerChance: 0.04, snow: false, fog: 0xc5d8ea, waterColor: 0x3f76e4, sky: 0x78a7ff },
  forest: { id: "forest", name: "Forest", temp: 0.7, rain: 0.8, surface: 1, fill: 2, waterIce: false, tree: "oak", treeChance: 0.18, grassChance: 0.18, flowerChance: 0.03, snow: false, fog: 0xb8d0c8, waterColor: 0x3f76e4, sky: 0x78a7ff },
  birch_forest: { id: "birch_forest", name: "Birch Forest", temp: 0.6, rain: 0.6, surface: 1, fill: 2, waterIce: false, tree: "birch", treeChance: 0.16, grassChance: 0.16, flowerChance: 0.04, snow: false, fog: 0xc8dcc8, waterColor: 0x3f76e4, sky: 0x78a7ff },
  dark_forest: { id: "dark_forest", name: "Dark Forest", temp: 0.7, rain: 0.8, surface: 1, fill: 2, waterIce: false, tree: "dark", treeChance: 0.22, grassChance: 0.1, flowerChance: 0.02, snow: false, fog: 0x6a7a5a, waterColor: 0x3f76e4, sky: 0x4a6a88 },
  taiga: { id: "taiga", name: "Taiga", temp: 0.25, rain: 0.8, surface: 52, fill: 2, waterIce: false, tree: "spruce", treeChance: 0.16, grassChance: 0.12, flowerChance: 0.01, snow: false, fog: 0xb0c4c0, waterColor: 0x3d57d6, sky: 0x7da3ff },
  snowy_taiga: { id: "snowy_taiga", name: "Snowy Taiga", temp: 0.0, rain: 0.5, surface: 75, fill: 2, waterIce: true, tree: "spruce", treeChance: 0.12, grassChance: 0.02, flowerChance: 0, snow: true, fog: 0xd8e8f0, waterColor: 0x3938c9, sky: 0xc0d8f0 },
  jungle: { id: "jungle", name: "Jungle", temp: 0.95, rain: 0.9, surface: 1, fill: 2, waterIce: false, tree: "jungle", treeChance: 0.28, grassChance: 0.3, flowerChance: 0.06, snow: false, fog: 0x8ab878, waterColor: 0x1b9a8a, sky: 0x78c8ff },
  bamboo_jungle: { id: "bamboo_jungle", name: "Bamboo Jungle", temp: 0.95, rain: 0.9, surface: 1, fill: 2, waterIce: false, tree: "jungle", treeChance: 0.12, grassChance: 0.25, flowerChance: 0.04, snow: false, fog: 0x8ab878, waterColor: 0x1b9a8a, sky: 0x78c8ff },
  desert: { id: "desert", name: "Desert", temp: 2.0, rain: 0.0, surface: 5, fill: 5, waterIce: false, tree: "cactus", treeChance: 0.04, grassChance: 0, flowerChance: 0.01, snow: false, fog: 0xe8d8a8, waterColor: 0x32a598, sky: 0x78b4ff },
  savanna: { id: "savanna", name: "Savanna", temp: 1.2, rain: 0.2, surface: 1, fill: 2, waterIce: false, tree: "acacia", treeChance: 0.04, grassChance: 0.18, flowerChance: 0.02, snow: false, fog: 0xd8c890, waterColor: 0x2c8b9c, sky: 0x80b0ff },
  swamp: { id: "swamp", name: "Swamp", temp: 0.8, rain: 0.9, surface: 1, fill: 2, waterIce: false, tree: "oak", treeChance: 0.08, grassChance: 0.2, flowerChance: 0.05, snow: false, fog: 0x6a7a50, waterColor: 0x4c6559, sky: 0x6a8aaa },
  mangrove: { id: "mangrove", name: "Mangrove Swamp", temp: 0.8, rain: 0.9, surface: 1, fill: 2, waterIce: false, tree: "oak", treeChance: 0.1, grassChance: 0.12, flowerChance: 0.02, snow: false, fog: 0x5a7a58, waterColor: 0x3a6a5a, sky: 0x6a9aaa },
  ocean: { id: "ocean", name: "Ocean", temp: 0.5, rain: 0.5, surface: 3, fill: 3, waterIce: false, tree: "none", treeChance: 0, grassChance: 0, flowerChance: 0, snow: false, fog: 0x8ab0d0, waterColor: 0x1787d4, sky: 0x78a7ff },
  frozen_ocean: { id: "frozen_ocean", name: "Frozen Ocean", temp: 0.0, rain: 0.5, surface: 3, fill: 3, waterIce: true, tree: "none", treeChance: 0, grassChance: 0, flowerChance: 0, snow: true, fog: 0xc0d4e8, waterColor: 0x3938c9, sky: 0xc0d8f0 },
  warm_ocean: { id: "warm_ocean", name: "Warm Ocean", temp: 0.5, rain: 0.5, surface: 5, fill: 5, waterIce: false, tree: "none", treeChance: 0, grassChance: 0, flowerChance: 0, snow: false, fog: 0x80d0d8, waterColor: 0x02b0e6, sky: 0x78c8ff },
  mountains: { id: "mountains", name: "Windswept Hills", temp: 0.2, rain: 0.3, surface: 3, fill: 3, waterIce: false, tree: "spruce", treeChance: 0.03, grassChance: 0.06, flowerChance: 0.01, snow: false, fog: 0xc0c8d0, waterColor: 0x3f76e4, sky: 0x88b0ff },
  snowy_peaks: { id: "snowy_peaks", name: "Jagged Peaks", temp: -0.5, rain: 0.9, surface: 75, fill: 3, waterIce: true, tree: "none", treeChance: 0, grassChance: 0, flowerChance: 0, snow: true, fog: 0xe8f0f8, waterColor: 0x3938c9, sky: 0xd0e4f8 },
  badlands: { id: "badlands", name: "Badlands", temp: 2.0, rain: 0.0, surface: 111, fill: 111, waterIce: false, tree: "none", treeChance: 0, grassChance: 0, flowerChance: 0.01, snow: false, fog: 0xd8a070, waterColor: 0x3f76e4, sky: 0x90b8ff },
  cherry_grove: { id: "cherry_grove", name: "Cherry Grove", temp: 0.5, rain: 0.8, surface: 1, fill: 2, waterIce: false, tree: "cherry", treeChance: 0.14, grassChance: 0.2, flowerChance: 0.12, snow: false, fog: 0xf0d8e0, waterColor: 0x5db7ef, sky: 0xa0c8ff },
  mushroom: { id: "mushroom", name: "Mushroom Fields", temp: 0.9, rain: 1.0, surface: 51, fill: 2, waterIce: false, tree: "mushroom", treeChance: 0.06, grassChance: 0, flowerChance: 0, snow: false, fog: 0xc8b0c8, waterColor: 0x8a6559, sky: 0x78a7ff },
  flower_forest: { id: "flower_forest", name: "Flower Forest", temp: 0.7, rain: 0.8, surface: 1, fill: 2, waterIce: false, tree: "birch", treeChance: 0.08, grassChance: 0.15, flowerChance: 0.28, snow: false, fog: 0xd0e0c8, waterColor: 0x3f76e4, sky: 0x78a7ff },
  meadow: { id: "meadow", name: "Meadow", temp: 0.5, rain: 0.8, surface: 1, fill: 2, waterIce: false, tree: "oak", treeChance: 0.02, grassChance: 0.3, flowerChance: 0.14, snow: false, fog: 0xd0e4c8, waterColor: 0x0e4ecf, sky: 0x7da3ff },
  beach: { id: "beach", name: "Beach", temp: 0.8, rain: 0.4, surface: 5, fill: 5, waterIce: false, tree: "none", treeChance: 0, grassChance: 0.01, flowerChance: 0, snow: false, fog: 0xd8d0b0, waterColor: 0x3f76e4, sky: 0x78a7ff },
  stony_shore: { id: "stony_shore", name: "Stony Shore", temp: 0.2, rain: 0.3, surface: 3, fill: 3, waterIce: false, tree: "none", treeChance: 0, grassChance: 0, flowerChance: 0, snow: false, fog: 0xb0b8c0, waterColor: 0x3f76e4, sky: 0x78a7ff },
  ice_spikes: { id: "ice_spikes", name: "Ice Spikes", temp: 0.0, rain: 0.5, surface: 75, fill: 2, waterIce: true, tree: "none", treeChance: 0, grassChance: 0, flowerChance: 0, snow: true, fog: 0xe0eef8, waterColor: 0x3938c9, sky: 0xd0e4f8 },
  pale_garden: { id: "pale_garden", name: "Pale Garden", temp: 0.7, rain: 0.8, surface: 1, fill: 2, waterIce: false, tree: "pale", treeChance: 0.14, grassChance: 0.08, flowerChance: 0.01, snow: false, fog: 0xa8b0a4, waterColor: 0x76889d, sky: 0x8a9aaa },
  sunflower_plains: { id: "sunflower_plains", name: "Sunflower Plains", temp: 0.8, rain: 0.4, surface: 1, fill: 2, waterIce: false, tree: "oak", treeChance: 0.008, grassChance: 0.22, flowerChance: 0.18, snow: false, fog: 0xc5d8ea, waterColor: 0x3f76e4, sky: 0x78a7ff },
  grove: { id: "grove", name: "Grove", temp: -0.2, rain: 0.8, surface: 75, fill: 2, waterIce: true, tree: "spruce", treeChance: 0.1, grassChance: 0.02, flowerChance: 0, snow: true, fog: 0xd8e8f0, waterColor: 0x3938c9, sky: 0xc8dcf0 },
  nether_wastes: { id: "nether_wastes", name: "Nether Wastes", temp: 2, rain: 0, surface: 30, fill: 30, waterIce: false, tree: "none", treeChance: 0, grassChance: 0, flowerChance: 0, snow: false, fog: 0x330808, waterColor: 0xe06818, sky: 0x330808 },
  crimson_forest: { id: "crimson_forest", name: "Crimson Forest", temp: 2, rain: 0, surface: 54, fill: 30, waterIce: false, tree: "crimson", treeChance: 0.12, grassChance: 0, flowerChance: 0, snow: false, fog: 0x330810, waterColor: 0xe06818, sky: 0x4a1018 },
  warped_forest: { id: "warped_forest", name: "Warped Forest", temp: 2, rain: 0, surface: 55, fill: 30, waterIce: false, tree: "warped", treeChance: 0.12, grassChance: 0, flowerChance: 0, snow: false, fog: 0x082028, waterColor: 0xe06818, sky: 0x082830 },
  soul_sand_valley: { id: "soul_sand_valley", name: "Soul Sand Valley", temp: 2, rain: 0, surface: 31, fill: 91, waterIce: false, tree: "none", treeChance: 0, grassChance: 0, flowerChance: 0, snow: false, fog: 0x1a1408, waterColor: 0xe06818, sky: 0x201808 },
  basalt_deltas: { id: "basalt_deltas", name: "Basalt Deltas", temp: 2, rain: 0, surface: 56, fill: 56, waterIce: false, tree: "none", treeChance: 0, grassChance: 0, flowerChance: 0, snow: false, fog: 0x1a1a1e, waterColor: 0xe06818, sky: 0x2a2a32 },
  the_end: { id: "the_end", name: "The End", temp: 0.5, rain: 0.5, surface: 34, fill: 34, waterIce: false, tree: "none", treeChance: 0, grassChance: 0, flowerChance: 0, snow: false, fog: 0x1b1529, waterColor: 0x161616, sky: 0x000000 },
  end_midlands: { id: "end_midlands", name: "End Midlands", temp: 0.5, rain: 0.5, surface: 34, fill: 34, waterIce: false, tree: "none", treeChance: 0, grassChance: 0, flowerChance: 0, snow: false, fog: 0x1b1529, waterColor: 0x161616, sky: 0x000000 },
  end_highlands: { id: "end_highlands", name: "End Highlands", temp: 0.5, rain: 0.5, surface: 34, fill: 34, waterIce: false, tree: "none", treeChance: 0.02, grassChance: 0, flowerChance: 0, snow: false, fog: 0x1b1529, waterColor: 0x161616, sky: 0x000000 },
};

export function pickOverworld(temp: number, rain: number, height: number, cont: number): BiomeId {
  if (cont < -0.28) {
    if (temp < 0.15) return "frozen_ocean";
    if (temp > 0.85) return "warm_ocean";
    return "ocean";
  }
  if (cont < -0.12) {
    if (temp < 0.2) return "stony_shore";
    return "beach";
  }
  if (height > 72) {
    if (temp < 0.2) return "snowy_peaks";
    return "mountains";
  }
  if (temp < 0.12) {
    if (rain > 0.55) return "snowy_taiga";
    if (rain > 0.35) return "grove";
    return "ice_spikes";
  }
  if (temp < 0.3) return rain > 0.5 ? "taiga" : "mountains";
  if (temp > 1.4) return rain < 0.25 ? (rain < 0.08 ? "badlands" : "desert") : "savanna";
  if (rain > 0.85 && temp > 0.8) return temp > 0.9 ? "jungle" : "bamboo_jungle";
  if (rain > 0.75 && temp < 0.85) {
    if (temp < 0.55) return "pale_garden";
    return rain > 0.9 ? "mangrove" : "swamp";
  }
  if (rain > 0.65) {
    if (temp > 0.75) return "flower_forest";
    if (temp < 0.55) return "cherry_grove";
    if (rain > 0.82) return "dark_forest";
    return temp < 0.65 ? "birch_forest" : "forest";
  }
  if (rain < 0.15 && temp > 0.9) return "mushroom";
  if (temp > 0.75 && rain < 0.5) return "sunflower_plains";
  if (temp > 0.45 && rain > 0.5 && rain < 0.7) return "meadow";
  return "plains";
}

export function pickNether(wx: number, wz: number, n: number): BiomeId {
  const t = (Math.sin(wx * 0.01 + n) + Math.cos(wz * 0.013 - n)) * 0.5 + 0.5;
  if (t < 0.2) return "soul_sand_valley";
  if (t < 0.4) return "basalt_deltas";
  if (t < 0.65) return "crimson_forest";
  if (t < 0.85) return "warped_forest";
  return "nether_wastes";
}

export const BIOME_LIST = Object.values(BIOMES);
