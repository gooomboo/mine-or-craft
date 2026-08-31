import * as THREE from "three";
import { getFace, PART_SIZE, type SkinData, type SkinFace, type SkinPart, withPixels } from "./skins";

const geos = new Map<string, THREE.BufferGeometry>();
function geo(w: number, h: number, d: number) {
  const k = `${w.toFixed(3)}:${h.toFixed(3)}:${d.toFixed(3)}`;
  let g = geos.get(k);
  if (!g) {
    g = new THREE.BoxGeometry(w, h, d);
    geos.set(k, g);
  }
  return g;
}

const mats = new Map<string, THREE.MeshLambertMaterial>();
function mat(color: number, emissive = 0) {
  const k = `${color}:${emissive}`;
  let m = mats.get(k);
  if (!m) {
    m = new THREE.MeshLambertMaterial({
      color,
      emissive: emissive ? new THREE.Color(emissive) : new THREE.Color(0x000000),
      emissiveIntensity: emissive ? 0.55 : 0,
    });
    mats.set(k, m);
  }
  return m;
}

function shadeHex(color: number, f: number) {
  const r = Math.max(0, Math.min(255, Math.round(((color >> 16) & 255) * f)));
  const g = Math.max(0, Math.min(255, Math.round(((color >> 8) & 255) * f)));
  const b = Math.max(0, Math.min(255, Math.round((color & 255) * f)));
  return (r << 16) | (g << 8) | b;
}

export function part(w: number, h: number, d: number, color: number, y: number, x = 0, z = 0, emissive = 0): THREE.Mesh {
  const m = new THREE.Mesh(geo(w, h, d), mat(color, emissive));
  m.position.set(x, y, z);
  m.castShadow = false;
  return m;
}

export interface HumanoidColors {
  skin: number;
  shirt: number;
  pants: number;
  hair?: number;
  eyes?: number;
  shoes?: number;
  scale?: number;
  slim?: boolean;
  helm?: number;
  chest?: number;
  boots?: number;
}

export function addHumanoid(g: THREE.Group, c: HumanoidColors) {
  const s = c.scale ?? 1;
  const aw = c.slim ? 0.16 * s : 0.22 * s;
  const head = part(0.5 * s, 0.5 * s, 0.5 * s, c.skin, 1.55 * s);
  g.add(head);
  g.add(part(0.12 * s, 0.1 * s, 0.1 * s, c.skin, 1.48 * s, 0, -0.26 * s));
  const eyeC = c.eyes ?? 0x1a1a22;
  g.add(part(0.1 * s, 0.08 * s, 0.06 * s, 0xf4f0e8, 1.56 * s, -0.1 * s, -0.24 * s));
  g.add(part(0.1 * s, 0.08 * s, 0.06 * s, 0xf4f0e8, 1.56 * s, 0.1 * s, -0.24 * s));
  g.add(part(0.06 * s, 0.06 * s, 0.05 * s, eyeC, 1.56 * s, -0.1 * s, -0.27 * s));
  g.add(part(0.06 * s, 0.06 * s, 0.05 * s, eyeC, 1.56 * s, 0.1 * s, -0.27 * s));
  g.add(part(0.16 * s, 0.04 * s, 0.04 * s, 0x3a2018, 1.64 * s, -0.1 * s, -0.24 * s));
  g.add(part(0.16 * s, 0.04 * s, 0.04 * s, 0x3a2018, 1.64 * s, 0.1 * s, -0.24 * s));
  if (c.hair !== undefined) {
    g.add(part(0.54 * s, 0.22 * s, 0.54 * s, c.hair, 1.78 * s));
    g.add(part(0.54 * s, 0.36 * s, 0.12 * s, c.hair, 1.58 * s, 0, 0.22 * s));
    g.add(part(0.08 * s, 0.28 * s, 0.5 * s, c.hair, 1.58 * s, -0.24 * s, 0));
    g.add(part(0.08 * s, 0.28 * s, 0.5 * s, c.hair, 1.58 * s, 0.24 * s, 0));
  }
  const shirt = c.chest ?? c.shirt;
  const body = part(0.5 * s, 0.72 * s, 0.28 * s, shirt, 0.96 * s);
  g.add(body);
  g.add(part(0.52 * s, 0.08 * s, 0.3 * s, shadeHex(shirt, 0.72), 1.28 * s));
  g.add(part(0.52 * s, 0.07 * s, 0.3 * s, shadeHex(shirt, 0.55), 0.62 * s));
  g.add(part(0.12 * s, 0.14 * s, 0.06 * s, shadeHex(shirt, 0.82), 1.08 * s, 0.14 * s, -0.14 * s));
  if (c.helm !== undefined) g.add(part(0.56 * s, 0.28 * s, 0.56 * s, c.helm, 1.82 * s));
  const armL = new THREE.Group();
  armL.position.set(-0.36 * s, 1.28 * s, 0);
  armL.add(part(aw, 0.72 * s, 0.22 * s, shirt, -0.36 * s));
  const armR = new THREE.Group();
  armR.position.set(0.36 * s, 1.28 * s, 0);
  armR.add(part(aw, 0.72 * s, 0.22 * s, shirt, -0.36 * s));
  const pants = c.pants;
  const legL = new THREE.Group();
  legL.position.set(-0.12 * s, 0.6 * s, 0);
  legL.add(part(0.22 * s, 0.7 * s, 0.22 * s, pants, -0.3 * s));
  legL.add(part(0.08 * s, 0.5 * s, 0.04 * s, shadeHex(pants, 0.7), -0.28 * s, 0.08 * s, -0.1 * s));
  const shoe = c.boots ?? c.shoes ?? 0x1a1a1a;
  legL.add(part(0.24 * s, 0.12 * s, 0.28 * s, shoe, -0.62 * s));
  const legR = new THREE.Group();
  legR.position.set(0.12 * s, 0.6 * s, 0);
  legR.add(part(0.22 * s, 0.7 * s, 0.22 * s, pants, -0.3 * s));
  legR.add(part(0.24 * s, 0.12 * s, 0.28 * s, shoe, -0.62 * s));
  g.add(armL, armR, legL, legR);
  g.userData.limbs = { head, armL, armR, legL, legR };
  return g;
}

