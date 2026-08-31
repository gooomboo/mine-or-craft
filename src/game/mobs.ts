import * as THREE from "three";
import { isSolid, WATER } from "./blocks";
import type { World } from "./world";
import type { Player } from "./player";
import { hash2 } from "./rng";
import { addHumanoid, addQuad, part, swingLimbs } from "./models";

export type MobKind =
  | "pig"
  | "cow"
  | "sheep"
  | "chicken"
  | "wolf"
  | "horse"
  | "fox"
  | "cat"
  | "villager"
  | "golem"
  | "creeper"
  | "zombie"
  | "skeleton"
  | "spider"
  | "enderman"
  | "witch"
  | "slime"
  | "drowned"
  | "husk"
  | "stray"
  | "phantom"
  | "pillager"
  | "blaze"
  | "ghast"
  | "magmacube"
  | "wither_skel"
  | "piglin"
  | "hoglin"
  | "strider"
  | "endermite"
  | "shulker"
  | "wraith"
  | "dragon"
  | "wither"
  | "wither_storm"
  | "duelist"
  | "bee"
  | "polar_bear"
  | "panda"
  | "llama"
  | "parrot"
  | "goat"
  | "frog"
  | "squid"
  | "dolphin"
  | "axolotl"
  | "guardian"
  | "ravager"
  | "vindicator"
  | "evoker"
  | "vex"
  | "bat"
  | "silverfish"
  | "cave_spider"
  | "zombie_villager"
  | "snow_golem"
  | "camel"
  | "sniffer"
  | "armadillo"
  | "allay"
  | "warden"
  | "breeze"
  | "piglin_brute"
  | "zombified_piglin";

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
  blocking?: boolean;
  tier?: number;
  ai?: "wander" | "chase" | "flee" | "idle" | "guard" | "circle";
  aiT?: number;
  lastHurt?: number;
}

let nextId = 1;

