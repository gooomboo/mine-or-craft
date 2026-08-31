import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Box, ChevronLeft, Heart, MessageSquare, Pause, Users } from "lucide-react";
import { BLOCKS, BLOCK_COUNT } from "@/game/blocks";
import { bookRecipes, consumeGrid, dumpGrid, fillGridFromRecipe, hasIngredients, matchRecipe, mergeInto, trySmelt } from "@/game/crafting";
import { Engine } from "@/game/engine";
import { GameAudio } from "@/game/audio";
import { displayName, getDef, ITEMS } from "@/game/items";
import { loadChunks, loadPlayer, loadSession, newWorldMeta, saveSession, signInAccount, signUpAccount, enterGuest } from "@/game/save";
import { resolveSkin } from "@/game/skins";
import type { ArenaId, GameMode, Slot, WorldMeta } from "@/game/types";
import { compileGame, loadGames } from "@/game/scratch";
import { ARENA_LIST, WORKSHOP_TEMPLATE } from "@/game/arenas";
import { ADVANCEMENTS } from "@/game/advancements";
import { useApp, type Overlay } from "@/store/app-store";
import { ItemIcon } from "./item-icon";
import { SettingsPanel } from "./settings-panel";
import { SkinPreview, SkinStudio } from "./skin-studio";
import { Marketplace } from "./marketplace";
import { GameLab } from "./game-lab";
import { TitlePano } from "./title-pano";
import { useP2PRoom } from "@/lib/multiplayer";

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
  const scheme = useApp((s) => s.settings.controlScheme);
  useEffect(() => {
    document.body.classList.toggle("moc-keys", scheme === "keys");
    return () => document.body.classList.remove("moc-keys");
  }, [scheme]);
  return (
    <div
      className="relative h-dvh w-full overflow-hidden bg-bg text-fg"
      onPointerDown={() => getEngine()?.audio.unlock()}
    >
      {phase === "playing" || phase === "loading" ? <PlayView /> : <MenuShell />}
    </div>
  );
}

let menuTune: GameAudio | null = null;
function getMenuTune() {
  return (menuTune ??= new GameAudio());
}

function MenuAmbience() {
  const vol = useApp((s) => s.settings.volumeMusic);
  const master = useApp((s) => s.settings.volumeMaster);
  useEffect(() => {
    const a = getMenuTune();
    a.volumes.music = vol;
    a.volumes.master = master;
    a.applyVol();
    const unlock = () => a.unlock();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    a.unlock();
    let last = performance.now();
    let id = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      a.tickMenu(dt);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      a.hush();
    };
  }, [vol, master]);
  return null;
}

function MenuShell() {
  const phase = useApp((s) => s.phase);
  const overlay = useApp((s) => s.overlay);
  const guest = useApp((s) => s.profile.guest);
  return (
    <div className="relative flex h-full flex-col">
      {phase !== "boot" && <TitlePano />}
      {phase !== "boot" && <MenuAmbience />}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/25 via-transparent to-black/55" />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-none">
        {phase === "boot" && <BootScreen />}
        {phase === "login" && <LoginScreen />}
        {(phase === "title" || phase === "menu") && <TitleScreen />}
        {phase === "worlds" && <WorldSelect />}
        {phase === "create" && <CreateWorld />}
        {phase === "lobby" && (guest ? <GuestDenied extra="Online play needs an account." /> : <Lobby />)}
        {phase === "skins" && (guest ? <GuestDenied extra="The dressing room needs an account." /> : <SkinStudio />)}
        {phase === "minigames" && (guest ? <GuestDenied extra="Mini games need an account." /> : <Minigames />)}
        {phase === "friends" && (guest ? <GuestDenied extra="Friends lists need an account." /> : <FriendsScreen />)}
        {phase === "market" && (guest ? <GuestDenied extra="The marketplace needs an account." /> : <Marketplace />)}
        {phase === "lab" && <GameLab />}
        {phase === "playhub" && <PlayHub />}
      </div>
      {overlay === "settings" && <SettingsPanel fromPause={false} />}
    </div>
  );
}

const SPLASH = [
  "Punch a tree first.",
  "Don't dig straight down.",
  "The Pale One watches.",
  "Craft a pickaxe.",
  "Bring a shield at night.",
  "30,000 blocks to place.",
  "The Void Wyrm waits.",
  "Also try the Nether.",
  "Bed Wars at the lobby.",
  "Hold jump to bunny hop.",
  "Paint every side.",
  "Boats float. Jump the shore.",
  "As seen on a dirt block.",
  "Not Mojang. Still cubic.",
];

function bootArena(kind: ArenaId) {
  const info = ARENA_LIST.find((a) => a.id === kind)!;
  const meta = newWorldMeta(info.name, info.seed, "survival", true);
  meta.id = `w-${kind}-official`;
  meta.arena = kind;
  meta.code = info.code;
  meta.name = info.name;
  useApp.getState().upsertWorld(meta);
  useApp.getState().setNet({ multiplayer: true, isHost: true });
  void bootWorld(meta, true);
}