export function addQuad(
  g: THREE.Group,
  o: {
    body: number;
    head: number;
    legs: number;
    bw: number;
    bh: number;
    bd: number;
    hy: number;
    snout?: number;
    ear?: number;
    tail?: number;
  },
) {
  g.add(part(o.bw, o.bh, o.bd, o.body, o.bh * 0.55 + 0.18));
  g.add(part(o.bw * 0.55, o.bh * 0.55, o.bw * 0.55, o.head, o.hy, 0, -o.bd * 0.42));
  g.add(part(0.08, 0.07, 0.04, 0xf4f0e8, o.hy + 0.04, -o.bw * 0.12, -o.bd * 0.68));
  g.add(part(0.08, 0.07, 0.04, 0xf4f0e8, o.hy + 0.04, o.bw * 0.12, -o.bd * 0.68));
  g.add(part(0.045, 0.045, 0.03, 0x1a1a22, o.hy + 0.04, -o.bw * 0.12, -o.bd * 0.71));
  g.add(part(0.045, 0.045, 0.03, 0x1a1a22, o.hy + 0.04, o.bw * 0.12, -o.bd * 0.71));
  if (o.snout !== undefined) g.add(part(o.bw * 0.28, o.bh * 0.18, o.bw * 0.22, o.snout, o.hy - 0.06, 0, -o.bd * 0.58));
  if (o.ear !== undefined) {
    g.add(part(0.12, 0.18, 0.08, o.ear, o.hy + 0.28, -o.bw * 0.18, -o.bd * 0.4));
    g.add(part(0.12, 0.18, 0.08, o.ear, o.hy + 0.28, o.bw * 0.18, -o.bd * 0.4));
  }
  if (o.tail !== undefined) g.add(part(0.1, 0.1, o.bd * 0.35, o.tail, o.bh * 0.6, 0, o.bd * 0.42));
  const inset = o.bw * 0.28;
  const zf = o.bd * 0.28;
  const legL = new THREE.Group();
  legL.position.set(-inset, 0.38, -zf);
  legL.add(part(0.18, 0.42, 0.18, o.legs, -0.18));
  const legR = new THREE.Group();
  legR.position.set(inset, 0.38, -zf);
  legR.add(part(0.18, 0.42, 0.18, o.legs, -0.18));
  const legLb = new THREE.Group();
  legLb.position.set(-inset, 0.38, zf);
  legLb.add(part(0.18, 0.42, 0.18, o.legs, -0.18));
  const legRb = new THREE.Group();
  legRb.position.set(inset, 0.38, zf);
  legRb.add(part(0.18, 0.42, 0.18, o.legs, -0.18));
  g.add(legL, legR, legLb, legRb);
  g.userData.limbs = { armL: legL, armR: legR, legL: legLb, legR: legRb };
  return g;
}

