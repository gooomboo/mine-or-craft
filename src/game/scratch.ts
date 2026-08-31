import { labBlockList } from "./blocks";
import { ITEMS } from "./items";

export type HatKind = string;
export type OpKind = string;

export type PublishMode = "private" | "friends" | "market" | "host";

export interface HatDef {
  id: HatKind;
  label: string;
  color: string;
  every?: boolean;
}

export interface OpDef {
  id: OpKind;
  label: string;
  color: string;
  fields?: Array<"item" | "count" | "text" | "mob" | "seconds" | "onoff">;
}

export interface StackBlock {
  op: OpKind;
  id?: number;
  count?: number;
  text?: string;
  kind?: string;
  value?: number;
}

export interface ScriptCard {
  when: HatKind;
  every: number;
  do: StackBlock[];
}

export interface CustomBlock {
  slot: number;
  name: string;
  tint: number;
  pixels: number[];
}

export interface CustomSound {
  name: string;
  dataUrl: string;
}

export interface CustomBoss {
  kind: string;
  name: string;
  hp: number;
  tint?: number;
  speed?: number;
  dmg?: number;
}

export interface GameProject {
  id: string;
  name: string;
  author: string;
  published: boolean;
  publishMode: PublishMode;
  priceXp: number;
  scripts: ScriptCard[];
  commands: string[];
  jsonRaw: string;
  nbt: { noAI: boolean; invulnerable: boolean; customName: string; silent?: boolean; glowing?: boolean };
  textures: Record<string, string>;
  customBlocks: CustomBlock[];
  sounds: CustomSound[];
  bosses: CustomBoss[];
  spawnBiome: string;
  folder: string;
  allowCheats: boolean;
  notes: string;
}

const Y = "#f7c33a";
const B = "#4c97ff";
const G = "#59c059";
const R = "#ff6680";
const P = "#9966ff";
const O = "#ff8c1a";
const T = "#f7c33a";

export const HATS: HatDef[] = [
  { id: "start", label: "when world starts", color: Y },
  { id: "join", label: "when a player joins", color: Y },
  { id: "death", label: "when player dies", color: Y },
  { id: "hurt", label: "when player is hurt", color: Y },
  { id: "kill", label: "when player gets a kill", color: Y },
  { id: "use", label: "when player uses an item", color: Y },
  { id: "place", label: "when player places a block", color: Y },
  { id: "break", label: "when player breaks a block", color: Y },
  { id: "chat", label: "when player chats", color: Y },
  { id: "tick", label: "every [n] seconds", color: Y, every: true },
  { id: "jump", label: "when player jumps", color: Y },
  { id: "land", label: "when player lands", color: Y },
  { id: "sneak", label: "when player sneaks", color: Y },
  { id: "sprint", label: "when player sprints", color: Y },
  { id: "swim", label: "when player swims", color: Y },
  { id: "eat", label: "when player eats", color: Y },
  { id: "craft", label: "when player opens crafting", color: Y },
  { id: "sleep", label: "when player sleeps", color: Y },
  { id: "respawn", label: "when player respawns", color: Y },
  { id: "morning", label: "when morning comes", color: Y },
  { id: "night", label: "when night falls", color: Y },
  { id: "rain", label: "when it rains", color: Y },
  { id: "nether", label: "when player enters the Nether", color: Y },
  { id: "end", label: "when player enters the End", color: Y },
  { id: "ride", label: "when player rides", color: Y },
  { id: "drop", label: "when player drops an item", color: Y },
  { id: "pickup", label: "when player picks up an item", color: Y },
  { id: "open", label: "when player opens a chest", color: Y },
  { id: "fly", label: "when player starts flying", color: Y },
  { id: "fall", label: "when player starts falling", color: Y },
  { id: "portal", label: "when player stands in a portal", color: Y },
  { id: "boat", label: "when player boards a boat", color: Y },
];

