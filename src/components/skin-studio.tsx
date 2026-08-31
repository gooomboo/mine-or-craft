import { useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import {
  SKIN_FACES,
  SKIN_PALETTE,
  SKIN_PARTS,
  PART_SIZE,
  buyMarketSkin,
  drawSkinPreview,
  floodFace,
  getFace,
  loadCustomSkins,
  loadMarket,
  numToHex,
  publishSkin,
  resolveSkin,
  saveCustomSkins,
  saveLiveSkin,
  setFacePixel,
  withPixels,
  type SkinData,
  type SkinFace,
  type SkinPart,
} from "@/game/skins";
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

export function SkinPreview({
  skin,
  size = 96,
}: {
  skin: SkinData;
  size?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.width = 64;
    c.height = 128;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    drawSkinPreview(ctx, withPixels(skin), 64, 128);
  }, [skin, skin.pixels, skin.shirt, skin.pants, skin.skin, skin.hair, skin.id]);
  return (
    <canvas
      ref={ref}
      width={64}
      height={128}
      className="pixelated"
      style={{ width: size * 0.55, height: size, imageRendering: "pixelated" }}
    />
  );
}

function MiniFace({
  skin,
  part,
  face,
  active,
  onClick,
}: {
  skin: SkinData;
  part: SkinPart;
  face: SkinFace;
  active: boolean;
  onClick: () => void;
}) {
  const { w, h } = PART_SIZE[part];
  const arr = getFace(skin.pixels, part, face);
  return (
    <button
      type="button"
      onClick={onClick}
      title={face}
      className={`grid border ${active ? "border-white" : "border-black"}`}
      style={{ gridTemplateColumns: `repeat(${w}, 4px)`, imageRendering: "pixelated" }}
    >
      {Array.from({ length: w * h }, (_, i) => (
        <span key={i} style={{ width: 4, height: 4, background: numToHex(arr[i] ?? 0) }} />
      ))}
    </button>
  );
}

