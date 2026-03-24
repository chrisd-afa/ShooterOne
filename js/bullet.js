// Bullet class for player and enemy projectiles
class Bullet {
    constructor(x, y, angle, speed, damage, isEnemy) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.speed = speed;
        this.damage = damage;
        this.isEnemy = isEnemy;
        this.radius = isEnemy ? 4 : 3;
        this.alive = true;
        this.prevX = x;
        this.prevY = y;
    }

    update(dt, canvasWidth, canvasHeight) {
        this.prevX = this.x;
        this.prevY = this.y;
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Remove if off screen
        const margin = 50;
        if (this.x < -margin || this.x > canvasWidth + margin ||
            this.y < -margin || this.y > canvasHeight + margin) {
            this.alive = false;
        }
    }

    draw(ctx) {
        if (this.isEnemy) {
            // Red-orange enemy bullet
            ctx.fillStyle = '#ff6633';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Yellow player bullet with trail
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.moveTo(this.prevX, this.prevY);
            ctx.lineTo(this.x, this.y);
            ctx.stroke();
            ctx.globalAlpha = 1;

            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
