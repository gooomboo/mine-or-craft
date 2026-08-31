import { create } from "zustand";
import { DEFAULT_SETTINGS, type CameraMode, type CrosshairStyle, type GameMode, type Settings, type Slot, type WorldMeta } from "@/game/types";
import { loadProfile, loadSession, loadSettingsRaw, loadWorlds, persistAccountProfile, saveProfile, saveSettingsRaw, saveWorlds, type Profile } from "@/game/save";

export type Phase = "login" | "title" | "menu" | "playhub" | "worlds" | "create" | "lobby" | "skins" | "minigames" | "workshop" | "friends" | "market" | "lab" | "loading" | "playing";
export type Overlay =
  | "none"
  | "pause"
  | "inventory"
  | "crafting"
  | "furnace"
  | "settings"
  | "chat"
  | "dead"
  | "credits"
  | "advancements"
  | "locked"
  | "studio"
  | "storm";

export interface HudSnap {
  health: number;
  hunger: number;
  xp: number;
  xpLevel: number;
  air: number;
  hotbar: number;
  inventory: Slot[];
  armor: Slot[];
  offhand: Slot;
  selectedName: string;
  fps: number;
  x: number;
  y: number;
  z: number;
  biome: string;
  time: number;
  dim: string;
  mode: GameMode;
  targeting: string;
  boss?: { name: string; hp: number; max: number };
  wraith: boolean;
  chat: string[];
  toast: string;
  hurt: number;
  underwater: boolean;
  portal: number;
  mining: number;
  cameraMode: CameraMode;
  crosshair: CrosshairStyle;
  attackCd: number;
  absorption: number;
  arena?: string;
  kills: number;
  dualLevel?: number;
  hitFlash?: number;
  blocking?: boolean;
}

interface AppState {
  phase: Phase;
  overlay: Overlay;
  profile: Profile;
  settings: Settings;
  worlds: WorldMeta[];
  active: WorldMeta | null;
  hud: HudSnap | null;
  loadingMsg: string;
  loadingPct: number;
  joinCode: string;
  multiplayer: boolean;
  isHost: boolean;
  peers: { id: string; name: string }[];
  pointerWanted: boolean;
  setPhase: (p: Phase) => void;
  setOverlay: (o: Overlay) => void;
  setHud: (h: HudSnap) => void;
  setLoading: (m: string, pct?: number) => void;
  setActive: (w: WorldMeta | null) => void;
  refreshWorlds: () => void;
  upsertWorld: (w: WorldMeta) => void;
  setProfile: (p: Partial<Profile>) => void;
  setSettings: (s: Partial<Settings>) => void;
  setJoinCode: (c: string) => void;
  setNet: (v: Partial<Pick<AppState, "multiplayer" | "isHost" | "peers">>) => void;
  setPointerWanted: (v: boolean) => void;
}

function readSettings(): Settings {
  try {
    const raw = loadSettingsRaw();
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export const useApp = create<AppState>((set, get) => ({
  phase: loadSession() ? "title" : "login",
  overlay: "none",
  profile: loadProfile(),
  settings: readSettings(),
  worlds: loadWorlds(),
  active: null,
  hud: null,
  loadingMsg: "Shaping terrain…",
  loadingPct: 0,
  joinCode: "",
  multiplayer: false,
  isHost: true,
  peers: [],
  pointerWanted: false,
  setPhase: (phase) => set({ phase }),
  setOverlay: (overlay) => set({ overlay }),
  setHud: (hud) => set({ hud }),
  setLoading: (loadingMsg, loadingPct) =>
    set({ loadingMsg, loadingPct: loadingPct ?? get().loadingPct }),
  setActive: (active) => set({ active }),
  refreshWorlds: () => set({ worlds: loadWorlds() }),
  upsertWorld: (w) => {
    const list = loadWorlds();
    const i = list.findIndex((x) => x.id === w.id);
    if (i >= 0) list[i] = w;
    else list.unshift(w);
    saveWorlds(list);
    set({ worlds: list, active: w });
  },
  setProfile: (p) => {
    const profile = { ...get().profile, ...p };
    saveProfile(profile);
    persistAccountProfile(profile);
    set({ profile });
  },
  setSettings: (s) => {
    const settings = { ...get().settings, ...s };
    saveSettingsRaw(JSON.stringify(settings));
    set({ settings });
  },
  setJoinCode: (joinCode) => set({ joinCode }),
  setNet: (v) => set(v),
  setPointerWanted: (pointerWanted) => set({ pointerWanted }),
}));
