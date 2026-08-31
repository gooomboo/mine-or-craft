import { useMemo, useState } from "react";
import { ChevronLeft, Folder, Info } from "lucide-react";
import {
  HATS,
  ITEM_PICKS,
  MOB_PICKS,
  OPS,
  VANILLA_TEX,
  compileGame,
  detectXpFarm,
  emptyPixels,
  emptyProject,
  loadGames,
  normalizeGame,
  saveGames,
  type CustomBlock,
  type GameProject,
  type HatKind,
  type OpKind,
  type PublishMode,
  type ScriptCard,
  type StackBlock,
} from "@/game/scratch";
import { SKIN_PALETTE, numToHex } from "@/game/skins";
import { newWorldMeta } from "@/game/save";
import { useApp } from "@/store/app-store";

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

function BlockChip({ color, children, onClick }: { color: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-1 w-full rounded-md px-3 py-2 text-left text-sm font-medium text-black"
      style={{ background: color, boxShadow: "0 2px 0 rgba(0,0,0,.35)" }}
    >
      {children}
    </button>
  );
}

type LabTab = "scripts" | "commands" | "display" | "data" | "blocks" | "sounds" | "bosses" | "world" | "share";

const HELP: Record<LabTab | "home", string> = {
  home: "Game Lab is a visual editor for your own worlds. Events fire when something happens. Stacks run in order. Packs stay on this device until you share them. Guests can play, not publish.",
  scripts: "Yellow hats are events. Colored stacks are actions. Tap an event, then tap actions. Play / Playtest runs start and join the moment you enter the world.",
  commands: "Chat commands, one per line. Same syntax as in-game: /give @s diamond_sword 1, /tp @s ~ ~10 ~, /execute as @a at @s run say hi. They run when the world starts.",
  display: "Styled on-screen text. Color, bold, and the words players see. Used by tellraw and title stacks.",
  data: "Entity data tags applied to mobs this pack spawns. NoAI freezes them. Invulnerable makes them unkillable. CustomName shows above their head.",
  blocks: "Paint 16×16 pixel art for a new block, or recolor a vanilla texture. Custom blocks only exist in YOUR pack — people who join this game see them too.",
  sounds: "Attach a short audio file. Play it from a sound stack. Files stay in the pack.",
  bosses: "Drop a named boss into the world: Void Wyrm, Wither, Wither Storm, or a custom boss with its own name and health.",
  world: "Overworld spawn biome only. Nether and End stay locked so players cannot skip to the story bosses. Folder name groups saves on the Play screen.",
  share: "Private = this device. Friends = join code, their computer talks to yours. Marketplace = XP listing. Host = you are the server from this browser.",
};

