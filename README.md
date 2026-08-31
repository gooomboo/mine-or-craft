# Mine or Craft

A browser voxel sandbox. Mine, craft, survive, explore, and publish Game Lab packs. No real money — Marketplace uses XP you earn by playing.

**Live source:** [gooomboo/mine-or-craft](https://github.com/gooomboo/mine-or-craft)

## Play

Open the app. Sign in, sign up, or play as guest. This device remembers you. Guests can play; they cannot publish skins or packs.

Create a survival world. Empty inventory. Punch a tree, craft planks, then a table and a pickaxe. Light your own Nether portal with obsidian and flint. The End gate only appears after you finish the overworld advancements, about four chunks from spawn.

## Controls

| Action | Desktop | Mobile |
| --- | --- | --- |
| Move | WASD (remappable in Settings) | Left stick |
| Look | Mouse (click to lock) | Drag right half |
| Mine / attack | Left click | Mine button |
| Place / use | Right click | Use button |
| Jump | Space | Jump |
| Sneak | Shift | Sneak |
| Sprint | Ctrl or R | Sprint |
| Inventory | E | Bag |
| Pause | Esc | Pause |
| Chat | T | Pause → chat |
| Studio Tools | Insert or ` (local + cheats only) | Pause menu |

Commands (`/give`, `/gamemode`, …) stay hidden unless the world has **Allow cheats**, you are playtesting a Game Lab pack, or you are in creative.

## Online / hosting (your computer is the server)

There is no paid game server in this build. Same model as a Minecraft LAN world:

1. **Host** — Sign in, open Online, host a world or a Game Lab pack. Your browser is the server. Share the join code.
2. **Join** — Friends open the same site, paste the code, and WebRTC connects browser-to-browser. Signaling uses `/api/rtc` on whatever host serves the site.
3. **GitHub Pages** — the static client works. Signaling (`/api/rtc`) needs a real host (Cloudflare Worker / Pages Functions, or the Cloudflare + Vercel deploy this repo already targets).
4. **Cloudflare** — Pages or Workers for the site. Free plan is enough for the client + signaling. You do **not** need a Minecraft Java/Bedrock host (Aternos, Minehut, etc.) — those will not run this game.

When you later pay for Cloudflare and a small always-on worker, the same join codes keep working; hosts no longer have to keep a tab open if you add a dedicated worker later. Until then, **the player who clicks Host is the server.**

### Suggested free / cheap stack

| Piece | Pick | Why |
| --- | --- | --- |
| Code | GitHub (`gooomboo/mine-or-craft`) | Source of truth |
| Static app | Cloudflare Pages **or** GitHub Pages | Free HTTPS |
| Signaling `/api/rtc` | Cloudflare Pages Functions / Worker | Required for Online |
| Optional TURN | Cloudflare Calls or a tiny Metered TURN | Helps strict NATs (~10–20% of peers) |

Do not buy a VPS “Minecraft server” for this. It will not speak the voxel protocol.

## Game Lab

Signed-in players only. Folder list of packs. Visual scripts (events + actions), commands, display text, entity data, 16×16 block pixel art, custom sounds, bosses, overworld spawn biomes.

**Share modes**

- Private — this device
- Friends — join code to your computer, not listed
- Marketplace — XP listing
- Host — this browser is the server

## Story

Nether and End portals are never free. Beat the Void Wyrm, return to your bed, then fight the Wither Storm. A clear awards 1/100 ★. Every 5 stars → 1/100 ◆.

## Stack

HTML, TypeScript, React, Three.js, Tailwind. Worlds in IndexedDB. Multiplayer is WebRTC P2P.

Cheats (if enabled): `/give`, `/gamemode`, `/time`, `/weather`, `/tp`, `/fly`, `/god`, `/heal`, `/home`, `/seed`, `/xp`, `/setblock`.
