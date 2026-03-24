// Game - main orchestrator
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.input = new InputManager(this.canvas);
        this.renderer = new Renderer(this.ctx, this.canvas);
        this.particles = new ParticleSystem();
        this.audio = new AudioManager();
        this.level = new LevelManager();

        this.player = null;
        this.playerBullets = [];

        // Game state
        this.state = 'menu'; // menu, instructions, highscores, playing, paused, levelComplete, gameOver
        this.score = 0;
        this.totalKills = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.comboDuration = 2.0;
        this.hitPauseTimer = 0;

        // High scores
        this.highScores = this.loadHighScores();

        // Level complete stats
        this.levelAccuracy = 0;
        this.levelTimeBonus = 0;

        // Timing
        this.lastTimestamp = 0;

        // ESC handling
        this.escPressed = false;
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.state === 'playing') {
                    this.state = 'paused';
                } else if (this.state === 'paused') {
                    this.state = 'playing';
                } else if (this.state === 'instructions' || this.state === 'highscores') {
                    this.state = 'menu';
                }
            }
        });

        // Start the loop
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    resize() {
        this.canvas.width = Math.min(1200, window.innerWidth);
        this.canvas.height = Math.min(800, window.innerHeight);
    }

    gameLoop(timestamp) {
        let dt = (timestamp - this.lastTimestamp) / 1000;
        this.lastTimestamp = timestamp;
        dt = Math.min(dt, 0.05); // cap delta time

        // Hit pause effect
        if (this.hitPauseTimer > 0) {
            this.hitPauseTimer -= dt;
            this.render();
            requestAnimationFrame((ts) => this.gameLoop(ts));
            return;
        }

        this.update(dt);
        this.render();
        this.input.endFrame();
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    update(dt) {
        this.renderer.updateShake(dt);

        switch (this.state) {
            case 'menu':
                this.updateMenu(dt);
                break;
            case 'playing':
                this.updatePlaying(dt);
                break;
            case 'levelComplete':
                this.updateLevelComplete(dt);
                break;
            case 'gameOver':
                this.updateGameOver(dt);
                break;
            case 'instructions':
            case 'highscores':
                this.updateSubScreen(dt);
                break;
            case 'paused':
                this.updatePaused(dt);
                break;
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        switch (this.state) {
            case 'menu':
                this.renderer.drawMenu(0.016, this.highScores);
                break;
            case 'instructions':
                this.renderer.drawInstructions();
                break;
            case 'highscores':
                this.renderer.drawHighScores(this.highScores);
                break;
            case 'playing':
                this.renderPlaying();
                break;
            case 'paused':
                this.renderPlaying();
                this.renderer.drawPause();
                break;
            case 'levelComplete':
                this.renderPlaying();
                this.renderer.drawLevelComplete(
                    this.level.currentLevel,
                    this.level.enemiesKilledThisLevel,
                    this.levelAccuracy,
                    this.score,
                    this.levelTimeBonus
                );
                break;
            case 'gameOver':
                this.renderPlaying();
                const accuracy = this.player.shotsFired > 0
                    ? Math.round(this.player.shotsHit / this.player.shotsFired * 100)
                    : 0;
                const isHigh = this.highScores.length === 0 || this.score > this.highScores[this.highScores.length - 1].score || this.highScores.length < 10;
                this.renderer.drawGameOver(this.score, this.level.currentLevel, this.totalKills, accuracy, isHigh);
                break;
        }
    }

    renderPlaying() {
        this.ctx.save();
        this.renderer.applyShake();
        this.renderer.drawArena();

        // Draw player bullets
        for (const bullet of this.playerBullets) {
            bullet.draw(this.ctx);
        }

        // Draw enemies and their bullets
        this.level.draw(this.ctx);

        // Draw player
        if (this.player) {
            this.player.draw(this.ctx);
        }

        // Draw particles
        this.particles.draw(this.ctx);

        this.ctx.restore();

        // HUD (not affected by shake)
        if (this.player) {
            this.renderer.drawHUD(
                this.player, this.score, this.combo, this.comboTimer,
                this.level.currentLevel, this.level.currentWave, this.level.totalWaves
            );
        }

        // Wave announcement
        const announcement = this.level.getWaveAnnouncement();
        this.renderer.drawWaveAnnouncement(announcement);

        // Crosshair
        const mouse = this.input.getMousePos();
        this.renderer.drawCrosshair(mouse.x, mouse.y);
    }

    // State updates
    updateMenu(dt) {
        this.renderer.menuBobTimer += dt;
        if (this.input.consumeClick()) {
            const mouse = this.input.getMousePos();
            const btn = this.renderer.getMenuButtonAt(mouse.x, mouse.y);
            if (btn === 'start') {
                this.startGame();
            } else if (btn === 'instructions') {
                this.state = 'instructions';
            } else if (btn === 'highscores') {
                this.state = 'highscores';
            }
        }
    }

    updateSubScreen(dt) {
        if (this.input.consumeClick()) {
            const mouse = this.input.getMousePos();
            if (this.renderer.backButton &&
                pointInRect(mouse.x, mouse.y, this.renderer.backButton.x, this.renderer.backButton.y,
                    this.renderer.backButton.w, this.renderer.backButton.h)) {
                this.state = 'menu';
            }
        }
    }

    updatePlaying(dt) {
        // Update player
        this.player.update(dt, this.input, this.canvas.width, this.canvas.height,
            this.playerBullets, this.particles, this.audio);

        // Update player bullets
        for (const bullet of this.playerBullets) {
            bullet.update(dt, this.canvas.width, this.canvas.height);
        }

        // Update level (enemies, enemy bullets, wave logic)
        this.level.update(dt, this.player.x, this.player.y,
            this.canvas.width, this.canvas.height, this.particles, this.audio);

        // Update particles
        this.particles.update(dt);

        // Combo timer
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.combo = 0;
            }
        }

        // Collision detection
        this.checkCollisions();

        // Clean up dead player bullets
        this.playerBullets = this.playerBullets.filter(b => b.alive);

        // Check level complete
        if (this.level.levelComplete) {
            this.onLevelComplete();
        }

        // Check player death
        if (!this.player.alive) {
            this.onGameOver();
        }

        // Screen shake on shooting
        if (this.input.isMouseDown() && this.player.fireCooldown <= 0.01 && this.player.ammo > 0 && !this.player.reloading) {
            this.renderer.shake(2, 0.05);
        }
    }

    updateLevelComplete(dt) {
        this.particles.update(dt);
        if (this.input.consumeClick()) {
            const mouse = this.input.getMousePos();
            const btn = this.renderer.nextLevelButton;
            if (btn && pointInRect(mouse.x, mouse.y, btn.x, btn.y, btn.w, btn.h)) {
                this.nextLevel();
            }
        }
    }

    updateGameOver(dt) {
        this.particles.update(dt);
        if (this.input.consumeClick()) {
            const mouse = this.input.getMousePos();
            const btn = this.renderer.getGameOverButtonAt(mouse.x, mouse.y);
            if (btn === 'restart') {
                this.startGame();
            } else if (btn === 'menu') {
                this.state = 'menu';
            }
        }
    }

    updatePaused(dt) {
        if (this.input.consumeClick()) {
            const mouse = this.input.getMousePos();
            const btn = this.renderer.pauseQuitButton;
            if (btn && pointInRect(mouse.x, mouse.y, btn.x, btn.y, btn.w, btn.h)) {
                this.state = 'menu';
            }
        }
    }

    // Collision detection
    checkCollisions() {
        const enemies = this.level.enemies;

        // Player bullets vs enemies
        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            const bullet = this.playerBullets[i];
            if (!bullet.alive) continue;

            for (const enemy of enemies) {
                if (enemy.isDead()) continue;
                if (circleCircle(bullet.x, bullet.y, bullet.radius, enemy.x, enemy.y, enemy.radius)) {
                    bullet.alive = false;
                    enemy.takeDamage(bullet.damage);
                    this.player.shotsHit++;
                    this.particles.hitSpark(bullet.x, bullet.y);
                    this.audio.playHit();

                    if (enemy.isDead()) {
                        this.onEnemyKilled(enemy);
                    }
                    break;
                }
            }
        }

        // Enemy bullets vs player
        for (const bullet of this.level.enemyBullets) {
            if (!bullet.alive) continue;
            if (circleCircle(bullet.x, bullet.y, bullet.radius, this.player.x, this.player.y, this.player.radius)) {
                bullet.alive = false;
                this.player.takeDamage(bullet.damage, this.particles, this.audio);
                this.renderer.shake(5, 0.2);
            }
        }

        // Enemies vs player (melee)
        for (const enemy of enemies) {
            if (enemy.isDead()) continue;
            if (enemy.type === 'shooter') continue; // shooters don't melee
            if (circleCircle(this.player.x, this.player.y, this.player.radius, enemy.x, enemy.y, enemy.radius)) {
                this.player.takeDamage(enemy.damage, this.particles, this.audio);
                this.renderer.shake(5, 0.2);

                // Push enemy back
                const dx = enemy.x - this.player.x;
                const dy = enemy.y - this.player.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                enemy.x += (dx / dist) * 30;
                enemy.y += (dy / dist) * 30;
            }
        }
    }

    onEnemyKilled(enemy) {
        this.totalKills++;
        this.level.enemiesKilledThisLevel++;

        // Combo
        this.combo++;
        this.comboTimer = this.comboDuration;
        const multiplier = Math.min(this.combo, 4);
        const points = enemy.points * multiplier;
        this.score += points;

        // Floating text
        const comboText = multiplier > 1 ? ` x${multiplier}` : '';
        this.particles.addFloatingText(enemy.x, enemy.y - 20, `+${points}${comboText}`, '#ffcc00', 18);

        // Death effects
        this.particles.enemyDeath(enemy.x, enemy.y, enemy.color);
        this.audio.playExplosion();

        // Hit pause
        this.hitPauseTimer = 0.03;

        // Health drop
        if (Math.random() < enemy.dropChance) {
            this.player.heal(25);
            this.particles.addFloatingText(enemy.x, enemy.y - 40, '+25 HP', '#33ff33', 16);
        }
    }

    onLevelComplete() {
        const accuracy = this.player.shotsFired > 0
            ? Math.round(this.player.shotsHit / this.player.shotsFired * 100)
            : 0;
        this.levelAccuracy = accuracy;

        // Time bonus
        const avgTimePerWave = this.level.waveTimeTotal / this.level.totalWaves;
        this.levelTimeBonus = Math.max(0, Math.round((60 - avgTimePerWave) * 10));
        this.score += this.levelTimeBonus;

        // Accuracy bonus
        const accuracyBonus = Math.round(accuracy / 100 * 500);
        this.score += accuracyBonus;

        this.state = 'levelComplete';
    }

    onGameOver() {
        this.saveHighScore();
        this.audio.playGameOver();
        this.state = 'gameOver';
    }

    startGame() {
        this.audio.init();
        this.score = 0;
        this.totalKills = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.playerBullets = [];
        this.particles.clear();

        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2);
        this.level.startLevel(0);
        this.state = 'playing';
    }

    nextLevel() {
        this.playerBullets = [];
        this.particles.clear();
        this.player.hp = this.player.maxHp;
        this.player.ammo = this.player.maxAmmo;
        this.player.reloading = false;
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height / 2;
        this.player.shotsFired = 0;
        this.player.shotsHit = 0;

        this.level.startLevel(this.level.currentLevel + 1);
        this.state = 'playing';
    }

    // High scores
    loadHighScores() {
        try {
            const data = localStorage.getItem('arenaShooterHighScores');
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    saveHighScore() {
        const entry = {
            name: 'PLR',
            score: this.score,
            level: this.level.currentLevel,
            date: Date.now()
        };
        this.highScores.push(entry);
        this.highScores.sort((a, b) => b.score - a.score);
        this.highScores = this.highScores.slice(0, 10);
        try {
            localStorage.setItem('arenaShooterHighScores', JSON.stringify(this.highScores));
        } catch { }
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new Game();
});