export const OPS: OpDef[] = [
  { id: "say", label: "say [text]", color: B, fields: ["text"] },
  { id: "tellraw", label: "show styled text [text]", color: B, fields: ["text"] },
  { id: "title", label: "title on screen [text]", color: B, fields: ["text"] },
  { id: "broadcast", label: "broadcast [text]", color: B, fields: ["text"] },
  { id: "msg", label: "whisper [text]", color: B, fields: ["text"] },
  { id: "countdown", label: "countdown [n] seconds", color: B, fields: ["count"] },
  { id: "give", label: "give item [id] x [n]", color: G, fields: ["item", "count"] },
  { id: "giveall", label: "give that item to hotbar", color: G, fields: ["item"] },
  { id: "kit", label: "give starter kit", color: G },
  { id: "armor", label: "equip diamond armor", color: G },
  { id: "totem", label: "give totem", color: G },
  { id: "pearl", label: "give ender pearls x [n]", color: G, fields: ["count"] },
  { id: "bow", label: "give bow and arrows", color: G },
  { id: "shield", label: "give shield", color: G },
  { id: "food", label: "give steak x [n]", color: G, fields: ["count"] },
  { id: "torch", label: "give torches x [n]", color: G, fields: ["count"] },
  { id: "blocks", label: "give building blocks", color: G },
  { id: "diamond", label: "give diamonds x [n]", color: G, fields: ["count"] },
  { id: "netherite", label: "give netherite gear", color: G },
  { id: "elytra", label: "give elytra + fireworks", color: G },
  { id: "boat", label: "spawn a boat here", color: G },
  { id: "clear", label: "clear inventory", color: O },
  { id: "clearhotbar", label: "clear hotbar", color: O },
  { id: "fillhotbar", label: "fill hotbar with [id]", color: G, fields: ["item"] },
  { id: "spawn", label: "spawn [mob]", color: R, fields: ["mob"] },
  { id: "boss", label: "spawn boss [mob]", color: R, fields: ["mob"] },
  { id: "kill", label: "remove nearby mobs", color: R },
  { id: "anger", label: "anger nearby mobs", color: R },
  { id: "calm", label: "calm nearby mobs", color: R },
  { id: "health", label: "set health to [n]", color: R, fields: ["count"] },
  { id: "heal", label: "fully heal", color: R },
  { id: "damage", label: "hurt player [n]", color: R, fields: ["count"] },
  { id: "hunger", label: "set hunger to [n]", color: R, fields: ["count"] },
  { id: "saturation", label: "fill hunger", color: R },
  { id: "absorption", label: "absorption hearts [n]", color: R, fields: ["count"] },
  { id: "poison", label: "poison [n] seconds", color: P, fields: ["count"] },
  { id: "effect", label: "give effect [text] seconds [n]", color: P, fields: ["text", "count"] },
  { id: "speed", label: "speed [n] seconds", color: P, fields: ["count"] },
  { id: "jumpboost", label: "jump boost [n] seconds", color: P, fields: ["count"] },
  { id: "nightvis", label: "night vision [n] seconds", color: P, fields: ["count"] },
  { id: "invis", label: "invisibility [n] seconds", color: P, fields: ["count"] },
  { id: "fire", label: "set player on fire", color: O },
  { id: "extinguish", label: "extinguish player", color: B },
  { id: "glow", label: "glowing [n] seconds", color: P, fields: ["count"] },
  { id: "smite", label: "lightning strike", color: O },
  { id: "lightning", label: "lightning at player", color: O },
  { id: "explode", label: "small explosion nearby", color: O },
  { id: "tnt", label: "place TNT nearby", color: O },
  { id: "firework", label: "firework boost", color: P },
  { id: "launch", label: "launch player up", color: P },
  { id: "fly", label: "toggle fly", color: O, fields: ["onoff"] },
  { id: "god", label: "toggle god mode", color: O, fields: ["onoff"] },
  { id: "freeze", label: "freeze player", color: P },
  { id: "thaw", label: "unfreeze player", color: P },
  { id: "hide", label: "hide player body", color: P },
  { id: "show", label: "show player body", color: P },
  { id: "spectate", label: "spectator mode", color: O },
  { id: "adventure", label: "adventure mode", color: O },
  { id: "creative", label: "creative mode", color: O },
  { id: "survival", label: "survival mode", color: O },
  { id: "time", label: "set time day/night", color: P, fields: ["onoff"] },
  { id: "day", label: "set day", color: P },
  { id: "night", label: "set night", color: P },
  { id: "timeadd", label: "skip [n] seconds of day", color: P, fields: ["count"] },
  { id: "weather", label: "weather clear/rain", color: B, fields: ["onoff"] },
  { id: "clearsky", label: "clear weather", color: B },
  { id: "storm", label: "start a storm", color: B },
  { id: "xp", label: "give [n] XP", color: G, fields: ["count"] },
  { id: "xplevel", label: "set XP level [n]", color: G, fields: ["count"] },
  { id: "score", label: "add 1 to score", color: B },
  { id: "addscore", label: "add [n] to score", color: B, fields: ["count"] },
  { id: "setscore", label: "set score to [n]", color: B, fields: ["count"] },
  { id: "tp", label: "teleport player [text]", color: P, fields: ["text"] },
  { id: "randomtp", label: "random teleport nearby", color: P },
  { id: "spawnpoint", label: "set spawn here", color: P },
  { id: "checkpoint", label: "save checkpoint", color: P },
  { id: "loadcheck", label: "load checkpoint", color: P },
  { id: "gamemode", label: "set gamemode [text]", color: O, fields: ["text"] },
  { id: "gamerule", label: "gamerule [text]", color: O, fields: ["text"] },
  { id: "pvp", label: "set PvP on/off", color: O, fields: ["onoff"] },
  { id: "keep", label: "keep inventory on/off", color: O, fields: ["onoff"] },
  { id: "setblock", label: "setblock id [id]", color: G, fields: ["item"] },
  { id: "fill", label: "fill nearby with [id]", color: G, fields: ["item"] },
  { id: "cage", label: "glass cage around player", color: G },
  { id: "floor", label: "stone floor under player", color: G },
  { id: "wall", label: "wall in front of player", color: G },
  { id: "platform", label: "wood platform", color: G },
  { id: "pillar", label: "stone pillar", color: G },
  { id: "house", label: "tiny oak hut", color: G },
  { id: "sphere", label: "glass dome", color: G },
  { id: "beacon", label: "place a beacon pad", color: G },
  { id: "water", label: "place water nearby", color: B },
  { id: "lava", label: "place lava nearby", color: O },
  { id: "ice", label: "ice rink under player", color: B },
  { id: "obsidian", label: "obsidian pad", color: P },
  { id: "clone", label: "clone nearby blocks forward", color: G },
  { id: "execute", label: "execute [text]", color: B, fields: ["text"] },
  { id: "nbt", label: "merge data [text]", color: R, fields: ["text"] },
  { id: "nametag", label: "name nearby mobs [text]", color: R, fields: ["text"] },
  { id: "sound", label: "play sound [text]", color: P, fields: ["text"] },
  { id: "playsound", label: "play built-in [text]", color: P, fields: ["text"] },
  { id: "stopsound", label: "stop extra sounds", color: P },
  { id: "particle", label: "burst particles", color: P },
  { id: "difficulty", label: "difficulty [text]", color: O, fields: ["text"] },
  { id: "ride", label: "mount nearest mob", color: R },
  { id: "dismount", label: "dismount", color: R },
  { id: "seed", label: "show world seed", color: B },
  { id: "kick", label: "kick to title (local)", color: O },
  { id: "restart", label: "respawn at spawn", color: O },
  { id: "lose", label: "player loses", color: R },
  { id: "win", label: "player wins the game", color: T },
];

