import type { BlockDef, BlockShape, ToolType } from "./types";

export const AIR = 0;
export const GRASS = 1;
export const DIRT = 2;
export const STONE = 3;
export const BEDROCK = 4;
export const SAND = 5;
export const WATER = 6;
export const LAVA = 7;
export const OAK_LOG = 8;
export const OAK_LEAVES = 9;
export const GRAVEL = 10;
export const COAL_ORE = 11;
export const IRON_ORE = 12;
export const GOLD_ORE = 13;
export const DIAMOND_ORE = 14;
export const REDSTONE_ORE = 15;
export const LAPIS_ORE = 16;
export const EMERALD_ORE = 17;
export const COBBLE = 18;
export const OAK_PLANKS = 19;
export const SNOW = 20;
export const ICE = 21;
export const CLAY = 22;
export const CACTUS = 23;
export const SUGAR_CANE = 24;
export const TALL_GRASS = 25;
export const DANDELION = 26;
export const POPPY = 27;
export const SANDSTONE = 28;
export const OBSIDIAN = 29;
export const NETHERRACK = 30;
export const SOUL_SAND = 31;
export const GLOWSTONE = 32;
export const NETHER_BRICKS = 33;
export const END_STONE = 34;
export const PURPUR = 35;
export const NETHER_PORTAL = 36;
export const END_PORTAL = 37;
export const CRAFTING_TABLE = 38;
export const FURNACE = 39;
export const CHEST = 40;
export const TNT = 41;
export const TORCH = 42;
export const GLASS = 43;
export const IRON_BLOCK = 44;
export const GOLD_BLOCK = 45;
export const DIAMOND_BLOCK = 46;
export const BOOKSHELF = 47;
export const BRICKS = 48;
export const PUMPKIN = 49;
export const MELON = 50;
export const MYCELIUM = 51;
export const PODZOL = 52;
export const MAGMA = 53;
export const CRIMSON_NYLIUM = 54;
export const WARPED_NYLIUM = 55;
export const BASALT = 56;
export const BLACKSTONE = 57;
export const SHROOMLIGHT = 58;
export const END_PORTAL_FRAME = 59;
export const DRAGON_EGG = 60;
export const DEEPSLATE = 61;
export const COPPER_ORE = 62;
export const AMETHYST = 63;
export const CALCITE = 64;
export const TUFF = 65;
export const MOSS = 66;
export const CHERRY_LOG = 67;
export const CHERRY_LEAVES = 68;
export const MANGROVE_LOG = 69;
export const BAMBOO = 70;
export const DRIPSTONE = 71;
export const SCULK = 72;
export const PACKED_ICE = 73;
export const BLUE_ICE = 74;
export const SNOW_BLOCK = 75;
export const FIRE = 76;
export const BIRCH_LOG = 77;
export const SPRUCE_LOG = 78;
export const JUNGLE_LOG = 79;
export const ACACIA_LOG = 80;
export const DARK_OAK_LOG = 81;
export const BIRCH_LEAVES = 82;
export const SPRUCE_LEAVES = 83;
export const JUNGLE_LEAVES = 84;
export const ACACIA_LEAVES = 85;
export const DARK_OAK_LEAVES = 86;
export const WARPED_STEM = 87;
export const CRIMSON_STEM = 88;
export const WARPED_WART = 89;
export const NETHER_WART_BLOCK = 90;
export const SOUL_SOIL = 91;
export const ANCIENT_DEBRIS = 92;
export const NETHERITE_BLOCK = 93;
export const SPAWNER = 94;
export const LILY = 95;
export const VINE = 96;
export const COBWEB = 97;
export const LADDER = 98;
export const FARMLAND = 99;
export const WHEAT = 100;
export const GLOW_LICHEN = 101;
export const HAY = 102;
export const TERRACOTTA = 103;
export const PRISMARINE = 104;
export const SEA_LANTERN = 105;
export const SPONGE = 106;
export const WET_SPONGE = 107;
export const BONE_BLOCK = 108;
export const QUARTZ_ORE = 109;
export const QUARTZ_BLOCK = 110;
export const RED_SAND = 111;
export const RED_SANDSTONE = 112;
export const ANDESITE = 113;
export const DIORITE = 114;
export const GRANITE = 115;
export const POLISHED_ANDESITE = 116;
export const POLISHED_DIORITE = 117;
export const POLISHED_GRANITE = 118;
export const SMOOTH_STONE = 119;
export const MOSSY_COBBLE = 120;
export const CRACKED_STONE = 121;
export const STONE_BRICKS = 122;
export const MOSSY_STONE_BRICKS = 123;
export const DEEPSLATE_BRICKS = 124;
export const COAL_BLOCK = 125;
export const LAPIS_BLOCK = 126;
export const REDSTONE_BLOCK = 127;
export const EMERALD_BLOCK = 128;
export const COPPER_BLOCK = 129;
export const RAW_IRON = 130;
export const RAW_GOLD = 131;
export const RAW_COPPER = 132;
export const PALE_OAK_LOG = 133;
export const PALE_LEAVES = 134;
export const MUSHROOM_STEM = 135;
export const RED_MUSHROOM_BLOCK = 136;
export const BROWN_MUSHROOM_BLOCK = 137;
export const ROSE_BUSH = 138;
export const CORNFLOWER = 139;
export const ALLIUM = 140;
export const AZURE_BLUET = 141;
export const OXEYE = 142;
export const LILY_OF_VALLEY = 143;
export const TORCHFLOWER = 144;
export const PINK_PETALS = 145;
export const DEAD_BUSH = 146;
export const FERN = 147;
export const LARGE_FERN = 148;
export const SEAGRASS = 149;
export const KELP = 150;
export const BRAIN_CORAL = 151;
export const FIRE_CORAL = 152;
export const HORN_CORAL = 153;
export const TUBE_CORAL = 154;
export const BUBBLE_CORAL = 155;
export const END_ROD = 156;
export const CHORUS_PLANT = 157;
export const CHORUS_FLOWER = 158;
export const PURPUR_PILLAR = 159;
export const END_STONE_BRICKS = 160;
export const OBSIDIAN_CRYING = 161;
export const RESPAWN_ANCHOR = 162;
export const LODESTONE = 163;
export const BELL = 164;
export const LANTERN = 165;
export const SOUL_LANTERN = 166;
export const CAMPFIRE = 167;
export const SOUL_CAMPFIRE = 168;
export const BARREL = 169;
export const SMOKER = 170;
export const BLAST_FURNACE = 171;
export const ANVIL = 172;
export const ENCHANTING = 173;
export const BREWING = 174;
export const CAULDRON = 175;
export const HOPPER = 176;
export const DISPENSER = 177;
export const DROPPER = 178;
export const OBSERVER = 179;
export const PISTON = 180;
export const STICKY_PISTON = 181;
export const SLIME_BLOCK = 182;
export const HONEY_BLOCK = 183;
export const HONEYCOMB_BLOCK = 184;
export const BEE_NEST = 185;
export const SCAFFOLD = 186;
export const TARGET = 187;
export const NOTE_BLOCK = 188;
export const JUKEBOX = 189;
export const REDSTONE_LAMP = 190;
export const DAYLIGHT = 191;
export const LEVER = 192;
export const STONE_BUTTON = 193;
export const OAK_DOOR = 194;
export const IRON_DOOR = 195;
export const OAK_TRAPDOOR = 196;
export const OAK_FENCE = 197;
export const OAK_GATE = 198;
export const GLASS_PANE = 199;
export const IRON_BARS = 200;
export const COMMAND_BLOCK = 201;

export const BLOCK_COUNT = 30000;
export const BLOCKS: BlockDef[] = new Array(BLOCK_COUNT);

type Style =
  | "air"
  | "stone"
  | "dirt"
  | "grass"
  | "sand"
  | "wood"
  | "plank"
  | "leaves"
  | "ore"
  | "metal"
  | "crystal"
  | "wool"
  | "glass"
  | "fluid"
  | "plant"
  | "nether"
  | "end"
  | "brick"
  | "fire"
  | "soil"
  | "ice"
  | "bone"
  | "sculk"
  | "coral";

interface Spec {
  key: string;
  name: string;
  style: Style;
  solid?: boolean;
  transparent?: boolean;
  cutout?: boolean;
  replaceable?: boolean;
  fluid?: 0 | 1 | 2;
  shape?: BlockShape;
  hardness?: number;
  tool?: ToolType;
  harvestLevel?: number;
  light?: number;
  flammable?: boolean;
  gravity?: boolean;
  tint?: number;
  tintTop?: number;
  drops?: number;
  dropCount?: number;
  category?: string;
  stack?: number;
}

function def(partial: Partial<BlockDef> & Pick<BlockDef, "id" | "key" | "name">): BlockDef {
  const solid = partial.solid ?? true;
  return {
    id: partial.id,
    key: partial.key,
    name: partial.name,
    solid,
    replaceable: partial.replaceable ?? false,
    transparent: partial.transparent ?? !solid,
    cutout: partial.cutout ?? false,
    fluid: partial.fluid ?? 0,
    shape: partial.shape ?? "cube",
    hardness: partial.hardness ?? 1.5,
    tool: partial.tool ?? "none",
    harvestLevel: partial.harvestLevel ?? 0,
    tex: partial.tex ?? 1,
    texTop: partial.texTop ?? partial.tex ?? 1,
    texBottom: partial.texBottom ?? partial.tex ?? 1,
    tint: partial.tint ?? 0xffffff,
    tintTop: partial.tintTop ?? partial.tint ?? 0xffffff,
    light: partial.light ?? 0,
    flammable: partial.flammable ?? false,
    gravity: partial.gravity ?? false,
    drops: partial.drops ?? partial.id,
    dropCount: partial.dropCount ?? 1,
    category: partial.category ?? "building",
    stack: partial.stack ?? 64,
  };
}

