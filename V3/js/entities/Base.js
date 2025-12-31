import { CONSTANTS, WEAPON_TYPES } from '../constants.js';
import { PlayerMissile } from './PlayerMissile.js';
import { Laser } from './Laser.js';

export class DefenseBase {
    constructor(x, id) {
        this.x = x;
        this.y = CONSTANTS.CANVAS_HEIGHT - 10;
        this.radius = 20;
        this.active = true;
        this.color = CONSTANTS.COLOR_BASE;
        this.id = id;

        this.hits = 0;
        this.maxHits = 5;
        this.cooldownTimer = 0;

        // Weapon states for this specific base
        this.mgAmmo = CONSTANTS.MG_MAX_AMMO;
        this.mgOverheated = false;
        this.cannonLastShot = 0;
        this.laserLastShot = 0;
        this.lastShotTime = 0;
    }

    update(dt) {
        if (this.cooldownTimer > 0) {
            this.cooldownTimer -= dt * 1000; // dt is in seconds, convert to ms
            if (this.cooldownTimer <= 0) {
                this.active = true;
                this.cooldownTimer = 0;
            }
        }
    }

    takeDamage(game) {
        if (this.hits >= this.maxHits) return;

        this.hits++;
        if (this.hits >= this.maxHits) {
            this.active = false;
            game.createExplosion(this.x, this.y, '#ff0000', true);
        } else {
            this.active = false;
            this.cooldownTimer = 2000;
        }
    }

    draw(ctx) {
        if (this.hits >= this.maxHits) return;

        if (this.cooldownTimer > 0) {
            if (Math.floor(Date.now() / 100) % 2 === 0) {
                ctx.fillStyle = '#555';
            } else {
                ctx.fillStyle = '#ff5500';
            }
        } else {
            ctx.fillStyle = this.active ? this.color : '#555';
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, Math.PI, 0);
        ctx.fill();
    }

    startMgCooldown() {
        this.mgOverheated = true;
        // The UI update needs to happen. We can dispatch an event or let Game loop handle UI.
        // For V3, the Game loop will poll base status for UI.
        setTimeout(() => {
            this.mgAmmo = CONSTANTS.MG_MAX_AMMO;
            this.mgOverheated = false;
            // UI update will happen on next frame
        }, 2000);
    }

    fireMissile(targetX, targetY, type, game) {
        if (targetY > CONSTANTS.CANVAS_HEIGHT - 50) targetY = CONSTANTS.CANVAS_HEIGHT - 50;

        if (type === WEAPON_TYPES.MACHINE_GUN) {
            targetX += (Math.random() * 40 - 20);
            targetY += (Math.random() * 40 - 20);
        }

        game.playerMissiles.push(new PlayerMissile(this.x, this.y, targetX, targetY, type, 0, this.id));
    }

    fireCannonSpread(targetX, targetY, game) {
        if (targetY > CONSTANTS.CANVAS_HEIGHT - 50) targetY = CONSTANTS.CANVAS_HEIGHT - 50;
        const spreadAngles = [-0.2, -0.1, 0, 0.1, 0.2];
        spreadAngles.forEach(angleOffset => {
            game.playerMissiles.push(new PlayerMissile(this.x, this.y, targetX, targetY, WEAPON_TYPES.CANNON, angleOffset, this.id));
        });
    }

    fireLaser(targetX, targetY, game) {
        game.lasers.push(new Laser(this.x, this.y, targetX, targetY));
    }
}
