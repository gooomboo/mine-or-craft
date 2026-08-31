import * as THREE from "three";
import { animateAtlas, getSharedAtlas, type Atlas } from "./atlas";
import { BLOCKS, BY_KEY, COMMAND_BLOCK, CRAFTING_TABLE, END_PORTAL, FIRE, FURNACE, LAVA, NETHER_PORTAL, OBSIDIAN, TNT, WATER, isFluid, isSolid, registerCustomBlock } from "./blocks";
import { GameAudio } from "./audio";
import { findSpawn, strongholdChunk, biomeAtIndex } from "./gen";
import { Input } from "./input";
import {
  getDef,
  FLINT_STEEL,
  ITEM_BASE,
  DIAMOND_SWORD,
  SHIELD,
  GOLDEN_APPLE,
  BOW,
  ARROW,
  ENDER_PEARL,
  COOKED_BEEF,
  DIAMOND_HELM,
  DIAMOND_CHEST,
  DIAMOND_LEGS,
  DIAMOND_BOOTS,
  IRON_SWORD,
  STONE_SWORD,
  STONE_AXE,
  SHEARS,
  IRON_HELM,
  IRON_CHEST,
  IRON_LEGS,
  IRON_BOOTS,
  LEATHER_HELM,
  LEATHER_CHEST,
  LEATHER_LEGS,
  LEATHER_BOOTS,
  WOOD_PICK,
  IRON_PICK,
  EYE_OF_ENDER,
  isBoatItem,
  MINECART,
  isPotionItem,
  POTION_NIGHT,
  POTION_SPEED,
  POTION_FIRE,
  POTION_HEAL,
  POTION_STRENGTH,
  POTION_WATER,
  POTION_LEAP,
  POTION_REGEN,
  POTION_INVIS,
  SPLASH_HARM,
  CHORUS_FRUIT,
  MACE,
  WIND_CHARGE,
  BUCKET,
  FIREWORK,
  CROSSBOW,
} from "./items";
import { ARENA_BOT, ARENA_SPAWN, duelStats, isArena } from "./arenas";
import { ADV_BY_ID, ADVANCEMENTS } from "./advancements";
import { disposeMob, hitMob, spawnMob, trySpawn, updateMobs, type Mob, type MobKind } from "./mobs";
import { addHeld, addSkinnedHumanoid, buildViewArm, fillHeld, heldKind, makeBoatMesh, makeCartMesh, swingLimbs } from "./models";
import { resolveSkin } from "./skins";
import { Player } from "./player";
import { voxelRay } from "./raycast";
import { saveChunks, savePlayer } from "./save";
import { CHUNK_W, SEA_LEVEL, type Dim, type GameMode, type PlayerSave, type Settings, type WorldMeta } from "./types";
import { World } from "./world";
import { useApp, type HudSnap, type Overlay } from "@/store/app-store";
import {
  applyLamps,
  blockKind,
  collectPowerSources,
  isRail,
  isTnt,
  posKey,
  propagateDust,
  pushPiston,
} from "./mechanics";

const DAY_LEN = 1200;

export interface EngineHooks {
  onHud: (h: HudSnap) => void;
  onOverlay: (o: Overlay) => void;
  onDeath: () => void;
  onWin: () => void;
  onToast: (m: string) => void;
  onProgress?: (msg: string, pct: number) => void;
}

export class Engine {
  canvas: HTMLCanvasElement;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  sun: THREE.DirectionalLight;
  hemi: THREE.HemisphereLight;
  fog: THREE.FogExp2;
  atlas: Atlas;
  world: World;
  player: Player;
  input: Input;
  audio: GameAudio;
  meta: WorldMeta;
  settings: Settings;
  running = false;
  paused = false;
  overlay: Overlay = "none";
  time = 0;
  worldTime = 0;
  weather = 0;
  acc = 0;
  last = 0;
  raf = 0;
  fps = 0;
  frames = 0;
  fpsT = 0;
  highlight: THREE.LineSegments;
  hand: THREE.Group;
  lamp: THREE.PointLight;
  clouds: THREE.Group;
  particles: THREE.Points;
  particleGeo: THREE.BufferGeometry;
  particleAges: number[] = [];
  mobs: Mob[] = [];
  spawnTimer = 0;
  fluidTimer = 0;
  fireTimer = 0;
  gravTimer = 0;
  playXpT = 0;
  playXpBatch = 0;
  scriptScore = 0;
  labCheck: { x: number; y: number; z: number } | null = null;
  modScripts: { when: string; every: number; do: { op: string; id?: number; count?: number; text?: string; kind?: string; value?: number }[]; t: number }[] = [];
  customSounds: { name: string; dataUrl: string }[] = [];
  labHurtLatch = false;
  labSneak = false;
  labSprint = false;
  labSwim = false;
  studio = { fly: false, god: false, fullbright: false, speed: false, freeze: false, hitboxes: false };
  saveTimer = 0;
  ready = false;
  afk = 0;
  wraith: Mob | null = null;
  dragon: Mob | null = null;
  storm: Mob | null = null;
  killedDragon = false;
  killedStorm = false;
  endPortalPlaced = false;
  chat: string[] = [];
  toast = "";
  toastT = 0;
  targeting = "";
  portalT = 0;
  dim: Dim = "overworld";
  rain: THREE.Points | null = null;
  hooks: EngineHooks;
  stars: THREE.Points;
  sky: THREE.Mesh;
  camOffset = new THREE.Vector3();
  moveF = new THREE.Vector3();
  camPunch = 0;
  wasOnGround = true;
  dualKills = 0;
  dualLevel = 1;
  deadLatch = false;
  botSpawnGen = 0;
  hitFlash = 0;
  moveR = new THREE.Vector3();
  hitstop = 0;
  lastHeld = -1;
  camRoll = 0;
  breaking = 0;
  lastStep = 0;
  lastInput = 0;
  sunMesh: THREE.Mesh;
  moonMesh: THREE.Mesh;
  playerBody: THREE.Group;
  crack: THREE.Mesh;
  crackTex: THREE.CanvasTexture;
  particleVel: Float32Array;
  particleCol: Float32Array;
  trauma = 0;
  fovSmoothed = 75;
  renderAcc = 0;
  skyUniforms: {
    topColor: { value: THREE.Color };
    bottomColor: { value: THREE.Color };
    exponent: { value: number };
  };
  rainGeo: THREE.BufferGeometry | null = null;
  boats: {
    x: number;
    y: number;
    z: number;
    yaw: number;
    vx: number;
    vz: number;
    vy: number;
    mesh: THREE.Group;
    occupied: boolean;
    tint: number;
  }[] = [];
  carts: {
    x: number;
    y: number;
    z: number;
    yaw: number;
    vx: number;
    vz: number;
    mesh: THREE.Group;
    occupied: boolean;
  }[] = [];
  netChat: string[] = [];
  platePower = new Set<string>();
  modRules: {
    keepInventory?: boolean;
    doMobSpawning?: boolean;
    pvp?: boolean;
    mobGriefing?: boolean;
    doDaylightCycle?: boolean;
  } = {};
  modAi: { default?: Mob["ai"]; aggression?: number; strafe?: boolean; flee?: boolean } = {};
  bowCharge = 0;
  shots: {
    kind: "arrow" | "pearl" | "eye";
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    life: number;
    dmg: number;
    mesh: THREE.Mesh;
  }[] = [];
  hitboxPool: THREE.LineSegments[] = [];
  hitboxGeo: THREE.BufferGeometry | null = null;

