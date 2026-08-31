import { compileGame, detectXpFarm, loadGames } from "./scratch";
import { buyMarketSkin, loadMarket, resolveSkin, saveLiveSkin, type MarketSkin, type SkinData } from "./skins";
import { loadWorlds, newWorldMeta, persistAccountProfile, saveProfile, type Profile } from "./save";
import type { GameMode, WorldMeta } from "./types";

export type MarketKind = "skin" | "world" | "addon" | "creator" | "game";

export interface CatalogItem {
  id: string;
  kind: MarketKind;
  name: string;
  blurb: string;
  author: string;
  price: number;
  pass?: boolean;
  featured?: boolean;
  freeEvent?: boolean;
  skinId?: string;
  seed?: number;
  mode?: GameMode;
  modJson?: string;
  tint?: string;
}

const PVP_KIT = `{
  "name": "PvP Kit",
  "pvp": true,
  "keepInventory": false,
  "kit": [
    { "id": 10023, "count": 1 },
    { "id": 10055, "count": 8 },
    { "id": 10032, "count": 1 },
    { "id": 10033, "count": 32 }
  ],
  "armor": [10081, 10082, 10083, 10084],
  "offhand": 10031
}`;

const BUILD_KIT = `{
  "name": "Builder Kit",
  "pvp": false,
  "keepInventory": true,
  "kit": [
    { "id": 1, "count": 64 },
    { "id": 19, "count": 64 },
    { "id": 38, "count": 1 },
    { "id": 42, "count": 16 }
  ]
}`;

const HUNT_KIT = `{
  "name": "Night Hunter",
  "pvp": false,
  "kit": [
    { "id": 10023, "count": 1 },
    { "id": 10001, "count": 1 },
    { "id": 42, "count": 32 },
    { "id": 10049, "count": 16 }
  ],
  "armor": [10081, 10082, 10083, 10084]
}`;

export const FEATURED_CATALOG: CatalogItem[] = [
  { id: "skin-steve", kind: "skin", name: "Miner", blurb: "Classic blue shirt. Free forever.", author: "Mods", price: 0, featured: true, freeEvent: true, skinId: "steve" },
  { id: "skin-alex", kind: "skin", name: "Alexis", blurb: "Green traveler with ginger hair.", author: "Mods", price: 40, featured: true, skinId: "alex" },
  { id: "skin-bee", kind: "skin", name: "Bee", blurb: "Fuzzy stripes. On the Pass.", author: "Hive Studio", price: 25, pass: true, skinId: "bee" },
  { id: "skin-ender", kind: "skin", name: "Ender", blurb: "Void-black with purple eyes.", author: "End Atelier", price: 80, featured: true, skinId: "ender" },
  { id: "skin-creeper", kind: "skin", name: "Creeper", blurb: "Hiss quietly. Look explosive.", author: "Boom Co", price: 50, skinId: "creeper" },
  { id: "skin-pale", kind: "skin", name: "Pale", blurb: "Don't AFK. He already knows.", author: "Mods", price: 30, skinId: "pale" },
  { id: "skin-noor", kind: "skin", name: "Noor", blurb: "Red cloak, dark skin.", author: "Mods", price: 35, pass: true, skinId: "noor" },
  { id: "skin-sunny", kind: "skin", name: "Sunny", blurb: "Gold shirt, desert ready.", author: "Mods", price: 20, freeEvent: true, skinId: "sunny" },
  { id: "world-plains", kind: "world", name: "Plains Camp", blurb: "Gentle hills. Safe spawn. Free map.", author: "Mods", price: 0, featured: true, freeEvent: true, seed: 20260830, mode: "survival" },
  { id: "world-desert", kind: "world", name: "Desert Temple", blurb: "Sand, heat, buried loot.", author: "Dune Lab", price: 60, seed: 424242, mode: "survival" },
  { id: "world-cherry", kind: "world", name: "Cherry Grove", blurb: "Pink trees and picnic grass.", author: "Petal Co", price: 45, pass: true, seed: 888121, mode: "survival" },
  { id: "world-creative", kind: "world", name: "Flat Studio", blurb: "Creative superflat for building.", author: "Mods", price: 25, seed: 1, mode: "creative" },
  { id: "addon-pvp", kind: "addon", name: "PvP Kit", blurb: "Sword, shield, gapples. Drop in and duel.", author: "Mods", price: 70, featured: true, modJson: PVP_KIT },
  { id: "addon-build", kind: "addon", name: "Builder Kit", blurb: "Blocks, bench, torches. Keep inventory.", author: "Cube Works", price: 40, modJson: BUILD_KIT },
  { id: "addon-hunt", kind: "addon", name: "Night Hunter", blurb: "Armor and food for the first night.", author: "Pale Watch", price: 55, pass: true, modJson: HUNT_KIT },
  { id: "creator-cape", kind: "creator", name: "Blue Cape", blurb: "Mix-and-match shirt tint.", author: "Character Lab", price: 35, tint: "#3a5a9a" },
  { id: "creator-crown", kind: "creator", name: "Gold Crown", blurb: "Hair goes gold. Very royal.", author: "Character Lab", price: 90, featured: true, tint: "#f0c832" },
  { id: "creator-hood", kind: "creator", name: "Travel Hood", blurb: "Free seasonal hood.", author: "Mods", price: 0, freeEvent: true, tint: "#3a2a18" },
];