function makeMesh(kind: MobKind): THREE.Group {
  const g = new THREE.Group();
  if (kind === "pig") {
    addQuad(g, { body: 0xf0a0b8, head: 0xf0a0b8, legs: 0xe08098, bw: 0.85, bh: 0.7, bd: 1.15, hy: 0.95, snout: 0xe07088, ear: 0xe08098, tail: 0xe08098 });
  } else if (kind === "cow") {
    addQuad(g, { body: 0x4a3020, head: 0x4a3020, legs: 0x2a1a10, bw: 0.9, bh: 0.85, bd: 1.35, hy: 1.2, snout: 0xf0f0e8, ear: 0x2a1a10 });
    g.add(part(0.16, 0.2, 0.08, 0xf0f0e8, 1.28, -0.22, -0.72));
    g.add(part(0.16, 0.2, 0.08, 0xf0f0e8, 1.28, 0.22, -0.72));
  } else if (kind === "sheep") {
    addQuad(g, { body: 0xf4f0e8, head: 0x2a2a2a, legs: 0x2a2a2a, bw: 0.85, bh: 0.75, bd: 1.15, hy: 1.05, ear: 0x2a2a2a });
  } else if (kind === "chicken") {
    g.add(part(0.4, 0.45, 0.4, 0xf0f0e0, 0.45));
    g.add(part(0.22, 0.18, 0.22, 0xe07818, 0.72, 0, -0.22));
    g.add(part(0.08, 0.12, 0.08, 0xc42828, 0.78, 0, -0.32));
    g.add(part(0.08, 0.22, 0.08, 0xd8d0c0, 0.16, -0.08, 0));
    g.add(part(0.08, 0.22, 0.08, 0xd8d0c0, 0.16, 0.08, 0));
  } else if (kind === "wolf") {
    addQuad(g, { body: 0xc8c8c8, head: 0xc8c8c8, legs: 0xb0b0b0, bw: 0.5, bh: 0.5, bd: 1.05, hy: 0.85, snout: 0xe8e0d8, ear: 0xc8c8c8, tail: 0xc8c8c8 });
  } else if (kind === "horse") {
    addQuad(g, { body: 0x8a5530, head: 0x8a5530, legs: 0x6b3a18, bw: 0.9, bh: 0.95, bd: 1.6, hy: 1.45, snout: 0x6b3a18, ear: 0x6b3a18, tail: 0x3a2a18 });
    g.add(part(0.28, 0.45, 0.28, 0x8a5530, 1.7, 0, -0.85));
  } else if (kind === "fox") {
    addQuad(g, { body: 0xd07828, head: 0xd07828, legs: 0xc06018, bw: 0.45, bh: 0.4, bd: 0.9, hy: 0.7, snout: 0xf0e0d0, ear: 0xd07828, tail: 0xd07828 });
  } else if (kind === "cat") {
    addQuad(g, { body: 0xc8a060, head: 0xc8a060, legs: 0xb89050, bw: 0.4, bh: 0.35, bd: 0.75, hy: 0.6, ear: 0xc8a060, tail: 0xc8a060 });
  } else if (kind === "villager") {
    addHumanoid(g, { skin: 0xc89060, shirt: 0x3a6a8a, pants: 0x3a3a42, hair: 0x3a2a18 });
    g.add(part(0.22, 0.28, 0.22, 0xc89060, 1.32, 0, -0.22));
  } else if (kind === "golem" || kind === "snow_golem") {
    const c = kind === "snow_golem" ? 0xf0f4f8 : 0xb0b0b0;
    g.add(part(1.4, 1.6, 0.7, c, 1.2));
    g.add(part(0.7, 0.7, 0.7, c, 2.25));
    g.add(part(0.4, 1.4, 0.4, c, 1.1, -0.95, 0));
    g.add(part(0.4, 1.4, 0.4, c, 1.1, 0.95, 0));
    g.add(part(0.28, 0.12, 0.08, 0xc42828, 2.3, 0, -0.36));
  } else if (kind === "creeper") {
    g.add(part(0.6, 1.35, 0.4, 0x3d8a3a, 0.85));
    g.add(part(0.6, 0.6, 0.6, 0x3d8a3a, 1.72));
    g.add(part(0.62, 0.16, 0.08, 0x0a0a0a, 1.72, 0, -0.28));
    g.add(part(0.1, 0.1, 0.06, 0x0a0a0a, 1.58, -0.12, -0.3));
    g.add(part(0.1, 0.1, 0.06, 0x0a0a0a, 1.58, 0.12, -0.3));
    g.add(part(0.22, 0.7, 0.22, 0x3d8a3a, 0.32, -0.16, 0));
    g.add(part(0.22, 0.7, 0.22, 0x3d8a3a, 0.32, 0.16, 0));
  } else if (kind === "zombie" || kind === "husk" || kind === "drowned" || kind === "zombie_villager") {
    const skin = kind === "husk" ? 0xc4a06a : kind === "drowned" ? 0x2a6a6a : kind === "zombie_villager" ? 0x5a8a4a : 0x3a6a3a;
    const shirt = kind === "drowned" ? 0x2a4a5a : kind === "zombie_villager" ? 0x3a6a8a : 0x3a4a28;
    addHumanoid(g, { skin, shirt, pants: 0x3a3a28, hair: 0x2a2a18, eyes: 0x1a1a08 });
  } else if (kind === "skeleton" || kind === "stray" || kind === "wither_skel") {
    const bone = kind === "wither_skel" ? 0x2a2a2a : kind === "stray" ? 0xd8e4f0 : 0xe8e0c8;
    addHumanoid(g, { skin: bone, shirt: bone, pants: bone, slim: true, eyes: 0x1a1a1a });
    g.add(part(0.08, 0.08, 0.55, 0x6b5530, 1.15, 0.38, -0.2));
  } else if (kind === "spider" || kind === "cave_spider") {
    const scale = kind === "cave_spider" ? 0.7 : 1;
    g.add(part(0.95 * scale, 0.45 * scale, 1.15 * scale, 0x3a1010, 0.4 * scale));
    g.add(part(0.5 * scale, 0.4 * scale, 0.5 * scale, 0x4a1818, 0.5 * scale, 0, -0.55 * scale));
    for (const s of [-1, 1]) {
      g.add(part(0.08, 0.08, 0.7 * scale, 0x2a0808, 0.28 * scale, s * 0.55 * scale, 0.2));
      g.add(part(0.08, 0.08, 0.7 * scale, 0x2a0808, 0.28 * scale, s * 0.55 * scale, -0.2));
    }
    g.add(part(0.12, 0.08, 0.08, 0xc42828, 0.52 * scale, -0.12, -0.78 * scale));
    g.add(part(0.12, 0.08, 0.08, 0xc42828, 0.52 * scale, 0.12, -0.78 * scale));
  } else if (kind === "enderman") {
    g.add(part(0.38, 2.5, 0.28, 0x101018, 1.35));
    g.add(part(0.4, 0.5, 0.4, 0x101018, 2.72));
    g.add(part(0.42, 0.08, 0.08, 0xe050e0, 2.74, 0, -0.18, 0xe050e0));
    const armL = new THREE.Group();
    armL.position.set(-0.28, 2.1, 0);
    armL.add(part(0.16, 1.6, 0.16, 0x101018, -0.7));
    const armR = new THREE.Group();
    armR.position.set(0.28, 2.1, 0);
    armR.add(part(0.16, 1.6, 0.16, 0x101018, -0.7));
    g.add(armL, armR);
    g.userData.limbs = { armL, armR };
  } else if (kind === "witch") {
    addHumanoid(g, { skin: 0x6aaa3a, shirt: 0x4a2068, pants: 0x2a1040, hair: 0x1a1a14 });
    g.add(part(0.7, 0.12, 0.7, 0x2a1040, 1.88));
    g.add(part(0.28, 0.45, 0.28, 0x2a1040, 2.15));
  } else if (kind === "slime" || kind === "magmacube") {
    const c = kind === "magmacube" ? 0xc45c1a : 0x5ad05a;
    g.add(part(1.05, 1.05, 1.05, c, 0.55, 0, 0, kind === "magmacube" ? 0xc45c1a : 0));
    g.add(part(0.18, 0.18, 0.08, 0x0a0a0a, 0.7, -0.22, -0.5));
    g.add(part(0.18, 0.18, 0.08, 0x0a0a0a, 0.7, 0.22, -0.5));
  } else if (kind === "phantom") {
    g.add(part(0.9, 0.22, 1.4, 0x2a3a6a, 0.4));
    g.add(part(1.6, 0.08, 0.7, 0x3a4a7a, 0.42, 0.9, 0));
    g.add(part(1.6, 0.08, 0.7, 0x3a4a7a, 0.42, -0.9, 0));
  } else if (kind === "pillager" || kind === "vindicator" || kind === "evoker") {
    const shirt = kind === "evoker" ? 0x3a2060 : kind === "vindicator" ? 0x6a3a28 : 0x6a3a28;
    addHumanoid(g, { skin: 0xc89060, shirt, pants: 0x3a2a20, hair: 0x3a2a18 });
    g.add(part(0.12, 0.12, 0.7, 0x6b5530, 1.2, 0.4, -0.15));
  } else if (kind === "blaze") {
    g.add(part(0.5, 1.1, 0.5, 0xf0a028, 1.15, 0, 0, 0xf0a028));
    g.add(part(0.18, 0.18, 0.18, 0xfff1a8, 1.7, 0, -0.2, 0xfff1a8));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.add(part(0.14, 0.7, 0.14, 0xc45c1a, 0.7, Math.cos(a) * 0.45, Math.sin(a) * 0.45, 0xc45c1a));
    }
  } else if (kind === "ghast") {
    g.add(part(2.4, 2.4, 2.4, 0xf0e8e8, 2.0));
    g.add(part(0.28, 0.28, 0.08, 0x1a1a1a, 2.2, -0.45, -1.22));
    g.add(part(0.28, 0.28, 0.08, 0x1a1a1a, 2.2, 0.45, -1.22));
    for (let i = 0; i < 4; i++) g.add(part(0.18, 1.4, 0.18, 0xe8d8d8, 0.4, (i - 1.5) * 0.45, 0.4));
  } else if (kind === "piglin" || kind === "piglin_brute" || kind === "zombified_piglin") {
    const skin = kind === "zombified_piglin" ? 0x4aaa6a : 0xd4a06a;
    const shirt = kind === "piglin_brute" ? 0x5adce6 : 0x6b3a18;
    addHumanoid(g, { skin, shirt, pants: 0x4a2810, hair: 0x3a2a18, helm: kind === "piglin_brute" ? 0x5adce6 : undefined });
    g.add(part(0.18, 0.28, 0.08, skin, 1.62, -0.32, 0));
    g.add(part(0.18, 0.28, 0.08, skin, 1.62, 0.32, 0));
  } else if (kind === "hoglin") {
    addQuad(g, { body: 0x8a4030, head: 0x8a4030, legs: 0x6a2818, bw: 1.2, bh: 1.0, bd: 1.7, hy: 1.2, snout: 0x6a2818 });
    g.add(part(0.12, 0.4, 0.12, 0xe8e0c8, 1.45, -0.3, -0.9));
    g.add(part(0.12, 0.4, 0.12, 0xe8e0c8, 1.45, 0.3, -0.9));
  } else if (kind === "strider") {
    addQuad(g, { body: 0x8a2020, head: 0x8a2020, legs: 0x6a1010, bw: 0.9, bh: 0.7, bd: 1.1, hy: 1.0 });
  } else if (kind === "endermite") {
    g.add(part(0.5, 0.28, 0.7, 0x1a1028, 0.2));
    g.add(part(0.08, 0.08, 0.08, 0xe050e0, 0.28, -0.1, -0.32, 0xe050e0));
  } else if (kind === "shulker") {
    g.add(part(1, 1, 1, 0x8a6ab4, 0.5));
    g.add(part(0.35, 0.5, 0.35, 0xc8a0e0, 1.1));
  } else if (kind === "wraith") {
    addHumanoid(g, { skin: 0xe8e0d0, shirt: 0x3a78c8, pants: 0x1a1a28, hair: 0xf0f0e8, eyes: 0xffffff });
  } else if (kind === "dragon") {
    g.add(part(3.6, 1.5, 7.2, 0x1a1028, 2.1));
    g.add(part(1.8, 1.4, 2.4, 0x1a1028, 3.0, 0, -3.6));
    g.add(part(0.9, 0.7, 1.4, 0x24122e, 3.15, 0, -4.8));
    g.add(part(5.4, 0.12, 2.6, 0x2a1840, 2.6, 3.6, 0.2));
    g.add(part(5.4, 0.12, 2.6, 0x2a1840, 2.6, -3.6, 0.2));
    g.add(part(2.2, 0.08, 1.4, 0x3a2060, 2.7, 4.8, -0.4));
    g.add(part(2.2, 0.08, 1.4, 0x3a2060, 2.7, -4.8, -0.4));
    g.add(part(0.28, 0.22, 0.22, 0xe050e0, 3.2, 0.45, -5.2, 0xe050e0));
    g.add(part(0.28, 0.22, 0.22, 0xe050e0, 3.2, -0.45, -5.2, 0xe050e0));
    g.add(part(0.2, 0.5, 2.4, 0x1a1028, 1.6, 0, 3.4));
    g.add(part(0.35, 0.7, 0.18, 0x3a1860, 2.2, 0.55, -2.4));
    g.add(part(0.35, 0.7, 0.18, 0x3a1860, 2.2, -0.55, -2.4));
  } else if (kind === "wither") {
    g.add(part(0.7, 0.7, 0.7, 0x1a1a1a, 2.2));
    g.add(part(0.55, 0.55, 0.55, 0x1a1a1a, 2.15, -0.7, 0));
    g.add(part(0.55, 0.55, 0.55, 0x1a1a1a, 2.15, 0.7, 0));
    g.add(part(0.5, 1.4, 0.4, 0x2a2a2a, 1.1));
    g.add(part(0.14, 0.08, 0.08, 0xc42828, 2.28, 0, -0.36, 0xc42828));
  } else if (kind === "wither_storm") {
    g.add(part(4.2, 4.6, 4.2, 0x2a2030, 3.2));
    g.add(part(1.6, 1.6, 1.6, 0x1a1a1a, 6.4, 0, -1.4));
    g.add(part(1.3, 1.3, 1.3, 0x1a1a1a, 6.1, -2.2, -0.6));
    g.add(part(1.3, 1.3, 1.3, 0x1a1a1a, 6.1, 2.2, -0.6));
    g.add(part(0.9, 0.9, 0.5, 0xc45c4a, 3.4, 0, -2.2, 0xff6644));
    g.add(part(0.22, 0.22, 0.22, 0xc42828, 6.55, 0, -2.2, 0xc42828));
    g.add(part(0.18, 0.18, 0.18, 0xc42828, 6.25, -2.2, -1.3, 0xc42828));
    g.add(part(0.18, 0.18, 0.18, 0xc42828, 6.25, 2.2, -1.3, 0xc42828));
    g.add(part(0.55, 5.5, 0.55, 0x3a2a40, 1.4, -2.6, 1.4));
    g.add(part(0.55, 5.5, 0.55, 0x3a2a40, 1.4, 2.6, 1.4));
    g.add(part(0.7, 0.7, 3.4, 0x5a20a0, 4.8, 0, 3.2, 0x7a40c8));
  } else if (kind === "duelist") {
    addHumanoid(g, {
      skin: 0xc68642,
      shirt: 0x5adce6,
      pants: 0x3aa8b0,
      hair: 0x3a2a18,
      shoes: 0x5adce6,
      eyes: 0x1a2a4a,
      helm: 0x5adce6,
      chest: 0x5adce6,
      boots: 0x5adce6,
    });
    g.add(part(0.08, 0.08, 0.7, 0x5adce6, 1.15, 0.42, -0.22));
    g.add(part(0.42, 0.55, 0.08, 0xb8945a, 1.1, -0.48, 0.1));
  } else if (kind === "bee") {
    g.add(part(0.55, 0.4, 0.7, 0xf0c832, 0.55));
    g.add(part(0.12, 0.12, 0.55, 0x1a1a1a, 0.55));
    g.add(part(0.5, 0.06, 0.35, 0xf4f0e8, 0.78, 0.2, 0));
    g.add(part(0.5, 0.06, 0.35, 0xf4f0e8, 0.78, -0.2, 0));
  } else if (kind === "polar_bear") {
    addQuad(g, { body: 0xf0f4f8, head: 0xf0f4f8, legs: 0xe8eef4, bw: 1.1, bh: 0.9, bd: 1.6, hy: 1.15, snout: 0x1a1a1a, ear: 0xf0f4f8 });
  } else if (kind === "panda") {
    addQuad(g, { body: 0xf0f0e8, head: 0xf0f0e8, legs: 0x1a1a1a, bw: 1.0, bh: 0.85, bd: 1.3, hy: 1.1, ear: 0x1a1a1a });
    g.add(part(0.18, 0.12, 0.08, 0x1a1a1a, 1.12, -0.14, -0.72));
    g.add(part(0.18, 0.12, 0.08, 0x1a1a1a, 1.12, 0.14, -0.72));
  } else if (kind === "llama") {
    addQuad(g, { body: 0xc8b08a, head: 0xc8b08a, legs: 0xb09070, bw: 0.7, bh: 0.9, bd: 1.2, hy: 1.5, ear: 0xc8b08a });
    g.add(part(0.28, 0.55, 0.28, 0xc8b08a, 1.7, 0, -0.55));
  } else if (kind === "parrot") {
    g.add(part(0.28, 0.4, 0.28, 0xc42828, 0.5));
    g.add(part(0.22, 0.22, 0.22, 0xc42828, 0.82, 0, -0.12));
    g.add(part(0.5, 0.06, 0.22, 0x3a78c8, 0.55, 0.28, 0));
    g.add(part(0.5, 0.06, 0.22, 0x3a78c8, 0.55, -0.28, 0));
  } else if (kind === "goat") {
    addQuad(g, { body: 0xe8e0d0, head: 0xe8e0d0, legs: 0xd8d0c0, bw: 0.7, bh: 0.75, bd: 1.1, hy: 1.15, snout: 0xd0c8b8, ear: 0xe8e0d0 });
    g.add(part(0.08, 0.32, 0.08, 0xe8e0d0, 1.4, -0.16, -0.55));
    g.add(part(0.08, 0.32, 0.08, 0xe8e0d0, 1.4, 0.16, -0.55));
  } else if (kind === "frog") {
    g.add(part(0.55, 0.28, 0.55, 0x6aaa3a, 0.22));
    g.add(part(0.18, 0.18, 0.18, 0x6aaa3a, 0.4, -0.16, -0.22));
    g.add(part(0.18, 0.18, 0.18, 0x6aaa3a, 0.4, 0.16, -0.22));
  } else if (kind === "squid") {
    g.add(part(0.7, 0.8, 0.7, 0x3a4a7a, 0.7));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.add(part(0.1, 0.7, 0.1, 0x2a3a5a, 0.15, Math.cos(a) * 0.22, Math.sin(a) * 0.22));
    }
  } else if (kind === "dolphin") {
    g.add(part(0.5, 0.4, 1.3, 0x5a8ab4, 0.5));
    g.add(part(0.18, 0.28, 0.35, 0x5a8ab4, 0.85, 0, 0));
    g.add(part(0.12, 0.12, 0.35, 0x5a8ab4, 0.45, 0, 0.7));
  } else if (kind === "axolotl") {
    g.add(part(0.45, 0.22, 0.8, 0xf0a0b8, 0.2));
    g.add(part(0.28, 0.22, 0.28, 0xf0a0b8, 0.28, 0, -0.4));
    g.add(part(0.08, 0.18, 0.08, 0xf0a0b8, 0.38, -0.16, -0.45));
    g.add(part(0.08, 0.18, 0.08, 0xf0a0b8, 0.38, 0.16, -0.45));
  } else if (kind === "guardian") {
    g.add(part(1.1, 1.1, 1.1, 0x5a8a7a, 0.7));
    g.add(part(0.28, 0.28, 0.12, 0xe07818, 0.78, 0, -0.55, 0xe07818));
    for (let i = 0; i < 4; i++) g.add(part(0.12, 0.7, 0.12, 0x4a7a6a, 0.2, (i - 1.5) * 0.28, 0.4));
  } else if (kind === "ravager") {
    addQuad(g, { body: 0x5a4a40, head: 0x5a4a40, legs: 0x3a2a22, bw: 1.4, bh: 1.2, bd: 2.0, hy: 1.4, snout: 0x3a2a22 });
  } else if (kind === "vex") {
    addHumanoid(g, { skin: 0xa0c8e8, shirt: 0x3a5a8a, pants: 0x2a3a5a, slim: true, scale: 0.55, eyes: 0xc42828 });
  } else if (kind === "bat") {
    g.add(part(0.28, 0.22, 0.28, 0x3a2a20, 0.4));
    g.add(part(0.7, 0.06, 0.35, 0x3a2a20, 0.42, 0.4, 0));
    g.add(part(0.7, 0.06, 0.35, 0x3a2a20, 0.42, -0.4, 0));
  } else if (kind === "silverfish") {
    g.add(part(0.5, 0.22, 0.85, 0x8a8a8a, 0.16));
  } else if (kind === "camel") {
    addQuad(g, { body: 0xc8a06a, head: 0xc8a06a, legs: 0xb89050, bw: 1.0, bh: 1.1, bd: 1.8, hy: 1.55, snout: 0xb89050, ear: 0xc8a06a });
    g.add(part(0.4, 0.35, 0.4, 0xc8a06a, 1.45, 0, 0.2));
    g.add(part(0.4, 0.35, 0.4, 0xc8a06a, 1.45, 0, -0.3));
  } else if (kind === "sniffer") {
    addQuad(g, { body: 0x4a7a3a, head: 0x4a7a3a, legs: 0x3a5a2a, bw: 1.4, bh: 0.9, bd: 2.0, hy: 1.0, snout: 0x6a4a28 });
  } else if (kind === "armadillo") {
    addQuad(g, { body: 0x8a6a4a, head: 0x8a6a4a, legs: 0x6a4a30, bw: 0.7, bh: 0.45, bd: 0.9, hy: 0.55, snout: 0x6a4a30 });
  } else if (kind === "allay") {
    addHumanoid(g, { skin: 0x5adce6, shirt: 0x3aa8c8, pants: 0x2a88a8, slim: true, scale: 0.5, eyes: 0x1a2a4a });
  } else if (kind === "warden") {
    g.add(part(0.9, 2.4, 0.5, 0x0a2a3a, 1.3));
    g.add(part(0.7, 0.7, 0.55, 0x0a2a3a, 2.7));
    g.add(part(0.5, 0.12, 0.08, 0x3ae0e8, 2.72, 0, -0.28, 0x3ae0e8));
    g.add(part(0.28, 1.8, 0.28, 0x0a2a3a, 1.4, -0.7, 0));
    g.add(part(0.28, 1.8, 0.28, 0x0a2a3a, 1.4, 0.7, 0));
  } else if (kind === "breeze") {
    g.add(part(0.55, 1.4, 0.55, 0xa0c8e8, 0.9, 0, 0, 0xa0c8e8));
    g.add(part(0.7, 0.4, 0.7, 0xd0e4f4, 1.7));
  } else {
    g.add(part(0.5, 0.5, 0.5, 0x888888, 0.25));
  }
  return g;
}

