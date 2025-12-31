import { CONSTANTS, WEAPON_TYPES } from '../constants.js';
import { TrailParticle, MissileTrailParticle, Particle } from './Particle.js';
import { Explosion } from './Explosion.js';

export class PlayerMissile {
    constructor(startX, startY, targetX, targetY, type, angleOffset = 0, sourceId = null) {
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
        this.gravity = 0;
        this.acceleration = 0;

        if (type === WEAPON_TYPES.STANDARD) {
            this.speed = 3.5;
            this.color = CONSTANTS.COLOR_FRIENDLY_MISSILE;
        } else if (type === WEAPON_TYPES.HOMING) {
            this.speed = 0.8 * window.homingMissileSpeedMultiplier; // Global config or pass from Game. We'll access game.homingMissileSpeedMultiplier in update or assume global for now, but better to pass in update.
            // Wait, homingMissileSpeedMultiplier is a variable in Game state.
            // I'll set initial speed here, but update logic might need to access Game state.
            this.speed = 0.8; // Base speed, multiplier applied in update if needed or passed in constructor.
            // V2 used a global `homingMissileSpeedMultiplier`. In V3, Game class will hold it.
            this.acceleration = 0.02;
            this.color = CONSTANTS.COLOR_HOMING_MISSILE;
            this.turnSpeed = 0.010;
            this.maxFlightTime = 7000;
        } else if (type === WEAPON_TYPES.MACHINE_GUN) {
            this.speed = 6;
            this.color = CONSTANTS.COLOR_MG;
            this.gravity = 0.015;
        } else if (type === WEAPON_TYPES.CANNON) {
            this.speed = 5;
            this.color = CONSTANTS.COLOR_CANNON;
            this.gravity = 0.02;
        } else if (type === WEAPON_TYPES.NUCLEAR) {
            this.speed = 2.0; // * homingMissileSpeedMultiplier logic from V2 was applied to Weapon 7 which is weird if it's Nuclear, but V2 code says type 7 speed = 2.0 * homingMissileSpeedMultiplier.
            this.color = CONSTANTS.COLOR_NUCLEAR;
        } else if (type === WEAPON_TYPES.BARRAGE) {
            this.speed = 0.6; // * homingMissileSpeedMultiplier
            this.acceleration = 0.008;
            this.color = CONSTANTS.COLOR_BARRAGE;
            this.turnSpeed = 0.015;
            this.maxFlightTime = 15000;
        }

        this.angle = Math.atan2(targetY - this.startY, targetX - this.startX);
        this.angle += angleOffset;

        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
    }

    update(dt, game) {
        const dtNorm = dt * 60;

        // Apply homing speed multiplier
        let currentSpeed = this.speed;
        if (this.type === WEAPON_TYPES.HOMING || this.type === WEAPON_TYPES.BARRAGE || this.type === WEAPON_TYPES.NUCLEAR) {
            currentSpeed *= game.homingMissileSpeedMultiplier;
        }

        if (this.type === WEAPON_TYPES.HOMING || this.type === WEAPON_TYPES.BARRAGE) {
            if (Date.now() - this.creationTime > this.maxFlightTime) {
                this.active = false;
                game.createExplosion(this.x, this.y, this.color, false);
                return;
            }

            if (this.acceleration > 0) {
                this.speed += this.acceleration * dtNorm;
            }

            if (!this.target || !this.target.active) {
                this.target = null;

                const otherHomingMissiles = game.playerMissiles.filter(p => p !== this && p.active && (p.type === 2 || p.type === 8) && p.target);
                const busyTargets = otherHomingMissiles.map(p => p.target);

                let candidates = game.enemyMissiles.filter(e => e.active && !busyTargets.includes(e));
                if (candidates.length === 0) candidates = game.enemyMissiles.filter(e => e.active);

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
                const turnAmount = this.turnSpeed * dtNorm;
                if (Math.abs(angleDiff) < turnAmount) {
                    newAngle = targetAngle;
                } else {
                    newAngle += Math.sign(angleDiff) * turnAmount;
                }
                this.vx = Math.cos(newAngle) * currentSpeed;
                this.vy = Math.sin(newAngle) * currentSpeed;
            } else {
                const currentAngle = Math.atan2(this.vy, this.vx);
                this.vx = Math.cos(currentAngle) * currentSpeed;
                this.vy = Math.sin(currentAngle) * currentSpeed;
            }
        } else {
            // Re-calculate velocity based on current speed (if it changed)
            // For types that don't turn, vx/vy are already set, but if we want to support dynamic speed updates:
            // But non-homing missiles usually have constant velocity unless gravity affects them.
        }

        if (this.gravity !== 0) {
            this.vy += this.gravity * dtNorm;
        }

        if (this.type === WEAPON_TYPES.CANNON) {
            game.particles.push(new TrailParticle(this.x, this.y, this.color));
        } else if (this.type === WEAPON_TYPES.STANDARD) {
            game.particles.push(new MissileTrailParticle(this.x, this.y, this.color));
        }

        this.x += this.vx * dtNorm;
        this.y += this.vy * dtNorm;

        if (this.type === WEAPON_TYPES.STANDARD) {
            const distToTarget = Math.hypot(this.x - this.targetX, this.y - this.targetY);
            // using currentSpeed (effective speed)
            const speed = (this.type === WEAPON_TYPES.HOMING || this.type === 7 || this.type === 8) ? currentSpeed : this.speed;

            if (distToTarget < speed * dtNorm || (this.vy < 0 && this.y <= this.targetY)) {
                this.active = false;
                game.createExplosion(this.targetX, this.targetY, this.color, false, 1.2);
            }
        } else if (this.type === WEAPON_TYPES.NUCLEAR) {
            const distToTarget = Math.hypot(this.x - this.targetX, this.y - this.targetY);
            const speed = currentSpeed;
            if (distToTarget < speed * dtNorm || (this.vy < 0 && this.y <= this.targetY)) {
                this.active = false;
                game.createNuclearExplosion(this.targetX, this.targetY);
            }
        } else {
            if (this.x < 0 || this.x > CONSTANTS.CANVAS_WIDTH || this.y < 0 || this.y > CONSTANTS.CANVAS_HEIGHT) {
                this.active = false;
            }
        }
    }

    draw(ctx) {
        ctx.beginPath();
        if (this.type === WEAPON_TYPES.STANDARD) {
            // Invisible body
        } else {
            ctx.moveTo(this.x - this.vx * 3, this.y - this.vy * 3);
            ctx.lineTo(this.x, this.y);
        }

        ctx.strokeStyle = this.color;
        ctx.lineWidth = (this.type === WEAPON_TYPES.MACHINE_GUN) ? 1 : (this.type === WEAPON_TYPES.CANNON ? 3 : 2);
        ctx.stroke();

        ctx.fillStyle = '#fff';
        const size = this.type === WEAPON_TYPES.MACHINE_GUN ? 2 : 3;
        ctx.fillRect(this.x - size / 2, this.y - size / 2, size, size);
    }
}
