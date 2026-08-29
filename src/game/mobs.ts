import * as THREE from "three";
import { isSolid, WATER } from "./blocks";
import type { World } from "./world";
import type { Player } from "./player";
import { hash2 } from "./rng";

export type MobKind =
  | "pig"
  | "cow"
  | "sheep"
  | "chicken"
  | "wolf"
  | "creeper"
  | "zombie"
  | "skeleton"
  | "spider"
  | "enderman"
  | "blaze"
  | "ghast"
  | "endermite"
  | "wraith"
  | "dragon";

export interface Mob {
  id: number;
  kind: MobKind;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  yaw: number;
  hp: number;
  max: number;
  age: number;
  hostile: boolean;
  mesh: THREE.Group;
  fuse?: number;
  cooldown?: number;
  dead: boolean;
}

let nextId = 1;

function box(w: number, h: number, d: number, color: number, y = 0): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color }),
  );
  m.position.y = y;
  m.castShadow = false;
  return m;
}

function makeMesh(kind: MobKind): THREE.Group {
  const g = new THREE.Group();
  if (kind === "pig") {
    g.add(box(0.9, 0.7, 1.2, 0xf0a0b0, 0.45));
    g.add(box(0.5, 0.5, 0.5, 0xf0a0b0, 0.85)).position.set(0, 0.55, -0.55);
  } else if (kind === "cow") {
    g.add(box(0.9, 0.9, 1.4, 0x4a3020, 0.7));
    g.add(box(0.55, 0.5, 0.5, 0x4a3020, 1.15)).position.set(0, 0.7, -0.7);
  } else if (kind === "sheep") {
    g.add(box(0.9, 0.8, 1.2, 0xf0f0ea, 0.55));
    g.add(box(0.4, 0.4, 0.4, 0x2a2a2a, 0.95)).position.set(0, 0.55, -0.6);
  } else if (kind === "chicken") {
    g.add(box(0.4, 0.5, 0.4, 0xf0f0e0, 0.35));
    g.add(box(0.2, 0.15, 0.2, 0xe07818, 0.55)).position.set(0, 0.4, -0.25);
  } else if (kind === "wolf") {
    g.add(box(0.5, 0.55, 1.0, 0xc8c8c8, 0.45));
    g.add(box(0.35, 0.35, 0.35, 0xc8c8c8, 0.75)).position.set(0, 0.5, -0.5);
  } else if (kind === "creeper") {
    g.add(box(0.6, 1.4, 0.4, 0x3d8a3a, 0.7));
    g.add(box(0.6, 0.6, 0.6, 0x3d8a3a, 1.55));
    const face = box(0.62, 0.2, 0.08, 0x0a0a0a, 1.55);
    face.position.z = -0.28;
    g.add(face);
  } else if (kind === "zombie") {
    g.add(box(0.6, 0.8, 0.35, 0x3a6a3a, 1.0));
    g.add(box(0.6, 0.6, 0.6, 0x3a6a3a, 1.6));
    g.add(box(0.3, 0.7, 0.3, 0x3a6a3a, 0.35)).position.x = 0.18;
    g.add(box(0.3, 0.7, 0.3, 0x3a6a3a, 0.35)).position.x = -0.18;
  } else if (kind === "skeleton") {
    g.add(box(0.5, 0.8, 0.3, 0xe8e0c8, 1.0));
    g.add(box(0.5, 0.5, 0.5, 0xe8e0c8, 1.55));
  } else if (kind === "spider") {
    g.add(box(0.9, 0.5, 1.1, 0x3a1010, 0.35));
  } else if (kind === "enderman") {
    g.add(box(0.4, 2.4, 0.3, 0x101018, 1.3));
    g.add(box(0.4, 0.5, 0.4, 0x101018, 2.65));
    const e = box(0.42, 0.08, 0.08, 0xe050e0, 2.7);
    e.position.z = -0.18;
    g.add(e);
  } else if (kind === "blaze") {
    g.add(box(0.5, 1.2, 0.5, 0xf0a028, 1.0));
  } else if (kind === "ghast") {
    g.add(box(2.2, 2.2, 2.2, 0xf0e8e8, 2.0));
  } else if (kind === "wraith") {
    g.add(box(0.6, 0.8, 0.35, 0x3a78c8, 1.0));
    g.add(box(0.6, 0.6, 0.6, 0xe0c090, 1.6));
    const eyes = box(0.62, 0.12, 0.08, 0xffffff, 1.62);
    eyes.position.z = -0.3;
    g.add(eyes);
    g.add(box(0.3, 0.7, 0.3, 0x3a4a8a, 0.35)).position.x = 0.18;
    g.add(box(0.3, 0.7, 0.3, 0x3a4a8a, 0.35)).position.x = -0.18;
  } else if (kind === "dragon") {
    g.add(box(3.2, 1.4, 6.0, 0x1a1028, 2.0));
    g.add(box(1.6, 1.2, 2.2, 0x1a1028, 2.8)).position.z = -3.2;
    const wingL = box(4.5, 0.15, 2.2, 0x2a1840, 2.4);
    wingL.position.x = 3.2;
    g.add(wingL);
    const wingR = box(4.5, 0.15, 2.2, 0x2a1840, 2.4);
    wingR.position.x = -3.2;
    g.add(wingR);
    const eye = box(0.3, 0.2, 0.2, 0xe050e0, 3.0);
    eye.position.set(0.4, 2.9, -4.0);
    g.add(eye);
  } else {
    g.add(box(0.5, 0.5, 0.5, 0x888888, 0.25));
  }
  return g;
}