const STATS: Record<MobKind, { hp: number; hostile: boolean; speed: number; dmg: number }> = {
  pig: { hp: 10, hostile: false, speed: 1.6, dmg: 0 },
  cow: { hp: 10, hostile: false, speed: 1.4, dmg: 0 },
  sheep: { hp: 8, hostile: false, speed: 1.5, dmg: 0 },
  chicken: { hp: 4, hostile: false, speed: 1.8, dmg: 0 },
  wolf: { hp: 8, hostile: false, speed: 2.4, dmg: 4 },
  horse: { hp: 22, hostile: false, speed: 2.8, dmg: 0 },
  fox: { hp: 10, hostile: false, speed: 2.6, dmg: 0 },
  cat: { hp: 10, hostile: false, speed: 2.2, dmg: 0 },
  villager: { hp: 20, hostile: false, speed: 1.2, dmg: 0 },
  golem: { hp: 100, hostile: false, speed: 1.6, dmg: 12 },
  creeper: { hp: 20, hostile: true, speed: 2.2, dmg: 24 },
  zombie: { hp: 20, hostile: true, speed: 2.05, dmg: 4 },
  skeleton: { hp: 20, hostile: true, speed: 2.15, dmg: 4 },
  spider: { hp: 16, hostile: true, speed: 2.7, dmg: 3 },
  enderman: { hp: 40, hostile: true, speed: 2.9, dmg: 7 },
  witch: { hp: 26, hostile: true, speed: 1.8, dmg: 5 },
  slime: { hp: 16, hostile: true, speed: 1.6, dmg: 3 },
  drowned: { hp: 20, hostile: true, speed: 1.9, dmg: 4 },
  husk: { hp: 20, hostile: true, speed: 2.0, dmg: 4 },
  stray: { hp: 20, hostile: true, speed: 2.15, dmg: 4 },
  phantom: { hp: 20, hostile: true, speed: 3.2, dmg: 6 },
  pillager: { hp: 24, hostile: true, speed: 2.1, dmg: 5 },
  blaze: { hp: 20, hostile: true, speed: 2.0, dmg: 5 },
  ghast: { hp: 10, hostile: true, speed: 1.4, dmg: 8 },
  magmacube: { hp: 16, hostile: true, speed: 1.5, dmg: 4 },
  wither_skel: { hp: 20, hostile: true, speed: 2.3, dmg: 6 },
  piglin: { hp: 16, hostile: true, speed: 2.2, dmg: 5 },
  hoglin: { hp: 40, hostile: true, speed: 2.4, dmg: 8 },
  strider: { hp: 20, hostile: false, speed: 1.4, dmg: 0 },
  endermite: { hp: 8, hostile: true, speed: 2.4, dmg: 2 },
  shulker: { hp: 30, hostile: true, speed: 0, dmg: 4 },
  wraith: { hp: 200, hostile: true, speed: 3.4, dmg: 40 },
  dragon: { hp: 200, hostile: true, speed: 8, dmg: 10 },
  wither: { hp: 300, hostile: true, speed: 2.2, dmg: 12 },
  wither_storm: { hp: 800, hostile: true, speed: 3.4, dmg: 16 },
  duelist: { hp: 20, hostile: true, speed: 5.6, dmg: 8 },
  bee: { hp: 10, hostile: false, speed: 2.4, dmg: 2 },
  polar_bear: { hp: 30, hostile: true, speed: 2.2, dmg: 6 },
  panda: { hp: 20, hostile: false, speed: 1.4, dmg: 0 },
  llama: { hp: 22, hostile: false, speed: 1.8, dmg: 1 },
  parrot: { hp: 6, hostile: false, speed: 2.6, dmg: 0 },
  goat: { hp: 10, hostile: false, speed: 2.4, dmg: 2 },
  frog: { hp: 10, hostile: false, speed: 1.6, dmg: 0 },
  squid: { hp: 10, hostile: false, speed: 1.4, dmg: 0 },
  dolphin: { hp: 10, hostile: false, speed: 2.8, dmg: 0 },
  axolotl: { hp: 14, hostile: false, speed: 1.6, dmg: 0 },
  guardian: { hp: 30, hostile: true, speed: 1.2, dmg: 6 },
  ravager: { hp: 100, hostile: true, speed: 2.0, dmg: 12 },
  vindicator: { hp: 24, hostile: true, speed: 2.3, dmg: 7 },
  evoker: { hp: 24, hostile: true, speed: 1.8, dmg: 6 },
  vex: { hp: 14, hostile: true, speed: 3.4, dmg: 4 },
  bat: { hp: 6, hostile: false, speed: 2.8, dmg: 0 },
  silverfish: { hp: 8, hostile: true, speed: 2.6, dmg: 1 },
  cave_spider: { hp: 12, hostile: true, speed: 2.9, dmg: 2 },
  zombie_villager: { hp: 20, hostile: true, speed: 1.9, dmg: 4 },
  snow_golem: { hp: 4, hostile: false, speed: 1.4, dmg: 0 },
  camel: { hp: 32, hostile: false, speed: 1.8, dmg: 0 },
  sniffer: { hp: 14, hostile: false, speed: 1.1, dmg: 0 },
  armadillo: { hp: 12, hostile: false, speed: 1.3, dmg: 0 },
  allay: { hp: 20, hostile: false, speed: 2.8, dmg: 0 },
  warden: { hp: 500, hostile: true, speed: 1.8, dmg: 16 },
  breeze: { hp: 30, hostile: true, speed: 2.6, dmg: 5 },
  piglin_brute: { hp: 50, hostile: true, speed: 2.4, dmg: 8 },
  zombified_piglin: { hp: 20, hostile: true, speed: 2.1, dmg: 5 },
};