function TitleScreen() {
  const setPhase = useApp((s) => s.setPhase);
  const profile = useApp((s) => s.profile);
  const guest = profile.guest;
  const splash = SPLASH[Math.floor(Date.now() / 8000) % SPLASH.length]!;
  return (
    <div className="relative flex h-full flex-col px-4 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="relative mx-auto mt-[5vh] mb-5 select-none">
        <div className="mc-logo-cubes" aria-hidden>
          <span className="mc-logo-cube" />
          <span className="mc-logo-cube mc-logo-cube-b" />
        </div>
        <h1 className="pixel-title mc-logo-3d text-center text-[4rem] leading-[0.74] sm:text-8xl md:text-9xl">
          MINE
          <span className="block text-[#3f3]">OR CRAFT</span>
        </h1>
        <p className="mc-splash absolute -right-2 -bottom-4 max-w-[14rem] text-right text-base font-bold sm:right-[-7rem] sm:bottom-0 sm:text-2xl">
          {splash}
        </p>
      </div>
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-stretch gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="mc-menu-stack w-full max-w-[400px] space-y-2.5 p-4 sm:p-5">
          <McBtn primary onClick={() => setPhase("playhub")}>
            Play
          </McBtn>
          <McBtn onClick={() => useApp.getState().setOverlay("settings")}>Settings</McBtn>
          {!guest && (
            <>
              <McBtn className="mc-btn-dual" onClick={() => setPhase("market")}>
                Marketplace
              </McBtn>
              <McBtn onClick={() => setPhase("skins")}>Dressing Room</McBtn>
              <McBtn onClick={() => setPhase("lab")}>Game Lab</McBtn>
            </>
          )}
          {guest && (
            <p className="px-1 text-center text-[11px] text-muted">
              Guest — local worlds and settings only. Sign in for marketplace, skins, online, friends, and mini games.
            </p>
          )}
        </div>
        <button
          type="button"
          className="mx-auto flex flex-col items-center gap-2 sm:mx-0"
          onClick={() => (guest ? undefined : setPhase("skins"))}
        >
          <SkinPreview skin={resolveSkin(profile.skin)} size={160} />
          <span className="text-center">
            <span className="block text-sm">{profile.username}{guest ? " · Guest" : ""}</span>
            <span className="text-[11px] text-muted">
              {profile.xp} XP · {profile.stars ?? 0}/100 ★ · {profile.diamonds ?? 0} ◆
            </span>
          </span>
        </button>
      </div>
      <div className="mt-3 flex w-full items-end justify-between px-1">
        <span className="text-[11px] text-muted">v1.0</span>
        <button
          type="button"
          className="text-[11px] text-muted"
          onClick={() => {
            saveSession(null);
            setPhase("login");
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

function PlayHub() {
  const setPhase = useApp((s) => s.setPhase);
  const worlds = useApp((s) => s.worlds);
  const guest = useApp((s) => s.profile.guest);
  const last = [...worlds].sort((a, b) => (b.played || 0) - (a.played || 0))[0];
  const saves = loadGames();
  const folders = [...new Set(saves.map((g) => g.folder || "Saves"))];
  return (
    <div className="mx-auto flex h-full w-full max-w-lg flex-col px-5 py-6">
      <button type="button" onClick={() => setPhase("title")} className="mb-3 flex items-center gap-1 text-sm text-muted">
        <ChevronLeft className="size-4" /> Back
      </button>
      <h2 className="pixel-title mb-4 text-3xl">Play</h2>
      <div className="space-y-2">
        {last && (
          <McBtn
            primary
            onClick={() => {
              useApp.getState().setActive(last);
              useApp.getState().setNet({ multiplayer: false, isHost: true });
              void bootWorld(last);
            }}
          >
            Continue — {last.name}
          </McBtn>
        )}
        <McBtn primary={!last} onClick={() => setPhase("worlds")}>
          Local worlds
        </McBtn>
        {!guest && (
          <>
            <McBtn onClick={() => setPhase("lobby")}>Online / Realms</McBtn>
            <McBtn onClick={() => setPhase("minigames")}>Mini Games</McBtn>
            <McBtn onClick={() => setPhase("friends")}>Friends</McBtn>
          </>
        )}
        {guest && <p className="text-sm text-muted">Guest: local worlds only. Sign in to play online, mini games, and friends.</p>}
      </div>
      {!guest && (
        <>
      <h3 className="mt-5 mb-2 text-sm font-medium">Game Lab saves</h3>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {saves.length === 0 && <p className="text-sm text-muted">No saved packs. Open Game Lab from the title to make one.</p>}
        {folders.map((f) => (
          <div key={f} className="mc-panel p-3">
            <p className="mb-2 text-xs tracking-wide text-muted">{f}</p>
            {saves
              .filter((g) => (g.folder || "Saves") === f)
              .map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className="mc-btn mb-1 min-h-11 w-full text-left text-sm"
                  onClick={() => {
                    const meta = newWorldMeta(g.name, Date.now() % 1e9, "survival", true);
                    meta.modJson = compileGame(g);
                    meta.spawnBiome = g.spawnBiome;
                    useApp.getState().upsertWorld(meta);
                    useApp.getState().setNet({ multiplayer: false, isHost: true });
                    void bootWorld(meta);
                  }}
                >
                  {g.name}
                </button>
              ))}
          </div>
        ))}
      </div>
        </>
      )}
    </div>
  );
}

function BootScreen() {
  const setPhase = useApp((s) => s.setPhase);
  const [pct, setPct] = useState(4);
  const [msg, setMsg] = useState("Waking the world…");
  useEffect(() => {
    const steps = [
      "Loading block atlas…",
      "Painting biomes…",
      "Rigging mobs…",
      "Opening the account vault…",
      "Checking last session…",
      "Ready.",
    ];
    const start = Date.now();
    const total = 2800;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setPct(100);
      setMsg("Ready.");
      setPhase("login");
    };
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / total);
      setPct(Math.max(2, Math.round(t * 100)));
      setMsg(steps[Math.min(steps.length - 1, Math.floor(t * steps.length))]!);
      if (t >= 1) finish();
    };
    tick();
    const id = window.setInterval(tick, 40);
    const failSafe = window.setTimeout(finish, 3600);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(failSafe);
    };
  }, [setPhase]);
  return (
    <div className="relative flex h-full flex-col items-center justify-center px-6">
      <h1 className="pixel-title mc-logo-3d text-center text-[2.8rem] leading-[0.82] sm:text-7xl">
        MINE
        <span className="block text-[#3f3]">OR CRAFT</span>
      </h1>
      <p className="mt-8 text-sm text-fg/90">{msg}</p>
      <div className="mc-meter mt-4">
        <i style={{ width: `${pct}%` }} />
      </div>
      <p className="hud-num mt-2 text-sm text-xp">{pct}%</p>
      <button type="button" className="mt-4 text-xs text-muted" onClick={() => setPhase("login")}>
        Skip
      </button>
      <p className="mt-6 text-[11px] tracking-widest text-muted">v1.0</p>
    </div>
  );
}

const TOS = `MINE OR CRAFT — TERMS OF SERVICE (placeholder)

1. Don't hack, cheat, exploit, or grief public servers or other players' hosted worlds.
2. Don't upload sexual, hateful, or illegal skins, packs, or chat.
3. Game Lab mods only affect your worlds and the friends who join them — never someone else's server.
4. Guests play locally. Publishing, marketplace, online, friends, and mini games need an account.
5. We may remove content that breaks these rules. Play fair. Have fun.

This is a community sandbox. Breaking the rules can get your account locked on this device.`;

