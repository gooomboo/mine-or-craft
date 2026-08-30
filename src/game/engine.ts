import * as THREE from "three";
import { animateAtlas, createAtlas, type Atlas } from "./atlas";
import { BLOCKS, COBBLE, CRAFTING_TABLE, END_PORTAL, FIRE, FURNACE, LAVA, NETHER_PORTAL, OBSIDIAN, WATER } from "./blocks";
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
  WATER_BUCKET,
  COOKED_BEEF,
  DIAMOND_HELM,
  DIAMOND_CHEST,
  DIAMOND_LEGS,
  DIAMOND_BOOTS,
  DIAMOND_AXE,
  LAVA_BUCKET,
  FISHING_ROD,
} from "./items";
import { disposeMob, hitMob, spawnMob, trySpawn, updateMobs, type Mob } from "./mobs";
import { addHeld, addHumanoid, buildViewArm, fillHeld, heldKind, hexNum, swingLimbs } from "./models";
import { SKIN_PRESETS } from "./skins";
import { Player } from "./player";
import { voxelRay } from "./raycast";
import { saveChunks, savePlayer } from "./save";
import { CHUNK_W, type Dim, type GameMode, type PlayerSave, type Settings, type WorldMeta } from "./types";
import { World } from "./world";
import { useApp, type HudSnap, type Overlay } from "@/store/app-store";

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
  clouds: THREE.Group;
  particles: THREE.Points;
  particleGeo: THREE.BufferGeometry;
  particleAges: number[] = [];
  mobs: Mob[] = [];
  spawnTimer = 0;
  fluidTimer = 0;
  fireTimer = 0;
  saveTimer = 0;
  afk = 0;
  wraith: Mob | null = null;
  dragon: Mob | null = null;
  killedDragon = false;
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
    this.renderer.shadowMap.enabled = settings.shadows && settings.graphics === "fabulous";
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
    this.atlas = createAtlas();
    this.world = new World(this.scene, this.atlas, meta.seed);
    this.world.arena = meta.arena ?? null;
    this.world.setFancyWater(settings.fancyWater);
    this.world.setShadows(settings.shadows && settings.graphics === "fabulous");
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

    this.hand = buildViewArm(0xc4a06a);
    this.camera.add(this.hand);
    this.scene.add(this.camera);

    this.playerBody = new THREE.Group();
    const skinId = useApp.getState().profile.skin;
    const skin =
      SKIN_PRESETS.find((s) => s.id === skinId) ?? SKIN_PRESETS[0]!;
    addHumanoid(this.playerBody, {
      skin: hexNum(skin.skin),
      shirt: hexNum(skin.shirt),
      pants: hexNum(skin.pants),
      hair: hexNum(skin.hair),
      shoes: 0x1a1a1a,
      eyes: 0x1a2a4a,
    });
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
    let spawn = findSpawn(this.meta.seed, this.world.noises);
    if (this.meta.arena === "duel") spawn = { x: 0.5, y: 34, z: -16.5 };
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
      this.player.inventory = save.inventory;
      this.player.armor = save.armor;
      this.player.offhand = save.offhand;
      this.player.hotbar = save.hotbar;
      this.player.dim = save.dim;
      this.player.flying = save.flying && this.meta.mode === "creative";
      this.worldTime = save.time;
      this.weather = save.weather;
      this.killedDragon = save.killedDragon;
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
      this.settings.renderDistance,
      this.dim,
      this.hooks.onProgress,
    );
    const slices = 36;
    for (let i = 0; i < slices; i++) {
      this.world.processBuilds(8, this.settings.ao);
      this.hooks.onProgress?.(`Carving chunks ${i + 1}/${slices}`, 0.5 + 0.5 * ((i + 1) / slices));
      await new Promise((r) => setTimeout(r, 0));
    }
    if (!save) {
      this.player.y = this.world.highestSolid(this.player.x, this.player.z) + 2;
    }
    this.applyDimVisuals();
    if (this.meta.arena === "duel") {
      this.giveDuelKit(!!save);
      const bot = spawnMob("duelist", 0.5, this.world.highestSolid(0.5, 16.5) + 1, 16.5, this.scene);
      this.mobs.push(bot);
      this.toastMsg("DUAL — fight with sword, shield, and golden apples.");
      this.chat.push("Official server Dual, hosted by Mods. Last fighter standing.");
    }
    this.running = true;
    this.last = performance.now();
    this.loop(this.last);
    this.installControlsTest();
    this.chat.push("Welcome to Mine or Craft.");
    if (this.meta.arena !== "duel") this.chat.push("Punch a tree. Craft a bench. Survive the night.");
  }

  giveDuelKit(keepIfFilled: boolean) {
    if (keepIfFilled && this.player.inventory.some((s) => s)) return;
    this.player.inventory = Array.from({ length: 36 }, () => null);
    this.player.give(DIAMOND_SWORD, 1);
    this.player.give(DIAMOND_AXE, 1);
    this.player.give(GOLDEN_APPLE, 8);
    this.player.give(BOW, 1);
    this.player.give(ARROW, 32);
    this.player.give(ENDER_PEARL, 16);
    this.player.give(COBBLE, 64);
    this.player.give(WATER_BUCKET, 1);
    this.player.give(LAVA_BUCKET, 1);
    this.player.give(FISHING_ROD, 1);
    this.player.give(COOKED_BEEF, 16);
    this.player.give(FLINT_STEEL, 1);
    this.player.offhand = { id: SHIELD, count: 1 };
    this.player.armor = [
      { id: DIAMOND_HELM, count: 1 },
      { id: DIAMOND_CHEST, count: 1 },
      { id: DIAMOND_LEGS, count: 1 },
      { id: DIAMOND_BOOTS, count: 1 },
    ];
    this.player.hotbar = 0;
    this.player.health = 20;
    this.player.hunger = 20;
    this.player.absorption = 0;
    this.dressPlayer(true);
  }

  dressPlayer(armored: boolean) {
    const skinId = useApp.getState().profile.skin;
    const skin = SKIN_PRESETS.find((s) => s.id === skinId) ?? SKIN_PRESETS[0]!;
    while (this.playerBody.children.length) this.playerBody.remove(this.playerBody.children[0]!);
    addHumanoid(this.playerBody, {
      skin: hexNum(skin.skin),
      shirt: armored ? 0x5adce6 : hexNum(skin.shirt),
      pants: armored ? 0x3aa8b0 : hexNum(skin.pants),
      hair: hexNum(skin.hair),
      shoes: armored ? 0x5adce6 : 0x1a1a1a,
      eyes: 0x1a2a4a,
      helm: armored ? 0x5adce6 : undefined,
      chest: armored ? 0x5adce6 : undefined,
      boots: armored ? 0x5adce6 : undefined,
    });
    const kind = heldKind(this.player.selected?.id ?? 0);
    addHeld(this.playerBody, kind, getDef(this.player.selected?.id ?? 0)?.tint ?? 0x5adce6);
  }

  applyDimVisuals() {
    if (this.dim === "nether") {
      this.fog.color.set(0x3a0c0c);
      this.skyUniforms.topColor.value.set(0x2a0808);
      this.skyUniforms.bottomColor.value.set(0x4a1810);
      this.hemi.color.set(0xaa3333);
      this.hemi.groundColor.set(0x220808);
      this.sun.intensity = 0.28;
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
        this.dragon = spawnMob("dragon", 20, 64, 0, this.scene);
        this.mobs.push(this.dragon);
      }
    } else {
      this.fog.color.set(0x87b4e0);
      this.skyUniforms.topColor.value.set(0x4a90d9);
      this.skyUniforms.bottomColor.value.set(0xd4ecff);
      this.hemi.color.set(0xbfd4ff);
      this.hemi.groundColor.set(0x3a2a18);
      this.sun.intensity = 1.15;
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
      this.last = performance.now();
    }
  }

  setOverlay(o: Overlay) {
    this.overlay = o;
    this.setPaused(o !== "none" && o !== "locked");
    this.hooks.onOverlay(o);
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
    if (input.moveX || input.moveY || input.lookX || input.lookY || input.jump || input.attack) {
      this.afk = 0;
      this.lastInput = now;
    } else {
      this.afk += dt;
    }

    if (input.justPause) {
      this.setOverlay(this.overlay === "pause" ? "none" : "pause");
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
    this.worldTime += dt;
    this.player.update(dt, input, this.world);
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

    if (input.justAttack) this.tryMelee(look);
    if (input.attack && hit && this.player.mode !== "creative") {
      this.mine(hit, dt);
    } else if (input.justAttack && hit && this.player.mode === "creative") {
      this.breakBlock(hit.x, hit.y, hit.z);
    } else if (!input.attack) {
      this.breaking = 0;
      this.player.miningPos = null;
    }
    if (input.justUse) {
      if (this.player.selected?.id === ENDER_PEARL) this.throwPearl(look);
      else if (hit) this.use(hit);
      else this.player.eat();
    }

    if (this.player.onGround && !this.wasOnGround) {
      this.burst(this.player.x, this.player.y + 0.1, this.player.z, 0xc4b48a);
      this.trauma = Math.min(1, this.trauma + 0.08);
      this.player.squash = 0.72;
    }
    if (this.player.sprinting && this.player.onGround && Math.random() < dt * 8) {
      this.burst(this.player.x, this.player.y + 0.05, this.player.z, 0xc4b48a);
    }
    this.wasOnGround = this.player.onGround;
    this.camPunch = Math.max(0, this.camPunch - dt * 3.2);
    this.hitFlash = Math.max(0, this.hitFlash - dt * 4);

    if (input.justDrop) {
      this.player.takeSelected(1);
    }

    this.tickMobs(dt);
    this.tickFluids(dt);
    this.tickFire(dt);
    this.tickPortal(dt);
    this.tickWraith(dt);
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
      this.hooks.onDeath();
      this.setOverlay("dead");
    }
    if (this.player.hurt > 0.35 && this.player.lastHurtAmt > 0.4) {
      this.trauma = Math.min(1, this.trauma + Math.min(0.45, this.player.lastHurtAmt * 0.12));
      this.player.lastHurtAmt = 0;
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
    const id = this.world.getBlock(x, y, z);
    const def = BLOCKS[id];
    if (!def || def.hardness < 0) return;
    this.world.setBlock(x, y, z, 0);
    this.audio.break();
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
    if (id === CRAFTING_TABLE) {
      this.setOverlay("crafting");
      return;
    }
    if (id === FURNACE) {
      this.setOverlay("furnace");
      return;
    }
    const held = this.player.selected;
    if (held?.id === FLINT_STEEL) {
      this.world.setBlock(hit.x + hit.nx, hit.y + hit.ny, hit.z + hit.nz, FIRE);
      this.tryLightPortal(hit.x + hit.nx, hit.y + hit.ny, hit.z + hit.nz);
      this.audio.place();
      return;
    }
    if (this.player.eat()) {
      this.audio.pop();
      return;
    }
    const def = getDef(held?.id ?? 0);
    const placeId = def?.place ?? (held && held.id < ITEM_BASE ? held.id : 0);
    if (placeId && placeId > 0) {
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
      this.world.setBlock(px, py, pz, placeId);
      this.audio.place();
      if (this.player.mode !== "creative") this.player.takeSelected(1);
      this.player.swing = 1;
    }
  }

  private tryLightPortal(x: number, y: number, z: number) {
    const isObs = (xx: number, yy: number, zz: number) => this.world.getBlock(xx, yy, zz) === OBSIDIAN;
    for (const axis of ["x", "z"] as const) {
      for (let oy = -1; oy >= -5; oy--) {
        const by = y + oy;
        let w = 0;
        if (axis === "x") {
          while (isObs(x - w - 1, by, z) === false && w < 6) {
            /* scan empty */
            if (this.world.getBlock(x - w - 1, by, z) !== 0 && this.world.getBlock(x - w - 1, by, z) !== FIRE) break;
            w++;
          }
        }
      }
    }
    // 4x5 inner portal: check a small frame around the fire
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -1; dy <= 4; dy++) {
        const fx = x + dx;
        const fy = y + dy;
        const edge = dx === -2 || dx === 2 || dy === -1 || dy === 4;
        if (edge && !isObs(fx, fy, z) && Math.abs(dx) + Math.abs(dy) > 0) {
          /* not a complete x-axis frame */
        }
      }
    }
    let okX = true;
    for (let dx = -1; dx <= 2; dx++) {
      if (!isObs(x + dx, y - 1, z) || !isObs(x + dx, y + 3, z)) okX = false;
    }
    for (let dy = 0; dy < 3; dy++) {
      if (!isObs(x - 1, y + dy, z) || !isObs(x + 2, y + dy, z)) okX = false;
    }
    if (okX) {
      for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 3; dy++) this.world.setBlock(x + dx, y + dy, z, NETHER_PORTAL);
      this.audio.portal();
      this.toastMsg("A portal rips open.");
      this.grant("we_need_to_go_deeper");
    }
    let okZ = true;
    for (let dz = -1; dz <= 2; dz++) {
      if (!isObs(x, y - 1, z + dz) || !isObs(x, y + 3, z + dz)) okZ = false;
    }
    for (let dy = 0; dy < 3; dy++) {
      if (!isObs(x, y + dy, z - 1) || !isObs(x, y + dy, z + 2)) okZ = false;
    }
    if (okZ) {
      for (let dz = 0; dz < 2; dz++) for (let dy = 0; dy < 3; dy++) this.world.setBlock(x, y + dy, z + dz, NETHER_PORTAL);
      this.audio.portal();
      this.toastMsg("A portal rips open.");
    }
  }

  private tickPortal(dt: number) {
    const id = this.world.getBlock(Math.floor(this.player.x), Math.floor(this.player.y + 0.5), Math.floor(this.player.z));
    if (id === NETHER_PORTAL) {
      this.portalT += dt;
      if (this.portalT > 3) {
        this.portalT = 0;
        if (this.dim === "overworld") this.changeDim("nether");
        else this.changeDim("overworld");
      }
    } else if (id === END_PORTAL) {
      this.portalT += dt;
      if (this.portalT > 1.5) {
        this.portalT = 0;
        this.changeDim("end");
      }
    } else this.portalT = 0;
  }

  changeDim(d: Dim) {
    const from = this.dim;
    this.dim = d;
    this.player.dim = d;
    this.world.dim = d;
    if (d === "nether") {
      this.player.x = this.player.x / 8;
      this.player.z = this.player.z / 8;
      this.player.y = 40;
    } else if (d === "overworld" && from === "nether") {
      this.player.x *= 8;
      this.player.z *= 8;
      this.player.y = Math.max(this.player.y, 50);
    } else if (d === "end") {
      this.player.x = 0;
      this.player.z = 0;
      this.player.y = 52;
    }
    for (const m of this.mobs) if (m.kind !== "wraith") disposeMob(m, this.scene);
    this.mobs = this.mobs.filter((m) => m.kind === "wraith");
    this.dragon = null;
    this.world.streamAround(this.player.x, this.player.z, this.settings.renderDistance, d);
    this.applyDimVisuals();
    this.audio.portal();
    this.toastMsg(d === "nether" ? "The Nether" : d === "end" ? "The End" : "Overworld");
  }

  private tickMobs(dt: number) {
    this.spawnTimer += dt;
    if (this.spawnTimer > 4 && this.meta.arena !== "duel") {
      this.spawnTimer = 0;
      const m = trySpawn(this.scene, this.world, this.player, this.mobs, this.isNight(), this.meta.seed, this.settings.difficulty);
      if (m) this.mobs.push(m);
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
        this.player.applyKnockback(this.player.x - m.x, this.player.z - m.z, kb);
        this.trauma = Math.min(1, this.trauma + 0.18);
        this.camPunch = 0.12;
      },
    );
    for (const m of this.mobs) {
      if (!m.dead && m.hp <= 0) this.killMob(m);
    }
    if (this.dragon && this.dragon.hp <= 0 && !this.killedDragon) {
      this.killedDragon = true;
      this.hooks.onWin();
      this.addXp(120);
      this.grant("free_the_end");
      this.toastMsg("The Void Wyrm falls.");
      if (this.wraith) {
        this.killMob(this.wraith);
        this.wraith = null;
        this.toastMsg("The Pale One fades with the Wyrm.");
      }
    }
  }

  private tickWraith(dt: number) {
    if (this.killedDragon || this.meta.arena === "duel") return;
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
          if (this.world.getBlock(x, y - 1, z) === 0) this.world.setBlock(x, y - 1, z, id);
          else {
            for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
              if (this.world.getBlock(x + dx, y, z + dz) === 0) {
                this.world.setBlock(x + dx, y, z + dz, id);
                break;
              }
            }
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

  explode(x: number, y: number, z: number, r: number) {
    this.audio.explode();
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
    if (m.kind === "creeper") this.grant("monster_hunter");
    if (m.kind === "pig" || m.kind === "cow") this.player.give(m.kind === "cow" ? 10050 : 10052, 1);
    if (m.kind === "chicken") this.player.give(10054, 1);
    if (m.kind === "zombie") this.player.give(10118, 1);
    if (m.kind === "skeleton") this.player.give(10033, 2);
    if (m.kind === "enderman") this.player.give(10061, 1);
    if (m.kind === "duelist") {
      this.dualKills++;
      this.player.kills++;
      this.toastMsg(`Kill ${this.dualKills} — next duelist incoming.`);
      setTimeout(() => {
        if (!this.running) return;
        const bot = spawnMob("duelist", 0.5, this.world.highestSolid(0.5, 16.5) + 1, 16.5, this.scene);
        this.mobs.push(bot);
      }, 1600);
    }
  }

  attackDamage() {
    return getDef(this.player.selected?.id ?? 0)?.damage ?? 1;
  }

  tryMelee(dir: { x: number; y: number; z: number }) {
    this.player.swing = 1;
    const cd = this.player.attackCdMax <= 0 ? 1 : 1 - this.player.attackCd / this.player.attackCdMax;
    const factor = 0.2 + 0.8 * cd * cd;
    const crit = !this.player.onGround && this.player.vy < -0.15 && cd > 0.85;
    const dmg = this.attackDamage() * factor * (crit ? 1.5 : 1);
    const sprintKb = this.player.sprinting ? 4.2 : 0;
    const kb = {
      x: dir.x * (6.2 + sprintKb) * factor,
      y: crit ? 5.2 : 3.4,
      z: dir.z * (6.2 + sprintKb) * factor,
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
    const tool = getDef(this.player.selected?.id ?? 0);
    if (tool?.tool === "axe" && mob?.blocking) {
      mob.blocking = false;
      this.toastMsg("Shield disabled!");
    }
    if (this.player.selected?.id === FISHING_ROD && mob) {
      mob.vx += dir.x * 5.5;
      mob.vz += dir.z * 5.5;
      mob.vy += 2.2;
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
    const s = this.player.selected;
    if (!s || s.id !== ENDER_PEARL) return;
    if (this.player.mode !== "creative") this.player.takeSelected(1);
    let x = this.player.x;
    let y = this.player.eyeY();
    let z = this.player.z;
    for (let i = 0; i < 28; i++) {
      x += dir.x;
      y += dir.y;
      z += dir.z;
      if (this.world.getBlock(Math.floor(x), Math.floor(y), Math.floor(z))) {
        x -= dir.x;
        y -= dir.y;
        z -= dir.z;
        break;
      }
    }
    this.player.x = x;
    this.player.y = Math.max(1, y);
    this.player.z = z;
    this.player.hurtBy(2.5, "pearl");
    this.burst(x, y, z, 0x1a6a5a);
    this.audio.portal();
  }

  addXp(n: number) {
    this.player.xp += n;
    const need = 7 + this.player.xpLevel * 2;
    while (this.player.xp >= need) {
      this.player.xp -= need;
      this.player.xpLevel++;
    }
    const p = useApp.getState().profile;
    useApp.getState().setProfile({ xp: p.xp + n });
  }

  grant(id: string) {
    const p = useApp.getState().profile;
    if (p.unlocked.includes(id)) return;
    useApp.getState().setProfile({ unlocked: [...p.unlocked, id], xp: p.xp + 15 });
    this.toastMsg("Advancement: " + id.replace(/_/g, " "));
    this.audio.craft();
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
      this.sun.intensity = 0.08 + dayAmt * 1.15;
      this.sun.color.setRGB(1, 0.94 - dusk * 0.25, 0.78 - dusk * 0.3);
      this.hemi.intensity = 0.16 + dayAmt * 0.6;
      this.hemi.color.setRGB(0.55 + dayAmt * 0.2, 0.62 + dayAmt * 0.18, 0.85);
      this.stars.visible = this.settings.stars && nightAmt > 0.15;
      (this.stars.material as THREE.PointsMaterial).opacity = Math.min(1, nightAmt * 1.4);
      this.sunMesh.visible = this.settings.sunMoon && dayAmt > -0.1;
      this.moonMesh.visible = this.settings.sunMoon && nightAmt > 0.05;
    } else {
      this.stars.visible = this.settings.stars && this.dim === "end";
    }
    this.scene.fog = this.settings.fog ? this.fog : null;
    this.fog.density = 0.016 / Math.max(2, this.settings.renderDistance);
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
    this.playerBody.visible = mode !== "first";
    this.playerBody.position.set(this.player.x, this.player.y, this.player.z);
    this.playerBody.rotation.y = this.player.yaw;
    this.playerBody.scale.set(1 / this.player.squash, this.player.squash, 1 / this.player.squash);
    const spd = Math.hypot(this.player.vx, this.player.vz);
    swingLimbs(this.playerBody, this.time, 9, Math.min(0.7, spd * 0.12));
    this.hand.visible = mode === "first" && this.settings.heldItem && this.overlay === "none";
    const hid = this.player.selected?.id ?? 0;
    if (hid !== this.lastHeld) {
      this.lastHeld = hid;
      const kind = heldKind(hid);
      const item = this.hand.userData.item as THREE.Group | undefined;
      if (item) fillHeld(item, kind, getDef(hid)?.tint ?? 0x5adce6);
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
      boss: this.dragon && !this.dragon.dead ? { name: "Void Wyrm", hp: this.dragon.hp, max: this.dragon.max } : undefined,
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
      hitFlash: this.hitFlash,
      blocking: this.player.blocking,
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
    this.player.autoJump = s.autoJump;
    this.player.difficulty = s.difficulty;
    this.camera.fov = s.fov;
    this.camera.updateProjectionMatrix();
    this.audio.volumes.master = s.volumeMaster;
    this.audio.volumes.sfx = s.volumeSfx;
    this.audio.volumes.music = s.volumeMusic;
    this.audio.applyVol();
    this.renderer.toneMappingExposure = Math.max(0.35, Math.min(2.2, s.brightness));
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, s.pixelRatioCap || 1.5));
    this.renderer.shadowMap.enabled = s.shadows && s.graphics === "fabulous";
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
  }

  async persist() {
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
      advancements: useApp.getState().profile.unlocked,
    };
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
      this.player.x = this.meta.spawn.x;
      this.player.y = this.meta.spawn.y;
      this.player.z = this.meta.spawn.z;
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
    void this.persist();
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

