import * as THREE from "three";
import type { Atlas } from "./atlas";
import { BLOCKS, CACTUS, FIRE, isSolid, LAVA, MAGMA, WATER } from "./blocks";
import { generateChunk, makeNoises, type ChunkData, type Noises } from "./gen";
import { meshChunk } from "./mesher";
import { CHUNK_H, CHUNK_W, chunkKey, worldToChunk, localCoord, SEA_LEVEL, type ArenaId, type Dim } from "./types";

export interface Chunk {
  cx: number;
  cz: number;
  dim: Dim;
  data: ChunkData;
  dirty: boolean;
  mesh?: THREE.Mesh;
  tmesh?: THREE.Mesh;
  fmesh?: THREE.Mesh;
  building: boolean;
}

export class World {
  chunks = new Map<string, Chunk>();
  noises: Noises;
  seed: number;
  dim: Dim = "overworld";
  scene: THREE.Scene;
  atlas: Atlas;
  solidMat: THREE.MeshLambertMaterial;
  cutoutMat: THREE.MeshLambertMaterial;
  fluidMat: THREE.MeshLambertMaterial;
  edits = new Map<string, Uint16Array>();
  private buildQueue: Chunk[] = [];
  private lastPlayer = { x: 0, z: 0 };
  shadows = false;
  arena: ArenaId | null = null;
  toggled = new Set<string>();
  passable = new Set<string>();

