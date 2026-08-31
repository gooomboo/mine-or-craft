import { BLOCKS, isOpaque, isSolid } from "./blocks";
import type { Atlas } from "./atlas";
import { CHUNK_H, CHUNK_W } from "./types";

const DX = [1, -1, 0, 0, 0, 0];
const DY = [0, 0, 1, -1, 0, 0];
const DZ = [0, 0, 0, 0, 1, -1];

function idx(x: number, y: number, z: number) {
  return x + z * CHUNK_W + y * CHUNK_W * CHUNK_W;
}

function tintRGB(t: number): [number, number, number] {
  return [((t >> 16) & 255) / 255, ((t >> 8) & 255) / 255, (t & 255) / 255];
}

export interface MeshBuild {
  pos: Float32Array;
  nrm: Float32Array;
  uv: Float32Array;
  col: Float32Array;
  idx: Uint32Array;
  tpos: Float32Array;
  tnrm: Float32Array;
  tuv: Float32Array;
  tcol: Float32Array;
  tidx: Uint32Array;
  fpos: Float32Array;
  fnrm: Float32Array;
  fuv: Float32Array;
  fcol: Float32Array;
  fidx: Uint32Array;
}

function aoValue(n1: boolean, n2: boolean, corner: boolean): number {
  if (n1 && n2) return 0.52;
  return 1 - [n1, n2, corner].filter(Boolean).length * 0.16;
}

export function meshChunk(
  blocks: Uint16Array,
  neighbors: { px?: Uint16Array; nx?: Uint16Array; pz?: Uint16Array; nz?: Uint16Array },
  atlas: Atlas,
  useAo: boolean,
): MeshBuild {
  const P: number[] = [];
  const N: number[] = [];
  const U: number[] = [];
  const C: number[] = [];
  const I: number[] = [];
  const tP: number[] = [];
  const tN: number[] = [];
  const tU: number[] = [];
  const tC: number[] = [];
  const tI: number[] = [];
  const fP: number[] = [];
  const fN: number[] = [];
  const fU: number[] = [];
  const fC: number[] = [];
  const fI: number[] = [];

  const sample = (x: number, y: number, z: number): number => {
    if (y < 0 || y >= CHUNK_H) return y < 0 ? 4 : 0;
    if (x >= 0 && x < CHUNK_W && z >= 0 && z < CHUNK_W) return blocks[idx(x, y, z)]!;
    if (x >= CHUNK_W) return neighbors.px ? neighbors.px[idx(0, y, z)]! : -1;
    if (x < 0) return neighbors.nx ? neighbors.nx[idx(CHUNK_W - 1, y, z)]! : -1;
    if (z >= CHUNK_W) return neighbors.pz ? neighbors.pz[idx(x, y, 0)]! : -1;
    if (z < 0) return neighbors.nz ? neighbors.nz[idx(x, y, CHUNK_W - 1)]! : -1;
    return 0;
  };

  const solidAt = (x: number, y: number, z: number) => isSolid(sample(x, y, z));

  for (let y = 0; y < CHUNK_H; y++) {
    for (let z = 0; z < CHUNK_W; z++) {
      for (let x = 0; x < CHUNK_W; x++) {
        const id = blocks[idx(x, y, z)]!;
        if (id === 0) continue;
        const def = BLOCKS[id];
        if (!def) continue;
        const isFluid = def.fluid > 0;
        const trans = def.transparent || def.cutout || def.shape === "cross" || def.shape === "torch";

        if (def.shape === "cross" || def.shape === "torch") {
          emitCross(id, x, y, z, atlas, tP, tN, tU, tC, tI, def.tint);
          continue;
        }

        for (let f = 0; f < 6; f++) {
          const nx = x + DX[f]!, ny = y + DY[f]!, nz = z + DZ[f]!;
          const nid = sample(nx, ny, nz);
          if (nid < 0) continue;
          const nd = BLOCKS[nid];
          const hide = nd && isOpaque(nid) && !isFluid && def.shape === "cube";
          const sameFluid = isFluid && nd && nd.fluid === def.fluid;
          if (hide || sameFluid) continue;
          if (isFluid && nid !== 0 && isSolid(nid) && f !== 2) continue;

          const face: 0 | 1 | 2 = f === 2 ? 1 : f === 3 ? 2 : 0;
          const tile = atlas.tileOf(id, face);
          const uv = atlas.uv(tile);
          const tint = face === 1 ? def.tintTop : def.tint;
          const [tr, tg, tb] = tintRGB(tint);
          const shade = f === 2 ? 1 : f === 3 ? 0.52 : f < 2 ? 0.7 : 0.82;
          let ao00 = 1, ao10 = 1, ao11 = 1, ao01 = 1;
          if (useAo && def.solid && !isFluid) {
            const sx = DX[f]!, sy = DY[f]!, sz = DZ[f]!;
            const ux = sy !== 0 ? 1 : 0;
            const uy = sy === 0 ? 1 : 0;
            const uz = 0;
            const vx = sx !== 0 ? 0 : sy !== 0 ? 0 : 1;
            const vy = 0;
            const vz = sz !== 0 ? 0 : 1;
            const s = (ox: number, oy: number, oz: number) => solidAt(x + sx + ox, y + sy + oy, z + sz + oz);
            ao00 = aoValue(s(-ux, -uy, -uz), s(-vx, -vy, -vz), s(-ux - vx, -uy - vy, -uz - vz));
            ao10 = aoValue(s(ux, uy, uz), s(-vx, -vy, -vz), s(ux - vx, uy - vy, uz - vz));
            ao11 = aoValue(s(ux, uy, uz), s(vx, vy, vz), s(ux + vx, uy + vy, uz + vz));
            ao01 = aoValue(s(-ux, -uy, -uz), s(vx, vy, vz), s(-ux + vx, -uy + vy, -uz + vz));
          }

          const yOff = isFluid && f === 2 && !isOpaque(nid) ? 0.14 : 0;
          const destP = isFluid ? fP : trans ? tP : P;
          const destN = isFluid ? fN : trans ? tN : N;
          const destU = isFluid ? fU : trans ? tU : U;
          const destC = isFluid ? fC : trans ? tC : C;
          const destI = isFluid ? fI : trans ? tI : I;
          emitFace(
            f, x, y - (def.shape === "slab" ? 0.5 : 0), z, yOff,
            uv, tr, tg, tb, shade, ao00, ao10, ao11, ao01,
            destP, destN, destU, destC, destI,
            def.shape === "slab" ? 0.5 : 1,
          );
        }
      }
    }
  }

  return {
    pos: new Float32Array(P),
    nrm: new Float32Array(N),
    uv: new Float32Array(U),
    col: new Float32Array(C),
    idx: new Uint32Array(I),
    tpos: new Float32Array(tP),
    tnrm: new Float32Array(tN),
    tuv: new Float32Array(tU),
    tcol: new Float32Array(tC),
    tidx: new Uint32Array(tI),
    fpos: new Float32Array(fP),
    fnrm: new Float32Array(fN),
    fuv: new Float32Array(fU),
    fcol: new Float32Array(fC),
    fidx: new Uint32Array(fI),
  };
}

