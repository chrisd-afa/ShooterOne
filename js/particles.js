// Particle system for visual effects
class Particle {
    constructor(x, y, vx, vy, radius, color, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = radius;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.alive = true;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        if (this.life <= 0) this.alive = false;
    }

    draw(ctx) {
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class FloatingText {
    constructor(x, y, text, color, size) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.size = size || 16;
        this.life = 1.0;
        this.maxLife = 1.0;
        this.alive = true;
        this.vy = -60;
    }

    update(dt) {
        this.y += this.vy * dt;
        this.life -= dt;
        if (this.life <= 0) this.alive = false;
    }

    draw(ctx) {
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.font = `bold ${this.size}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.globalAlpha = 1;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.floatingTexts = [];
    }

    emit(x, y, count, color, speed, radius, life) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = speed * (0.5 + Math.random() * 0.5);
            const vx = Math.cos(angle) * spd;
            const vy = Math.sin(angle) * spd;
            const r = radius * (0.5 + Math.random() * 0.5);
            const l = life * (0.5 + Math.random() * 0.5);
            this.particles.push(new Particle(x, y, vx, vy, r, color, l));
        }
    }

    addFloatingText(x, y, text, color, size) {
        this.floatingTexts.push(new FloatingText(x, y, text, color, size));
    }

    muzzleFlash(x, y) {
        this.emit(x, y, 5, '#ffff00', 100, 3, 0.15);
    }

    enemyDeath(x, y, color) {
        this.emit(x, y, 12, color, 150, 4, 0.5);
    }

    hitSpark(x, y) {
        this.emit(x, y, 4, '#ffffff', 80, 2, 0.2);
    }

    playerDamage(x, y) {
        this.emit(x, y, 6, '#ff3333', 100, 3, 0.4);
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(dt);
            if (!this.particles[i].alive) {
                this.particles.splice(i, 1);
            }
        }
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            this.floatingTexts[i].update(dt);
            if (!this.floatingTexts[i].alive) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        for (const p of this.particles) p.draw(ctx);
        for (const t of this.floatingTexts) t.draw(ctx);
    }

    clear() {
        this.particles = [];
        this.floatingTexts = [];
    }
}