function LoginScreen() {
  const setPhase = useApp((s) => s.setPhase);
  const setProfile = useApp((s) => s.setProfile);
  const [view, setView] = useState<"choose" | "signin" | "signup">("choose");
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");
  const [tos, setTos] = useState(false);
  const [msg, setMsg] = useState("");
  const remembered = loadSession();
  const continueRemembered = () => {
    const session = loadSession();
    if (!session) return;
    if (session.startsWith("guest:")) {
      setProfile(enterGuest(session.slice(6)));
      setPhase("title");
      return;
    }
    const p = useApp.getState().profile;
    if (p.username.toLowerCase() === session.toLowerCase() && !p.guest) {
      saveSession(session);
      setPhase("title");
      return;
    }
    setName(session);
    setView("signin");
    setMsg("Enter your password to continue.");
  };
  return (
    <div className="relative flex h-full flex-col items-center px-4 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <h1 className="pixel-title mc-logo-3d mt-[4vh] text-center text-[2.4rem] leading-[0.85] sm:mt-[7vh] sm:text-7xl">
        MINE
        <span className="block text-[#3f3]">OR CRAFT</span>
      </h1>
      <div className="mt-8 flex w-full max-w-[520px] flex-col items-center gap-4 sm:flex-row sm:items-stretch">
        <div className="flex flex-col items-center justify-center px-2">
          <SkinPreview skin={resolveSkin("steve")} size={168} />
          <p className="mt-2 text-[11px] tracking-wide text-muted">Player skin</p>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          {view === "choose" && (
            <>
              <p className="text-center text-sm text-muted">Sign in, create an account, or play as guest.</p>
              {remembered && (
                <McBtn primary onClick={continueRemembered}>
                  Continue as {remembered.replace(/^guest:/, "")}
                </McBtn>
              )}
              <McBtn primary={!remembered} onClick={() => setView("signin")}>
                Sign in
              </McBtn>
              <McBtn onClick={() => setView("signup")}>Sign up</McBtn>
              <McBtn
                onClick={() => {
                  setProfile(enterGuest("Guest"));
                  setPhase("title");
                }}
              >
                Play as guest
              </McBtn>
              <p className="text-center text-[11px] text-muted">Guests play locally only. No marketplace, skins, online, friends, or mini games.</p>
            </>
          )}
          {view === "signin" && (
            <>
              <p className="text-center text-sm text-muted">Welcome back. If this name is not in the vault, sign up first.</p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 16))}
                placeholder="Username"
                className="min-h-12 w-full border-2 border-black bg-[#00000088] px-3 text-fg outline-none"
              />
              <input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value.slice(0, 32))}
                placeholder="Password"
                className="min-h-12 w-full border-2 border-black bg-[#00000088] px-3 text-fg outline-none"
              />
              {msg && <p className="text-sm text-danger">{msg}</p>}
              <McBtn
                primary
                onClick={() => {
                  const res = signInAccount(name, pass);
                  if (!res.ok) {
                    setMsg(res.msg);
                    return;
                  }
                  setProfile(res.profile);
                  setPhase("title");
                }}
              >
                Sign in
              </McBtn>
              <McBtn onClick={() => { setView("choose"); setMsg(""); }}>Back</McBtn>
            </>
          )}
          {view === "signup" && (
            <>
              <p className="text-center text-sm text-muted">Create an account. You must agree to the terms.</p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 16))}
                placeholder="Username"
                className="min-h-12 w-full border-2 border-black bg-[#00000088] px-3 text-fg outline-none"
              />
              <input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value.slice(0, 32))}
                placeholder="Password (4+ characters)"
                className="min-h-12 w-full border-2 border-black bg-[#00000088] px-3 text-fg outline-none"
              />
              <div className="max-h-24 overflow-y-auto border-2 border-black bg-[#00000088] p-2 text-[11px] leading-5 text-muted whitespace-pre-wrap">
                {TOS}
              </div>
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input type="checkbox" checked={tos} onChange={(e) => setTos(e.target.checked)} />
                I agree not to hack the game or break the terms.
              </label>
              {msg && <p className="text-sm text-danger">{msg}</p>}
              <McBtn
                primary
                onClick={() => {
                  if (!tos) {
                    setMsg("Accept the terms of service to sign up.");
                    return;
                  }
                  const res = signUpAccount(name, pass);
                  if (!res.ok) {
                    setMsg(res.msg);
                    return;
                  }
                  setProfile(res.profile);
                  setPhase("title");
                }}
              >
                Create account
              </McBtn>
              <McBtn onClick={() => { setView("choose"); setMsg(""); }}>Back</McBtn>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function GuestDenied({ extra }: { extra?: string }) {
  const setPhase = useApp((s) => s.setPhase);
  return (
    <div className="mx-auto flex h-full w-full max-w-lg flex-col px-5 py-6">
      <button type="button" onClick={() => setPhase("title")} className="mb-3 flex items-center gap-1 text-sm text-muted">
        <ChevronLeft className="size-4" /> Back
      </button>
      <h2 className="pixel-title mb-3 text-3xl">Sign in required</h2>
      <p className="mb-4 text-sm text-muted">
        Guests can play local worlds and open Settings. {extra ?? "Sign in to use this."}
      </p>
      <McBtn primary onClick={() => { saveSession(null); setPhase("login"); }}>
        Sign in
      </McBtn>
    </div>
  );
}

