import type { ArenaId } from "./types";

export const ARENA_LIST: { id: ArenaId; name: string; blurb: string; code: string; seed: number }[] = [
  { id: "duel", name: "Dual", blurb: "100 levels vs a bot. Sword, shield, gapple. No building.", code: "dual", seed: 20260829 },
  { id: "bedwars", name: "Bed Wars", blurb: "Protect your bed. Break theirs. Iron, wool, void.", code: "bedwars", seed: 20260830 },
  { id: "skywars", name: "Sky Wars", blurb: "Loot islands in the sky. Last player standing.", code: "skywars", seed: 20260831 },
  { id: "ctf", name: "Capture the Flag", blurb: "Steal the enemy banner. Hold the point.", code: "ctf", seed: 20260901 },
];

export const ARENA_SPAWN: Record<ArenaId, { x: number; y: number; z: number; yaw: number }> = {
  duel: { x: 0.5, y: 34, z: -16.5, yaw: Math.PI },
  bedwars: { x: 0.5, y: 50, z: -20.5, yaw: 0 },
  skywars: { x: 0.5, y: 58, z: -16.5, yaw: 0 },
  ctf: { x: 0.5, y: 34, z: -18.5, yaw: 0 },
};

export const ARENA_BOT: Record<ArenaId, { x: number; y: number; z: number }> = {
  duel: { x: 0.5, y: 33, z: 16.5 },
  bedwars: { x: 0.5, y: 50, z: 20.5 },
  skywars: { x: 16.5, y: 58, z: 16.5 },
  ctf: { x: 0.5, y: 34, z: 18.5 },
};

export function isArena(a: string | null | undefined): a is ArenaId {
  return a === "duel" || a === "bedwars" || a === "skywars" || a === "ctf";
}

export function duelStats(level: number) {
  const lv = Math.max(1, Math.min(100, Math.floor(level) || 1));
  return {
    level: lv,
    hp: 20 + (lv - 1) * 2.35,
    speed: 5.6 + (lv - 1) * 0.046,
    dmg: 8 + (lv - 1) * 0.22,
    cooldown: Math.max(0.26, 0.55 - (lv - 1) * 0.0024),
  };
}

export const WORKSHOP_TEMPLATE = `{
  "name": "Free Will Realm",
  "pvp": true,
  "keepInventory": false,
  "maxHealth": 20,
  "gamerules": {
    "keepInventory": false,
    "mobGriefing": true,
    "doDaylightCycle": true,
    "doMobSpawning": true,
    "pvp": true
  },
  "ai": {
    "default": "wander",
    "aggression": 0.75,
    "strafe": true,
    "flee": true
  },
  "mobs": [
    { "kind": "villager", "ai": "wander", "offset": [6, 0, 4] },
    { "kind": "golem", "ai": "guard", "offset": [8, 0, 2] },
    { "kind": "wolf", "ai": "wander", "offset": [-5, 0, 6] },
    { "kind": "pillager", "ai": "chase", "hostile": true, "offset": [16, 0, 12] },
    { "kind": "creeper", "ai": "circle", "hostile": true, "offset": [-12, 0, 10] }
  ],
  "kit": [
    { "id": 10023, "count": 1 },
    { "id": 10055, "count": 8 },
    { "id": 10101, "count": 1 },
    { "id": 10106, "count": 1 },
    { "id": 10105, "count": 1 },
    { "id": 10170, "count": 4 },
    { "id": 10168, "count": 1 }
  ],
  "armor": [10081, 10082, 10083, 10084],
  "offhand": 10031
}`;