export function spawnMob(kind: MobKind, x: number, y: number, z: number, scene: THREE.Scene): Mob {
  const st = STATS[kind];
  const mesh = makeMesh(kind);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  return {
    id: nextId++,
    kind,
    x,
    y,
    z,
    vx: 0,
    vy: 0,
    vz: 0,
    yaw: Math.random() * Math.PI * 2,
    hp: st.hp,
    max: st.hp,
    age: 0,
    hostile: st.hostile,
    mesh,
    fuse: kind === "creeper" ? 0 : undefined,
    cooldown: 0,
    dead: false,
    blocking: false,
    tier: 1,
    ai: st.hostile ? "chase" : "wander",
    aiT: Math.random() * 2,
    lastHurt: 0,
  };
}

const FLYING: Set<MobKind> = new Set([
  "ghast",
  "blaze",
  "phantom",
  "wither",
  "wither_storm",
  "bee",
  "bat",
  "allay",
  "vex",
  "parrot",
  "breeze",
]);

export function updateMobs(
  mobs: Mob[],
  dt: number,
  world: World,
  player: Player,
  night: boolean,
  onExplode: (x: number, y: number, z: number, r: number) => void,
  flyingSafe: boolean,
  onHitPlayer?: (m: Mob, dmg: number, kb: number) => void,
  rules?: { aggression?: number; strafe?: boolean; flee?: boolean; defaultAi?: Mob["ai"] },
) {
  for (const m of mobs) {
    if (m.dead) continue;
    m.age += dt;
    if (m.cooldown && m.cooldown > 0) m.cooldown -= dt;
    if (m.lastHurt && m.lastHurt > 0) m.lastHurt -= dt;
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
      m.mesh.rotation.z = Math.sin(t * 1.4) * 0.12;
      if (dist3 < 6) player.hurtBy(st.dmg * dt, "dragon");
      continue;
    }

    if (m.kind === "wither_storm") {
      const t = m.age;
      const grow = Math.min(2.4, 1 + t * 0.012);
      m.mesh.scale.setScalar(grow);
      const r = 16 + Math.sin(t * 0.2) * 4;
      m.x += (player.x + Math.sin(t * 0.35) * r - m.x) * dt * 0.35;
      m.z += (player.z + Math.cos(t * 0.35) * r - m.z) * dt * 0.35;
      m.y = player.y + 8 + Math.sin(t * 0.6) * 2;
      m.yaw = Math.atan2(player.x - m.x, player.z - m.z);
      m.mesh.position.set(m.x, m.y, m.z);
      m.mesh.rotation.y = m.yaw;
      const pull = Math.min(1, 18 / Math.max(4, dist3));
      player.vx += ((m.x - player.x) / Math.max(1, dist3)) * pull * 3 * dt;
      player.vz += ((m.z - player.z) / Math.max(1, dist3)) * pull * 3 * dt;
      if (dist3 < 8) player.hurtBy(st.dmg * dt, "wither_storm");
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

    if (m.kind === "duelist") {
      tickDuelist(m, dt, world, player, st, dx, dz, dist, dist3, onHitPlayer);
      continue;
    }

    let targetX = 0,
      targetZ = 0;
    const always =
      m.kind === "enderman" ||
      m.kind === "blaze" ||
      m.kind === "ghast" ||
      m.kind === "piglin" ||
      m.kind === "hoglin" ||
      m.kind === "wither_skel" ||
      m.kind === "pillager" ||
      m.kind === "shulker" ||
      m.kind === "wither" ||
      m.kind === "warden" ||
      m.kind === "ravager" ||
      m.kind === "vindicator" ||
      m.kind === "evoker" ||
      m.kind === "piglin_brute" ||
      m.kind === "guardian" ||
      m.kind === "breeze";
    const agr = rules?.aggression ?? 1;
    const see = dist < 28 * Math.max(0.45, agr);
    const aggro =
      m.ai === "chase" ||
      (m.hostile && (night || always || world.dim !== "overworld") && see && m.ai !== "idle" && m.ai !== "wander");
    const forced = m.ai;
    const wantFlee = (rules?.flee !== false && (m.lastHurt ?? 0) > 0 && m.hp < m.max * 0.28 && !always) || forced === "flee";
    const flying = FLYING.has(m.kind);

    m.aiT = (m.aiT ?? 0) - dt;
    if (!forced || forced === "wander" || forced === "idle" || forced === "guard") {
      if ((m.aiT ?? 0) <= 0) {
        if (forced === "idle") {
          m.ai = "idle";
          m.aiT = 1.4 + Math.random() * 2.4;
        } else if (forced === "guard") {
          m.ai = dist < 10 && (m.hostile || m.kind === "golem" || m.kind === "wolf") ? "chase" : "idle";
          m.aiT = 0.8 + Math.random();
        } else if (!aggro) {
          m.ai = Math.random() < 0.38 ? "idle" : "wander";
          m.aiT = m.ai === "idle" ? 0.8 + Math.random() * 2.2 : 1.6 + Math.random() * 3.4;
          m.yaw += (Math.random() - 0.5) * 1.8;
        }
      }
    }

    if (wantFlee) {
      m.yaw = Math.atan2(-dx, -dz);
      targetX = -dx;
      targetZ = -dz;
    } else if (aggro || m.ai === "chase" || m.ai === "circle") {
      m.yaw = Math.atan2(dx, dz);
      const nx = dx / (dist || 1);
      const nz = dz / (dist || 1);
      const strafeOn = rules?.strafe !== false && (m.ai === "circle" || (aggro && dist < 4.2 && Math.sin(m.age * 2.4 + m.id) > 0.15));
      if (strafeOn) {
        const sx = -nz;
        const sz = nx;
        const amp = Math.sin(m.age * 3.1 + m.id) * st.speed * 0.85;
        targetX = nx * (dist > 1.4 ? st.speed : -0.6) + sx * amp;
        targetZ = nz * (dist > 1.4 ? st.speed : -0.6) + sz * amp;
      } else {
        targetX = dx;
        targetZ = dz;
      }
    } else if (m.ai === "idle") {
      targetX = 0;
      targetZ = 0;
    } else {
      targetX = Math.sin(m.yaw);
      targetZ = Math.cos(m.yaw);
      const aheadX = m.x + Math.sin(m.yaw) * 1.4;
      const aheadZ = m.z + Math.cos(m.yaw) * 1.4;
      const drop = m.y - (world.highestSolid(aheadX, aheadZ) + 1);
      if (!flying && drop > 3.2) {
        m.yaw += Math.PI * 0.6 + (Math.random() - 0.5);
        targetX = Math.sin(m.yaw);
        targetZ = Math.cos(m.yaw);
      }
    }
    const spd = st.speed * (aggro || wantFlee ? 1 : 0.52) * (m.ai === "idle" ? 0 : 1);
    const tlen = Math.hypot(targetX, targetZ) || 1;
    m.vx = (targetX / tlen) * spd;
    m.vz = (targetZ / tlen) * spd;
    if (flying) {
      const wantY = player.y + (m.kind === "ghast" ? 6 : 2);
      m.vy += (wantY - m.y) * 2 * dt;
      m.vy *= 0.92;
    } else {
      m.vy -= 28 * dt;
    }
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
    if (m.kind === "slime" || m.kind === "magmacube") {
      const b = 1 + Math.abs(Math.sin(m.age * 6)) * 0.18;
      m.mesh.scale.set(1 / b, b, 1 / b);
    }
    swingLimbs(m.mesh, m.age, aggro ? 10 : 6, aggro ? 0.55 : 0.28);

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

    const melee =
      m.kind !== "creeper" && m.kind !== "skeleton" && m.kind !== "ghast" && m.kind !== "stray" && m.kind !== "shulker";
    if (aggro && dist < 1.45 && melee) {
      if (!m.cooldown || m.cooldown <= 0) {
        if (onHitPlayer) onHitPlayer(m, st.dmg, 6.5);
        else player.hurtBy(st.dmg, m.kind);
        m.cooldown = 0.8;
      }
    }
  }
}

