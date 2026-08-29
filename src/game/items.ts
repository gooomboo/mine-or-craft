import {
  ACACIA_LOG,
  BIRCH_LOG,
  BLOCKS,
  CHEST,
  CHERRY_LOG,
  COAL_ORE,
  COBBLE,
  COPPER_ORE,
  CRAFTING_TABLE,
  DARK_OAK_LOG,
  DIAMOND_BLOCK,
  DIAMOND_ORE,
  DIRT,
  FURNACE,
  GOLD_BLOCK,
  GOLD_ORE,
  IRON_BLOCK,
  IRON_ORE,
  JUNGLE_LOG,
  LADDER,
  MANGROVE_LOG,
  OAK_LOG,
  OAK_PLANKS,
  OBSIDIAN,
  PALE_OAK_LOG,
  SAND,
  SPRUCE_LOG,
  STONE,
  TORCH,
} from "./blocks";
import type { ItemDef, Recipe, Slot, ToolType } from "./types";

export const ITEM_BASE = 10000;

export const STICK = 10000;
export const WOOD_PICK = 10001;
export const STONE_PICK = 10002;
export const IRON_PICK = 10003;
export const GOLD_PICK = 10004;
export const DIAMOND_PICK = 10005;
export const NETHERITE_PICK = 10006;
export const WOOD_AXE = 10007;
export const STONE_AXE = 10008;
export const IRON_AXE = 10009;
export const GOLD_AXE = 10010;
export const DIAMOND_AXE = 10011;
export const NETHERITE_AXE = 10012;
export const WOOD_SHOVEL = 10013;
export const STONE_SHOVEL = 10014;
export const IRON_SHOVEL = 10015;
export const GOLD_SHOVEL = 10016;
export const DIAMOND_SHOVEL = 10017;
export const NETHERITE_SHOVEL = 10018;
export const WOOD_SWORD = 10019;
export const STONE_SWORD = 10020;
export const IRON_SWORD = 10021;
export const GOLD_SWORD = 10022;
export const DIAMOND_SWORD = 10023;
export const NETHERITE_SWORD = 10024;
export const WOOD_HOE = 10025;
export const STONE_HOE = 10026;
export const IRON_HOE = 10027;
export const GOLD_HOE = 10028;
export const DIAMOND_HOE = 10029;
export const NETHERITE_HOE = 10030;
export const SHIELD = 10031;
export const BOW = 10032;
export const ARROW = 10033;
export const FLINT = 10034;
export const FLINT_STEEL = 10035;
export const COAL = 10036;
export const CHARCOAL = 10037;
export const IRON_INGOT = 10038;
export const GOLD_INGOT = 10039;
export const DIAMOND = 10040;
export const EMERALD = 10041;
export const REDSTONE = 10042;
export const LAPIS = 10043;
export const COPPER_INGOT = 10044;
export const NETHERITE_INGOT = 10045;
export const QUARTZ = 10046;
export const BREAD = 10047;
export const APPLE = 10048;
export const COOKED_BEEF = 10049;
export const RAW_BEEF = 10050;
export const COOKED_PORK = 10051;
export const RAW_PORK = 10052;
export const COOKED_CHICKEN = 10053;
export const RAW_CHICKEN = 10054;
export const GOLDEN_APPLE = 10055;
export const BUCKET = 10056;
export const WATER_BUCKET = 10057;
export const LAVA_BUCKET = 10058;
export const MILK_BUCKET = 10059;
export const EYE_OF_ENDER = 10060;
export const ENDER_PEARL = 10061;
export const BLAZE_ROD = 10062;
export const BLAZE_POWDER = 10063;
export const GUNPOWDER = 10064;
export const STRING = 10065;
export const LEATHER = 10066;
export const FEATHER = 10067;
export const BONE = 10068;
export const BONE_MEAL = 10069;
export const WHEAT_ITEM = 10070;
export const SEEDS = 10071;
export const COMPASS = 10072;
export const CLOCK = 10073;
export const MAP = 10074;
export const SHEARS = 10075;
export const FISHING_ROD = 10076;
export const LEATHER_HELM = 10077;
export const LEATHER_CHEST = 10078;
export const LEATHER_LEGS = 10079;
export const LEATHER_BOOTS = 10080;
export const IRON_HELM = 10081;
export const IRON_CHEST = 10082;
export const IRON_LEGS = 10083;
export const IRON_BOOTS = 10084;
export const GOLD_HELM = 10085;
export const GOLD_CHEST = 10086;
export const GOLD_LEGS = 10087;
export const GOLD_BOOTS = 10088;
export const DIAMOND_HELM = 10089;
export const DIAMOND_CHEST = 10090;
export const DIAMOND_LEGS = 10091;
export const DIAMOND_BOOTS = 10092;
export const NETHERITE_HELM = 10093;
export const NETHERITE_CHEST = 10094;
export const NETHERITE_LEGS = 10095;
export const NETHERITE_BOOTS = 10096;
export const CHAIN_HELM = 10097;
export const CHAIN_CHEST = 10098;
export const CHAIN_LEGS = 10099;
export const CHAIN_BOOTS = 10100;
export const BOAT = 10101;
export const MINECART = 10102;
export const SADDLE = 10103;
export const NAME_TAG = 10104;
export const TOTEM = 10105;
export const ELYTRA = 10106;
export const FIREWORK = 10107;
export const SNOWBALL = 10108;
export const EGG = 10109;
export const BOWL = 10110;
export const MUSHROOM_STEW = 10111;
export const COOKIE = 10112;
export const PUMPKIN_PIE = 10113;
export const CARROT = 10114;
export const POTATO = 10115;
export const BAKED_POTATO = 10116;
export const BEETROOT = 10117;
export const ROTTEN_FLESH = 10118;
export const SPIDER_EYE = 10119;
export const GHAST_TEAR = 10120;
export const MAGMA_CREAM = 10121;
export const SLIMEBALL = 10122;
export const NETHER_STAR = 10123;
export const DRAGON_BREATH = 10124;
export const SHULKER_SHELL = 10125;
export const PHANTOM_MEMBRANE = 10126;
export const GLOW_INK = 10127;
export const INK_SAC = 10128;
export const PAPER = 10129;
export const BOOK = 10130;
export const BOOK_QUILL = 10131;
export const EXPERIENCE_BOTTLE = 10132;
export const GLASS_BOTTLE = 10133;
export const WATER_BOTTLE = 10134;
export const SUGAR = 10135;
export const CLAY_BALL = 10136;
export const BRICK_ITEM = 10137;
export const NETHER_BRICK_ITEM = 10138;
export const PRISMARINE_SHARD = 10139;
export const PRISMARINE_CRYSTALS = 10140;
export const NAUTILUS = 10141;
export const HEART_OF_SEA = 10142;
export const TRIDENT = 10143;
export const CROSSBOW = 10144;
export const SPYGLASS = 10145;
export const BUNDLE = 10146;
export const RECOVERY_COMPASS = 10147;
export const ECHO_SHARD = 10148;
export const DISC_FRAGMENT = 10149;
export const MUSIC_DISC = 10150;

