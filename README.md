# Arena Shooter

A browser-based 2D top-down shooter game built with vanilla HTML5 Canvas and JavaScript. No dependencies, no build tools — just open and play.

## How to Play

Open `index.html` in any modern browser.

### Controls
- **Arrow Keys / WASD** — Move
- **Mouse** — Aim
- **Left Click** — Shoot
- **R** — Reload
- **ESC** — Pause

## Gameplay

Survive waves of enemies across 5 levels, each introducing a new enemy type:

| Level | New Enemy | Description |
|-------|-----------|-------------|
| 1 | Shambler | Slow melee attacker |
| 2 | Runner | Fast melee attacker |
| 3 | Shooter | Ranged attacker that keeps distance |
| 4 | Tank | Heavy, slow, damage-resistant |
| 5 | Splitter | Splits into 2 mini-enemies on death |

After Level 5, the game continues in endless mode with scaling difficulty.

## Features

- 5 handcrafted levels with wave-based progression
- Combo scoring system (up to x4 multiplier)
- Procedural audio via Web Audio API
- Particle effects (explosions, muzzle flash, hit sparks)
- Screen shake and hit pause for game feel
- High score persistence via localStorage
- Menu system with instructions and high score board