export function GameLab() {
  const setPhase = useApp((s) => s.setPhase);
  const profile = useApp((s) => s.profile);
  const upsert = useApp((s) => s.upsertWorld);
  const [games, setGames] = useState<GameProject[]>(() => loadGames());
  const [openId, setOpenId] = useState<string | null>(null);
  const [help, setHelp] = useState(true);
  const [tab, setTab] = useState<LabTab>("scripts");
  const [msg, setMsg] = useState("");
  const [texSlot, setTexSlot] = useState(0);
  const [paintColor, setPaintColor] = useState(0x7a9a4a);
  const [paintTool, setPaintTool] = useState<"pen" | "fill">("pen");
  const [q, setQ] = useState("");

  const cur = games.find((g) => g.id === openId) ?? null;
  const folders = useMemo(() => {
    const set = new Set(games.map((g) => g.folder || "Saves"));
    if (!set.size) set.add("Saves");
    return [...set];
  }, [games]);

  if (profile.guest) {
    return (
      <div className="mx-auto flex h-full w-full max-w-lg flex-col justify-center px-5 py-8">
        <h2 className="pixel-title mb-3 text-3xl">Game Lab locked</h2>
        <p className="mb-4 text-sm text-muted">
          Guests can play worlds and minigames. Sign in on this device to create, save, and share packs. No real money.
        </p>
        <McBtn primary onClick={() => setPhase("login")}>
          Sign in
        </McBtn>
        <McBtn onClick={() => setPhase("title")}>Back</McBtn>
      </div>
    );
  }

  const persist = (next: GameProject) => {
    const list = [next, ...games.filter((g) => g.id !== next.id)].map(normalizeGame);
    setGames(list);
    saveGames(list);
  };

  const play = (g: GameProject, host = false) => {
    const farm = detectXpFarm(g);
    const meta = newWorldMeta(g.name || "Mini Game", Date.now() % 1e9, "survival", !!g.allowCheats);
    meta.modJson = compileGame(g);
    meta.spawnBiome = g.spawnBiome;
    meta.author = profile.username;
    meta.labGame = true;
    meta.xpFarm = farm.farm;
    upsert(meta);
    useApp.getState().setNet({ multiplayer: host || g.publishMode === "host" || g.publishMode === "friends", isHost: true });
    useApp.getState().setActive(meta);
    useApp.getState().setPhase("loading");
    useApp.getState().setOverlay("none");
  };

  if (!cur) {
    return (
      <div className="mx-auto flex h-full w-full max-w-3xl flex-col px-3 py-4 sm:px-5">
        <button type="button" onClick={() => setPhase("title")} className="mb-2 flex items-center gap-1 text-sm text-muted">
          <ChevronLeft className="size-4" /> Back
        </button>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="pixel-title text-3xl">Game Lab</h2>
            <p className="text-sm text-muted">Your packs. Open a folder, or start a new game.</p>
          </div>
          <McBtn
            primary
            className="max-w-[11rem]"
            onClick={() => {
              const p = emptyProject(profile.username);
              persist(p);
              setOpenId(p.id);
            }}
          >
            New game
          </McBtn>
        </div>
        {help && (
          <div className="mc-panel mb-3 p-3 text-sm">
            <p className="mb-1 flex items-center gap-1 text-xs tracking-wide text-muted">
              <Info className="size-3" /> How this works
            </p>
            {HELP.home}
          </div>
        )}
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
          {games.length === 0 && <p className="text-sm text-muted">No packs yet. New game makes a folder on this device.</p>}
          {folders.map((f) => (
            <div key={f} className="mc-panel p-3">
              <p className="mb-2 flex items-center gap-2 text-xs tracking-wide text-muted">
                <Folder className="size-3" /> {f}
              </p>
              <div className="space-y-1">
                {games
                  .filter((g) => (g.folder || "Saves") === f)
                  .map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      className="mc-btn min-h-11 w-full text-left text-sm"
                      onClick={() => setOpenId(g.id)}
                    >
                      {g.name}
                      <span className="ml-2 text-[11px] text-muted">
                        {g.publishMode === "market" ? "Marketplace" : g.publishMode === "host" ? "Hosted" : g.publishMode === "friends" ? "Friends" : "Private"}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const addScript = (when: HatKind) => persist({ ...cur, scripts: [...cur.scripts, { when, every: 8, do: [] }] });
  const addOp = (op: OpKind) => {
    const scripts = cur.scripts.slice();
    let last = scripts[scripts.length - 1];
    if (!last) {
      last = { when: "start", every: 8, do: [] };
      scripts.push(last);
    }
    last.do = [...last.do, { op, id: 10023, count: 1, text: op === "sound" ? (cur.sounds[0]?.name ?? "craft") : "Hello!", kind: "zombie", value: 1 }];
    persist({ ...cur, scripts });
  };
  const patchOp = (si: number, oi: number, patch: Partial<StackBlock>) => {
    persist({
      ...cur,
      scripts: cur.scripts.map((s, i) => (i === si ? { ...s, do: s.do.map((b, j) => (j === oi ? { ...b, ...patch } : b)) } : s)),
    });
  };

  const block: CustomBlock = cur.customBlocks[texSlot] ?? {
    slot: texSlot,
    name: `Custom ${texSlot + 1}`,
    tint: paintColor,
    pixels: emptyPixels(paintColor),
  };

  const paintPixel = (i: number) => {
    const pixels = (block.pixels?.length === 256 ? block.pixels.slice() : emptyPixels(paintColor));
    if (paintTool === "fill") {
      const target = pixels[i];
      if (target === paintColor) return;
      const stack = [i];
      while (stack.length) {
        const n = stack.pop()!;
        if (pixels[n] !== target) continue;
        pixels[n] = paintColor;
        const x = n % 16;
        const y = (n / 16) | 0;
        if (x > 0) stack.push(n - 1);
        if (x < 15) stack.push(n + 1);
        if (y > 0) stack.push(n - 16);
        if (y < 15) stack.push(n + 16);
      }
    } else pixels[i] = paintColor;
    const next = cur.customBlocks.slice();
    next[texSlot] = { ...block, pixels, tint: paintColor };
    persist({ ...cur, customBlocks: next });
  };

  const tabs: { id: LabTab; label: string }[] = [
    { id: "scripts", label: "Scripts" },
    { id: "commands", label: "Commands" },
    { id: "display", label: "Display" },
    { id: "data", label: "Data" },
    { id: "blocks", label: "Blocks" },
    { id: "sounds", label: "Sounds" },
    { id: "bosses", label: "Bosses" },
    { id: "world", label: "World" },
    { id: "share", label: "Share" },
  ];

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col px-3 py-4 sm:px-5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <button type="button" onClick={() => setOpenId(null)} className="flex items-center gap-1 text-sm text-muted">
          <ChevronLeft className="size-4" /> Packs
        </button>
        <button type="button" className="text-xs text-muted" onClick={() => setHelp((v) => !v)}>
          {help ? "Hide guide" : "Show guide"}
        </button>
      </div>
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="pixel-title text-3xl">{cur.name || "Untitled"}</h2>
          <p className="text-sm text-muted">{cur.folder} · this device</p>
        </div>
        <input
          value={cur.name}
          onChange={(e) => persist({ ...cur, name: e.target.value.slice(0, 28) })}
          className="min-h-11 max-w-[16rem] border-2 border-black bg-elevated px-3"
        />
      </div>
      {help && (
        <div className="mc-panel mb-2 p-3 text-left text-sm">
          <p className="mb-1 flex items-center gap-1 text-[10px] tracking-wide text-muted">
            <Info className="size-3" /> {tab}
          </p>
          {HELP[tab]}
        </div>
      )}
      <div className="mb-2 flex flex-wrap gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`mc-btn min-h-10 px-3 text-sm ${tab === t.id ? "mc-btn-primary" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "scripts" && (
        <div className="mb-2 flex min-h-0 flex-1 flex-col gap-3 overflow-hidden lg:flex-row">
          <div className="mc-panel max-h-[36vh] min-w-[12rem] overflow-y-auto p-2 lg:max-h-none lg:w-56">
            <p className="mb-1 text-[10px] tracking-wide text-muted">EVENTS · {HATS.length}</p>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search events and actions"
              className="mb-2 min-h-9 w-full border-2 border-black bg-elevated px-2 text-xs"
            />
            {HATS.filter((h) => !q || h.label.toLowerCase().includes(q.toLowerCase())).map((h) => (
              <BlockChip key={h.id} color={h.color} onClick={() => addScript(h.id)}>
                {h.label}
              </BlockChip>
            ))}
            <p className="mt-2 mb-1 text-[10px] tracking-wide text-muted">ACTIONS · {OPS.length}</p>
            {OPS.filter((o) => !q || o.label.toLowerCase().includes(q.toLowerCase()) || o.id.includes(q.toLowerCase())).map((o) => (
              <BlockChip key={o.id} color={o.color} onClick={() => addOp(o.id)}>
                {o.label}
              </BlockChip>
            ))}
          </div>
          <div className="mc-panel min-h-0 flex-1 overflow-y-auto p-3">
            {cur.scripts.length === 0 && <p className="text-sm text-muted">Tap a yellow event to start a script.</p>}
            {cur.scripts.map((s, si) => (
              <ScriptColumn
                key={si}
                script={s}
                sounds={cur.sounds.map((x) => x.name)}
                onEvery={(n) => persist({ ...cur, scripts: cur.scripts.map((x, i) => (i === si ? { ...x, every: n } : x)) })}
                onPatch={(oi, p) => patchOp(si, oi, p)}
                onDelete={() => persist({ ...cur, scripts: cur.scripts.filter((_, k) => k !== si) })}
              />
            ))}
          </div>
        </div>
      )}

      {tab === "commands" && (
        <textarea
          value={(cur.commands ?? []).join("\n")}
          onChange={(e) => persist({ ...cur, commands: e.target.value.split("\n") })}
          spellCheck={false}
          className="min-h-0 flex-1 border-2 border-black bg-[#0c0d10] p-3 font-mono text-xs"
          placeholder={"/give @s diamond_sword 1\n/tp @s ~ ~10 ~\n/effect give @s speed 30\n/gamerule keepInventory true\n/execute as @a at @s run say hi"}
        />
      )}

      {tab === "display" && (
        <div className="mc-panel flex-1 space-y-3 overflow-y-auto p-4 text-sm">
          <p className="text-muted">On-screen text. Used by title and tellraw actions.</p>
          <label className="block">
            Message
            <input
              value={cur.jsonRaw}
              onChange={(e) => persist({ ...cur, jsonRaw: e.target.value })}
              className="mt-1 min-h-11 w-full border-2 border-black bg-elevated px-3"
            />
          </label>
          <div
            className="min-h-11 border-2 border-black bg-black/40 px-3 py-2 font-medium text-xp"
            style={{ textShadow: "2px 2px 0 #000" }}
          >
            {cur.jsonRaw.replace(/[{}"]/g, " ").slice(0, 80) || "Preview"}
          </div>
        </div>
      )}

      {tab === "data" && (
        <div className="mc-panel flex-1 space-y-3 p-4 text-sm">
          <p className="text-muted">Tags on mobs this pack spawns.</p>
          {(["noAI", "invulnerable", "silent", "glowing"] as const).map((k) => (
            <label key={k} className="flex min-h-11 items-center gap-2">
              <input
                type="checkbox"
                checked={!!cur.nbt?.[k]}
                onChange={(e) => persist({ ...cur, nbt: { ...cur.nbt, [k]: e.target.checked } })}
              />
              {k}
            </label>
          ))}
          <label className="block">
            CustomName
            <input
              value={cur.nbt?.customName ?? ""}
              onChange={(e) => persist({ ...cur, nbt: { ...cur.nbt, customName: e.target.value } })}
              className="mt-1 min-h-11 w-full border-2 border-black bg-elevated px-3"
            />
          </label>
        </div>
      )}

      {tab === "blocks" && (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto lg:flex-row">
          <div className="mc-panel flex-1 space-y-3 p-3 text-sm">
            <p className="text-muted">Pixel art for a new block. 16×16. Same tools as the player skin, not flipped.</p>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: 8 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`mc-btn min-h-10 px-2 text-xs ${texSlot === i ? "mc-btn-primary" : ""}`}
                  onClick={() => setTexSlot(i)}
                >
                  Slot {i + 1}
                </button>
              ))}
            </div>
            <input
              value={block.name}
              onChange={(e) => {
                const next = cur.customBlocks.slice();
                next[texSlot] = { ...block, name: e.target.value.slice(0, 20) };
                persist({ ...cur, customBlocks: next });
              }}
              className="min-h-10 w-full border-2 border-black bg-elevated px-2"
              placeholder="Block name"
            />
            <div className="inline-grid border-2 border-black bg-[#111]" style={{ gridTemplateColumns: "repeat(16, 0.85rem)" }}>
              {Array.from({ length: 256 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  className="size-[0.85rem] border border-black/30"
                  style={{ background: numToHex(block.pixels?.[i] ?? 0x7a9a4a) }}
                  onPointerDown={() => paintPixel(i)}
                />
              ))}
            </div>
            <div className="flex gap-1">
              <button type="button" className={`mc-btn min-h-10 px-3 text-xs ${paintTool === "pen" ? "mc-btn-primary" : ""}`} onClick={() => setPaintTool("pen")}>
                Pen
              </button>
              <button type="button" className={`mc-btn min-h-10 px-3 text-xs ${paintTool === "fill" ? "mc-btn-primary" : ""}`} onClick={() => setPaintTool("fill")}>
                Fill
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {SKIN_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="size-6 border-2 border-black"
                  style={{ background: numToHex(c), outline: paintColor === c ? "2px solid #fff" : undefined }}
                  onClick={() => setPaintColor(c)}
                />
              ))}
            </div>
          </div>
          <div className="mc-panel w-full space-y-2 p-3 text-sm lg:w-64">
            <p className="text-muted">Recolor any vanilla block (hex). {VANILLA_TEX.length} textures.</p>
            {VANILLA_TEX.map((k) => (
              <label key={k.key} className="flex items-center justify-between gap-2">
                <span className="truncate capitalize">{k.name}</span>
                <input
                  value={cur.textures?.[k.key] ?? ""}
                  placeholder="#88aa44"
                  onChange={(e) => persist({ ...cur, textures: { ...cur.textures, [k.key]: e.target.value } })}
                  className="min-h-10 w-28 border-2 border-black bg-elevated px-2 font-mono text-xs"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {tab === "sounds" && (
        <div className="mc-panel flex-1 space-y-3 overflow-y-auto p-4 text-sm">
          <p className="text-muted">Drop a short audio file. Play it with a sound action using the name.</p>
          <input
            type="file"
            accept="audio/*"
            className="min-h-11 text-sm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                persist({
                  ...cur,
                  sounds: [...cur.sounds, { name: file.name.replace(/\.[^.]+$/, "").slice(0, 24), dataUrl: String(reader.result) }],
                });
              };
              reader.readAsDataURL(file);
            }}
          />
          {cur.sounds.length === 0 && <p className="text-muted">No sounds yet.</p>}
          {cur.sounds.map((s, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <span>{s.name}</span>
              <button
                type="button"
                className="text-xs text-muted"
                onClick={() => persist({ ...cur, sounds: cur.sounds.filter((_, k) => k !== i) })}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "bosses" && (
        <div className="mc-panel flex-1 space-y-3 overflow-y-auto p-4 text-sm">
          <p className="text-muted">Add a story boss to this pack. Only runs in your game. Custom bosses are unique to this pack.</p>
          {["dragon", "wither", "wither_storm"].map((kind) => (
            <button
              key={kind}
              type="button"
              className="mc-btn min-h-11 w-full"
              onClick={() =>
                persist({
                  ...cur,
                  bosses: [...cur.bosses, { kind, name: kind === "dragon" ? "Void Wyrm" : kind === "wither" ? "Wither" : "Wither Storm", hp: kind === "wither_storm" ? 800 : 200 }],
                })
              }
            >
              Add {kind.replace("_", " ")}
            </button>
          ))}
          <div className="space-y-2 border-t-2 border-black/40 pt-3">
            <p className="text-muted">Custom boss — name, health, and color.</p>
            <input
              id="boss-name"
              defaultValue="Rune Titan"
              className="min-h-10 w-full border-2 border-black bg-elevated px-2"
              placeholder="Boss name"
            />
            <input id="boss-hp" type="number" defaultValue={320} min={40} max={2000} className="min-h-10 w-full border-2 border-black bg-elevated px-2" />
            <input id="boss-tint" type="color" defaultValue="#7a20a8" className="h-10 w-full border-2 border-black bg-elevated" />
            <button
              type="button"
              className="mc-btn min-h-11 w-full"
              onClick={() => {
                const name = (document.getElementById("boss-name") as HTMLInputElement | null)?.value || "Rune Titan";
                const hp = Math.max(40, Number((document.getElementById("boss-hp") as HTMLInputElement | null)?.value) || 320);
                const hex = (document.getElementById("boss-tint") as HTMLInputElement | null)?.value || "#7a20a8";
                const tint = parseInt(hex.replace("#", ""), 16);
                persist({
                  ...cur,
                  bosses: [...cur.bosses, { kind: "custom_boss", name: name.slice(0, 24), hp, tint }],
                });
              }}
            >
              Add custom boss
            </button>
          </div>
          {cur.bosses.map((b, i) => (
            <div key={i} className="flex items-center justify-between">
              <span>
                {b.name} · {b.hp} hp
              </span>
              <button type="button" className="text-xs text-muted" onClick={() => persist({ ...cur, bosses: cur.bosses.filter((_, k) => k !== i) })}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "world" && (
        <div className="mc-panel flex-1 space-y-3 overflow-y-auto p-4 text-sm">
          <p className="text-muted">Spawn biome — overworld only. Never Nether, End, or a boss arena.</p>
          <div className="grid grid-cols-2 gap-2">
            {["plains", "forest", "desert", "savanna", "taiga", "jungle", "cherry_grove", "meadow", "flower_forest", "swamp"].map((b) => (
              <button
                key={b}
                type="button"
                className={`mc-btn min-h-11 text-sm ${cur.spawnBiome === b ? "mc-btn-primary" : ""}`}
                onClick={() => persist({ ...cur, spawnBiome: b })}
              >
                {b.replace("_", " ")}
              </button>
            ))}
          </div>
          <label className="block">
            Folder
            <input
              value={cur.folder ?? "Saves"}
              onChange={(e) => persist({ ...cur, folder: e.target.value.slice(0, 24) })}
              className="mt-1 min-h-11 w-full border-2 border-black bg-elevated px-3"
            />
          </label>
          <label className="flex min-h-11 items-center gap-2">
            <input type="checkbox" checked={!!cur.allowCheats} onChange={(e) => persist({ ...cur, allowCheats: e.target.checked })} />
            Allow cheats while playtesting
          </label>
        </div>
      )}

      {tab === "share" && (
        <div className="mc-panel flex-1 space-y-3 overflow-y-auto p-4 text-sm">
          <p className="text-muted">Private stays on this device. Friends use a join code to your computer. Marketplace is an XP listing. Host makes this browser the server.</p>
          {detectXpFarm(cur).farm && (
            <p className="border-2 border-black bg-[#3a1010] px-3 py-2 text-sm text-[#f0c8c0]">
              XP farm detected — {detectXpFarm(cur).reason} You can playtest, but Marketplace listing is blocked and nobody earns XP from this pack. Hosts never earn XP from their own Game Lab world.
            </p>
          )}
          {(["private", "friends", "market", "host"] as PublishMode[]).map((m) => (
            <button
              key={m}
              type="button"
              className={`mc-btn min-h-11 w-full capitalize ${cur.publishMode === m ? "mc-btn-primary" : ""}`}
              onClick={() => persist({ ...cur, publishMode: m, published: m === "market" })}
            >
              {m === "market" ? "Marketplace (XP)" : m === "host" ? "Host from this device" : m === "friends" ? "Friends / join code" : "Private"}
            </button>
          ))}
          <label className="block">
            Marketplace price (XP)
            <input
              type="number"
              min={0}
              value={cur.priceXp}
              onChange={(e) => persist({ ...cur, priceXp: Math.max(0, Number(e.target.value) || 0) })}
              className="mt-1 min-h-11 w-full border-2 border-black bg-elevated px-3"
            />
          </label>
        </div>
      )}

      {msg && <p className="mb-2 text-sm text-xp">{msg}</p>}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <McBtn onClick={() => setOpenId(null)}>Packs</McBtn>
        <McBtn
          onClick={() => {
            if (profile.guest) {
              setMsg("Guests cannot publish.");
              return;
            }
            const farm = detectXpFarm(cur);
            if (farm.farm && (cur.publishMode === "market" || cur.publishMode === "private")) {
              setMsg(`Can't list an XP farm. ${farm.reason}`);
              return;
            }
            persist({ ...cur, publishMode: cur.publishMode === "private" ? "market" : cur.publishMode, published: (cur.publishMode === "private" ? "market" : cur.publishMode) === "market", author: profile.username });
            const mode = cur.publishMode === "private" ? "market" : cur.publishMode;
            setMsg(
              mode === "market"
                ? `Listed "${cur.name}" on Marketplace for ${cur.priceXp || 0} XP. Open Marketplace → Games.`
                : mode === "host"
                  ? "This device will host. Playtest, then share the join code from Online."
                  : mode === "friends"
                    ? "Friends can join with your room code. Not listed publicly."
                    : "Saved privately on this device.",
            );
          }}
        >
          Publish
        </McBtn>
        <McBtn onClick={() => play(cur, cur.publishMode === "host" || cur.publishMode === "friends")}>Playtest</McBtn>
        <McBtn primary onClick={() => play(cur, false)}>
          Play
        </McBtn>
      </div>
    </div>
  );
}

function ScriptColumn({
  script,
  sounds,
  onEvery,
  onPatch,
  onDelete,
}: {
  script: ScriptCard;
  sounds: string[];
  onEvery: (n: number) => void;
  onPatch: (oi: number, p: Partial<StackBlock>) => void;
  onDelete: () => void;
}) {
  const hat = HATS.find((h) => h.id === script.when) ?? HATS[0]!;
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-t-lg px-3 py-2 text-sm font-medium text-black" style={{ background: hat.color }}>
          {hat.label}
          {hat.every && (
            <input
              type="number"
              min={2}
              max={60}
              value={script.every}
              onChange={(e) => onEvery(Math.max(2, Number(e.target.value) || 8))}
              className="ml-2 w-14 border border-black bg-white px-1 text-black"
            />
          )}
        </div>
        <button type="button" className="text-xs text-muted" onClick={onDelete}>
          Remove
        </button>
      </div>
      {script.do.map((b, oi) => {
        const def = OPS.find((o) => o.id === b.op) ?? OPS[0]!;
        return (
          <div key={oi} className="px-3 py-2 text-sm text-black" style={{ background: def.color }}>
            <span className="mr-2">{def.label.split("[")[0]}</span>
            {def.fields?.includes("text") && (
              <>
                {b.op === "sound" && sounds.length > 0 && (
                  <select
                    value={sounds.includes(b.text ?? "") ? b.text : ""}
                    onChange={(e) => onPatch(oi, { text: e.target.value })}
                    className="mr-1 border border-black bg-white px-1"
                  >
                    <option value="">built-in</option>
                    {sounds.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                )}
                <input value={b.text ?? ""} onChange={(e) => onPatch(oi, { text: e.target.value.slice(0, 48) })} className="mr-1 w-28 border border-black bg-white px-1" />
              </>
            )}
            {def.fields?.includes("item") && (
              <select value={b.id} onChange={(e) => onPatch(oi, { id: Number(e.target.value) })} className="mr-1 border border-black bg-white px-1">
                {ITEM_PICKS.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name}
                  </option>
                ))}
              </select>
            )}
            {def.fields?.includes("count") && (
              <input
                type="number"
                min={1}
                max={64}
                value={b.count ?? 1}
                onChange={(e) => onPatch(oi, { count: Math.max(1, Number(e.target.value) || 1) })}
                className="mr-1 w-14 border border-black bg-white px-1"
              />
            )}
            {def.fields?.includes("mob") && (
              <select value={b.kind} onChange={(e) => onPatch(oi, { kind: e.target.value })} className="mr-1 border border-black bg-white px-1">
                {MOB_PICKS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            )}
            {def.fields?.includes("onoff") && (
              <select value={b.value ?? 1} onChange={(e) => onPatch(oi, { value: Number(e.target.value) })} className="mr-1 border border-black bg-white px-1">
                <option value={1}>on</option>
                <option value={0}>off</option>
              </select>
            )}
          </div>
        );
      })}
    </div>
  );
}
