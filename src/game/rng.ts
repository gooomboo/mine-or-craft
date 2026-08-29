export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash2(x: number, z: number, seed: number): number {
  let h = seed | 0;
  h = Math.imul(h ^ Math.imul(x | 0, 374761393), 668265263);
  h = Math.imul(h ^ Math.imul(z | 0, 668265263), 374761393);
  h = (h ^ (h >>> 13)) | 0;
  return (h >>> 0) / 4294967296;
}

export function hash3(x: number, y: number, z: number, seed: number): number {
  let h = seed | 0;
  h = Math.imul(h ^ Math.imul(x | 0, 374761393), 668265263);
  h = Math.imul(h ^ Math.imul(y | 0, 1274126177), 374761393);
  h = Math.imul(h ^ Math.imul(z | 0, 668265263), 1274126177);
  h = (h ^ (h >>> 13)) | 0;
  return (h >>> 0) / 4294967296;
}

export function mixSeed(seed: number, salt: number): number {
  return (Math.imul(seed ^ salt, 1597334677) ^ (seed >>> 16)) >>> 0;
}
