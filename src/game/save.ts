import type { Dim, GameMode, PlayerSave, Slot, WorldMeta } from "./types";

const META_KEY = "moc.worlds.v1";
const PROFILE_KEY = "moc.profile.v1";
const SETTINGS_KEY = "moc.settings.v1";
const DB = "mine-or-craft";
const DB_VER = 1;

export interface Profile {
  version: number;
  username: string;
  xp: number;
  skin: string;
  unlocked: string[];
}

export const DEFAULT_PROFILE: Profile = {
  version: 1,
  username: "Player",
  xp: 0,
  skin: "steve",
  unlocked: [],
};

function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("chunks")) db.createObjectStore("chunks");
      if (!db.objectStoreNames.contains("players")) db.createObjectStore("players");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function loadWorlds(): WorldMeta[] {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as WorldMeta[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveWorlds(list: WorldMeta[]) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(list));
  } catch {
    /* quota */
  }
}

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(p: Profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  } catch {
    /* */
  }
}

export function loadSettingsRaw(): string | null {
  try {
    return localStorage.getItem(SETTINGS_KEY);
  } catch {
    return null;
  }
}

export function saveSettingsRaw(s: string) {
  try {
    localStorage.setItem(SETTINGS_KEY, s);
  } catch {
    /* */
  }
}

export async function savePlayer(worldId: string, data: PlayerSave) {
  try {
    const db = await idb();
    await new Promise<void>((res, rej) => {
      const tx = db.transaction("players", "readwrite");
      tx.objectStore("players").put(data, worldId);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  } catch {
    /* */
  }
}

export async function loadPlayer(worldId: string): Promise<PlayerSave | null> {
  try {
    const db = await idb();
    const data = await new Promise<PlayerSave | null>((res, rej) => {
      const tx = db.transaction("players", "readonly");
      const r = tx.objectStore("players").get(worldId);
      r.onsuccess = () => res((r.result as PlayerSave) ?? null);
      r.onerror = () => rej(r.error);
    });
    db.close();
    return data;
  } catch {
    return null;
  }
}

export async function saveChunks(worldId: string, edits: Map<string, Uint16Array>) {
  try {
    const db = await idb();
    await new Promise<void>((res, rej) => {
      const tx = db.transaction("chunks", "readwrite");
      const store = tx.objectStore("chunks");
      for (const [k, v] of edits) store.put(v, `${worldId}:${k}`);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  } catch {
    /* */
  }
}

export async function loadChunks(worldId: string): Promise<Map<string, Uint16Array>> {
  const out = new Map<string, Uint16Array>();
  try {
    const db = await idb();
    const keys: IDBValidKey[] = await new Promise((res, rej) => {
      const tx = db.transaction("chunks", "readonly");
      const r = tx.objectStore("chunks").getAllKeys();
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    const prefix = `${worldId}:`;
    for (const key of keys) {
      const s = String(key);
      if (!s.startsWith(prefix)) continue;
      const val: Uint16Array = await new Promise((res, rej) => {
        const tx = db.transaction("chunks", "readonly");
        const r = tx.objectStore("chunks").get(key);
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
      if (val) out.set(s.slice(prefix.length), val);
    }
    db.close();
  } catch {
    /* */
  }
  return out;
}

export async function deleteWorldData(worldId: string) {
  const list = loadWorlds().filter((w) => w.id !== worldId);
  saveWorlds(list);
  try {
    const db = await idb();
    const tx = db.transaction(["chunks", "players"], "readwrite");
    tx.objectStore("players").delete(worldId);
    const keys: IDBValidKey[] = await new Promise((res) => {
      const r = tx.objectStore("chunks").getAllKeys();
      r.onsuccess = () => res(r.result);
    });
    const prefix = `${worldId}:`;
    for (const k of keys) if (String(k).startsWith(prefix)) tx.objectStore("chunks").delete(k);
    db.close();
  } catch {
    /* */
  }
}

export function blankPlayer(spawn: { x: number; y: number; z: number }, dim: Dim = "overworld"): PlayerSave {
  return {
    x: spawn.x,
    y: spawn.y,
    z: spawn.z,
    yaw: 0,
    pitch: 0,
    dim,
    health: 20,
    hunger: 20,
    xp: 0,
    xpLevel: 0,
    flying: false,
    inventory: Array.from({ length: 36 }, () => null) as Slot[],
    armor: [null, null, null, null],
    offhand: null,
    hotbar: 0,
    time: 0,
    weather: 0,
    killedDragon: false,
    advancements: [],
  };
}

export function newWorldMeta(name: string, seed: number, mode: GameMode, cheats: boolean): WorldMeta {
  const id = `w-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    version: 1,
    id,
    name,
    seed,
    mode,
    cheats,
    created: Date.now(),
    played: Date.now(),
    spawn: { x: 0.5, y: 80, z: 0.5 },
    published: false,
    priceXp: 0,
    code: id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 16),
  };
}
