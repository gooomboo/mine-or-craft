import { useEffect, useMemo, useRef, useState } from "react";
import { Box, ChevronLeft, Heart, Pause, Users } from "lucide-react";
import { BLOCKS, BLOCK_COUNT } from "@/game/blocks";
import { consumeGrid, matchRecipe, mergeInto, trySmelt } from "@/game/crafting";
import { Engine } from "@/game/engine";
import { displayName, getDef } from "@/game/items";
import { loadChunks, loadPlayer, newWorldMeta } from "@/game/save";
import { loadCustomSkins, saveCustomSkins, SKIN_PRESETS, skinFromJSON, skinToJSON, type SkinData } from "@/game/skins";
import type { GameMode, Slot, WorldMeta } from "@/game/types";
import { useApp, type Overlay } from "@/store/app-store";
import { ItemIcon } from "./item-icon";
import { SettingsPanel } from "./settings-panel";

let engineRef: Engine | null = null;
export function getEngine() {
  return engineRef ?? (typeof window !== "undefined" ? window.__moc ?? null : null);
}

function McBtn({
  children,
  onClick,
  primary,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  primary?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mc-btn ${primary ? "mc-btn-primary" : ""} min-h-11 w-full px-4 py-2.5 text-lg ${className}`}
    >
      {children}
    </button>
  );
}

export function GameApp() {
  const phase = useApp((s) => s.phase);
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg text-fg">
      {phase === "playing" || phase === "loading" ? <PlayView /> : <MenuShell />}
    </div>
  );
}

function MenuShell() {
  const phase = useApp((s) => s.phase);
  const overlay = useApp((s) => s.overlay);
  return (
    <div className="relative flex h-full flex-col">
      <Panorama />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-none">
        {phase === "title" && <TitleScreen />}
        {phase === "menu" && <MainMenu />}
        {phase === "worlds" && <WorldSelect />}
        {phase === "create" && <CreateWorld />}
        {phase === "lobby" && <Lobby />}
        {phase === "skins" && <SkinStudio />}
      </div>
      {overlay === "settings" && <SettingsPanel fromPause={false} />}
    </div>
  );
}

const PANO_BIOMES = ["plains", "forest", "desert", "snow", "ocean", "mountains", "cherry", "swamp"] as const;

function Panorama() {
  const strip = [...PANO_BIOMES, ...PANO_BIOMES];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="mc-pano-strip">
        {strip.map((id, i) => (
          <div key={`${id}-${i}`} className={`mc-pano-panel mc-pano-${id}`}>
            <div className="mc-pano-sun" />
            <div className="mc-pano-moon" />
            <div className="mc-hill mc-hill-a" />
            <div className="mc-hill mc-hill-b" />
            <span className="mc-trunk tr1" />
            <span className="mc-tree t1" />
            <span className="mc-tree t2" />
            <span className="mc-tree t3" />
            <span className="mc-cactus c1" />
            <span className="mc-cactus c2" />
            <div className="mc-pano-water" />
            <div className="mc-pano-ground" />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/45" />
    </div>
  );
}

const SPLASH = [
  "Punch a tree first.",
  "Don't dig straight down.",
  "The Pale One watches.",
  "Craft a pickaxe.",
  "Bring a shield at night.",
  "3,200 blocks to place.",
  "The Void Wyrm waits.",
  "Also try the Nether.",
];

function TitleScreen() {
  const setPhase = useApp((s) => s.setPhase);
  const profile = useApp((s) => s.profile);
  const splash = SPLASH[Math.floor(Date.now() / 8000) % SPLASH.length]!;
  return (
    <div className="flex h-full flex-col items-center justify-center px-5 py-8 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <p className="mb-2 text-xs tracking-[0.3em] text-fg/80 uppercase">Brace the wild. Face the night.</p>
      <h1 className="pixel-title text-center text-5xl leading-none text-[#f4efe4] sm:text-7xl">
        MINE
        <span className="block text-[#8fbf4a]">OR CRAFT</span>
      </h1>
      <p className="mt-3 rotate-[-6deg] text-sm font-medium text-xp">{splash}</p>
      <p className="mt-4 max-w-md text-center text-sm text-fg/80">
        A voxel sandbox. Punch trees. Craft tools. Survive creepers. Hunt the Void Wyrm.
      </p>
      <div className="mt-8 w-full max-w-sm space-y-3">
        <McBtn primary onClick={() => setPhase("menu")}>
          Play
        </McBtn>
      </div>
      <p className="mt-6 text-xs text-muted">
        Signed in as <span className="text-fg">{profile.username}</span> · {profile.xp} XP
      </p>
    </div>
  );
}

function MainMenu() {
  const setPhase = useApp((s) => s.setPhase);
  const profile = useApp((s) => s.profile);
  const setProfile = useApp((s) => s.setProfile);
  const [name, setName] = useState(profile.username);
  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col justify-center px-5 py-8 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <button type="button" onClick={() => setPhase("title")} className="mb-4 flex items-center gap-1 text-sm text-muted">
        <ChevronLeft className="size-4" /> Back
      </button>
      <h2 className="pixel-title mb-6 text-3xl">Play</h2>
      <label className="mb-1 text-xs text-muted">Username</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value.slice(0, 16))}
        onBlur={() => setProfile({ username: name || "Player" })}
        className="mb-5 min-h-11 w-full border-2 border-black bg-elevated px-3 text-fg outline-none"
      />
      <div className="space-y-3">
        <McBtn primary onClick={() => setPhase("worlds")}>
          Singleplayer
        </McBtn>
        <McBtn onClick={() => setPhase("lobby")}>Multiplayer</McBtn>
        <McBtn onClick={() => setPhase("skins")}>Skin Studio</McBtn>
        <McBtn onClick={() => useApp.getState().setOverlay("settings")}>Settings</McBtn>
      </div>
    </div>
  );
}

function WorldSelect() {
  const setPhase = useApp((s) => s.setPhase);
  const worlds = useApp((s) => s.worlds);
  const refresh = useApp((s) => s.refreshWorlds);
  useEffect(() => refresh(), [refresh]);
  return (
    <div className="mx-auto flex h-full w-full max-w-lg flex-col px-5 py-6">
      <button type="button" onClick={() => setPhase("menu")} className="mb-3 flex items-center gap-1 text-sm text-muted">
        <ChevronLeft className="size-4" /> Back
      </button>
      <h2 className="pixel-title mb-4 text-3xl">Worlds</h2>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {worlds.length === 0 && <p className="text-sm text-muted">No worlds yet. Carve one from the void.</p>}
        {worlds.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => void bootWorld(w)}
            className="mc-panel flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <span>
              <span className="block font-medium">{w.name}</span>
              <span className="text-xs text-muted">
                {w.mode} · seed {w.seed}
                {w.cheats ? " · cheats" : ""}
              </span>
            </span>
            <Box className="size-4 text-muted" />
          </button>
        ))}
      </div>
      <McBtn primary className="mt-4" onClick={() => setPhase("create")}>
        Create New World
      </McBtn>
    </div>
  );
}

function CreateWorld() {
  const setPhase = useApp((s) => s.setPhase);
  const upsert = useApp((s) => s.upsertWorld);
  const [name, setName] = useState("New World");
  const [seed, setSeed] = useState(() => String(Math.floor(Math.random() * 1e9)));
  const [mode, setMode] = useState<GameMode>("survival");
  const [cheats, setCheats] = useState(false);
  return (
    <div className="mx-auto flex h-full w-full max-w-lg flex-col px-5 py-6">
      <button type="button" onClick={() => setPhase("worlds")} className="mb-3 flex items-center gap-1 text-sm text-muted">
        <ChevronLeft className="size-4" /> Back
      </button>
      <h2 className="pixel-title mb-4 text-3xl">Create World</h2>
      <label className="text-xs text-muted">World name</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mb-3 min-h-11 border-2 border-black bg-elevated px-3"
      />
      <label className="text-xs text-muted">Seed</label>
      <input
        value={seed}
        onChange={(e) => setSeed(e.target.value)}
        className="mb-3 min-h-11 border-2 border-black bg-elevated px-3"
      />
      <p className="mb-2 text-xs text-muted">Game mode</p>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {(["survival", "creative", "hardcore"] as GameMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              if (m === "hardcore") setCheats(false);
            }}
            className={`mc-btn min-h-11 text-sm capitalize ${mode === m ? "mc-btn-primary" : ""}`}
          >
            {m}
          </button>
        ))}
      </div>
      <label className="mb-5 flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" checked={cheats} disabled={mode === "hardcore"} onChange={(e) => setCheats(e.target.checked)} />
        Allow cheats
      </label>
      <McBtn
        primary
        onClick={() => {
          const n = Number(seed);
          const meta = newWorldMeta(name || "New World", Number.isFinite(n) ? n : hashStr(seed), mode, cheats);
          upsert(meta);
          void bootWorld(meta);
        }}
      >
        Create and Play
      </McBtn>
      <p className="mt-3 text-xs text-muted">Survival starts empty. Punch wood. Craft a table. Make a pickaxe.</p>
    </div>
  );
}

function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

async function bootWorld(meta: WorldMeta, mp = false) {
  const store = useApp.getState();
  store.setActive(meta);
  store.setPhase("loading");
  store.setOverlay("none");
  store.setNet({ multiplayer: mp, isHost: !mp || store.isHost });
  store.setLoading("Preparing world…", 0);
}

function Lobby() {
  const setPhase = useApp((s) => s.setPhase);
  const worlds = useApp((s) => s.worlds);
  const profile = useApp((s) => s.profile);
  const joinCode = useApp((s) => s.joinCode);
  const setJoinCode = useApp((s) => s.setJoinCode);
  const upsert = useApp((s) => s.upsertWorld);
  const [price, setPrice] = useState(0);
  const published = worlds.filter((w) => w.published);
  return (
    <div className="mx-auto flex h-full w-full max-w-lg flex-col px-5 py-6">
      <button type="button" onClick={() => setPhase("menu")} className="mb-3 flex items-center gap-1 text-sm text-muted">
        <ChevronLeft className="size-4" /> Back
      </button>
      <h2 className="pixel-title mb-1 text-3xl">Lobby</h2>
      <p className="mb-4 text-sm text-muted">Host a world or join a friend. XP can unlock published servers.</p>
      <label className="text-xs text-muted">Join code</label>
      <div className="mb-4 flex gap-2">
        <input
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24))}
          className="min-h-11 flex-1 border-2 border-black bg-elevated px-3"
          placeholder="room-code"
        />
        <button
          type="button"
          className="mc-btn mc-btn-primary min-h-11 px-4"
          onClick={() => {
            const meta = newWorldMeta("Joined World", Date.now() % 1e9, "survival", false);
            meta.code = joinCode || meta.code;
            useApp.getState().setNet({ multiplayer: true, isHost: false });
            upsert(meta);
            void bootWorld(meta, true);
          }}
        >
          Join
        </button>
      </div>
      <h3 className="mb-2 text-sm font-medium">Publish a world</h3>
      <div className="mb-4 space-y-2 overflow-y-auto">
        {worlds.slice(0, 6).map((w) => (
          <div key={w.id} className="mc-panel flex items-center justify-between gap-2 px-3 py-2">
            <span className="text-sm">
              {w.name}
              <span className="block text-xs text-muted">{w.code}</span>
            </span>
            <button
              type="button"
              className="mc-btn min-h-11 px-3 text-sm"
              onClick={() => {
                upsert({ ...w, published: true, priceXp: price });
              }}
            >
              Publish
            </button>
          </div>
        ))}
      </div>
      <label className="text-xs text-muted">XP price (0 = free)</label>
      <input
        type="number"
        min={0}
        value={price}
        onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))}
        className="mb-4 min-h-11 border-2 border-black bg-elevated px-3"
      />
      <h3 className="mb-2 text-sm font-medium">Public worlds</h3>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {published.length === 0 && <p className="text-sm text-muted">Nothing listed yet. Publish one of yours.</p>}
        {published.map((w) => (
          <button
            key={w.id}
            type="button"
            className="mc-panel flex w-full items-center justify-between px-3 py-2 text-left"
            onClick={() => {
              if ((w.priceXp ?? 0) > profile.xp) {
                alert("Not enough XP.");
                return;
              }
              if ((w.priceXp ?? 0) > 0) useApp.getState().setProfile({ xp: profile.xp - (w.priceXp ?? 0) });
              useApp.getState().setJoinCode(w.code ?? w.id);
              useApp.getState().setNet({ multiplayer: true, isHost: false });
              void bootWorld(w, true);
            }}
          >
            <span>
              <span className="block text-sm">{w.name}</span>
              <span className="text-xs text-muted">{w.priceXp ? `${w.priceXp} XP` : "Free"}</span>
            </span>
            <Users className="size-4 text-muted" />
          </button>
        ))}
      </div>
    </div>
  );
}

function SkinStudio() {
  const setPhase = useApp((s) => s.setPhase);
  const profile = useApp((s) => s.profile);
  const setProfile = useApp((s) => s.setProfile);
  const [custom, setCustom] = useState<SkinData[]>(() => loadCustomSkins());
  const [draft, setDraft] = useState<SkinData>({
    id: "custom",
    name: "Custom",
    shirt: "#3a78c8",
    pants: "#3a4a8a",
    skin: "#e0c090",
    hair: "#3a2a18",
  });
  const [paste, setPaste] = useState("");
  return (
    <div className="mx-auto flex h-full w-full max-w-lg flex-col px-5 py-6">
      <button type="button" onClick={() => setPhase("menu")} className="mb-3 flex items-center gap-1 text-sm text-muted">
        <ChevronLeft className="size-4" /> Back
      </button>
      <h2 className="pixel-title mb-4 text-3xl">Skin Studio</h2>
      <div className="mb-4 flex justify-center">
        <SkinPreview skin={SKIN_PRESETS.find((s) => s.id === profile.skin) ?? draft} />
      </div>
      <div className="mb-4 grid grid-cols-4 gap-2">
        {SKIN_PRESETS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setProfile({ skin: s.id })}
            className={`mc-btn min-h-11 text-xs ${profile.skin === s.id ? "mc-btn-primary" : ""}`}
          >
            {s.name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(["skin", "hair", "shirt", "pants"] as const).map((k) => (
          <label key={k} className="text-xs text-muted capitalize">
            {k}
            <input
              type="color"
              value={draft[k]}
              onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
              className="mt-1 h-10 w-full border-2 border-black bg-elevated"
            />
          </label>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <McBtn
          onClick={() => {
            const next = [...custom, { ...draft, id: `c-${Date.now()}` }];
            setCustom(next);
            saveCustomSkins(next);
            setProfile({ skin: next[next.length - 1]!.id });
          }}
        >
          Save skin
        </McBtn>
        <McBtn
          onClick={() => {
            void navigator.clipboard.writeText(skinToJSON(draft));
          }}
        >
          Copy JSON
        </McBtn>
      </div>
      <textarea
        value={paste}
        onChange={(e) => setPaste(e.target.value)}
        placeholder="Paste a skin JSON here"
        className="mt-3 min-h-20 border-2 border-black bg-elevated p-2 text-xs"
      />
      <button
        type="button"
        className="mc-btn mt-2 min-h-11"
        onClick={() => {
          const s = skinFromJSON(paste);
          if (s) setDraft(s);
        }}
      >
        Apply pasted skin
      </button>
    </div>
  );
}

function SkinPreview({ skin }: { skin: { shirt: string; pants: string; skin: string; hair: string } }) {
  return (
    <div className="relative h-28 w-16">
      <div className="absolute top-0 left-1/2 size-10 -translate-x-1/2" style={{ background: skin.skin }}>
        <div className="absolute top-0 inset-x-0 h-3" style={{ background: skin.hair }} />
        <div className="absolute top-4 left-2 size-1.5 bg-black" />
        <div className="absolute top-4 right-2 size-1.5 bg-black" />
      </div>
      <div className="absolute top-10 left-1/2 h-10 w-8 -translate-x-1/2" style={{ background: skin.shirt }} />
      <div className="absolute top-[4.5rem] left-1/2 h-8 w-8 -translate-x-1/2" style={{ background: skin.pants }} />
    </div>
  );
}

function PlayView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phase = useApp((s) => s.phase);
  const overlay = useApp((s) => s.overlay);
  const active = useApp((s) => s.active);
  const settings = useApp((s) => s.settings);
  const hud = useApp((s) => s.hud);
  const loadingMsg = useApp((s) => s.loadingMsg);
  const loadingPct = useApp((s) => s.loadingPct);
  const setOverlay = useApp((s) => s.setOverlay);
  const setHud = useApp((s) => s.setHud);

  useEffect(() => {
    if (!active || !canvasRef.current) return;
    let cancelled = false;
    const canvas = canvasRef.current;
    const boot = async () => {
      const store = useApp.getState();
      store.setLoading("Opening the world…", 0.04);
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
      if (cancelled) return;
      store.setLoading("Painting textures…", 0.08);
      const [save, edits] = await Promise.all([loadPlayer(active.id), loadChunks(active.id)]);
      if (cancelled) return;
      const eng = new Engine(canvas, active, useApp.getState().settings, {
        onHud: (h) => setHud(h),
        onOverlay: (o) => setOverlay(o),
        onDeath: () => setOverlay("dead"),
        onWin: () => setOverlay("credits"),
        onToast: () => {},
        onProgress: (msg, pct) => useApp.getState().setLoading(msg, pct),
      });
      engineRef = eng;
      window.__moc = eng;
      await eng.boot(save, edits);
      if (cancelled) {
        eng.dispose();
        return;
      }
      useApp.getState().setLoading("Entering the world…", 1);
      useApp.getState().setPhase("playing");
      useApp.getState().setOverlay("locked");
    };
    void boot();
    return () => {
      cancelled = true;
      engineRef?.dispose();
      engineRef = null;
    };
  }, [active, setHud, setOverlay]);

  useEffect(() => {
    engineRef?.applySettings(settings);
  }, [settings]);

  const clickToPlay = () => {
    const el = canvasRef.current;
    if (!el) return;
    engineRef?.audio.unlock();
    el.requestPointerLock?.({ unadjustedMovement: true } as PointerLockOptions).catch(() => {
      el.requestPointerLock?.();
    });
    engineRef?.setOverlay("none");
    setOverlay("none");
  };

  const pct = Math.round(Math.min(100, Math.max(0, loadingPct * 100)));

  return (
    <>
      <canvas ref={canvasRef} className="touch-none absolute inset-0 h-full w-full" />
      {phase === "loading" && (
        <div className="mc-dirt-load absolute inset-0 z-40 flex flex-col items-center justify-center px-6">
          <h2 className="pixel-title text-3xl sm:text-4xl">MINE OR CRAFT</h2>
          <p className="mt-5 text-center text-sm text-fg/90">{loadingMsg}</p>
          <div className="mt-4 h-3 w-full max-w-sm border-2 border-black bg-slot-dark">
            <div className="h-full bg-xp transition-[width] duration-150" style={{ width: `${pct}%` }} />
          </div>
          <p className="hud-num mt-2 text-sm text-xp">{pct}%</p>
          <p className="mt-6 max-w-xs text-center text-xs text-muted">
            Generating chunks. This can take a few seconds on phones — keep this tab open.
          </p>
        </div>
      )}
      {phase === "playing" && overlay === "locked" && (
        <button type="button" onClick={clickToPlay} className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/55 px-5">
          <p className="pixel-title text-3xl">Tap to play</p>
          <p className="mt-2 hidden max-w-sm text-center text-sm text-muted sm:block">
            Desktop: WASD · mouse look · left mine · right place · E inventory · Esc pause
          </p>
          <p className="mt-2 max-w-sm text-center text-sm text-muted sm:hidden">
            Left stick to walk. Drag the empty right side to look. Mine, Use, and Jump on the right. Bag and pause at the top.
          </p>
        </button>
      )}
      {phase === "playing" && overlay === "none" && hud && <Hud hud={hud} />}
      {phase === "playing" && overlay === "none" && <MobileControls />}
      {overlay === "pause" && <PauseMenu />}
      {overlay === "settings" && <SettingsPanel fromPause={phase === "playing"} />}
      {(overlay === "inventory" || overlay === "crafting" || overlay === "furnace") && <InventoryOverlay kind={overlay} />}
      {overlay === "chat" && <ChatOverlay />}
      {overlay === "dead" && <DeadScreen />}
      {overlay === "credits" && <WinScreen />}
      {overlay === "advancements" && <Advancements />}
    </>
  );
}

function Hud({ hud }: { hud: NonNullable<ReturnType<typeof useApp.getState>["hud"]> }) {
  const settings = useApp((s) => s.settings);
  const hearts = Math.ceil(hud.health / 2);
  const food = Math.ceil(hud.hunger / 2);
  const scale = settings.guiScale;
  const airBubbles = Math.ceil(Math.max(0, hud.air) / 1);
  return (
    <div className="pointer-events-none absolute inset-0 z-30" style={{ fontSize: `${scale * 16}px` }}>
      {settings.vignette && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,#00000055_100%)]" />
      )}
      {hud.hurt > 0 && (
        <div
          className="pointer-events-none absolute inset-0 bg-danger/30"
          style={{ opacity: Math.min(0.55, hud.hurt * 1.1) }}
        />
      )}
      {hud.underwater && <div className="pointer-events-none absolute inset-0 bg-[#1a4a6a]/35" />}
      {hud.portal > 0 && (
        <div className="pointer-events-none absolute inset-0 bg-[#6a20c8]/40" style={{ opacity: Math.min(0.7, hud.portal / 3) }} />
      )}
      {settings.crosshair === "cross" && (
        <div className="crosshair absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="absolute top-1/2 left-0 h-px w-full bg-white/80" />
          <div className="absolute top-0 left-1/2 h-full w-px bg-white/80" />
        </div>
      )}
      {settings.crosshair === "dot" && (
        <div className="absolute top-1/2 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90" />
      )}
      {settings.crosshair === "circle" && (
        <div className="absolute top-1/2 left-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80" />
      )}
      {hud.boss && (
        <div className="absolute top-4 left-1/2 w-[min(420px,90%)] -translate-x-1/2">
          <p className="mb-1 text-center text-xs tracking-wide">{hud.boss.name}</p>
          <div className="h-2.5 border border-black bg-slot-dark">
            <div className="h-full bg-danger" style={{ width: `${(hud.boss.hp / hud.boss.max) * 100}%` }} />
          </div>
        </div>
      )}
      {hud.wraith && <p className="absolute top-10 left-1/2 -translate-x-1/2 text-xs tracking-widest text-fg">THE PALE ONE IS HERE</p>}
      {hud.toast && (
        <p className="absolute top-16 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1 text-sm">{hud.toast}</p>
      )}
      <div className="absolute bottom-16 left-1/2 flex w-[min(420px,96%)] -translate-x-1/2 flex-col items-center gap-1 sm:bottom-20 pb-[env(safe-area-inset-bottom)]">
        {hud.mode !== "creative" && (
          <div className="flex w-full justify-between px-1">
            <div className="flex gap-0.5">
              {Array.from({ length: 10 }, (_, i) => (
                <Heart
                  key={i}
                  className="size-4"
                  fill={i < hearts ? "#c45c4a" : "transparent"}
                  color={i < hearts ? "#c45c4a" : "#3a2020"}
                />
              ))}
            </div>
            <div className="flex gap-0.5">
              {Array.from({ length: 10 }, (_, i) => (
                <span key={i} className={`size-3.5 border ${i < food ? "bg-hunger border-black" : "border-muted"}`} />
              ))}
            </div>
          </div>
        )}
        {hud.underwater && hud.air < 10 && (
          <div className="flex w-full justify-end gap-0.5 px-1">
            {Array.from({ length: 10 }, (_, i) => (
              <span
                key={i}
                className={`size-2.5 rounded-full border border-black ${i < airBubbles ? "bg-[#7ec8e8]" : "bg-transparent"}`}
              />
            ))}
          </div>
        )}
        <div className="h-1.5 w-full border border-black bg-slot-dark">
          <div className="h-full bg-xp" style={{ width: `${Math.min(100, (hud.xp / (7 + hud.xpLevel * 2)) * 100)}%` }} />
        </div>
        <p className="hud-num -mt-1 text-[10px] text-xp">{hud.xpLevel}</p>
        <div className="mc-hotbar pointer-events-auto flex gap-0.5">
          {hud.inventory.slice(0, 9).map((s, i) => (
            <button
              key={i}
              type="button"
              className={`mc-slot ${hud.hotbar === i ? "outline outline-2 outline-white" : ""}`}
              onClick={() => {
                if (getEngine()) getEngine()!.player.hotbar = i;
              }}
              aria-label={`Hotbar ${i + 1}`}
            >
              {s && <ItemIcon id={s.id} count={s.count} />}
            </button>
          ))}
        </div>
        {hud.selectedName && <p className="text-xs text-fg/90">{hud.selectedName}</p>}
      </div>
      {(settings.showFps || settings.showCoords || settings.showBiome) && (
        <p className="absolute top-2 left-2 font-mono text-[11px] text-fg/80">
          {settings.showFps && <>{hud.fps.toFixed(0)} fps</>}
          {settings.showBiome && (
            <>
              {settings.showFps ? " · " : ""}
              {hud.biome} · {hud.dim}
            </>
          )}
          {settings.showCoords && (
            <>
              <br />
              {hud.x.toFixed(1)} {hud.y.toFixed(1)} {hud.z.toFixed(1)}
            </>
          )}
        </p>
      )}
      <div className="absolute top-2 right-2 pointer-events-auto z-40 flex gap-2 pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)]">
        <button
          type="button"
          className="mc-btn size-12 p-0 sm:size-11"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            getEngine()?.setOverlay("inventory");
          }}
          aria-label="Inventory"
        >
          <Box className="mx-auto size-5" />
        </button>
        <button
          type="button"
          className="mc-btn size-12 p-0 sm:size-11"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            getEngine()?.setOverlay("pause");
          }}
          aria-label="Pause"
        >
          <Pause className="mx-auto size-5" />
        </button>
      </div>
    </div>
  );
}

function MobileControls() {
  const eng = () => getEngine();
  const [joy, setJoy] = useState({ x: 0, y: 0 });
  const size = useApp((s) => s.settings.touchSize);

  const onStick = (e: React.PointerEvent) => {
    e.stopPropagation();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const handler = (ev: PointerEvent) => {
      const dx = (ev.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (ev.clientY - (r.top + r.height / 2)) / (r.height / 2);
      const x = Math.max(-1, Math.min(1, dx));
      const y = Math.max(-1, Math.min(1, -dy));
      setJoy({ x, y });
      const input = eng()?.input;
      if (input) input.touchMove = { x, y };
    };
    const up = () => {
      setJoy({ x: 0, y: 0 });
      const input = eng()?.input;
      if (input) input.touchMove = { x: 0, y: 0 };
      window.removeEventListener("pointermove", handler);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    window.addEventListener("pointermove", handler);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    handler(e.nativeEvent);
  };

  const onLook = (e: React.PointerEvent) => {
    let lx = e.clientX,
      ly = e.clientY;
    const move = (ev: PointerEvent) => {
      const input = eng()?.input;
      if (!input) return;
      input.touchLook.x += (ev.clientX - lx) * 0.006;
      input.touchLook.y += (ev.clientY - ly) * 0.006;
      lx = ev.clientX;
      ly = ev.clientY;
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  const hold = (key: "touchJump" | "touchAttack" | "touchUse" | "touchSneak") => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.stopPropagation();
      const i = eng()?.input;
      if (i) i[key] = true;
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.stopPropagation();
      const i = eng()?.input;
      if (i) i[key] = false;
    },
    onPointerCancel: () => {
      const i = eng()?.input;
      if (i) i[key] = false;
    },
  });

  const stick = 7.2 * size;
  return (
    <div className="pointer-events-none absolute inset-0 z-20 sm:hidden">
      <div className="mc-look-pad pointer-events-auto" onPointerDown={onLook} />
      <div
        className="pointer-events-auto absolute left-3 rounded-full border-2 border-white/30 bg-black/30"
        style={{
          width: `${stick}rem`,
          height: `${stick}rem`,
          bottom: "calc(7.25rem + env(safe-area-inset-bottom))",
        }}
        onPointerDown={onStick}
      >
        <div
          className="absolute size-12 rounded-full bg-white/40"
          style={{
            left: `calc(50% + ${joy.x * 32 * size}px - 24px)`,
            top: `calc(50% + ${-joy.y * 32 * size}px - 24px)`,
          }}
        />
      </div>
      <div
        className="pointer-events-auto absolute right-3 flex flex-col items-end gap-2"
        style={{ bottom: "calc(7.25rem + env(safe-area-inset-bottom))" }}
      >
        <button type="button" className="mc-btn size-16 text-base" {...hold("touchJump")}>
          Jump
        </button>
        <div className="flex gap-2">
          <button type="button" className="mc-btn size-16 text-base" {...hold("touchAttack")}>
            Mine
          </button>
          <button type="button" className="mc-btn size-16 text-base" {...hold("touchUse")}>
            Use
          </button>
        </div>
        <button type="button" className="mc-btn h-12 min-w-16 px-3 text-sm" {...hold("touchSneak")}>
          Sneak
        </button>
      </div>
    </div>
  );
}

function PauseMenu() {
  const setOverlay = useApp((s) => s.setOverlay);
  const setPhase = useApp((s) => s.setPhase);
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 px-5">
      <div className="mc-panel w-full max-w-sm p-6">
        <h2 className="pixel-title mb-4 text-center text-2xl">Paused</h2>
        <div className="space-y-3">
          <McBtn
            primary
            onClick={() => {
              getEngine()?.setOverlay("none");
              setOverlay("locked");
            }}
          >
            Resume
          </McBtn>
          <McBtn onClick={() => setOverlay("settings")}>Settings</McBtn>
          <McBtn onClick={() => setOverlay("advancements")}>Advancements</McBtn>
          <McBtn
            onClick={() => {
              void getEngine()?.persist();
              getEngine()?.dispose();
              engineRef = null;
              setOverlay("none");
              setPhase("menu");
            }}
          >
            Save and Quit
          </McBtn>
        </div>
      </div>
    </div>
  );
}

function InventoryOverlay({ kind }: { kind: Overlay }) {
  const hud = useApp((s) => s.hud);
  const setOverlay = useApp((s) => s.setOverlay);
  const [held, setHeld] = useState<Slot>(null);
  const [craft, setCraft] = useState<Slot[]>(Array.from({ length: 9 }, () => null));
  const [query, setQuery] = useState("");
  const table = kind === "crafting";
  const n = table ? 3 : 2;
  const result = useMemo(() => matchRecipe(craft, table), [craft, table]);

  const clickSlot = (list: "inv" | "craft" | "armor" | "off", i: number) => {
    if (!engineRef) return;
    const p = engineRef.player;
    const arr = list === "inv" ? p.inventory : list === "craft" ? craft : list === "armor" ? p.armor : [p.offhand];
    const cur = arr[i] ?? null;
    if (held && cur && held.id === cur.id) {
      const max = getDef(held.id)?.stack ?? 64;
      const add = Math.min(max - cur.count, held.count);
      cur.count += add;
      held.count -= add;
      if (held.count <= 0) setHeld(null);
      else setHeld({ ...held });
    } else {
      arr[i] = held;
      if (list === "off") p.offhand = held;
      setHeld(cur);
    }
    if (list === "craft") setCraft([...craft]);
    useApp.getState().setHud({ ...(useApp.getState().hud as NonNullable<typeof hud>), inventory: [...p.inventory] });
  };

  const takeResult = () => {
    if (!result || !engineRef) return;
    consumeGrid(craft, n);
    setCraft([...craft]);
    if (held && held.id === result.out.id) {
      held.count += result.out.count;
      setHeld({ ...held });
    } else if (!held) setHeld({ ...result.out });
    else mergeInto(engineRef.player.inventory, { ...result.out });
    engineRef.audio.craft();
  };

  const creative = hud?.mode === "creative";
  const found = useMemo(() => {
    const q = query.toLowerCase();
    const list: { id: number; name: string }[] = [];
    for (let i = 1; i < BLOCK_COUNT && list.length < 80; i++) {
      const b = BLOCKS[i]!;
      if (!q || b.name.toLowerCase().includes(q)) list.push({ id: b.id, name: b.name });
    }
    return list;
  }, [query]);

  if (!hud) return null;
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/65 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mc-panel max-h-[92dvh] w-full max-w-xl overflow-y-auto p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="pixel-title text-xl">{kind === "furnace" ? "Furnace" : table ? "Crafting Table" : "Inventory"}</h2>
          <button
            type="button"
            className="mc-btn min-h-11 px-3"
            onClick={() => {
              getEngine()?.setOverlay("none");
              setOverlay("locked");
            }}
          >
            Close
          </button>
        </div>
        {kind !== "furnace" && (
          <div className="mb-4 flex items-start gap-4">
            <div className={`grid gap-1 ${table ? "grid-cols-3" : "grid-cols-2"}`}>
              {Array.from({ length: n * n }, (_, i) => (
                <button key={i} type="button" className="mc-slot" onClick={() => clickSlot("craft", i)}>
                  {craft[i] && <ItemIcon id={craft[i]!.id} count={craft[i]!.count} />}
                </button>
              ))}
            </div>
            <div className="pt-6 text-muted">→</div>
            <button type="button" className="mc-slot size-14" onClick={takeResult}>
              {result && <ItemIcon id={result.out.id} count={result.out.count} />}
            </button>
          </div>
        )}
        {kind === "furnace" && <FurnaceMini />}
        <p className="mb-1 text-xs text-muted">Armor / offhand</p>
        <div className="mb-3 flex gap-1">
          {hud.armor.map((s, i) => (
            <button key={i} type="button" className="mc-slot" onClick={() => clickSlot("armor", i)}>
              {s && <ItemIcon id={s.id} count={s.count} />}
            </button>
          ))}
          <button type="button" className="mc-slot" onClick={() => clickSlot("off", 0)}>
            {hud.offhand && <ItemIcon id={hud.offhand.id} count={hud.offhand.count} />}
          </button>
        </div>
        <div className="inv-grid">
          {hud.inventory.slice(9).map((s, i) => (
            <button key={i + 9} type="button" className="mc-slot" onClick={() => clickSlot("inv", i + 9)}>
              {s && <ItemIcon id={s.id} count={s.count} />}
            </button>
          ))}
        </div>
        <div className="inv-grid mt-2">
          {hud.inventory.slice(0, 9).map((s, i) => (
            <button key={i} type="button" className="mc-slot" onClick={() => clickSlot("inv", i)}>
              {s && <ItemIcon id={s.id} count={s.count} />}
            </button>
          ))}
        </div>
        {held && (
          <p className="mt-2 text-xs text-muted">
            Holding {displayName(held.id)} ×{held.count}
          </p>
        )}
        {creative && (
          <div className="mt-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 3,200 blocks…"
              className="mb-2 min-h-11 w-full border-2 border-black bg-elevated px-3 text-sm"
            />
            <div className="inv-grid max-h-40 overflow-y-auto">
              {found.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className="mc-slot"
                  title={b.name}
                  onClick={() => engineRef?.player.give(b.id, 64)}
                >
                  <ItemIcon id={b.id} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FurnaceMini() {
  const [inSlot, setIn] = useState<Slot>(null);
  const [out, setOut] = useState<Slot>(null);
  return (
    <div className="mb-4 flex items-center gap-3">
      <button
        type="button"
        className="mc-slot"
        onClick={() => {
          const p = engineRef?.player;
          if (!p) return;
          const s = p.selected;
          if (s) {
            setIn(s);
            p.inventory[p.hotbar] = null;
          }
        }}
      >
        {inSlot && <ItemIcon id={inSlot.id} count={inSlot.count} />}
      </button>
      <button
        type="button"
        className="mc-btn min-h-11 px-3 text-sm"
        onClick={() => {
          if (!inSlot) return;
          const sm = trySmelt(inSlot.id);
          if (!sm) return;
          inSlot.count--;
          setOut({ id: sm.out, count: (out?.count ?? 0) + 1 });
          if (inSlot.count <= 0) setIn(null);
          engineRef?.addXp(sm.xp);
        }}
      >
        Smelt
      </button>
      <button
        type="button"
        className="mc-slot"
        onClick={() => {
          if (out && engineRef) {
            engineRef.player.give(out.id, out.count);
            setOut(null);
          }
        }}
      >
        {out && <ItemIcon id={out.id} count={out.count} />}
      </button>
    </div>
  );
}

function ChatOverlay() {
  const [val, setVal] = useState("/");
  const setOverlay = useApp((s) => s.setOverlay);
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 bg-black/70 p-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const r = engineRef?.cheat(val) ?? "";
          engineRef?.chat.push(val);
          engineRef?.chat.push(r);
          engineRef?.setOverlay("none");
          setOverlay("locked");
        }}
      >
        <input
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="min-h-11 w-full border-2 border-black bg-elevated px-3"
        />
      </form>
      <p className="mt-1 text-[11px] text-muted">/give 1 64 · /gamemode creative · /time night · /fly · /home</p>
    </div>
  );
}

function DeadScreen() {
  const setOverlay = useApp((s) => s.setOverlay);
  const setPhase = useApp((s) => s.setPhase);
  const mode = useApp((s) => s.active?.mode);
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-red-950/80 px-5">
      <div className="w-full max-w-sm text-center">
        <h2 className="pixel-title text-4xl">You Died</h2>
        <p className="mt-2 mb-6 text-sm text-muted">
          {mode === "hardcore" ? "Hardcore worlds do not forgive." : "Respawn at your last bed, or spawn."}
        </p>
        {mode !== "hardcore" && (
          <McBtn
            primary
            onClick={() => {
              if (engineRef) {
                engineRef.player.health = 20;
                engineRef.player.hunger = 20;
                engineRef.player.x = engineRef.meta.spawn.x;
                engineRef.player.y = engineRef.meta.spawn.y;
                engineRef.player.z = engineRef.meta.spawn.z;
                engineRef.setOverlay("none");
              }
              setOverlay("locked");
            }}
          >
            Respawn
          </McBtn>
        )}
        <McBtn
          className="mt-3"
          onClick={() => {
            engineRef?.dispose();
            engineRef = null;
            setOverlay("none");
            setPhase("menu");
          }}
        >
          Title screen
        </McBtn>
      </div>
    </div>
  );
}

function WinScreen() {
  const setOverlay = useApp((s) => s.setOverlay);
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 px-5">
      <div className="max-w-md text-center">
        <h2 className="pixel-title text-4xl">The End?</h2>
        <p className="mt-4 text-sm text-muted">
          The Void Wyrm is gone. The Pale One cannot follow a player who has finished the story. The world remains yours.
        </p>
        <McBtn primary className="mt-6" onClick={() => setOverlay("locked")}>
          Continue
        </McBtn>
      </div>
    </div>
  );
}

function Advancements() {
  const unlocked = useApp((s) => s.profile.unlocked);
  const setOverlay = useApp((s) => s.setOverlay);
  const all = [
    ["getting_wood", "Getting Wood"],
    ["diamonds", "Diamonds!"],
    ["we_need_to_go_deeper", "We Need to Go Deeper"],
    ["monster_hunter", "Monster Hunter"],
    ["free_the_end", "Free the End"],
  ];
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 px-5">
      <div className="mc-panel w-full max-w-md p-5">
        <h2 className="pixel-title mb-3 text-2xl">Advancements</h2>
        <ul className="space-y-2 text-sm">
          {all.map(([id, name]) => (
            <li key={id} className={unlocked.includes(id) ? "text-xp" : "text-muted"}>
              {unlocked.includes(id) ? "Done — " : "Locked — "}
              {name}
            </li>
          ))}
        </ul>
        <McBtn className="mt-4" onClick={() => setOverlay("pause")}>
          Back
        </McBtn>
      </div>
    </div>
  );
}