const ADJ = [
  "Verdant", "Ashen", "Azure", "Crimson", "Pale", "Dusky", "Gilded", "Silent",
  "Ancient", "Frosted", "Ember", "Mossy", "Sunlit", "Hollow", "Storm", "Ivory",
  "Obsidian", "Copper", "Jade", "Amber", "Violet", "Coral", "Marble", "Rusted",
  "Glacial", "Umbral", "Luminous", "Brine", "Saffron", "Cinder", "Pearl", "Onyx",
  "Cedar", "Willow", "Maple", "Pine", "Juniper", "Olive", "Teal", "Slate",
  "Sandworn", "Tide", "Canyon", "Summit", "Cavern", "Blooming", "Withered", "Primal",
  "Starlit", "Moonlit", "Solar", "Lunar", "Aether", "Abyssal", "Forge", "Rune",
  "Woven", "Carved", "Polished", "Cracked", "Chiseled", "Etched", "Gilded", "Inlaid",
  "Wild", "Tamed", "Feral", "Sacred", "Cursed", "Blessed", "Hidden", "Lost",
  "Northern", "Southern", "Eastern", "Western", "High", "Low", "Deep", "Shallow",
];

const NOUN = [
  "Schist", "Calcite", "Gabbro", "Gneiss", "Shale", "Flint", "Basalt", "Granite",
  "Diorite", "Andesite", "Limestone", "Sandstone", "Marble", "Quartzite", "Slate", "Tuff",
  "Pumice", "Obsidian", "Feldspar", "Mica", "Pyrite", "Malachite", "Azurite", "Cinnabar",
  "Gypsum", "Alabaster", "Jasper", "Agate", "Onyx", "Opal", "Topaz", "Garnet",
  "Tourmaline", "Beryl", "Spinel", "Peridot", "Zircon", "Moonstone", "Sunstone", "Lapis",
  "Cedar", "Ashwood", "Ironwood", "Driftwood", "Heartwood", "Bark", "Reed", "Thatch",
  "Wool", "Felt", "Linen", "Silk", "Hide", "Bone", "Ivory", "Horn",
  "Coral", "Sponge", "Kelp", "Moss", "Lichen", "Fungus", "Cap", "Mycelium",
  "Brick", "Tile", "Cobble", "Flagstone", "Pavers", "Clinker", "Adobe", "Daub",
  "Glass", "Crystal", "Prism", "Shard", "Lens", "Mirror", "Ice", "Rime",
  "Copper", "Tin", "Bronze", "Iron", "Steel", "Silver", "Electrum", "Lead",
  "Soot", "Ash", "Ember", "Cinder", "Coal", "Peat", "Tar", "Resin",
];

const FORM = [
  "Block", "Bricks", "Tiles", "Pillar", "Panel", "Lamp", "Ore", "Crystal",
  "Planks", "Leaves", "Glass", "Wool", "Concrete", "Terracotta", "Lantern", "Cluster",
  "Wall", "Slab", "Stairs", "Fence", "Door", "Trapdoor", "Button", "Pressure Plate",
];

const COLORS = [
  ["White", 0xf5f5f0], ["Light Gray", 0x9aa0a6], ["Gray", 0x4a4e54], ["Black", 0x1a1b1e],
  ["Brown", 0x6b4a2a], ["Red", 0xb43c32], ["Orange", 0xd87828], ["Yellow", 0xd8c04a],
  ["Lime", 0x7cbf3a], ["Green", 0x3d7a32], ["Cyan", 0x3aa0a8], ["Light Blue", 0x6ab4d8],
  ["Blue", 0x3a5cb0], ["Purple", 0x7a48a8], ["Magenta", 0xb04a8c], ["Pink", 0xe08aa8],
] as [string, number][];

function hueTint(h: number, s: number, l: number): number {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(c * 255);
  };
  return (f(0) << 16) | (f(8) << 8) | f(4);
}

function styleDefaults(style: Style): Partial<BlockDef> {
  switch (style) {
    case "air":
      return { solid: false, transparent: true, replaceable: true, hardness: 0, tool: "none" };
    case "stone":
      return { hardness: 1.5, tool: "pickaxe", category: "stone" };
    case "dirt":
    case "soil":
    case "sand":
      return { hardness: 0.5, tool: "shovel", category: "nature", gravity: style === "sand" };
    case "grass":
      return { hardness: 0.6, tool: "shovel", category: "nature" };
    case "wood":
      return { hardness: 2, tool: "axe", flammable: true, category: "wood" };
    case "plank":
      return { hardness: 2, tool: "axe", flammable: true, category: "wood" };
    case "leaves":
      return { hardness: 0.2, tool: "shears", cutout: true, transparent: true, flammable: true, solid: true, category: "nature" };
    case "ore":
      return { hardness: 3, tool: "pickaxe", harvestLevel: 1, category: "ore" };
    case "metal":
      return { hardness: 5, tool: "pickaxe", harvestLevel: 1, category: "metal" };
    case "crystal":
      return { hardness: 1.5, tool: "pickaxe", transparent: true, category: "crystal" };
    case "wool":
      return { hardness: 0.8, tool: "shears", flammable: true, category: "wool" };
    case "glass":
      return { hardness: 0.3, tool: "none", transparent: true, solid: true, category: "glass" };
    case "fluid":
      return { solid: false, transparent: true, replaceable: true, hardness: 100, shape: "fluid", category: "fluid" };
    case "plant":
      return { solid: false, cutout: true, transparent: true, replaceable: true, shape: "cross", hardness: 0, flammable: true, category: "plant" };
    case "nether":
      return { hardness: 0.4, tool: "pickaxe", category: "nether" };
    case "end":
      return { hardness: 3, tool: "pickaxe", category: "end" };
    case "brick":
      return { hardness: 2, tool: "pickaxe", category: "building" };
    case "fire":
      return { solid: false, cutout: true, transparent: true, replaceable: true, shape: "cross", light: 15, hardness: 0, category: "utility" };
    case "ice":
      return { hardness: 0.5, tool: "pickaxe", transparent: true, category: "nature" };
    case "bone":
      return { hardness: 2, tool: "pickaxe", category: "building" };
    case "sculk":
      return { hardness: 0.2, tool: "hoe", category: "sculk" };
    case "coral":
      return { hardness: 0, tool: "none", category: "ocean" };
    default:
      return { hardness: 1, category: "building" };
  }
}

function put(id: number, spec: Spec): BlockDef {
  const base = styleDefaults(spec.style);
  const b = def({
    id,
    key: spec.key,
    name: spec.name,
    ...base,
    solid: spec.solid ?? base.solid,
    transparent: spec.transparent ?? base.transparent,
    cutout: spec.cutout ?? base.cutout,
    replaceable: spec.replaceable ?? base.replaceable,
    fluid: spec.fluid ?? base.fluid,
    shape: spec.shape ?? base.shape,
    hardness: spec.hardness ?? base.hardness,
    tool: spec.tool ?? base.tool,
    harvestLevel: spec.harvestLevel ?? base.harvestLevel,
    light: spec.light ?? base.light,
    flammable: spec.flammable ?? base.flammable,
    gravity: spec.gravity ?? base.gravity,
    tint: spec.tint ?? 0xffffff,
    tintTop: spec.tintTop ?? spec.tint ?? 0xffffff,
    drops: spec.drops,
    dropCount: spec.dropCount,
    category: spec.category ?? base.category,
    stack: spec.stack,
    tex: id,
    texTop: id,
    texBottom: id,
  });
  BLOCKS[id] = b;
  return b;
}

export const CUSTOM_BLOCK_BASE = 28000;

export function registerCustomBlock(slot: number, name: string, tint = 0x88aa44): BlockDef {
  const id = CUSTOM_BLOCK_BASE + (slot % 64);
  const tile = 820 + (slot % 64);
  const b = def({
    id,
    key: `custom_${slot}`,
    name: (name || `Custom ${slot + 1}`).slice(0, 24),
    solid: true,
    hardness: 1.2,
    tool: "pickaxe",
    tint,
    tintTop: tint,
    category: "building",
    tex: tile,
    texTop: tile,
    texBottom: tile,
  });
  BLOCKS[id] = b;
  return b;
}

