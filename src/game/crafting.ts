import { BLOCKS, CRAFTING_TABLE, OAK_PLANKS } from "./blocks";
import { RECIPES, SMELT, STICK, getDef, maxStack } from "./items";
import type { Recipe, Slot } from "./types";

function counts(slots: Slot[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const s of slots) {
    if (!s) continue;
    m.set(s.id, (m.get(s.id) ?? 0) + s.count);
  }
  return m;
}

export function isLogItem(id: number) {
  const k = BLOCKS[id]?.key ?? "";
  return k.includes("log") || k.includes("_stem");
}

function sameIng(need: number, have: number) {
  if (need === have) return true;
  if (isLogItem(need) && isLogItem(have)) return true;
  if (need === OAK_PLANKS && (BLOCKS[have]?.key ?? "").includes("plank")) return true;
  return false;
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
      const used = new Set<number>();
      let ok = r.shapeless.length === cells.filter((id) => id > 0).length;
      if (ok) {
        for (const [id, c] of need) {
          let got = 0;
          for (let i = 0; i < cells.length; i++) {
            if (used.has(i)) continue;
            if (sameIng(id, cells[i] ?? 0)) {
              used.add(i);
              got++;
            }
          }
          if (got !== c) ok = false;
        }
      }
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
            if (want === 0) {
              if (got !== 0) ok = false;
            } else if (!sameIng(want, got)) ok = false;
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

export function dumpGrid(inv: Slot[], grid: Slot[]) {
  for (let i = 0; i < grid.length; i++) {
    if (!grid[i]) continue;
    mergeInto(inv, grid[i]);
    grid[i] = null;
  }
}

export function recipeIngredients(r: Recipe): { id: number; count: number }[] {
  const m = new Map<number, number>();
  if (r.shapeless) for (const id of r.shapeless) m.set(id, (m.get(id) ?? 0) + 1);
  else if (r.shaped) for (const id of r.shaped) if (id) m.set(id, (m.get(id) ?? 0) + 1);
  return [...m].map(([id, count]) => ({ id, count }));
}

export function hasIngredients(inv: Slot[], r: Recipe): boolean {
  const have = counts(inv);
  for (const { id, count } of recipeIngredients(r)) {
    let n = 0;
    for (const [hid, c] of have) if (sameIng(id, hid)) n += c;
    if (n < count) return false;
  }
  return true;
}

function pullInv(inv: Slot[], id: number): number {
  for (let i = 0; i < inv.length; i++) {
    const s = inv[i];
    if (!s || !sameIng(id, s.id)) continue;
    const got = s.id;
    s.count--;
    if (s.count <= 0) inv[i] = null;
    return got;
  }
  return 0;
}

export function fillGridFromRecipe(inv: Slot[], grid: Slot[], r: Recipe, n: number): boolean {
  if (!hasIngredients(inv, r)) return false;
  dumpGrid(inv, grid);
  if (r.shapeless) {
    for (let i = 0; i < r.shapeless.length && i < n * n; i++) {
      const got = pullInv(inv, r.shapeless[i]!);
      if (!got) return false;
      grid[i] = { id: got, count: 1 };
    }
    return true;
  }
  if (!r.shaped) return false;
  const dim = r.shaped.length > 4 ? 3 : 2;
  if (dim === 3 && n === 2) return false;
  for (let y = 0; y < dim; y++) {
    for (let x = 0; x < dim; x++) {
      const want = r.shaped[y * dim + x] ?? 0;
      if (!want) continue;
      const got = pullInv(inv, want);
      if (!got) return false;
      grid[y * n + x] = { id: got, count: 1 };
    }
  }
  return true;
}

/** One entry per output so the book is not nine "oak log → planks" rows. */
export function bookRecipes(table: boolean): Recipe[] {
  const seen = new Set<number>();
  const out: Recipe[] = [];
  for (const r of RECIPES) {
    if (r.table && !table) continue;
    if (r.shaped && r.shaped.length > 4 && !table) continue;
    if (seen.has(r.out)) continue;
    seen.add(r.out);
    out.push(r);
  }
  return out;
}

void getDef;
void CRAFTING_TABLE;
void STICK;