function FriendsScreen() {
  const setPhase = useApp((s) => s.setPhase);
  const profile = useApp((s) => s.profile);
  const setProfile = useApp((s) => s.setProfile);
  const [fname, setFname] = useState("");
  const [code, setCode] = useState("");
  if (profile.guest) return <GuestDenied extra="Friends lists need an account." />;
  const friends = profile.friends ?? [];
  const add = () => {
    const n = fname.trim().slice(0, 16);
    const c = code.trim().slice(0, 24);
    if (!n || !c) return;
    if (friends.some((f) => f.code === c || f.name === n)) return;
    setProfile({ friends: [...friends, { name: n, code: c }] });
    setFname("");
    setCode("");
  };
  return (
    <div className="mx-auto flex h-full w-full max-w-lg flex-col px-5 py-6">
      <button type="button" onClick={() => setPhase("title")} className="mb-3 flex items-center gap-1 text-sm text-muted">
        <ChevronLeft className="size-4" /> Back
      </button>
      <h2 className="pixel-title mb-1 text-3xl">Friends</h2>
      <p className="mb-4 text-sm text-muted">Save a name and join code for Online.</p>
      <input
        value={fname}
        onChange={(e) => setFname(e.target.value.slice(0, 16))}
        placeholder="Friend name"
        className="mb-2 min-h-11 border-2 border-black bg-elevated px-3"
      />
      <div className="mb-4 flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24))}
          className="min-h-11 flex-1 border-2 border-black bg-elevated px-3"
          placeholder="join-code"
        />
        <button type="button" className="mc-btn mc-btn-primary min-h-11 px-4" onClick={add}>
          Add
        </button>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {friends.length === 0 && <p className="text-sm text-muted">No friends yet.</p>}
        {friends.map((f) => (
          <div key={f.code} className="mc-panel flex items-center justify-between gap-2 px-3 py-2">
            <span>
              <span className="block text-sm">{f.name}</span>
              <span className="text-xs text-muted">{f.code}</span>
            </span>
            <button
              type="button"
              className="mc-btn min-h-11 px-3 text-sm"
              onClick={() => {
                useApp.getState().setJoinCode(f.code);
                setPhase("lobby");
              }}
            >
              Join
            </button>
          </div>
        ))}
      </div>
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
      <button type="button" onClick={() => setPhase("title")} className="mb-3 flex items-center gap-1 text-sm text-muted">
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
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {(["survival", "creative", "hardcore", "adventure", "spectator"] as GameMode[]).map((m) => (
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
  if (mp && meta.code) store.setJoinCode(meta.code);
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
  const [note, setNote] = useState("");
  const published = worlds.filter((w) => w.published);
  return (
    <div className="mx-auto flex h-full w-full max-w-lg flex-col px-5 py-6">
      <button type="button" onClick={() => setPhase("title")} className="mb-3 flex items-center gap-1 text-sm text-muted">
        <ChevronLeft className="size-4" /> Back
      </button>
      <h2 className="pixel-title mb-1 text-3xl">Lobby</h2>
      <p className="mb-4 text-sm text-muted">
        Host from this device like a LAN world. Friends join with your code. When you later put the site on Cloudflare, the same join codes still work.
      </p>
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
            const code = (joinCode || "").toLowerCase();
            const listed = ARENA_LIST.find((a) => a.code === code);
            if (listed) {
              bootArena(listed.id);
              return;
            }
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
      {worlds.length === 0 && <p className="mb-3 text-sm text-muted">Create a local world first, then come back to list it.</p>}
      {note && <p className="mb-2 text-sm text-xp">{note}</p>}
      <div className="mb-4 space-y-2 overflow-y-auto">
        {worlds.slice(0, 6).map((w) => (
          <div key={w.id} className="mc-panel flex items-center justify-between gap-2 px-3 py-2">
            <span className="text-sm">
              {w.name}
              <span className="block text-xs text-muted">{w.published ? "Listed on Marketplace" : w.code}</span>
            </span>
            <button
              type="button"
              className={`mc-btn min-h-11 px-3 text-sm ${w.published ? "mc-btn-primary" : ""}`}
              onClick={() => {
                if (profile.guest) {
                  setNote("Guests cannot publish. Sign in first.");
                  return;
                }
                upsert({ ...w, published: true, priceXp: price }, { select: false });
                setNote(`Listed "${w.name}" on Marketplace${price ? ` for ${price} XP` : " (free)"}. Open Marketplace to see it.`);
              }}
            >
              {w.published ? "Listed" : "Publish"}
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
      <h3 className="mb-2 text-sm font-medium">Official minigames</h3>
      <div className="mb-4 grid grid-cols-2 gap-2">
        {ARENA_LIST.map((a) => (
          <button
            key={a.id}
            type="button"
            className="mc-panel flex w-full flex-col px-3 py-3 text-left"
            onClick={() => bootArena(a.id)}
          >
            <span className="text-sm">{a.name}</span>
            <span className="text-[11px] text-muted">{a.blurb}</span>
          </button>
        ))}
      </div>
      <McBtn
        className="mb-4"
        onClick={() => {
          if (profile.guest) {
            alert("Guests cannot host a published pack. Sign in, then open Game Lab.");
            return;
          }
          setPhase("lab");
        }}
      >
        Host a Game Lab pack
      </McBtn>
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
  const multiplayer = useApp((s) => s.multiplayer);

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
      useApp.getState().setOverlay("none");
      eng.setOverlay("none");
      eng.audio.unlock();
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

  const pct = Math.round(Math.min(100, Math.max(0, loadingPct * 100)));

  return (
    <>
      <canvas
        ref={canvasRef}
        className="touch-none absolute inset-0 h-full w-full"
        onPointerDown={() => getEngine()?.audio.unlock()}
      />
      {phase === "loading" && (
        <div className="mc-dirt-load absolute inset-0 z-40 flex flex-col items-center justify-center px-6">
          <h2 className="pixel-title text-3xl sm:text-4xl">MINE OR CRAFT</h2>
          <p className="mt-5 text-center text-sm text-fg/90">{loadingMsg}</p>
          <div className="mc-meter mt-4">
            <i style={{ width: `${pct}%` }} />
          </div>
          <p className="hud-num mt-2 text-sm text-xp">{pct}%</p>
          <p className="mt-6 max-w-xs text-center text-xs text-muted">
            Generating chunks. This can take a few seconds on phones — keep this tab open.
          </p>
        </div>
      )}
      {phase === "playing" && overlay === "none" && hud && <Hud hud={hud} />}
      {phase === "playing" && overlay === "none" && <MobileControls />}
      {overlay === "pause" && <PauseMenu />}
      {overlay === "studio" && <StudioTools />}
      {overlay === "settings" && <SettingsPanel fromPause={phase === "playing"} />}
      {(overlay === "inventory" || overlay === "crafting" || overlay === "furnace") && <InventoryOverlay kind={overlay} />}
      {overlay === "chat" && <ChatOverlay />}
      {overlay === "dead" && <DeadScreen />}
      {overlay === "credits" && <WinScreen />}
      {overlay === "advancements" && <Advancements />}
      {overlay === "storm" && <StormCutscene />}
      {multiplayer && phase === "playing" && <NetBridge />}
    </>
  );
}

function Hud({ hud }: { hud: NonNullable<ReturnType<typeof useApp.getState>["hud"]> }) {
  const settings = useApp((s) => s.settings);
  const hearts = Math.ceil(hud.health / 2);
  const food = Math.ceil(hud.hunger / 2);
  const scale = settings.guiScale;
  const airBubbles = Math.ceil(Math.max(0, hud.air) / 1);
  const absHearts = Math.ceil((hud.absorption ?? 0) / 2);
  const cd = Math.max(0, Math.min(1, hud.attackCd ?? 1));
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
      {(hud.hitFlash ?? 0) > 0 && (
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="h-5 w-5 rotate-45 border-t-2 border-r-2 border-white/90" />
        </div>
      )}
      {hud.blocking && (
        <p className="absolute top-[46%] left-1/2 -translate-x-1/2 text-[10px] tracking-widest text-white/80">BLOCKING</p>
      )}
      {(hud.bowCharge ?? 0) > 0.05 && (
        <div className="absolute top-[58%] left-1/2 w-28 -translate-x-1/2">
          <div className="h-1.5 border border-black bg-slot-dark">
            <div className="h-full bg-[#c8a05a]" style={{ width: `${Math.round((hud.bowCharge ?? 0) * 100)}%` }} />
          </div>
        </div>
      )}
      {hud.arena && (
        <div className="pointer-events-none absolute top-3 left-1/2 w-[min(360px,86%)] -translate-x-1/2 text-center">
          <p className="pixel-title text-lg tracking-wide">{hud.arena === "duel" ? "DUAL" : hud.arena.toUpperCase()}</p>
          <p className="text-[11px] text-fg/80">
            {hud.arena === "duel"
              ? "PvP · sword · shield · golden apple"
              : hud.arena === "bedwars"
                ? "Protect your bed. Break theirs."
                : hud.arena === "skywars"
                  ? "Loot the islands. Last standing."
                  : "Steal the enemy banner."}{" "}
            · {hud.kills ?? 0} kills
          </p>
        </div>
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
      {hud.chat.length > 0 && (
        <div className="absolute bottom-24 left-3 max-w-[min(420px,70%)] space-y-0.5 bg-black/45 px-2 py-1 text-[11px] leading-4">
          {hud.chat.slice(-6).map((line, i) => (
            <p key={i} className="break-words text-fg/90">
              {line}
            </p>
          ))}
        </div>
      )}
      <div className="hud-cluster absolute left-1/2 flex w-[min(420px,96%)] -translate-x-1/2 flex-col items-center gap-1 pb-[env(safe-area-inset-bottom)]">
        {hud.mode !== "creative" && (
          <div className="flex w-full justify-between px-1">
            <div className="flex gap-0.5">
              {Array.from({ length: 10 }, (_, i) => (
                <Heart
                  key={i}
                  className="size-4"
                  fill={i < hearts ? "#c45c4a" : i < hearts + absHearts ? "#f0c832" : "transparent"}
                  color={i < hearts ? "#c45c4a" : i < hearts + absHearts ? "#f0c832" : "#3a2020"}
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
        <div className="h-1 w-24 border border-black bg-slot-dark">
          <div className="h-full bg-white/80" style={{ width: `${cd * 100}%` }} />
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
      <div className="absolute top-2 right-2 pointer-events-auto z-50 flex gap-2 pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)]">
        <button
          type="button"
          className="mc-btn size-12 p-0 sm:size-11"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            getEngine()?.setOverlay("chat");
          }}
          aria-label="Chat"
        >
          <MessageSquare className="mx-auto size-5" />
        </button>
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
  const scheme = useApp((s) => s.settings.controlScheme);
  const [coarse, setCoarse] = useState(
    () =>
      typeof window !== "undefined" &&
      (window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(max-width: 900px)").matches),
  );
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const narrow = window.matchMedia("(max-width: 900px)");
    const fn = () => setCoarse(mq.matches || narrow.matches || "ontouchstart" in window);
    mq.addEventListener?.("change", fn);
    narrow.addEventListener?.("change", fn);
    window.addEventListener("touchstart", fn, { once: true });
    fn();
    return () => {
      mq.removeEventListener?.("change", fn);
      narrow.removeEventListener?.("change", fn);
    };
  }, []);
  if (scheme === "keys") return null;
  if (scheme === "auto" && !coarse) return null;

  const onStick = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    const el = e.currentTarget as HTMLElement;
    const handler = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
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
      el.removeEventListener("pointermove", handler);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
    el.addEventListener("pointermove", handler);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    handler(e.nativeEvent);
  };

  const onLook = (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    let lx = e.clientX,
      ly = e.clientY;
    const el = e.currentTarget as HTMLElement;
    const move = (ev: PointerEvent) => {
      const input = eng()?.input;
      if (!input) return;
      input.touchLook.x += (ev.clientX - lx) * 0.0075;
      input.touchLook.y += (ev.clientY - ly) * 0.0075;
      lx = ev.clientX;
      ly = ev.clientY;
    };
    const up = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  };

  const hold = (key: "touchJump" | "touchAttack" | "touchUse" | "touchSneak" | "touchSprint" | "touchBlock") => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
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

  const stick = 6.4 * size;
  return (
    <div className="mc-touch-layer">
      <div className="mc-look-pad pointer-events-auto" onPointerDown={onLook} />
      <div
        className="mc-joy pointer-events-auto relative rounded-full border-2 border-white/30 bg-black/30"
        style={{ width: `${stick}rem`, height: `${stick}rem` }}
        onPointerDown={onStick}
      >
        <div
          className="absolute size-11 rounded-full bg-white/40"
          style={{
            left: `calc(50% + ${joy.x * 28 * size}px - 22px)`,
            top: `calc(50% + ${-joy.y * 28 * size}px - 22px)`,
          }}
        />
      </div>
      <div className="mc-actions pointer-events-auto">
        <button type="button" className="mc-btn h-20 w-24 text-lg" {...hold("touchJump")}>
          Jump
        </button>
        <div className="flex gap-1.5">
          <button type="button" className="mc-btn h-16 min-w-16 px-3 text-base" {...hold("touchAttack")}>
            Hit
          </button>
          <button type="button" className="mc-btn h-16 min-w-16 px-3 text-base" {...hold("touchUse")}>
            Use
          </button>
        </div>
        <div className="flex max-w-[9.5rem] flex-wrap justify-end gap-1">
          <button type="button" className="mc-btn h-10 min-w-12 px-2 text-[11px]" {...hold("touchSprint")}>
            Sprint
          </button>
          <button type="button" className="mc-btn h-10 min-w-12 px-2 text-[11px]" {...hold("touchSneak")}>
            Sneak
          </button>
          <button type="button" className="mc-btn h-10 min-w-12 px-2 text-[11px]" {...hold("touchBlock")}>
            Block
          </button>
          <button
            type="button"
            className="mc-btn h-10 min-w-12 px-2 text-[11px]"
            onPointerDown={(e) => {
              e.stopPropagation();
              eng()?.player.eat();
            }}
          >
            Eat
          </button>
        </div>
      </div>
    </div>
  );
}

function PauseMenu() {
  const setOverlay = useApp((s) => s.setOverlay);
  const setPhase = useApp((s) => s.setPhase);
  const mp = useApp((s) => s.multiplayer);
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 px-5">
      <div className="mc-panel w-full max-w-sm p-6">
        <h2 className="pixel-title mb-2 text-center text-2xl">{mp ? "Game Menu" : "Paused"}</h2>
        {mp && <p className="mb-4 text-center text-[11px] text-muted">Online worlds keep running. You are the only one in this menu.</p>}
        <div className="space-y-3">
          <McBtn
            primary
            onClick={() => {
              getEngine()?.setOverlay("none");
              setOverlay("none");
            }}
          >
            Resume
          </McBtn>
          <McBtn onClick={() => setOverlay("settings")}>Settings</McBtn>
          {(!!getEngine()?.meta.cheats || !!getEngine()?.meta.modJson) && !useApp.getState().multiplayer && !getEngine()?.meta.arena && (
          <McBtn
            onClick={() => {
              const e = getEngine();
              if (!e) return;
              e.setOverlay("studio");
            }}
          >
            Studio Tools
          </McBtn>
          )}
          <McBtn onClick={() => setOverlay("advancements")}>Advancements</McBtn>
          <McBtn
            onClick={() => {
              const e = getEngine();
              void (async () => {
                if (e) await e.persist();
                e?.dispose();
                engineRef = null;
                setOverlay("none");
                setPhase("title");
              })();
            }}
          >
            Save and Quit
          </McBtn>
        </div>
      </div>
    </div>
  );
}

function StudioTools() {
  const e = getEngine();
  const setOverlay = useApp((s) => s.setOverlay);
  const [tick, setTick] = useState(0);
  if (!e) return null;
  const blocked = !!(e.meta.arena || useApp.getState().multiplayer);
  const toggle = (k: keyof typeof e.studio) => {
    if (blocked) return;
    e.studio[k] = !e.studio[k];
    e.applyStudio();
    setTick((n) => n + 1);
  };
  const give = (id: number) => {
    if (blocked) return;
    e.player.give(id, id < 10000 || id === 10033 || id === 10107 ? 32 : 1);
    e.toastMsg("Gave item");
    setTick((n) => n + 1);
  };
  void tick;
  const row = (k: keyof typeof e.studio, label: string) => (
    <button
      type="button"
      className={`mc-btn min-h-11 w-full ${e.studio[k] ? "mc-btn-primary" : ""}`}
      onClick={() => toggle(k)}
    >
      {label} {e.studio[k] ? "ON" : "off"}
    </button>
  );
  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-start justify-start p-3 pt-[max(3rem,env(safe-area-inset-top))]">
      <div className="pointer-events-auto mc-panel max-h-[80vh] w-full max-w-xs overflow-y-auto p-4">
        <h2 className="pixel-title mb-1 text-xl">Studio Tools</h2>
        <p className="mb-3 text-[11px] text-muted">Local worlds only. Insert or ` to toggle. Not for online or Dual.</p>
        {blocked && <p className="mb-2 text-sm text-danger">Disabled on online / arena worlds.</p>}
        <div className="space-y-2">
          {row("fly", "Fly")}
          {row("god", "Invincible")}
          {row("speed", "Speed")}
          {row("fullbright", "Fullbright")}
          {row("freeze", "Freeze time")}
          {row("hitboxes", "Show hitboxes")}
          <div className="grid grid-cols-2 gap-1">
            <button type="button" className="mc-btn min-h-10 text-xs" onClick={() => give(10023)}>
              Sword
            </button>
            <button type="button" className="mc-btn min-h-10 text-xs" onClick={() => give(1)}>
              Grass
            </button>
            <button type="button" className="mc-btn min-h-10 text-xs" onClick={() => give(42)}>
              Torch
            </button>
            <button
              type="button"
              className="mc-btn min-h-10 text-xs"
              onClick={() => {
                give(10032);
                give(10033);
              }}
            >
              Bow
            </button>
            <button
              type="button"
              className="mc-btn min-h-10 text-xs"
              onClick={() => {
                give(10106);
                give(10107);
              }}
            >
              Elytra
            </button>
          </div>
          <McBtn
            primary
            onClick={() => {
              e.setOverlay("none");
              setOverlay("none");
            }}
          >
            Close
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
  const [invTab, setInvTab] = useState<"all" | "blocks" | "items">("all");
  const [book, setBook] = useState(false);
  const table = kind === "crafting";
  const n = table ? 3 : 2;
  const result = useMemo(() => matchRecipe(craft, table), [craft, table]);
  const recipes = useMemo(() => bookRecipes(table), [table]);
  const craftRef = useRef(craft);
  craftRef.current = craft;
  const profile = useApp((s) => s.profile);
  useEffect(() => {
    return () => {
      const p = engineRef?.player;
      if (!p) return;
      dumpGrid(p.inventory, craftRef.current);
    };
  }, []);

  const clickSlot = (list: "inv" | "craft" | "armor" | "off", i: number, one = false) => {
    if (!engineRef) return;
    const p = engineRef.player;
    const arr = list === "inv" ? p.inventory : list === "craft" ? craft : list === "armor" ? p.armor : [p.offhand];
    const cur = arr[i] ?? null;
    if (one) {
      if (held && (!cur || held.id === cur.id)) {
        const max = getDef(held.id)?.stack ?? 64;
        if (!cur) arr[i] = { id: held.id, count: 1 };
        else if (cur.count < max) cur.count += 1;
        else return;
        held.count -= 1;
        setHeld(held.count <= 0 ? null : { ...held });
      } else if (!held && cur) {
        setHeld({ id: cur.id, count: 1 });
        cur.count -= 1;
        if (cur.count <= 0) arr[i] = null;
      }
    } else if (held && cur && held.id === cur.id) {
      const max = getDef(held.id)?.stack ?? 64;
      const add = Math.min(max - cur.count, held.count);
      cur.count += add;
      held.count -= add;
      if (held.count <= 0) setHeld(null);
      else setHeld({ ...held });
    } else {
      arr[i] = held;
      setHeld(cur);
    }
    if (list === "off") p.offhand = arr[0] ?? null;
    if (list === "craft") setCraft([...craft]);
    useApp.getState().setHud({ ...(useApp.getState().hud as NonNullable<typeof hud>), inventory: [...p.inventory] });
  };

  const slotEv = (list: "inv" | "craft" | "armor" | "off", i: number) => ({
    onClick: () => clickSlot(list, i, false),
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault();
      clickSlot(list, i, true);
    },
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType === "mouse") return;
      const timer = window.setTimeout(() => clickSlot(list, i, true), 420);
      const clear = () => {
        window.clearTimeout(timer);
        window.removeEventListener("pointerup", clear);
        window.removeEventListener("pointercancel", clear);
      };
      window.addEventListener("pointerup", clear);
      window.addEventListener("pointercancel", clear);
    },
  });

  const takeResult = (all = false) => {
    if (!engineRef) return;
    let guard = 0;
    do {
      const hit = matchRecipe(craft, table);
      if (!hit) break;
      consumeGrid(craft, n);
      if (held && held.id === hit.out.id) {
        held.count += hit.out.count;
        setHeld({ ...held });
      } else if (!held) setHeld({ ...hit.out });
      else mergeInto(engineRef.player.inventory, { ...hit.out });
      engineRef.audio.craft();
      guard++;
    } while (all && guard < 64);
    setCraft([...craft]);
    useApp.getState().setHud({ ...(useApp.getState().hud as NonNullable<typeof hud>), inventory: [...engineRef.player.inventory] });
  };

  const pickRecipe = (r: (typeof recipes)[number]) => {
    if (!engineRef) return;
    const ok = fillGridFromRecipe(engineRef.player.inventory, craft, r, n);
    setCraft([...craft]);
    useApp.getState().setHud({ ...(useApp.getState().hud as NonNullable<typeof hud>), inventory: [...engineRef.player.inventory] });
    if (ok) engineRef.audio.ui();
  };

  const creative = hud?.mode === "creative";
  const found = useMemo(() => {
    const q = query.toLowerCase();
    const list: { id: number; name: string }[] = [];
    if (invTab !== "items") {
      for (let i = 1; i < BLOCK_COUNT && list.length < 120; i++) {
        const b = BLOCKS[i];
        if (!b) continue;
        if (!q || b.name.toLowerCase().includes(q)) list.push({ id: b.id, name: b.name });
      }
    }
    if (invTab !== "blocks") {
      for (const it of ITEMS.values()) {
        if (!q || it.name.toLowerCase().includes(q) || it.key.includes(q)) list.push({ id: it.id, name: it.name });
      }
    }
    return list.slice(0, 160);
  }, [query, invTab]);

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
              if (engineRef) {
                dumpGrid(engineRef.player.inventory, craft);
                if (held) mergeInto(engineRef.player.inventory, held);
              }
              getEngine()?.setOverlay("none");
              setOverlay("none");
            }}
          >
            Close
          </button>
        </div>
        {kind !== "furnace" && (
          <div className="mb-4 flex flex-wrap items-start gap-3">
            <div className="flex gap-2">
              <div className="flex flex-col gap-1">
                {hud.armor.map((s, i) => (
                  <button key={i} type="button" className="mc-slot" {...slotEv("armor", i)}>
                    {s && <ItemIcon id={s.id} count={s.count} />}
                  </button>
                ))}
                <button type="button" className="mc-slot" {...slotEv("off", 0)}>
                  {hud.offhand && <ItemIcon id={hud.offhand.id} count={hud.offhand.count} />}
                </button>
              </div>
              <div className="flex flex-col items-center">
                <SkinPreview skin={resolveSkin(profile.skin)} size={table ? 88 : 108} />
                <p className="mt-1 text-[10px] text-muted">You</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div>
                <p className="mb-1 text-[10px] tracking-wide text-muted">{table ? "3×3 table" : "2×2 crafting"}</p>
                <div className={`grid gap-1 ${table ? "grid-cols-3" : "grid-cols-2"}`}>
                  {Array.from({ length: n * n }, (_, i) => (
                    <button key={i} type="button" className="mc-slot" {...slotEv("craft", i)}>
                      {craft[i] && <ItemIcon id={craft[i]!.id} count={craft[i]!.count} />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-7 text-muted">→</div>
              <div className="pt-5">
                <button
                  type="button"
                  className="mc-slot size-14"
                  onClick={(e) => takeResult(e.shiftKey)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    takeResult(true);
                  }}
                >
                  {result && <ItemIcon id={result.out.id} count={result.out.count} />}
                </button>
                <p className="mt-1 w-14 text-center text-[9px] text-muted">Hold / Shift: all</p>
              </div>
              <button
                type="button"
                className={`mc-btn mt-5 size-12 p-0 ${book ? "mc-btn-primary" : ""}`}
                style={book ? undefined : { background: "#3d7a32", boxShadow: "inset 2px 2px 0 #6cbf4e, inset -2px -2px 0 #1e4a18" }}
                onClick={() => setBook((b) => !b)}
                aria-label="Recipe book"
                title="Recipe book"
              >
                <BookOpen className="mx-auto size-5" />
              </button>
            </div>
          </div>
        )}
        {kind !== "furnace" && book && (
          <div className="mb-3 border-2 border-black bg-[#1a140c] p-2">
            <p className="mb-1 text-[11px] text-[#8fd46a]">Recipe book — tap a recipe you have the items for. It fills the grid like Minecraft.</p>
            <div className="grid max-h-36 grid-cols-8 gap-1 overflow-y-auto sm:grid-cols-10">
              {recipes.map((r) => {
                const ready = engineRef ? hasIngredients(engineRef.player.inventory, r) : false;
                return (
                  <button
                    key={r.out}
                    type="button"
                    className={`mc-slot ${ready ? "outline outline-1 outline-[#6cbf4e]" : "opacity-40"}`}
                    title={displayName(r.out)}
                    onClick={() => pickRecipe(r)}
                  >
                    <ItemIcon id={r.out} count={r.count} />
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <p className="mb-2 text-[11px] text-muted">
          Tap a slot to move a whole stack. Right-click or long-press to place or take one. One log in any 2×2 square makes planks. Four planks, one per square, make a crafting table.
        </p>
        {kind === "furnace" && <FurnaceMini />}
        <p className="mb-1 text-xs text-muted">Inventory</p>
        <div className="inv-grid">
          {hud.inventory.slice(9).map((s, i) => (
            <button key={i + 9} type="button" className="mc-slot" {...slotEv("inv", i + 9)}>
              {s && <ItemIcon id={s.id} count={s.count} />}
            </button>
          ))}
        </div>
        <div className="inv-grid mt-2">
          {hud.inventory.slice(0, 9).map((s, i) => (
            <button key={i} type="button" className="mc-slot" {...slotEv("inv", i)}>
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
            <div className="mb-2 grid grid-cols-3 gap-1">
              {(["all", "blocks", "items"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`mc-btn min-h-10 text-xs capitalize ${invTab === t ? "mc-btn-primary" : ""}`}
                  onClick={() => setInvTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search boats, potions, blocks…"
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
  const [val, setVal] = useState("");
  const setOverlay = useApp((s) => s.setOverlay);
  const cheatsOn = !!useApp.getState().active?.cheats || !!useApp.getState().active?.modJson || useApp.getState().active?.mode === "creative";
  const mp = useApp((s) => s.multiplayer);
  const close = () => {
    engineRef?.closeChat();
    setOverlay("none");
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      engineRef?.input.releaseAll();
      if (engineRef) {
        engineRef.input.enabled = true;
        engineRef.paused = false;
      }
    };
  }, []);
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 bg-black/70 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const text = val.trim();
          if (text.startsWith("/")) {
            if (!cheatsOn) {
              engineRef?.chat.push("Cheats are off in this world.");
            } else {
              const r = engineRef?.cheat(text) ?? "";
              engineRef?.chat.push(text);
              engineRef?.chat.push(r);
            }
          } else if (text) {
            const line = `${useApp.getState().profile.username}: ${text}`;
            engineRef?.chat.push(line);
            engineRef?.netChat.push(line);
            engineRef?.onPlayerChat(text);
          }
          close();
        }}
      >
        <input
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              close();
            }
          }}
          className="min-h-12 w-full border-2 border-black bg-elevated px-3"
          placeholder={cheatsOn ? "Message or /command" : mp ? "Say something" : "Message"}
        />
      </form>
      {cheatsOn ? (
        <p className="mt-1 text-[11px] text-muted">/give 1 64 · /gamemode creative · /time day · /weather clear · Esc to close</p>
      ) : (
        <p className="mt-1 text-[11px] text-muted">{mp ? "Online chat. Everyone keeps playing while you type." : "Chat only. Commands need Allow cheats."} Esc closes.</p>
      )}
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
              const eng = getEngine();
              if (eng) {
                eng.player.health = 20;
                eng.player.hunger = 20;
                eng.player.x = eng.meta.spawn.x;
                eng.player.y = eng.meta.spawn.y;
                eng.player.z = eng.meta.spawn.z;
                if (eng.meta.arena) eng.giveArenaKit(false);
                eng.setOverlay("none");
              }
              setOverlay("none");
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
            setPhase("title");
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
          The Wither Storm is gone. A star lands on your profile. Five stars become a diamond. The world remains yours.
        </p>
        <McBtn primary className="mt-6" onClick={() => setOverlay("none")}>
          Continue
        </McBtn>
      </div>
    </div>
  );
}

function StormCutscene() {
  const setOverlay = useApp((s) => s.setOverlay);
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 px-5">
      <div className="mc-panel w-full max-w-md p-6 text-center">
        <h2 className="pixel-title mb-3 text-3xl">The Wither Storm</h2>
        <p className="text-sm text-muted">
          The Void Wyrm is gone, but a command block in the overworld has woken. A three-headed storm pulls the world into itself. Hit the glowing core in its chest until it falls. Then you really clear the story.
        </p>
        <McBtn
          primary
          className="mt-6"
          onClick={() => {
            getEngine()?.beginStorm();
            setOverlay("none");
          }}
        >
          Face it
        </McBtn>
      </div>
    </div>
  );
}

function NetBridge() {
  const joinCode = useApp((s) => s.joinCode);
  const profile = useApp((s) => s.profile);
  const isHost = useApp((s) => s.isHost);
  const code = (joinCode || useApp.getState().active?.code || "local").slice(0, 24);
  const net = useP2PRoom({ room: code, name: profile.username });
  useEffect(() => {
    useApp.getState().setNet({ peers: net.peers.map((p) => ({ id: p.id, name: p.name })) });
  }, [net.peers]);
  useEffect(() => {
    const un = net.onMessage((_from, data) => {
      const d = data as { t?: string; x?: number; y?: number; z?: number; text?: string };
      if (d?.t === "pos") {
        /* guests render host world locally; positions are informational */
      }
      if (d?.t === "chat" && typeof d.text === "string") {
        getEngine()?.chat.push(d.text.slice(0, 140));
      }
    });
    const id = window.setInterval(() => {
      const e = getEngine();
      if (!e) return;
      net.broadcast({ t: "pos", x: e.player.x, y: e.player.y, z: e.player.z, name: profile.username });
      if (e.netChat.length) {
        for (const line of e.netChat.splice(0, e.netChat.length)) net.broadcast({ t: "chat", text: line });
      }
    }, 80);
    return () => {
      un();
      window.clearInterval(id);
    };
  }, [net, profile.username]);
  return (
    <div className="pointer-events-none absolute top-3 right-3 z-30 mc-panel px-3 py-1 text-[11px]">
      {isHost ? "Hosting" : "Joined"} · {code} · {net.peers.length} peer{net.peers.length === 1 ? "" : "s"}
    </div>
  );
}

function Advancements() {
  const unlocked = useApp((s) => s.profile.unlocked);
  const setOverlay = useApp((s) => s.setOverlay);
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 px-5">
      <div className="mc-panel w-full max-w-md p-5">
        <h2 className="pixel-title mb-1 text-2xl">Advancements</h2>
        <p className="mb-3 text-[11px] text-muted">{unlocked.length} / {ADVANCEMENTS.length} · XP is Minecoins for servers</p>
        <ul className="max-h-[50vh] space-y-2 overflow-y-auto text-sm">
          {ADVANCEMENTS.map((a) => (
            <li key={a.id} className={unlocked.includes(a.id) ? "text-xp" : "text-muted"}>
              {unlocked.includes(a.id) ? "Done — " : "Locked — "}
              {a.name}
              <span className="ml-1 text-[11px] opacity-70">+{a.xp} XP</span>
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

function Minigames() {
  const setPhase = useApp((s) => s.setPhase);
  return (
    <div className="mx-auto flex h-full w-full max-w-lg flex-col px-5 py-6">
      <button type="button" onClick={() => setPhase("title")} className="mb-3 flex items-center gap-1 text-sm text-muted">
        <ChevronLeft className="size-4" /> Back
      </button>
      <h2 className="pixel-title mb-1 text-3xl">Mini Games</h2>
      <p className="mb-4 text-sm text-muted">Official arenas with bots. Dual is sword and shield, no building. Friends can join with the room code.</p>
      <div className="space-y-2">
        {ARENA_LIST.map((a) => (
          <button
            key={a.id}
            type="button"
            className="mc-panel flex w-full items-center justify-between px-4 py-3 text-left"
            onClick={() => bootArena(a.id)}
          >
            <span>
              <span className="block font-medium">{a.name}</span>
              <span className="text-xs text-muted">{a.blurb} · code {a.code}</span>
            </span>
            <Users className="size-4 text-muted" />
          </button>
        ))}
      </div>
    </div>
  );
}

function Workshop() {
  const setPhase = useApp((s) => s.setPhase);
  const upsert = useApp((s) => s.upsertWorld);
  const [name, setName] = useState("My Server");
  const [code, setCode] = useState(WORKSHOP_TEMPLATE);
  const [err, setErr] = useState("");
  return (
    <div className="mx-auto flex h-full w-full max-w-lg flex-col px-5 py-6">
      <button type="button" onClick={() => setPhase("lobby")} className="mb-3 flex items-center gap-1 text-sm text-muted">
        <ChevronLeft className="size-4" /> Back
      </button>
      <h2 className="pixel-title mb-1 text-3xl">Server snippet</h2>
      <p className="mb-3 text-sm text-muted">
        Public mod JSON — kit, gamerules, and mob AI. Bots wander, guard, chase, circle, or flee. Boot a full world, not Dual.
      </p>
      <label className="text-xs text-muted">Server name</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mb-3 min-h-11 border-2 border-black bg-elevated px-3"
      />
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        className="min-h-[40vh] flex-1 border-2 border-black bg-[#0c0d10] p-3 font-mono text-xs text-fg"
      />
      {err && <p className="mt-2 text-sm text-danger">{err}</p>}
      <McBtn
        primary
        className="mt-3"
        onClick={() => {
          try {
            JSON.parse(code);
            const meta = newWorldMeta(name || "My Server", Date.now() % 1e9, "survival", true);
            meta.modJson = code;
            upsert(meta);
            useApp.getState().setNet({ multiplayer: true, isHost: true });
            void bootWorld(meta, true);
          } catch {
            setErr("JSON did not parse. Check commas and quotes.");
          }
        }}
      >
        Boot this server
      </McBtn>
    </div>
  );
}

