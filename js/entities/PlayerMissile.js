/* ============================================
   PLAYER MISSILE CLASS
   ============================================ */

export class PlayerMissile {
    constructor(startX, startY, targetX, targetY, type, angleOffset = 0, sourceId = null, homingMissileSpeedMultiplier = 1) {
        this.startX = startX;
        this.startY = startY;
        this.x = this.startX;
        this.y = this.startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.type = type;
        this.active = true;
        this.sourceId = sourceId;

        this.creationTime = Date.now();
        this.target = null;

        if (type === 1) {
            this.speed = 5.25; // Reduced by 30% (was 7.5)
            this.color = '#00ffff';
        } else if (type === 2) {
            this.speed = 3.92 * homingMissileSpeedMultiplier;
            this.color = '#00ff00';
            this.turnSpeed = 0.016;
            this.maxFlightTime = 7000;
        } else if (type === 3) {
            this.speed = 6;
            this.color = '#ffff00';
        } else if (type === 4) {
            this.speed = 5;
            this.color = '#ff8800';
        }

        let angle = Math.atan2(targetY - this.startY, targetX - this.startX);
        angle += angleOffset;

        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
    }

    update(width, height, enemyMissiles, playerMissiles, createExplosionCallback) {
        if (this.type === 2) {
            if (Date.now() - this.creationTime > this.maxFlightTime) {
                this.active = false;
                createExplosionCallback(this.x, this.y, this.color, false);
                return;
            }

            if (!this.target || !this.target.active) {
                this.target = null;

                const otherHomingMissiles = playerMissiles.filter(p => p !== this && p.active && p.type === 2 && p.target);
                const busyTargets = otherHomingMissiles.map(p => p.target);

                let candidates = enemyMissiles.filter(e => e.active && !busyTargets.includes(e));
                if (candidates.length === 0) candidates = enemyMissiles.filter(e => e.active);

                let closestDist = Infinity;
                candidates.forEach(enemy => {
                    const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                    if (dist < closestDist) {
                        closestDist = dist;
                        this.target = enemy;
                    }
                });
            }

            if (this.target) {
                const targetAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
                const currentAngle = Math.atan2(this.vy, this.vx);
                let angleDiff = targetAngle - currentAngle;
                while (angleDiff <= -Math.PI) angleDiff += Math.PI * 2;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

                let newAngle = currentAngle;
                if (Math.abs(angleDiff) < this.turnSpeed) {
                    newAngle = targetAngle;
                } else {
                    newAngle += Math.sign(angleDiff) * this.turnSpeed;
                }
                this.vx = Math.cos(newAngle) * this.speed;
                this.vy = Math.sin(newAngle) * this.speed;
            }
        }

        this.x += this.vx;
        this.y += this.vy;

        if (this.type === 1) {
            const distToTarget = Math.hypot(this.x - this.targetX, this.y - this.targetY);
            if (distToTarget < this.speed || (this.vy < 0 && this.y <= this.targetY)) {
                this.active = false;
                createExplosionCallback(this.targetX, this.targetY, this.color, false);
            }
        } else {
            if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
                this.active = false;
            }
        }
    }

    draw(ctx) {
        ctx.beginPath();
        if (this.type === 1 || this.type === 4) {
            ctx.moveTo(this.startX, this.startY);
            ctx.lineTo(this.x, this.y);
        } else {
            ctx.moveTo(this.x - this.vx * 3, this.y - this.vy * 3);
            ctx.lineTo(this.x, this.y);
        }

        ctx.strokeStyle = this.color;
        ctx.lineWidth = (this.type === 3) ? 1 : (this.type === 4 ? 3 : 2);
        ctx.stroke();

        ctx.fillStyle = '#fff';
        const size = this.type === 3 ? 2 : 3;
        ctx.fillRect(this.x - size / 2, this.y - size / 2, size, size);
    }
}
