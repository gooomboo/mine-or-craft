# Mine or Craft

A browser voxel sandbox. Mine, craft, survive, and explore generated worlds with friends.

## Play

Open the app, set a username, and create a survival world. You start with an empty inventory — punch a tree, craft planks, then a crafting table and tools.

## Controls

| Action | Desktop | Mobile |
| --- | --- | --- |
| Move | WASD | Left stick |
| Look | Mouse (click to lock) | Drag right half |
| Mine / attack | Left click | Mine button |
| Place / use | Right click | Use button |
| Jump | Space | Jump |
| Sneak | Shift | Sneak |
| Sprint | Ctrl or R | — |
| Inventory | E | Bag button |
| Pause | Esc | Pause button |
| Camera | F5 | Settings → Gameplay |
| Debug overlay | F3 | Settings → HUD |
| Hotbar | 1–9 | Tap slots |
| Commands | T or / | Pause → chat |

## Deploy on Cloudflare

This repo is a **Cloudflare Worker + static assets** app. In the Workers project (the Deployments screen you already have), set:

| Field | Value |
| --- | --- |
| **Build command** | `npm run build` |
| **Deploy command** | `npx wrangler deploy` |
| **Root directory** | `/` |
| **Version command** | leave blank (or `npx wrangler versions upload`) |

Do **not** leave Build command as `None` — Cloudflare has to compile the game before Wrangler can upload it.

Then hit **Retry build**. After it succeeds, the game is at your `*.workers.dev` URL (HTTPS, which WebGL and multiplayer need).

Local:

```bash
npm install
npm run dev      # http://localhost:8080
npm run deploy   # build + wrangler deploy
```

## Features

- Chunked voxel world with 20+ overworld biomes, the Nether, and the End
- 3,200 distinct blocks plus tools, armor, shield, and food
- Survival, creative, and hardcore
- Crafting (2×2 + 3×3 table) and a furnace
- Day/night with a moving sun and moon, water and lava flow, fire spread, nether portals
- Smooth lighting, fancy water, mining cracks, break particles, weather
- Mobs, Void Wyrm boss, and the Pale One (appears after 4 minutes AFK)
- Skin studio with copy/paste JSON
- P2P multiplayer lobbies with optional XP prices
- Deep settings: video, controls, sound, gameplay, HUD

## Stack

HTML, TypeScript, React, Three.js, Tailwind, Cloudflare Workers. Worlds save in the browser (IndexedDB).

Cheats (if enabled on the world): `/give`, `/gamemode`, `/time`, `/fly`, `/god`, `/heal`, `/home`, `/seed`, `/xp`, `/stronghold`, `/weather`, `/difficulty`.