export const ITEMS: Map<number, ItemDef> = new Map();

function item(def: ItemDef) {
  ITEMS.set(def.id, def);
}

function tool(
  id: number,
  key: string,
  name: string,
  tool: ToolType,
  harvestLevel: number,
  durability: number,
  damage: number,
  tint: number,
) {
  item({ id, key, name, stack: 1, tool, harvestLevel, durability, damage, icon: 0, tint });
}

function armor(
  id: number,
  key: string,
  name: string,
  slot: "head" | "chest" | "legs" | "feet",
  armor: number,
  durability: number,
  tint: number,
) {
  item({ id, key, name, stack: 1, slot, armor, durability, icon: 0, tint });
}

function food(id: number, key: string, name: string, food: number, tint: number) {
  item({ id, key, name, stack: 64, food, icon: 0, tint });
}

function stack(id: number, key: string, name: string, tint: number, n = 64) {
  item({ id, key, name, stack: n, icon: 0, tint });
}

tool(WOOD_PICK, "wood_pick", "Wooden Pickaxe", "pickaxe", 0, 59, 2, 0xb8945a);
tool(STONE_PICK, "stone_pick", "Stone Pickaxe", "pickaxe", 1, 131, 3, 0x7a7a7a);
tool(IRON_PICK, "iron_pick", "Iron Pickaxe", "pickaxe", 2, 250, 4, 0xd0d4d8);
tool(GOLD_PICK, "gold_pick", "Golden Pickaxe", "pickaxe", 0, 32, 2, 0xf0c832);
tool(DIAMOND_PICK, "diamond_pick", "Diamond Pickaxe", "pickaxe", 3, 1561, 5, 0x5adce6);
tool(NETHERITE_PICK, "netherite_pick", "Netherite Pickaxe", "pickaxe", 3, 2031, 6, 0x3a2a28);
tool(WOOD_AXE, "wood_axe", "Wooden Axe", "axe", 0, 59, 7, 0xb8945a);
tool(STONE_AXE, "stone_axe", "Stone Axe", "axe", 1, 131, 9, 0x7a7a7a);
tool(IRON_AXE, "iron_axe", "Iron Axe", "axe", 2, 250, 9, 0xd0d4d8);
tool(GOLD_AXE, "gold_axe", "Golden Axe", "axe", 0, 32, 7, 0xf0c832);
tool(DIAMOND_AXE, "diamond_axe", "Diamond Axe", "axe", 3, 1561, 9, 0x5adce6);
tool(NETHERITE_AXE, "netherite_axe", "Netherite Axe", "axe", 3, 2031, 10, 0x3a2a28);
tool(WOOD_SHOVEL, "wood_shovel", "Wooden Shovel", "shovel", 0, 59, 2, 0xb8945a);
tool(STONE_SHOVEL, "stone_shovel", "Stone Shovel", "shovel", 1, 131, 3, 0x7a7a7a);
tool(IRON_SHOVEL, "iron_shovel", "Iron Shovel", "shovel", 2, 250, 4, 0xd0d4d8);
tool(GOLD_SHOVEL, "gold_shovel", "Golden Shovel", "shovel", 0, 32, 2, 0xf0c832);
tool(DIAMOND_SHOVEL, "diamond_shovel", "Diamond Shovel", "shovel", 3, 1561, 5, 0x5adce6);
tool(NETHERITE_SHOVEL, "netherite_shovel", "Netherite Shovel", "shovel", 3, 2031, 6, 0x3a2a28);
tool(WOOD_SWORD, "wood_sword", "Wooden Sword", "sword", 0, 59, 4, 0xb8945a);
tool(STONE_SWORD, "stone_sword", "Stone Sword", "sword", 1, 131, 5, 0x7a7a7a);
tool(IRON_SWORD, "iron_sword", "Iron Sword", "sword", 2, 250, 6, 0xd0d4d8);
tool(GOLD_SWORD, "gold_sword", "Golden Sword", "sword", 0, 32, 4, 0xf0c832);
tool(DIAMOND_SWORD, "diamond_sword", "Diamond Sword", "sword", 3, 1561, 7, 0x5adce6);
tool(NETHERITE_SWORD, "netherite_sword", "Netherite Sword", "sword", 3, 2031, 8, 0x3a2a28);
tool(WOOD_HOE, "wood_hoe", "Wooden Hoe", "hoe", 0, 59, 1, 0xb8945a);
tool(STONE_HOE, "stone_hoe", "Stone Hoe", "hoe", 1, 131, 1, 0x7a7a7a);
tool(IRON_HOE, "iron_hoe", "Iron Hoe", "hoe", 2, 250, 1, 0xd0d4d8);
tool(GOLD_HOE, "gold_hoe", "Golden Hoe", "hoe", 0, 32, 1, 0xf0c832);
tool(DIAMOND_HOE, "diamond_hoe", "Diamond Hoe", "hoe", 3, 1561, 1, 0x5adce6);
tool(NETHERITE_HOE, "netherite_hoe", "Netherite Hoe", "hoe", 3, 2031, 1, 0x3a2a28);
tool(SHEARS, "shears", "Shears", "shears", 0, 238, 1, 0xd0d4d8);
tool(TRIDENT, "trident", "Trident", "sword", 0, 250, 9, 0x5aaa9a);
tool(CROSSBOW, "crossbow", "Crossbow", "sword", 0, 326, 6, 0x6b5530);