export function SkinStudio() {
  const setPhase = useApp((s) => s.setPhase);
  const profile = useApp((s) => s.profile);
  const setProfile = useApp((s) => s.setProfile);
  const [draft, setDraft] = useState<SkinData>(() => withPixels(resolveSkin(useApp.getState().profile.skin)));
  const [part, setPart] = useState<SkinPart>("head");
  const [face, setFace] = useState<SkinFace>("front");
  const [color, setColor] = useState(0xe0c090);
  const [tool, setTool] = useState<"pen" | "fill" | "eyedrop">("pen");
  const [msg, setMsg] = useState("");
  const [custom, setCustom] = useState(() => loadCustomSkins());
  const [market, setMarket] = useState(() => loadMarket());
  const [name, setName] = useState(() => "My Skin");

  const paintAt = (x: number, y: number) => {
    const next = withPixels({ ...draft, id: "live", name, pixels: { ...draft.pixels } });
    const px = { ...(next.pixels ?? {}) };
    if (tool === "eyedrop") {
      const { w } = PART_SIZE[part];
      const arr = getFace(px, part, face);
      setColor(arr[y * w + x] ?? color);
      return;
    }
    if (tool === "fill") floodFace(px, part, face, x, y, color);
    else setFacePixel(px, part, face, x, y, color);
    next.pixels = px;
    setDraft(next);
    saveLiveSkin(next);
    setProfile({ skin: "live" });
  };

  const { w, h } = PART_SIZE[part];
  const grid = getFace(draft.pixels, part, face);

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col px-4 py-5">
      <button type="button" onClick={() => setPhase("title")} className="mb-2 flex items-center gap-1 text-sm text-muted">
        <ChevronLeft className="size-4" /> Back
      </button>
      <h2 className="pixel-title mb-1 text-3xl">Dressing Room</h2>
      <p className="mb-3 text-sm text-muted">Paint every side of the player. Browse skins in the Marketplace.</p>
      <McBtn className="mb-3" onClick={() => setPhase("market")}>
        Browse skins in Marketplace
      </McBtn>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mb-3 flex items-start gap-4">
            <div className="border-2 border-black bg-[#00000066] p-3">
              <SkinPreview skin={draft} size={140} />
              <p className="mt-1 text-center text-[11px] text-muted">Player skin</p>
            </div>
            <div className="min-w-0 flex-1">
              <label className="text-[11px] text-muted">Skin name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 24))}
                className="mb-2 min-h-10 w-full border-2 border-black bg-[#00000088] px-2 text-sm"
              />
              <p className="mb-1 text-[11px] text-muted">Body part</p>
              <div className="mb-2 flex flex-wrap gap-1">
                {SKIN_PARTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`mc-btn min-h-9 px-2 text-xs ${part === p ? "mc-btn-primary" : ""}`}
                    onClick={() => setPart(p)}
                  >
                    {p === "armL" ? "L arm" : p === "armR" ? "R arm" : p === "legL" ? "L leg" : p === "legR" ? "R leg" : p}
                  </button>
                ))}
              </div>
              <p className="mb-1 text-[11px] text-muted">Side</p>
              <div className="flex flex-wrap gap-1">
                {SKIN_FACES.map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`mc-btn min-h-9 px-2 text-xs capitalize ${face === f ? "mc-btn-primary" : ""}`}
                    onClick={() => setFace(f)}
                  >
                    {f === "back" ? "rear" : f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="mb-1 text-xs text-muted">
            Pixel art — {part} {face} ({w}×{h}). Paint every side.
          </p>
          <div className="mb-2 flex flex-wrap items-start gap-3">
            <div className="mb-0 inline-grid border-2 border-black bg-[#111]" style={{ gridTemplateColumns: `repeat(${w}, 1.35rem)` }}>
              {Array.from({ length: w * h }, (_, i) => {
                const x = i % w;
                const y = (i / w) | 0;
                const c = grid[i] ?? 0;
                return (
                  <button
                    key={i}
                    type="button"
                    aria-label={`pixel ${x},${y}`}
                    onPointerDown={() => paintAt(x, y)}
                    className="size-[1.35rem] border border-black/40"
                    style={{ background: numToHex(c), imageRendering: "pixelated" }}
                  />
                );
              })}
            </div>
            <div>
              <p className="mb-1 text-[11px] text-muted">All sides</p>
              <div className="grid grid-cols-4 gap-1" style={{ width: "9.5rem" }}>
                <div />
                <MiniFace skin={draft} part={part} face="top" active={face === "top"} onClick={() => setFace("top")} />
                <div />
                <div />
                <MiniFace skin={draft} part={part} face="left" active={face === "left"} onClick={() => setFace("left")} />
                <MiniFace skin={draft} part={part} face="front" active={face === "front"} onClick={() => setFace("front")} />
                <MiniFace skin={draft} part={part} face="right" active={face === "right"} onClick={() => setFace("right")} />
                <MiniFace skin={draft} part={part} face="back" active={face === "back"} onClick={() => setFace("back")} />
                <div />
                <MiniFace skin={draft} part={part} face="bottom" active={face === "bottom"} onClick={() => setFace("bottom")} />
              </div>
            </div>
          </div>

          <div className="mb-2 flex gap-1">
            {(["pen", "fill", "eyedrop"] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={`mc-btn min-h-10 px-3 text-xs capitalize ${tool === t ? "mc-btn-primary" : ""}`}
                onClick={() => setTool(t)}
              >
                {t === "eyedrop" ? "Pick" : t}
              </button>
            ))}
            <label className="mc-btn flex min-h-10 items-center px-2 text-xs">
              Custom
              <input
                type="color"
                value={numToHex(color)}
                onChange={(e) => setColor(parseInt(e.target.value.slice(1), 16))}
                className="ml-2 h-6 w-8 border-0 bg-transparent"
              />
            </label>
          </div>
          <div className="mb-3 flex flex-wrap gap-1">
            {SKIN_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                className="size-7 border-2 border-black"
                style={{ background: numToHex(c), outline: color === c ? "2px solid #fff" : undefined }}
                onClick={() => setColor(c)}
                aria-label={numToHex(c)}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <McBtn
              onClick={() => {
                const saved = { ...draft, id: `c-${Date.now()}`, name: name || "Custom" };
                const next = [...custom, saved];
                setCustom(next);
                saveCustomSkins(next);
                saveLiveSkin(saved);
                setProfile({ skin: saved.id });
                setMsg("Saved on this device.");
              }}
            >
              Save skin
            </McBtn>
            <McBtn
              primary
              onClick={() => {
                if (profile.guest) {
                  setMsg("Guests cannot publish. Sign in first.");
                  return;
                }
                const res = publishSkin({ ...draft, name }, profile.username, 50);
                setMsg(res.msg);
                setMarket(loadMarket());
              }}
            >
              Publish for 50 XP
            </McBtn>
          </div>
          {msg && <p className="mt-2 text-sm text-muted">{msg}</p>}

          <p className="mt-4 mb-1 text-xs text-muted">Market</p>
          <div className="max-h-32 space-y-1 overflow-y-auto">
            {market.length === 0 && <p className="text-xs text-muted">No published skins yet.</p>}
            {market.map((s) => (
              <div key={s.id} className="mc-panel flex items-center justify-between gap-2 px-2 py-1">
                <div className="flex items-center gap-2">
                  <SkinPreview skin={s} size={36} />
                  <span className="text-xs">
                    {s.name} · {s.seller}
                    <span className="block text-muted">{s.price} XP</span>
                  </span>
                </div>
                <button
                  type="button"
                  className="mc-btn min-h-10 px-3 text-xs"
                  onClick={() => {
                    const res = buyMarketSkin(s.id, profile.username, profile.xp);
                    if (!res.ok || !res.skin) {
                      setMsg(res.msg);
                      return;
                    }
                    setProfile({ xp: profile.xp - res.cost, skin: "live" });
                    const owned = [...loadCustomSkins(), { ...res.skin, id: `c-${Date.now()}` }];
                    saveCustomSkins(owned);
                    saveLiveSkin(res.skin);
                    setDraft(withPixels(res.skin));
                    setCustom(owned);
                    setMsg(res.msg);
                  }}
                >
                  Buy
                </button>
              </div>
            ))}
          </div>
        </div>
    </div>
  );
}
