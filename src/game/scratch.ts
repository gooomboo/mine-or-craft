export type HatKind = "start" | "death" | "kill" | "tick" | "use" | "hurt" | "chat" | "join" | "place";
export type OpKind =
  | "say"
  | "give"
  | "spawn"
  | "health"
  | "time"
  | "xp"
  | "pvp"
  | "keep"
  | "win"
  | "score"
  | "tp"
  | "gamemode"
  | "effect"
  | "setblock"
  | "execute"
  | "tellraw"
  | "nbt"
  | "weather"
  | "difficulty"
  | "sound"
  | "boss"
  | "title"
  | "kill"
  | "gamerule"
  | "fill"
  | "spawnpoint"
  | "particle";

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

export const HATS: HatDef[] = [
  { id: "start", label: "when world starts", color: "#f7c33a" },
  { id: "join", label: "when a player joins", color: "#f7c33a" },
  { id: "death", label: "when player dies", color: "#f7c33a" },
  { id: "hurt", label: "when player is hurt", color: "#f7c33a" },
  { id: "kill", label: "when player gets a kill", color: "#f7c33a" },
  { id: "use", label: "when player uses an item", color: "#f7c33a" },
  { id: "place", label: "when player places a block", color: "#f7c33a" },
  { id: "chat", label: "when player chats", color: "#f7c33a" },
  { id: "tick", label: "every [n] seconds", color: "#f7c33a", every: true },
];

export const OPS: OpDef[] = [
  { id: "say", label: "say [text]", color: "#4c97ff", fields: ["text"] },
  { id: "tellraw", label: "show styled text [text]", color: "#4c97ff", fields: ["text"] },
  { id: "title", label: "title on screen [text]", color: "#4c97ff", fields: ["text"] },
  { id: "give", label: "give item [id] x [n]", color: "#59c059", fields: ["item", "count"] },
  { id: "spawn", label: "spawn [mob]", color: "#ff6680", fields: ["mob"] },
  { id: "boss", label: "spawn boss [mob]", color: "#ff6680", fields: ["mob"] },
  { id: "kill", label: "remove nearby mobs", color: "#ff6680" },
  { id: "health", label: "set health to [n]", color: "#ff6680", fields: ["count"] },
  { id: "effect", label: "give effect [text] seconds [n]", color: "#9966ff", fields: ["text", "count"] },
  { id: "time", label: "set time day/night", color: "#9966ff", fields: ["onoff"] },
  { id: "weather", label: "weather clear/rain", color: "#4c97ff", fields: ["onoff"] },
  { id: "xp", label: "give [n] XP", color: "#59c059", fields: ["count"] },
  { id: "score", label: "add 1 to score", color: "#4c97ff" },
  { id: "tp", label: "teleport player [text]", color: "#9966ff", fields: ["text"] },
  { id: "spawnpoint", label: "set spawn here", color: "#9966ff" },
  { id: "gamemode", label: "set gamemode [text]", color: "#ff8c1a", fields: ["text"] },
  { id: "gamerule", label: "gamerule [text]", color: "#ff8c1a", fields: ["text"] },
  { id: "pvp", label: "set PvP on/off", color: "#ff8c1a", fields: ["onoff"] },
  { id: "keep", label: "keep inventory on/off", color: "#ff8c1a", fields: ["onoff"] },
  { id: "setblock", label: "setblock id [id]", color: "#59c059", fields: ["item"] },
  { id: "fill", label: "fill nearby with [id]", color: "#59c059", fields: ["item"] },
  { id: "execute", label: "execute [text]", color: "#4c97ff", fields: ["text"] },
  { id: "nbt", label: "merge data [text]", color: "#ff6680", fields: ["text"] },
  { id: "sound", label: "play sound [text]", color: "#9966ff", fields: ["text"] },
  { id: "particle", label: "burst particles", color: "#9966ff" },
  { id: "difficulty", label: "difficulty [text]", color: "#ff8c1a", fields: ["text"] },
  { id: "win", label: "player wins the game", color: "#f7c33a" },
];

export const ITEM_PICKS: { id: number; name: string }[] = [
  { id: 10023, name: "Diamond sword" },
  { id: 10031, name: "Shield" },
  { id: 10055, name: "Golden apple" },
  { id: 10032, name: "Bow" },
  { id: 1, name: "Grass" },
  { id: 19, name: "Oak planks" },
  { id: 42, name: "Torch" },
  { id: 10101, name: "Boat" },
  { id: 10105, name: "Totem" },
  { id: 10106, name: "Elytra" },
  { id: 10049, name: "Steak" },
  { id: 201, name: "Command block" },
  { id: 28000, name: "Custom block 1" },
];

export const MOB_PICKS = [
  "zombie",
  "skeleton",
  "creeper",
  "villager",
  "golem",
  "wolf",
  "piglin",
  "blaze",
  "ghast",
  "enderman",
  "shulker",
  "dragon",
  "wither",
  "wither_storm",
];

export const VANILLA_TEX = ["grass", "stone", "dirt", "oak_log", "sand", "netherrack", "water", "oak_planks", "cobble", "glass"];

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
    },
    null,
    2,
  );
}

export type { GameProject as ScratchGame };
