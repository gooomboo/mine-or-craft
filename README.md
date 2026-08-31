# Mine or Craft

A browser voxel sandbox. Mine, craft, survive, explore, and publish Game Lab packs. No real money — Marketplace uses XP you earn by playing.

**Source:** [gooomboo/mine-or-craft](https://github.com/gooomboo/mine-or-craft)

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

---

## Put this on GitHub, then Cloudflare (online for real)

Your computer is the Minecraft-style server when you click **Host**. Cloudflare only serves the website and a tiny join-code relay. You do **not** rent Aternos / Minehut / a VPS.

### 1. GitHub

Repo is [gooomboo/mine-or-craft](https://github.com/gooomboo/mine-or-craft). To refresh it from this project:

1. Install GitHub Desktop or `git`.
2. Push the `main` branch. Do **not** commit `node_modules`, `.env`, or `.vercel`.

### 2. Cloudflare Pages (the host that will not bug out)

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Pick `gooomboo/mine-or-craft`.
3. Build settings — copy these exactly:

| Field | Value |
| --- | --- |
| Framework preset | None |
| Build command | `npm run build:cf` |
| Output directory | `dist/client` |
| Root directory | `/` (leave default) |
| Node version | `22` (Settings → Environment variables → `NODE_VERSION=22`) |

4. **Do not set `DATABASE_URL`.** That pulls in Postgres/PGLite and is the #1 Cloudflare crash for this game.
5. **Do not** upload the `.vercel` folder or change the nitro preset. Pages only needs the static client + `functions/api/rtc.js`.
6. Deploy. If the site 404s, edit the project and set Output directory to `dist` instead of `dist/client`, then retry.

Online join codes use `functions/api/rtc.js` (in-memory signaling, no database). Host a world, share the code, friends open the same Cloudflare URL and paste it.

### What makes Cloudflare bug out (avoid these)

- Setting `DATABASE_URL` or running `npm run db:migrate` on Pages.
- Pointing wrangler at the Vercel nitro output.
- `html_handling: "none"` (old wrangler) — this project no longer uses it.
- Buying a Java/Bedrock Minecraft host. That protocol is not this game.
- GitHub Pages **alone** — the static game works, but `/api/rtc` 404s so Online cannot connect. Use Cloudflare Pages so the Function exists.

### After it is live

1. Sign in (not Guest) on the Cloudflare URL.
2. Play → Online → **Host**. Your browser is the server. Keep the tab open.
3. Friends go to the same URL → Join → paste the code.
4. Game Lab packs: Share → **Friends** or **Host**. Marketplace listing is XP-only and never from your own hosted world.

Guests can join and play. They cannot publish skins or Game Lab packs.

---

## Game Lab

Signed-in players only. Folder list of packs. Visual scripts (events + actions), commands, display text, entity data, 16×16 block pixel art, custom sounds, bosses, overworld spawn biomes.

**Events that actually fire**

- when world starts
- when a player joins (you, on Play / Playtest)
- when player dies / is hurt / gets a kill
- when player uses an item / places a block / chats
- every [n] seconds

**Share modes**

- Private — this device
- Friends — join code to your computer, not listed
- Marketplace — XP listing
- Host — this browser is the server

XP farms cannot be published. Hosts do not earn XP from their own Game Lab world.

## Story

Nether and End portals are never free. Beat the Void Wyrm, return to your bed, then fight the Wither Storm. A clear awards 1/100 ★. Every 5 stars → 1/100 ◆.

## Stack

HTML, TypeScript, React, Three.js, Tailwind. Worlds in IndexedDB. Multiplayer is WebRTC P2P. Signaling is `/api/rtc`.

Cheats (if enabled): `/give`, `/gamemode`, `/time`, `/weather`, `/tp`, `/fly`, `/god`, `/heal`, `/home`, `/seed`, `/xp`, `/setblock`.