export function addHeld(g: THREE.Group, kind: "sword" | "axe" | "bow" | "pearl" | "rod" | "gapple" | "block" | "none", tint = 0x5adce6) {
  const grip = new THREE.Group();
  grip.position.set(0.38, 1.05, -0.12);
  grip.rotation.set(-0.35, 0.4, 0.15);
  if (kind === "sword") {
    grip.add(part(0.08, 0.08, 0.7, tint, 0, 0, -0.28));
    grip.add(part(0.22, 0.08, 0.08, 0x6b5530, 0, 0, 0.12));
    grip.add(part(0.08, 0.08, 0.18, 0x6b5530, 0, 0, 0.26));
  } else if (kind === "axe") {
    grip.add(part(0.08, 0.08, 0.55, 0x6b5530, 0, 0, -0.18));
    grip.add(part(0.28, 0.08, 0.22, tint, 0, 0, -0.42));
  } else if (kind === "bow") {
    grip.add(part(0.06, 0.55, 0.06, 0x6b5530, 0, 0, -0.1));
    grip.add(part(0.04, 0.04, 0.4, 0xe8e0c8, 0.2, 0, -0.1));
  } else if (kind === "pearl") {
    grip.add(part(0.18, 0.18, 0.18, 0x1a6a5a, 0, 0, -0.2, 0x1a6a5a));
  } else if (kind === "rod") {
    grip.add(part(0.06, 0.06, 0.8, 0x6b5530, 0, 0, -0.3));
    grip.add(part(0.04, 0.04, 0.2, 0xc43030, 0, 0, -0.7));
  } else if (kind === "gapple") {
    grip.add(part(0.18, 0.18, 0.18, 0xf0c832, 0, 0, -0.18, 0xf0c832));
  } else if (kind === "block") {
    grip.add(part(0.28, 0.28, 0.28, tint, 0, 0, -0.18));
  }
  g.add(grip);
  return grip;
}

export function buildViewArm(skin: number): THREE.Group {
  const g = new THREE.Group();
  const arm = part(0.22, 0.22, 0.55, skin, 0);
  arm.rotation.set(0.35, 0.55, 0.18);
  arm.position.set(0.32, -0.24, -0.52);
  g.add(arm);
  const item = new THREE.Group();
  item.position.set(0.42, -0.18, -0.78);
  item.rotation.set(0.9, 0.35, 0.2);
  g.add(item);
  g.userData.item = item;
  return g;
}

export function fillHeld(item: THREE.Group, kind: "sword" | "axe" | "bow" | "pearl" | "rod" | "gapple" | "block" | "none", tint = 0x5adce6) {
  while (item.children.length) item.remove(item.children[0]!);
  if (kind === "none") return;
  if (kind === "sword") {
    item.add(part(0.07, 0.07, 0.62, tint, 0, 0, -0.2));
    item.add(part(0.2, 0.07, 0.07, 0x6b5530, 0, 0, 0.16));
  } else if (kind === "axe") {
    item.add(part(0.07, 0.07, 0.5, 0x6b5530, 0, 0, -0.12));
    item.add(part(0.26, 0.08, 0.2, tint, 0, 0, -0.36));
  } else if (kind === "bow") {
    item.add(part(0.05, 0.5, 0.05, 0x6b5530, 0, 0, 0));
  } else if (kind === "pearl") {
    item.add(part(0.16, 0.16, 0.16, 0x1a6a5a, 0, 0, 0, 0x1a6a5a));
  } else if (kind === "rod") {
    item.add(part(0.05, 0.05, 0.7, 0x6b5530, 0, 0, -0.2));
  } else if (kind === "gapple") {
    item.add(part(0.16, 0.16, 0.16, 0xf0c832, 0, 0, 0, 0xf0c832));
  } else if (kind === "block") {
    item.add(part(0.24, 0.24, 0.24, tint, 0, 0, 0));
  }
}

export function swingLimbs(mesh: THREE.Group, t: number, speed: number, amount: number) {
  const l = mesh.userData.limbs as
    | { head?: THREE.Mesh; armL?: THREE.Group; armR?: THREE.Group; legL?: THREE.Group; legR?: THREE.Group }
    | undefined;
  if (!l?.armL) return;
  const a = Math.sin(t * speed) * amount;
  if (l.armL) l.armL.rotation.x = a;
  if (l.armR) l.armR.rotation.x = -a;
  if (l.legL) l.legL.rotation.x = -a;
  if (l.legR) l.legR.rotation.x = a;
  if (l.head) l.head.rotation.y = Math.sin(t * speed * 0.5) * amount * 0.15;
}