item({ id: SHIELD, key: "shield", name: "Shield", stack: 1, slot: "offhand", durability: 336, icon: 0, tint: 0xb8945a });
item({ id: BOW, key: "bow", name: "Bow", stack: 1, durability: 384, damage: 6, icon: 0, tint: 0x6b5530 });
stack(ARROW, "arrow", "Arrow", 0xc8c0b0);
stack(FLINT, "flint", "Flint", 0x3a3a3a);
item({ id: FLINT_STEEL, key: "flint_steel", name: "Flint and Steel", stack: 1, durability: 64, icon: 0, tint: 0x8a8a8a });
stack(COAL, "coal", "Coal", 0x1a1a1a);
stack(CHARCOAL, "charcoal", "Charcoal", 0x2a2a22);
stack(IRON_INGOT, "iron_ingot", "Iron Ingot", 0xd0d4d8);
stack(GOLD_INGOT, "gold_ingot", "Gold Ingot", 0xf0c832);
stack(DIAMOND, "diamond", "Diamond", 0x5adce6);
stack(EMERALD, "emerald", "Emerald", 0x2ad05a);
stack(REDSTONE, "redstone", "Redstone Dust", 0xc42828);
stack(LAPIS, "lapis", "Lapis Lazuli", 0x2a4ab4);
stack(COPPER_INGOT, "copper_ingot", "Copper Ingot", 0xc86a3a);
stack(NETHERITE_INGOT, "netherite_ingot", "Netherite Ingot", 0x3a2a28);
stack(QUARTZ, "quartz", "Nether Quartz", 0xe8e0d8);
stack(STICK, "stick", "Stick", 0x8a6230);