export const PASS_PRICE = 150;
export const PASS_MS = 7 * 24 * 60 * 60 * 1000;

export function passActive(p: Profile) {
  return (p.passUntil ?? 0) > Date.now();
}

export function owns(p: Profile, id: string) {
  return (p.ownedPacks ?? []).includes(id);
}

export function communitySkins(): CatalogItem[] {
  return loadMarket().map((s) => ({
    id: `cskin-${s.id}`,
    kind: "skin" as const,
    name: s.name,
    blurb: `Player listing by ${s.seller}`,
    author: s.seller,
    price: s.price,
    skinId: s.id,
  }));
}

export function communityGames(): CatalogItem[] {
  return loadGames()
    .filter((g) => g.published && (g.publishMode === "market" || !g.publishMode) && !detectXpFarm(g).farm)
    .map((g) => ({
      id: `game-${g.id}`,
      kind: "game" as const,
      name: g.name,
      blurb: `Scratch-style mini game by ${g.author}`,
      author: g.author,
      price: g.priceXp,
      modJson: compileGame(g),
    }));
}

export function communityWorlds(): CatalogItem[] {
  return loadWorlds()
    .filter((w) => w.published)
    .map((w) => ({
      id: `cworld-${w.id}`,
      kind: "world" as const,
      name: w.name,
      blurb: w.arena ? `Minigame · ${w.arena}` : `Seed ${w.seed}`,
      author: "Player",
      price: w.priceXp ?? 0,
      seed: w.seed,
      mode: w.mode,
    }));
}

export function allCatalog(): CatalogItem[] {
  const seen = new Set<string>();
  const out: CatalogItem[] = [];
  for (const it of [...FEATURED_CATALOG, ...communitySkins(), ...communityWorlds(), ...communityGames()]) {
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    out.push(it);
  }
  return out;
}

export function effectivePrice(item: CatalogItem, p: Profile) {
  if (owns(p, item.id) || item.price <= 0) return 0;
  if (item.pass && passActive(p)) return 0;
  return item.price;
}

export function buyPass(p: Profile): { ok: boolean; msg: string; profile?: Profile } {
  if (passActive(p)) return { ok: false, msg: "Pass is already running." };
  if (p.xp < PASS_PRICE) return { ok: false, msg: `Need ${PASS_PRICE} XP.` };
  const next: Profile = { ...p, xp: p.xp - PASS_PRICE, passUntil: Date.now() + PASS_MS };
  saveProfile(next);
  persistAccountProfile(next);
  return { ok: true, msg: "Marketplace Pass — 7 days of Pass items, paid in XP.", profile: next };
}