function buildCatalog() {
  const named: Spec[] = [
    { key: "air", name: "Air", style: "air" },
    { key: "grass", name: "Grass Block", style: "grass", tint: 0x866446, tintTop: 0x5a9a3c, drops: DIRT },
    { key: "dirt", name: "Dirt", style: "dirt", tint: 0x866446 },
    { key: "stone", name: "Stone", style: "stone", tint: 0x7a7a7a, drops: COBBLE },
    { key: "bedrock", name: "Bedrock", style: "stone", hardness: -1, tint: 0x2a2a32 },
    { key: "sand", name: "Sand", style: "sand", tint: 0xdbd09a, gravity: true },
    { key: "water", name: "Water", style: "fluid", fluid: 1, tint: 0x3a78c8 },
    { key: "lava", name: "Lava", style: "fluid", fluid: 2, light: 15, tint: 0xe06818 },
    { key: "oak_log", name: "Oak Log", style: "wood", tint: 0x6b5530, tintTop: 0x8a6a3a },
    { key: "oak_leaves", name: "Oak Leaves", style: "leaves", tint: 0x3d7a32 },
    { key: "gravel", name: "Gravel", style: "sand", tint: 0x83786e, gravity: true },
    { key: "coal_ore", name: "Coal Ore", style: "ore", tint: 0x2a2a2a, harvestLevel: 0 },
    { key: "iron_ore", name: "Iron Ore", style: "ore", tint: 0xc8b09a, harvestLevel: 1 },
    { key: "gold_ore", name: "Gold Ore", style: "ore", tint: 0xf0c832, harvestLevel: 2 },
    { key: "diamond_ore", name: "Diamond Ore", style: "ore", tint: 0x5adce6, harvestLevel: 2 },
    { key: "redstone_ore", name: "Redstone Ore", style: "ore", tint: 0xc42828, harvestLevel: 2, light: 4 },
    { key: "lapis_ore", name: "Lapis Ore", style: "ore", tint: 0x2a4ab4, harvestLevel: 1 },
    { key: "emerald_ore", name: "Emerald Ore", style: "ore", tint: 0x32c85a, harvestLevel: 2 },
    { key: "cobble", name: "Cobblestone", style: "stone", tint: 0x6e6e6e },
    { key: "oak_planks", name: "Oak Planks", style: "plank", tint: 0xb8945a },
    { key: "snow", name: "Snow Layer", style: "ice", solid: false, shape: "slab", tint: 0xf0f4f8, hardness: 0.1, tool: "shovel" },
    { key: "ice", name: "Ice", style: "ice", tint: 0xa8d4e8 },
    { key: "clay", name: "Clay", style: "soil", tint: 0x9aacb8, tool: "shovel" },
    { key: "cactus", name: "Cactus", style: "plant", solid: true, shape: "cube", cutout: true, tint: 0x3d8a3a, hardness: 0.4 },
    { key: "sugar_cane", name: "Sugar Cane", style: "plant", tint: 0x6bb04a },
    { key: "tall_grass", name: "Short Grass", style: "plant", tint: 0x5a9a3c },
    { key: "dandelion", name: "Dandelion", style: "plant", tint: 0xe8d24a },
    { key: "poppy", name: "Poppy", style: "plant", tint: 0xd43232 },
    { key: "sandstone", name: "Sandstone", style: "stone", tint: 0xd4c882, hardness: 0.8 },
    { key: "obsidian", name: "Obsidian", style: "stone", tint: 0x1a0a28, hardness: 50, harvestLevel: 3 },
    { key: "netherrack", name: "Netherrack", style: "nether", tint: 0x6a3030 },
    { key: "soul_sand", name: "Soul Sand", style: "nether", tint: 0x4a3a28, tool: "shovel" },
    { key: "glowstone", name: "Glowstone", style: "crystal", tint: 0xf0c84a, light: 15, hardness: 0.3 },
    { key: "nether_bricks", name: "Nether Bricks", style: "brick", tint: 0x3a1c1c },
    { key: "end_stone", name: "End Stone", style: "end", tint: 0xd8d8a0 },
    { key: "purpur", name: "Purpur Block", style: "end", tint: 0xb07aa8 },
    { key: "nether_portal", name: "Nether Portal", style: "glass", solid: false, transparent: true, light: 11, tint: 0x6a20c8, hardness: -1 },
    { key: "end_portal", name: "End Portal", style: "end", solid: false, light: 15, tint: 0x0a0a14, hardness: -1 },
    { key: "crafting_table", name: "Crafting Table", style: "plank", tint: 0x8a6230 },
    { key: "furnace", name: "Furnace", style: "stone", tint: 0x6a6a6a },
    { key: "chest", name: "Chest", style: "wood", tint: 0x8a6230 },
    { key: "tnt", name: "TNT", style: "wool", tint: 0xc43c32, hardness: 0, flammable: true },
    { key: "torch", name: "Torch", style: "plant", shape: "torch", light: 14, tint: 0xf0c84a, solid: false },
    { key: "glass", name: "Glass", style: "glass", tint: 0xc8e0f0 },
    { key: "iron_block", name: "Block of Iron", style: "metal", tint: 0xd0d4d8, harvestLevel: 1 },
    { key: "gold_block", name: "Block of Gold", style: "metal", tint: 0xf0c832, harvestLevel: 2 },
    { key: "diamond_block", name: "Block of Diamond", style: "crystal", tint: 0x5adce6, harvestLevel: 2, transparent: false },
    { key: "bookshelf", name: "Bookshelf", style: "plank", tint: 0x8a5a2a, flammable: true },
    { key: "bricks", name: "Bricks", style: "brick", tint: 0xa04a32 },
    { key: "pumpkin", name: "Pumpkin", style: "plant", solid: true, shape: "cube", cutout: false, tint: 0xe07818, hardness: 1, tool: "axe" },
    { key: "melon", name: "Melon", style: "plant", solid: true, shape: "cube", cutout: false, tint: 0x5aaa32, hardness: 1, tool: "axe" },
    { key: "mycelium", name: "Mycelium", style: "grass", tint: 0x6e5a6e, tintTop: 0x8a6e8a, tool: "shovel" },
    { key: "podzol", name: "Podzol", style: "grass", tint: 0x6b4a28, tintTop: 0x5a3a1a, tool: "shovel" },
    { key: "magma", name: "Magma Block", style: "nether", tint: 0xc05018, light: 3, hardness: 0.5 },
    { key: "crimson_nylium", name: "Crimson Nylium", style: "nether", tint: 0x7a2030, tintTop: 0xb43048 },
    { key: "warped_nylium", name: "Warped Nylium", style: "nether", tint: 0x1a6a5a, tintTop: 0x20a090 },
    { key: "basalt", name: "Basalt", style: "stone", tint: 0x3a3a42 },
    { key: "blackstone", name: "Blackstone", style: "stone", tint: 0x2a2a32 },
    { key: "shroomlight", name: "Shroomlight", style: "nether", tint: 0xf0a05a, light: 15 },
    { key: "end_portal_frame", name: "End Portal Frame", style: "end", tint: 0x3a6a4a, hardness: -1 },
    { key: "dragon_egg", name: "Dragon Egg", style: "end", tint: 0x1a0a28, light: 1, hardness: 3, gravity: true },
    { key: "deepslate", name: "Deepslate", style: "stone", tint: 0x4a4a52, hardness: 3, drops: DEEPSLATE },
    { key: "copper_ore", name: "Copper Ore", style: "ore", tint: 0xc86a3a, harvestLevel: 1 },
    { key: "amethyst", name: "Amethyst Block", style: "crystal", tint: 0x9a5ac8, light: 0 },
    { key: "calcite", name: "Calcite", style: "stone", tint: 0xe8e4dc, hardness: 0.75 },
    { key: "tuff", name: "Tuff", style: "stone", tint: 0x6e6a62 },
    { key: "moss", name: "Moss Block", style: "soil", tint: 0x4a8a3a, tool: "hoe", hardness: 0.1 },
    { key: "cherry_log", name: "Cherry Log", style: "wood", tint: 0x5a3a3a, tintTop: 0xd8a0ae },
    { key: "cherry_leaves", name: "Cherry Leaves", style: "leaves", tint: 0xf0b0c4 },
    { key: "mangrove_log", name: "Mangrove Log", style: "wood", tint: 0x5a2a22 },
    { key: "bamboo", name: "Bamboo", style: "plant", tint: 0x6ab03a },
    { key: "dripstone", name: "Dripstone Block", style: "stone", tint: 0x8a6a5a },
    { key: "sculk", name: "Sculk", style: "sculk", tint: 0x0a2a32 },
    { key: "packed_ice", name: "Packed Ice", style: "ice", tint: 0x90c4e0, transparent: false },
    { key: "blue_ice", name: "Blue Ice", style: "ice", tint: 0x5aa0d0, transparent: false },
    { key: "snow_block", name: "Snow Block", style: "ice", tint: 0xf2f6fa, tool: "shovel", transparent: false },
    { key: "fire", name: "Fire", style: "fire", tint: 0xf07818 },
    { key: "birch_log", name: "Birch Log", style: "wood", tint: 0xd8d0c0, tintTop: 0xc8b882 },
    { key: "spruce_log", name: "Spruce Log", style: "wood", tint: 0x3a2a1a },
    { key: "jungle_log", name: "Jungle Log", style: "wood", tint: 0x5a3a18 },
    { key: "acacia_log", name: "Acacia Log", style: "wood", tint: 0x6a6a6a, tintTop: 0xb86a3a },
    { key: "dark_oak_log", name: "Dark Oak Log", style: "wood", tint: 0x2a1a10 },
    { key: "birch_leaves", name: "Birch Leaves", style: "leaves", tint: 0x78b450 },
    { key: "spruce_leaves", name: "Spruce Leaves", style: "leaves", tint: 0x2a5a32 },
    { key: "jungle_leaves", name: "Jungle Leaves", style: "leaves", tint: 0x3a8a28 },
    { key: "acacia_leaves", name: "Acacia Leaves", style: "leaves", tint: 0x72a03a },
    { key: "dark_oak_leaves", name: "Dark Oak Leaves", style: "leaves", tint: 0x2a5a1a },
    { key: "warped_stem", name: "Warped Stem", style: "wood", tint: 0x2a6a68, flammable: false },
    { key: "crimson_stem", name: "Crimson Stem", style: "wood", tint: 0x6a2030, flammable: false },
    { key: "warped_wart", name: "Warped Wart Block", style: "nether", tint: 0x14a090 },
    { key: "nether_wart_block", name: "Nether Wart Block", style: "nether", tint: 0x7a1020 },
    { key: "soul_soil", name: "Soul Soil", style: "nether", tint: 0x4a3220, tool: "shovel" },
    { key: "ancient_debris", name: "Ancient Debris", style: "metal", tint: 0x5a3a32, hardness: 30, harvestLevel: 3 },
    { key: "netherite_block", name: "Block of Netherite", style: "metal", tint: 0x3a2a28, hardness: 50, harvestLevel: 3 },
    { key: "spawner", name: "Monster Spawner", style: "metal", tint: 0x2a3a3a, transparent: true, hardness: 5 },
    { key: "lily", name: "Lily Pad", style: "plant", shape: "slab", tint: 0x3a8a32 },
    { key: "vine", name: "Vines", style: "plant", tint: 0x3a7a32 },
    { key: "cobweb", name: "Cobweb", style: "plant", tint: 0xe8e8e8, tool: "shears" },
    { key: "ladder", name: "Ladder", style: "plant", tint: 0x8a6230 },
    { key: "farmland", name: "Farmland", style: "dirt", tint: 0x6b4a28, tool: "shovel" },
    { key: "wheat", name: "Wheat Crops", style: "plant", tint: 0xc8b04a },
    { key: "glow_lichen", name: "Glow Lichen", style: "plant", tint: 0x8ab89a, light: 7 },
    { key: "hay", name: "Hay Bale", style: "plank", tint: 0xd0b03a, flammable: true, hardness: 0.5 },
    { key: "terracotta", name: "Terracotta", style: "brick", tint: 0x9a6a50, hardness: 1.25 },
    { key: "prismarine", name: "Prismarine", style: "stone", tint: 0x5aaa9a },
    { key: "sea_lantern", name: "Sea Lantern", style: "crystal", tint: 0xd0e8d8, light: 15 },
    { key: "sponge", name: "Sponge", style: "soil", tint: 0xd0c04a, hardness: 0.6 },
    { key: "wet_sponge", name: "Wet Sponge", style: "soil", tint: 0xa0a03a, hardness: 0.6 },
    { key: "bone_block", name: "Bone Block", style: "bone", tint: 0xe8e0c8 },
    { key: "quartz_ore", name: "Nether Quartz Ore", style: "ore", tint: 0xe8e0d8, category: "nether" },
    { key: "quartz_block", name: "Block of Quartz", style: "stone", tint: 0xf0ece4 },
    { key: "red_sand", name: "Red Sand", style: "sand", tint: 0xc06a32, gravity: true },
    { key: "red_sandstone", name: "Red Sandstone", style: "stone", tint: 0xc06a32, hardness: 0.8 },
    { key: "andesite", name: "Andesite", style: "stone", tint: 0x7a7a76 },
    { key: "diorite", name: "Diorite", style: "stone", tint: 0xc8c8c4 },
    { key: "granite", name: "Granite", style: "stone", tint: 0x9a6a52 },
    { key: "polished_andesite", name: "Polished Andesite", style: "stone", tint: 0x7a7a76 },
    { key: "polished_diorite", name: "Polished Diorite", style: "stone", tint: 0xc8c8c4 },
    { key: "polished_granite", name: "Polished Granite", style: "stone", tint: 0x9a6a52 },
    { key: "smooth_stone", name: "Smooth Stone", style: "stone", tint: 0x9a9a9a },
    { key: "mossy_cobble", name: "Mossy Cobblestone", style: "stone", tint: 0x5a7a4a },
    { key: "cracked_stone", name: "Cracked Stone Bricks", style: "brick", tint: 0x6e6e6e },
    { key: "stone_bricks", name: "Stone Bricks", style: "brick", tint: 0x787878 },
    { key: "mossy_stone_bricks", name: "Mossy Stone Bricks", style: "brick", tint: 0x5a7a4a },
    { key: "deepslate_bricks", name: "Deepslate Bricks", style: "brick", tint: 0x4a4a52, hardness: 3.5 },
    { key: "coal_block", name: "Block of Coal", style: "stone", tint: 0x1a1a1a, flammable: true },
    { key: "lapis_block", name: "Block of Lapis", style: "stone", tint: 0x1e3aa0 },
    { key: "redstone_block", name: "Block of Redstone", style: "metal", tint: 0xb42020, light: 0 },
    { key: "emerald_block", name: "Block of Emerald", style: "crystal", tint: 0x2ad05a, transparent: false },
    { key: "copper_block", name: "Block of Copper", style: "metal", tint: 0xc86a3a },
    { key: "raw_iron", name: "Raw Iron Block", style: "metal", tint: 0xc8b09a },
    { key: "raw_gold", name: "Raw Gold Block", style: "metal", tint: 0xf0c832 },
    { key: "raw_copper", name: "Raw Copper Block", style: "metal", tint: 0xc86a3a },
    { key: "pale_oak_log", name: "Pale Oak Log", style: "wood", tint: 0xc8c0b4 },
    { key: "pale_leaves", name: "Pale Oak Leaves", style: "leaves", tint: 0x9aaa90 },
    { key: "mushroom_stem", name: "Mushroom Stem", style: "wood", tint: 0xc8c0b4, flammable: false },
    { key: "red_mushroom_block", name: "Red Mushroom Block", style: "wool", tint: 0xc43030, flammable: false },
    { key: "brown_mushroom_block", name: "Brown Mushroom Block", style: "wool", tint: 0x8a6230, flammable: false },
    { key: "rose_bush", name: "Rose Bush", style: "plant", tint: 0xc42838 },
    { key: "cornflower", name: "Cornflower", style: "plant", tint: 0x4a78d0 },
    { key: "allium", name: "Allium", style: "plant", tint: 0xc878d0 },
    { key: "azure_bluet", name: "Azure Bluet", style: "plant", tint: 0xe8e8e0 },
    { key: "oxeye", name: "Oxeye Daisy", style: "plant", tint: 0xf0f0e0 },
    { key: "lily_of_valley", name: "Lily of the Valley", style: "plant", tint: 0xf8f8f8 },
    { key: "torchflower", name: "Torchflower", style: "plant", tint: 0xe07828 },
    { key: "pink_petals", name: "Pink Petals", style: "plant", tint: 0xf0b0c4 },
    { key: "dead_bush", name: "Dead Bush", style: "plant", tint: 0x8a6a3a },
    { key: "fern", name: "Fern", style: "plant", tint: 0x3a7a32 },
    { key: "large_fern", name: "Large Fern", style: "plant", tint: 0x3a7a32 },
    { key: "seagrass", name: "Seagrass", style: "plant", tint: 0x3a8a6a },
    { key: "kelp", name: "Kelp", style: "plant", tint: 0x3a7a48 },
    { key: "brain_coral", name: "Brain Coral", style: "coral", tint: 0xe08aa8, solid: true, shape: "cube" },
    { key: "fire_coral", name: "Fire Coral", style: "coral", tint: 0xc43030, solid: true, shape: "cube" },
    { key: "horn_coral", name: "Horn Coral", style: "coral", tint: 0xd0c04a, solid: true, shape: "cube" },
    { key: "tube_coral", name: "Tube Coral", style: "coral", tint: 0x3a6ac8, solid: true, shape: "cube" },
    { key: "bubble_coral", name: "Bubble Coral", style: "coral", tint: 0xb04ac8, solid: true, shape: "cube" },
    { key: "end_rod", name: "End Rod", style: "end", shape: "torch", solid: false, light: 14, tint: 0xf0e8f8 },
    { key: "chorus_plant", name: "Chorus Plant", style: "end", tint: 0x6a4a6a, solid: true, transparent: true, cutout: true },
    { key: "chorus_flower", name: "Chorus Flower", style: "end", tint: 0x8a6a8a, solid: true },
    { key: "purpur_pillar", name: "Purpur Pillar", style: "end", tint: 0xb07aa8 },
    { key: "end_stone_bricks", name: "End Stone Bricks", style: "brick", tint: 0xd8d8a0, category: "end" },
    { key: "crying_obsidian", name: "Crying Obsidian", style: "stone", tint: 0x2a0a48, light: 10, hardness: 50, harvestLevel: 3 },
    { key: "respawn_anchor", name: "Respawn Anchor", style: "nether", tint: 0x4a2058, light: 5, hardness: 50 },
    { key: "lodestone", name: "Lodestone", style: "metal", tint: 0x6a6a72 },
    { key: "bell", name: "Bell", style: "metal", tint: 0xf0c832 },
    { key: "lantern", name: "Lantern", style: "metal", shape: "torch", solid: false, light: 15, tint: 0xf0c84a },
    { key: "soul_lantern", name: "Soul Lantern", style: "metal", shape: "torch", solid: false, light: 10, tint: 0x5adce6 },
    { key: "campfire", name: "Campfire", style: "wood", light: 15, tint: 0x8a6230 },
    { key: "soul_campfire", name: "Soul Campfire", style: "wood", light: 10, tint: 0x4a3a28 },
    { key: "barrel", name: "Barrel", style: "wood", tint: 0x6b5530 },
    { key: "smoker", name: "Smoker", style: "stone", tint: 0x5a5a5a },
    { key: "blast_furnace", name: "Blast Furnace", style: "stone", tint: 0x4a4a52 },
    { key: "anvil", name: "Anvil", style: "metal", tint: 0x6a6a6a, hardness: 5, gravity: true },
    { key: "enchanting", name: "Enchanting Table", style: "end", tint: 0x4a2060, light: 7 },
    { key: "brewing", name: "Brewing Stand", style: "metal", tint: 0x6a6a6a, solid: false },
    { key: "cauldron", name: "Cauldron", style: "metal", tint: 0x3a3a3a },
    { key: "hopper", name: "Hopper", style: "metal", tint: 0x4a4a4a },
    { key: "dispenser", name: "Dispenser", style: "stone", tint: 0x5a5a5a },
    { key: "dropper", name: "Dropper", style: "stone", tint: 0x5a5a5a },
    { key: "observer", name: "Observer", style: "stone", tint: 0x4a4a52 },
    { key: "piston", name: "Piston", style: "stone", tint: 0x6a6a5a },
    { key: "sticky_piston", name: "Sticky Piston", style: "stone", tint: 0x6a8a4a },
    { key: "slime_block", name: "Slime Block", style: "glass", tint: 0x6ac84a },
    { key: "honey_block", name: "Honey Block", style: "glass", tint: 0xe0a018 },
    { key: "honeycomb_block", name: "Honeycomb Block", style: "brick", tint: 0xe0a018 },
    { key: "bee_nest", name: "Bee Nest", style: "wood", tint: 0xd0b04a },
    { key: "scaffold", name: "Scaffolding", style: "wood", transparent: true, tint: 0xd0b04a },
    { key: "target", name: "Target", style: "wool", tint: 0xe0d0c8 },
    { key: "note_block", name: "Note Block", style: "wood", tint: 0x6b5530 },
    { key: "jukebox", name: "Jukebox", style: "wood", tint: 0x5a3a28 },
    { key: "redstone_lamp", name: "Redstone Lamp", style: "crystal", tint: 0x8a6a3a, light: 0 },
    { key: "daylight", name: "Daylight Detector", style: "wood", tint: 0x6b5530 },
    { key: "lever", name: "Lever", style: "plant", tint: 0x8a8a8a },
    { key: "stone_button", name: "Stone Button", style: "stone", solid: false, tint: 0x7a7a7a },
    { key: "oak_door", name: "Oak Door", style: "wood", transparent: true, tint: 0xb8945a },
    { key: "iron_door", name: "Iron Door", style: "metal", transparent: true, tint: 0xd0d4d8 },
    { key: "oak_trapdoor", name: "Oak Trapdoor", style: "wood", transparent: true, tint: 0xb8945a },
    { key: "oak_fence", name: "Oak Fence", style: "wood", transparent: true, tint: 0xb8945a },
    { key: "oak_gate", name: "Oak Fence Gate", style: "wood", transparent: true, tint: 0xb8945a },
    { key: "glass_pane", name: "Glass Pane", style: "glass", shape: "pane", tint: 0xc8e0f0 },
    { key: "iron_bars", name: "Iron Bars", style: "metal", shape: "pane", transparent: true, tint: 0x8a8a8a },
    { key: "command_block", name: "Command Block", style: "metal", tint: 0xc46a32, hardness: -1, light: 4, category: "utility" },
    { key: "exposed_copper", name: "Exposed Copper", style: "metal", tint: 0xb07a52, harvestLevel: 1 },
    { key: "weathered_copper", name: "Weathered Copper", style: "metal", tint: 0x5a8a62, harvestLevel: 1 },
    { key: "oxidized_copper", name: "Oxidized Copper", style: "metal", tint: 0x3a8a78, harvestLevel: 1 },
    { key: "cut_copper", name: "Cut Copper", style: "metal", tint: 0xc86a3a, harvestLevel: 1 },
    { key: "exposed_cut_copper", name: "Exposed Cut Copper", style: "metal", tint: 0xb07a52, harvestLevel: 1 },
    { key: "weathered_cut_copper", name: "Weathered Cut Copper", style: "metal", tint: 0x5a8a62, harvestLevel: 1 },
    { key: "oxidized_cut_copper", name: "Oxidized Cut Copper", style: "metal", tint: 0x3a8a78, harvestLevel: 1 },
    { key: "chiseled_copper", name: "Chiseled Copper", style: "metal", tint: 0xc86a3a, harvestLevel: 1 },
    { key: "copper_grate", name: "Copper Grate", style: "metal", transparent: true, tint: 0xc86a3a, harvestLevel: 1 },
    { key: "copper_bulb", name: "Copper Bulb", style: "metal", tint: 0xc86a3a, light: 8, harvestLevel: 1 },
    { key: "copper_door", name: "Copper Door", style: "metal", transparent: true, tint: 0xc86a3a },
    { key: "copper_trapdoor", name: "Copper Trapdoor", style: "metal", transparent: true, tint: 0xc86a3a },
    { key: "copper_chest", name: "Copper Chest", style: "metal", tint: 0xc86a3a },
    { key: "waxed_copper", name: "Waxed Copper", style: "metal", tint: 0xc86a3a, harvestLevel: 1 },
    { key: "waxed_exposed_copper", name: "Waxed Exposed Copper", style: "metal", tint: 0xb07a52, harvestLevel: 1 },
    { key: "waxed_weathered_copper", name: "Waxed Weathered Copper", style: "metal", tint: 0x5a8a62, harvestLevel: 1 },
    { key: "waxed_oxidized_copper", name: "Waxed Oxidized Copper", style: "metal", tint: 0x3a8a78, harvestLevel: 1 },
    { key: "waxed_cut_copper", name: "Waxed Cut Copper", style: "metal", tint: 0xc86a3a, harvestLevel: 1 },
    { key: "waxed_chiseled_copper", name: "Waxed Chiseled Copper", style: "metal", tint: 0xc86a3a, harvestLevel: 1 },
    { key: "waxed_copper_grate", name: "Waxed Copper Grate", style: "metal", transparent: true, tint: 0xc86a3a },
    { key: "waxed_copper_bulb", name: "Waxed Copper Bulb", style: "metal", tint: 0xc86a3a, light: 8 },
    { key: "lightning_rod", name: "Lightning Rod", style: "metal", shape: "torch", solid: false, tint: 0xc86a3a },
    { key: "chain", name: "Chain", style: "metal", shape: "torch", solid: false, tint: 0x6a6a72 },
    { key: "tuff_bricks", name: "Tuff Bricks", style: "brick", tint: 0x6e6a62 },
    { key: "chiseled_tuff", name: "Chiseled Tuff", style: "stone", tint: 0x6e6a62 },
    { key: "chiseled_tuff_bricks", name: "Chiseled Tuff Bricks", style: "brick", tint: 0x6e6a62 },
    { key: "polished_tuff", name: "Polished Tuff", style: "stone", tint: 0x7a766e },
    { key: "pale_moss", name: "Pale Moss Block", style: "soil", tint: 0xb8c0a8, tool: "hoe" },
    { key: "pale_moss_carpet", name: "Pale Moss Carpet", style: "soil", shape: "slab", tint: 0xb8c0a8, tool: "hoe" },
    { key: "pale_hanging_moss", name: "Pale Hanging Moss", style: "plant", tint: 0xb8c0a8 },
    { key: "closed_eyeblossom", name: "Closed Eyeblossom", style: "plant", tint: 0x6a6a52 },
    { key: "open_eyeblossom", name: "Open Eyeblossom", style: "plant", tint: 0xe0c04a },
    { key: "creaking_heart", name: "Creaking Heart", style: "wood", tint: 0x6a3a28, light: 4 },
    { key: "resin_block", name: "Block of Resin", style: "crystal", tint: 0xe07828, transparent: false },
    { key: "resin_bricks", name: "Resin Bricks", style: "brick", tint: 0xd06820 },
    { key: "chiseled_resin_bricks", name: "Chiseled Resin Bricks", style: "brick", tint: 0xd06820 },
    { key: "resin_clump", name: "Resin Clump", style: "plant", tint: 0xe07828 },
    { key: "trial_spawner", name: "Trial Spawner", style: "metal", tint: 0x4a6a7a, light: 4, hardness: -1 },
    { key: "vault", name: "Vault", style: "metal", tint: 0x6a5a3a, hardness: -1, light: 2 },
    { key: "ominous_vault", name: "Ominous Vault", style: "metal", tint: 0x3a2a48, hardness: -1, light: 3 },
    { key: "crafter", name: "Crafter", style: "stone", tint: 0x6a6a62 },
    { key: "heavy_core", name: "Heavy Core", style: "metal", tint: 0x4a4a52, hardness: 10, harvestLevel: 3 },
    { key: "deepslate_coal_ore", name: "Deepslate Coal Ore", style: "ore", tint: 0x2a2a2a, harvestLevel: 0, hardness: 4.5 },
    { key: "deepslate_iron_ore", name: "Deepslate Iron Ore", style: "ore", tint: 0xc8b09a, harvestLevel: 1, hardness: 4.5 },
    { key: "deepslate_gold_ore", name: "Deepslate Gold Ore", style: "ore", tint: 0xf0c832, harvestLevel: 2, hardness: 4.5 },
    { key: "deepslate_diamond_ore", name: "Deepslate Diamond Ore", style: "ore", tint: 0x5adce6, harvestLevel: 2, hardness: 4.5 },
    { key: "deepslate_redstone_ore", name: "Deepslate Redstone Ore", style: "ore", tint: 0xc42828, harvestLevel: 2, hardness: 4.5, light: 4 },
    { key: "deepslate_lapis_ore", name: "Deepslate Lapis Ore", style: "ore", tint: 0x2a4ab4, harvestLevel: 1, hardness: 4.5 },
    { key: "deepslate_emerald_ore", name: "Deepslate Emerald Ore", style: "ore", tint: 0x32c85a, harvestLevel: 2, hardness: 4.5 },
    { key: "deepslate_copper_ore", name: "Deepslate Copper Ore", style: "ore", tint: 0xc86a3a, harvestLevel: 1, hardness: 4.5 },
    { key: "nether_gold_ore", name: "Nether Gold Ore", style: "nether", tint: 0xf0c832, harvestLevel: 0 },
    { key: "stripped_oak_log", name: "Stripped Oak Log", style: "wood", tint: 0xc8a05a, tintTop: 0xd4b06a },
    { key: "stripped_birch_log", name: "Stripped Birch Log", style: "wood", tint: 0xe8d8a0, tintTop: 0xf0e8c0 },
    { key: "stripped_spruce_log", name: "Stripped Spruce Log", style: "wood", tint: 0x8a6a48, tintTop: 0x9a7a58 },
    { key: "stripped_jungle_log", name: "Stripped Jungle Log", style: "wood", tint: 0xc08a48, tintTop: 0xd09a58 },
    { key: "stripped_acacia_log", name: "Stripped Acacia Log", style: "wood", tint: 0xd87848, tintTop: 0xe08858 },
    { key: "stripped_dark_oak_log", name: "Stripped Dark Oak Log", style: "wood", tint: 0x4a3a28, tintTop: 0x5a4a38 },
    { key: "stripped_mangrove_log", name: "Stripped Mangrove Log", style: "wood", tint: 0x8a4a42, tintTop: 0x9a5a52 },
    { key: "stripped_cherry_log", name: "Stripped Cherry Log", style: "wood", tint: 0xe8b0b8, tintTop: 0xf0c0c8 },
    { key: "stripped_pale_oak_log", name: "Stripped Pale Oak Log", style: "wood", tint: 0xd8d0c4, tintTop: 0xe8e0d4 },
    { key: "stripped_bamboo_block", name: "Stripped Bamboo Block", style: "wood", tint: 0xd8c05a },
    { key: "bamboo_block", name: "Bamboo Block", style: "wood", tint: 0xc8b04a },
    { key: "bamboo_mosaic", name: "Bamboo Mosaic", style: "plank", tint: 0xd0b84a },
    { key: "oak_wood", name: "Oak Wood", style: "wood", tint: 0x6b5530 },
    { key: "birch_wood", name: "Birch Wood", style: "wood", tint: 0xd8c888 },
    { key: "spruce_wood", name: "Spruce Wood", style: "wood", tint: 0x6b5530 },
    { key: "jungle_wood", name: "Jungle Wood", style: "wood", tint: 0xb07a3a },
    { key: "acacia_wood", name: "Acacia Wood", style: "wood", tint: 0xc86a3a },
    { key: "dark_oak_wood", name: "Dark Oak Wood", style: "wood", tint: 0x3a2a18 },
    { key: "mangrove_wood", name: "Mangrove Wood", style: "wood", tint: 0x7a3a32 },
    { key: "cherry_wood", name: "Cherry Wood", style: "wood", tint: 0xd8a0ae },
    { key: "pale_oak_wood", name: "Pale Oak Wood", style: "wood", tint: 0xc8c0b4 },
    { key: "crimson_hyphae", name: "Crimson Hyphae", style: "nether", tint: 0x6a2030 },
    { key: "warped_hyphae", name: "Warped Hyphae", style: "nether", tint: 0x2a6a68 },
    { key: "stripped_crimson_hyphae", name: "Stripped Crimson Hyphae", style: "nether", tint: 0x8a3040 },
    { key: "stripped_warped_hyphae", name: "Stripped Warped Hyphae", style: "nether", tint: 0x3a8a88 },
    { key: "ochre_froglight", name: "Ochre Froglight", style: "crystal", tint: 0xf0c84a, light: 15, hardness: 0.3 },
    { key: "verdant_froglight", name: "Verdant Froglight", style: "crystal", tint: 0x7cc84a, light: 15, hardness: 0.3 },
    { key: "pearlescent_froglight", name: "Pearlescent Froglight", style: "crystal", tint: 0xd8a0d8, light: 15, hardness: 0.3 },
    { key: "sculk_sensor", name: "Sculk Sensor", style: "sculk", tint: 0x0a3a42, light: 1 },
    { key: "calibrated_sculk_sensor", name: "Calibrated Sculk Sensor", style: "sculk", tint: 0x1a6a8a, light: 1 },
    { key: "sculk_shrieker", name: "Sculk Shrieker", style: "sculk", tint: 0x0a2a32 },
    { key: "sculk_catalyst", name: "Sculk Catalyst", style: "sculk", tint: 0x0a4a3a, light: 6 },
    { key: "sculk_vein", name: "Sculk Vein", style: "sculk", shape: "slab", solid: false, tint: 0x0a3a42 },
    { key: "reinforced_deepslate", name: "Reinforced Deepslate", style: "stone", tint: 0x3a3a42, hardness: -1 },
    { key: "gilded_blackstone", name: "Gilded Blackstone", style: "stone", tint: 0xf0c832 },
    { key: "polished_blackstone", name: "Polished Blackstone", style: "stone", tint: 0x2a2a32 },
    { key: "chiseled_polished_blackstone", name: "Chiseled Polished Blackstone", style: "stone", tint: 0x2a2a32 },
    { key: "polished_blackstone_bricks", name: "Polished Blackstone Bricks", style: "brick", tint: 0x2a2a32 },
    { key: "cracked_polished_blackstone_bricks", name: "Cracked Polished Blackstone Bricks", style: "brick", tint: 0x2a2a32 },
    { key: "chiseled_nether_bricks", name: "Chiseled Nether Bricks", style: "brick", tint: 0x3a1c1c },
    { key: "cracked_nether_bricks", name: "Cracked Nether Bricks", style: "brick", tint: 0x3a1c1c },
    { key: "red_nether_bricks", name: "Red Nether Bricks", style: "brick", tint: 0x5a1020 },
    { key: "soul_torch", name: "Soul Torch", style: "plant", shape: "torch", light: 10, tint: 0x5adce6, solid: false },
    { key: "soul_fire", name: "Soul Fire", style: "fire", tint: 0x5adce6 },
    { key: "weeping_vines", name: "Weeping Vines", style: "plant", tint: 0x8a2030 },
    { key: "twisting_vines", name: "Twisting Vines", style: "plant", tint: 0x20a090 },
    { key: "nether_sprouts", name: "Nether Sprouts", style: "plant", tint: 0x20a090 },
    { key: "crimson_fungus", name: "Crimson Fungus", style: "plant", tint: 0xb43048 },
    { key: "warped_fungus", name: "Warped Fungus", style: "plant", tint: 0x20a090 },
    { key: "crimson_roots", name: "Crimson Roots", style: "plant", tint: 0xb43048 },
    { key: "warped_roots", name: "Warped Roots", style: "plant", tint: 0x20a090 },
    { key: "nether_wart_crop", name: "Nether Wart", style: "plant", tint: 0x8a2030 },
    { key: "smooth_basalt", name: "Smooth Basalt", style: "stone", tint: 0x3a3a42 },
    { key: "polished_basalt", name: "Polished Basalt", style: "stone", tint: 0x4a4a52 },
    { key: "quartz_pillar", name: "Quartz Pillar", style: "stone", tint: 0xf0ece4 },
    { key: "quartz_bricks", name: "Quartz Bricks", style: "brick", tint: 0xf0ece4 },
    { key: "chiseled_quartz", name: "Chiseled Quartz Block", style: "stone", tint: 0xf0ece4 },
    { key: "smooth_quartz", name: "Smooth Quartz", style: "stone", tint: 0xf8f4ec },
    { key: "cut_sandstone", name: "Cut Sandstone", style: "stone", tint: 0xd4c882 },
    { key: "chiseled_sandstone", name: "Chiseled Sandstone", style: "stone", tint: 0xd4c882 },
    { key: "smooth_sandstone", name: "Smooth Sandstone", style: "stone", tint: 0xe0d492 },
    { key: "cut_red_sandstone", name: "Cut Red Sandstone", style: "stone", tint: 0xc06a32 },
    { key: "chiseled_red_sandstone", name: "Chiseled Red Sandstone", style: "stone", tint: 0xc06a32 },
    { key: "smooth_red_sandstone", name: "Smooth Red Sandstone", style: "stone", tint: 0xd07a42 },
    { key: "prismarine_bricks", name: "Prismarine Bricks", style: "brick", tint: 0x5aaa9a },
    { key: "dark_prismarine", name: "Dark Prismarine", style: "stone", tint: 0x2a6a5a },
    { key: "sea_pickle", name: "Sea Pickle", style: "plant", light: 6, tint: 0x6a8a3a },
    { key: "turtle_egg", name: "Turtle Egg", style: "bone", tint: 0xe8e0c8, hardness: 0.5 },
    { key: "sniffer_egg", name: "Sniffer Egg", style: "bone", tint: 0xc45c4a, hardness: 0.5 },
    { key: "frogspawn", name: "Frogspawn", style: "plant", tint: 0x6a8a4a },
    { key: "decorated_pot", name: "Decorated Pot", style: "brick", tint: 0xa04a32 },
    { key: "suspicious_sand", name: "Suspicious Sand", style: "sand", tint: 0xd4c882, gravity: true },
    { key: "suspicious_gravel", name: "Suspicious Gravel", style: "sand", tint: 0x83786e, gravity: true },
    { key: "mud", name: "Mud", style: "soil", tint: 0x4a3a32, tool: "shovel" },
    { key: "packed_mud", name: "Packed Mud", style: "soil", tint: 0x6a4a3a },
    { key: "mud_bricks", name: "Mud Bricks", style: "brick", tint: 0x6a4a3a },
    { key: "mangrove_roots", name: "Mangrove Roots", style: "wood", transparent: true, tint: 0x4a6a32 },
    { key: "muddy_mangrove_roots", name: "Muddy Mangrove Roots", style: "wood", tint: 0x4a4a28 },
    { key: "mangrove_propagule", name: "Mangrove Propagule", style: "plant", tint: 0x4a8a3a },
    { key: "moss_carpet", name: "Moss Carpet", style: "soil", shape: "slab", tint: 0x4a8a3a, tool: "hoe" },
    { key: "rooted_dirt", name: "Rooted Dirt", style: "dirt", tint: 0x6b4a28 },
    { key: "hanging_roots", name: "Hanging Roots", style: "plant", tint: 0x8a6a4a },
    { key: "azalea", name: "Azalea", style: "plant", solid: true, shape: "cube", tint: 0x4a8a3a },
    { key: "flowering_azalea", name: "Flowering Azalea", style: "plant", solid: true, shape: "cube", tint: 0xd080a0 },
    { key: "azalea_leaves", name: "Azalea Leaves", style: "leaves", tint: 0x4a8a3a },
    { key: "flowering_azalea_leaves", name: "Flowering Azalea Leaves", style: "leaves", tint: 0xd080a0 },
    { key: "cave_vines", name: "Cave Vines", style: "plant", tint: 0x4a8a3a },
    { key: "cave_vines_lit", name: "Cave Vines (Berries)", style: "plant", tint: 0xe07818, light: 14 },
    { key: "big_dripleaf", name: "Big Dripleaf", style: "plant", solid: true, tint: 0x3a8a4a },
    { key: "small_dripleaf", name: "Small Dripleaf", style: "plant", tint: 0x3a8a4a },
    { key: "spore_blossom", name: "Spore Blossom", style: "plant", tint: 0xe08aa8 },
    { key: "pointed_dripstone", name: "Pointed Dripstone", style: "stone", shape: "torch", solid: false, tint: 0x8a6a5a },
    { key: "budding_amethyst", name: "Budding Amethyst", style: "crystal", tint: 0x9a5ac8, light: 1 },
    { key: "small_amethyst_bud", name: "Small Amethyst Bud", style: "crystal", shape: "torch", solid: false, tint: 0x9a5ac8, light: 1 },
    { key: "medium_amethyst_bud", name: "Medium Amethyst Bud", style: "crystal", shape: "torch", solid: false, tint: 0x9a5ac8, light: 2 },
    { key: "large_amethyst_bud", name: "Large Amethyst Bud", style: "crystal", shape: "torch", solid: false, tint: 0x9a5ac8, light: 4 },
    { key: "amethyst_cluster", name: "Amethyst Cluster", style: "crystal", shape: "torch", solid: false, tint: 0x9a5ac8, light: 5 },
    { key: "tinted_glass", name: "Tinted Glass", style: "glass", tint: 0x2a2a32 },
    { key: "coarse_dirt", name: "Coarse Dirt", style: "dirt", tint: 0x6b5530 },
    { key: "dirt_path", name: "Dirt Path", style: "dirt", tint: 0xb8945a, shape: "slab" },
    { key: "powder_snow", name: "Powder Snow", style: "ice", solid: false, tint: 0xf0f4f8, hardness: 0.25 },
    { key: "dried_kelp_block", name: "Dried Kelp Block", style: "plant", solid: true, shape: "cube", tint: 0x3a5a28, hardness: 0.5 },
    { key: "beehive", name: "Beehive", style: "wood", tint: 0xc8a04a },
    { key: "stonecutter", name: "Stonecutter", style: "stone", tint: 0x7a7a7a },
    { key: "grindstone", name: "Grindstone", style: "stone", tint: 0x8a8a8a },
    { key: "smithing_table", name: "Smithing Table", style: "wood", tint: 0x3a2a18 },
    { key: "cartography_table", name: "Cartography Table", style: "wood", tint: 0x6b5530 },
    { key: "fletching_table", name: "Fletching Table", style: "wood", tint: 0xc8a05a },
    { key: "loom", name: "Loom", style: "wood", tint: 0x8a6230 },
    { key: "lectern", name: "Lectern", style: "wood", tint: 0x8a6230 },
    { key: "composter", name: "Composter", style: "wood", tint: 0x6b5530 },
    { key: "beacon", name: "Beacon", style: "crystal", tint: 0x5adce6, light: 15, hardness: 3 },
    { key: "conduit", name: "Conduit", style: "crystal", tint: 0x5aaa9a, light: 15 },
    { key: "ender_chest", name: "Ender Chest", style: "end", tint: 0x1a6a5a, light: 7 },
    { key: "trapped_chest", name: "Trapped Chest", style: "wood", tint: 0x8a6230 },
    { key: "redstone_torch", name: "Redstone Torch", style: "plant", shape: "torch", light: 7, tint: 0xc42828, solid: false },
    { key: "repeater", name: "Redstone Repeater", style: "stone", shape: "slab", tint: 0x7a7a7a },
    { key: "comparator", name: "Redstone Comparator", style: "stone", shape: "slab", tint: 0x7a7a7a },
    { key: "redstone_wire", name: "Redstone Dust", style: "plant", tint: 0xc42828 },
    { key: "tripwire_hook", name: "Tripwire Hook", style: "plant", tint: 0x8a8a8a },
    { key: "chiseled_bookshelf", name: "Chiseled Bookshelf", style: "plank", tint: 0x8a5a2a },
    { key: "pitcher_plant", name: "Pitcher Plant", style: "plant", tint: 0xc080c0 },
    { key: "torchflower_crop", name: "Torchflower Crop", style: "plant", tint: 0xe07818 },
    { key: "bush", name: "Bush", style: "plant", tint: 0x3d7a32 },
    { key: "firefly_bush", name: "Firefly Bush", style: "plant", tint: 0x4a6a28, light: 8 },
    { key: "leaf_litter", name: "Leaf Litter", style: "plant", tint: 0x8a6230 },
    { key: "wildflowers", name: "Wildflowers", style: "plant", tint: 0xe8d24a },
    { key: "cactus_flower", name: "Cactus Flower", style: "plant", tint: 0xe08aa8 },
    { key: "dried_ghast", name: "Dried Ghast", style: "bone", tint: 0xc8b8b0 },
    { key: "chain_command_block", name: "Chain Command Block", style: "metal", tint: 0x3a8a6a, hardness: -1, light: 4 },
    { key: "repeating_command_block", name: "Repeating Command Block", style: "metal", tint: 0x5a48a8, hardness: -1, light: 4 },
    { key: "jigsaw", name: "Jigsaw Block", style: "metal", tint: 0x6a5a7a, hardness: -1 },
    { key: "structure_block", name: "Structure Block", style: "metal", tint: 0x5a3a6a, hardness: -1 },
    { key: "structure_void", name: "Structure Void", style: "air", tint: 0x5adce6 },
    { key: "barrier", name: "Barrier", style: "glass", tint: 0xc42828, hardness: -1 },
    { key: "light_block", name: "Light Block", style: "air", light: 15, tint: 0xf0c84a },
    { key: "oak_sapling", name: "Oak Sapling", style: "plant", tint: 0x3d7a32 },
    { key: "birch_sapling", name: "Birch Sapling", style: "plant", tint: 0x8aaa4a },
    { key: "spruce_sapling", name: "Spruce Sapling", style: "plant", tint: 0x2a5a32 },
    { key: "jungle_sapling", name: "Jungle Sapling", style: "plant", tint: 0x3d8a3a },
    { key: "acacia_sapling", name: "Acacia Sapling", style: "plant", tint: 0x6aaa32 },
    { key: "dark_oak_sapling", name: "Dark Oak Sapling", style: "plant", tint: 0x2a4a18 },
    { key: "cherry_sapling", name: "Cherry Sapling", style: "plant", tint: 0xe8a0b0 },
    { key: "pale_oak_sapling", name: "Pale Oak Sapling", style: "plant", tint: 0xc8c0b4 },
    { key: "mangrove_propagule_hanging", name: "Hanging Propagule", style: "plant", tint: 0x4a8a3a },
    { key: "infested_stone", name: "Infested Stone", style: "stone", tint: 0x7a7a7a, hardness: 0.75 },
    { key: "infested_cobble", name: "Infested Cobblestone", style: "stone", tint: 0x6e6e6e, hardness: 0.75 },
    { key: "infested_stone_bricks", name: "Infested Stone Bricks", style: "brick", tint: 0x7a7a7a, hardness: 0.75 },
    { key: "infested_deepslate", name: "Infested Deepslate", style: "stone", tint: 0x4a4a52, hardness: 0.75 },
    { key: "petrified_oak_slab", name: "Petrified Oak Slab", style: "stone", shape: "slab", tint: 0xb8945a },
    { key: "smooth_stone_slab", name: "Smooth Stone Slab", style: "stone", shape: "slab", tint: 0xa0a0a0 },
    { key: "cobble_slab", name: "Cobblestone Slab", style: "stone", shape: "slab", tint: 0x6e6e6e },
    { key: "brick_slab", name: "Brick Slab", style: "brick", shape: "slab", tint: 0xa04a32 },
    { key: "nether_brick_fence", name: "Nether Brick Fence", style: "brick", transparent: true, tint: 0x3a1c1c },
    { key: "nether_brick_slab", name: "Nether Brick Slab", style: "brick", shape: "slab", tint: 0x3a1c1c },
    { key: "end_stone_brick_slab", name: "End Stone Brick Slab", style: "brick", shape: "slab", tint: 0xd8d8a0 },
    { key: "purpur_slab", name: "Purpur Slab", style: "end", shape: "slab", tint: 0xb07aa8 },
    { key: "purpur_stairs", name: "Purpur Stairs", style: "end", shape: "slab", tint: 0xb07aa8 },
    { key: "oak_slab", name: "Oak Slab", style: "plank", shape: "slab", tint: 0xb8945a },
    { key: "oak_stairs", name: "Oak Stairs", style: "plank", shape: "slab", tint: 0xb8945a },
    { key: "birch_slab", name: "Birch Slab", style: "plank", shape: "slab", tint: 0xd8c888 },
    { key: "spruce_slab", name: "Spruce Slab", style: "plank", shape: "slab", tint: 0x6b5530 },
    { key: "stone_stairs", name: "Stone Stairs", style: "stone", shape: "slab", tint: 0x7a7a7a },
    { key: "cobble_stairs", name: "Cobblestone Stairs", style: "stone", shape: "slab", tint: 0x6e6e6e },
    { key: "brick_stairs", name: "Brick Stairs", style: "brick", shape: "slab", tint: 0xa04a32 },
    { key: "nether_brick_stairs", name: "Nether Brick Stairs", style: "brick", shape: "slab", tint: 0x3a1c1c },
    { key: "sandstone_stairs", name: "Sandstone Stairs", style: "stone", shape: "slab", tint: 0xd4c882 },
    { key: "quartz_stairs", name: "Quartz Stairs", style: "stone", shape: "slab", tint: 0xf0ece4 },
    { key: "cobble_wall", name: "Cobblestone Wall", style: "stone", transparent: true, tint: 0x6e6e6e },
    { key: "mossy_cobble_wall", name: "Mossy Cobblestone Wall", style: "stone", transparent: true, tint: 0x5a7a4a },
    { key: "brick_wall", name: "Brick Wall", style: "brick", transparent: true, tint: 0xa04a32 },
    { key: "andesite_wall", name: "Andesite Wall", style: "stone", transparent: true, tint: 0x6e6e6e },
    { key: "diorite_wall", name: "Diorite Wall", style: "stone", transparent: true, tint: 0xc8c8c4 },
    { key: "granite_wall", name: "Granite Wall", style: "stone", transparent: true, tint: 0xa05a48 },
    { key: "stone_brick_wall", name: "Stone Brick Wall", style: "brick", transparent: true, tint: 0x7a7a7a },
    { key: "nether_brick_wall", name: "Nether Brick Wall", style: "brick", transparent: true, tint: 0x3a1c1c },
    { key: "red_nether_brick_wall", name: "Red Nether Brick Wall", style: "brick", transparent: true, tint: 0x5a1020 },
    { key: "sandstone_wall", name: "Sandstone Wall", style: "stone", transparent: true, tint: 0xd4c882 },
    { key: "red_sandstone_wall", name: "Red Sandstone Wall", style: "stone", transparent: true, tint: 0xc06a32 },
    { key: "prismarine_wall", name: "Prismarine Wall", style: "stone", transparent: true, tint: 0x5aaa9a },
    { key: "end_stone_brick_wall", name: "End Stone Brick Wall", style: "brick", transparent: true, tint: 0xd8d8a0 },
    { key: "blackstone_wall", name: "Blackstone Wall", style: "stone", transparent: true, tint: 0x2a2a32 },
    { key: "polished_blackstone_wall", name: "Polished Blackstone Wall", style: "stone", transparent: true, tint: 0x2a2a32 },
    { key: "deepslate_brick_wall", name: "Deepslate Brick Wall", style: "brick", transparent: true, tint: 0x4a4a52 },
    { key: "tuff_wall", name: "Tuff Wall", style: "stone", transparent: true, tint: 0x6e6a62 },
    { key: "resin_brick_wall", name: "Resin Brick Wall", style: "brick", transparent: true, tint: 0xd06820 },
    { key: "copper_bars", name: "Copper Bars", style: "metal", shape: "pane", transparent: true, tint: 0xc86a3a },
    { key: "oxidized_copper_bars", name: "Oxidized Copper Bars", style: "metal", shape: "pane", transparent: true, tint: 0x3a8a78 },
    { key: "rail", name: "Rail", style: "metal", shape: "slab", solid: false, tint: 0x8a8a8a },
    { key: "powered_rail", name: "Powered Rail", style: "metal", shape: "slab", solid: false, tint: 0xc45c32 },
    { key: "detector_rail", name: "Detector Rail", style: "metal", shape: "slab", solid: false, tint: 0x6a3a3a },
    { key: "activator_rail", name: "Activator Rail", style: "metal", shape: "slab", solid: false, tint: 0x8a6a32 },
    { key: "redstone_lamp_on", name: "Redstone Lamp", style: "crystal", tint: 0xf0d080, light: 15 },
    { key: "stone_pressure_plate", name: "Stone Pressure Plate", style: "stone", shape: "slab", solid: false, tint: 0x7a7a7a },
    { key: "oak_pressure_plate", name: "Oak Pressure Plate", style: "plank", shape: "slab", solid: false, tint: 0xb8945a },
    { key: "light_weighted_pressure_plate", name: "Light Weighted Pressure Plate", style: "metal", shape: "slab", solid: false, tint: 0xf0c832 },
    { key: "heavy_weighted_pressure_plate", name: "Heavy Weighted Pressure Plate", style: "metal", shape: "slab", solid: false, tint: 0xd0d4d8 },
    { key: "cake", name: "Cake", style: "wool", shape: "slab", tint: 0xf0d0c8 },
    { key: "cocoa", name: "Cocoa", style: "plant", tint: 0x6b3a18 },
    { key: "sweet_berry_bush", name: "Sweet Berry Bush", style: "plant", tint: 0x3a6a28 },
    { key: "carrots", name: "Carrots", style: "plant", tint: 0xe07818 },
    { key: "potatoes", name: "Potatoes", style: "plant", tint: 0xc8b04a },
    { key: "beetroots", name: "Beetroots", style: "plant", tint: 0xa03048 },
    { key: "pumpkin_stem", name: "Pumpkin Stem", style: "plant", tint: 0x5a8a32 },
    { key: "melon_stem", name: "Melon Stem", style: "plant", tint: 0x5a8a32 },
    { key: "tripwire", name: "Tripwire", style: "plant", tint: 0xe8e8e8 },
    { key: "iron_trapdoor", name: "Iron Trapdoor", style: "metal", transparent: true, tint: 0xd0d4d8 },
    { key: "iron_pressure_plate", name: "Iron Pressure Plate", style: "metal", shape: "slab", solid: false, tint: 0xd0d4d8 },
    { key: "polished_blackstone_button", name: "Polished Blackstone Button", style: "stone", solid: false, tint: 0x2a2a32 },
    { key: "polished_blackstone_pressure_plate", name: "Polished Blackstone Pressure Plate", style: "stone", shape: "slab", solid: false, tint: 0x2a2a32 },
    { key: "crimson_nylium_extra", name: "Nether Gold Block", style: "metal", tint: 0xf0c832, harvestLevel: 2 },
    { key: "lodestone_extra", name: "Chiseled Bookshelf Filled", style: "plank", tint: 0x8a5a2a },
    { key: "calibrated_copper", name: "Copper Golem Statue", style: "metal", tint: 0xc86a3a },
    { key: "shelf_oak", name: "Oak Shelf", style: "plank", tint: 0xb8945a },
  ];

  for (let i = 0; i < named.length; i++) put(i, named[i]!);

  const coloredTypes: { form: string; style: Style; cat: string }[] = [
    { form: "Wool", style: "wool", cat: "wool" },
    { form: "Concrete", style: "stone", cat: "concrete" },
    { form: "Concrete Powder", style: "sand", cat: "concrete" },
    { form: "Terracotta", style: "brick", cat: "terracotta" },
    { form: "Glazed Terracotta", style: "brick", cat: "terracotta" },
    { form: "Stained Glass", style: "glass", cat: "glass" },
    { form: "Glass Pane", style: "glass", cat: "glass" },
    { form: "Carpet", style: "wool", cat: "wool" },
    { form: "Candle", style: "plant", cat: "utility" },
    { form: "Bed", style: "wool", cat: "utility" },
    { form: "Shulker Box", style: "end", cat: "utility" },
    { form: "Banner", style: "wool", cat: "utility" },
    { form: "Concrete Bricks", style: "brick", cat: "concrete" },
    { form: "Wool Carpet Block", style: "wool", cat: "wool" },
  ];

  let id = named.length;
  for (const [cname, tint] of COLORS) {
    for (const t of coloredTypes) {
      if (id >= BLOCK_COUNT) break;
      const spec: Spec = {
        key: `${cname.toLowerCase().replace(" ", "_")}_${t.form.toLowerCase().replace(/ /g, "_")}`,
        name: `${cname} ${t.form}`,
        style: t.style,
        tint,
        category: t.cat,
      };
      if (t.form === "Carpet" || t.form === "Candle" || t.form === "Banner") {
        spec.solid = t.form !== "Candle";
        spec.shape = t.form === "Candle" ? "torch" : "slab";
        if (t.form === "Candle") spec.light = 3;
      }
      if (t.form === "Glass Pane") spec.shape = "pane";
      if (t.form === "Bed") spec.solid = true;
      put(id++, spec);
    }
  }

  const woods = [
    ["Oak", 0xb8945a], ["Birch", 0xd8c888], ["Spruce", 0x6b5530], ["Jungle", 0xb07a3a],
    ["Acacia", 0xc86a3a], ["Dark Oak", 0x3a2a18], ["Mangrove", 0x7a3a32], ["Cherry", 0xd8a0ae],
    ["Pale Oak", 0xc8c0b4], ["Crimson", 0x6a2030], ["Warped", 0x2a6a68], ["Bamboo", 0xc8b04a],
  ] as [string, number][];
  const woodForms = [
    "Planks", "Stairs", "Slab", "Fence", "Fence Gate", "Door", "Trapdoor", "Button",
    "Pressure Plate", "Sign", "Hanging Sign", "Shelf", "Boat", "Chest Boat", "Hyphae",
  ];
  for (const [wname, tint] of woods) {
    for (const f of woodForms) {
      if (id >= BLOCK_COUNT) break;
      put(id++, {
        key: `${wname.toLowerCase().replace(" ", "_")}_${f.toLowerCase().replace(/ /g, "_")}_var`,
        name: `${wname} ${f}`,
        style: "plank",
        tint,
        category: "wood",
        shape: f === "Slab" ? "slab" : f === "Door" || f === "Trapdoor" || f === "Fence" ? "pane" : "cube",
        transparent: f === "Door" || f === "Trapdoor" || f === "Fence" || f === "Fence Gate",
      });
    }
  }

  const stoneForms = ["Block", "Stairs", "Slab", "Wall", "Bricks", "Cracked Bricks", "Chiseled", "Polished", "Tiles", "Pillar"];
  const stones = [
    ["Stone", 0x7a7a7a], ["Cobblestone", 0x6e6e6e], ["Deepslate", 0x4a4a52], ["Blackstone", 0x2a2a32],
    ["Basalt", 0x3a3a42], ["Tuff", 0x6e6a62], ["Calcite", 0xe8e4dc], ["Dripstone", 0x8a6a5a],
    ["Prismarine", 0x5aaa9a], ["Dark Prismarine", 0x2a6a5a], ["Sandstone", 0xd4c882], ["Red Sandstone", 0xc06a32],
    ["Quartz", 0xf0ece4], ["Purpur", 0xb07aa8], ["End Stone", 0xd8d8a0], ["Nether Brick", 0x3a1c1c],
    ["Red Nether Brick", 0x5a1020], ["Mud Brick", 0x6a4a3a], ["Brick", 0xa04a32], ["Cobbled Deepslate", 0x3a3a42],
  ] as [string, number][];
  for (const [sname, tint] of stones) {
    for (const f of stoneForms) {
      if (id >= BLOCK_COUNT) break;
      put(id++, {
        key: `${sname.toLowerCase().replace(/ /g, "_")}_${f.toLowerCase().replace(/ /g, "_")}_var`,
        name: `${sname} ${f}`,
        style: f.includes("Brick") || f === "Tiles" || f === "Chiseled" ? "brick" : "stone",
        tint,
        category: "stone",
        shape: f === "Slab" ? "slab" : "cube",
      });
    }
  }

  let n = 0;
  while (id < BLOCK_COUNT) {
    const adj = ADJ[n % ADJ.length]!;
    const noun = NOUN[Math.floor(n / ADJ.length) % NOUN.length]!;
    const form = FORM[Math.floor(n / (ADJ.length * NOUN.length)) % FORM.length]!;
    const hue = (n * 17) % 360;
    const sat = 0.25 + ((n * 13) % 40) / 100;
    const lit = 0.32 + ((n * 29) % 40) / 100;
    const tint = hueTint(hue, sat, lit);
    const styles: Style[] = ["stone", "brick", "wood", "plank", "crystal", "wool", "metal", "nether", "end", "soil", "ice", "ore", "glass", "leaves"];
    const style = styles[n % styles.length]!;
    put(id, {
      key: `gen_${id}`,
      name: `${adj} ${noun} ${form}`,
      style,
      tint,
      category: "discovery",
      shape: form === "Slab" || form === "Stairs" ? "slab" : form === "Glass" ? "cube" : form === "Leaves" ? "cube" : form === "Door" || form === "Trapdoor" || form === "Fence" ? "pane" : "cube",
      light: form === "Lamp" || form === "Lantern" || form === "Crystal" ? 8 + (n % 8) : 0,
      harvestLevel: style === "ore" || style === "metal" ? 1 + (n % 3) : 0,
    });
    id++;
    n++;
  }
}

