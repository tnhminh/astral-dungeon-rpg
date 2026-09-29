# Astral Dungeon RPG: Knight of the Ruins

Standalone 3D action RPG vertical slice built with Three.js and real GLB assets.

## Play

- GitHub Pages demo: `https://tnhminh.github.io/astral-dungeon-rpg/`
- Local: open `index.html` directly in a modern browser.

## Features

- KayKit knight and Skeleton Warrior GLB characters with real animation clips.
- Third-person dungeon combat: 3-hit combo, block, dodge i-frames, enemy AI.
- Treasure chest and loot interaction.
- Modular dungeon props, torches, weapons, gems, barrels and stone pieces.
- Procedural Web Audio feedback.
- Zero-CORS standalone artifact: all runtime assets are embedded in `index.html`.

## Controls

- `WASD` / arrow keys: move
- Mouse or touch buttons: attack, block, dodge, interact
- Start from the title screen, then explore the dungeon and defeat the skeleton.

## Project layout

```text
astral-dungeon-rpg/
├── index.html                 # Standalone release artifact
├── assets-manifest.json       # Asset-first manifest
├── build/
│   ├── template.html          # Source HTML template
│   ├── game_core.js           # Game logic
│   └── embedded_assets.json   # Embedded GLB data
└── vendor/
    ├── three.min.js
    ├── GLTFLoader.js
    └── SkeletonUtils.js
```

## Verification

The release was checked with:

- JavaScript syntax validation via `node --check`.
- Asset-first validation via `asset_first_gate.py`.
- Browser smoke test: title → start → attack → dodge/block → chest interaction.
- Runtime asset readiness and gameplay state through `window.__ASTRAL_RPG__.getState()`.

Model attribution and commercial redistribution rights should be reviewed before commercial release; the bundled assets came from the local project inventory.