food(BREAD, "bread", "Bread", 5, 0xc8a05a);
food(APPLE, "apple", "Apple", 4, 0xc43030);
food(RAW_BEEF, "raw_beef", "Raw Beef", 3, 0xa03a3a);
food(COOKED_BEEF, "cooked_beef", "Steak", 8, 0x6a3a28);
food(RAW_PORK, "raw_pork", "Raw Porkchop", 3, 0xe0a0a0);
food(COOKED_PORK, "cooked_pork", "Cooked Porkchop", 8, 0xc87848);
food(RAW_CHICKEN, "raw_chicken", "Raw Chicken", 2, 0xe8d0a8);
food(COOKED_CHICKEN, "cooked_chicken", "Cooked Chicken", 6, 0xc89848);
food(GOLDEN_APPLE, "golden_apple", "Golden Apple", 4, 0xf0c832);
food(MUSHROOM_STEW, "mushroom_stew", "Mushroom Stew", 6, 0x8a6230);
food(COOKIE, "cookie", "Cookie", 2, 0x8a5530);
food(PUMPKIN_PIE, "pumpkin_pie", "Pumpkin Pie", 8, 0xe07818);
food(CARROT, "carrot", "Carrot", 3, 0xe07818);
food(POTATO, "potato", "Potato", 1, 0xc8b05a);
food(BAKED_POTATO, "baked_potato", "Baked Potato", 5, 0xc8a04a);
food(BEETROOT, "beetroot", "Beetroot", 1, 0xa02838);
food(ROTTEN_FLESH, "rotten_flesh", "Rotten Flesh", 4, 0x6a4a28);
food(SPIDER_EYE, "spider_eye", "Spider Eye", 2, 0x6a2030);

stack(BUCKET, "bucket", "Bucket", 0x8a8a8a, 16);
item({ id: WATER_BUCKET, key: "water_bucket", name: "Water Bucket", stack: 1, place: 6, icon: 0, tint: 0x3a78c8 });
item({ id: LAVA_BUCKET, key: "lava_bucket", name: "Lava Bucket", stack: 1, place: 7, icon: 0, tint: 0xe06818 });
item({ id: MILK_BUCKET, key: "milk_bucket", name: "Milk Bucket", stack: 1, icon: 0, tint: 0xf0f0e8 });
stack(EYE_OF_ENDER, "eye_of_ender", "Eye of Ender", 0x5aaa6a, 64);
stack(ENDER_PEARL, "ender_pearl", "Ender Pearl", 0x1a6a5a, 16);
stack(BLAZE_ROD, "blaze_rod", "Blaze Rod", 0xf0a028);
stack(BLAZE_POWDER, "blaze_powder", "Blaze Powder", 0xf07818);
stack(GUNPOWDER, "gunpowder", "Gunpowder", 0x6a6a6a);
stack(STRING, "string", "String", 0xe0e0e0);
stack(LEATHER, "leather", "Leather", 0x8a5530);
stack(FEATHER, "feather", "Feather", 0xf0f0e8);
stack(BONE, "bone", "Bone", 0xe8e0c8);
stack(BONE_MEAL, "bone_meal", "Bone Meal", 0xf0ece4);
stack(WHEAT_ITEM, "wheat", "Wheat", 0xc8b04a);
stack(SEEDS, "seeds", "Wheat Seeds", 0x6a8a3a);
item({ id: COMPASS, key: "compass", name: "Compass", stack: 1, icon: 0, tint: 0xc43030 });
item({ id: CLOCK, key: "clock", name: "Clock", stack: 1, icon: 0, tint: 0xf0c832 });
item({ id: MAP, key: "map", name: "Empty Map", stack: 64, icon: 0, tint: 0xe0d0a0 });
item({ id: FISHING_ROD, key: "fishing_rod", name: "Fishing Rod", stack: 1, durability: 64, icon: 0, tint: 0x6b5530 });