const STATS: Record<MobKind, { hp: number; hostile: boolean; speed: number; dmg: number }> = {
  pig: { hp: 10, hostile: false, speed: 1.6, dmg: 0 },
  cow: { hp: 10, hostile: false, speed: 1.4, dmg: 0 },
  sheep: { hp: 8, hostile: false, speed: 1.5, dmg: 0 },
  chicken: { hp: 4, hostile: false, speed: 1.8, dmg: 0 },
  wolf: { hp: 8, hostile: false, speed: 2.4, dmg: 4 },
  creeper: { hp: 20, hostile: true, speed: 2.2, dmg: 24 },
  zombie: { hp: 20, hostile: true, speed: 2.0, dmg: 4 },
  skeleton: { hp: 20, hostile: true, speed: 2.1, dmg: 4 },
  spider: { hp: 16, hostile: true, speed: 2.6, dmg: 3 },
  enderman: { hp: 40, hostile: true, speed: 2.8, dmg: 7 },
  blaze: { hp: 20, hostile: true, speed: 2.0, dmg: 5 },
  ghast: { hp: 10, hostile: true, speed: 1.4, dmg: 8 },
  endermite: { hp: 8, hostile: true, speed: 2.4, dmg: 2 },
  wraith: { hp: 200, hostile: true, speed: 3.4, dmg: 40 },
  dragon: { hp: 200, hostile: true, speed: 8, dmg: 10 },
};

export function spawnMob(kind: MobKind, x: number, y: number, z: number, scene: THREE.Scene): Mob {
  const st = STATS[kind];
  const mesh = makeMesh(kind);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  return {
    id: nextId++,
    kind,
    x, y, z,
    vx: 0, vy: 0, vz: 0,
    yaw: Math.random() * Math.PI * 2,
    hp: st.hp,
    max: st.hp,
    age: 0,
    hostile: st.hostile,
    mesh,
    fuse: kind === "creeper" ? 0 : undefined,
    cooldown: 0,
    dead: false,
  };
}

export function updateMobs(
  mobs: Mob[],
  dt: number,
  world: World,
  player: Player,
  night: boolean,
  onExplode: (x: number, y: number, z: number, r: number) => void,
  flyingSafe: boolean,
) {
  for (const m of mobs) {
    if (m.dead) continue;
    m.age += dt;
    if (m.cooldown && m.cooldown > 0) m.cooldown -= dt;
    const st = STATS[m.kind];
    const dx = player.x - m.x;
    const dz = player.z - m.z;
    const dy = player.y - m.y;
    const dist = Math.hypot(dx, dz);
    const dist3 = Math.hypot(dx, dy, dz);

    if (m.kind === "dragon") {
      const t = m.age;
      const r = 28;
      m.x = Math.sin(t * 0.25) * r;
      m.z = Math.cos(t * 0.25) * r;
      m.y = 62 + Math.sin(t * 0.4) * 6;
      m.yaw = t * 0.25 + Math.PI / 2;
      m.mesh.position.set(m.x, m.y, m.z);
      m.mesh.rotation.y = m.yaw;
      if (dist3 < 6) player.hurtBy(st.dmg * dt, "dragon");
      continue;
    }

    if (m.kind === "wraith") {
      if (flyingSafe) {
        m.mesh.visible = true;
        m.mesh.position.set(m.x, m.y, m.z);
        continue;
      }
      if (dist > 9) {
        const ang = Math.atan2(dx, dz);
        m.x = player.x - Math.sin(ang) * 8;
        m.z = player.z - Math.cos(ang) * 8;
        m.y = player.y;
      }
      const s = st.speed;
      if (dist > 0.4) {
        m.vx = (dx / dist) * s;
        m.vz = (dz / dist) * s;
      }
      m.x += m.vx * dt;
      m.z += m.vz * dt;
      m.y = player.y;
      m.yaw = Math.atan2(dx, dz);
      m.mesh.position.set(m.x, m.y, m.z);
      m.mesh.rotation.y = m.yaw;
      if (dist3 < 1.15) player.hurtBy(40, "wraith");
      continue;
    }

    let targetX = 0, targetZ = 0;
    const aggro = m.hostile && (night || m.kind === "enderman" || world.dim !== "overworld") && dist < 24;
    if (aggro) {
      targetX = dx;
      targetZ = dz;
      m.yaw = Math.atan2(dx, dz);
    } else {
      if ((m.age * 3 + m.id) % 4 < dt * 4) m.yaw += (Math.random() - 0.5) * 1.2;
      targetX = Math.sin(m.yaw);
      targetZ = Math.cos(m.yaw);
    }
    const spd = st.speed * (aggro ? 1 : 0.6);
    m.vx = targetX * spd * (dist > 0.01 ? 1 : 0);
    m.vz = targetZ * spd * (dist > 0.01 ? 1 : 0);
    m.vy -= 28 * dt;
    m.x += m.vx * dt;
    if (collides(world, m)) m.x -= m.vx * dt;
    m.z += m.vz * dt;
    if (collides(world, m)) m.z -= m.vz * dt;
    m.y += m.vy * dt;
    if (collides(world, m)) {
      m.y -= m.vy * dt;
      if (m.vy < 0) {
        m.vy = 0;
        const ahead = world.getBlock(Math.floor(m.x + Math.sin(m.yaw)), Math.floor(m.y), Math.floor(m.z + Math.cos(m.yaw)));
        if (isSolid(ahead)) m.vy = 7.4;
      } else m.vy = 0;
    }
    m.mesh.position.set(m.x, m.y, m.z);
    m.mesh.rotation.y = m.yaw;

    if (m.kind === "creeper" && dist < 3.2 && aggro) {
      m.fuse = (m.fuse ?? 0) + dt;
      const s = 1 + m.fuse * 0.4;
      m.mesh.scale.setScalar(s);
      if ((m.fuse ?? 0) > 1.5) {
        onExplode(m.x, m.y, m.z, 3);
        m.hp = 0;
      }
    } else if (m.kind === "creeper") {
      m.fuse = Math.max(0, (m.fuse ?? 0) - dt * 2);
      m.mesh.scale.setScalar(1);
    }

    if (aggro && dist < 1.4 && m.kind !== "creeper" && m.kind !== "skeleton" && m.kind !== "ghast") {
      if (!m.cooldown || m.cooldown <= 0) {
        player.hurtBy(st.dmg, m.kind);
        m.cooldown = 0.8;
      }
    }
  }
}

