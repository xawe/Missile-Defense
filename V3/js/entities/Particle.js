import { CONSTANTS } from '../constants.js';

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

    update(dt) {
        const dtNorm = dt * 60; // Normalize to 60 FPS
        this.x += this.vx * dtNorm;
        this.y += this.vy * dtNorm;
        this.vy += this.gravity * dtNorm;
        const friction = Math.pow(0.95, dtNorm);
        this.vx *= friction;
        this.vy *= friction;
        this.life -= this.decay * dtNorm;
        if (this.life <= 0) this.active = false;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.restore();
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

    update(dt) {
        super.update(dt);
        const dtNorm = dt * 60;
        this.size = Math.max(0.5, this.size - (0.1 * dtNorm));
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

    update(dt) {
        const dtNorm = dt * 60;
        this.x += this.vx * dtNorm;
        this.y += this.vy * dtNorm;
        const friction = Math.pow(0.99, dtNorm);
        this.vx *= friction;
        this.vy *= friction;
        this.size += 0.1 * dtNorm;
        this.life -= this.decay * dtNorm;
        if (this.life <= 0) this.active = false;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life * 0.5);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

export class TrailParticle extends Particle {
    constructor(x, y, color) {
        super(x, y, color);
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = (Math.random() - 0.5) * 1;
        this.gravity = 0.02;
        this.decay = 0.016;
        this.size = Math.random() * 2 + 1;
    }
}

export class MissileTrailParticle extends Particle {
    constructor(x, y, color) {
        super(x, y, color);
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.gravity = 0.02;
        this.decay = 0.016;
        this.life = 1.3;
        this.size = Math.random() * 3 + 1;
    }
}