  constructor(scene: THREE.Scene, atlas: Atlas, seed: number) {
    this.scene = scene;
    this.atlas = atlas;
    this.seed = seed;
    this.noises = makeNoises(seed);
    this.solidMat = new THREE.MeshLambertMaterial({
      map: atlas.texture,
      vertexColors: true,
    });
    this.cutoutMat = new THREE.MeshLambertMaterial({
      map: atlas.texture,
      vertexColors: true,
      alphaTest: 0.35,
      side: THREE.DoubleSide,
      transparent: false,
    });
    this.fluidMat = new THREE.MeshLambertMaterial({
      map: atlas.texture,
      vertexColors: true,
      transparent: true,
      opacity: 0.62,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }

  setShadows(on: boolean) {
    this.shadows = on;
    this.solidMat.needsUpdate = true;
    for (const ch of this.chunks.values()) {
      if (ch.mesh) {
        ch.mesh.castShadow = on;
        ch.mesh.receiveShadow = on;
      }
    }
  }

  setFancyWater(on: boolean) {
    this.fluidMat.opacity = on ? 0.58 : 0.82;
    this.fluidMat.needsUpdate = true;
  }

  getChunk(cx: number, cz: number, dim = this.dim): Chunk | undefined {
    return this.chunks.get(chunkKey(dim, cx, cz));
  }

  getBlock(x: number, y: number, z: number, dim = this.dim): number {
    if (y < 0 || y >= CHUNK_H) return 0;
    const cx = worldToChunk(x);
    const cz = worldToChunk(z);
    const ch = this.getChunk(cx, cz, dim);
    if (!ch) return 0;
    const lx = localCoord(x);
    const lz = localCoord(z);
    return ch.data.blocks[lx + lz * CHUNK_W + y * CHUNK_W * CHUNK_W]!;
  }

  setBlock(x: number, y: number, z: number, id: number, dim = this.dim): boolean {
    if (y < 0 || y >= CHUNK_H) return false;
    const cx = worldToChunk(x);
    const cz = worldToChunk(z);
    let ch = this.getChunk(cx, cz, dim);
    if (!ch) {
      ch = this.ensureChunk(cx, cz, dim);
    }
    const lx = localCoord(x);
    const lz = localCoord(z);
    const i = lx + lz * CHUNK_W + y * CHUNK_W * CHUNK_W;
    ch.data.blocks[i] = id;
    ch.dirty = true;
    this.edits.set(chunkKey(dim, cx, cz), ch.data.blocks);
    if (lx === 0) this.getChunk(cx - 1, cz, dim) && (this.getChunk(cx - 1, cz, dim)!.dirty = true);
    if (lx === CHUNK_W - 1) this.getChunk(cx + 1, cz, dim) && (this.getChunk(cx + 1, cz, dim)!.dirty = true);
    if (lz === 0) this.getChunk(cx, cz - 1, dim) && (this.getChunk(cx, cz - 1, dim)!.dirty = true);
    if (lz === CHUNK_W - 1) this.getChunk(cx, cz + 1, dim) && (this.getChunk(cx, cz + 1, dim)!.dirty = true);
    return true;
  }

  ensureChunk(cx: number, cz: number, dim = this.dim): Chunk {
    const k = chunkKey(dim, cx, cz);
    let ch = this.chunks.get(k);
    if (ch) return ch;
    const edited = this.edits.get(k);
    const data = edited
      ? { blocks: edited, biomes: new Uint8Array(CHUNK_W * CHUNK_W) }
      : generateChunk(this.seed, cx, cz, dim, this.noises, this.arena);
    ch = { cx, cz, dim, data, dirty: true, building: false };
    this.chunks.set(k, ch);
    this.buildQueue.push(ch);
    return ch;
  }

  streamAround(px: number, pz: number, radius: number, dim: Dim) {
    this.dim = dim;
    const pcx = worldToChunk(px);
    const pcz = worldToChunk(pz);
    this.lastPlayer = { x: px, z: pz };
    const needed = new Set<string>();
    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dz * dz > radius * radius + 2) continue;
        needed.add(chunkKey(dim, pcx + dx, pcz + dz));
        this.ensureChunk(pcx + dx, pcz + dz, dim);
      }
    }
    for (const [k, ch] of this.chunks) {
      if (ch.dim !== dim || !needed.has(k)) {
        this.unload(ch);
        this.chunks.delete(k);
      }
    }
  }

  async streamAroundYielding(
    px: number,
    pz: number,
    radius: number,
    dim: Dim,
    onProgress?: (msg: string, pct: number) => void,
  ) {
    this.dim = dim;
    const pcx = worldToChunk(px);
    const pcz = worldToChunk(pz);
    this.lastPlayer = { x: px, z: pz };
    const jobs: [number, number][] = [];
    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dz * dz > radius * radius + 2) continue;
        jobs.push([pcx + dx, pcz + dz]);
      }
    }
    jobs.sort((a, b) => {
      const da = (a[0] - pcx) ** 2 + (a[1] - pcz) ** 2;
      const db = (b[0] - pcx) ** 2 + (b[1] - pcz) ** 2;
      return da - db;
    });
    const needed = new Set(jobs.map(([x, z]) => chunkKey(dim, x, z)));
    for (const [k, ch] of this.chunks) {
      if (ch.dim !== dim || !needed.has(k)) {
        this.unload(ch);
        this.chunks.delete(k);
      }
    }
    const batch = 3;
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i]!;
      this.ensureChunk(job[0], job[1], dim);
      if (i % batch === batch - 1 || i === jobs.length - 1) {
        onProgress?.(`Sculpting terrain ${i + 1}/${jobs.length}`, 0.12 + 0.38 * ((i + 1) / jobs.length));
        await new Promise((r) => setTimeout(r, 0));
      }
    }
  }

  processBuilds(budgetMs = 6, useAo = true) {
    const t0 = performance.now();
    this.buildQueue = this.buildQueue.filter((c) => this.chunks.has(chunkKey(c.dim, c.cx, c.cz)) && c.dirty);
    for (const ch of this.chunks.values()) {
      if (ch.dirty && !this.buildQueue.includes(ch)) this.buildQueue.push(ch);
    }
    this.buildQueue.sort((a, b) => {
      const da = (a.cx + 0.5) * CHUNK_W - this.lastPlayer.x;
      const db = (b.cx + 0.5) * CHUNK_W - this.lastPlayer.x;
      const za = (a.cz + 0.5) * CHUNK_W - this.lastPlayer.z;
      const zb = (b.cz + 0.5) * CHUNK_W - this.lastPlayer.z;
      return da * da + za * za - (db * db + zb * zb);
    });
    let n = 0;
    const cap = budgetMs > 20 ? 32 : 3;
    while (this.buildQueue.length && performance.now() - t0 < budgetMs && n < cap) {
      const ch = this.buildQueue.shift()!;
      if (!this.chunks.has(chunkKey(ch.dim, ch.cx, ch.cz))) continue;
      this.rebuild(ch, useAo);
      n++;
    }
  }

  private rebuild(ch: Chunk, useAo: boolean) {
    const neighbors = {
      px: this.getChunk(ch.cx + 1, ch.cz, ch.dim)?.data.blocks,
      nx: this.getChunk(ch.cx - 1, ch.cz, ch.dim)?.data.blocks,
      pz: this.getChunk(ch.cx, ch.cz + 1, ch.dim)?.data.blocks,
      nz: this.getChunk(ch.cx, ch.cz - 1, ch.dim)?.data.blocks,
    };
    const built = meshChunk(ch.data.blocks, neighbors, this.atlas, useAo);
    this.disposeMesh(ch);
    const ox = ch.cx * CHUNK_W;
    const oz = ch.cz * CHUNK_W;
    if (built.idx.length) {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(built.pos, 3));
      g.setAttribute("normal", new THREE.BufferAttribute(built.nrm, 3));
      g.setAttribute("uv", new THREE.BufferAttribute(built.uv, 2));
      g.setAttribute("color", new THREE.BufferAttribute(built.col, 3));
      g.setIndex(new THREE.BufferAttribute(built.idx, 1));
      g.computeBoundingSphere();
      if (!g.boundingSphere || !Number.isFinite(g.boundingSphere.radius)) {
        g.boundingSphere = new THREE.Sphere(new THREE.Vector3(8, 48, 8), 64);
      }
      ch.mesh = new THREE.Mesh(g, this.solidMat);
      ch.mesh.position.set(ox, 0, oz);
      ch.mesh.castShadow = this.shadows;
      ch.mesh.receiveShadow = this.shadows;
      ch.mesh.matrixAutoUpdate = false;
      ch.mesh.updateMatrix();
      this.scene.add(ch.mesh);
    }
    if (built.tidx.length) {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(built.tpos, 3));
      g.setAttribute("normal", new THREE.BufferAttribute(built.tnrm, 3));
      g.setAttribute("uv", new THREE.BufferAttribute(built.tuv, 2));
      g.setAttribute("color", new THREE.BufferAttribute(built.tcol, 3));
      g.setIndex(new THREE.BufferAttribute(built.tidx, 1));
      ch.tmesh = new THREE.Mesh(g, this.cutoutMat);
      ch.tmesh.position.set(ox, 0, oz);
      ch.tmesh.matrixAutoUpdate = false;
      ch.tmesh.updateMatrix();
      this.scene.add(ch.tmesh);
    }
    if (built.fidx.length) {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(built.fpos, 3));
      g.setAttribute("normal", new THREE.BufferAttribute(built.fnrm, 3));
      g.setAttribute("uv", new THREE.BufferAttribute(built.fuv, 2));
      g.setAttribute("color", new THREE.BufferAttribute(built.fcol, 3));
      g.setIndex(new THREE.BufferAttribute(built.fidx, 1));
      ch.fmesh = new THREE.Mesh(g, this.fluidMat);
      ch.fmesh.position.set(ox, 0, oz);
      ch.fmesh.renderOrder = 2;
      ch.fmesh.matrixAutoUpdate = false;
      ch.fmesh.updateMatrix();
      this.scene.add(ch.fmesh);
    }
    ch.dirty = false;
  }

  private disposeMesh(ch: Chunk) {
    if (ch.mesh) {
      this.scene.remove(ch.mesh);
      ch.mesh.geometry.dispose();
      ch.mesh = undefined;
    }
    if (ch.tmesh) {
      this.scene.remove(ch.tmesh);
      ch.tmesh.geometry.dispose();
      ch.tmesh = undefined;
    }
    if (ch.fmesh) {
      this.scene.remove(ch.fmesh);
      ch.fmesh.geometry.dispose();
      ch.fmesh = undefined;
    }
  }

  private unload(ch: Chunk) {
    this.disposeMesh(ch);
  }

  collides(x: number, y: number, z: number, w: number, h: number, d: number): boolean {
    const minX = Math.floor(x);
    const maxX = Math.floor(x + w - 1e-6);
    const minY = Math.floor(y);
    const maxY = Math.floor(y + h - 1e-6);
    const minZ = Math.floor(z);
    const maxZ = Math.floor(z + d - 1e-6);
    for (let iy = minY; iy <= maxY; iy++) {
      for (let iz = minZ; iz <= maxZ; iz++) {
        for (let ix = minX; ix <= maxX; ix++) {
          const id = this.getBlock(ix, iy, iz);
          if (this.passable.has(`${ix},${iy},${iz}`)) continue;
          if (isSolid(id) && BLOCKS[id]?.shape !== "cross" && BLOCKS[id]?.shape !== "torch") return true;
        }
      }
    }
    return false;
  }

  highestSolid(x: number, z: number): number {
    for (let y = CHUNK_H - 1; y >= 0; y--) {
      if (isSolid(this.getBlock(Math.floor(x), y, Math.floor(z)))) return y;
    }
    return SEA();
  }

  /** First standable air cell (two empty blocks over solid), scanning from a preferred height so Nether roofs are ignored. */
  findStandY(x: number, z: number, prefer = 44): number {
    const ix = Math.floor(x);
    const iz = Math.floor(z);
    const open = (y: number) => {
      const here = this.getBlock(ix, y, iz);
      const above = this.getBlock(ix, y + 1, iz);
      return !isSolid(here) && !isSolid(above);
    };
    for (let y = prefer; y >= 2; y--) {
      if (isSolid(this.getBlock(ix, y - 1, iz)) && open(y)) return y;
    }
    for (let y = prefer; y < CHUNK_H - 3; y++) {
      if (isSolid(this.getBlock(ix, y - 1, iz)) && open(y)) return y;
    }
    return prefer;
  }

  isDanger(id: number): boolean {
    if (!id) return false;
    const b = BLOCKS[id];
    if (!b) return false;
    if (b.fluid) return true;
    return id === WATER || id === LAVA || id === FIRE || id === MAGMA || id === CACTUS;
  }

  isFoliage(id: number): boolean {
    if (!id) return false;
    const b = BLOCKS[id];
    if (!b) return false;
    const k = b.key ?? "";
    if (k.includes("leaves") || k.includes("vine") || k.includes("mushroom_block") || k.includes("wart_block")) return true;
    if (k.includes("log") || k.includes("stem") || k.includes("hyphae")) return true;
    if (b.cutout && b.category === "nature" && b.shape !== "cube") return true;
    return false;
  }

  hasOpenSky(x: number, y: number, z: number): boolean {
    const ix = Math.floor(x);
    const iz = Math.floor(z);
    const y0 = Math.floor(y);
    for (let iy = y0 + 2; iy < Math.min(CHUNK_H - 1, y0 + 18); iy++) {
      const id = this.getBlock(ix, iy, iz);
      if (isSolid(id) && !this.isFoliage(id)) return false;
    }
    return true;
  }

  isSafeStand(x: number, y: number, z: number, minY = SEA_LEVEL): boolean {
    const ix = Math.floor(x);
    const iz = Math.floor(z);
    const iy = Math.floor(y);
    const feet = this.getBlock(ix, iy, iz);
    const head = this.getBlock(ix, iy + 1, iz);
    const below = this.getBlock(ix, iy - 1, iz);
    if (isSolid(feet) || isSolid(head)) return false;
    if (this.isDanger(feet) || this.isDanger(head)) return false;
    if (!isSolid(below) || this.isDanger(below) || this.isFoliage(below)) return false;
    if (iy < minY) return false;
    return true;
  }

  /** Highest non-foliage solid with two air blocks and sky above — the real surface. */
  surfaceStandY(x: number, z: number, minY = 4): number {
    const ix = Math.floor(x);
    const iz = Math.floor(z);
    for (let y = CHUNK_H - 3; y >= minY; y--) {
      const below = this.getBlock(ix, y - 1, iz);
      if (!isSolid(below) || this.isDanger(below) || this.isFoliage(below)) continue;
      const feet = this.getBlock(ix, y, iz);
      const head = this.getBlock(ix, y + 1, iz);
      if (isSolid(feet) || isSolid(head) || this.isDanger(feet) || this.isDanger(head)) continue;
      if (!this.hasOpenSky(ix, y, iz)) continue;
      return y;
    }
    return -1;
  }

  findSafeSpawn(sx: number, sz: number, prefer = 56, minY = SEA_LEVEL): { x: number; y: number; z: number } {
    const ox = Math.floor(sx);
    const oz = Math.floor(sz);
    const tryCol = (x: number, z: number) => {
      const y = this.surfaceStandY(x + 0.5, z + 0.5, Math.max(2, minY - 4));
      if (y >= minY && this.isSafeStand(x + 0.5, y, z + 0.5, minY) && this.hasOpenSky(x + 0.5, y, z + 0.5)) {
        return { x: x + 0.5, y, z: z + 0.5 };
      }
      return null;
    };
    const first = tryCol(ox, oz);
    if (first) return first;
    for (let r = 1; r <= 48; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
          const hit = tryCol(ox + dx, oz + dz);
          if (hit) return hit;
        }
      }
    }
    // Last resort: flatten a grass pad above the column so the player is never inside a block or the void.
    let ground = SEA_LEVEL + 3;
    for (let y = CHUNK_H - 4; y >= 4; y--) {
      const id = this.getBlock(ox, y, oz);
      if (isSolid(id) && !this.isFoliage(id) && !this.isDanger(id)) {
        ground = y + 1;
        break;
      }
    }
    ground = Math.max(minY + 1, Math.min(CHUNK_H - 6, ground));
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const px = ox + dx;
        const pz = oz + dz;
        this.setBlock(px, ground - 1, pz, 1);
        this.setBlock(px, ground, pz, 0);
        this.setBlock(px, ground + 1, pz, 0);
        this.setBlock(px, ground + 2, pz, 0);
      }
    }
    return { x: ox + 0.5, y: ground, z: oz + 0.5 };
  }

  /** Drain dirty chunk meshes. Returns how many were rebuilt. */
  flushMeshes(useAo = true, max = 12): number {
    this.buildQueue = this.buildQueue.filter((c) => this.chunks.has(chunkKey(c.dim, c.cx, c.cz)) && c.dirty);
    for (const ch of this.chunks.values()) {
      if (ch.dirty && !this.buildQueue.includes(ch)) this.buildQueue.push(ch);
    }
    this.buildQueue.sort((a, b) => {
      const da = (a.cx + 0.5) * CHUNK_W - this.lastPlayer.x;
      const db = (b.cx + 0.5) * CHUNK_W - this.lastPlayer.x;
      const za = (a.cz + 0.5) * CHUNK_W - this.lastPlayer.z;
      const zb = (b.cz + 0.5) * CHUNK_W - this.lastPlayer.z;
      return da * da + za * za - (db * db + zb * zb);
    });
    let n = 0;
    while (this.buildQueue.length && n < max) {
      const ch = this.buildQueue.shift()!;
      if (!this.chunks.has(chunkKey(ch.dim, ch.cx, ch.cz))) continue;
      this.rebuild(ch, useAo);
      n++;
    }
    return n;
  }

  chunkMeshedAt(x: number, z: number): boolean {
    const ch = this.getChunk(worldToChunk(x), worldToChunk(z));
    return !!ch && !ch.dirty;
  }

  dispose() {
    for (const ch of this.chunks.values()) this.unload(ch);
    this.chunks.clear();
    this.solidMat.dispose();
    this.cutoutMat.dispose();
    this.fluidMat.dispose();
  }
}

function SEA() {
  return 44;
}
