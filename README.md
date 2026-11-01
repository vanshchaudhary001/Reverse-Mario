# 👑 Princess Saves Mario: The Reverse Rescue (3D Cyber Arcade Edition)

A complete, high-performance 3D cyber-arcade web game featuring **Three.js WebGL rendering**, **GSAP 3D touch & kinetic parallax**, Node.js Express backend, hybrid persistence (SQLite + IndexedDB offline sync), procedural Web Audio API sound effects, Google MediaPipe single-finger webcam gesture tracking with instant keyboard fallback, 20-second revival trivia, and an arcade Hall of Rescuers leaderboard.

---

## 📁 8-File Project Architecture

The entire codebase is cleanly modularized into **at most 8 code & markup files + 1 `README.md`**:

```text
├── package.json          # 1. Project dependencies and startup scripts
├── server.js             # 2. Express backend, REST APIs, and database controller
├── db/
│   ├── schema.sql        # 3. SQLite database schema (trivia & leaderboard)
│   └── seed.js           # 4. Database seed data (31 questions + 15 default champions)
└── public/
    ├── index.html        # 5. Core HTML structure, cyber HUD & modal templates
    ├── style.css         # 6. Cyberpunk arcade styles, HUD chips, responsive modals
    ├── game.js           # 7. Three.js 3D engine, level platforms, physics, combat & audio
    └── gesture.js        # 8. MediaPipe webcam single-finger gesture sensor & snap detection
└── README.md             # Complete documentation and setup guide
```

---

## 🕹️ Quick Start

### 1. Requirements
- Node.js (v18+ recommended)
- Modern web browser (Chrome, Edge, Firefox, Brave)
- Optional: Webcam for MediaPipe hand tracking

### 2. Install & Launch
```bash
# Install dependencies
npm install

# Start the game server
npm start
# or: node server.js
```

Open your browser at: **[http://localhost:3000](http://localhost:3000)**

---

## 🎮 Controls

### ⌨️ Keyboard Controls (Always Active)
| Action | Key(s) | Description |
|---|---|---|
| **Move Left / Right** | `A` / `D` or `←` / `→` | Horizontal run with instant responsive turn-around |
| **Jump** | `W` / `Space` / `↑` | Snappy jump with mid-air steering and coyote time |
| **Wrench Strike** | `Z` / `J` / `F` | Kinetic wrench melee strike |
| **Fireball Blast** | `X` / `K` / `Q` | Fires fiery whoosh plasma projectile with sound effect |
| **Rescue Mario** | `E` or `Enter` | Frees Prince Mario from the cage at stage end |
| **Pause / Resume** | `P` or `Esc` | Toggles pause screen |
| **Unmute / Mute** | Button or `M` | Toggles procedural sound effects |

### 🖐️ Single-Finger Gesture Controls (Webcam Mode)
Click **`GESTURE ON/OFF`** in the HUD to enable webcam control:
| Gesture Area | Action |
|---|---|
| **Center Green Box** | **Neutral / Stopped**: Peach plants feet firmly without sliding |
| **Left of Green Box** | **Run Left**: Move horizontally left |
| **Right of Green Box** | **Run Right**: Move horizontally right |
| **Above Cyan Line** | **Jump**: Raise index finger upward to jump |
| **Finger Snap** | **Fireball Blast**: Quick snap of index/middle finger against thumb triggers fireball blast |

---

## 🔊 Procedural Web Audio API Sound Effects
Zero external audio files required — all sound effects are synthesized procedurally in real-time with zero latency:
- **Fireball Launch**: Dual-layer sound featuring a swept white-noise ignition whoosh (`1900Hz → 380Hz`) and resonant plasma blast (`540Hz → 200Hz`).
- **Monster Defeat**:
  - *Crystal Golems*: Heavy stone crunch lowpass sweep (`2200Hz → 180Hz`), sub-bass impact, and crystal shatter ring.
  - *Baby Dragons*: Fiery pop bandpass noise sweep (`1600Hz → 320Hz`) and arcade defeat chime.
- **Solid Platform Bumps**: Mechanical low-frequency thump when jumping into solid platform undersides.
- **Revival & Scoring**: High-definition tones for coin pickups, correct/wrong trivia answers, and mission victory.

---

## 🏰 Game Stages & Platforming
1. **Stage 1: Floating Castle Realm**: Azure blue sky, stone cobblestone mainland cliffs, elevated solid celestial pedestals.
2. **Stage 2: Dangerous Forest**: Canopy tree boughs, collectible golden keys, thorn barriers.
3. **Stage 3: Castle Battlements**: Iron portcullis gates, stepped fortress parapets, seamless bridges.
4. **Stage 4: Bowser's Magma Core**: Magma stepping stones, pre-arena fortress bridge, and final showdown against King Bowser.

---

## 🏆 Leaderboard
- Top 15 high scores partitioned by player personal best with level reached and duration.
- Persisted in SQLite (`db/game.db`) with offline IndexedDB backup.