function tickDuelist(
  m: Mob,
  dt: number,
  world: World,
  player: Player,
  st: { hp: number; speed: number; dmg: number },
  dx: number,
  dz: number,
  dist: number,
  dist3: number,
  onHitPlayer?: (m: Mob, dmg: number, kb: number) => void,
) {
  m.yaw = Math.atan2(dx, dz);
  const lv = Math.max(1, Math.min(100, m.tier ?? 1));
  const nx = dx / (dist || 1);
  const nz = dz / (dist || 1);
  const sx = -nz;
  const sz = nx;
  const strafe = Math.sin(m.age * (4.6 + lv * 0.018)) * (3.4 + lv * 0.018);
  const speed = st.speed + (lv - 1) * 0.046;
  let close = 0;
  if (dist > 1.2) close = speed;
  else if (dist < 0.85) close = -2.6;
  m.vx = nx * close + sx * strafe;
  m.vz = nz * close + sz * strafe;
  m.vy -= 28 * dt;
  if (dist < 3.4 && m.vy <= 0.05 && m.age % Math.max(0.45, 0.85 - lv * 0.003) < dt * 2.2) m.vy = 7.1;
  m.x += m.vx * dt;
  if (collides(world, m)) {
    m.y += 0.55;
    if (collides(world, m)) {
      m.y -= 0.55;
      m.x -= m.vx * dt;
    }
  }
  m.z += m.vz * dt;
  if (collides(world, m)) {
    m.y += 0.55;
    if (collides(world, m)) {
      m.y -= 0.55;
      m.z -= m.vz * dt;
    }
  }
  m.y += m.vy * dt;
  if (collides(world, m)) {
    m.y -= m.vy * dt;
    m.vy = 0;
  }
  m.blocking = dist < 2.2 && dist > 1.15 && Math.sin(m.age * 1.6) > 0.55;
  const heal = Math.max(0, 4 - lv * 0.035);
  if (heal > 0.2 && m.hp < m.max * 0.6 && m.age % 3.2 < dt * 2) m.hp = Math.min(m.max, m.hp + heal);
  m.mesh.position.set(m.x, m.y, m.z);
  m.mesh.rotation.y = m.yaw;
  swingLimbs(m.mesh, m.age, 14 + lv * 0.04, 0.7);
  const dy = Math.abs(player.y + 0.9 - (m.y + 0.9));
  if (dist < 3.1 && dy < 2.4 && (!m.cooldown || m.cooldown <= 0)) {
    const crit = m.vy < -0.12;
    const dmg = (st.dmg + (lv - 1) * 0.22) * (crit ? 1.5 : 1);
    if (onHitPlayer) onHitPlayer(m, dmg, crit ? 3.1 : 2.2);
    else player.hurtBy(dmg, "duelist");
    m.cooldown = Math.max(0.26, 0.55 - (lv - 1) * 0.0024);
  }
  void dist3;
}