function labItems(): { id: number; name: string }[] {
  const out: { id: number; name: string }[] = [];
  const seen = new Set<number>();
  for (const [id, def] of ITEMS) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, name: def.name });
  }
  for (const b of labBlockList(180)) {
    if (seen.has(b.id)) continue;
    seen.add(b.id);
    out.push({ id: b.id, name: b.name });
  }
  if (!seen.has(28000)) out.push({ id: 28000, name: "Custom block 1" });
  return out;
}

export const ITEM_PICKS: { id: number; name: string }[] = labItems();

export const MOB_PICKS = [
  "pig",
  "cow",
  "sheep",
  "chicken",
  "wolf",
  "horse",
  "fox",
  "cat",
  "villager",
  "golem",
  "creeper",
  "zombie",
  "skeleton",
  "spider",
  "enderman",
  "witch",
  "slime",
  "drowned",
  "husk",
  "stray",
  "phantom",
  "pillager",
  "blaze",
  "ghast",
  "magmacube",
  "wither_skel",
  "piglin",
  "hoglin",
  "strider",
  "endermite",
  "shulker",
  "wraith",
  "dragon",
  "wither",
  "wither_storm",
  "duelist",
  "bee",
  "polar_bear",
  "panda",
  "llama",
  "parrot",
  "goat",
  "frog",
  "squid",
  "dolphin",
  "axolotl",
  "guardian",
  "ravager",
  "vindicator",
  "evoker",
  "vex",
  "bat",
  "silverfish",
  "cave_spider",
  "zombie_villager",
  "snow_golem",
  "camel",
  "sniffer",
  "armadillo",
  "allay",
  "warden",
  "breeze",
  "piglin_brute",
  "zombified_piglin",
  "custom_boss",
];

export const VANILLA_TEX = labBlockList(240);

export function detectXpFarm(p: GameProject): { farm: boolean; reason: string } {
  let xpPerMin = 0;
  let spawnPerMin = 0;
  let tickXp = 0;
  let startXp = 0;
  let xpOps = 0;
  for (const s of p.scripts ?? []) {
    const xp = (s.do ?? []).filter((o) => o.op === "xp" || o.op === "xplevel");
    const spawn = (s.do ?? []).filter((o) => o.op === "spawn" || o.op === "boss");
    const amt = xp.reduce((a, o) => a + Math.max(1, o.count || 1), 0);
    xpOps += xp.length;
    if (s.when === "start") startXp += amt;
    if (s.when === "tick") {
      const every = Math.max(1, s.every || 8);
      tickXp += amt;
      xpPerMin += (amt * 60) / every;
      spawnPerMin += (spawn.length * 60) / every;
    }
    if (s.when === "kill" && amt >= 8) xpPerMin += amt * 6;
  }
  if (startXp >= 200) return { farm: true, reason: "Start script dumps too much XP." };
  if (xpPerMin >= 40) return { farm: true, reason: "Tick XP looks like an AFK farm." };
  if (tickXp > 0 && spawnPerMin >= 20) return { farm: true, reason: "Spawn + XP tick is a farm." };
  const cmds = (p.commands ?? []).join("\n").toLowerCase();
  if ((/xp\s+give|give\s+@\S+\s+\S*xp|addxp/.test(cmds) && /execute/.test(cmds)) || (cmds.match(/xp/g) ?? []).length >= 4) {
    return { farm: true, reason: "Command loop grants XP." };
  }
  if (xpOps >= 6) return { farm: true, reason: "Too many XP actions." };
  return { farm: false, reason: "" };
}

