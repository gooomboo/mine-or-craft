import { BLOCKS } from "@/game/blocks";
import { getDef } from "@/game/items";

export function ItemIcon({ id, count, size = 36 }: { id: number; count?: number; size?: number }) {
  const def = getDef(id);
  const block = id > 0 && id < 10000 ? BLOCKS[id] : null;
  const tint = def?.tint ?? 0x888888;
  const hex = `#${(tint & 0xffffff).toString(16).padStart(6, "0")}`;
  const top = block ? `#${((block.tintTop || block.tint) & 0xffffff).toString(16).padStart(6, "0")}` : hex;
  const isTool = (def?.tool && id >= 10000) || !!def?.slot;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {isTool ? (
        <div
          className="absolute inset-[18%] rotate-45 rounded-[2px]"
          style={{ background: hex, boxShadow: "2px 2px 0 #0006" }}
        />
      ) : (
        <div className="absolute inset-[12%] origin-center" style={{ transform: "rotateX(12deg) rotateZ(-18deg)" }}>
          <div className="h-full w-full" style={{ background: hex, boxShadow: "inset 0 0 0 1px #0006" }}>
            <div className="h-1/3 w-full" style={{ background: top }} />
          </div>
        </div>
      )}
      {count != null && count > 1 && (
        <span className="hud-num absolute right-0 bottom-0 text-[11px] font-semibold leading-none text-fg drop-shadow-[1px_1px_0_#000]">
          {count}
        </span>
      )}
    </div>
  );
}