function collides(world: World, m: Mob): boolean {
  const w = m.kind === "dragon" || m.kind === "wither_storm" ? 2 : m.kind === "golem" || m.kind === "ravager" || m.kind === "warden" ? 0.7 : m.kind === "hoglin" ? 0.6 : 0.4;
  const h =
    m.kind === "enderman" || m.kind === "warden"
      ? 2.8
      : m.kind === "ghast"
        ? 2.2
        : m.kind === "golem"
          ? 2.6
          : m.kind === "horse" || m.kind === "camel"
            ? 1.8
            : 1.7;
  return world.collides(m.x - w / 2, m.y, m.z - w / 2, w, h, w);
}

export function hitMob(
  mobs: Mob[],
  x: number,
  y: number,
  z: number,
  dmg: number,
  kb?: { x: number; y: number; z: number },
): Mob | null {
  let best: Mob | null = null;
  let bd = 2.4;
  for (const m of mobs) {
    if (m.dead) continue;
    const d = Math.hypot(m.x - x, m.y + 0.8 - y, m.z - z);
    const reach = m.kind === "dragon" ? 5 : m.kind === "golem" || m.kind === "warden" ? 2.8 : 2.4;
    if (d < reach && d < bd) {
      bd = d;
      best = m;
    }
  }
  if (best) {
    let dealt = dmg;
    if (best.blocking) dealt *= 0.35;
    best.hp -= dealt;
    best.lastHurt = 1.8;
    if (!best.hostile && (best.kind === "wolf" || best.kind === "bee" || best.kind === "polar_bear" || best.kind === "llama" || best.kind === "goat")) {
      best.hostile = true;
      best.ai = "chase";
    } else if (!best.hostile && best.hp < best.max * 0.6) {
      best.ai = "flee";
      best.aiT = 2.4;
    }
    if (kb) {
      best.vx += kb.x;
      best.vy = Math.min(3.6, best.vy + Math.min(1.15, kb.y));
      best.vz += kb.z;
    }
    best.mesh.traverse((o) => {
      if (o instanceof THREE.Mesh && o.material instanceof THREE.MeshLambertMaterial) {
        o.material.emissive = new THREE.Color(0xffffff);
        o.material.emissiveIntensity = 0.7;
        setTimeout(() => {
          if (o.material instanceof THREE.MeshLambertMaterial) o.material.emissiveIntensity = 0;
        }, 70);
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
  const cap = difficulty === "hard" ? 28 : difficulty === "easy" ? 12 : 20;
  if (mobs.filter((m) => !m.dead && m.kind !== "dragon" && m.kind !== "wraith" && m.kind !== "duelist").length > cap)
    return null;
  const ang = Math.random() * Math.PI * 2;
  const dist = 14 + Math.random() * 18;
  const x = player.x + Math.cos(ang) * dist;
  const z = player.z + Math.sin(ang) * dist;
  const y = world.highestSolid(x, z) + 1;
  if (y < 2) return null;
  const id = world.getBlock(Math.floor(x), y, Math.floor(z));
  if (id === WATER && Math.random() > 0.3) {
    const wr = Math.random();
    const wk: MobKind = wr < 0.4 ? "drowned" : wr < 0.6 ? "squid" : wr < 0.8 ? "dolphin" : wr < 0.9 ? "axolotl" : "guardian";
    return spawnMob(wk, x, y, z, scene);
  }
  let kind: MobKind;
  if (world.dim === "nether") {
    const r = Math.random();
    kind =
      r < 0.16
        ? "blaze"
        : r < 0.3
          ? "ghast"
          : r < 0.44
            ? "piglin"
            : r < 0.54
              ? "piglin_brute"
              : r < 0.64
                ? "hoglin"
                : r < 0.74
                  ? "magmacube"
                  : r < 0.84
                    ? "wither_skel"
                    : r < 0.92
                      ? "zombified_piglin"
                      : "strider";
  } else if (world.dim === "end") {
    const r = Math.random();
    kind = r < 0.7 ? "enderman" : r < 0.9 ? "endermite" : "shulker";
  } else if (night) {
    if (difficulty === "peaceful") {
      const r = Math.random();
      kind =
        r < 0.14
          ? "pig"
          : r < 0.28
            ? "cow"
            : r < 0.4
              ? "sheep"
              : r < 0.5
                ? "chicken"
                : r < 0.6
                  ? "horse"
                  : r < 0.7
                    ? "fox"
                    : r < 0.78
                      ? "cat"
                      : r < 0.86
                        ? "frog"
                        : r < 0.93
                          ? "bee"
                          : "parrot";
    } else {
      const r = hash2(Math.floor(x), Math.floor(z), seed + Math.floor(player.x));
      kind =
        r < 0.16
          ? "zombie"
          : r < 0.28
            ? "skeleton"
            : r < 0.38
              ? "spider"
              : r < 0.48
                ? "creeper"
                : r < 0.56
                  ? "husk"
                  : r < 0.63
                    ? "stray"
                    : r < 0.7
                      ? "witch"
                      : r < 0.76
                        ? "phantom"
                        : r < 0.82
                          ? "pillager"
                          : r < 0.86
                            ? "vindicator"
                            : r < 0.9
                              ? "cave_spider"
                              : r < 0.93
                                ? "zombie_villager"
                                : r < 0.96
                                  ? "silverfish"
                                  : "ravager";
    }
  } else {
    const r = Math.random();
    kind =
      r < 0.1
        ? "pig"
        : r < 0.2
          ? "cow"
          : r < 0.3
            ? "sheep"
            : r < 0.38
              ? "chicken"
              : r < 0.45
                ? "wolf"
                : r < 0.52
                  ? "horse"
                  : r < 0.58
                    ? "fox"
                    : r < 0.64
                      ? "cat"
                      : r < 0.7
                        ? "villager"
                        : r < 0.74
                          ? "golem"
                          : r < 0.78
                            ? "bee"
                            : r < 0.82
                              ? "llama"
                              : r < 0.85
                                ? "goat"
                                : r < 0.88
                                  ? "panda"
                                  : r < 0.91
                                    ? "camel"
                                    : r < 0.94
                                      ? "frog"
                                      : r < 0.97
                                        ? "allay"
                                        : "sniffer";
  }
  return spawnMob(kind, x, y, z, scene);
}

export function disposeMob(m: Mob, scene: THREE.Scene) {
  scene.remove(m.mesh);
}