armor(LEATHER_HELM, "leather_helm", "Leather Cap", "head", 1, 55, 0x8a5530);
armor(LEATHER_CHEST, "leather_chest", "Leather Tunic", "chest", 3, 80, 0x8a5530);
armor(LEATHER_LEGS, "leather_legs", "Leather Pants", "legs", 2, 75, 0x8a5530);
armor(LEATHER_BOOTS, "leather_boots", "Leather Boots", "feet", 1, 65, 0x8a5530);
armor(CHAIN_HELM, "chain_helm", "Chainmail Helmet", "head", 2, 165, 0x8a8a8a);
armor(CHAIN_CHEST, "chain_chest", "Chainmail Chestplate", "chest", 5, 240, 0x8a8a8a);
armor(CHAIN_LEGS, "chain_legs", "Chainmail Leggings", "legs", 4, 225, 0x8a8a8a);
armor(CHAIN_BOOTS, "chain_boots", "Chainmail Boots", "feet", 1, 195, 0x8a8a8a);
armor(IRON_HELM, "iron_helm", "Iron Helmet", "head", 2, 165, 0xd0d4d8);
armor(IRON_CHEST, "iron_chest", "Iron Chestplate", "chest", 6, 240, 0xd0d4d8);
armor(IRON_LEGS, "iron_legs", "Iron Leggings", "legs", 5, 225, 0xd0d4d8);
armor(IRON_BOOTS, "iron_boots", "Iron Boots", "feet", 2, 195, 0xd0d4d8);
armor(GOLD_HELM, "gold_helm", "Golden Helmet", "head", 2, 77, 0xf0c832);
armor(GOLD_CHEST, "gold_chest", "Golden Chestplate", "chest", 5, 112, 0xf0c832);
armor(GOLD_LEGS, "gold_legs", "Golden Leggings", "legs", 3, 105, 0xf0c832);
armor(GOLD_BOOTS, "gold_boots", "Golden Boots", "feet", 1, 91, 0xf0c832);
armor(DIAMOND_HELM, "diamond_helm", "Diamond Helmet", "head", 3, 363, 0x5adce6);
armor(DIAMOND_CHEST, "diamond_chest", "Diamond Chestplate", "chest", 8, 528, 0x5adce6);
armor(DIAMOND_LEGS, "diamond_legs", "Diamond Leggings", "legs", 6, 495, 0x5adce6);
armor(DIAMOND_BOOTS, "diamond_boots", "Diamond Boots", "feet", 3, 429, 0x5adce6);
armor(NETHERITE_HELM, "netherite_helm", "Netherite Helmet", "head", 3, 407, 0x3a2a28);
armor(NETHERITE_CHEST, "netherite_chest", "Netherite Chestplate", "chest", 8, 592, 0x3a2a28);
armor(NETHERITE_LEGS, "netherite_legs", "Netherite Leggings", "legs", 6, 555, 0x3a2a28);
armor(NETHERITE_BOOTS, "netherite_boots", "Netherite Boots", "feet", 3, 481, 0x3a2a28);

item({ id: TOTEM, key: "totem", name: "Totem of Undying", stack: 1, icon: 0, tint: 0xf0c832 });
item({ id: ELYTRA, key: "elytra", name: "Elytra", stack: 1, slot: "chest", durability: 432, icon: 0, tint: 0x6a6a7a });
item({ id: SADDLE, key: "saddle", name: "Saddle", stack: 1, icon: 0, tint: 0x6b3a20 });
item({ id: NAME_TAG, key: "name_tag", name: "Name Tag", stack: 64, icon: 0, tint: 0xe8e0c8 });
item({ id: NETHER_STAR, key: "nether_star", name: "Nether Star", stack: 64, icon: 0, tint: 0xf0f0e8 });
stack(SLIMEBALL, "slimeball", "Slimeball", 0x6ac84a);
stack(MAGMA_CREAM, "magma_cream", "Magma Cream", 0xe07818);
stack(GHAST_TEAR, "ghast_tear", "Ghast Tear", 0xe8e8f0);
stack(PAPER, "paper", "Paper", 0xf0f0e8);
stack(BOOK, "book", "Book", 0x4a3a8a);
stack(SUGAR, "sugar", "Sugar", 0xf8f8f8);
stack(CLAY_BALL, "clay_ball", "Clay Ball", 0x9aacb8);
stack(BRICK_ITEM, "brick", "Brick", 0xa04a32);
stack(SNOWBALL, "snowball", "Snowball", 0xf0f4f8, 16);
stack(EGG, "egg", "Egg", 0xe8d8b0, 16);
stack(BOWL, "bowl", "Bowl", 0x8a6230);
item({ id: SPYGLASS, key: "spyglass", name: "Spyglass", stack: 1, icon: 0, tint: 0xc86a3a });
item({ id: MUSIC_DISC, key: "music_disc", name: "Music Disc", stack: 1, icon: 0, tint: 0x2a2a32 });
stack(FIREWORK, "firework", "Firework Rocket", 0xc43030);
stack(ECHO_SHARD, "echo_shard", "Echo Shard", 0x0a6a7a);
item({ id: RECOVERY_COMPASS, key: "recovery_compass", name: "Recovery Compass", stack: 1, icon: 0, tint: 0x0a6a7a });
item({ id: BUNDLE, key: "bundle", name: "Bundle", stack: 1, icon: 0, tint: 0x8a5530 });
stack(PRISMARINE_SHARD, "prismarine_shard", "Prismarine Shard", 0x5aaa9a);
stack(PRISMARINE_CRYSTALS, "prismarine_crystals", "Prismarine Crystals", 0xa8e0d0);
stack(NAUTILUS, "nautilus", "Nautilus Shell", 0xe0c8a8);
item({ id: HEART_OF_SEA, key: "heart_of_sea", name: "Heart of the Sea", stack: 64, icon: 0, tint: 0x1a6a8a });
stack(PHANTOM_MEMBRANE, "phantom_membrane", "Phantom Membrane", 0xc8c0a8);
stack(SHULKER_SHELL, "shulker_shell", "Shulker Shell", 0x8a5aa0);
stack(DRAGON_BREATH, "dragon_breath", "Dragon's Breath", 0xb07aa8);
stack(GLOW_INK, "glow_ink", "Glow Ink Sac", 0x3a8a6a);
stack(INK_SAC, "ink_sac", "Ink Sac", 0x1a1a1a);
stack(DISC_FRAGMENT, "disc_fragment", "Disc Fragment", 0x4a4a52);
item({ id: BOOK_QUILL, key: "book_quill", name: "Book and Quill", stack: 1, icon: 0, tint: 0x4a3a8a });
stack(EXPERIENCE_BOTTLE, "xp_bottle", "Bottle o' Enchanting", 0x8fbf4a);
stack(GLASS_BOTTLE, "glass_bottle", "Glass Bottle", 0xc8e0f0);
item({ id: WATER_BOTTLE, key: "water_bottle", name: "Water Bottle", stack: 1, icon: 0, tint: 0x3a78c8 });
item({ id: BOAT, key: "boat", name: "Oak Boat", stack: 1, icon: 0, tint: 0xb8945a });
item({ id: MINECART, key: "minecart", name: "Minecart", stack: 1, icon: 0, tint: 0x6a6a6a });

