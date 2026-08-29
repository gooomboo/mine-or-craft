# Mine or Craft

A browser voxel sandbox. Mine, craft, survive, and explore generated worlds with friends.

**Play on Cloudflare:** [mine-or-craft.sgd-list.workers.dev](https://mine-or-craft.sgd-list.workers.dev)

Safari’s address bar often *shortens* that host so it looks like `aft.sgd-list.workers.dev`. That is still this game — type the full URL if the page fails to load.

## Play

Open the app, set a username, and create a survival world. You start with an empty inventory — punch a tree, craft planks, then a crafting table and tools.

A loading bar appears while chunks generate. On a phone that can take a few seconds; the tab stays responsive.

## Controls

| Action | Desktop | Mobile |
| --- | --- | --- |
| Move | WASD | Left stick |
| Look | Mouse (click / tap to lock) | Drag the **middle-right** (look pad stays clear of bag / pause / hotbar) |
| Mine / attack | Left click | Mine button |
| Place / use | Right click | Use button |
| Jump | Space | Jump |
| Sneak | Shift | Sneak |
| Sprint | Ctrl or R | — |
| Inventory | E or bag button | Bag button (top right) |
| Pause | Esc or pause button | Pause button (top right) |
| Camera | F5 | Settings → Gameplay |
| Debug overlay | F3 | Settings → HUD |
| Hotbar | 1–9 | Tap slots |
| Commands | T or / | Pause → chat |

## Fix a white screen / “too many redirects” on Cloudflare

The live site used to bounce `/` ↔ `/index.html` forever. This repo now deploys **static assets only** (no Worker script).

In the Cloudflare Workers project connected to this repo:

1. **Build command:** `npm run build`
2. **Deploy command:** `npx wrangler deploy`
3. **Version command:** leave **blank**
4. **Root directory:** `/`
5. Click **Retry deployment** (or push to `main` if auto-deploy is on)

Do **not** set a Worker entrypoint / `main` module. `wrangler.jsonc` is assets-only:

```jsonc
{
  "name": "mine-or-craft",
  "compatibility_date": "2026-08-29",
  "workers_dev": true,
  "assets": {
    "directory": "./dist",
    "html_handling": "none",
    "not_found_handling": "single-page-application"
  }
}
```

If you create a **Pages** project instead: framework Vite, build `npm run build`, output directory `dist`.

## Features

- Chunked voxel world with 20+ overworld biomes, the Nether, and the End
- 3,200 distinct blocks plus tools, armor, shield, and food
- Survival, creative, and hardcore
- Crafting, furnace, nether portals, Void Wyrm, the Pale One
- Skin studio, P2P lobbies, deep settings
- Rotating biome panorama on the title screen

Worlds save in the browser (IndexedDB). Cheats (if enabled): `/give`, `/gamemode`, `/time`, `/fly`, `/god`, `/heal`, `/home`, `/seed`, `/xp`, `/stronghold`, `/weather`, `/difficulty`.
