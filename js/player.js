// Player class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 16;
        this.speed = 200;
        this.angle = 0; // aim angle
        this.hp = 100;
        this.maxHp = 100;
        this.alive = true;

        // Shooting
        this.ammo = 12;
        this.maxAmmo = 12;
        this.fireRate = 0.18; // seconds between shots
        this.fireCooldown = 0;
        this.reloading = false;
        this.reloadTime = 1.5;
        this.reloadTimer = 0;
        this.bulletSpeed = 600;
        this.bulletDamage = 10;

        // Stats
        this.shotsFired = 0;
        this.shotsHit = 0;

        // Invincibility
        this.invincible = false;
        this.invincibleTimer = 0;
        this.invincibleDuration = 0.5;

        // Animation
        this.bobTimer = 0;
        this.moving = false;
        this.flashTimer = 0;
    }

    update(dt, input, canvasWidth, canvasHeight, bullets, particles, audio) {
        // Movement
        let dx = 0, dy = 0;
        if (input.isKeyDown('ArrowUp') || input.isKeyDown('w') || input.isKeyDown('W')) dy = -1;
        if (input.isKeyDown('ArrowDown') || input.isKeyDown('s') || input.isKeyDown('S')) dy = 1;
        if (input.isKeyDown('ArrowLeft') || input.isKeyDown('a') || input.isKeyDown('A')) dx = -1;
        if (input.isKeyDown('ArrowRight') || input.isKeyDown('d') || input.isKeyDown('D')) dx = 1;

        // Normalize diagonal
        this.moving = dx !== 0 || dy !== 0;
        if (this.moving) {
            const norm = normalize(dx, dy);
            this.x += norm.x * this.speed * dt;
            this.y += norm.y * this.speed * dt;
            this.bobTimer += dt * 10;
        }

        // Clamp to arena
        const margin = this.radius + 5;
        this.x = Math.max(margin, Math.min(canvasWidth - margin, this.x));
        this.y = Math.max(margin, Math.min(canvasHeight - margin, this.y));

        // Aiming
        const mouse = input.getMousePos();
        this.angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);

        // Reload
        if (input.isKeyDown('r') || input.isKeyDown('R')) {
            if (!this.reloading && this.ammo < this.maxAmmo) {
                this.startReload(audio);
            }
        }

        if (this.reloading) {
            this.reloadTimer -= dt;
            if (this.reloadTimer <= 0) {
                this.ammo = this.maxAmmo;
                this.reloading = false;
            }
        }

        // Shooting
        this.fireCooldown -= dt;
        if (input.isMouseDown() && this.fireCooldown <= 0 && !this.reloading) {
            if (this.ammo > 0) {
                this.shoot(bullets, particles, audio);
            } else {
                this.startReload(audio);
            }
        }

        // Invincibility
        if (this.invincible) {
            this.invincibleTimer -= dt;
            this.flashTimer += dt;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
                this.flashTimer = 0;
            }
        }
    }

    shoot(bullets, particles, audio) {
        const gunTipX = this.x + Math.cos(this.angle) * 22;
        const gunTipY = this.y + Math.sin(this.angle) * 22;

        // Small spread for feel
        const spread = (Math.random() - 0.5) * 0.05;
        bullets.push(new Bullet(gunTipX, gunTipY, this.angle + spread, this.bulletSpeed, this.bulletDamage, false));

        this.ammo--;
        this.fireCooldown = this.fireRate;
        this.shotsFired++;

        particles.muzzleFlash(gunTipX, gunTipY);
        audio.playShoot();
    }

    startReload(audio) {
        this.reloading = true;
        this.reloadTimer = this.reloadTime;
        audio.playReload();
    }

    takeDamage(amount, particles, audio) {
        if (this.invincible) return;
        this.hp -= amount;
        this.invincible = true;
        this.invincibleTimer = this.invincibleDuration;
        particles.playerDamage(this.x, this.y);
        audio.playPlayerHit();
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
        }
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Flash when invincible
        if (this.invincible && Math.floor(this.flashTimer * 10) % 2 === 0) {
            ctx.globalAlpha = 0.4;
        }

        // Body bob when moving
        const bobY = this.moving ? Math.sin(this.bobTimer) * 2 : 0;

        // Feet (behind body)
        ctx.fillStyle = '#1a3d0f';
        const footOffset = this.moving ? Math.sin(this.bobTimer) * 4 : 3;
        ctx.beginPath();
        ctx.arc(-5, 10 + footOffset, 5, 0, Math.PI * 2);
        ctx.arc(5, 10 - footOffset, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(this.angle);

        // Gun
        ctx.fillStyle = '#666666';
        ctx.fillRect(8, -3, 16, 6);
        // Gun detail
        ctx.fillStyle = '#555555';
        ctx.fillRect(18, -2, 6, 4);

        // Body
        ctx.fillStyle = '#2d5a1e';
        ctx.beginPath();
        ctx.arc(0, bobY, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1a3d0f';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(8, -4 + bobY, 3, 0, Math.PI * 2);
        ctx.arc(8, 4 + bobY, 3, 0, Math.PI * 2);
        ctx.fill();
        // Pupils
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(9, -4 + bobY, 1.5, 0, Math.PI * 2);
        ctx.arc(9, 4 + bobY, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Reload indicator
        if (this.reloading) {
            const progress = 1 - (this.reloadTimer / this.reloadTime);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y - 25, 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
            ctx.stroke();
        }
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.hp = this.maxHp;
        this.ammo = this.maxAmmo;
        this.alive = true;
        this.invincible = false;
        this.reloading = false;
        this.shotsFired = 0;
        this.shotsHit = 0;
    }
}
