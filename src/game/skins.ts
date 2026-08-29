export const SKIN_PRESETS = [
  { id: "steve", name: "Miner", shirt: "#3a78c8", pants: "#3a4a8a", skin: "#e0c090", hair: "#3a2a18" },
  { id: "alex", name: "Alexis", shirt: "#6aaa3a", pants: "#6b4a28", skin: "#f0c8a0", hair: "#d87828" },
  { id: "noor", name: "Noor", shirt: "#c45c4a", pants: "#2a2a32", skin: "#8a5530", hair: "#1a1a14" },
  { id: "sunny", name: "Sunny", shirt: "#e0a018", pants: "#3a6a8a", skin: "#f0d0a8", hair: "#6b3a18" },
  { id: "ari", name: "Ari", shirt: "#7a48a8", pants: "#2a2a32", skin: "#c89060", hair: "#2a1a10" },
  { id: "zuri", name: "Zuri", shirt: "#2a8a7a", pants: "#3a2a28", skin: "#6b3a20", hair: "#1a0a08" },
  { id: "pale", name: "Pale", shirt: "#3a3a42", pants: "#1a1a1e", skin: "#e8e0d0", hair: "#f0f0e8" },
] as const;

export interface SkinData {
  id: string;
  name: string;
  shirt: string;
  pants: string;
  skin: string;
  hair: string;
  pixels?: string;
}

export function skinToJSON(s: SkinData): string {
  return JSON.stringify(s);
}

export function skinFromJSON(raw: string): SkinData | null {
  try {
    const o = JSON.parse(raw) as SkinData;
    if (!o || typeof o.shirt !== "string") return null;
    return o;
  } catch {
    return null;
  }
}

export function loadCustomSkins(): SkinData[] {
  try {
    const raw = localStorage.getItem("moc.skins.v1");
    return raw ? (JSON.parse(raw) as SkinData[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomSkins(list: SkinData[]) {
  try {
    localStorage.setItem("moc.skins.v1", JSON.stringify(list));
  } catch {
    /* */
  }
}
