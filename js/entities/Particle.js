/* ============================================
   PARTICLE CLASSES
   ============================================ */

export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1;
        this.decay = Math.random() * 0.03 + 0.01;
        this.color = color;
        this.active = true;
        this.gravity = 0.08;
        this.size = 3;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.life -= this.decay;
        if (this.life <= 0) this.active = false;
    }

    draw(ctx) {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1.0;
    }
}

export class FireParticle extends Particle {
    constructor(x, y) {
        super(x, y, `rgb(${255}, ${Math.floor(Math.random() * 150 + 100)}, 0)`);
        this.vy = Math.random() * -3 - 1;
        this.vx /= 2;
        this.gravity = -0.05;
        this.decay = 0.04;
        this.size = Math.random() * 4 + 2;
    }

    update() {
        super.update();
        this.size = Math.max(0.5, this.size - 0.1);
    }
}

export class SmokeParticle extends Particle {
    constructor(x, y) {
        const gray = Math.floor(Math.random() * 50 + 50);
        super(x, y, `rgb(${gray}, ${gray}, ${gray})`);
        this.vy /= 5;
        this.gravity = 0;
        this.decay = 0.01;
        this.size = Math.random() * 5 + 3;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.99;
        this.vy *= 0.99;
        this.size += 0.1;
        this.life -= this.decay;
        if (this.life <= 0) this.active = false;
    }

    draw(ctx) {
        ctx.globalAlpha = Math.max(0, this.life * 0.5);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}
