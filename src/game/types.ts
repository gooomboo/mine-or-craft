export const CHUNK_W = 16;
export const CHUNK_H = 96;
export const SEA_LEVEL = 42;
export const WORLD_MIN_Y = 0;
export const WORLD_MAX_Y = CHUNK_H - 1;

export type Dim = "overworld" | "nether" | "end";
export type GameMode = "survival" | "creative" | "hardcore";
export type ToolType = "none" | "pickaxe" | "axe" | "shovel" | "hoe" | "shears" | "sword";
export type BlockShape = "cube" | "cross" | "fluid" | "torch" | "slab" | "pane";
export type GraphicsPreset = "fast" | "fancy" | "fabulous";
export type CameraMode = "first" | "third" | "front";
export type Difficulty = "peaceful" | "easy" | "normal" | "hard";
export type CrosshairStyle = "cross" | "dot" | "circle" | "off";

export type Slot = { id: number; count: number } | null;

export interface BlockDef {
  id: number;
  key: string;
  name: string;
  solid: boolean;
  replaceable: boolean;
  transparent: boolean;
  cutout: boolean;
  fluid: 0 | 1 | 2;
  shape: BlockShape;
  hardness: number;
  tool: ToolType;
  harvestLevel: number;
  tex: number;
  texTop: number;
  texBottom: number;
  tint: number;
  tintTop: number;
  light: number;
  flammable: boolean;
  gravity: boolean;
  drops: number;
  dropCount: number;
  category: string;
  stack: number;
}

export interface ItemDef {
  id: number;
  key: string;
  name: string;
  stack: number;
  tool?: ToolType;
  harvestLevel?: number;
  durability?: number;
  damage?: number;
  armor?: number;
  slot?: "head" | "chest" | "legs" | "feet" | "offhand";
  food?: number;
  place?: number;
  icon: number;
  tint: number;
}

export interface Recipe {
  out: number;
  count: number;
  shaped?: (number | 0)[];
  shapeless?: number[];
  table?: boolean;
}

export interface WorldMeta {
  version: number;
  id: string;
  name: string;
  seed: number;
  mode: GameMode;
  cheats: boolean;
  created: number;
  played: number;
  spawn: { x: number; y: number; z: number };
  published?: boolean;
  priceXp?: number;
  code?: string;
  arena?: "duel";
}

export interface PlayerSave {
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  dim: Dim;
  health: number;
  hunger: number;
  xp: number;
  xpLevel: number;
  flying: boolean;
  inventory: Slot[];
  armor: Slot[];
  offhand: Slot;
  hotbar: number;
  time: number;
  weather: number;
  killedDragon: boolean;
  advancements: string[];
}

export interface Settings {
  renderDistance: number;
  fov: number;
  mouseSens: number;
  invertY: boolean;
  invertX: boolean;
  volumeMaster: number;
  volumeSfx: number;
  volumeMusic: number;
  volumeAmbient: number;
  particles: boolean;
  clouds: boolean;
  shadows: boolean;
  ao: boolean;
  fancyWater: boolean;
  fancyLeaves: boolean;
  vsync: boolean;
  showFps: boolean;
  showCoords: boolean;
  showBiome: boolean;
  autoJump: boolean;
  viewBob: boolean;
  handBob: boolean;
  touchSize: number;
  touchLookSens: number;
  graphics: GraphicsPreset;
  chatOpacity: number;
  brightness: number;
  contrast: number;
  pixelRatioCap: number;
  maxFps: number;
  antialias: boolean;
  fog: boolean;
  stars: boolean;
  sunMoon: boolean;
  weatherFx: boolean;
  vignette: boolean;
  cameraMode: CameraMode;
  screenShake: number;
  sneakToggle: boolean;
  sprintToggle: boolean;
  difficulty: Difficulty;
  autoSave: number;
  reducedMotion: boolean;
  crosshair: CrosshairStyle;
  blockOutline: boolean;
  heldItem: boolean;
  guiScale: number;
  subtitles: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  renderDistance: 4,
  fov: 75,
  mouseSens: 0.22,
  invertY: false,
  invertX: false,
  volumeMaster: 0.8,
  volumeSfx: 0.9,
  volumeMusic: 0.45,
  volumeAmbient: 0.35,
  particles: true,
  clouds: true,
  shadows: false,
  ao: true,
  fancyWater: true,
  fancyLeaves: true,
  vsync: true,
  showFps: false,
  showCoords: false,
  showBiome: true,
  autoJump: false,
  viewBob: true,
  handBob: true,
  touchSize: 1,
  touchLookSens: 1,
  graphics: "fancy",
  chatOpacity: 0.85,
  brightness: 1,
  contrast: 1,
  pixelRatioCap: 1.5,
  maxFps: 0,
  antialias: true,
  fog: true,
  stars: true,
  sunMoon: true,
  weatherFx: true,
  vignette: true,
  cameraMode: "first",
  screenShake: 0.55,
  sneakToggle: false,
  sprintToggle: false,
  difficulty: "normal",
  autoSave: 8,
  reducedMotion: false,
  crosshair: "cross",
  blockOutline: true,
  heldItem: true,
  guiScale: 1,
  subtitles: false,
};

export function chunkKey(dim: Dim, cx: number, cz: number): string {
  return `${dim}:${cx}:${cz}`;
}

export function worldToChunk(v: number): number {
  return Math.floor(v / CHUNK_W);
}

export function localCoord(v: number): number {
  return ((v % CHUNK_W) + CHUNK_W) % CHUNK_W;
}
