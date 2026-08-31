import { BLOCKS, BY_KEY, FIRE, REDSTONE_BLOCK, TNT } from "./blocks";
import type { World } from "./world";

export function blockKind(id: number): string {
  const b = BLOCKS[id];
  if (!b) return "";
  const s = `${b.key} ${b.name}`.toLowerCase();
  if (s.includes("bedrock")) return "";
  if (s.includes("command")) return "command";
  if (/\bdoor\b/.test(s) && !s.includes("trap")) return "door";
  if (s.includes("trapdoor")) return "trapdoor";
  if (s.includes("fence gate") || s.includes("gate")) return "gate";
  if (s.includes("lever")) return "lever";
  if (s.includes("button")) return "button";
  if (s.includes("pressure")) return "plate";
  if (s.includes("redstone lamp") || s.includes("redstone_lamp")) return "lamp";
  if (s.includes("sticky piston") || s.includes("piston")) return "piston";
  if (s.includes("tnt")) return "tnt";
  if (/\bbed\b/.test(s) && !s.includes("bedrock") && !s.includes("obsidian")) return "bed";
  if (s.includes("note")) return "note";
  if (s.includes("jukebox")) return "jukebox";
  if (s.includes("rail")) return "rail";
  if (s.includes("crafting")) return "craft";
  if (s.includes("furnace") || s.includes("smoker") || s.includes("blast")) return "furnace";
  if (s.includes("chest") && !s.includes("ender")) return "chest";
  if (s.includes("enchant")) return "enchant";
  if (s.includes("anvil")) return "anvil";
  if (s.includes("bell")) return "bell";
  if (s.includes("lectern")) return "lectern";
  if (s.includes("composter")) return "composter";
  if (s.includes("barrel")) return "chest";
  if (s.includes("hopper")) return "hopper";
  if (s.includes("dispenser") || s.includes("dropper")) return "dropper";
  if (s.includes("observer")) return "observer";
  if (s.includes("daylight")) return "daylight";
  if (s.includes("repeater") || s.includes("comparator")) return "repeater";
  if (s.includes("redstone") && (s.includes("wire") || s.includes("dust"))) return "dust";
  if (s.includes("cake")) return "cake";
  if (s.includes("beacon")) return "beacon";
  return "";
}

export function isRail(id: number): boolean {
  return blockKind(id) === "rail" || (BLOCKS[id]?.key ?? "").includes("rail");
}

export const LAMP_OFF = BY_KEY.get("redstone_lamp")?.id ?? 190;
export const LAMP_ON = BY_KEY.get("redstone_lamp_on")?.id ?? LAMP_OFF;

export function posKey(x: number, y: number, z: number) {
  return `${x},${y},${z}`;
}

const DIRS: [number, number, number][] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

export function neighborsPowered(world: World, x: number, y: number, z: number, powered: Set<string>): boolean {
  for (const [dx, dy, dz] of DIRS) {
    if (powered.has(posKey(x + dx, y + dy, z + dz))) return true;
    const id = world.getBlock(x + dx, y + dy, z + dz);
    if (id === REDSTONE_BLOCK) return true;
    const k = BLOCKS[id]?.key ?? "";
    if (k.includes("redstone_torch") || k.includes("redstone_block")) return true;
  }
  return false;
}

export function collectPowerSources(world: World, px: number, py: number, pz: number, extra: Set<string>): Set<string> {
  const out = new Set<string>(extra);
  for (let y = py - 8; y <= py + 8; y++) {
    for (let z = pz - 10; z <= pz + 10; z++) {
      for (let x = px - 10; x <= px + 10; x++) {
        const id = world.getBlock(x, y, z);
        if (!id) continue;
        const k = BLOCKS[id]?.key ?? "";
        const n = BLOCKS[id]?.name ?? "";
        if (id === REDSTONE_BLOCK || k.includes("redstone_torch") || k.includes("redstone_block")) {
          out.add(posKey(x, y, z));
        }
        if (k.includes("lever") || n.toLowerCase().includes("lever")) {
          if (world.toggled.has(posKey(x, y, z))) out.add(posKey(x, y, z));
        }
      }
    }
  }
  return out;
}

export function propagateDust(world: World, sources: Set<string>, px: number, py: number, pz: number): Set<string> {
  const powered = new Set(sources);
  let changed = true;
  let guard = 0;
  while (changed && guard++ < 24) {
    changed = false;
    for (let y = py - 8; y <= py + 8; y++) {
      for (let z = pz - 10; z <= pz + 10; z++) {
        for (let x = px - 10; x <= px + 10; x++) {
          const id = world.getBlock(x, y, z);
          const k = blockKind(id);
          if (k !== "dust" && k !== "repeater") continue;
          const key = posKey(x, y, z);
          if (powered.has(key)) continue;
          if (neighborsPowered(world, x, y, z, powered)) {
            powered.add(key);
            changed = true;
          }
        }
      }
    }
  }
  return powered;
}

export function applyLamps(world: World, powered: Set<string>, px: number, py: number, pz: number) {
  for (let y = py - 8; y <= py + 8; y++) {
    for (let z = pz - 10; z <= pz + 10; z++) {
      for (let x = px - 10; x <= px + 10; x++) {
        const id = world.getBlock(x, y, z);
        const k = blockKind(id);
        if (k !== "lamp" && id !== LAMP_OFF && id !== LAMP_ON) continue;
        const on = neighborsPowered(world, x, y, z, powered);
        if (on && id === LAMP_OFF && LAMP_ON !== LAMP_OFF) world.setBlock(x, y, z, LAMP_ON);
        if (!on && id === LAMP_ON && LAMP_OFF) world.setBlock(x, y, z, LAMP_OFF);
      }
    }
  }
}

export function pushPiston(world: World, x: number, y: number, z: number, face: { nx: number; ny: number; nz: number }) {
  const dx = face.nx || 0;
  const dy = face.ny || 0;
  const dz = face.nz || 0;
  if (!dx && !dy && !dz) return false;
  const tx = x + dx;
  const ty = y + dy;
  const tz = z + dz;
  const id = world.getBlock(tx, ty, tz);
  if (!id || BLOCKS[id]?.hardness < 0 || BLOCKS[id]?.hardness >= 50) return false;
  const nx = tx + dx;
  const ny = ty + dy;
  const nz = tz + dz;
  if (world.getBlock(nx, ny, nz) !== 0) return false;
  world.setBlock(nx, ny, nz, id);
  world.setBlock(tx, ty, tz, 0);
  return true;
}

export function isTnt(id: number) {
  return id === TNT || (BLOCKS[id]?.key ?? "").includes("tnt");
}

export { FIRE };