export function getDef(id: number): { name: string; stack: number; tint: number; tool?: ToolType; harvestLevel?: number; damage?: number; armor?: number; food?: number; place?: number; slot?: ItemDef["slot"] } | null {
  if (id <= 0) return null;
  if (id < ITEM_BASE) {
    const b = BLOCKS[id];
    if (!b || b.id === 0) return null;
    return { name: b.name, stack: b.stack, tint: b.tintTop || b.tint, place: id };
  }
  const it = ITEMS.get(id);
  if (!it) return null;
  return it;
}

export function displayName(id: number): string {
  return getDef(id)?.name ?? "Unknown";
}

export function maxStack(id: number): number {
  return getDef(id)?.stack ?? 64;
}

export function stackSlots(a: Slot, b: Slot): Slot {
  if (!a) return b;
  if (!b) return a;
  if (a.id !== b.id) return a;
  const max = maxStack(a.id);
  const n = Math.min(max, a.count + b.count);
  a.count = n;
  const left = a.count + b.count - n;
  if (left <= 0) return a;
  return a;
}

const LOGS = [OAK_LOG, BIRCH_LOG, SPRUCE_LOG, JUNGLE_LOG, ACACIA_LOG, DARK_OAK_LOG, MANGROVE_LOG, CHERRY_LOG, PALE_OAK_LOG];

function pick(out: number, count: number, pattern: (number | 0)[], table = false): Recipe {
  return { out, count, shaped: pattern, table };
}
function mix(out: number, count: number, ids: number[], table = false): Recipe {
  return { out, count, shapeless: ids, table };
}

