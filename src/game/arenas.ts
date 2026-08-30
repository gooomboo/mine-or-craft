import type { ArenaId } from "./types";

export const ARENA_LIST: { id: ArenaId; name: string; blurb: string; code: string; seed: number }[] = [
  { id: "duel", name: "Dual", blurb: "1v1 · sword · shield · golden apple · pearls", code: "dual", seed: 20260829 },
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

export const WORKSHOP_TEMPLATE = `{
  "name": "My Server",
  "pvp": true,
  "keepInventory": false,
  "maxHealth": 20,
  "kit": [
    { "id": 10023, "count": 1 },
    { "id": 10055, "count": 8 },
    { "id": 10032, "count": 1 },
    { "id": 10033, "count": 32 }
  ],
  "armor": [10081, 10082, 10083, 10084],
  "offhand": 10031
}`;