function collides(world: World, m: Mob): boolean {
  const w = m.kind === "dragon" ? 2 : 0.4;
  const h = m.kind === "enderman" ? 2.8 : m.kind === "ghast" ? 2.2 : 1.6;
  return world.collides(m.x - w / 2, m.y, m.z - w / 2, w, h, w);
}

export function hitMob(mobs: Mob[], x: number, y: number, z: number, dmg: number): Mob | null {
  let best: Mob | null = null;
  let bd = 2.2;
  for (const m of mobs) {
    if (m.dead) continue;
    const d = Math.hypot(m.x - x, m.y + 0.8 - y, m.z - z);
    const reach = m.kind === "dragon" ? 5 : 2.2;
    if (d < reach && d < bd) {
      bd = d;
      best = m;
    }
  }
  if (best) {
    best.hp -= dmg;
    best.mesh.traverse((o) => {
      if (o instanceof THREE.Mesh && o.material instanceof THREE.MeshLambertMaterial) {
        o.material.emissive = new THREE.Color(0xffffff);
        o.material.emissiveIntensity = 0.6;
        setTimeout(() => {
          o.material.emissiveIntensity = 0;
        }, 80);
      }
    });
  }
  return best;
}

export function trySpawn(
  scene: THREE.Scene,
  world: World,
  player: Player,
  mobs: Mob[],
  night: boolean,
  seed: number,
  difficulty: "peaceful" | "easy" | "normal" | "hard" = "normal",
): Mob | null {
  const cap = difficulty === "hard" ? 26 : difficulty === "easy" ? 12 : 18;
  if (mobs.filter((m) => !m.dead && m.kind !== "dragon" && m.kind !== "wraith").length > cap) return null;
  const ang = Math.random() * Math.PI * 2;
  const dist = 14 + Math.random() * 18;
  const x = player.x + Math.cos(ang) * dist;
  const z = player.z + Math.sin(ang) * dist;
  const y = world.highestSolid(x, z) + 1;
  if (y < 2) return null;
  const id = world.getBlock(Math.floor(x), y, Math.floor(z));
  if (id === WATER) return null;
  let kind: MobKind;
  if (world.dim === "nether") {
    kind = Math.random() < 0.5 ? "blaze" : "ghast";
  } else if (world.dim === "end") {
    kind = "enderman";
  } else if (night) {
    if (difficulty === "peaceful") {
      const r = Math.random();
      kind = r < 0.3 ? "pig" : r < 0.55 ? "cow" : r < 0.75 ? "sheep" : "chicken";
    } else {
      const r = hash2(Math.floor(x), Math.floor(z), seed + Math.floor(player.x));
      kind = r < 0.35 ? "zombie" : r < 0.6 ? "skeleton" : r < 0.8 ? "spider" : "creeper";
    }
  } else {
    const r = Math.random();
    kind = r < 0.25 ? "pig" : r < 0.5 ? "cow" : r < 0.72 ? "sheep" : r < 0.9 ? "chicken" : "wolf";
  }
  return spawnMob(kind, x, y, z, scene);
}

export function disposeMob(m: Mob, scene: THREE.Scene) {
  scene.remove(m.mesh);
  m.mesh.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      (o.material as THREE.Material).dispose();
    }
  });
}