export function applyCatalogItem(item: CatalogItem, p: Profile): { world?: WorldMeta; skinData?: SkinData } {
  const extra: { world?: WorldMeta; skinData?: SkinData } = {};
  if (item.kind === "skin" && item.skinId) {
    if (item.skinId.startsWith("m-") || item.id.startsWith("cskin-")) {
      const rawId = item.skinId;
      const listed = loadMarket().find((s) => s.id === rawId);
      if (listed) {
        saveLiveSkin(listed);
        extra.skinData = listed;
        return extra;
      }
    }
    extra.skinData = resolveSkin(item.skinId);
    return extra;
  }
  if (item.kind === "creator" && item.tint) {
    const cur = resolveSkin(p.skin);
    const next: SkinData =
      item.id === "creator-crown"
        ? { ...cur, id: "live", name: cur.name, hair: item.tint }
        : { ...cur, id: "live", name: cur.name, shirt: item.tint };
    saveLiveSkin(next);
    extra.skinData = next;
    return extra;
  }
  if (item.kind === "world" || item.kind === "addon" || item.kind === "game") {
    const meta = newWorldMeta(item.name, item.seed ?? Date.now() % 1e9, item.mode ?? "survival", false);
    if (item.modJson) meta.modJson = item.modJson;
    extra.world = meta;
  }
  return extra;
}

export function purchase(
  item: CatalogItem,
  p: Profile,
): { ok: boolean; msg: string; profile: Profile; world?: WorldMeta; skin?: SkinData } {
  if (item.id.startsWith("cskin-")) {
    if (owns(p, item.id)) {
      const applied = applyCatalogItem(item, p);
      let next = p;
      if (applied.skinData) next = { ...p, skin: applied.skinData.id || "live" };
      saveProfile(next);
      persistAccountProfile(next);
      return { ok: true, msg: `Equipped ${item.name}.`, profile: next, skin: applied.skinData };
    }
    const skinId = item.skinId ?? "";
    const res = buyMarketSkin(skinId, p.username, p.xp);
    if (!res.ok) return { ok: false, msg: res.msg, profile: p };
    let next: Profile = { ...p, xp: p.xp - res.cost, ownedPacks: [...(p.ownedPacks ?? []), item.id] };
    if (res.seller) {
      try {
        const raw = localStorage.getItem("moc.accounts.v1");
        if (raw) {
          const accounts = JSON.parse(raw) as Record<string, { pass: string; profile: Profile }>;
          const rec = accounts[res.seller.toLowerCase()];
          if (rec) {
            rec.profile = { ...rec.profile, xp: (rec.profile.xp ?? 0) + res.cost };
            localStorage.setItem("moc.accounts.v1", JSON.stringify(accounts));
          }
        }
      } catch {
        /* */
      }
    }
    const applied = applyCatalogItem(item, next);
    if (applied.skinData) next = { ...next, skin: applied.skinData.id || "live" };
    saveProfile(next);
    persistAccountProfile(next);
    return { ok: true, msg: res.msg, profile: next, skin: applied.skinData };
  }

  const cost = effectivePrice(item, p);
  if (cost > p.xp) return { ok: false, msg: `Need ${cost} XP.`, profile: p };
  const owned = new Set(p.ownedPacks ?? []);
  owned.add(item.id);
  let next: Profile = { ...p, xp: p.xp - cost, ownedPacks: [...owned] };
  const applied = applyCatalogItem(item, next);
  if (applied.skinData) next = { ...next, skin: applied.skinData.id || "live" };
  saveProfile(next);
  persistAccountProfile(next);
  const verb = cost === 0 ? (owns(p, item.id) ? "Equipped" : "Claimed") : "Bought";
  return { ok: true, msg: `${verb} ${item.name}${cost ? ` for ${cost} XP` : ""}.`, profile: next, world: applied.world, skin: applied.skinData };
}

export function sortCatalog(list: CatalogItem[], mode: "featured" | "price" | "free") {
  const copy = [...list];
  if (mode === "free") return copy.filter((i) => i.price === 0 || i.freeEvent).sort((a, b) => a.name.localeCompare(b.name));
  if (mode === "price") return copy.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
  return copy.sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || a.price - b.price);
}

export type { MarketSkin };