function emitFace(
  f: number,
  x: number,
  y: number,
  z: number,
  yOff: number,
  uv: { u0: number; v0: number; u1: number; v1: number },
  tr: number, tg: number, tb: number, shade: number,
  ao00: number, ao10: number, ao11: number, ao01: number,
  P: number[], N: number[], U: number[], C: number[], I: number[],
  h = 1,
) {
  let mapped: [number, number, number][];
  let nx = 0, ny = 0, nz = 0;
  if (f === 0) {
    mapped = [[1, 0, 1], [1, 0, 0], [1, h, 0], [1, h, 1]];
    nx = 1;
  } else if (f === 1) {
    mapped = [[0, 0, 0], [0, 0, 1], [0, h, 1], [0, h, 0]];
    nx = -1;
  } else if (f === 2) {
    mapped = [[0, h - yOff, 1], [1, h - yOff, 1], [1, h - yOff, 0], [0, h - yOff, 0]];
    ny = 1;
  } else if (f === 3) {
    mapped = [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]];
    ny = -1;
  } else if (f === 4) {
    mapped = [[0, 0, 1], [1, 0, 1], [1, h, 1], [0, h, 1]];
    nz = 1;
  } else {
    mapped = [[1, 0, 0], [0, 0, 0], [0, h, 0], [1, h, 0]];
    nz = -1;
  }
  const base = P.length / 3;
  const aos = [ao00, ao10, ao11, ao01];
  const uvs: [number, number][] = [
    [uv.u0, uv.v0], [uv.u1, uv.v0], [uv.u1, uv.v1], [uv.u0, uv.v1],
  ];
  for (let i = 0; i < 4; i++) {
    const v = mapped[i]!;
    P.push(x + v[0], y + v[1], z + v[2]);
    N.push(nx, ny, nz);
    U.push(uvs[i]![0], uvs[i]![1]);
    const a = aos[i]! * shade;
    C.push(tr * a, tg * a, tb * a);
  }
  const flip = ao00 + ao11 < ao10 + ao01;
  if (flip) I.push(base, base + 1, base + 2, base, base + 2, base + 3);
  else I.push(base + 1, base + 2, base + 3, base + 1, base + 3, base);
}

function emitCross(
  id: number,
  x: number,
  y: number,
  z: number,
  atlas: Atlas,
  P: number[], N: number[], U: number[], C: number[], I: number[],
  tint: number,
) {
  const uv = atlas.uv(atlas.tileOf(id, 0));
  const [tr, tg, tb] = tintRGB(tint);
  const quads: number[][] = [
    [x + 0.05, y, z + 0.05, x + 0.95, y, z + 0.95, x + 0.95, y + 1, z + 0.95, x + 0.05, y + 1, z + 0.05],
    [x + 0.95, y, z + 0.05, x + 0.05, y, z + 0.95, x + 0.05, y + 1, z + 0.95, x + 0.95, y + 1, z + 0.05],
  ];
  for (const q of quads) {
    const base = P.length / 3;
    const pts = [
      [q[0], q[1], q[2]],
      [q[3], q[4], q[5]],
      [q[6], q[7], q[8]],
      [q[9], q[10], q[11]],
    ];
    const uvs = [[uv.u0, uv.v0], [uv.u1, uv.v0], [uv.u1, uv.v1], [uv.u0, uv.v1]];
    for (let i = 0; i < 4; i++) {
      P.push(pts[i]![0]!, pts[i]![1]!, pts[i]![2]!);
      N.push(0, 1, 0);
      U.push(uvs[i]![0]!, uvs[i]![1]!);
      C.push(tr, tg, tb);
    }
    I.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
}