export const RECIPES: Recipe[] = [
  mix(OAK_PLANKS, 4, [OAK_LOG]),
  mix(STICK, 4, [OAK_PLANKS, OAK_PLANKS]),
  pick(CRAFTING_TABLE, 1, [OAK_PLANKS, OAK_PLANKS, 0, OAK_PLANKS, OAK_PLANKS, 0, 0, 0, 0]),
  pick(WOOD_PICK, 1, [OAK_PLANKS, OAK_PLANKS, OAK_PLANKS, 0, STICK, 0, 0, STICK, 0], true),
  pick(STONE_PICK, 1, [COBBLE, COBBLE, COBBLE, 0, STICK, 0, 0, STICK, 0], true),
  pick(IRON_PICK, 1, [IRON_INGOT, IRON_INGOT, IRON_INGOT, 0, STICK, 0, 0, STICK, 0], true),
  pick(GOLD_PICK, 1, [GOLD_INGOT, GOLD_INGOT, GOLD_INGOT, 0, STICK, 0, 0, STICK, 0], true),
  pick(DIAMOND_PICK, 1, [DIAMOND, DIAMOND, DIAMOND, 0, STICK, 0, 0, STICK, 0], true),
  pick(WOOD_AXE, 1, [OAK_PLANKS, OAK_PLANKS, 0, OAK_PLANKS, STICK, 0, 0, STICK, 0], true),
  pick(STONE_AXE, 1, [COBBLE, COBBLE, 0, COBBLE, STICK, 0, 0, STICK, 0], true),
  pick(IRON_AXE, 1, [IRON_INGOT, IRON_INGOT, 0, IRON_INGOT, STICK, 0, 0, STICK, 0], true),
  pick(GOLD_AXE, 1, [GOLD_INGOT, GOLD_INGOT, 0, GOLD_INGOT, STICK, 0, 0, STICK, 0], true),
  pick(DIAMOND_AXE, 1, [DIAMOND, DIAMOND, 0, DIAMOND, STICK, 0, 0, STICK, 0], true),
  pick(WOOD_SHOVEL, 1, [0, OAK_PLANKS, 0, 0, STICK, 0, 0, STICK, 0], true),
  pick(STONE_SHOVEL, 1, [0, COBBLE, 0, 0, STICK, 0, 0, STICK, 0], true),
  pick(IRON_SHOVEL, 1, [0, IRON_INGOT, 0, 0, STICK, 0, 0, STICK, 0], true),
  pick(GOLD_SHOVEL, 1, [0, GOLD_INGOT, 0, 0, STICK, 0, 0, STICK, 0], true),
  pick(DIAMOND_SHOVEL, 1, [0, DIAMOND, 0, 0, STICK, 0, 0, STICK, 0], true),
  pick(WOOD_SWORD, 1, [0, OAK_PLANKS, 0, 0, OAK_PLANKS, 0, 0, STICK, 0], true),
  pick(STONE_SWORD, 1, [0, COBBLE, 0, 0, COBBLE, 0, 0, STICK, 0], true),
  pick(IRON_SWORD, 1, [0, IRON_INGOT, 0, 0, IRON_INGOT, 0, 0, STICK, 0], true),
  pick(GOLD_SWORD, 1, [0, GOLD_INGOT, 0, 0, GOLD_INGOT, 0, 0, STICK, 0], true),
  pick(DIAMOND_SWORD, 1, [0, DIAMOND, 0, 0, DIAMOND, 0, 0, STICK, 0], true),
  pick(WOOD_HOE, 1, [OAK_PLANKS, OAK_PLANKS, 0, 0, STICK, 0, 0, STICK, 0], true),
  pick(STONE_HOE, 1, [COBBLE, COBBLE, 0, 0, STICK, 0, 0, STICK, 0], true),
  pick(IRON_HOE, 1, [IRON_INGOT, IRON_INGOT, 0, 0, STICK, 0, 0, STICK, 0], true),
  pick(SHIELD, 1, [OAK_PLANKS, IRON_INGOT, OAK_PLANKS, OAK_PLANKS, OAK_PLANKS, OAK_PLANKS, 0, OAK_PLANKS, 0], true),
  pick(BOW, 1, [0, STICK, STRING, STICK, 0, STRING, 0, STICK, STRING], true),
  pick(ARROW, 4, [0, FLINT, 0, 0, STICK, 0, 0, FEATHER, 0], true),
  mix(FLINT_STEEL, 1, [IRON_INGOT, FLINT]),
  pick(TORCH, 4, [0, COAL, 0, 0, STICK, 0, 0, 0, 0]),
  pick(FURNACE, 1, [COBBLE, COBBLE, COBBLE, COBBLE, 0, COBBLE, COBBLE, COBBLE, COBBLE], true),
  pick(BUCKET, 1, [IRON_INGOT, 0, IRON_INGOT, 0, IRON_INGOT, 0, 0, 0, 0], true),
  pick(BREAD, 1, [WHEAT_ITEM, WHEAT_ITEM, WHEAT_ITEM, 0, 0, 0, 0, 0, 0]),
  pick(CHEST, 1, [OAK_PLANKS, OAK_PLANKS, OAK_PLANKS, OAK_PLANKS, 0, OAK_PLANKS, OAK_PLANKS, OAK_PLANKS, OAK_PLANKS], true),
  pick(LEATHER_HELM, 1, [LEATHER, LEATHER, LEATHER, LEATHER, 0, LEATHER, 0, 0, 0], true),
  pick(LEATHER_CHEST, 1, [LEATHER, 0, LEATHER, LEATHER, LEATHER, LEATHER, LEATHER, LEATHER, LEATHER], true),
  pick(LEATHER_LEGS, 1, [LEATHER, LEATHER, LEATHER, LEATHER, 0, LEATHER, LEATHER, 0, LEATHER], true),
  pick(LEATHER_BOOTS, 1, [LEATHER, 0, LEATHER, LEATHER, 0, LEATHER, 0, 0, 0], true),
  pick(IRON_HELM, 1, [IRON_INGOT, IRON_INGOT, IRON_INGOT, IRON_INGOT, 0, IRON_INGOT, 0, 0, 0], true),
  pick(IRON_CHEST, 1, [IRON_INGOT, 0, IRON_INGOT, IRON_INGOT, IRON_INGOT, IRON_INGOT, IRON_INGOT, IRON_INGOT, IRON_INGOT], true),
  pick(IRON_LEGS, 1, [IRON_INGOT, IRON_INGOT, IRON_INGOT, IRON_INGOT, 0, IRON_INGOT, IRON_INGOT, 0, IRON_INGOT], true),
  pick(IRON_BOOTS, 1, [IRON_INGOT, 0, IRON_INGOT, IRON_INGOT, 0, IRON_INGOT, 0, 0, 0], true),
  pick(GOLD_HELM, 1, [GOLD_INGOT, GOLD_INGOT, GOLD_INGOT, GOLD_INGOT, 0, GOLD_INGOT, 0, 0, 0], true),
  pick(GOLD_CHEST, 1, [GOLD_INGOT, 0, GOLD_INGOT, GOLD_INGOT, GOLD_INGOT, GOLD_INGOT, GOLD_INGOT, GOLD_INGOT, GOLD_INGOT], true),
  pick(GOLD_LEGS, 1, [GOLD_INGOT, GOLD_INGOT, GOLD_INGOT, GOLD_INGOT, 0, GOLD_INGOT, GOLD_INGOT, 0, GOLD_INGOT], true),
  pick(GOLD_BOOTS, 1, [GOLD_INGOT, 0, GOLD_INGOT, GOLD_INGOT, 0, GOLD_INGOT, 0, 0, 0], true),
  pick(DIAMOND_HELM, 1, [DIAMOND, DIAMOND, DIAMOND, DIAMOND, 0, DIAMOND, 0, 0, 0], true),
  pick(DIAMOND_CHEST, 1, [DIAMOND, 0, DIAMOND, DIAMOND, DIAMOND, DIAMOND, DIAMOND, DIAMOND, DIAMOND], true),
  pick(DIAMOND_LEGS, 1, [DIAMOND, DIAMOND, DIAMOND, DIAMOND, 0, DIAMOND, DIAMOND, 0, DIAMOND], true),
  pick(DIAMOND_BOOTS, 1, [DIAMOND, 0, DIAMOND, DIAMOND, 0, DIAMOND, 0, 0, 0], true),
  pick(SHEARS, 1, [0, IRON_INGOT, 0, IRON_INGOT, 0, 0, 0, 0, 0]),
  pick(COMPASS, 1, [0, IRON_INGOT, 0, IRON_INGOT, REDSTONE, IRON_INGOT, 0, IRON_INGOT, 0], true),
  pick(CLOCK, 1, [0, GOLD_INGOT, 0, GOLD_INGOT, REDSTONE, GOLD_INGOT, 0, GOLD_INGOT, 0], true),
  pick(BOWL, 1, [OAK_PLANKS, 0, OAK_PLANKS, 0, OAK_PLANKS, 0, 0, 0, 0]),
  mix(BONE_MEAL, 3, [BONE]),
  mix(EYE_OF_ENDER, 1, [ENDER_PEARL, BLAZE_POWDER]),
  mix(BLAZE_POWDER, 2, [BLAZE_ROD]),
  pick(GOLDEN_APPLE, 1, [GOLD_INGOT, GOLD_INGOT, GOLD_INGOT, GOLD_INGOT, APPLE, GOLD_INGOT, GOLD_INGOT, GOLD_INGOT, GOLD_INGOT], true),
  pick(IRON_BLOCK, 1, [IRON_INGOT, IRON_INGOT, IRON_INGOT, IRON_INGOT, IRON_INGOT, IRON_INGOT, IRON_INGOT, IRON_INGOT, IRON_INGOT], true),
  pick(GOLD_BLOCK, 1, [GOLD_INGOT, GOLD_INGOT, GOLD_INGOT, GOLD_INGOT, GOLD_INGOT, GOLD_INGOT, GOLD_INGOT, GOLD_INGOT, GOLD_INGOT], true),
  pick(DIAMOND_BLOCK, 1, [DIAMOND, DIAMOND, DIAMOND, DIAMOND, DIAMOND, DIAMOND, DIAMOND, DIAMOND, DIAMOND], true),
  mix(IRON_INGOT, 9, [IRON_BLOCK]),
  mix(GOLD_INGOT, 9, [GOLD_BLOCK]),
  mix(DIAMOND, 9, [DIAMOND_BLOCK]),
  pick(LADDER, 3, [STICK, 0, STICK, STICK, STICK, STICK, STICK, 0, STICK], true),
];

void LOGS;
void STONE;
void DIRT;
void COAL_ORE;
void IRON_ORE;
void GOLD_ORE;
void DIAMOND_ORE;
void COPPER_ORE;
void OBSIDIAN;

export const SMELT: Record<number, { out: number; xp: number }> = {
  [IRON_ORE]: { out: IRON_INGOT, xp: 7 },
  [GOLD_ORE]: { out: GOLD_INGOT, xp: 10 },
  [COPPER_ORE]: { out: COPPER_INGOT, xp: 5 },
  [COBBLE]: { out: STONE, xp: 1 },
  [OAK_LOG]: { out: CHARCOAL, xp: 2 },
  [SAND]: { out: 43, xp: 1 },
  [RAW_BEEF]: { out: COOKED_BEEF, xp: 2 },
  [RAW_PORK]: { out: COOKED_PORK, xp: 2 },
  [RAW_CHICKEN]: { out: COOKED_CHICKEN, xp: 2 },
  [POTATO]: { out: BAKED_POTATO, xp: 2 },
  [CLAY_BALL]: { out: BRICK_ITEM, xp: 3 },
};

