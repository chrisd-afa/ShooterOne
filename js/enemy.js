// Enemy types and base class
const ENEMY_TYPES = {
    SHAMBLER: 'shambler',
    RUNNER: 'runner',
    SHOOTER: 'shooter',
    TANK: 'tank',
    SPLITTER: 'splitter',
    MINI_SPLITTER: 'mini_splitter'
};

const ENEMY_STATS = {
    shambler:      { hp: 30,  speed: 80,  damage: 10, radius: 14, color: '#cc3333', points: 10, dropChance: 0.1 },
    runner:        { hp: 15,  speed: 180, damage: 15, radius: 10, color: '#ff8833', points: 20, dropChance: 0 },
    shooter:       { hp: 50,  speed: 100, damage: 8,  radius: 14, color: '#9933cc', points: 30, dropChance: 0.1 },
    tank:          { hp: 150, speed: 40,  damage: 30, radius: 22, color: '#882222', points: 50, dropChance: 0.3 },
    splitter:      { hp: 60,  speed: 120, damage: 10, radius: 12, color: '#33aa33', points: 25, dropChance: 0 },
    mini_splitter: { hp: 20,  speed: 150, damage: 5,  radius: 8,  color: '#55cc55', points: 10, dropChance: 0 }
};

class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        const stats = ENEMY_STATS[type];
        this.hp = stats.hp;
        this.maxHp = stats.hp;
        this.speed = stats.speed;
        this.damage = stats.damage;
        this.radius = stats.radius;
        this.color = stats.color;
        this.points = stats.points;
        this.dropChance = stats.dropChance;
        this.alive = true;
        this.damageResistance = type === 'tank' ? 0.5 : 0;

        // Shooter-specific
        this.fireRate = 2.0;
        this.fireCooldown = Math.random() * 2; // stagger initial shots
        this.preferredRange = 200;

        // Animation
        this.hitFlashTimer = 0;
        this.deathTimer = 0; // for death animation
        this.dying = false;
        this.angle = 0;
        this.bobTimer = Math.random() * Math.PI * 2;
    }

    update(dt, playerX, playerY, bullets) {
        if (this.dying) {
            this.deathTimer -= dt;
            if (this.deathTimer <= 0) {
                this.alive = false;
            }
            return;
        }

        this.bobTimer += dt * 5;
        this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);

        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        this.angle = Math.atan2(dy, dx);

        if (this.type === 'shooter') {
            this.updateShooter(dt, dx, dy, dist, playerX, playerY, bullets);
        } else {
            // Direct chase
            if (dist > 0) {
                const nx = dx / dist;
                const ny = dy / dist;
                this.x += nx * this.speed * dt;
                this.y += ny * this.speed * dt;
            }
        }
    }

    updateShooter(dt, dx, dy, dist, playerX, playerY, bullets) {
        const nx = dx / dist;
        const ny = dy / dist;

        if (dist > this.preferredRange + 30) {
            // Approach
            this.x += nx * this.speed * dt;
            this.y += ny * this.speed * dt;
        } else if (dist < this.preferredRange - 30) {
            // Back away
            this.x -= nx * this.speed * 0.5 * dt;
            this.y -= ny * this.speed * 0.5 * dt;
        } else {
            // Strafe
            this.x += -ny * this.speed * 0.7 * dt;
            this.y += nx * this.speed * 0.7 * dt;
        }

        // Shoot
        this.fireCooldown -= dt;
        if (this.fireCooldown <= 0) {
            const bulletAngle = Math.atan2(playerY - this.y, playerX - this.x);
            const spread = (Math.random() - 0.5) * 0.2;
            bullets.push(new Bullet(this.x, this.y, bulletAngle + spread, 250, this.damage, true));
            this.fireCooldown = this.fireRate;
        }
    }

    takeDamage(amount) {
        const actualDamage = amount * (1 - this.damageResistance);
        this.hp -= actualDamage;
        this.hitFlashTimer = 0.1;
        if (this.hp <= 0) {
            this.dying = true;
            this.deathTimer = 0.15;
        }
    }

    isDead() {
        return this.dying || !this.alive;
    }

    shouldSplit() {
        return this.type === 'splitter' && this.dying;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Death animation: expand then fade
        if (this.dying) {
            const progress = 1 - (this.deathTimer / 0.15);
            const scale = 1 + progress * 0.5;
            ctx.scale(scale, scale);
            ctx.globalAlpha = 1 - progress;
        }

        const flashColor = this.hitFlashTimer > 0 ? '#ffffff' : this.color;

        switch (this.type) {
            case 'shambler':
                this.drawShambler(ctx, flashColor);
                break;
            case 'runner':
                this.drawRunner(ctx, flashColor);
                break;
            case 'shooter':
                this.drawShooter(ctx, flashColor);
                break;
            case 'tank':
                this.drawTank(ctx, flashColor);
                break;
            case 'splitter':
            case 'mini_splitter':
                this.drawSplitter(ctx, flashColor);
                break;
        }

        ctx.restore();

        // Health bar (only if damaged and not dying)
        if (!this.dying && this.hp < this.maxHp) {
            const barWidth = this.radius * 2;
            const barHeight = 3;
            const barX = this.x - barWidth / 2;
            const barY = this.y - this.radius - 8;
            ctx.fillStyle = '#333333';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            ctx.fillStyle = '#ff3333';
            ctx.fillRect(barX, barY, barWidth * (this.hp / this.maxHp), barHeight);
        }
    }

    drawShambler(ctx, color) {
        // Body
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#881111';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Arms
        const armAngle = this.angle;
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(armAngle - 0.5) * 8, Math.sin(armAngle - 0.5) * 8);
        ctx.lineTo(Math.cos(armAngle - 0.4) * 22, Math.sin(armAngle - 0.4) * 22);
        ctx.moveTo(Math.cos(armAngle + 0.5) * 8, Math.sin(armAngle + 0.5) * 8);
        ctx.lineTo(Math.cos(armAngle + 0.4) * 22, Math.sin(armAngle + 0.4) * 22);
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(Math.cos(this.angle) * 6 - 3, Math.sin(this.angle) * 6 - 3, 3, 0, Math.PI * 2);
        ctx.arc(Math.cos(this.angle) * 6 + 3, Math.sin(this.angle) * 6 + 3, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawRunner(ctx, color) {
        // Triangle pointing in movement direction
        ctx.save();
        ctx.rotate(this.angle);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(this.radius, 0);
        ctx.lineTo(-this.radius * 0.7, -this.radius * 0.8);
        ctx.lineTo(-this.radius * 0.7, this.radius * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#cc6600';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Eye
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(2, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawShooter(ctx, color) {
        ctx.save();
        ctx.rotate(this.angle);

        // Gun barrel
        ctx.fillStyle = '#666666';
        ctx.fillRect(8, -2, 14, 4);

        // Body (square)
        ctx.fillStyle = color;
        ctx.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
        ctx.strokeStyle = '#6622aa';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);

        // Eye/sensor
        ctx.fillStyle = '#ff00ff';
        ctx.beginPath();
        ctx.arc(4, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawTank(ctx, color) {
        // Large body
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#551111';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Armor cross-hatch
        ctx.strokeStyle = '#661818';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-this.radius + 6, -this.radius + 6);
        ctx.lineTo(this.radius - 6, this.radius - 6);
        ctx.moveTo(this.radius - 6, -this.radius + 6);
        ctx.lineTo(-this.radius + 6, this.radius - 6);
        ctx.moveTo(0, -this.radius + 4);
        ctx.lineTo(0, this.radius - 4);
        ctx.moveTo(-this.radius + 4, 0);
        ctx.lineTo(this.radius - 4, 0);
        ctx.stroke();

        // Eyes (angry)
        ctx.fillStyle = '#ff3300';
        ctx.beginPath();
        ctx.arc(Math.cos(this.angle) * 8 - 4, Math.sin(this.angle) * 8 - 4, 4, 0, Math.PI * 2);
        ctx.arc(Math.cos(this.angle) * 8 + 4, Math.sin(this.angle) * 8 + 4, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    drawSplitter(ctx, color) {
        // Diamond (rotated square)
        ctx.save();
        ctx.rotate(this.bobTimer * 2);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, -this.radius);
        ctx.lineTo(this.radius, 0);
        ctx.lineTo(0, this.radius);
        ctx.lineTo(-this.radius, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#228822';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        // Center dot
        ctx.fillStyle = '#88ff88';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}
