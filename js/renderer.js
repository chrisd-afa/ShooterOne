// Renderer - handles all canvas drawing for UI screens and HUD
class Renderer {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.screenShake = { x: 0, y: 0, timer: 0, intensity: 0 };
        this.menuBobTimer = 0;
    }

    // Screen shake
    shake(intensity, duration) {
        this.screenShake.intensity = intensity;
        this.screenShake.timer = duration;
    }

    updateShake(dt) {
        if (this.screenShake.timer > 0) {
            this.screenShake.timer -= dt;
            this.screenShake.x = (Math.random() - 0.5) * 2 * this.screenShake.intensity;
            this.screenShake.y = (Math.random() - 0.5) * 2 * this.screenShake.intensity;
        } else {
            this.screenShake.x = 0;
            this.screenShake.y = 0;
        }
    }

    applyShake() {
        this.ctx.translate(this.screenShake.x, this.screenShake.y);
    }

    // Arena background
    drawArena() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, w, h);

        // Grid
        ctx.strokeStyle = '#2a2a3e';
        ctx.lineWidth = 1;
        const gridSize = 50;
        for (let x = 0; x < w; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // Border
        ctx.strokeStyle = '#4a4a5e';
        ctx.lineWidth = 3;
        ctx.strokeRect(2, 2, w - 4, h - 4);
    }

    // Crosshair
    drawCrosshair(x, y) {
        const ctx = this.ctx;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        const size = 12;
        ctx.beginPath();
        ctx.moveTo(x - size, y);
        ctx.lineTo(x - 4, y);
        ctx.moveTo(x + 4, y);
        ctx.lineTo(x + size, y);
        ctx.moveTo(x, y - size);
        ctx.lineTo(x, y - 4);
        ctx.moveTo(x, y + 4);
        ctx.lineTo(x, y + size);
        ctx.stroke();

        // Center dot
        ctx.fillStyle = '#ff3333';
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // HUD
    drawHUD(player, score, combo, comboTimer, level, wave, totalWaves) {
        const ctx = this.ctx;

        // Health bar
        const hpBarX = 15;
        const hpBarY = 15;
        const hpBarW = 200;
        const hpBarH = 20;

        ctx.fillStyle = '#333333';
        ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);
        const hpRatio = player.hp / player.maxHp;
        const hpColor = hpRatio > 0.5 ? '#33cc33' : hpRatio > 0.25 ? '#cccc33' : '#cc3333';
        ctx.fillStyle = hpColor;
        ctx.fillRect(hpBarX, hpBarY, hpBarW * hpRatio, hpBarH);
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 2;
        ctx.strokeRect(hpBarX, hpBarY, hpBarW, hpBarH);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`HP: ${player.hp}/${player.maxHp}`, hpBarX + 5, hpBarY + 15);

        // Ammo
        const ammoY = hpBarY + hpBarH + 10;
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px monospace';
        if (player.reloading) {
            ctx.fillStyle = '#ffcc00';
            ctx.fillText(`RELOADING...`, hpBarX, ammoY + 14);
        } else {
            const ammoStr = `Ammo: ${player.ammo}/${player.maxAmmo}`;
            if (player.ammo === 0) ctx.fillStyle = '#ff3333';
            ctx.fillText(ammoStr, hpBarX, ammoY + 14);
            if (player.ammo < player.maxAmmo && player.ammo > 0) {
                ctx.fillStyle = '#888888';
                ctx.fillText('  [R] reload', hpBarX + 130, ammoY + 14);
            }
        }

        // Score (top right)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${score.toLocaleString()}`, this.canvas.width - 15, 35);
        ctx.font = '12px monospace';
        ctx.fillText('SCORE', this.canvas.width - 15, 18);

        // Combo
        if (combo > 1 && comboTimer > 0) {
            ctx.fillStyle = '#ffcc00';
            ctx.font = 'bold 20px monospace';
            const pulse = 1 + Math.sin(performance.now() / 100) * 0.1;
            ctx.save();
            ctx.translate(this.canvas.width - 15, 60);
            ctx.scale(pulse, pulse);
            ctx.fillText(`x${combo} COMBO`, 0, 0);
            ctx.restore();
        }

        // Level / Wave (top center)
        ctx.textAlign = 'center';
        ctx.fillStyle = '#aaaaaa';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(`LEVEL ${level + 1}  —  WAVE ${wave + 1}/${totalWaves}`, this.canvas.width / 2, 25);
    }

    // Wave announcement
    drawWaveAnnouncement(text) {
        if (!text) return;
        const ctx = this.ctx;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px monospace';
        ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2 - 50);
    }

    // Menu screen
    drawMenu(dt, highScores) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        this.menuBobTimer += dt;

        // Background
        ctx.fillStyle = '#0d0d1a';
        ctx.fillRect(0, 0, w, h);

        // Animated grid
        ctx.strokeStyle = '#1a1a3e';
        ctx.lineWidth = 1;
        const offset = (this.menuBobTimer * 20) % 50;
        for (let x = -50 + offset; x < w + 50; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = -50 + offset; y < h + 50; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // Title
        ctx.textAlign = 'center';
        const titleY = h * 0.22;
        const titlePulse = Math.sin(this.menuBobTimer * 2) * 3;

        ctx.fillStyle = '#ff3333';
        ctx.font = 'bold 56px monospace';
        ctx.fillText('ARENA', w / 2, titleY + titlePulse);
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 56px monospace';
        ctx.fillText('SHOOTER', w / 2, titleY + 55 + titlePulse);

        // Subtitle
        ctx.fillStyle = '#888888';
        ctx.font = '14px monospace';
        ctx.fillText('Survive the waves. Kill them all.', w / 2, titleY + 90);

        // Buttons
        this.menuButtons = [];
        const btnW = 240;
        const btnH = 50;
        const btnX = w / 2 - btnW / 2;
        let btnY = h * 0.5;

        this.drawButton(ctx, 'START GAME', btnX, btnY, btnW, btnH, '#33cc33', '#1a661a');
        this.menuButtons.push({ label: 'start', x: btnX, y: btnY, w: btnW, h: btnH });

        btnY += 70;
        this.drawButton(ctx, 'INSTRUCTIONS', btnX, btnY, btnW, btnH, '#3399cc', '#1a4d66');
        this.menuButtons.push({ label: 'instructions', x: btnX, y: btnY, w: btnW, h: btnH });

        btnY += 70;
        this.drawButton(ctx, 'HIGH SCORES', btnX, btnY, btnW, btnH, '#cc9933', '#664d1a');
        this.menuButtons.push({ label: 'highscores', x: btnX, y: btnY, w: btnW, h: btnH });

        // Version
        ctx.fillStyle = '#444444';
        ctx.font = '12px monospace';
        ctx.fillText('v1.0', w / 2, h - 20);
    }

    drawButton(ctx, text, x, y, w, h, color, darkColor) {
        ctx.fillStyle = darkColor;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = color;
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(text, x + w / 2, y + h / 2 + 6);
    }

    getMenuButtonAt(mx, my) {
        if (!this.menuButtons) return null;
        for (const btn of this.menuButtons) {
            if (pointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) {
                return btn.label;
            }
        }
        return null;
    }

    // Instructions screen
    drawInstructions() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.fillStyle = '#0d0d1a';
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px monospace';
        ctx.fillText('INSTRUCTIONS', w / 2, 80);

        const lines = [
            '',
            'ARROW KEYS or WASD — Move',
            'MOUSE — Aim',
            'LEFT CLICK — Shoot',
            'R — Reload',
            'ESC — Pause',
            '',
            'Kill all enemies in each wave.',
            'Survive all waves to complete a level.',
            'New enemy types appear in later levels!',
            '',
            'ENEMIES:',
            '● Red Circle — Shambler (slow, melee)',
            '▲ Orange Triangle — Runner (fast, melee)',
            '■ Purple Square — Shooter (ranged)',
            '● Large Dark Red — Tank (heavy, tough)',
            '◆ Green Diamond — Splitter (splits on death)'
        ];

        ctx.font = '16px monospace';
        ctx.fillStyle = '#cccccc';
        lines.forEach((line, i) => {
            ctx.fillText(line, w / 2, 130 + i * 28);
        });

        // Back button
        const btnW = 200;
        const btnH = 45;
        const btnX = w / 2 - btnW / 2;
        const btnY = h - 80;
        this.drawButton(ctx, 'BACK', btnX, btnY, btnW, btnH, '#888888', '#444444');
        this.backButton = { x: btnX, y: btnY, w: btnW, h: btnH };
    }

    // High scores screen
    drawHighScores(scores) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.fillStyle = '#0d0d1a';
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 36px monospace';
        ctx.fillText('HIGH SCORES', w / 2, 80);

        ctx.font = '20px monospace';
        if (scores.length === 0) {
            ctx.fillStyle = '#666666';
            ctx.fillText('No scores yet. Go play!', w / 2, 180);
        } else {
            scores.slice(0, 10).forEach((entry, i) => {
                ctx.fillStyle = i === 0 ? '#ffcc00' : '#cccccc';
                const rank = `${i + 1}.`.padStart(3);
                const name = entry.name.padEnd(5);
                const score = entry.score.toLocaleString().padStart(10);
                const level = `Lv.${entry.level + 1}`;
                ctx.fillText(`${rank} ${name} ${score}  ${level}`, w / 2, 140 + i * 35);
            });
        }

        const btnW = 200;
        const btnH = 45;
        const btnX = w / 2 - btnW / 2;
        const btnY = h - 80;
        this.drawButton(ctx, 'BACK', btnX, btnY, btnW, btnH, '#888888', '#444444');
        this.backButton = { x: btnX, y: btnY, w: btnW, h: btnH };
    }

    // Level complete screen
    drawLevelComplete(level, kills, accuracy, score, timeBonus) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Dim background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#33cc33';
        ctx.font = 'bold 44px monospace';
        ctx.fillText('LEVEL COMPLETE!', w / 2, h * 0.25);

        ctx.fillStyle = '#ffffff';
        ctx.font = '20px monospace';
        ctx.fillText(`Level ${level + 1} cleared`, w / 2, h * 0.35);

        ctx.font = '18px monospace';
        ctx.fillStyle = '#cccccc';
        ctx.fillText(`Enemies killed: ${kills}`, w / 2, h * 0.45);
        ctx.fillText(`Accuracy: ${accuracy}%`, w / 2, h * 0.5);
        ctx.fillText(`Time bonus: +${timeBonus}`, w / 2, h * 0.55);

        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 28px monospace';
        ctx.fillText(`Score: ${score.toLocaleString()}`, w / 2, h * 0.65);

        const btnW = 240;
        const btnH = 50;
        const btnX = w / 2 - btnW / 2;
        const btnY = h * 0.75;
        this.drawButton(ctx, 'NEXT LEVEL', btnX, btnY, btnW, btnH, '#33cc33', '#1a661a');
        this.nextLevelButton = { x: btnX, y: btnY, w: btnW, h: btnH };
    }

    // Game over screen
    drawGameOver(score, level, kills, accuracy, isHighScore) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff3333';
        ctx.font = 'bold 52px monospace';
        ctx.fillText('GAME OVER', w / 2, h * 0.2);

        ctx.fillStyle = '#ffffff';
        ctx.font = '20px monospace';
        ctx.fillText(`Reached Level ${level + 1}`, w / 2, h * 0.32);

        ctx.fillStyle = '#cccccc';
        ctx.font = '18px monospace';
        ctx.fillText(`Enemies killed: ${kills}`, w / 2, h * 0.4);
        ctx.fillText(`Accuracy: ${accuracy}%`, w / 2, h * 0.45);

        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 28px monospace';
        ctx.fillText(`Final Score: ${score.toLocaleString()}`, w / 2, h * 0.55);

        if (isHighScore) {
            ctx.fillStyle = '#ffcc00';
            ctx.font = 'bold 18px monospace';
            ctx.fillText('NEW HIGH SCORE!', w / 2, h * 0.62);
        }

        const btnW = 200;
        const btnH = 45;
        const gap = 20;

        const btnX1 = w / 2 - btnW - gap / 2;
        const btnX2 = w / 2 + gap / 2;
        const btnY = h * 0.72;

        this.drawButton(ctx, 'PLAY AGAIN', btnX1, btnY, btnW, btnH, '#33cc33', '#1a661a');
        this.drawButton(ctx, 'MAIN MENU', btnX2, btnY, btnW, btnH, '#888888', '#444444');
        this.gameOverButtons = [
            { label: 'restart', x: btnX1, y: btnY, w: btnW, h: btnH },
            { label: 'menu', x: btnX2, y: btnY, w: btnW, h: btnH }
        ];
    }

    getGameOverButtonAt(mx, my) {
        if (!this.gameOverButtons) return null;
        for (const btn of this.gameOverButtons) {
            if (pointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) {
                return btn.label;
            }
        }
        return null;
    }

    // Pause overlay
    drawPause() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 44px monospace';
        ctx.fillText('PAUSED', w / 2, h * 0.35);

        ctx.font = '18px monospace';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText('Press ESC to resume', w / 2, h * 0.45);

        const btnW = 200;
        const btnH = 45;
        const btnX = w / 2 - btnW / 2;
        const btnY = h * 0.55;
        this.drawButton(ctx, 'QUIT TO MENU', btnX, btnY, btnW, btnH, '#cc3333', '#661a1a');
        this.pauseQuitButton = { x: btnX, y: btnY, w: btnW, h: btnH };
    }
}