const GAMES_KEY = "moc.games.v1";

export function emptyPixels(color = 0x7a9a4a): number[] {
  return Array.from({ length: 16 * 16 }, () => color);
}

export function emptyProject(author: string): GameProject {
  return {
    id: `g-${Date.now()}`,
    name: "Untitled Game",
    author,
    published: false,
    publishMode: "private",
    priceXp: 0,
    scripts: [
      {
        when: "start",
        every: 8,
        do: [
          { op: "say", text: "Game on!" },
          { op: "give", id: 10023, count: 1 },
        ],
      },
    ],
    commands: ["/say @a Welcome", "/give @s diamond_sword 1"],
    jsonRaw: '{"text":"Welcome","color":"gold","bold":true}',
    nbt: { noAI: false, invulnerable: false, customName: "", silent: false, glowing: false },
    textures: {},
    customBlocks: [],
    sounds: [],
    bosses: [],
    spawnBiome: "plains",
    folder: "Saves",
    allowCheats: true,
    notes: "",
  };
}

export function loadGames(): GameProject[] {
  try {
    const raw = localStorage.getItem(GAMES_KEY);
    const list = raw ? (JSON.parse(raw) as GameProject[]) : [];
    return list.map(normalizeGame);
  } catch {
    return [];
  }
}

export function normalizeGame(g: Partial<GameProject> & { name?: string }): GameProject {
  const base = emptyProject(g.author || "Player");
  return {
    ...base,
    ...g,
    id: g.id || base.id,
    name: g.name || base.name,
    publishMode: g.publishMode || (g.published ? "market" : "private"),
    scripts: g.scripts ?? base.scripts,
    commands: g.commands ?? [],
    jsonRaw: g.jsonRaw ?? "",
    nbt: { ...base.nbt, ...(g.nbt ?? {}) },
    textures: g.textures ?? {},
    customBlocks: g.customBlocks ?? [],
    sounds: g.sounds ?? [],
    bosses: g.bosses ?? [],
    spawnBiome: g.spawnBiome || "plains",
    folder: g.folder || "Saves",
    allowCheats: g.allowCheats !== false,
    notes: g.notes ?? "",
  };
}

export function saveGames(list: GameProject[]) {
  try {
    localStorage.setItem(GAMES_KEY, JSON.stringify(list.slice(0, 40)));
  } catch {
    /* */
  }
}

export function compileGame(p: GameProject): string {
  const kit: { id: number; count: number }[] = [];
  const mobs: { kind: string; offset: number[] }[] = [];
  let pvp = true;
  let keepInventory = false;
  for (const s of p.scripts) {
    if (s.when !== "start") continue;
    for (const op of s.do) {
      if (op.op === "give" && op.id) kit.push({ id: op.id, count: Math.max(1, op.count || 1) });
      if (op.op === "spawn" && op.kind) mobs.push({ kind: op.kind, offset: [4 + mobs.length * 2, 0, 3] });
      if (op.op === "pvp") pvp = (op.value ?? 1) !== 0;
      if (op.op === "keep") keepInventory = (op.value ?? 1) !== 0;
    }
  }
  for (const b of p.bosses ?? []) {
    mobs.push({ kind: b.kind, offset: [10, 4, 10] });
  }
  return JSON.stringify(
    {
      name: p.name,
      pvp,
      keepInventory,
      gamerules: { pvp, keepInventory, doMobSpawning: true, doDaylightCycle: true },
      kit,
      mobs,
      scripts: p.scripts,
      commands: p.commands,
      nbt: p.nbt,
      textures: p.textures,
      customBlocks: p.customBlocks,
      sounds: p.sounds,
      bosses: p.bosses,
      spawnBiome: p.spawnBiome,
      jsonRaw: p.jsonRaw,
      allowCheats: p.allowCheats,
      publishMode: p.publishMode,
      author: p.author,
      xpFarm: detectXpFarm(p).farm,
    },
    null,
    2,
  );
}

export type { GameProject as ScratchGame };
