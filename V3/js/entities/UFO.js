import { CONSTANTS } from '../constants.js';
import { Laser } from './Laser.js';

export class UFO {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.range = 250;
        this.active = true;
        this.lastShot = 0;
        this.fireRate = 500;
        this.radius = 15;

        this.teleportTimer = Date.now();
        this.teleportInterval = 5000;
    }

    update(game) {
        if (Date.now() - this.teleportTimer > this.teleportInterval) {
            this.teleport(game);
            this.teleportTimer = Date.now();
        }

        if (Date.now() - this.lastShot > this.fireRate) {
            let closest = null;
            let minDist = this.range;

            game.enemyMissiles.forEach(e => {
                if (!e.active) return;
                const dist = Math.hypot(e.x - this.x, e.y - this.y);
                if (dist < minDist) {
                    minDist = dist;
                    closest = e;
                }
            });

            if (closest) {
                game.lasers.push(new Laser(this.x, this.y, closest.x, closest.y, true));
                this.lastShot = Date.now();
            }
        }
    }

    teleport(game) {
        this.x = Math.random() * CONSTANTS.CANVAS_WIDTH;
        this.y = Math.random() * (CONSTANTS.CANVAS_HEIGHT * 0.6);
        game.createExplosion(this.x, this.y, '#00ffaa', false);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.fillStyle = '#00ffaa';
        ctx.beginPath();
        ctx.ellipse(0, 0, 20, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(200, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(0, -3, 8, Math.PI, 0);
        ctx.fill();

        if (Math.floor(Date.now() / 200) % 2 === 0) {
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(-10, 0, 2, 0, Math.PI * 2);
            ctx.arc(10, 0, 2, 0, Math.PI * 2);
            ctx.arc(0, 4, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
