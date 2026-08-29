import { RECIPES, SMELT, getDef, maxStack } from "./items";
import type { Recipe, Slot } from "./types";

function counts(slots: Slot[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const s of slots) {
    if (!s) continue;
    m.set(s.id, (m.get(s.id) ?? 0) + s.count);
  }
  return m;
}

export function matchRecipe(grid: Slot[], table: boolean): { recipe: Recipe; out: { id: number; count: number } } | null {
  const n = table ? 3 : 2;
  const cells: number[] = [];
  for (let i = 0; i < n * n; i++) cells.push(grid[i]?.id ?? 0);

  for (const r of RECIPES) {
    if (r.table && !table) continue;
    if (r.shapeless) {
      const need = new Map<number, number>();
      for (const id of r.shapeless) need.set(id, (need.get(id) ?? 0) + 1);
      const have = counts(grid.slice(0, n * n).map((s) => (s ? { id: s.id, count: 1 } : null)));
      let ok = true;
      if (have.size !== need.size) ok = false;
      else for (const [id, c] of need) if ((have.get(id) ?? 0) !== c) ok = false;
      if (ok) return { recipe: r, out: { id: r.out, count: r.count } };
      continue;
    }
    if (!r.shaped) continue;
    const pat = r.shaped;
    const dim = pat.length > 4 ? 3 : 2;
    if (dim === 3 && n === 2) continue;
    const pw = dim;
    for (let oy = 0; oy <= n - pw; oy++) {
      for (let ox = 0; ox <= n - pw; ox++) {
        let ok = true;
        for (let y = 0; y < n; y++) {
          for (let x = 0; x < n; x++) {
            const inPat = x >= ox && x < ox + pw && y >= oy && y < oy + pw;
            const want = inPat ? (pat[(y - oy) * pw + (x - ox)] ?? 0) : 0;
            const got = cells[y * n + x] ?? 0;
            if (want !== got) ok = false;
          }
        }
        if (ok) return { recipe: r, out: { id: r.out, count: r.count } };
      }
    }
  }
  return null;
}

export function consumeGrid(grid: Slot[], n: number) {
  for (let i = 0; i < n * n; i++) {
    const s = grid[i];
    if (!s) continue;
    s.count--;
    if (s.count <= 0) grid[i] = null;
  }
}

export function trySmelt(id: number) {
  return SMELT[id] ?? null;
}

export function mergeInto(inv: Slot[], item: Slot): boolean {
  if (!item) return true;
  const max = maxStack(item.id);
  for (const s of inv) {
    if (s && s.id === item.id && s.count < max) {
      const add = Math.min(max - s.count, item.count);
      s.count += add;
      item.count -= add;
      if (item.count <= 0) return true;
    }
  }
  for (let i = 0; i < inv.length; i++) {
    if (!inv[i]) {
      inv[i] = { id: item.id, count: item.count };
      return true;
    }
  }
  return item.count <= 0;
}

void getDef;
