# Mine or Craft

A browser voxel sandbox. Mine, craft, survive, and explore generated worlds with friends.

**Play:** [gooomboo.github.io/mine-or-craft](https://gooomboo.github.io/mine-or-craft/)

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

Use a **Workers** project connected to this repo. On the build settings screen:

| Field | Value |
| --- | --- |
| **Build command** | `npm run build` |
| **Deploy command** | `npx wrangler deploy` |
| **Root directory** | `/` |
| **Version command** | leave blank |

Build command must not be `None`. Then **Retry build**.

If you create a **Pages** project instead: framework Vite, build `npm run build`, output directory `dist`.

## Features

- Chunked voxel world with 20+ overworld biomes, the Nether, and the End
- 3,200 distinct blocks plus tools, armor, shield, and food
- Survival, creative, and hardcore
- Crafting, furnace, nether portals, Void Wyrm, the Pale One
- Skin studio, P2P lobbies, deep settings

Worlds save in the browser (IndexedDB). Cheats (if enabled): `/give`, `/gamemode`, `/time`, `/fly`, `/god`, `/heal`, `/home`, `/seed`, `/xp`, `/stronghold`, `/weather`, `/difficulty`.
