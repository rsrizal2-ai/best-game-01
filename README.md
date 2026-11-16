# NEONVOID — arena shooter

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/rsrizal2-ai/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/rsrizal2-ai/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

Entry for the [best-game-01 bounty](https://make.fun/bounty/best-game-01) on make.fun.

**NEONVOID** is an original neon arena wave-shooter. You are the lone
pulse-ship defending a reactor core against the void: shards, weavers,
bulwarks and splitters pour in from the edges in 8 waves. Clear a wave,
draft one of three upgrades that genuinely change the run, and hold the
line until the final wave breaks — or the void takes the reactor.

## How to play

Serve `game/` with any static server and open `index.html` in desktop
Chrome. No build step, no network requests, no accounts.

- **WASD / arrow keys** — move
- **Mouse** — aim
- **Hold left click** — fire
- **P** — pause, **M** — mute, **R** — restart
- Between waves: **click a card or press 1 / 2 / 3** to take an upgrade

Win by clearing wave 8. Lose when your hull hits 0. Score comes from
kills plus a bonus for every wave cleared; your best score is kept
locally in the browser.

## What's inside

- `game/index.html` — the page and canvas shell
- `game/src/main.js` — game loop and state machine (title, playing,
  upgrade draft, victory, game over)
- `game/src/config.js` — tuning, wave table, upgrade catalog
- `game/src/entities.js` — player ship, bullets, five enemy kinds
- `game/src/waves.js` — wave spawner and the upgrade draft
- `game/src/render.js` — all drawing: arena, ships, HUD, screens
- `game/src/input.js` — keyboard, mouse and touch input
- `game/src/audio.js` — synthesized WebAudio sound effects, no files
- `game/src/particles.js` — explosions, rings and floating score text
- `game/src/shots.js` — fixed demo states for screenshots (`?shot=`)
- `main.ts` — hands the game in: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json` with the vendored make.fun library

## License

MIT — see `LICENSE`.
