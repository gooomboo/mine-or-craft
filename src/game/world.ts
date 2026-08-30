import * as THREE from "three";
import type { Atlas } from "./atlas";
import { BLOCKS, isSolid } from "./blocks";
import { generateChunk, makeNoises, type ChunkData, type Noises } from "./gen";
import { meshChunk } from "./mesher";
import { CHUNK_H, CHUNK_W, chunkKey, worldToChunk, localCoord, type Dim } from "./types";

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
  arena: "duel" | null = null;

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
    while (this.buildQueue.length && performance.now() - t0 < budgetMs && n < 3) {
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
