/* ============================================
   ENEMY MISSILE CLASS
   ============================================ */

import { DIFFICULTY_CONFIG } from '../config/constants.js';

export class EnemyMissile {
    constructor(width, height, cities, bases, difficultyMultiplier) {
        this.startX = Math.random() * width;
        this.startY = 0;
        this.x = this.startX;
        this.y = this.startY;
        let targetX;

        const activeTargets = [...cities.filter(c => c.active), ...bases.filter(b => b.active)];

        if (activeTargets.length > 0 && Math.random() > 0.3) {
            const target = activeTargets[Math.floor(Math.random() * activeTargets.length)];
            targetX = target.x;
        } else {
            targetX = Math.random() * width;
        }

        this.targetY = height;
        this.speed = ((Math.random() * 1.5 + 0.5) * difficultyMultiplier) * DIFFICULTY_CONFIG.enemySpeedMultiplier;

        const angle = Math.atan2(this.targetY - this.startY, targetX - this.startX);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;

        this.active = true;
        this.color = '#ff0055';
    }

    update(height, createExplosionCallback, checkCityCollisionCallback, checkBaseCollisionCallback) {
        this.x += this.vx;
        this.y += this.vy;

        if (this.y >= height - 20) {
            this.active = false;
            createExplosionCallback(this.x, height - 20, '#ffaa00', true);
            checkCityCollisionCallback(this.x);
            checkBaseCollisionCallback(this.x);
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
