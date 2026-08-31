import { useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import {
  PASS_PRICE,
  allCatalog,
  buyPass,
  effectivePrice,
  owns,
  passActive,
  purchase,
  sortCatalog,
  type CatalogItem,
  type MarketKind,
} from "@/game/marketplace";
import { resolveSkin } from "@/game/skins";
import { useApp } from "@/store/app-store";
import { SkinPreview } from "./skin-studio";

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

type Tab = "featured" | MarketKind | "free" | "pass";

export function Marketplace() {
  const setPhase = useApp((s) => s.setPhase);
  const profile = useApp((s) => s.profile);
  const setProfile = useApp((s) => s.setProfile);
  const upsert = useApp((s) => s.upsertWorld);
  const [tab, setTab] = useState<Tab>("featured");
  const [sort, setSort] = useState<"featured" | "price" | "free">("featured");
  const [msg, setMsg] = useState("");
  const [query, setQuery] = useState("");
  const worldsTick = useApp((s) => s.worlds.length);
  const catalog = useMemo(() => allCatalog(), [profile.ownedPacks, profile.xp, worldsTick]);

  const filtered = useMemo(() => {
    let list = catalog;
    if (tab === "featured") list = list.filter((i) => i.featured || i.freeEvent || i.kind === "game" || i.kind === "world");
    else if (tab === "free") list = list.filter((i) => i.price === 0 || i.freeEvent);
    else if (tab === "pass") list = list.filter((i) => i.pass);
    else list = list.filter((i) => i.kind === tab);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((i) => `${i.name} ${i.blurb} ${i.author}`.toLowerCase().includes(q));
    }
    return sortCatalog(list, sort);
  }, [catalog, tab, sort, query]);

  const onBuy = (item: CatalogItem) => {
    const res = purchase(item, profile);
    setMsg(res.msg);
    if (!res.ok) return;
    setProfile(res.profile);
    if (res.skin) setProfile({ skin: res.skin.id || "live" });
    if (res.world) {
      upsert(res.world);
      useApp.getState().setNet({ multiplayer: false, isHost: true });
    }
  };

  const onPass = () => {
    const res = buyPass(profile);
    setMsg(res.msg);
    if (res.ok && res.profile) setProfile(res.profile);
  };

  const daysLeft = passActive(profile) ? Math.max(1, Math.ceil(((profile.passUntil ?? 0) - Date.now()) / 86400000)) : 0;
  const tabs: { id: Tab; label: string }[] = [
    { id: "featured", label: "Featured" },
    { id: "skin", label: "Skins" },
    { id: "world", label: "Worlds" },
    { id: "addon", label: "Add-ons" },
    { id: "game", label: "Games" },
    { id: "creator", label: "Creator" },
    { id: "free", label: "Free" },
    { id: "pass", label: "Pass" },
  ];

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col px-4 py-6">
      <button type="button" onClick={() => setPhase("title")} className="mb-3 flex items-center gap-1 text-sm text-muted">
        <ChevronLeft className="size-4" /> Back
      </button>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="pixel-title text-3xl">Marketplace</h2>
          <p className="text-sm text-muted">XP only — play to earn, spend to unlock. No real money.</p>
        </div>
        <div className="mc-panel min-w-[7.5rem] px-3 py-2 text-right">
          <p className="text-[10px] tracking-wide text-muted">WALLET</p>
          <p className="text-lg text-xp">{profile.xp} XP</p>
        </div>
      </div>
      <div className="mb-3 flex flex-wrap gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`mc-btn min-h-10 px-3 py-1 text-sm ${tab === t.id ? "mc-btn-primary" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tab === "skin" ? "Search skins…" : "Search packs…"}
          className="min-h-10 flex-1 border-2 border-black bg-elevated px-3 text-sm"
        />
        <label className="text-xs text-muted">Sort</label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="min-h-10 border-2 border-black bg-elevated px-2 text-sm"
        >
          <option value="featured">Featured first</option>
          <option value="price">Price: low to high</option>
          <option value="free">Free only</option>
        </select>
        <p className="text-[11px] text-muted">+1 XP every 8s in a world. Dragon is still the big payout.</p>
      </div>
      {tab === "pass" && (
        <div className="mc-panel mb-3 flex items-center justify-between gap-3 p-3">
          <div>
            <p className="font-medium">Marketplace Pass</p>
            <p className="text-xs text-muted">
              {daysLeft ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left. Pass items are free to claim.` : `7 days of Pass skins, maps, and kits. ${PASS_PRICE} XP.`}
            </p>
          </div>
          <button type="button" className="mc-btn mc-btn-primary min-h-11 px-4" onClick={onPass} disabled={!!daysLeft}>
            {daysLeft ? "Active" : `Unlock · ${PASS_PRICE} XP`}
          </button>
        </div>
      )}
      {msg && <p className="mb-2 text-sm text-xp">{msg}</p>}
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {filtered.length === 0 && <p className="text-sm text-muted">Nothing in this aisle yet.</p>}
        {filtered.map((item) => {
          const cost = effectivePrice(item, profile);
          const have = owns(profile, item.id);
          const skin = item.skinId ? resolveSkin(item.skinId) : null;
          return (
            <div key={item.id} className="mc-panel flex items-center gap-3 px-3 py-2">
              <div className="flex size-14 items-center justify-center border-2 border-black bg-[#00000066]">
                {skin ? <SkinPreview skin={skin} size={48} /> : <span className="text-[10px] text-muted">{item.kind}</span>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  {item.name}
                  {item.pass && <span className="ml-1 text-[10px] text-xp">PASS</span>}
                  {item.price === 0 && <span className="ml-1 text-[10px] text-muted">FREE</span>}
                </p>
                <p className="truncate text-[11px] text-muted">
                  {item.blurb} · {item.author}
                </p>
              </div>
              <button
                type="button"
                className={`mc-btn min-h-11 min-w-[5.5rem] px-3 text-sm ${have || cost === 0 ? "" : "mc-btn-primary"}`}
                onClick={() => onBuy(item)}
              >
                {have ? "Equip" : cost === 0 ? "Claim" : `${cost} XP`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
