import type { Dim, GameMode, PlayerSave, Slot, WorldMeta } from "./types";

const META_KEY = "moc.worlds.v1";
const PROFILE_KEY = "moc.profile.v1";
const SETTINGS_KEY = "moc.settings.v1";
const DB = "mine-or-craft";
const DB_VER = 1;

export interface Friend {
  name: string;
  code: string;
}

export interface Profile {
  version: number;
  username: string;
  xp: number;
  skin: string;
  unlocked: string[];
  dualLevel: number;
  dualBest: number;
  friends: Friend[];
  ownedPacks: string[];
  passUntil: number;
  playSeconds: number;
  guest: boolean;
  stars: number;
  diamonds: number;
  clears: number;
  tosAccepted: boolean;
}

export const DEFAULT_PROFILE: Profile = {
  version: 1,
  username: "Player",
  xp: 0,
  skin: "steve",
  unlocked: [],
  dualLevel: 1,
  dualBest: 1,
  friends: [],
  ownedPacks: [],
  passUntil: 0,
  playSeconds: 0,
  guest: false,
  stars: 0,
  diamonds: 0,
  clears: 0,
  tosAccepted: false,
};

const SESSION_KEY = "moc.session.v1";
const ACCOUNTS_KEY = "moc.accounts.v1";

export function hashPass(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16);
}

export function loadSession(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function saveSession(name: string | null) {
  try {
    if (name) localStorage.setItem(SESSION_KEY, name);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* */
  }
}

interface AccountRec {
  pass: string;
  profile: Profile;
}

function loadAccounts(): Record<string, AccountRec> {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, AccountRec>) : {};
  } catch {
    return {};
  }
}

function saveAccounts(a: Record<string, AccountRec>) {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(a));
  } catch {
    /* */
  }
}

export function signInAccount(username: string, password: string): { ok: boolean; msg: string; profile: Profile } {
  const name = username.trim().slice(0, 16);
  if (!name) return { ok: false, msg: "Pick a username.", profile: { ...DEFAULT_PROFILE } };
  if (!password) return { ok: false, msg: "Password required.", profile: { ...DEFAULT_PROFILE, username: name } };
  const accounts = loadAccounts();
  const key = name.toLowerCase();
  const rec = accounts[key];
  if (!rec || !rec.pass) {
    return { ok: false, msg: "No account with that name. Sign up first.", profile: { ...DEFAULT_PROFILE, username: name } };
  }
  if (rec.pass !== hashPass(password)) {
    return { ok: false, msg: "Wrong password for that name.", profile: { ...DEFAULT_PROFILE, username: name } };
  }
  const profile: Profile = { ...DEFAULT_PROFILE, ...rec.profile, username: name, guest: false };
  accounts[key] = { pass: rec.pass, profile };
  saveAccounts(accounts);
  saveSession(name);
  saveProfile(profile);
  return { ok: true, msg: "Signed in.", profile };
}

export function signUpAccount(username: string, password: string): { ok: boolean; msg: string; profile: Profile } {
  const name = username.trim().slice(0, 16);
  if (!name) return { ok: false, msg: "Pick a username.", profile: { ...DEFAULT_PROFILE } };
  if (password.length < 4) return { ok: false, msg: "Password needs at least 4 characters.", profile: { ...DEFAULT_PROFILE, username: name } };
  const accounts = loadAccounts();
  const key = name.toLowerCase();
  if (accounts[key]?.pass) {
    return { ok: false, msg: "That name is taken. Sign in instead.", profile: { ...DEFAULT_PROFILE, username: name } };
  }
  const profile: Profile = { ...DEFAULT_PROFILE, username: name, guest: false, tosAccepted: true };
  accounts[key] = { pass: hashPass(password), profile };
  saveAccounts(accounts);
  saveSession(name);
  saveProfile(profile);
  return { ok: true, msg: "Account created.", profile };
}

export function enterGuest(username?: string): Profile {
  const name = (username?.trim() || "Guest").slice(0, 16);
  const profile: Profile = { ...DEFAULT_PROFILE, username: name, guest: true, tosAccepted: false };
  saveSession(`guest:${name}`);
  saveProfile(profile);
  return profile;
}

export function registerAccount(username: string, password: string): { ok: boolean; msg: string; profile: Profile } {
  if (!password) {
    return { ok: true, msg: "Guest.", profile: enterGuest(username) };
  }
  const accounts = loadAccounts();
  const key = username.trim().toLowerCase();
  if (accounts[key]?.pass) return signInAccount(username, password);
  return signUpAccount(username, password);
}

export function persistAccountProfile(profile: Profile) {
  const accounts = loadAccounts();
  const key = profile.username.toLowerCase();
  const prev = accounts[key];
  accounts[key] = { pass: prev?.pass ?? "", profile };
  saveAccounts(accounts);
}

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
    killedStorm: false,
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

/** Cloudflare bundler must see these names as exports (login + guest). */
void signInAccount;
void signUpAccount;
void enterGuest;

