# Mine or Craft

A browser voxel sandbox. Mine, craft, survive, duel, and explore the Nether and the End.

**Play on Cloudflare:** [mine-or-craft.sgd-list.workers.dev](https://mine-or-craft.sgd-list.workers.dev)

Safari’s address bar often *shortens* that host so it looks like `aft.sgd-list.workers.dev`. That is still this game — type the full URL if the page fails to load.

## Play

Open the title screen (Minecraft-style panorama), set a username, then:

- **Singleplayer** — survival, creative, or hardcore. Empty inventory. Punch a tree.
- **Multiplayer** — host or join with a code.
- **Dual — PvP Arena** — official Mods server. Diamond kit, shield, golden apples, pearls, a skilled duelist bot. Join code `dual`.

## Dual kit

Sword, axe, bow, shield (offhand), 8 golden apples, 16 ender pearls, water + lava buckets, cobble, fishing rod, steak, full diamond armor. 1.9-style cooldown, crits, sprint knockback, axe shield-disable.

## Dimensions

Stand in a nether portal (obsidian frame + flint and steel) or type `/nether` / `/end` / `/overworld` with cheats on. Dual has portals on the west and east walls.

## Controls

| Action | Desktop | Mobile |
| --- | --- | --- |
| Move | WASD | Left stick |
| Look | Mouse (click canvas) | Drag the look pad |
| Mine / attack | Left click | Hit |
| Place / use / pearl | Right click | Use |
| Jump | Space | Jump |
| Sneak | Shift | Sneak |
| Sprint | Ctrl or R | Sprint |
| Block | Right click / C | Block |
| Eat | Right click food | Eat |
| Inventory | E or bag | Bag (top right) |
| Pause | Esc | Pause (top right) |
| Camera | F5 | Settings → Gameplay |

No tap-to-play overlay — the world starts as soon as chunks finish.

## Mobs

Overworld animals and hostiles, Nether piglins / blazes / ghasts, Endermen and the Void Wyrm, plus villagers, wardens, ravagers, axolotls, and more. Third-person player and mobs use articulated models with walk cycles.

## Fix a white screen / “too many redirects” on Cloudflare

The live site used to bounce `/` ↔ `/index.html` forever. This repo now deploys **static assets only** (no Worker script).

In the Cloudflare Workers project connected to this repo:

1. **Build command:** `npm run build`
2. **Deploy command:** `npx wrangler deploy`
3. **Do not** enable `run_worker_first` or `html_handling: auto-trailing-slash`

`wrangler.jsonc` is already set to `html_handling: none` + `not_found_handling: single-page-application`.