export function hexNum(s: string): number {
  const n = parseInt(s.replace("#", ""), 16);
  return Number.isFinite(n) ? n : 0xc68642;
}

export function heldKind(id: number): "sword" | "axe" | "bow" | "pearl" | "rod" | "gapple" | "block" | "none" {
  if (id === 10023 || id === 10024 || (id >= 10019 && id <= 10024) || id === 10168 || id === 10143) return "sword";
  if (id >= 10007 && id <= 10012) return "axe";
  if (id === 10032 || id === 10144) return "bow";
  if (id === 10061) return "pearl";
  if (id === 10076) return "rod";
  if (id === 10055) return "gapple";
  if (id > 0 && id < 10000) return "block";
  return "none";
}

function texFromFace(pixels: number[], w: number, h: number, flipX = false): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  const img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sx = flipX ? w - 1 - x : x;
      const col = pixels[y * w + sx] ?? 0;
      const o = (y * w + x) * 4;
      img.data[o] = (col >> 16) & 255;
      img.data[o + 1] = (col >> 8) & 255;
      img.data[o + 2] = col & 255;
      img.data[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  t.flipY = false;
  t.needsUpdate = true;
  return t;
}

function boxMats(skin: SkinData, part: SkinPart): THREE.MeshLambertMaterial[] {
  const { w, h } = PART_SIZE[part];
  const px = withPixels(skin).pixels!;
  const face = (f: SkinFace, flipX = false) =>
    new THREE.MeshLambertMaterial({
      map: texFromFace(getFace(px, part, f), w, h, flipX),
    });
  // BoxGeometry: +x, -x, +y, -y, +z, -z. Character faces -Z, so -z is the painted front.
  return [face("right"), face("left", true), face("top"), face("bottom"), face("back", true), face("front")];
}

export function addSkinnedHumanoid(g: THREE.Group, skin: SkinData, scale = 1) {
  const s = scale;
  const head = new THREE.Mesh(geo(0.5 * s, 0.5 * s, 0.5 * s), boxMats(skin, "head"));
  head.position.set(0, 1.55 * s, 0);
  g.add(head);
  const body = new THREE.Mesh(geo(0.5 * s, 0.72 * s, 0.28 * s), boxMats(skin, "body"));
  body.position.set(0, 0.96 * s, 0);
  g.add(body);
  const armL = new THREE.Group();
  armL.position.set(-0.36 * s, 1.28 * s, 0);
  const armLM = new THREE.Mesh(geo(0.22 * s, 0.72 * s, 0.22 * s), boxMats(skin, "armL"));
  armLM.position.set(0, -0.36 * s, 0);
  armL.add(armLM);
  const armR = new THREE.Group();
  armR.position.set(0.36 * s, 1.28 * s, 0);
  const armRM = new THREE.Mesh(geo(0.22 * s, 0.72 * s, 0.22 * s), boxMats(skin, "armR"));
  armRM.position.set(0, -0.36 * s, 0);
  armR.add(armRM);
  const legL = new THREE.Group();
  legL.position.set(-0.12 * s, 0.6 * s, 0);
  const legLM = new THREE.Mesh(geo(0.22 * s, 0.7 * s, 0.22 * s), boxMats(skin, "legL"));
  legLM.position.set(0, -0.3 * s, 0);
  legL.add(legLM);
  const legR = new THREE.Group();
  legR.position.set(0.12 * s, 0.6 * s, 0);
  const legRM = new THREE.Mesh(geo(0.22 * s, 0.7 * s, 0.22 * s), boxMats(skin, "legR"));
  legRM.position.set(0, -0.3 * s, 0);
  legR.add(legRM);
  g.add(armL, armR, legL, legR);
  g.userData.limbs = { head, armL, armR, legL, legR };
  return g;
}

export function makeBoatMesh(tint = 0xb8945a): THREE.Group {
  const g = new THREE.Group();
  g.add(part(1.55, 0.18, 0.72, tint, 0.1));
  g.add(part(1.6, 0.28, 0.12, shadeHex(tint, 0.75), 0.22, 0, 0.32));
  g.add(part(1.6, 0.28, 0.12, shadeHex(tint, 0.75), 0.22, 0, -0.32));
  g.add(part(0.14, 0.28, 0.72, shadeHex(tint, 0.65), 0.22, 0.74, 0));
  g.add(part(0.14, 0.28, 0.72, shadeHex(tint, 0.65), 0.22, -0.74, 0));
  g.add(part(0.08, 0.7, 0.08, shadeHex(tint, 0.5), 0.55, 0.2, 0));
  return g;
}

