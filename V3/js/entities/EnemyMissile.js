import { CONSTANTS } from '../constants.js';

export class EnemyMissile {
    constructor(game) {
        this.startX = Math.random() * CONSTANTS.CANVAS_WIDTH;
        this.startY = 0;
        this.x = this.startX;
        this.y = this.startY;
        let targetX;

        const activeTargets = [...game.cities.filter(c => c.active), ...game.bases.filter(b => b.active)];

        if (activeTargets.length > 0 && Math.random() > 0.3) {
            const target = activeTargets[Math.floor(Math.random() * activeTargets.length)];
            targetX = target.x;
        } else {
            targetX = Math.random() * CONSTANTS.CANVAS_WIDTH;
        }

        this.targetY = CONSTANTS.CANVAS_HEIGHT;
        this.speed = ((Math.random() * 1.5 + 0.5) * game.difficultyMultiplier) * 0.7;

        const angle = Math.atan2(this.targetY - this.startY, targetX - this.startX);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;

        this.active = true;
        this.color = CONSTANTS.COLOR_ENEMY;
    }

    update(dt, game) {
        const dtNorm = dt * 60;
        this.x += this.vx * dtNorm;
        this.y += this.vy * dtNorm;

        if (this.y >= CONSTANTS.CANVAS_HEIGHT - 20) {
            this.active = false;
            game.createExplosion(this.x, CONSTANTS.CANVAS_HEIGHT - 20, '#ffaa00', true);
            game.checkCityCollision(this.x);
            game.checkBaseCollision(this.x);
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = `rgba(255, 0, 85, 0.5)`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x - 1, this.y - 1, 3, 3);
    }
}
