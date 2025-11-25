/* ============================================
   DEFENSE BASE CLASS
   ============================================ */

import { WEAPON_CONFIG, GAME_CONFIG } from '../config/constants.js';
import { PlayerMissile } from './PlayerMissile.js';
import { LaserBeam } from './LaserBeam.js';

export class DefenseBase {
    constructor(x, height, id) {
        this.x = x;
        this.y = height - 10;
        this.radius = 20;
        this.active = true;
        this.color = '#0088ff';
        this.id = id;

        this.hits = 0;
        this.maxHits = GAME_CONFIG.baseMaxHits;
        this.cooldownTimer = 0;

        // Weapon states for this specific base
        this.mgAmmo = WEAPON_CONFIG.mgMaxAmmo;
        this.mgOverheated = false;
        this.cannonLastShot = 0;
        this.laserLastShot = 0;
        this.lastShotTime = 0;
    }

    update() {
        if (this.cooldownTimer > 0) {
            this.cooldownTimer -= 16.67;
            if (this.cooldownTimer <= 0) {
                this.active = true;
                this.cooldownTimer = 0;
            }
        }
    }

    takeDamage(createExplosionCallback) {
        if (this.hits >= this.maxHits) return;

        this.hits++;
        if (this.hits >= this.maxHits) {
            this.active = false;
            createExplosionCallback(this.x, this.y, '#ff0000', true);
        } else {
            this.active = false;
            this.cooldownTimer = GAME_CONFIG.baseCooldownTime;
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

    startMgCooldown(updateMgUICallback) {
        this.mgOverheated = true;
        updateMgUICallback(this);
        setTimeout(() => {
            this.mgAmmo = WEAPON_CONFIG.mgMaxAmmo;
            this.mgOverheated = false;
            updateMgUICallback(this);
        }, 2000);
    }

    fireMissile(targetX, targetY, type, height, playerMissiles) {
        if (targetY > height - 50) targetY = height - 50;

        if (type === 3) {
            targetX += (Math.random() * 40 - 20);
            targetY += (Math.random() * 40 - 20);
        }

        playerMissiles.push(new PlayerMissile(this.x, this.y, targetX, targetY, type, 0, this.id));
    }

    fireCannonSpread(targetX, targetY, height, playerMissiles) {
        if (targetY > height - 50) targetY = height - 50;
        const spreadAngles = [-0.2, -0.1, 0, 0.1, 0.2];
        spreadAngles.forEach(angleOffset => {
            playerMissiles.push(new PlayerMissile(this.x, this.y, targetX, targetY, 4, angleOffset, this.id));
        });
    }

    fireLaser(targetX, targetY, width, height, lasers) {
        lasers.push(new LaserBeam(this.x, this.y, targetX, targetY, width, height));
    }
}