buildCatalog();

export const BY_KEY = new Map<string, BlockDef>();
for (let i = 0; i < BLOCK_COUNT; i++) {
  const b = BLOCKS[i];
  if (b) BY_KEY.set(b.key, b);
}

export function isSolid(id: number): boolean {
  const b = BLOCKS[id];
  return !!b && b.solid && b.fluid === 0;
}

export function isOpaque(id: number): boolean {
  const b = BLOCKS[id];
  return !!b && b.solid && !b.transparent && !b.cutout && b.fluid === 0;
}

export function emitsLight(id: number): number {
  return BLOCKS[id]?.light ?? 0;
}

export function isFluid(id: number): boolean {
  return (BLOCKS[id]?.fluid ?? 0) > 0;
}

export function isPlant(id: number): boolean {
  return BLOCKS[id]?.shape === "cross";
}

export const CORE_BLOCKS = BLOCKS.slice(1, 420).filter((b) => b && b.solid && b.shape === "cube" && b.fluid === 0);

export function labBlockList(limit = 240): { key: string; name: string; id: number }[] {
  const out: { key: string; name: string; id: number }[] = [];
  const seen = new Set<string>();
  for (let i = 1; i < BLOCKS.length && out.length < limit; i++) {
    const b = BLOCKS[i];
    if (!b || b.key.startsWith("gen_") || b.fluid) continue;
    if (seen.has(b.key)) continue;
    seen.add(b.key);
    out.push({ key: b.key, name: b.name, id: b.id });
  }
  return out;
}

export type { Style };
export function blockStyle(id: number): string {
  const k = BLOCKS[id]?.key ?? "";
  if (id === GRASS) return "grass";
  if (id === FIRE) return "fire";
  if (id === WATER || id === LAVA) return "fluid";
  if (BLOCKS[id]?.shape === "cross") return "plant";
  if (BLOCKS[id]?.cutout && BLOCKS[id]?.category === "nature") return "leaves";
  if (k.includes("log") || k.includes("stem")) return "wood";
  if (k.includes("plank")) return "plank";
  if (k.includes("ore")) return "ore";
  if (k.includes("glass")) return "glass";
  if (k.includes("wool") || k.includes("concrete")) return "wool";
  if (BLOCKS[id]?.category === "nether") return "nether";
  if (BLOCKS[id]?.category === "end") return "end";
  if (BLOCKS[id]?.tool === "shovel") return "dirt";
  if (BLOCKS[id]?.tool === "pickaxe") return "stone";
  return BLOCKS[id]?.category ?? "stone";
}

/** Cloudflare bundler must see this name as an export (Game Lab palette). */
void labBlockList;

