export class Explosion {
    constructor(x, y, color, maxRadius = 70) {
        this.x = x;
        this.y = y;
        this.radius = 1;
        this.maxRadius = maxRadius;
        this.growthRate = 2;
        this.life = 1;
        this.decay = 0.04;
        this.color = color || '#ffffff';
        this.active = true;
    }

    update(dt) {
        const dtNorm = dt * 60;
        if (this.radius < this.maxRadius) {
            this.radius += this.growthRate * dtNorm;
        } else {
            this.life -= this.decay * dtNorm;
        }
        if (this.life <= 0) this.active = false;
    }

    draw(ctx) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.life * 0.3})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = this.life;
        ctx.fill();
        ctx.restore();
    }
}