  constructor(canvas: HTMLCanvasElement, meta: WorldMeta, settings: Settings, hooks: EngineHooks) {
    this.canvas = canvas;
    this.meta = meta;
    this.settings = settings;
    this.hooks = hooks;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: settings.antialias && settings.graphics !== "fast",
      powerPreference: "high-performance",
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.pixelRatioCap || (settings.graphics === "fast" ? 1 : 1.5)));
    this.renderer.setSize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = settings.brightness;
    this.renderer.shadowMap.enabled = settings.shadows && (settings.graphics === "fabulous" || settings.graphics === "rtx") && !settings.optimized;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.autoClear = true;
    this.scene = new THREE.Scene();
    this.fog = new THREE.FogExp2(0x87b4e0, 0.012);
    this.scene.fog = settings.fog ? this.fog : null;
    this.camera = new THREE.PerspectiveCamera(settings.fov, 1, 0.08, 480);
    this.hemi = new THREE.HemisphereLight(0xbfd4ff, 0x3a2a18, 0.7);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff0d0, 1.15);
    this.sun.position.set(40, 80, 20);
    this.sun.castShadow = settings.shadows;
    this.sun.shadow.mapSize.set(1024, 1024);
    this.sun.shadow.camera.near = 2;
    this.sun.shadow.camera.far = 220;
    this.sun.shadow.camera.left = -48;
    this.sun.shadow.camera.right = 48;
    this.sun.shadow.camera.top = 48;
    this.sun.shadow.camera.bottom = -48;
    this.sun.shadow.bias = -0.0008;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);
    this.atlas = getSharedAtlas();
    this.world = new World(this.scene, this.atlas, meta.seed);
    this.world.arena = meta.arena ?? null;
    this.world.setFancyWater(settings.fancyWater);
    this.world.setShadows(settings.shadows && (settings.graphics === "fabulous" || settings.graphics === "rtx") && !settings.optimized);
    this.player = new Player();
    this.player.mode = meta.mode;
    this.player.autoJump = settings.autoJump;
    this.player.difficulty = settings.difficulty;
    this.input = new Input();
    this.input.sens = settings.mouseSens;
    this.input.invertY = settings.invertY;
    this.input.invertX = settings.invertX;
    this.input.sneakToggle = settings.sneakToggle;
    this.input.sprintToggle = settings.sprintToggle;
    this.input.touchLookSens = settings.touchLookSens;
    this.input.binds = { ...settings.binds };
    this.audio = new GameAudio();
    this.audio.volumes.master = settings.volumeMaster;
    this.audio.volumes.sfx = settings.volumeSfx;
    this.audio.volumes.music = settings.volumeMusic;
    this.fovSmoothed = settings.fov;

    this.skyUniforms = {
      topColor: { value: new THREE.Color(0x4a90d9) },
      bottomColor: { value: new THREE.Color(0xd4ecff) },
      exponent: { value: 0.55 },
    };
    const skyMat = new THREE.ShaderMaterial({
      uniforms: this.skyUniforms,
      vertexShader: `varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 topColor; uniform vec3 bottomColor; uniform float exponent; varying vec3 vDir;
        void main(){ float h = normalize(vDir).y; float t = pow(max(h * 0.5 + 0.5, 0.0), exponent); gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0); }`,
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(320, 24, 16), skyMat);
    this.scene.add(this.sky);

    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(600 * 3);
    for (let i = 0; i < 600; i++) {
      const t = Math.random() * Math.PI * 2;
      const p = Math.random() * Math.PI * 0.48 + 0.08;
      starPos[i * 3] = Math.sin(t) * Math.cos(p) * 240;
      starPos[i * 3 + 1] = Math.sin(p) * 240;
      starPos[i * 3 + 2] = Math.cos(t) * Math.cos(p) * 240;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    this.stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xe8f0ff, size: 0.9, fog: false, transparent: true, opacity: 0.9 }));
    this.scene.add(this.stars);

    this.sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(6, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xfff1a8, fog: false, depthWrite: false }),
    );
    this.moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(4.2, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0xdde6f4, fog: false, depthWrite: false }),
    );
    this.scene.add(this.sunMesh, this.moonMesh);

    this.clouds = new THREE.Group();
    this.buildClouds();
    this.scene.add(this.clouds);

    const hg = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.01, 1.01, 1.01));
    this.highlight = new THREE.LineSegments(hg, new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 }));
    this.scene.add(this.highlight);

    this.hand = buildViewArm(resolveSkin(useApp.getState().profile.skin));
    this.camera.add(this.hand);
    this.lamp = new THREE.PointLight(0xfff1d0, 0.55, 16, 1.4);
    this.lamp.position.set(0, 0.1, -0.2);
    this.camera.add(this.lamp);
    this.scene.add(this.camera);

    this.playerBody = new THREE.Group();
    addSkinnedHumanoid(this.playerBody, resolveSkin(useApp.getState().profile.skin));
    addHeld(this.playerBody, "none");
    this.playerBody.visible = false;
    this.scene.add(this.playerBody);

    const crackCanvas = document.createElement("canvas");
    crackCanvas.width = 64;
    crackCanvas.height = 64;
    this.crackTex = new THREE.CanvasTexture(crackCanvas);
    this.crackTex.magFilter = THREE.NearestFilter;
    this.crackTex.minFilter = THREE.NearestFilter;
    this.crack = new THREE.Mesh(
      new THREE.BoxGeometry(1.02, 1.02, 1.02),
      new THREE.MeshBasicMaterial({ map: this.crackTex, transparent: true, depthWrite: false, opacity: 0.85, side: THREE.DoubleSide }),
    );
    this.crack.visible = false;
    this.crack.renderOrder = 3;
    this.scene.add(this.crack);

    this.particleGeo = new THREE.BufferGeometry();
    const ppos = new Float32Array(256 * 3);
    this.particleVel = new Float32Array(256 * 3);
    this.particleCol = new Float32Array(256 * 3);
    this.particleAges = Array.from({ length: 256 }, () => 0);
    this.particleGeo.setAttribute("position", new THREE.BufferAttribute(ppos, 3));
    this.particleGeo.setAttribute("color", new THREE.BufferAttribute(this.particleCol, 3));
    this.particles = new THREE.Points(
      this.particleGeo,
      new THREE.PointsMaterial({ size: 0.1, vertexColors: true, transparent: true, opacity: 0.9 }),
    );
    this.scene.add(this.particles);

    this.buildRain();

    this.input.attach(canvas);
    window.addEventListener("resize", this.onResize);
    this.onResize();
    window.__moc = this;
  }

  private buildClouds() {
    while (this.clouds.children.length) {
      const c = this.clouds.children[0]!;
      this.clouds.remove(c);
      if (c instanceof THREE.Mesh) {
        c.geometry.dispose();
        (c.material as THREE.Material).dispose();
      }
    }
    if (!this.settings.clouds) return;
    const fancy = this.settings.graphics !== "fast";
    const mat = new THREE.MeshLambertMaterial({ color: 0xf4f7fb, transparent: true, opacity: fancy ? 0.62 : 0.45, depthWrite: false });
    const n = fancy ? 18 : 10;
    for (let i = 0; i < n; i++) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(10 + Math.random() * 22, 1.1 + Math.random() * 1.4, 7 + Math.random() * 14), mat);
      c.position.set((Math.random() - 0.5) * 220, 88 + Math.random() * 10, (Math.random() - 0.5) * 220);
      this.clouds.add(c);
    }
  }

  private buildRain() {
    const geo = new THREE.BufferGeometry();
    const n = 400;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = Math.random() * 24;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.rain = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x9ec4e8, size: 0.07, transparent: true, opacity: 0.55 }));
    this.rain.visible = false;
    this.rainGeo = geo;
    this.scene.add(this.rain);
  }

  async boot(save: PlayerSave | null, edits: Map<string, Uint16Array>) {
    this.world.edits = edits;
    let spawn = findSpawn(this.meta.seed, this.world.noises, this.meta.spawnBiome);
    if (isArena(this.meta.arena)) {
      const s = ARENA_SPAWN[this.meta.arena];
      spawn = { x: s.x, y: s.y, z: s.z };
    }
    this.meta.spawn = spawn;
    if (save) {
      this.player.x = save.x;
      this.player.y = save.y;
      this.player.z = save.z;
      this.player.yaw = save.yaw;
      this.player.pitch = save.pitch;
      this.player.health = save.health;
      this.player.hunger = save.hunger;
      this.player.xp = save.xp;
      this.player.xpLevel = save.xpLevel;
      this.player.inventory = Array.isArray(save.inventory)
        ? save.inventory.map((s) => (s && s.id ? { id: s.id, count: Math.max(1, s.count || 1) } : null)).concat(Array.from({ length: 36 }, () => null)).slice(0, 36)
        : Array.from({ length: 36 }, () => null);
      this.player.armor = Array.isArray(save.armor)
        ? save.armor.map((s) => (s && s.id ? { id: s.id, count: 1 } : null)).concat([null, null, null, null]).slice(0, 4)
        : [null, null, null, null];
      this.player.offhand = save.offhand && save.offhand.id ? { id: save.offhand.id, count: save.offhand.count || 1 } : null;
      this.player.hotbar = Math.max(0, Math.min(8, save.hotbar ?? 0));
      this.player.dim = save.dim;
      this.player.flying = save.flying && this.meta.mode === "creative";
      this.worldTime = save.time;
      this.weather = save.weather;
      this.killedDragon = save.killedDragon;
      this.killedStorm = !!save.killedStorm;
      this.dim = save.dim;
      this.world.dim = save.dim;
    } else {
      this.player.x = spawn.x;
      this.player.y = spawn.y;
      this.player.z = spawn.z;
      this.worldTime = DAY_LEN * 0.28;
    }
    this.hooks.onProgress?.("Streaming the crust…", 0.1);
    await this.world.streamAroundYielding(
      this.player.x,
      this.player.z,
      Math.min(this.settings.renderDistance, 4),
      this.dim,
      this.hooks.onProgress,
    );
    let carved = 0;
    for (let i = 0; i < 80; i++) {
      const n = this.world.flushMeshes(this.settings.ao, 10);
      carved += n;
      this.hooks.onProgress?.(`Carving chunks ${carved}`, 0.5 + 0.42 * Math.min(1, (i + 1) / 40));
      if (n === 0 && this.world.chunkMeshedAt(this.player.x, this.player.z)) break;
      await new Promise((r) => setTimeout(r, 0));
    }
    this.hooks.onProgress?.("Finding a safe foothold…", 0.94);
    this.seatPlayer(!!save);
    this.world.streamAround(this.player.x, this.player.z, this.settings.renderDistance, this.dim);
    this.world.flushMeshes(this.settings.ao, 28);
    this.hooks.onProgress?.("Lighting the sky…", 0.97);
    this.applyDimVisuals();
    if (this.meta.modJson && !isArena(this.meta.arena)) this.applyModJson();
    if (isArena(this.meta.arena)) {
      const s = ARENA_SPAWN[this.meta.arena];
      this.worldTime = DAY_LEN * 0.42;
      this.player.x = s.x;
      this.player.y = s.y;
      this.player.z = s.z;
      this.player.difficulty = "hard";
      this.settings.difficulty = "hard";
      this.giveArenaKit(this.meta.arena === "duel" ? false : !!save);
      this.applyModJson();
      this.player.yaw = s.yaw;
      this.player.pitch = 0;
      this.sun.intensity = 1.45;
      this.hemi.intensity = 0.9;
      this.dualLevel = Math.max(1, Math.min(100, useApp.getState().profile.dualLevel || 1));
      this.spawnDuelBot();
      const labels: Record<string, string> = {
        duel: "DUAL — 100 levels. Combat only. No building.",
        bedwars: "BED WARS — protect your bed. Break theirs.",
        skywars: "SKY WARS — loot the islands. Don't fall.",
        ctf: "CAPTURE THE FLAG — steal the enemy banner.",
      };
      this.toastMsg(labels[this.meta.arena] ?? "Arena");
      this.chat.push("Official minigame hosted by Mods.");
      if (this.meta.arena === "bedwars") this.grant("bed_wars_win");
      if (this.meta.arena === "skywars") this.grant("sky_wars_win");
    }
    this.running = true;
    this.last = performance.now();
    this.loop(this.last);
    this.installControlsTest();
    this.dressPlayer(!!this.player.armor[1]);
    this.runScripts("join");
    this.chat.push("Welcome to Mine or Craft.");
    if (this.meta.arena) this.chat.push("Arena: respawn at your pad. PvP on.");
    else this.chat.push("Punch a log. Open bag. Drop it in the 2×2. Take planks. Green book auto-fills the table recipe — or right-click one plank into each square.");
    this.ready = true;
    document.addEventListener("visibilitychange", this.onHideSave);
    window.addEventListener("pagehide", this.onHideSave);
    void this.persist();
  }

  private onHideSave = () => {
    if (this.ready) void this.persist();
  };

  giveDuelKit(keepIfFilled: boolean) {
    this.giveArenaKit(keepIfFilled);
  }

  giveArenaKit(keepIfFilled: boolean) {
    if (keepIfFilled && this.player.inventory.some((s) => s)) return;
    this.player.inventory = Array.from({ length: 36 }, () => null);
    const a = this.meta.arena;
    if (a === "bedwars") {
      this.player.give(IRON_SWORD, 1);
      this.player.give(SHEARS, 1);
      this.player.give(WOOD_PICK, 1);
      this.player.give(COOKED_BEEF, 16);
      const wool = 271;
      this.player.give(wool, 64);
      this.player.armor = [
        { id: LEATHER_HELM, count: 1 },
        { id: LEATHER_CHEST, count: 1 },
        { id: LEATHER_LEGS, count: 1 },
        { id: LEATHER_BOOTS, count: 1 },
      ];
      this.player.offhand = null;
    } else if (a === "skywars") {
      this.player.give(STONE_SWORD, 1);
      this.player.give(STONE_AXE, 1);
      this.player.give(COOKED_BEEF, 8);
      this.player.give(BOW, 1);
      this.player.give(ARROW, 12);
      this.player.armor = [
        { id: LEATHER_HELM, count: 1 },
        { id: LEATHER_CHEST, count: 1 },
        { id: LEATHER_LEGS, count: 1 },
        { id: LEATHER_BOOTS, count: 1 },
      ];
      this.player.offhand = null;
    } else if (a === "ctf") {
      this.player.give(IRON_SWORD, 1);
      this.player.give(BOW, 1);
      this.player.give(ARROW, 24);
      this.player.give(COOKED_BEEF, 16);
      this.player.give(IRON_PICK, 1);
      this.player.offhand = { id: SHIELD, count: 1 };
      this.player.armor = [
        { id: IRON_HELM, count: 1 },
        { id: IRON_CHEST, count: 1 },
        { id: IRON_LEGS, count: 1 },
        { id: IRON_BOOTS, count: 1 },
      ];
    } else {
      this.player.give(DIAMOND_SWORD, 1);
      this.player.give(GOLDEN_APPLE, 8);
      this.player.give(BOW, 1);
      this.player.give(ARROW, 32);
      this.player.give(COOKED_BEEF, 16);
      this.player.offhand = { id: SHIELD, count: 1 };
      this.player.armor = [
        { id: DIAMOND_HELM, count: 1 },
        { id: DIAMOND_CHEST, count: 1 },
        { id: DIAMOND_LEGS, count: 1 },
        { id: DIAMOND_BOOTS, count: 1 },
      ];
    }
    this.player.hotbar = 0;
    this.player.health = 20;
    this.player.hunger = 20;
    this.player.absorption = 0;
    this.dressPlayer(true);
  }

  applyModJson() {
    const raw = this.meta.modJson;
    if (!raw) return;
    try {
      const mod = JSON.parse(raw) as {
        kit?: { id: number; count: number }[];
        armor?: number[];
        offhand?: number;
        maxHealth?: number;
        keepInventory?: boolean;
        pvp?: boolean;
        gamerules?: {
          keepInventory?: boolean;
          doMobSpawning?: boolean;
          pvp?: boolean;
          mobGriefing?: boolean;
          doDaylightCycle?: boolean;
        };
        ai?: { default?: Mob["ai"]; aggression?: number; strafe?: boolean; flee?: boolean };
        mobs?: { kind: string; ai?: Mob["ai"]; hostile?: boolean; x?: number; y?: number; z?: number; offset?: number[] }[];
        scripts?: { when: string; every?: number; do: { op: string; id?: number; count?: number; text?: string; kind?: string; value?: number }[] }[];
        commands?: string[];
        nbt?: { noAI?: boolean; invulnerable?: boolean; customName?: string };
        textures?: Record<string, string>;
        customBlocks?: { slot: number; name: string; tint: number; pixels: number[] }[];
        sounds?: { name: string; dataUrl: string }[];
        bosses?: { kind: string; name: string; hp: number; tint?: number }[];
        spawnBiome?: string;
        jsonRaw?: string;
        allowCheats?: boolean;
        author?: string;
        xpFarm?: boolean;
      };
      if (mod.xpFarm) this.meta.xpFarm = true;
      if (mod.author) {
        this.meta.author = mod.author;
        this.meta.labGame = true;
      }
      if (Array.isArray(mod.kit) && mod.kit.length && !this.player.inventory.some((s) => s)) {
        this.player.inventory = Array.from({ length: 36 }, () => null);
        for (const s of mod.kit) {
          if (s && s.id > 0) this.player.give(s.id, Math.max(1, s.count || 1));
        }
      }
      if (Array.isArray(mod.armor)) {
        this.player.armor = [0, 1, 2, 3].map((i) => (mod.armor![i] ? { id: mod.armor![i]!, count: 1 } : null));
      }
      if (mod.offhand) this.player.offhand = { id: mod.offhand, count: 1 };
      if (mod.maxHealth && mod.maxHealth > 0) this.player.health = Math.min(20, mod.maxHealth);
      this.modRules = { keepInventory: !!mod.keepInventory, pvp: mod.pvp !== false, ...(mod.gamerules ?? {}) };
      this.modAi = mod.ai ?? {};
      if (Array.isArray(mod.mobs)) {
        for (const spec of mod.mobs) {
          const kind = (spec.kind === "iron_golem" ? "golem" : spec.kind) as MobKind;
          const ox = spec.offset?.[0] ?? 0;
          const oy = spec.offset?.[1] ?? 0;
          const oz = spec.offset?.[2] ?? 0;
          const x = spec.x ?? this.player.x + ox;
          const z = spec.z ?? this.player.z + oz;
          const y = spec.y ?? this.world.highestSolid(x, z) + 1 + oy;
          try {
            const m = spawnMob(kind, x, y, z, this.scene);
            if (spec.ai) m.ai = spec.ai;
            else if (this.modAi.default) m.ai = this.modAi.default;
            if (spec.hostile != null) m.hostile = spec.hostile;
            this.mobs.push(m);
          } catch {
            /* unknown kind */
          }
        }
      }
      if (mod.allowCheats) this.meta.cheats = true;
      if (Array.isArray(mod.customBlocks)) {
        for (const cb of mod.customBlocks) {
          const b = registerCustomBlock(cb.slot, cb.name, cb.tint);
          if (cb.pixels?.length === 256) this.atlas.paintPixels(b.tex, cb.pixels);
        }
      }
      if (mod.textures) {
        for (const [k, hex] of Object.entries(mod.textures)) {
          const def = BY_KEY.get(k) ?? BLOCKS[Number(k)];
          if (!def || !hex) continue;
          const n = parseInt(hex.replace("#", ""), 16);
          if (!Number.isFinite(n)) continue;
          def.tint = n;
          def.tintTop = n;
        }
      }
      if (Array.isArray(mod.commands)) {
        for (const line of mod.commands) {
          const t = line.trim();
          if (t.startsWith("/")) this.cheat(t);
        }
      }
      if (Array.isArray(mod.bosses)) {
        for (const b of mod.bosses) {
          try {
            const kind = (b.kind === "custom" ? "custom_boss" : b.kind) as MobKind;
            const m = spawnMob(kind, this.player.x + 12, this.player.y + 8, this.player.z + 12, this.scene);
            m.hp = b.hp || m.hp;
            m.max = m.hp;
            m.label = b.name;
            if (b.tint) {
              m.mesh.traverse((o) => {
                if (o instanceof THREE.Mesh && o.material instanceof THREE.MeshLambertMaterial) {
                  o.material.color.setHex(b.tint!);
                }
              });
            }
            this.mobs.push(m);
          } catch {
            /* */
          }
        }
      }
      this.dressPlayer(!!this.player.armor[1]);
      if (Array.isArray(mod.sounds)) this.customSounds = mod.sounds.filter((s) => s?.name && s.dataUrl);
      if (Array.isArray(mod.scripts)) {
        this.modScripts = mod.scripts.map((s) => ({
          when: s.when,
          every: Math.max(2, s.every || 8),
          do: s.do ?? [],
          t: 0,
        }));
        this.runScripts("start");
      }
      this.toastMsg("Modded rules loaded — bots have free will.");
    } catch {
      this.toastMsg("Server snippet had a JSON error.");
    }
  }

  spawnDuelBot() {
    const arena = isArena(this.meta.arena) ? this.meta.arena : "duel";
    const b = ARENA_BOT[arena];
    const y = b.y;
    const bot = spawnMob("duelist", b.x, y, b.z, this.scene);
    const st = duelStats(this.dualLevel);
    bot.tier = st.level;
    bot.max = st.hp;
    bot.hp = st.hp;
    this.mobs.push(bot);
  }

  resetDuelBot() {
    this.botSpawnGen++;
    for (const m of this.mobs) {
      if (m.kind === "duelist") disposeMob(m, this.scene);
    }
    this.mobs = this.mobs.filter((m) => m.kind !== "duelist");
    this.spawnDuelBot();
  }

  respawnArena() {
    this.deadLatch = false;
    this.player.health = 20;
    this.player.hunger = 20;
    this.player.absorption = 0;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.vz = 0;
    if (isArena(this.meta.arena)) {
      const s = ARENA_SPAWN[this.meta.arena];
      this.player.x = s.x;
      this.player.y = s.y;
      this.player.z = s.z;
      this.player.yaw = s.yaw;
      this.player.pitch = 0;
      this.giveArenaKit(false);
      if (this.meta.arena === "duel") this.resetDuelBot();
    } else {
      const safe = this.world.findSafeSpawn(this.meta.spawn.x, this.meta.spawn.z);
      this.player.x = safe.x;
      this.player.y = safe.y;
      this.player.z = safe.z;
    }
    this.setOverlay("none");
  }

  dressPlayer(_armored: boolean) {
    const skin = resolveSkin(useApp.getState().profile.skin);
    while (this.playerBody.children.length) this.playerBody.remove(this.playerBody.children[0]!);
    addSkinnedHumanoid(this.playerBody, skin);
    const kind = heldKind(this.player.selected?.id ?? 0);
    addHeld(this.playerBody, kind, getDef(this.player.selected?.id ?? 0)?.tint ?? 0x5adce6);
    this.rebuildHand();
  }

  rebuildHand() {
    if (this.hand) this.camera.remove(this.hand);
    this.hand = buildViewArm(resolveSkin(useApp.getState().profile.skin));
    this.camera.add(this.hand);
    this.lastHeld = -1;
  }

  playerStuck(): boolean {
    const p = this.player;
    if (this.world.collides(p.x - 0.3, p.y + 0.05, p.z - 0.3, 0.6, 1.7, 0.6)) return true;
    const ix = Math.floor(p.x);
    const iy = Math.floor(p.y);
    const iz = Math.floor(p.z);
    const feet = this.world.getBlock(ix, iy, iz);
    const head = this.world.getBlock(ix, iy + 1, iz);
    if (isSolid(feet) || isSolid(head)) return true;
    if (this.world.isDanger(feet) || this.world.isDanger(head)) return true;
    if (p.y < 2) return true;
    return false;
  }

  seatPlayer(fromSave: boolean) {
    if (isArena(this.meta.arena)) {
      const s = ARENA_SPAWN[this.meta.arena];
      this.player.x = s.x;
      this.player.y = s.y;
      this.player.z = s.z;
      this.worldTime = DAY_LEN * 0.48;
      return;
    }
    const stuck = this.playerStuck();
    if (!fromSave || stuck) {
      const prefer = this.dim === "nether" ? 40 : this.dim === "end" ? 49 : 56;
      const minY = this.dim === "nether" ? 8 : this.dim === "end" ? 20 : 42;
      const safe = this.world.findSafeSpawn(this.player.x, this.player.z, prefer, minY);
      this.player.x = safe.x;
      this.player.y = safe.y;
      this.player.z = safe.z;
      this.player.vy = 0;
      this.world.streamAround(this.player.x, this.player.z, this.settings.renderDistance, this.dim);
      this.world.flushMeshes(this.settings.ao, 24);
      if (!fromSave) this.meta.spawn = { x: safe.x, y: safe.y, z: safe.z };
    }
  }

  applyDimVisuals() {
    if (this.dim === "nether") {
      this.fog.color.set(0x6a2420);
      this.skyUniforms.topColor.value.set(0x4a1814);
      this.skyUniforms.bottomColor.value.set(0x8a3a28);
      this.hemi.color.set(0xff8866);
      this.hemi.groundColor.set(0x4a1810);
      this.hemi.intensity = 1.15;
      this.sun.intensity = 0.95;
      this.sun.color.set(0xffccaa);
      this.sunMesh.visible = false;
      this.moonMesh.visible = false;
    } else if (this.dim === "end") {
      this.fog.color.set(0x161022);
      this.skyUniforms.topColor.value.set(0x05040a);
      this.skyUniforms.bottomColor.value.set(0x1a1430);
      this.hemi.color.set(0x8877aa);
      this.hemi.groundColor.set(0x110818);
      this.sun.intensity = 0.38;
      this.sunMesh.visible = false;
      this.moonMesh.visible = this.settings.sunMoon;
      if (!this.dragon && !this.killedDragon) {
        this.dragon = spawnMob("dragon", 20, 64, 8, this.scene);
        this.mobs.push(this.dragon);
      }
    } else {
      this.fog.color.set(0x87b4e0);
      this.skyUniforms.topColor.value.set(0x4a90d9);
      this.skyUniforms.bottomColor.value.set(0xd4ecff);
      this.hemi.color.set(0xbfd4ff);
      this.hemi.groundColor.set(0x3a2a18);
      this.sun.intensity = this.meta.arena === "duel" ? 1.45 : 1.15;
      this.hemi.intensity = this.meta.arena === "duel" ? 0.9 : 0.7;
      this.sunMesh.visible = this.settings.sunMoon;
      this.moonMesh.visible = this.settings.sunMoon;
    }
  }

  private onResize = () => {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
  };

  setPaused(p: boolean) {
    this.paused = p;
    if (p) {
      document.exitPointerLock?.();
      this.input.enabled = false;
    } else {
      this.input.enabled = true;
      this.input.releaseAll();
      this.last = performance.now();
    }
  }

  private simShouldFreeze(o: Overlay) {
    if (o === "none" || o === "locked" || o === "studio" || o === "chat") return false;
    const mp = useApp.getState().multiplayer;
    if (mp && (o === "pause" || o === "settings" || o === "inventory" || o === "crafting" || o === "furnace" || o === "advancements")) {
      return false;
    }
    return true;
  }

  setOverlay(o: Overlay) {
    this.overlay = o;
    const freeze = this.simShouldFreeze(o);
    this.setPaused(freeze);
    if (o === "chat" || o === "pause" || o === "settings" || o === "inventory" || o === "crafting" || o === "furnace") {
      this.input.enabled = o !== "chat";
      if (o === "chat") {
        this.input.enabled = false;
        this.input.releaseAll();
      }
    }
    if (o === "none") {
      this.input.enabled = true;
      this.input.releaseAll();
    }
    this.hooks.onOverlay(o);
  }

  closeChat() {
    this.input.enabled = true;
    this.input.releaseAll();
    this.paused = this.simShouldFreeze("none") ? this.paused : false;
    this.setOverlay("none");
  }

  onPlayerChat(text: string) {
    this.runScripts("chat");
    if (text) this.toastMsg(text.slice(0, 48));
  }

  private loop = (now: number) => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.loop);
    let dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    this.frames++;
    this.fpsT += dt;
    if (this.fpsT >= 0.4) {
      this.fps = this.frames / this.fpsT;
      this.frames = 0;
      this.fpsT = 0;
    }
    if (this.paused) {
      this.renderer.render(this.scene, this.camera);
      return;
    }
    if (this.hitstop > 0) {
      this.hitstop -= dt;
      this.render(dt);
      return;
    }
    this.acc += dt;
    const step = 1 / 60;
    const input = this.input.poll();
    const overlayLock = this.overlay !== "none" && this.overlay !== "studio" && this.overlay !== "locked";
    if (overlayLock) {
      input.moveX = 0;
      input.moveY = 0;
      input.jump = false;
      input.attack = false;
      input.use = false;
      input.sprint = false;
      input.lookX = 0;
      input.lookY = 0;
    }
    if (input.moveX || input.moveY || input.lookX || input.lookY || input.jump || input.attack) {
      this.afk = 0;
      this.lastInput = now;
    } else {
      this.afk += dt;
    }
    if (this.afk > 1200 && this.overlay === "none" && !useApp.getState().multiplayer) {
      this.afk = 0;
      this.toastMsg("Away for 20 minutes — game paused. Worlds stay saved.");
      this.setOverlay("pause");
      return;
    }

    if (input.justPause) {
      if (this.overlay === "chat") this.closeChat();
      else this.setOverlay(this.overlay === "pause" ? "none" : "pause");
      return;
    }
    if (input.justInventory) {
      this.setOverlay(this.overlay === "inventory" ? "none" : "inventory");
      return;
    }
    if (input.justChat) {
      this.setOverlay("chat");
      return;
    }
    if (input.justCamera) {
      const order: Array<typeof this.settings.cameraMode> = ["first", "third", "front"];
      const i = order.indexOf(this.settings.cameraMode);
      this.settings.cameraMode = order[(i + 1) % order.length]!;
      useApp.getState().setSettings({ cameraMode: this.settings.cameraMode });
    }
    if (input.justDebug) {
      useApp.getState().setSettings({ showFps: !this.settings.showFps, showCoords: !this.settings.showCoords });
    }
    if (input.justStudio) {
      if (this.meta.arena || useApp.getState().multiplayer) {
        this.toastMsg("Studio Tools only work in local worlds.");
      } else {
        this.setOverlay(this.overlay === "studio" ? "none" : "studio");
      }
      return;
    }

    while (this.acc >= step) {
      this.fixed(step, input);
      this.acc -= step;
    }
    this.renderAcc += dt;
    const cap = this.settings.maxFps > 0 ? this.settings.maxFps : 0;
    if (cap && this.renderAcc < 1 / cap) return;
    this.renderAcc = 0;
    this.render(dt);
    if (now % 8 < 16) this.pushHud();
  };

  private fixed(dt: number, input: ReturnType<Input["poll"]>) {
    this.worldTime += this.studio.freeze ? 0 : dt;
    this.player.update(dt, input, this.world);
    this.tickBoats(dt, input);
    this.tickCarts(dt, input);
    this.tickMechanics(dt);
    if (this.meta.arena === "duel") {
      this.player.x = Math.max(-23.2, Math.min(23.2, this.player.x));
      this.player.z = Math.max(-23.2, Math.min(23.2, this.player.z));
      if (this.player.y < 31) {
        const s = ARENA_SPAWN.duel;
        this.player.x = s.x;
        this.player.y = s.y;
        this.player.z = s.z;
        this.player.hurtBy(6, "void");
      }
    }
    this.world.streamAround(this.player.x, this.player.z, this.settings.renderDistance, this.dim);
    this.world.processBuilds(this.settings.graphics === "fast" ? 4 : 8, this.settings.ao);

    const look = this.player.lookDir();
    const hit = voxelRay(this.world, this.player.x, this.player.eyeY(), this.player.z, look.x, look.y, look.z, 6);
    if (hit) {
      this.highlight.visible = true;
      this.highlight.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
      const def = BLOCKS[this.world.getBlock(hit.x, hit.y, hit.z)];
      this.targeting = def?.name ?? "";
    } else {
      this.highlight.visible = false;
      this.targeting = "";
    }

    const spec = this.player.mode === "spectator";
    if (!spec) {
      if (input.justAttack) this.tryMelee(look);
      if (input.attack && hit && this.player.mode !== "creative" && this.player.mode !== "adventure") {
        this.mine(hit, dt);
      } else if (input.justAttack && hit && this.player.mode === "creative") {
        this.breakBlock(hit.x, hit.y, hit.z);
      } else if (!input.attack) {
        this.breaking = 0;
        this.player.miningPos = null;
      }
      if (input.justUse) {
        const heldId = this.player.selected?.id ?? 0;
        if (isBoatItem(heldId)) {
          if (hit) this.placeBoat(hit.x + hit.nx + 0.5, hit.y + hit.ny, hit.z + hit.nz + 0.5, heldId);
          else {
            const f = this.player.forward();
            this.placeBoat(this.player.x + f.x * 2, this.player.y, this.player.z + f.z * 2, heldId);
          }
        } else if (heldId === MINECART) {
          if (hit) this.placeCart(hit.x + hit.nx + 0.5, hit.y + hit.ny + 0.2, hit.z + hit.nz + 0.5);
          else {
            const f = this.player.forward();
            this.placeCart(this.player.x + f.x * 2, this.player.y, this.player.z + f.z * 2);
          }
        } else if (this.tryMountBoat()) {
          this.toastMsg("Boarded. Jump to hop out. WASD to row.");
        } else if (this.tryMountCart()) {
          this.toastMsg("Minecart. Jump to hop out.");
        } else if (isPotionItem(heldId)) {
          this.drinkPotion(heldId);
        } else if (heldId === WIND_CHARGE) {
          this.player.vy = 11;
          this.player.onGround = false;
          if (this.player.mode !== "creative") this.player.takeSelected(1);
          this.audio.jump();
        } else if (heldId === FIREWORK) {
          this.boostElytra();
        } else if (heldId === BOW || heldId === CROSSBOW) {
          /* hold to draw, release to shoot */
        } else if (heldId === ENDER_PEARL) this.throwPearl(look);
        else if (heldId === EYE_OF_ENDER) this.throwEye(look);
        else if (hit) {
          this.use(hit);
          this.runScripts("use");
        }
        else if (this.player.eat()) {
          this.audio.eat();
          this.runScripts("eat");
          if (heldId === CHORUS_FRUIT) this.chorusWarp();
        }
      }
    } else {
      this.highlight.visible = false;
    }

    if (this.player.onGround && !this.wasOnGround) {
      this.burst(this.player.x, this.player.y + 0.1, this.player.z, 0xc4b48a);
      this.trauma = Math.min(1, this.trauma + 0.08);
      this.player.squash = 0.72;
      this.audio.land();
      this.runScripts("land");
    }
    if (!this.player.onGround && this.wasOnGround && this.player.vy > 4) {
      this.audio.jump();
      this.runScripts("jump");
    }
    if (this.player.sprinting && this.player.onGround && Math.random() < dt * 8) {
      this.burst(this.player.x, this.player.y + 0.05, this.player.z, 0xc4b48a);
    }
    if (this.player.sneaking && !this.labSneak) this.runScripts("sneak");
    this.labSneak = this.player.sneaking;
    if (this.player.sprinting && !this.labSprint) this.runScripts("sprint");
    this.labSprint = this.player.sprinting;
    if (this.player.inWater && !this.labSwim) {
      this.runScripts("swim");
      this.audio.splash();
    }
    this.labSwim = this.player.inWater;
    this.wasOnGround = this.player.onGround;
    this.camPunch = Math.max(0, this.camPunch - dt * 3.2);
    this.hitFlash = Math.max(0, this.hitFlash - dt * 4);

    if (!spec) {
      const heldNow = this.player.selected?.id ?? 0;
      if ((heldNow === BOW || heldNow === CROSSBOW) && input.use) {
        this.bowCharge = Math.min(1, this.bowCharge + dt / (heldNow === CROSSBOW ? 0.5 : 0.92));
      } else if (this.bowCharge > 0) {
        if (this.bowCharge > 0.12) this.shootBow(look, this.bowCharge);
        this.bowCharge = 0;
      }
    }

    if (this.meta.arena === "ctf") {
      if (Math.abs(this.player.x) < 1.8 && Math.abs(this.player.z - 18) < 1.8) {
        this.grant("ctf_cap");
        this.addXp(25);
        this.toastMsg("Blue flag captured! Back to spawn.");
        const s = ARENA_SPAWN.ctf;
        this.player.x = s.x;
        this.player.y = s.y;
        this.player.z = s.z;
      }
    }
    if ((this.meta.arena === "skywars" || this.meta.arena === "bedwars") && this.player.y < 16) {
      this.player.hurtBy(50, "void");
    }
    if (this.meta.arena === "skywars" || this.meta.arena === "bedwars") {
      for (const m of this.mobs) {
        if (m.kind !== "duelist" || m.dead) continue;
        if (m.y < 16) {
          const b = ARENA_BOT[this.meta.arena];
          m.x = b.x;
          m.y = b.y;
          m.z = b.z;
          m.vx = 0;
          m.vy = 0;
          m.vz = 0;
          m.hp = m.max;
          this.toastMsg("Bot fell — reset to island.");
        }
      }
    }

    if (input.justDrop) {
      this.player.takeSelected(1);
    }

    this.tickMobs(dt);
    this.tickShots(dt);
    this.tickFluids(dt);
    this.tickGravity(dt);
    this.tickFire(dt);
    this.tickPortal(dt);
    this.maybeSpawnEndPortal();
    this.tickWraith(dt);
    this.tickPlayXp(dt);
    this.tickScripts(dt);
    this.applyStudio();
    if (this.dim === "overworld" && Math.random() < dt * 0.01) {
      this.weather = this.weather > 0 ? 0 : Math.random() < 0.35 ? 1 : 0;
    }
    this.clouds.position.x = this.player.x + Math.sin(this.worldTime * 0.02) * 20;
    this.clouds.position.z = this.player.z;
    this.audio.tickMusic(dt, this.isNight(), this.dim === "nether", this.dim === "end");

    this.saveTimer += dt;
    if (this.saveTimer > Math.max(3, this.settings.autoSave)) {
      this.saveTimer = 0;
      void this.persist();
    }

    if (this.player.health <= 0) {
      if (this.player.tryPopTotem()) {
        this.burst(this.player.x, this.player.y + 1, this.player.z, 0xf0c832);
        this.audio.levelup();
        this.toastMsg("Totem of Undying!");
        this.deadLatch = false;
      } else if (!this.deadLatch) {
        this.deadLatch = true;
        this.player.riding = false;
        this.audio.death();
        if (this.meta.arena === "duel") this.resetDuelBot();
        this.hooks.onDeath();
        this.runScripts("death");
        this.setOverlay("dead");
      }
    } else {
      this.deadLatch = false;
    }
    if (this.player.hurt > 0.35 && this.player.lastHurtAmt > 0.4) {
      this.trauma = Math.min(1, this.trauma + Math.min(0.45, this.player.lastHurtAmt * 0.12));
      if (!this.labHurtLatch) {
        this.labHurtLatch = true;
        this.runScripts("hurt");
      }
      this.player.lastHurtAmt = 0;
    } else if (this.player.hurt <= 0) {
      this.labHurtLatch = false;
    }

    const horiz = Math.hypot(this.player.vx, this.player.vz);
    if (this.player.onGround && horiz > 1.5) {
      this.lastStep += dt;
      if (this.lastStep > 0.42) {
        this.lastStep = 0;
        this.audio.step();
      }
    }
  }

  private mine(hit: { x: number; y: number; z: number }, dt: number) {
    if (this.meta.arena === "duel" || this.player.mode === "adventure" || this.player.mode === "spectator") return;
    const id = this.world.getBlock(hit.x, hit.y, hit.z);
    const def = BLOCKS[id];
    if (!def || def.hardness < 0) return;
    const tool = getDef(this.player.selected?.id ?? 0);
    const rightTool = !def.tool || def.tool === "none" || tool?.tool === def.tool;
    const level = tool?.harvestLevel ?? 0;
    let speed = rightTool ? 1 + level : 0.3;
    if (def.hardness === 0) speed = 20;
    this.breaking += (dt * speed) / Math.max(0.15, def.hardness);
    this.player.miningPos = hit;
    this.player.swing = 1;
    if (this.breaking >= 1) {
      this.breakBlock(hit.x, hit.y, hit.z);
      this.breaking = 0;
    }
  }

  private breakBlock(x: number, y: number, z: number) {
    if (this.meta.arena === "duel" || this.player.mode === "adventure" || this.player.mode === "spectator") return;
    const id = this.world.getBlock(x, y, z);
    const def = BLOCKS[id];
    if (!def || def.hardness < 0) return;
    this.world.setBlock(x, y, z, 0);
    this.audio.break();
    this.runScripts("break");
    this.burst(x + 0.5, y + 0.5, z + 0.5, def.tint);
    if (this.player.mode !== "creative") {
      const tool = getDef(this.player.selected?.id ?? 0);
      const canHarvest = def.harvestLevel === 0 || (tool?.harvestLevel ?? 0) >= def.harvestLevel;
      if (canHarvest && def.drops) this.player.give(def.drops, def.dropCount);
      this.addXp(1);
    }
    if (def.key.includes("log") || def.category === "wood") this.grant("getting_wood");
    if (id === 14) this.grant("diamonds");
  }

  private use(hit: { x: number; y: number; z: number; nx: number; ny: number; nz: number }) {
    const id = this.world.getBlock(hit.x, hit.y, hit.z);
    const kind = blockKind(id);
    if (id === CRAFTING_TABLE || kind === "craft") {
      this.setOverlay("crafting");
      this.runScripts("craft");
      return;
    }
    if (id === FURNACE || kind === "furnace") {
      this.setOverlay("furnace");
      return;
    }
    if (id === COMMAND_BLOCK || kind === "command") {
      this.setOverlay("chat");
      this.toastMsg("Command block — type /give, /tp, /nether, /end…");
      return;
    }
    if (kind === "chest") {
      this.setOverlay("inventory");
      this.toastMsg("Chest opened.");
      this.runScripts("open");
      return;
    }
    if (kind === "door" || kind === "trapdoor" || kind === "gate") {
      const k = posKey(hit.x, hit.y, hit.z);
      if (this.world.passable.has(k)) this.world.passable.delete(k);
      else this.world.passable.add(k);
      this.audio.place();
      this.toastMsg(this.world.passable.has(k) ? "Opened." : "Closed.");
      return;
    }
    if (kind === "lever") {
      const k = posKey(hit.x, hit.y, hit.z);
      if (this.world.toggled.has(k)) this.world.toggled.delete(k);
      else this.world.toggled.add(k);
      this.audio.place();
      this.toastMsg(this.world.toggled.has(k) ? "Lever on." : "Lever off.");
      this.tickMechanics(0.2);
      return;
    }
    if (kind === "button") {
      this.world.toggled.add(posKey(hit.x, hit.y, hit.z));
      window.setTimeout(() => {
        this.world.toggled.delete(posKey(hit.x, hit.y, hit.z));
        this.tickMechanics(0.2);
      }, 900);
      this.audio.place();
      this.toastMsg("Click.");
      this.tickMechanics(0.2);
      return;
    }
    if (kind === "piston") {
      if (pushPiston(this.world, hit.x, hit.y, hit.z, hit)) this.toastMsg("Piston shoves.");
      else this.toastMsg("Nothing to push.");
      this.audio.place();
      return;
    }
    if (kind === "tnt" || isTnt(id)) {
      this.world.setBlock(hit.x, hit.y, hit.z, 0);
      this.explode(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5, 3.4);
      return;
    }
    if (kind === "bed") {
      if (this.dim !== "overworld") {
        this.explode(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5, 3.2);
        this.toastMsg("Beds explode here.");
        return;
      }
      this.meta.spawn = { x: hit.x + 0.5, y: hit.y + 1, z: hit.z + 0.5 };
      this.toastMsg("Respawn point set.");
      this.audio.place();
      return;
    }
    if (kind === "note") {
      this.audio.place();
      this.toastMsg("Note block pings.");
      return;
    }
    if (kind === "jukebox") {
      this.audio.unlock();
      this.toastMsg("The disc spins.");
      return;
    }
    if (kind === "bell") {
      this.audio.hurt();
      this.toastMsg("The bell rings.");
      return;
    }
    if (kind === "cake") {
      this.player.hunger = Math.min(20, this.player.hunger + 2);
      this.audio.eat();
      this.toastMsg("Cake.");
      return;
    }
    if (kind === "enchant") {
      if ((this.player.xpLevel ?? 0) < 1 && this.player.mode !== "creative") {
        this.toastMsg("Need XP levels to enchant.");
        return;
      }
      this.player.xpLevel = Math.max(0, (this.player.xpLevel ?? 0) - 1);
      this.toastMsg("Enchanted with a glow.");
      this.audio.levelup();
      return;
    }
    if (kind === "anvil") {
      this.setOverlay("inventory");
      this.toastMsg("Anvil — repair by combining stacks.");
      return;
    }
    if (this.tryMountBoat()) return;
    if (this.tryMountCart()) return;
    const held = this.player.selected;
    if (held?.id === EYE_OF_ENDER) {
      this.tryLightEndPortal(hit.x, hit.y, hit.z);
      return;
    }
    if (held?.id === FLINT_STEEL) {
      if (isTnt(id)) {
        this.world.setBlock(hit.x, hit.y, hit.z, 0);
        this.explode(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5, 3.4);
        if (this.player.mode !== "creative") this.player.takeSelected(1);
        return;
      }
      this.world.setBlock(hit.x + hit.nx, hit.y + hit.ny, hit.z + hit.nz, FIRE);
      this.tryLightPortal(hit.x + hit.nx, hit.y + hit.ny, hit.z + hit.nz);
      this.audio.place();
      return;
    }
    if (held?.id === MINECART) {
      this.placeCart(hit.x + 0.5, hit.y + 1, hit.z + 0.5);
      return;
    }
    if (this.player.eat()) {
      this.audio.eat();
      if (held?.id === CHORUS_FRUIT) this.chorusWarp();
      return;
    }
    const def = getDef(held?.id ?? 0);
    const placeId = def?.place ?? (held && held.id < ITEM_BASE ? held.id : 0);
    if (placeId && placeId > 0) {
      if (this.meta.arena === "duel" || this.player.mode === "adventure") {
        this.toastMsg(this.meta.arena === "duel" ? "No building in Dual." : "Adventure — no placing.");
        return;
      }
      const px = hit.x + hit.nx;
      const py = hit.y + hit.ny;
      const pz = hit.z + hit.nz;
      if (this.world.getBlock(px, py, pz) !== 0) return;
      const pw = 0.6, ph = 1.8;
      const overlaps =
        px + 1 > this.player.x - pw / 2 &&
        px < this.player.x + pw / 2 &&
        py + 1 > this.player.y &&
        py < this.player.y + ph &&
        pz + 1 > this.player.z - pw / 2 &&
        pz < this.player.z + pw / 2;
      if (overlaps) return;
      const key = `${def?.name ?? ""} ${BLOCKS[placeId]?.key ?? ""} ${BLOCKS[placeId]?.name ?? ""}`.toLowerCase();
      if ((key.includes("bed") || key.includes("_bed")) && (this.dim === "nether" || this.dim === "end")) {
        this.explode(px + 0.5, py + 0.5, pz + 0.5, 3.2);
        this.toastMsg("Beds explode here.");
        if (this.player.mode !== "creative") this.player.takeSelected(1);
        return;
      }
      if (placeId === WATER && this.dim === "nether") {
        this.toastMsg("Water evaporates in the Nether.");
        this.audio.place();
        if (this.player.mode !== "creative") {
          this.player.takeSelected(1);
          this.player.give(BUCKET, 1);
        }
        return;
      }
      this.world.setBlock(px, py, pz, placeId);
      this.audio.place();
      this.runScripts("place");
      if (this.player.mode !== "creative") this.player.takeSelected(1);
      this.player.swing = 1;
    }
  }

  private tryLightPortal(fx: number, fy: number, fz: number) {
    const isObs = (x: number, y: number, z: number) => this.world.getBlock(x, y, z) === OBSIDIAN;
    const innerOk = (x: number, y: number, z: number) => {
      const id = this.world.getBlock(x, y, z);
      return id === 0 || id === FIRE || id === NETHER_PORTAL;
    };
    const tryAxis = (axis: "x" | "z") => {
      for (let y0 = fy - 4; y0 <= fy; y0++) {
        for (let o = -3; o <= 1; o++) {
          const x0 = axis === "x" ? fx + o : fx;
          const z0 = axis === "z" ? fz + o : fz;
          let ok = true;
          for (let i = -1; i <= 2; i++) {
            if (axis === "x") {
              if (!isObs(x0 + i, y0 - 1, z0) || !isObs(x0 + i, y0 + 3, z0)) ok = false;
            } else if (!isObs(x0, y0 - 1, z0 + i) || !isObs(x0, y0 + 3, z0 + i)) ok = false;
          }
          for (let dy = 0; dy < 3; dy++) {
            if (axis === "x") {
              if (!isObs(x0 - 1, y0 + dy, z0) || !isObs(x0 + 2, y0 + dy, z0)) ok = false;
              if (!innerOk(x0, y0 + dy, z0) || !innerOk(x0 + 1, y0 + dy, z0)) ok = false;
            } else {
              if (!isObs(x0, y0 + dy, z0 - 1) || !isObs(x0, y0 + dy, z0 + 2)) ok = false;
              if (!innerOk(x0, y0 + dy, z0) || !innerOk(x0, y0 + dy, z0 + 1)) ok = false;
            }
          }
          if (!ok) continue;
          for (let i = 0; i < 2; i++) {
            for (let dy = 0; dy < 3; dy++) {
              if (axis === "x") this.world.setBlock(x0 + i, y0 + dy, z0, NETHER_PORTAL);
              else this.world.setBlock(x0, y0 + dy, z0 + i, NETHER_PORTAL);
            }
          }
          this.audio.portal();
          this.toastMsg("A portal rips open.");
          this.grant("we_need_to_go_deeper");
          return true;
        }
      }
      return false;
    };
    if (!tryAxis("x")) tryAxis("z");
  }

  private tryLightEndPortal(x: number, y: number, z: number) {
    const frame = this.world.getBlock(x, y, z);
    if (frame !== 59 && frame !== END_PORTAL) return;
    let frames = 0;
    for (let dx = -3; dx <= 3; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        const id = this.world.getBlock(x + dx, y, z + dz);
        if (id === 59) frames++;
      }
    }
    if (frames < 8) {
      this.toastMsg("Need a ring of End portal frames.");
      return;
    }
    this.world.setBlock(x, y, z, END_PORTAL);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const id = this.world.getBlock(x + dx, y, z + dz);
        if (id === 0 || id === 59) this.world.setBlock(x + dx, y, z + dz, END_PORTAL);
      }
    }
    if (this.player.mode !== "creative") this.player.takeSelected(1);
    this.audio.portal();
    this.toastMsg("The End portal ignites.");
    this.grant("the_end");
  }

  private tickPortal(dt: number) {
    if (this.meta.arena === "duel") {
      this.portalT = 0;
      return;
    }
    const id = this.world.getBlock(Math.floor(this.player.x), Math.floor(this.player.y + 0.5), Math.floor(this.player.z));
    if (id === NETHER_PORTAL) {
      this.portalT += dt;
      if (this.portalT > 1.6) {
        this.portalT = 0;
        if (this.dim === "overworld") this.changeDim("nether");
        else if (this.dim === "nether") this.changeDim("overworld");
      }
    } else if (id === END_PORTAL) {
      this.portalT += dt;
      if (this.portalT > 1.2) {
        this.portalT = 0;
        if (this.dim !== "end") this.changeDim("end");
        else this.changeDim("overworld");
      }
    } else this.portalT = 0;
  }

  changeDim(d: Dim) {
    const from = this.dim;
    this.dim = d;
    this.player.dim = d;
    this.world.dim = d;
    this.runScripts(d === "nether" ? "nether" : d === "end" ? "end" : "portal");
    if (d === "nether") {
      this.player.x = this.player.x / 8;
      this.player.z = this.player.z / 8;
    } else if (d === "overworld" && from === "nether") {
      this.player.x *= 8;
      this.player.z *= 8;
    } else if (d === "end") {
      this.player.x = 8.5;
      this.player.z = 8.5;
    }
    for (const m of this.mobs) if (m.kind !== "wraith") disposeMob(m, this.scene);
    this.mobs = this.mobs.filter((m) => m.kind === "wraith");
    this.dragon = null;
    this.world.streamAround(this.player.x, this.player.z, this.settings.renderDistance, d);
    this.world.processBuilds(80, this.settings.ao);
    for (const b of this.boats) this.scene.remove(b.mesh);
    this.boats = [];
    for (const c of this.carts) this.scene.remove(c.mesh);
    this.carts = [];
    this.player.riding = false;
    const prefer = d === "nether" ? 40 : d === "end" ? 49 : 56;
    const minY = d === "nether" ? 8 : d === "end" ? 20 : 42;
    const safe = this.world.findSafeSpawn(this.player.x, this.player.z, prefer, minY);
    this.player.x = safe.x;
    this.player.y = safe.y;
    this.player.z = safe.z;
    this.player.vy = 0;
    this.applyDimVisuals();
    this.audio.portal();
    this.toastMsg(d === "nether" ? "The Nether" : d === "end" ? "The End" : "Overworld");
  }

  private tickMobs(dt: number) {
    this.spawnTimer += dt;
    const allowSpawn = this.modRules.doMobSpawning !== false;
    if (this.spawnTimer > 4 && !this.meta.arena && allowSpawn) {
      this.spawnTimer = 0;
      const m = trySpawn(this.scene, this.world, this.player, this.mobs, this.isNight(), this.meta.seed, this.settings.difficulty);
      if (m) {
        if (this.modAi.default) m.ai = this.modAi.default;
        this.mobs.push(m);
      }
    }
    updateMobs(
      this.mobs,
      dt,
      this.world,
      this.player,
      this.isNight(),
      (x, y, z, r) => this.explode(x, y, z, r),
      this.player.flying && this.player.mode === "creative",
      (m, dmg, kb) => {
        this.player.hurtBy(dmg, m.kind);
        this.player.applyKnockback(this.player.x - m.x, this.player.z - m.z, kb, this.meta.arena === "duel" || m.kind === "duelist");
        this.trauma = Math.min(1, this.trauma + 0.28);
        this.camPunch = 0.18;
        this.hitFlash = 0.22;
        if (m.kind === "duelist") {
          this.audio.shield();
          this.toastMsg(this.player.blocking ? "Blocked!" : "Hit!");
        }
      },
      this.modAi,
    );
    for (const m of this.mobs) {
      if (!m.dead && m.hp <= 0) this.killMob(m);
    }
    if (this.dragon && this.dragon.hp <= 0 && !this.killedDragon) {
      this.killedDragon = true;
      this.addXp(2500);
      this.grant("free_the_end");
      this.toastMsg("The Void Wyrm falls. Returning home…");
      const bed = this.meta.spawn;
      this.changeDim("overworld");
      const safe = this.world.findSafeSpawn(bed.x, bed.z);
      this.player.x = safe.x;
      this.player.y = safe.y;
      this.player.z = safe.z;
      this.hooks.onOverlay("storm");
      this.setOverlay("storm");
    }
    if (this.storm && this.storm.hp <= 0 && !this.killedStorm) {
      this.killedStorm = true;
      this.addXp(4000);
      this.grant("the_end_again");
      this.awardClear();
      this.hooks.onWin();
      this.toastMsg("The Wither Storm is gone. You cleared the story.");
    }
  }

  private tickWraith(dt: number) {
    if (this.killedDragon || this.meta.arena) return;
    if (this.overlay !== "none") return;
    if (this.afk > 240 && !this.wraith) {
      const f = this.player.forward();
      this.wraith = spawnMob("wraith", this.player.x - f.x * 6, this.player.y, this.player.z - f.z * 6, this.scene);
      this.mobs.push(this.wraith);
      this.audio.wraith();
      this.toastMsg("You are not alone.");
    }
    void dt;
  }

  private tickFluids(dt: number) {
    this.fluidTimer += dt;
    if (this.fluidTimer < 0.35) return;
    this.fluidTimer = 0;
    const px = Math.floor(this.player.x);
    const pz = Math.floor(this.player.z);
    const py = Math.floor(this.player.y);
    for (let y = py - 4; y <= py + 4; y++) {
      for (let z = pz - 6; z <= pz + 6; z++) {
        for (let x = px - 6; x <= px + 6; x++) {
          const id = this.world.getBlock(x, y, z);
          if (id !== WATER && id !== LAVA) continue;
          const below = this.world.getBlock(x, y - 1, z);
          if (below === 0) {
            if (id === LAVA) continue;
            this.world.setBlock(x, y - 1, z, id);
            continue;
          }
          if (id === LAVA) continue;
          const support = below !== 0 && !isFluid(below);
          if (!support) continue;
          for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx, nz = z + dz;
            if (this.world.getBlock(nx, y, nz) !== 0) continue;
            const under = this.world.getBlock(nx, y - 1, nz);
            if (under === 0 || isFluid(under)) continue;
            this.world.setBlock(nx, y, nz, WATER);
            break;
          }
          if (id === WATER) {
            for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, -1, 0]]) {
              if (this.world.getBlock(x + dx, y + dy, z + dz) === LAVA) {
                this.world.setBlock(x + dx, y + dy, z + dz, OBSIDIAN);
              }
            }
          }
        }
      }
    }
    for (let y = py - 3; y <= py + 3; y++) {
      for (let z = pz - 5; z <= pz + 5; z++) {
        for (let x = px - 5; x <= px + 5; x++) {
          if (this.world.getBlock(x, y, z) !== 0) continue;
          let sources = 0;
          for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            if (this.world.getBlock(x + dx, y, z + dz) === WATER) sources++;
          }
          if (sources >= 2 && this.world.getBlock(x, y - 1, z) !== 0) this.world.setBlock(x, y, z, WATER);
        }
      }
    }
  }

  private tickGravity(dt: number) {
    this.gravTimer += dt;
    if (this.gravTimer < 0.1) return;
    this.gravTimer = 0;
    const px = Math.floor(this.player.x);
    const pz = Math.floor(this.player.z);
    const py = Math.floor(this.player.y);
    for (let y = py - 6; y <= py + 8; y++) {
      for (let z = pz - 7; z <= pz + 7; z++) {
        for (let x = px - 7; x <= px + 7; x++) {
          const id = this.world.getBlock(x, y, z);
          if (!id || !BLOCKS[id]?.gravity) continue;
          const below = this.world.getBlock(x, y - 1, z);
          const bdef = BLOCKS[below];
          const open = below === 0 || isFluid(below) || bdef?.shape === "torch" || bdef?.shape === "cross";
          if (!open) continue;
          this.world.setBlock(x, y, z, 0);
          if (below === 0 || isFluid(below)) {
            this.world.setBlock(x, y - 1, z, id);
            const hits =
              x + 1 > this.player.x - 0.3 &&
              x < this.player.x + 0.3 &&
              y - 1 + 1 > this.player.y &&
              y - 1 < this.player.y + 1.8 &&
              z + 1 > this.player.z - 0.3 &&
              z < this.player.z + 0.3;
            if (hits) this.player.hurtBy(id === 172 ? 6 : 2, "fall");
          } else if (this.player.mode !== "creative") {
            this.player.give(id, 1);
          }
        }
      }
    }
  }

  private tickPlayXp(dt: number) {
    if (this.overlay !== "none" || this.paused) return;
    this.playXpT += dt;
    if (this.playXpT < 8) return;
    this.playXpT = 0;
    const p = useApp.getState().profile;
    useApp.getState().setProfile({ playSeconds: (p.playSeconds ?? 0) + 8 });
    if (this.xpBlocked()) return;
    this.addXp(1);
    this.playXpBatch++;
    if (this.playXpBatch % 6 === 0) this.toastMsg("+6 XP for time in world");
  }

  private runScripts(when: string) {
    for (const s of this.modScripts) {
      if (s.when === when) this.runOps(s.do);
    }
  }

  private runOps(ops: { op: string; id?: number; count?: number; text?: string; kind?: string; value?: number }[]) {
    for (const op of ops) {
      const n = Math.max(1, op.count || 1);
      const on = (op.value ?? 1) !== 0;
      const px = Math.floor(this.player.x);
      const py = Math.floor(this.player.y);
      const pz = Math.floor(this.player.z);
      if (op.op === "say" && op.text) this.toastMsg(op.text);
      else if (op.op === "broadcast" || op.op === "msg" || op.op === "tellraw" || op.op === "title") this.toastMsg(op.text || "!");
      else if (op.op === "countdown") this.toastMsg(`${n}…`);
      else if (op.op === "give" && op.id) this.player.give(op.id, n);
      else if (op.op === "giveall" && op.id) {
        for (let i = 0; i < 9; i++) this.player.inventory[i] = { id: op.id, count: 64 };
      } else if (op.op === "kit") {
        this.player.give(10023, 1);
        this.player.give(10031, 1);
        this.player.give(10055, 4);
        this.player.give(10049, 16);
      } else if (op.op === "armor") {
        this.player.armor = [
          { id: 10089, count: 1 },
          { id: 10090, count: 1 },
          { id: 10091, count: 1 },
          { id: 10092, count: 1 },
        ];
        this.dressPlayer(true);
      } else if (op.op === "totem") this.player.offhand = { id: 10105, count: 1 };
      else if (op.op === "pearl") this.player.give(10061, n);
      else if (op.op === "bow") {
        this.player.give(10032, 1);
        this.player.give(10033, 32);
      } else if (op.op === "shield") this.player.offhand = { id: 10031, count: 1 };
      else if (op.op === "food") this.player.give(10049, n);
      else if (op.op === "torch") this.player.give(42, n);
      else if (op.op === "blocks") {
        this.player.give(19, 64);
        this.player.give(1, 64);
        this.player.give(18, 64);
      } else if (op.op === "diamond") this.player.give(10040, n);
      else if (op.op === "netherite") {
        this.player.give(10024, 1);
        this.player.armor = [
          { id: 10093, count: 1 },
          { id: 10094, count: 1 },
          { id: 10095, count: 1 },
          { id: 10096, count: 1 },
        ];
        this.dressPlayer(true);
      } else if (op.op === "elytra") {
        this.player.armor[1] = { id: 10106, count: 1 };
        this.player.give(10107, 16);
        this.dressPlayer(true);
      } else if (op.op === "boat") this.placeBoat(this.player.x, this.player.y, this.player.z + 2, 10101);
      else if (op.op === "clear") this.player.inventory = Array.from({ length: 36 }, () => null);
      else if (op.op === "clearhotbar") {
        for (let i = 0; i < 9; i++) this.player.inventory[i] = null;
      } else if (op.op === "fillhotbar" && op.id) {
        for (let i = 0; i < 9; i++) this.player.inventory[i] = { id: op.id, count: 64 };
      } else if (op.op === "spawn" && op.kind) {
        try {
          const ang = Math.random() * Math.PI * 2;
          const m = spawnMob(op.kind as MobKind, this.player.x + Math.cos(ang) * 6, this.player.y, this.player.z + Math.sin(ang) * 6, this.scene);
          this.mobs.push(m);
        } catch {
          /* */
        }
      } else if (op.op === "boss" && op.kind) {
        try {
          const m = spawnMob(op.kind as MobKind, this.player.x + 14, this.player.y + 8, this.player.z, this.scene);
          this.mobs.push(m);
        } catch {
          /* */
        }
      } else if (op.op === "kill") {
        for (const m of this.mobs) if (m.kind !== "wraith") m.hp = 0;
      } else if (op.op === "anger") {
        for (const m of this.mobs) m.hostile = true;
      } else if (op.op === "calm") {
        for (const m of this.mobs) m.hostile = false;
      } else if (op.op === "health") this.player.health = Math.max(1, Math.min(20, n));
      else if (op.op === "heal") this.player.health = 20;
      else if (op.op === "damage") this.player.hurtBy(n, "magic");
      else if (op.op === "hunger") this.player.hunger = Math.max(0, Math.min(20, n));
      else if (op.op === "saturation") this.player.hunger = 20;
      else if (op.op === "absorption") this.player.absorption = n;
      else if (op.op === "poison") this.player.hurtBy(Math.min(8, n), "magic");
      else if (op.op === "effect" && op.text) {
        const t = op.text.toLowerCase();
        if (t.includes("speed")) this.player.speedT = n;
        else if (t.includes("jump")) this.player.jumpBoostT = n;
        else if (t.includes("night")) this.player.nightT = n;
        else if (t.includes("invis")) this.player.invisT = n;
        else this.player.speedT = n;
      } else if (op.op === "speed") this.player.speedT = n;
      else if (op.op === "jumpboost") this.player.jumpBoostT = n;
      else if (op.op === "nightvis") this.player.nightT = n;
      else if (op.op === "invis") this.player.invisT = n;
      else if (op.op === "fire") this.player.hurtBy(2, "fire");
      else if (op.op === "extinguish") this.toastMsg("Extinguished.");
      else if (op.op === "glow") this.player.nightT = Math.max(this.player.nightT, n);
      else if (op.op === "smite" || op.op === "lightning") {
        this.explode(this.player.x + 3, this.player.y, this.player.z, 2.2);
        this.burst(this.player.x + 3, this.player.y + 8, this.player.z, 0xf0f4ff);
      } else if (op.op === "explode") this.explode(this.player.x + 4, this.player.y, this.player.z, 2.4);
      else if (op.op === "tnt") this.world.setBlock(px, py, pz + 3, 41);
      else if (op.op === "firework") this.boostElytra();
      else if (op.op === "launch") {
        this.player.vy = 12;
        this.player.onGround = false;
      } else if (op.op === "fly") this.player.flying = on;
      else if (op.op === "god") this.player.invincible = on;
      else if (op.op === "freeze") this.studio.freeze = true;
      else if (op.op === "thaw") this.studio.freeze = false;
      else if (op.op === "hide") this.playerBody.visible = false;
      else if (op.op === "show") this.playerBody.visible = this.settings.cameraMode !== "first";
      else if (op.op === "spectate") this.player.mode = "spectator";
      else if (op.op === "adventure") this.player.mode = "adventure";
      else if (op.op === "creative") this.player.mode = "creative";
      else if (op.op === "survival") this.player.mode = "survival";
      else if (op.op === "time") this.worldTime = on ? DAY_LEN * 0.28 : DAY_LEN * 0.75;
      else if (op.op === "day") this.worldTime = DAY_LEN * 0.28;
      else if (op.op === "night") this.worldTime = DAY_LEN * 0.75;
      else if (op.op === "timeadd") this.worldTime = (this.worldTime + n) % DAY_LEN;
      else if (op.op === "weather") this.weather = on ? 1 : 0;
      else if (op.op === "clearsky") this.weather = 0;
      else if (op.op === "storm") this.weather = 1;
      else if (op.op === "xp") this.addXp(n);
      else if (op.op === "xplevel") this.player.xpLevel = n;
      else if (op.op === "score") {
        this.scriptScore++;
        this.toastMsg(`Score ${this.scriptScore}`);
      } else if (op.op === "addscore") {
        this.scriptScore += n;
        this.toastMsg(`Score ${this.scriptScore}`);
      } else if (op.op === "setscore") {
        this.scriptScore = n;
        this.toastMsg(`Score ${this.scriptScore}`);
      } else if (op.op === "tp" && op.text) {
        const parts = op.text.split(/[ ,]+/).map(Number);
        if (parts.length >= 3 && parts.every(Number.isFinite)) {
          this.player.x = parts[0]!;
          this.player.y = parts[1]!;
          this.player.z = parts[2]!;
        }
      } else if (op.op === "randomtp") {
        const s = this.world.findSafeSpawn(this.player.x + (Math.random() - 0.5) * 40, this.player.z + (Math.random() - 0.5) * 40);
        this.player.x = s.x;
        this.player.y = s.y;
        this.player.z = s.z;
      } else if (op.op === "spawnpoint") this.meta.spawn = { x: this.player.x, y: this.player.y, z: this.player.z };
      else if (op.op === "checkpoint") this.labCheck = { x: this.player.x, y: this.player.y, z: this.player.z };
      else if (op.op === "loadcheck" && this.labCheck) {
        this.player.x = this.labCheck.x;
        this.player.y = this.labCheck.y;
        this.player.z = this.labCheck.z;
      } else if (op.op === "gamemode" && op.text) {
        const m = op.text as GameMode;
        if (m === "survival" || m === "creative" || m === "adventure" || m === "spectator") this.player.mode = m;
      } else if (op.op === "gamerule" && op.text) {
        if (op.text.includes("keepInventory")) this.modRules.keepInventory = true;
        if (op.text.includes("pvp")) this.modRules.pvp = true;
      } else if (op.op === "pvp") this.modRules.pvp = on;
      else if (op.op === "keep") this.modRules.keepInventory = on;
      else if (op.op === "setblock" && op.id) this.world.setBlock(px, py, pz + 2, op.id);
      else if (op.op === "fill" && op.id) {
        for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) this.world.setBlock(px + dx, py, pz + dz + 3, op.id);
      } else if (op.op === "cage") {
        for (let dy = 0; dy <= 2; dy++) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
          if (Math.abs(dx) === 1 || Math.abs(dz) === 1 || dy === 2) this.world.setBlock(px + dx, py + dy, pz + dz, 43);
        }
      } else if (op.op === "floor") {
        for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) this.world.setBlock(px + dx, py - 1, pz + dz, 3);
      } else if (op.op === "wall") {
        for (let dy = 0; dy <= 3; dy++) for (let dx = -2; dx <= 2; dx++) this.world.setBlock(px + dx, py + dy, pz + 3, 18);
      } else if (op.op === "platform") {
        for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) this.world.setBlock(px + dx, py - 1, pz + dz, 19);
      } else if (op.op === "pillar") {
        for (let dy = 0; dy < 8; dy++) this.world.setBlock(px + 2, py + dy, pz + 2, 3);
      } else if (op.op === "house") {
        for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
          this.world.setBlock(px + dx + 6, py - 1, pz + dz, 19);
          if (Math.abs(dx) === 2 || Math.abs(dz) === 2) {
            this.world.setBlock(px + dx + 6, py, pz + dz, 19);
            this.world.setBlock(px + dx + 6, py + 1, pz + dz, 19);
          }
          this.world.setBlock(px + dx + 6, py + 2, pz + dz, 9);
        }
      } else if (op.op === "sphere") {
        for (let dx = -3; dx <= 3; dx++) for (let dy = 0; dy <= 4; dy++) for (let dz = -3; dz <= 3; dz++) {
          const d = dx * dx + (dy - 2) * (dy - 2) + dz * dz;
          if (d >= 8 && d <= 12) this.world.setBlock(px + dx, py + dy, pz + dz, 43);
        }
      } else if (op.op === "beacon") {
        for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) this.world.setBlock(px + dx, py - 1, pz + dz + 4, 14);
        this.world.setBlock(px, py, pz + 4, 201);
      } else if (op.op === "water") this.world.setBlock(px, py, pz + 2, 6);
      else if (op.op === "lava") this.world.setBlock(px + 3, py, pz, 7);
      else if (op.op === "ice") {
        for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) this.world.setBlock(px + dx, py - 1, pz + dz, 21);
      } else if (op.op === "obsidian") {
        for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) this.world.setBlock(px + dx, py - 1, pz + dz, 29);
      } else if (op.op === "clone") {
        for (let dx = 0; dx <= 2; dx++) for (let dy = 0; dy <= 2; dy++) {
          const id = this.world.getBlock(px - 2 + dx, py + dy, pz);
          this.world.setBlock(px + 3 + dx, py + dy, pz, id);
        }
      } else if (op.op === "execute" && op.text) {
        const t = op.text.trim();
        if (t.startsWith("/")) this.cheat(t);
        else this.cheat("/" + t);
      } else if (op.op === "nbt" && op.text) this.toastMsg(`data ${op.text}`);
      else if (op.op === "nametag" && op.text) {
        for (const m of this.mobs) m.label = op.text;
      } else if (op.op === "sound" || op.op === "playsound") this.audio.playNamed(op.text || "craft", this.customSounds);
      else if (op.op === "stopsound") {
        /* */
      } else if (op.op === "particle") this.burst(this.player.x, this.player.y + 1, this.player.z, 0x5adce6);
      else if (op.op === "difficulty" && op.text) this.settings.difficulty = op.text as typeof this.settings.difficulty;
      else if (op.op === "ride") this.tryMountBoat() || this.tryMountCart();
      else if (op.op === "dismount") this.player.riding = false;
      else if (op.op === "seed") this.toastMsg(`Seed ${this.meta.seed}`);
      else if (op.op === "kick") {
        this.hooks.onOverlay("pause");
        this.toastMsg("Kicked to pause.");
      } else if (op.op === "restart") {
        const s = this.meta.spawn;
        this.player.x = s.x;
        this.player.y = s.y;
        this.player.z = s.z;
        this.player.health = 20;
        this.runScripts("respawn");
      } else if (op.op === "lose") {
        this.player.health = 0;
      } else if (op.op === "win") {
        this.addXp(40);
        this.hooks.onWin();
        this.setOverlay("credits");
      }
    }
  }

  private tickScripts(dt: number) {
    for (const s of this.modScripts) {
      if (s.when !== "tick") continue;
      s.t += dt;
      if (s.t >= s.every) {
        s.t = 0;
        this.runOps(s.do);
      }
    }
  }

  applyStudio() {
    const on = !this.meta.arena && !useApp.getState().multiplayer;
    if (!on) {
      this.studio = { fly: false, god: false, fullbright: false, speed: false, freeze: false, hitboxes: false };
      return;
    }
    if (this.studio.fly && this.player.mode !== "spectator") this.player.flying = true;
    this.player.invincible = this.studio.god || this.player.mode === "creative" || this.player.mode === "spectator";
    if (this.studio.speed) this.player.speedT = Math.max(this.player.speedT, 2);
    if (this.studio.fullbright) this.player.nightT = Math.max(this.player.nightT, 2);
    this.syncHitboxes();
  }

  private tickFire(dt: number) {
    this.fireTimer += dt;
    if (this.fireTimer < 0.5) return;
    this.fireTimer = 0;
    const px = Math.floor(this.player.x);
    const pz = Math.floor(this.player.z);
    const py = Math.floor(this.player.y);
    for (let y = py - 3; y <= py + 4; y++) {
      for (let z = pz - 5; z <= pz + 5; z++) {
        for (let x = px - 5; x <= px + 5; x++) {
          if (this.world.getBlock(x, y, z) !== FIRE) continue;
          if (Math.random() < 0.25) this.world.setBlock(x, y, z, 0);
          else if (Math.random() < 0.2) {
            const nx = x + (Math.random() < 0.5 ? 1 : -1);
            const ny = y + (Math.random() < 0.4 ? 1 : 0);
            const nz = z + (Math.random() < 0.5 ? 1 : -1);
            const t = BLOCKS[this.world.getBlock(nx, ny, nz)];
            if (t?.flammable && this.world.getBlock(nx, ny + 1, nz) === 0) this.world.setBlock(nx, ny + 1, nz, FIRE);
          }
        }
      }
    }
  }

  placeBoat(x: number, y: number, z: number, id: number) {
    if (this.player.mode === "adventure" || this.player.mode === "spectator") return;
    const tint = getDef(id)?.tint ?? 0xb8945a;
    const mesh = makeBoatMesh(tint);
    const by = this.world.highestSolid(x, z) + 0.12;
    const waterHere = isFluid(this.world.getBlock(Math.floor(x), Math.floor(by), Math.floor(z))) ||
      isFluid(this.world.getBlock(Math.floor(x), Math.floor(y), Math.floor(z)));
    const fy = waterHere ? Math.max(y, by) : by;
    mesh.position.set(x, fy, z);
    this.scene.add(mesh);
    this.boats.push({ x, y: fy, z, yaw: this.player.yaw, vx: 0, vz: 0, vy: 0, mesh, occupied: false, tint });
    if (this.player.mode !== "creative") this.player.takeSelected(1);
    this.audio.place();
    this.toastMsg("Boat placed. Use it to board.");
  }

  tryMountBoat(): boolean {
    if (this.player.riding) return false;
    for (const b of this.boats) {
      if (Math.hypot(this.player.x - b.x, this.player.z - b.z) < 1.85 && Math.abs(this.player.y - b.y) < 2.2) {
        this.player.riding = true;
        b.occupied = true;
        this.player.x = b.x;
        this.player.y = b.y + 0.4;
        this.player.z = b.z;
        this.player.vx = 0;
        this.player.vz = 0;
        this.player.vy = 0;
        return true;
      }
    }
    return false;
  }

  private tickBoats(dt: number, input: ReturnType<Input["poll"]>) {
    for (const b of this.boats) {
      if (b.occupied && !this.player.riding) {
        b.occupied = false;
        this.player.vy = 7.6;
        this.player.onGround = false;
      }
      const bx = Math.floor(b.x);
      const bz = Math.floor(b.z);
      const feet = this.world.getBlock(bx, Math.floor(b.y), bz);
      const below = this.world.getBlock(bx, Math.floor(b.y - 0.3), bz);
      const inWater = isFluid(feet) || isFluid(below) || BLOCKS[below]?.fluid === 1 || BLOCKS[feet]?.fluid === 1;
      if (b.occupied && this.player.riding) {
        const steer = -input.moveX;
        const speed = Math.hypot(b.vx, b.vz);
        const factor = Math.max(0.22, Math.min(1, speed / 3.4));
        b.yaw += steer * 2.35 * factor * dt;
        const fx = -Math.sin(b.yaw);
        const fz = -Math.cos(b.yaw);
        const max = inWater ? 8.4 : 1.35;
        const acc = inWater ? 11 : 2.4;
        b.vx += fx * input.moveY * acc * dt;
        b.vz += fz * input.moveY * acc * dt;
        const sp = Math.hypot(b.vx, b.vz);
        if (sp > max) {
          b.vx *= max / sp;
          b.vz *= max / sp;
        }
        b.vx *= inWater ? Math.max(0, 1 - 0.55 * dt) : Math.max(0, 1 - 3.2 * dt);
        b.vz *= inWater ? Math.max(0, 1 - 0.55 * dt) : Math.max(0, 1 - 3.2 * dt);
        if (!this.player.riding) {
          b.occupied = false;
          this.player.vy = 6.2;
        }
      } else {
        b.occupied = false;
        b.vx *= Math.max(0, 1 - 1.8 * dt);
        b.vz *= Math.max(0, 1 - 1.8 * dt);
      }
      b.x += b.vx * dt;
      b.z += b.vz * dt;
      const ground = this.world.highestSolid(b.x, b.z);
      let surf = ground + 0.08;
      let water = false;
      for (let y = Math.floor(ground) + 1; y < Math.floor(ground) + 10; y++) {
        if (isFluid(this.world.getBlock(Math.floor(b.x), y, Math.floor(b.z)))) {
          water = true;
          surf = y + 0.12;
        } else break;
      }
      if (water) {
        b.y += (surf - b.y) * Math.min(1, 8 * dt);
        b.vy = 0;
      } else {
        b.vy -= 22 * dt;
        b.y += b.vy * dt;
        if (b.y < ground + 0.08) {
          b.y = ground + 0.08;
          b.vy = 0;
        }
      }
      if (b.occupied && this.player.riding) {
        this.player.x = b.x;
        this.player.y = b.y + 0.42;
        this.player.z = b.z;
        this.player.vx = b.vx;
        this.player.vz = b.vz;
        this.player.vy = 0;
        this.player.onGround = true;
        this.player.inWater = false;
      }
      b.mesh.position.set(b.x, b.y, b.z);
      b.mesh.rotation.y = b.yaw;
      b.mesh.rotation.z = Math.sin(b.x * 0.4 + this.worldTime * 2) * (inWater ? 0.04 : 0);
    }
  }

  placeCart(x: number, y: number, z: number) {
    const mesh = makeCartMesh();
    const gx = Math.floor(x);
    const gz = Math.floor(z);
    let fy = this.world.highestSolid(x, z) + 0.2;
    for (let yy = Math.floor(y) + 2; yy >= Math.floor(y) - 2; yy--) {
      if (isRail(this.world.getBlock(gx, yy, gz))) {
        fy = yy + 0.2;
        break;
      }
    }
    mesh.position.set(x, fy, z);
    this.scene.add(mesh);
    this.carts.push({ x, y: fy, z, yaw: this.player.yaw, vx: 0, vz: 0, mesh, occupied: false });
    if (this.player.mode !== "creative") this.player.takeSelected(1);
    this.audio.place();
    this.toastMsg("Minecart placed. Use it on rails.");
  }

  tryMountCart(): boolean {
    if (this.player.riding) return false;
    for (const c of this.carts) {
      if (Math.hypot(this.player.x - c.x, this.player.z - c.z) < 1.6 && Math.abs(this.player.y - c.y) < 2) {
        this.player.riding = true;
        c.occupied = true;
        this.player.x = c.x;
        this.player.y = c.y + 0.45;
        this.player.z = c.z;
        this.player.vx = 0;
        this.player.vz = 0;
        this.player.vy = 0;
        return true;
      }
    }
    return false;
  }

  private tickCarts(dt: number, input: ReturnType<Input["poll"]>) {
    for (const c of this.carts) {
      if (c.occupied && !this.player.riding) c.occupied = false;
      const bx = Math.floor(c.x);
      const bz = Math.floor(c.z);
      const by = Math.floor(c.y);
      const here = this.world.getBlock(bx, by, bz);
      const below = this.world.getBlock(bx, by - 1, bz);
      const onRail = isRail(here) || isRail(below);
      const powered = (BLOCKS[here]?.key ?? "").includes("powered") || (BLOCKS[below]?.key ?? "").includes("powered");
      if (c.occupied && this.player.riding) {
        const fx = -Math.sin(this.player.yaw);
        const fz = -Math.cos(this.player.yaw);
        const acc = onRail ? (powered ? 22 : 14) : 2;
        const max = onRail ? (powered ? 16 : 11) : 1.2;
        c.vx += fx * input.moveY * acc * dt;
        c.vz += fz * input.moveY * acc * dt;
        const sp = Math.hypot(c.vx, c.vz);
        if (sp > max) {
          c.vx *= max / sp;
          c.vz *= max / sp;
        }
        if (onRail && Math.abs(fx) >= Math.abs(fz)) c.vz *= 0.2;
        else if (onRail) c.vx *= 0.2;
      }
      c.vx *= Math.max(0, 1 - (onRail ? 0.35 : 4) * dt);
      c.vz *= Math.max(0, 1 - (onRail ? 0.35 : 4) * dt);
      c.x += c.vx * dt;
      c.z += c.vz * dt;
      const ground = this.world.highestSolid(c.x, c.z);
      c.y = ground + (onRail ? 0.22 : 0.18);
      if (c.occupied && this.player.riding) {
        this.player.x = c.x;
        this.player.y = c.y + 0.5;
        this.player.z = c.z;
        this.player.vx = c.vx;
        this.player.vz = c.vz;
        this.player.vy = 0;
        this.player.onGround = true;
      }
      c.mesh.position.set(c.x, c.y, c.z);
      c.mesh.rotation.y = Math.atan2(-c.vx, -c.vz);
    }
  }

  private tickMechanics(_dt: number) {
    const px = Math.floor(this.player.x);
    const py = Math.floor(this.player.y);
    const pz = Math.floor(this.player.z);
    const extra = new Set<string>(this.platePower);
    const standing = posKey(px, py - 1, pz);
    const feetId = this.world.getBlock(px, py, pz);
    const belowId = this.world.getBlock(px, py - 1, pz);
    if (blockKind(feetId) === "plate" || blockKind(belowId) === "plate") {
      extra.add(standing);
      extra.add(posKey(px, py, pz));
      extra.add(posKey(px, py - 1, pz));
    }
    const sources = collectPowerSources(this.world, px, py, pz, extra);
    const powered = propagateDust(this.world, sources, px, py, pz);
    applyLamps(this.world, powered, px, py, pz);
  }

  drinkPotion(id: number) {
    if (id === POTION_NIGHT) this.player.nightT = 60;
    if (id === POTION_SPEED) this.player.speedT = 30;
    if (id === POTION_FIRE) this.player.fireResT = 45;
    if (id === POTION_HEAL) this.player.health = Math.min(20, this.player.health + 8);
    if (id === POTION_STRENGTH) this.player.strengthT = 30;
    if (id === POTION_WATER) this.player.waterBreathT = 45;
    if (id === POTION_LEAP) this.player.jumpBoostT = 30;
    if (id === POTION_REGEN) this.player.regenT = 12;
    if (id === POTION_INVIS) this.player.invisT = 20;
    if (id === SPLASH_HARM) {
      this.player.hurtBy(6, "potion");
      for (const m of this.mobs) {
        if (Math.hypot(m.x - this.player.x, m.z - this.player.z) < 4) m.hp -= 8;
      }
    }
    if (this.player.mode !== "creative") this.player.takeSelected(1);
    this.player.give(10133, 1);
    this.audio.eat();
    this.toastMsg(getDef(id)?.name ?? "Potion");
  }

  chorusWarp() {
    const ang = Math.random() * Math.PI * 2;
    const dist = 6 + Math.random() * 10;
    this.player.x += Math.cos(ang) * dist;
    this.player.z += Math.sin(ang) * dist;
    const safe = this.world.findSafeSpawn(this.player.x, this.player.z);
    this.player.x = safe.x;
    this.player.y = safe.y;
    this.player.z = safe.z;
    this.burst(this.player.x, this.player.y + 1, this.player.z, 0x8a5aa0);
    this.audio.portal();
    this.toastMsg("Warped.");
  }

  explode(x: number, y: number, z: number, r: number) {
    this.audio.explode();
    if (this.modRules.mobGriefing !== false) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dz = -r; dz <= r; dz++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy + dz * dz > r * r) continue;
          const bx = Math.floor(x + dx), by = Math.floor(y + dy), bz = Math.floor(z + dz);
          const id = this.world.getBlock(bx, by, bz);
          if (id && BLOCKS[id]?.hardness >= 0 && BLOCKS[id]!.hardness < 20) this.world.setBlock(bx, by, bz, 0);
        }
      }
    }
    }
    const d = Math.hypot(this.player.x - x, this.player.y - y, this.player.z - z);
    if (d < r + 1) {
      this.player.hurtBy((r + 1 - d) * 6, "explode");
      this.trauma = Math.min(1, this.trauma + 0.55);
    }
    this.burst(x, y, z, 0xc45c4a);
  }

  killMob(m: Mob) {
    m.dead = true;
    disposeMob(m, this.scene);
    this.addXp(m.hostile ? 8 : 2);
    this.player.kills++;
    this.runScripts("kill");
    if (m.kind === "creeper") this.grant("monster_hunter");
    if (m.kind === "pig" || m.kind === "cow") this.player.give(m.kind === "cow" ? 10050 : 10052, 1);
    if (m.kind === "chicken") this.player.give(10054, 1);
    if (m.kind === "zombie") this.player.give(10118, 1);
    if (m.kind === "skeleton") this.player.give(10033, 2);
    if (m.kind === "enderman") this.player.give(10061, 1);
    if (m.kind === "duelist") {
      this.dualKills++;
      this.grant("dual_first_blood");
      const next = Math.min(100, this.dualLevel + 1);
      if (this.dualLevel >= 100) {
        this.grant("dual_century");
        this.toastMsg("Dual Master — level 100 cleared.");
        this.audio.levelup();
      } else {
        this.dualLevel = next;
        const p = useApp.getState().profile;
        useApp.getState().setProfile({
          dualLevel: this.dualLevel,
          dualBest: Math.max(p.dualBest || 1, this.dualLevel),
        });
        if (this.dualLevel >= 10) this.grant("dual_ten");
        if (this.dualLevel >= 50) this.grant("dual_fifty");
        this.audio.levelup();
        this.toastMsg(`Level ${this.dualLevel} — the next fighter is faster.`);
      }
      this.player.health = 20;
      this.player.hunger = 20;
      this.giveArenaKit(false);
      const gen = ++this.botSpawnGen;
      setTimeout(() => {
        if (!this.running || gen !== this.botSpawnGen) return;
        this.resetDuelBot();
      }, 1400);
    }
  }

  attackDamage() {
    let d = getDef(this.player.selected?.id ?? 0)?.damage ?? 1;
    if (this.player.strengthT > 0) d += 3;
    if (this.player.selected?.id === MACE && this.player.vy < -0.4) d += Math.min(12, Math.abs(this.player.vy) * 1.6);
    return d;
  }

  tryMelee(dir: { x: number; y: number; z: number }) {
    this.player.swing = 1;
    const cd = this.player.attackCdMax <= 0 ? 1 : 1 - this.player.attackCd / this.player.attackCdMax;
    const factor = 0.2 + 0.8 * cd * cd;
    const crit = !this.player.onGround && this.player.vy < -0.15 && cd > 0.85;
    const dmg = this.attackDamage() * factor * (crit ? 1.5 : 1);
    const sprintKb = this.player.sprinting ? 2.4 : 0;
    const duel = this.meta.arena === "duel";
    const kb = {
      x: dir.x * ((duel ? 2.6 : 4.4) + sprintKb) * factor,
      y: duel ? 0.45 : crit ? 1.35 : 0.85,
      z: dir.z * ((duel ? 2.6 : 4.4) + sprintKb) * factor,
    };
    const mob = hitMob(
      this.mobs,
      this.player.x + dir.x * 2.1,
      this.player.eyeY() + dir.y * 2.1,
      this.player.z + dir.z * 2.1,
      dmg,
      kb,
    );
    this.player.attackCd = this.player.attackCdMax;
    this.audio.swing();
    const tool = getDef(this.player.selected?.id ?? 0);
    if (tool?.tool === "axe" && mob?.blocking) {
      mob.blocking = false;
      this.toastMsg("Shield disabled!");
    }
    if (mob) {
      this.audio.hit();
      this.camPunch = crit ? 0.32 : 0.14;
      this.hitFlash = 0.18;
      this.trauma = Math.min(1, this.trauma + (crit ? 0.28 : 0.14));
      this.hitstop = crit ? 0.055 : 0.02;
      this.burst(mob.x, mob.y + 1, mob.z, crit ? 0xfff1a8 : 0xc45c4a);
      if (mob.hp <= 0) this.killMob(mob);
    }
  }

  throwPearl(dir: { x: number; y: number; z: number }) {
    if (this.meta.arena === "duel") {
      this.toastMsg("No pearls in Dual.");
      return;
    }
    const s = this.player.selected;
    if (!s || s.id !== ENDER_PEARL) return;
    if (this.player.mode !== "creative") this.player.takeSelected(1);
    this.spawnShot("pearl", dir, 22, 0);
    this.audio.pearl();
  }

  throwEye(dir: { x: number; y: number; z: number }) {
    const s = this.player.selected;
    if (!s || s.id !== EYE_OF_ENDER) return;
    if (this.player.mode !== "creative") this.player.takeSelected(1);
    const sh = strongholdChunk(this.meta.seed);
    const tx = sh.cx * CHUNK_W + 8;
    const tz = sh.cz * CHUNK_W + 8;
    const dx = tx - this.player.x;
    const dz = tz - this.player.z;
    const len = Math.hypot(dx, dz) || 1;
    this.spawnShot("eye", { x: dx / len, y: 0.35, z: dz / len }, 10, 0);
    this.toastMsg("The eye floats toward the stronghold.");
    this.audio.pearl();
    void dir;
  }

  boostElytra() {
    if (!this.player.gliding) {
      if (this.player.armor[1]?.id === 10106 && !this.player.onGround) {
        this.player.gliding = true;
      } else {
        this.toastMsg("Equip elytra and jump, then boost.");
        return;
      }
    }
    const look = this.player.lookDir();
    this.player.vx += look.x * 16;
    this.player.vy += Math.max(7.5, look.y * 14);
    this.player.vz += look.z * 16;
    this.player.onGround = false;
    if (this.player.mode !== "creative") this.player.takeSelected(1);
    this.burst(this.player.x, this.player.y, this.player.z, 0xc43030);
    this.audio.explode();
    this.grant("sky_is_limit");
  }

  shootBow(dir: { x: number; y: number; z: number }, charge: number) {
    const held = this.player.selected?.id ?? 0;
    const creative = this.player.mode === "creative";
    if (!creative && !this.player.hasItem(ARROW)) {
      this.toastMsg("No arrows.");
      return;
    }
    if (!creative) this.player.takeItem(ARROW, 1);
    const power = 18 + charge * 28;
    const dmg = 2 + charge * (held === CROSSBOW ? 8 : 7);
    this.spawnShot("arrow", dir, power, dmg);
    this.audio.bow();
    this.grant("take_aim");
    if (held === CROSSBOW) this.grant("ol_betsy");
  }

  spawnShot(kind: "arrow" | "pearl" | "eye", dir: { x: number; y: number; z: number }, speed: number, dmg: number) {
    const geo =
      kind === "arrow"
        ? new THREE.CylinderGeometry(0.03, 0.03, 0.55, 5)
        : new THREE.SphereGeometry(kind === "eye" ? 0.16 : 0.14, 8, 8);
    const mat = new THREE.MeshLambertMaterial({
      color: kind === "arrow" ? 0xc8c0b0 : kind === "eye" ? 0x5adce6 : 0x1a6a5a,
      emissive: kind === "arrow" ? 0x000000 : kind === "eye" ? 0x3aa8b0 : 0x0a3a32,
      emissiveIntensity: kind === "arrow" ? 0 : 0.5,
    });
    const mesh = new THREE.Mesh(geo, mat);
    if (kind === "arrow") geo.rotateX(Math.PI / 2);
    const x = this.player.x + dir.x * 0.6;
    const y = this.player.eyeY();
    const z = this.player.z + dir.z * 0.6;
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
    this.shots.push({
      kind,
      x,
      y,
      z,
      vx: dir.x * speed,
      vy: dir.y * speed + (kind === "pearl" ? 1.6 : 0.4),
      vz: dir.z * speed,
      life: kind === "eye" ? 4 : 3.2,
      dmg,
      mesh,
    });
  }

  private tickShots(dt: number) {
    for (const s of this.shots) {
      s.life -= dt;
      if (s.kind !== "eye") s.vy -= 18 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.z += s.vz * dt;
      s.mesh.position.set(s.x, s.y, s.z);
      if (s.kind === "arrow") s.mesh.lookAt(s.x + s.vx, s.y + s.vy, s.z + s.vz);
      const hitBlock = this.world.getBlock(Math.floor(s.x), Math.floor(s.y), Math.floor(s.z));
      if (hitBlock && BLOCKS[hitBlock]?.solid) {
        s.life = 0;
        if (s.kind === "pearl") this.landPearl(s.x, s.y + 0.4, s.z);
        continue;
      }
      if (s.kind === "arrow") {
        const mob = hitMob(this.mobs, s.x, s.y, s.z, s.dmg, { x: s.vx * 0.08, y: 0.35, z: s.vz * 0.08 });
        if (mob) {
          s.life = 0;
          this.audio.hit();
          this.grant("sniper_duel");
          this.burst(mob.x, mob.y + 1, mob.z, 0xc45c4a);
          if (mob.hp <= 0) this.killMob(mob);
        }
      }
    }
    const keep = [];
    for (const s of this.shots) {
      if (s.life > 0 && s.y > 0) {
        keep.push(s);
        continue;
      }
      if (s.kind === "pearl" && s.y > 1) this.landPearl(s.x, Math.max(2, s.y), s.z);
      this.scene.remove(s.mesh);
      s.mesh.geometry.dispose();
      if (s.mesh.material instanceof THREE.Material) s.mesh.material.dispose();
    }
    this.shots = keep;
  }

  private landPearl(x: number, y: number, z: number) {
    this.player.x = x;
    this.player.y = Math.max(1, y);
    this.player.z = z;
    this.player.hurtBy(2.5, "pearl");
    this.burst(x, y, z, 0x1a6a5a);
    this.audio.pearl();
  }

  private syncHitboxes() {
    if (!this.hitboxGeo) this.hitboxGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
    const ents: { x: number; y: number; z: number; w: number; h: number; d: number; color: number }[] = [];
    if (this.studio.hitboxes) {
      ents.push({ x: this.player.x, y: this.player.y, z: this.player.z, w: 0.6, h: 1.8, d: 0.6, color: 0x5adce6 });
      for (const m of this.mobs) {
        if (m.dead) continue;
        const big = m.kind === "dragon" || m.kind === "wither_storm" || m.kind === "custom_boss";
        ents.push({
          x: m.x,
          y: m.y,
          z: m.z,
          w: big ? 2.4 : 0.7,
          h: big ? 3.2 : 1.8,
          d: big ? 2.4 : 0.7,
          color: m.hostile ? 0xc45c4a : 0x7cc84a,
        });
      }
    }
    while (this.hitboxPool.length < ents.length) {
      const line = new THREE.LineSegments(
        this.hitboxGeo,
        new THREE.LineBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true, opacity: 0.9 }),
      );
      line.renderOrder = 20;
      this.scene.add(line);
      this.hitboxPool.push(line);
    }
    for (let i = 0; i < this.hitboxPool.length; i++) {
      const line = this.hitboxPool[i]!;
      const e = ents[i];
      if (!e) {
        line.visible = false;
        continue;
      }
      line.visible = true;
      line.position.set(e.x, e.y + e.h / 2, e.z);
      line.scale.set(e.w, e.h, e.d);
      const mat = line.material as THREE.LineBasicMaterial;
      mat.color.setHex(e.color);
    }
  }

  addXp(n: number) {
    if (this.xpBlocked()) return;
    this.player.xp += n;
    const need = 7 + this.player.xpLevel * 2;
    while (this.player.xp >= need) {
      this.player.xp -= need;
      this.player.xpLevel++;
    }
    const p = useApp.getState().profile;
    useApp.getState().setProfile({ xp: p.xp + n });
  }

  xpBlocked() {
    if (this.meta.xpFarm) return true;
    const p = useApp.getState().profile;
    if (this.meta.labGame && this.meta.author && this.meta.author === p.username) return true;
    return false;
  }

  grant(id: string) {
    const p = useApp.getState().profile;
    if (p.unlocked.includes(id)) return;
    const def = ADV_BY_ID.get(id);
    const bonus = def?.xp ?? 15;
    useApp.getState().setProfile({ unlocked: [...p.unlocked, id], xp: p.xp + bonus });
    this.toastMsg("Advancement: " + (def?.name ?? id.replace(/_/g, " ")));
    this.audio.craft();
    this.maybeSpawnEndPortal();
  }

  awardClear() {
    const p = useApp.getState().profile;
    const stars = Math.min(100, (p.stars ?? 0) + 1);
    let diamonds = p.diamonds ?? 0;
    let leftover = stars;
    if (stars > 0 && stars % 5 === 0) diamonds = Math.min(100, diamonds + 1);
    leftover = stars;
    useApp.getState().setProfile({ stars, diamonds, clears: (p.clears ?? 0) + 1 });
    this.toastMsg(`Story clear · ${stars}/100 ★ · ${diamonds}/100 ◆`);
    void leftover;
  }

  beginStorm() {
    if (this.storm || this.killedStorm || this.meta.arena) return;
    const s = spawnMob("wither_storm", this.player.x + 18, this.player.y + 10, this.player.z + 8, this.scene);
    this.storm = s;
    this.mobs.push(s);
    this.toastMsg("The Wither Storm grows. Break the command block in its chest.");
    this.setOverlay("none");
  }

  private maybeSpawnEndPortal() {
    if (this.endPortalPlaced || this.dim !== "overworld" || this.meta.arena) return;
    const unlocked = useApp.getState().profile.unlocked;
    const need = ADVANCEMENTS.filter((a) => !["the_end", "free_the_end", "the_end_again"].includes(a.id));
    if (need.filter((a) => unlocked.includes(a.id)).length < need.length) return;
    this.endPortalPlaced = true;
    const ang = (this.meta.seed % 360) * (Math.PI / 180);
    const tx = Math.floor(this.meta.spawn.x + Math.cos(ang) * 64);
    const tz = Math.floor(this.meta.spawn.z + Math.sin(ang) * 64);
    const ty = Math.max(SEA_LEVEL + 2, this.world.highestSolid(tx, tz) + 1);
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        const edge = Math.abs(dx) === 2 || Math.abs(dz) === 2;
        const corner = Math.abs(dx) === 2 && Math.abs(dz) === 2;
        if (corner) continue;
        if (edge) this.world.setBlock(tx + dx, ty, tz + dz, 59);
        else this.world.setBlock(tx + dx, ty, tz + dz, END_PORTAL);
      }
    }
    this.toastMsg(`The End gate opened ~4 chunks out (${tx}, ${ty}, ${tz}).`);
  }

  toastMsg(m: string) {
    this.toast = m;
    this.toastT = 3;
    this.hooks.onToast(m);
  }

  isNight() {
    if (this.dim !== "overworld") return this.dim === "end";
    const t = (this.worldTime / DAY_LEN) % 1;
    const sunH = Math.sin(t * Math.PI * 2 - Math.PI / 2);
    return sunH < 0.08;
  }

  private burst(x: number, y: number, z: number, color: number) {
    if (!this.settings.particles) return;
    const pos = this.particleGeo.getAttribute("position") as THREE.BufferAttribute;
    const col = this.particleGeo.getAttribute("color") as THREE.BufferAttribute;
    const r = ((color >> 16) & 255) / 255;
    const g = ((color >> 8) & 255) / 255;
    const b = (color & 255) / 255;
    const count = this.settings.graphics === "fast" ? 6 : 14;
    for (let i = 0; i < count; i++) {
      const ix = Math.floor(Math.random() * 256);
      pos.setXYZ(ix, x + (Math.random() - 0.5) * 0.7, y + Math.random() * 0.6, z + (Math.random() - 0.5) * 0.7);
      this.particleVel[ix * 3] = (Math.random() - 0.5) * 3;
      this.particleVel[ix * 3 + 1] = Math.random() * 4 + 1;
      this.particleVel[ix * 3 + 2] = (Math.random() - 0.5) * 3;
      this.particleAges[ix] = 0.7;
      col.setXYZ(ix, r, g, b);
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
  }

  private paintCrack(t: number) {
    const ctx = (this.crackTex.image as HTMLCanvasElement).getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 64, 64);
    ctx.strokeStyle = `rgba(20,16,12,${0.35 + t * 0.55})`;
    ctx.lineWidth = 2;
    const segs = 3 + Math.floor(t * 7);
    for (let i = 0; i < segs; i++) {
      ctx.beginPath();
      ctx.moveTo(32, 32);
      const a = (i / segs) * Math.PI * 2 + t;
      ctx.lineTo(32 + Math.cos(a) * (10 + t * 22), 32 + Math.sin(a) * (10 + t * 22));
      ctx.stroke();
    }
    this.crackTex.needsUpdate = true;
  }

  private render(dt: number) {
    this.time += dt;
    const day = (this.worldTime / DAY_LEN) % 1;
    const sunA = day * Math.PI * 2 - Math.PI / 2;
    const sunH = Math.sin(sunA);
    const px = this.player.x;
    const py = this.player.eyeY();
    const pz = this.player.z;

    this.sun.position.set(px + Math.cos(sunA) * 80, py + sunH * 80, pz + 24);
    this.sun.target.position.set(px, py, pz);
    this.sunMesh.position.set(px + Math.cos(sunA) * 180, py + sunH * 180, pz + 40);
    this.moonMesh.position.set(px - Math.cos(sunA) * 170, py - sunH * 170, pz - 30);

    if (this.dim === "overworld") {
      const dayAmt = Math.max(0, sunH);
      const nightAmt = Math.max(0, -sunH);
      const dusk = 1 - Math.abs(sunH);
      const top = new THREE.Color().setRGB(
        0.18 * nightAmt + 0.29 * dayAmt + 0.55 * dusk * (sunH < 0.2 ? 1 : 0),
        0.08 * nightAmt + 0.56 * dayAmt + 0.22 * dusk,
        0.12 * nightAmt + 0.85 * dayAmt + 0.35 * dusk,
      );
      const bot = new THREE.Color().setRGB(
        0.08 * nightAmt + 0.83 * dayAmt + 0.95 * dusk * 0.7,
        0.1 * nightAmt + 0.9 * dayAmt + 0.48 * dusk,
        0.18 * nightAmt + 1.0 * dayAmt + 0.35 * dusk,
      );
      this.skyUniforms.topColor.value.copy(top);
      this.skyUniforms.bottomColor.value.copy(bot);
      this.fog.color.copy(bot);
      this.sun.intensity = 0.22 + dayAmt * 1.05;
      this.sun.color.setRGB(1, 0.94 - dusk * 0.25, 0.78 - dusk * 0.3);
      this.hemi.intensity = 0.42 + dayAmt * 0.5;
      this.hemi.color.setRGB(0.55 + dayAmt * 0.2, 0.62 + dayAmt * 0.18, 0.85);
      this.stars.visible = this.settings.stars && nightAmt > 0.15;
      (this.stars.material as THREE.PointsMaterial).opacity = Math.min(1, nightAmt * 1.4);
      this.sunMesh.visible = this.settings.sunMoon && dayAmt > -0.1;
      this.moonMesh.visible = this.settings.sunMoon && nightAmt > 0.05;
    } else {
      this.stars.visible = this.settings.stars && this.dim === "end";
    }
    this.scene.fog = this.settings.fog ? this.fog : null;
    if (this.dim === "nether") {
      const cx = Math.floor(this.player.x);
      const cz = Math.floor(this.player.z);
      const ch = this.world.getChunk(Math.floor(cx / CHUNK_W), Math.floor(cz / CHUNK_W));
      const lx = ((cx % CHUNK_W) + CHUNK_W) % CHUNK_W;
      const lz = ((cz % CHUNK_W) + CHUNK_W) % CHUNK_W;
      const bid = biomeAtIndex(ch?.data.biomes[lx + lz * CHUNK_W] ?? 28).id;
      const fogCol: Record<string, number> = {
        nether_wastes: 0x3a0c0c,
        crimson_forest: 0x4a0818,
        warped_forest: 0x082828,
        soul_sand_valley: 0x1a3040,
        basalt_deltas: 0x2a2a28,
      };
      this.fog.color.set(fogCol[bid] ?? 0x8a3a28);
      this.fog.density = bid === "basalt_deltas" ? 0.012 : bid === "soul_sand_valley" ? 0.01 : 0.006;
      this.hemi.intensity = 1.2;
      this.sun.intensity = 0.9;
    } else if (this.dim === "end") {
      this.fog.color.set(0x100c18);
      this.fog.density = 0.004;
      this.hemi.intensity = 0.55;
      this.sun.intensity = 0.32;
    } else {
      this.fog.density = 0.016 / Math.max(2, this.settings.renderDistance);
    }
    this.sky.position.set(px, py, pz);
    this.stars.position.set(px, py, pz);

    const reduced = this.settings.reducedMotion;
    const bob = !reduced && this.settings.viewBob && this.player.onGround ? Math.sin(this.player.bob * 2) * 0.045 : 0;
    const targetFov = this.settings.fov + (this.player.sprinting ? 8 : 0) + (this.player.flying ? 4 : 0);
    this.fovSmoothed += (targetFov - this.fovSmoothed) * (1 - Math.exp(-10 * dt));
    this.camera.fov = this.fovSmoothed;
    this.camera.updateProjectionMatrix();

    this.trauma = Math.max(0, this.trauma - dt * 2.4);
    const shakeAmt = reduced ? 0 : this.trauma * this.trauma * this.settings.screenShake;
    const punch = reduced ? 0 : this.camPunch;
    const sx = (Math.random() - 0.5) * 0.18 * shakeAmt;
    const sy = (Math.random() - 0.5) * 0.18 * shakeAmt - punch * 0.12;
    const sz = (Math.random() - 0.5) * 0.18 * shakeAmt;

    const mode = this.settings.cameraMode;
    const look = this.player.lookDir();
    this.playerBody.visible = mode !== "first" && this.player.invisT <= 0 && this.player.mode !== "spectator";
    this.playerBody.position.set(this.player.x, this.player.y, this.player.z);
    this.playerBody.rotation.y = this.player.yaw;
    this.playerBody.scale.set(1 / this.player.squash, this.player.squash, 1 / this.player.squash);
    const spd = Math.hypot(this.player.vx, this.player.vz);
    swingLimbs(this.playerBody, this.time, 9, Math.min(0.7, spd * 0.12));
    this.hand.visible = mode === "first" && this.settings.heldItem && this.overlay !== "inventory" && this.overlay !== "crafting" && this.overlay !== "furnace" && this.overlay !== "pause" && this.overlay !== "settings";
    const hid = this.player.selected?.id ?? 0;
    if (hid !== this.lastHeld) {
      this.lastHeld = hid;
      const kind = heldKind(hid);
      const item = this.hand.userData.item as THREE.Group | undefined;
      if (item) fillHeld(item, kind, getDef(hid)?.tint ?? 0x5adce6);
      this.dressPlayer(!!this.player.armor[1]);
    }

    if (mode === "first") {
      const wishRoll = this.player.vx !== 0 || this.player.vz !== 0 ? -this.input.actions.moveX * 0.035 : 0;
      this.camRoll += (wishRoll - this.camRoll) * (1 - Math.exp(-10 * dt));
      this.camera.position.set(px + sx, py + bob + sy, pz + sz);
      this.camera.rotation.order = "YXZ";
      this.camera.rotation.y = this.player.yaw;
      this.camera.rotation.x = this.player.pitch;
      this.camera.rotation.z = this.settings.reducedMotion ? 0 : this.camRoll;
    } else {
      const dist = mode === "front" ? 3.2 : 4.2;
      const sign = mode === "front" ? 1 : -1;
      const cx = this.player.x + look.x * dist * sign;
      const cy = this.player.eyeY() + 0.4 + look.y * dist * sign * 0.4;
      const cz = this.player.z + look.z * dist * sign;
      this.camera.position.set(cx + sx, cy + sy, cz + sz);
      this.camera.lookAt(this.player.x, this.player.eyeY(), this.player.z);
    }
    if (this.settings.handBob && mode === "first" && !reduced) {
      this.hand.rotation.x = this.player.swing * -0.75;
      this.hand.rotation.z = Math.sin(this.player.bob) * 0.04;
      this.hand.position.y = Math.sin(this.player.bob * 2) * 0.012;
    } else {
      this.hand.rotation.x = this.player.swing * -0.6;
    }

    this.highlight.visible = this.settings.blockOutline && this.highlight.visible;
    if (this.breaking > 0.05 && this.player.miningPos) {
      this.paintCrack(this.breaking);
      this.crack.visible = true;
      this.crack.position.set(this.player.miningPos.x + 0.5, this.player.miningPos.y + 0.5, this.player.miningPos.z + 0.5);
    } else {
      this.crack.visible = false;
    }

    const ppos = this.particleGeo.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < 256; i++) {
      if ((this.particleAges[i] ?? 0) <= 0) continue;
      this.particleAges[i]! -= dt;
      const ix = i * 3;
      this.particleVel[ix + 1]! -= 14 * dt;
      ppos.setX(i, ppos.getX(i) + this.particleVel[ix]! * dt);
      ppos.setY(i, ppos.getY(i) + this.particleVel[ix + 1]! * dt);
      ppos.setZ(i, ppos.getZ(i) + this.particleVel[ix + 2]! * dt);
    }
    ppos.needsUpdate = true;

    if (this.rain && this.settings.weatherFx && this.weather > 0 && this.dim === "overworld") {
      this.rain.visible = true;
      this.rain.position.set(px, py, pz);
      const rp = this.rainGeo!.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < rp.count; i++) {
        let y = rp.getY(i) - dt * 18;
        if (y < 0) y = 22;
        rp.setY(i, y);
      }
      rp.needsUpdate = true;
    } else if (this.rain) {
      this.rain.visible = false;
    }

    this.clouds.visible = this.settings.clouds && this.dim === "overworld";
    this.clouds.position.x = px + Math.sin(this.worldTime * 0.02) * 24;
    this.clouds.position.z = pz;
    this.clouds.children.forEach((c) => {
      if (c instanceof THREE.Mesh) {
        const mat = c.material as THREE.MeshLambertMaterial;
        mat.opacity = this.isNight() ? 0.25 : 0.62;
      }
    });

    animateAtlas(this.atlas, this.worldTime);
    if (this.settings.particles && this.dim === "nether" && Math.random() < dt * 14) {
      this.burst(px + (Math.random() - 0.5) * 8, py + Math.random() * 4, pz + (Math.random() - 0.5) * 8, 0xf07818);
    }
    if (this.settings.particles && this.dim === "end" && Math.random() < dt * 10) {
      this.burst(px + (Math.random() - 0.5) * 10, py + Math.random() * 5, pz + (Math.random() - 0.5) * 10, 0xe050e0);
    }
    this.renderer.render(this.scene, this.camera);
    if (this.toastT > 0) this.toastT -= dt;
    else this.toast = "";
  }

  private pushHud() {
    const cx = Math.floor(this.player.x);
    const cz = Math.floor(this.player.z);
    const ch = this.world.getChunk(Math.floor(cx / CHUNK_W), Math.floor(cz / CHUNK_W));
    const lx = ((cx % CHUNK_W) + CHUNK_W) % CHUNK_W;
    const lz = ((cz % CHUNK_W) + CHUNK_W) % CHUNK_W;
    const bi = ch?.data.biomes[lx + lz * CHUNK_W] ?? 0;
    const biome = biomeAtIndex(bi).name;
    const snap: HudSnap = {
      health: this.player.health,
      hunger: this.player.hunger,
      xp: this.player.xp,
      xpLevel: this.player.xpLevel,
      air: this.player.air,
      hotbar: this.player.hotbar,
      inventory: this.player.inventory,
      armor: this.player.armor,
      offhand: this.player.offhand,
      selectedName: getDef(this.player.selected?.id ?? 0)?.name ?? "",
      fps: this.fps,
      x: this.player.x,
      y: this.player.y,
      z: this.player.z,
      biome,
      time: this.worldTime,
      dim: this.dim,
      mode: this.player.mode,
      targeting: this.targeting,
      boss: (() => {
        const custom = this.mobs.find((m) => m.kind === "custom_boss" && !m.dead);
        if (this.storm && !this.storm.dead) return { name: "Wither Storm", hp: this.storm.hp, max: this.storm.max };
        if (this.dragon && !this.dragon.dead) return { name: "Void Wyrm", hp: this.dragon.hp, max: this.dragon.max };
        if (custom) return { name: custom.label || "Custom Boss", hp: custom.hp, max: custom.max };
        const wither = this.mobs.find((m) => m.kind === "wither" && !m.dead);
        if (wither) return { name: wither.label || "Wither", hp: wither.hp, max: wither.max };
        return undefined;
      })(),
      wraith: !!this.wraith && !this.wraith.dead,
      chat: this.chat.slice(-6),
      toast: this.toastT > 0 ? this.toast : "",
      hurt: this.player.hurt,
      underwater: this.player.inWater,
      portal: this.portalT,
      mining: this.breaking,
      cameraMode: this.settings.cameraMode,
      crosshair: this.settings.crosshair,
      attackCd: this.player.attackCdMax <= 0 ? 1 : 1 - this.player.attackCd / this.player.attackCdMax,
      absorption: this.player.absorption,
      arena: this.meta.arena,
      kills: this.dualKills,
      dualLevel: this.dualLevel,
      hitFlash: this.hitFlash,
      blocking: this.player.blocking,
      bowCharge: this.bowCharge,
    };
    this.hooks.onHud(snap);
  }

  applySettings(s: Settings) {
    const cloudsChanged = s.clouds !== this.settings.clouds || s.graphics !== this.settings.graphics;
    this.settings = s;
    this.input.sens = s.mouseSens;
    this.input.invertY = s.invertY;
    this.input.invertX = s.invertX;
    this.input.sneakToggle = s.sneakToggle;
    this.input.sprintToggle = s.sprintToggle;
    this.input.touchLookSens = s.touchLookSens;
    this.input.binds = { ...s.binds };
    this.player.autoJump = s.autoJump;
    this.player.difficulty = s.difficulty;
    this.camera.fov = s.fov;
    this.camera.updateProjectionMatrix();
    this.audio.volumes.master = s.volumeMaster;
    this.audio.volumes.sfx = s.volumeSfx;
    this.audio.volumes.music = s.volumeMusic;
    this.audio.applyVol();
    this.renderer.toneMappingExposure = Math.max(0.35, Math.min(2.4, s.brightness * (s.graphics === "rtx" ? 1.12 : 1)));
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, s.pixelRatioCap || 1.5));
    this.renderer.shadowMap.enabled = s.shadows && (s.graphics === "fabulous" || s.graphics === "rtx") && !s.optimized;
    this.renderer.toneMapping = s.graphics === "rtx" ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
    this.sun.castShadow = this.renderer.shadowMap.enabled;
    this.world.setShadows(this.renderer.shadowMap.enabled);
    this.world.setFancyWater(s.fancyWater);
    this.scene.fog = s.fog ? this.fog : null;
    this.stars.visible = s.stars;
    this.sunMesh.visible = s.sunMoon && this.dim === "overworld";
    this.moonMesh.visible = s.sunMoon && this.dim !== "nether";
    if (cloudsChanged) this.buildClouds();
    this.clouds.visible = s.clouds && this.dim === "overworld";
    this.hand.visible = s.heldItem && s.cameraMode === "first";
    if (this.lamp) this.lamp.visible = s.graphics !== "fast";
  }

  async persist() {
    if (!this.ready) return;
    const save: PlayerSave = {
      x: this.player.x,
      y: this.player.y,
      z: this.player.z,
      yaw: this.player.yaw,
      pitch: this.player.pitch,
      dim: this.dim,
      health: this.player.health,
      hunger: this.player.hunger,
      xp: this.player.xp,
      xpLevel: this.player.xpLevel,
      flying: this.player.flying,
      inventory: this.player.inventory,
      armor: this.player.armor,
      offhand: this.player.offhand,
      hotbar: this.player.hotbar,
      time: this.worldTime,
      weather: this.weather,
      killedDragon: this.killedDragon,
      killedStorm: this.killedStorm,
      advancements: useApp.getState().profile.unlocked,
    };
    this.meta.played = Date.now();
    try {
      useApp.getState().upsertWorld(this.meta, { select: false });
    } catch {
      /* store may be gone during teardown */
    }
    await savePlayer(this.meta.id, save);
    await saveChunks(this.meta.id, this.world.edits);
  }

  cheat(cmd: string): string {
    if (!this.meta.cheats && this.player.mode !== "creative") return "Cheats are off.";
    const p = cmd.trim().split(/\s+/);
    const c = (p[0] ?? "").toLowerCase();
    if (c === "/gamemode" || c === "/gm") {
      const m = (p[1] ?? "") as GameMode;
      if (m === "survival" || m === "creative" || m === "hardcore") {
        this.player.mode = m;
        return "Mode: " + m;
      }
    }
    if (c === "/give" && p[1]) {
      const id = Number(p[1]);
      const n = Number(p[2] ?? 1);
      this.player.give(Number.isFinite(id) ? id : 1, n);
      return "Gave " + n;
    }
    if (c === "/tp" && p.length >= 4) {
      this.player.x = Number(p[1]);
      this.player.y = Number(p[2]);
      this.player.z = Number(p[3]);
      return "Teleported.";
    }
    if (c === "/time") {
      if (p[1] === "night") this.worldTime = DAY_LEN * 0.78;
      else if (p[1] === "noon") this.worldTime = DAY_LEN * 0.5;
      else this.worldTime = DAY_LEN * 0.28;
      return "Time set.";
    }
    if (c === "/fly") {
      this.player.flying = !this.player.flying;
      return this.player.flying ? "Flying on." : "Flying off.";
    }
    if (c === "/god") {
      this.player.invincible = !this.player.invincible;
      return this.player.invincible ? "God on." : "God off.";
    }
    if (c === "/heal") {
      this.player.health = 20;
      this.player.hunger = 20;
      return "Restored.";
    }
    if (c === "/seed") return String(this.meta.seed);
    if (c === "/xp") {
      this.addXp(Number(p[1] ?? 10));
      return "XP added.";
    }
    if (c === "/stronghold") {
      const s = strongholdChunk(this.meta.seed);
      return `Stronghold chunk ${s.cx}, ${s.cz}`;
    }
    if (c === "/home") {
      const safe = this.world.findSafeSpawn(this.meta.spawn.x, this.meta.spawn.z);
      this.player.x = safe.x;
      this.player.y = safe.y;
      this.player.z = safe.z;
      return "Returned to spawn.";
    }
    if (c === "/weather") {
      this.weather = p[1] === "clear" ? 0 : 1;
      return this.weather ? "Rain rolls in." : "Skies clear.";
    }
    if (c === "/difficulty" && p[1]) {
      const d = p[1] as Settings["difficulty"];
      if (d === "peaceful" || d === "easy" || d === "normal" || d === "hard") {
        this.settings.difficulty = d;
        this.player.difficulty = d;
        useApp.getState().setSettings({ difficulty: d });
        return "Difficulty: " + d;
      }
    }
    if (c === "/nether" || (c === "/dim" && p[1] === "nether")) {
      this.changeDim("nether");
      return "The Nether.";
    }
    if (c === "/end" || (c === "/dim" && p[1] === "end")) {
      this.changeDim("end");
      return "The End.";
    }
    if (c === "/overworld" || (c === "/dim" && p[1] === "overworld")) {
      this.changeDim("overworld");
      return "Overworld.";
    }
    if (c === "/setblock" && p.length >= 5) {
      const x = Math.floor(Number(p[1]));
      const y = Math.floor(Number(p[2]));
      const z = Math.floor(Number(p[3]));
      const id = Number(p[4]);
      if (Number.isFinite(id) && id >= 0) {
        this.world.setBlock(x, y, z, id);
        return `Set ${x} ${y} ${z} to ${id}`;
      }
    }
    return "Unknown command.";
  }

  installControlsTest() {
    window.__controlsTest = {
      getYaw: () => this.player.yaw,
      getSpeed: () => Math.hypot(this.player.vx, this.player.vz),
      setKeys: (codes: string[]) => this.input.setKeys(codes),
      getPosition: () => ({ x: this.player.x, y: this.player.y, z: this.player.z }),
    };
  }

  dispose() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.input.detach();
    window.removeEventListener("resize", this.onResize);
    document.removeEventListener("visibilitychange", this.onHideSave);
    window.removeEventListener("pagehide", this.onHideSave);
    if (this.ready) void this.persist();
    this.ready = false;
    for (const m of this.mobs) disposeMob(m, this.scene);
    this.world.dispose();
    this.atlas.texture.dispose();
    this.renderer.dispose();
    delete window.__controlsTest;
  }
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      setKeys: (codes: string[]) => void;
      getPosition: () => { x: number; y: number; z: number };
    };
    __moc?: Engine;
  }
}

