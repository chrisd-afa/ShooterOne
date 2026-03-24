# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Arena Shooter — a browser-based 2D top-down shooter built with vanilla HTML5 Canvas and JavaScript. No dependencies, no build tools, no package manager.

## Workflow

Commit changes to git and push to GitHub regularly as we work. Use clean, descriptive commit messages.

## Running the Game

Open `index.html` in any modern browser. That's it — no build step required.

## Architecture

**Game loop & state machine** live in `js/game.js`. The game cycles through states: `menu → instructions → highscores → playing → paused → levelComplete → gameOver`. The `gameLoop()` method calculates delta time, runs updates, and renders each frame via `requestAnimationFrame`.

**Script load order in index.html is critical** — classes are defined globally (no modules/bundler), so dependencies must load before dependents:
`input → particles → audio → collision → bullet → player → enemy → level → renderer → game`

**Core systems (all in `js/`):**
- `game.js` — Orchestrator: game loop, state management, collision detection, scoring/combos, high scores
- `player.js` — Player entity (movement, shooting, ammo/reload, health, invincibility frames)
- `enemy.js` — 6 enemy types (Shambler, Runner, Shooter, Tank, Splitter, Mini Splitter) each with unique AI
- `level.js` — 5 handcrafted levels + endless mode; wave spawning with staggered edge spawns
- `renderer.js` — All UI drawing: menus, HUD, overlays, screen shake, crosshair
- `audio.js` — Procedural sound synthesis via Web Audio API (no audio files)
- `particles.js` — Physics particles and floating damage/score text
- `collision.js` — Circle-circle, point-in-rect, distance, normalize utilities
- `input.js` — Keyboard state tracking (WASD/Arrows) + mouse position/click
- `bullet.js` — Projectile physics for player and enemy bullets

**Key patterns:**
- ES6 classes, no modules — everything is a global class
- Canvas max resolution 1200×800, responsive downscale
- Delta time capped at 50ms to prevent physics jumps
- Combo system: up to 4× multiplier, 2-second decay timer
- High scores persisted to `localStorage` key `arenaShooterHighScores`
- All audio is mathematically generated (oscillators + noise), no asset files
- Splitter enemies spawn 2 mini-splitters on death (recursive entity creation in `game.js`)
