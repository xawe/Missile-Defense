import { CONSTANTS, WEAPON_TYPES } from '../constants.js';
import { MathUtils } from '../utils/MathUtils.js';
import { InputHandler } from './InputHandler.js';
import { AudioSystem } from './AudioSystem.js';
import { City } from '../entities/City.js';
import { DefenseBase } from '../entities/Base.js';
import { EnemyMissile } from '../entities/EnemyMissile.js';
import { PlayerMissile } from '../entities/PlayerMissile.js';
import { Explosion } from '../entities/Explosion.js';
import { Particle, FireParticle, SmokeParticle, TrailParticle } from '../entities/Particle.js';
import { FloatingText } from '../entities/FloatingText.js';
import { Laser } from '../entities/Laser.js';
import { UFO } from '../entities/UFO.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.input = new InputHandler();
        this.audio = new AudioSystem();

        // Game State
        this.score = 0;
        this.gameOver = false;
        this.frameCount = 0;
        this.difficultyMultiplier = 1;
        this.homingMissileSpeedMultiplier = 1; // V2 logic
        this.isPaused = false;
        this.isAutoFire = false;

        // Delta Time
        this.lastTime = performance.now();
        this.enemySpawnTimer = 0;

        // Weapon Control
        this.selectedWeapon = WEAPON_TYPES.STANDARD;
        this.lastAutoClickTime = 0;
        this.nuclearCooldownEndTime = 0;
        this.missileBarrageCooldownEndTime = 0;

        // Entities
        this.cities = [];
        this.bases = [];
        this.enemyMissiles = [];
        this.playerMissiles = [];
        this.explosions = [];
        this.particles = [];
        this.lasers = [];
        this.ufos = [];
        this.floatingTexts = [];

        // Combo System
        this.comboCount = 0;
        this.comboTimer = 0;
        this.comboActive = false;

        this.init();

        // Event Listeners for UI interaction affecting Game State
        this.setupUIListeners();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.initCities();
        this.initBases();
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        // Re-position entities if needed, V2 re-inits cities/bases on resize but maintains state if they exist... 
        // V2 code: if (cities.length > 0) initCities();
        // This resets health/status which might be annoying on mobile rotate.
        // I will follow V2 behavior for now.
        if (this.cities.length > 0) this.initCities();
        if (this.bases.length > 0) this.initBases();
    }

    initCities() {
        this.cities = [];
        const spacing = this.width / 7;
        for (let i = 1; i <= 6; i++) {
            this.cities.push(new City(spacing * i));
        }
    }

    initBases() {
        this.bases = [];
        this.bases.push(new DefenseBase(50, 0));
        this.bases.push(new DefenseBase(this.width / 2, 1));
        this.bases.push(new DefenseBase(this.width - 50, 2));
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseIndicator = document.getElementById('pause-indicator'); // Assuming this element might exist based on V2 code
        if (pauseIndicator) {
            pauseIndicator.style.display = this.isPaused ? 'block' : 'none';
        }
    }

    toggleAutoFire() {
        this.isAutoFire = !this.isAutoFire;
        // UI update should ideally be handled by main or UI class, but simplified here
    }

    resetGame() {
        this.score = 0;
        this.difficultyMultiplier = 1;
        this.frameCount = 0;
        this.enemyMissiles = [];
        this.playerMissiles = [];
        this.explosions = [];
        this.particles = [];
        this.lasers = [];
        this.ufos = [];
        this.floatingTexts = [];
        this.homingMissileSpeedMultiplier = 1;

        this.comboCount = 0;
        this.comboTimer = 0;
        this.comboActive = false;

        this.nuclearCooldownEndTime = 0;
        this.missileBarrageCooldownEndTime = 0;

        this.lastTime = performance.now();
        this.enemySpawnTimer = 0;

        this.initBases();
        this.initCities();
        this.gameOver = false;
    }

    setupUIListeners() {
        // Weapon selection via keys handled by InputHandler, but we need to react to it.
        // Actually InputHandler just tracks state. We need a listener for 'keydown' to switch weapons immediately.
        window.addEventListener('keydown', e => {
            if (['1', '2', '3', '4', '5', '6', '7', '8'].includes(e.key)) {
                this.setWeapon(parseInt(e.key));
            }
            if (e.key.toLowerCase() === 'p') this.togglePause();
            if (e.key.toLowerCase() === 'a') this.toggleAutoFire();
        });

        // Mouse click for fire (handled in loop, but click event explicitly could be used too. V2 uses mousedown state + loop).
        // V2 also had mousedown event listener for game over reset.
        window.addEventListener('mousedown', () => {
            if (this.gameOver) this.resetGame();
        });
    }

    setWeapon(type) {
        this.selectedWeapon = type;
        document.querySelectorAll('.weapon').forEach(el => el.classList.remove('active'));
        const el = document.getElementById('w' + type);
        if (el) el.classList.add('active');

        const mgStatus = document.getElementById('mg-status');
        const statusText = document.getElementById('status-text');

        if (type === WEAPON_TYPES.MACHINE_GUN) {
            if (mgStatus) mgStatus.style.display = 'block';
            const activeBase = this.bases.find(b => b.active);
            if (activeBase) this.updateMgUI(activeBase);
        } else {
            if (mgStatus) mgStatus.style.display = 'none';
            if (statusText) statusText.innerText = "";
        }

        if (statusText) {
            if (type === 2) statusText.innerText = "Max: 4/Base | +Velocidade/Hit | Alvos Inteligentes";
            else if (type === 4) statusText.innerText = "Cooldown: 1 segundo";
            else if (type === 5) statusText.innerText = "Cooldown: 3 segundos | Instakill";
            else if (type === 1) statusText.innerText = "Velocidade: Standard (Reduzida)";
            else if (type === 6) statusText.innerText = "Drone Teleportador | Max: 3 | Kamikaze Explosivo";
            else if (type === 7) statusText.innerText = "Missel Nuclear | Max: 1 | Raio: 400 | Explosão 360° | Cooldown: 30s";
            else if (type === 8) statusText.innerText = "Rajada Teleguiada: 10 misseis/base | 30 total | Cooldown: 60s";
        }
    }

    updateMgUI(base) {
        if (this.selectedWeapon !== WEAPON_TYPES.MACHINE_GUN) return;
        if (!base || !base.active) return;

        const bar = document.getElementById('mg-bar');
        const text = document.getElementById('status-text');
        const container = document.getElementById('mg-status');

        if (!bar || !text || !container) return;

        const pct = (base.mgAmmo / CONSTANTS.MG_MAX_AMMO) * 100;
        bar.style.width = pct + '%';

        if (base.mgOverheated) {
            container.classList.add('reloading');
            text.innerText = "SOBREAQUECIMENTO - A ARREFECER...";
            text.style.color = '#f00';
        } else {
            container.classList.remove('reloading');
            text.innerText = `MUNIÇÃO: ${base.mgAmmo}/${CONSTANTS.MG_MAX_AMMO}`;
            text.style.color = '#aaa';
        }
    }

    updateScore() {
        const scoreEl = document.getElementById('score-display');
        if (scoreEl) scoreEl.innerText = `PONTUAÇÃO: ${this.score}`;
    }

    attemptFire(x, y) {
        const now = Date.now();
        let closestBase = null;
        let minDist = Infinity;

        this.bases.forEach(base => {
            if (base.active) {
                const dist = Math.abs(x - base.x);
                if (dist < minDist) {
                    minDist = dist;
                    closestBase = base;
                }
            }
        });

        if (!closestBase) return;

        if (this.selectedWeapon === WEAPON_TYPES.HOMING) {
            const activeHomingFromBase = this.playerMissiles.filter(p => p.active && p.type === WEAPON_TYPES.HOMING && p.sourceId === closestBase.id).length;
            if (activeHomingFromBase >= 4) return;
            this.audio.playMissileSound('homing');
            closestBase.fireMissile(x, y, WEAPON_TYPES.HOMING, this);
        }
        else if (this.selectedWeapon === WEAPON_TYPES.MACHINE_GUN) {
            if (closestBase.mgOverheated) return;
            if (now - closestBase.lastShotTime > 100) {
                if (closestBase.mgAmmo > 0) {
                    closestBase.mgAmmo--;
                    this.audio.playMissileSound('machineGun');
                    closestBase.fireMissile(x, y, WEAPON_TYPES.MACHINE_GUN, this);
                    closestBase.lastShotTime = now;
                    this.updateMgUI(closestBase);
                }
                if (closestBase.mgAmmo <= 0 && !closestBase.mgOverheated) {
                    closestBase.startMgCooldown();
                }
            }
        }
        else if (this.selectedWeapon === WEAPON_TYPES.CANNON) {
            if (now - closestBase.cannonLastShot > CONSTANTS.CANNON_COOLDOWN) {
                this.audio.playMissileSound('cannon');
                closestBase.fireCannonSpread(x, y, this);
                closestBase.cannonLastShot = now;
            }
        }
        else if (this.selectedWeapon === WEAPON_TYPES.LASER) {
            if (now - closestBase.laserLastShot > CONSTANTS.LASER_COOLDOWN) {
                this.audio.playMissileSound('laser');
                closestBase.fireLaser(x, y, this);
                closestBase.laserLastShot = now;
            }
        }
        else if (this.selectedWeapon === WEAPON_TYPES.UFO) {
            if (this.ufos.length < 3) {
                this.ufos.push(new UFO(closestBase.x, closestBase.y - 30));
            }
        }
        else if (this.selectedWeapon === WEAPON_TYPES.NUCLEAR) {
            const activeNuclear = this.playerMissiles.some(p => p.active && p.type === WEAPON_TYPES.NUCLEAR);
            if (!activeNuclear && now > this.nuclearCooldownEndTime) {
                this.audio.playMissileSound('standard');
                closestBase.fireMissile(x, y, WEAPON_TYPES.NUCLEAR, this);
            }
        }
        else if (this.selectedWeapon === WEAPON_TYPES.BARRAGE) {
            if (now > this.missileBarrageCooldownEndTime) {
                this.bases.forEach(base => {
                    if (base.active) {
                        for (let i = 0; i < 10; i++) {
                            setTimeout(() => {
                                if (base.active && !this.gameOver) { // Check game over too
                                    base.fireMissile(x, y, WEAPON_TYPES.BARRAGE, this);
                                    this.audio.playMissileSound('homing');
                                }
                            }, i * 200);
                        }
                    }
                });
                this.missileBarrageCooldownEndTime = now + CONSTANTS.MISSILE_BARRAGE_COOLDOWN;
            }
        }
        else {
            // Standard
            const activeStandardMs = this.playerMissiles.filter(p =>
                p.active &&
                p.type === WEAPON_TYPES.STANDARD &&
                p.sourceId === closestBase.id
            ).length;

            if (activeStandardMs < 7) {
                this.audio.playMissileSound('standard');
                closestBase.fireMissile(x, y, WEAPON_TYPES.STANDARD, this);
            }
        }
    }

    createExplosion(x, y, color, isGroundImpact = false, radiusMultiplier = 1.0) {
        const baseRadius = isGroundImpact ? 80 : 70;
        const finalRadius = baseRadius * radiusMultiplier;

        // Shockwave
        this.particles.forEach(p => {
            if (!p.active) return;
            const dist = Math.hypot(p.x - x, p.y - y);
            const effectRadius = (isGroundImpact ? 150 : 100) * radiusMultiplier;

            if (dist < effectRadius) {
                const angle = Math.atan2(p.y - y, p.x - x);
                const force = (effectRadius - dist) / 15;
                p.vx += Math.cos(angle) * force;
                p.vy += Math.sin(angle) * force;
            }
        });

        this.audio.playExplosionSound();
        this.explosions.push(new Explosion(x, y, color, finalRadius));

        for (let i = 0; i < 50; i++) this.particles.push(new Particle(x, y, color));
        for (let i = 0; i < 30; i++) this.particles.push(new FireParticle(x, y));
        for (let i = 0; i < 20; i++) this.particles.push(new SmokeParticle(x, y));
    }

    createNuclearExplosion(x, y) {
        this.audio.playExplosionSound();
        this.nuclearCooldownEndTime = Date.now() + CONSTANTS.NUCLEAR_COOLDOWN;

        const radius = 400;
        this.explosions.push(new Explosion(x, y, CONSTANTS.COLOR_NUCLEAR, radius));

        for (let i = 0; i < 4000; i++) {
            const angle = (Math.PI * 2 * i) / 4000;
            const speed = Math.random() * 8 + 2;
            const p = new Particle(x, y, `hsl(${Math.random() * 360}, 100%, 50%)`);
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
            p.life = 2.5;
            this.particles.push(p);
        }

        for (let i = 0; i < 1000; i++) this.particles.push(new FireParticle(x, y));
        for (let i = 0; i < 200; i++) this.particles.push(new SmokeParticle(x, y));
    }

    checkCollisions() {
        this.explosions.forEach(exp => {
            if (!exp.active) return;
            let hitsThisExplosion = 0;

            this.enemyMissiles.forEach(enemy => {
                if (!enemy.active) return;
                const dist = Math.hypot(enemy.x - exp.x, enemy.y - exp.y);
                if (dist < exp.radius) {
                    enemy.active = false;
                    hitsThisExplosion++;
                    this.createExplosion(enemy.x, enemy.y, '#ffaa00', false);
                }
            });

            if (hitsThisExplosion > 0) {
                this.comboCount++;
                this.comboTimer = Date.now() + 2000;
                this.comboActive = true;
                if (hitsThisExplosion >= 2) {
                    this.score += 100 * 2 * hitsThisExplosion;
                } else {
                    this.score += 100;
                }
            }
        });

        this.playerMissiles.forEach(pm => {
            if (!pm.active || pm.type === WEAPON_TYPES.STANDARD) return;
            // Standard missiles explode on arrival, not contact (game design choice in V2 usually, except they do collide?)
            // V2 checkCollisions only checked non-standard types for direct impact?
            // V2: playerMissiles.forEach(pm => { if (!pm.active || pm.type === 1) return; ... })
            // Yes, Weapon 1 (STANDARD) relies on area explosion at target, not direct hit.

            this.enemyMissiles.forEach(enemy => {
                if (!enemy.active) return;
                const dist = Math.hypot(pm.x - enemy.x, pm.y - enemy.y);
                const hitRadius = (pm.type === WEAPON_TYPES.CANNON) ? 25 : 15;

                if (dist < hitRadius) {
                    enemy.active = false;
                    pm.active = false;

                    this.comboCount++;
                    this.comboTimer = Date.now() + 2000;
                    this.comboActive = true;
                    this.score += 150;

                    this.createExplosion(enemy.x, enemy.y, '#ffaa00', false);

                    if (pm.type === WEAPON_TYPES.HOMING) {
                        this.homingMissileSpeedMultiplier += 0.001;
                    }
                }
            });
        });

        this.lasers.forEach(laser => {
            if (!laser.active) return;
            this.enemyMissiles.forEach(enemy => {
                if (!enemy.active) return;
                const dist = MathUtils.distToSegment(
                    { x: enemy.x, y: enemy.y },
                    { x: laser.startX, y: laser.startY },
                    { x: laser.endX, y: laser.endY }
                );
                if (dist < 10) {
                    enemy.active = false;
                    this.comboCount++;
                    this.comboTimer = Date.now() + 2000;
                    this.comboActive = true;
                    this.score += 200;
                    this.createExplosion(enemy.x, enemy.y, '#ff00ff', false);
                }
            });
        });

        this.ufos.forEach(ufo => {
            if (!ufo.active) return;
            this.enemyMissiles.forEach(enemy => {
                if (!enemy.active) return;
                const dist = Math.hypot(ufo.x - enemy.x, ufo.y - enemy.y);
                if (dist < ufo.radius + 5) {
                    ufo.active = false;
                    enemy.active = false;

                    const blastRadius = this.width * 0.20;
                    this.createExplosion(ufo.x, ufo.y, '#00ffaa', false);

                    this.enemyMissiles.forEach(e => {
                        if (e.active && Math.hypot(e.x - ufo.x, e.y - ufo.y) < blastRadius) {
                            e.active = false;
                            this.createExplosion(e.x, e.y, '#ffaa00', false);
                            this.comboCount++;
                            this.comboTimer = Date.now() + 2000;
                            this.comboActive = true;
                            this.score += 50;
                        }
                    });
                    this.explosions.push(new Explosion(ufo.x, ufo.y, '#ffffff', blastRadius));
                }
            });
        });
    }

    checkBaseCollision(impactX) {
        this.bases.forEach(base => {
            if (base.active && Math.abs(impactX - base.x) < base.radius) {
                base.takeDamage(this);
            }
        });
    }

    checkCityCollision(impactX) {
        this.cities.forEach(city => {
            if (city.active && Math.abs(impactX - city.x) < 30) {
                city.active = false;
                for (let k = 0; k < 5; k++) {
                    setTimeout(() => {
                        this.createExplosion(city.x + (Math.random() * 20 - 10), city.y - (Math.random() * 10), '#ff0000', true);
                    }, k * 100);
                }
            }
        });
    }

    // Main Loop
    loop(currentTime) {
        if (this.gameOver) return;

        if (this.isPaused) {
            this.lastTime = currentTime;
            requestAnimationFrame(this.loop);
            return;
        }

        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        const dt = Math.min(deltaTime, 0.1);

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const activeBase = this.bases.find(b => b.active);
        if (activeBase) {
            this.updateMgUI(activeBase);
        }

        // Combo
        if (this.comboActive && Date.now() > this.comboTimer) {
            if (this.comboCount > 1) {
                this.floatingTexts.push(new FloatingText(this.width / 2, this.height / 2, `COMBO ${this.comboCount} X`, '#ffff00'));
            }
            this.comboCount = 0;
            this.comboActive = false;
        }

        // Input / AutoFire
        if (this.input.isMouseDown || this.input.isSpaceDown || this.isAutoFire) {
            if (this.selectedWeapon === WEAPON_TYPES.MACHINE_GUN) {
                this.attemptFire(this.input.mouse.x, this.input.mouse.y);
            } else {
                const rate = (this.selectedWeapon === WEAPON_TYPES.STANDARD) ? CONSTANTS.STANDARD_MISSILE_RATE : CONSTANTS.AUTO_CLICK_RATE;
                if (Date.now() - this.lastAutoClickTime > rate) {
                    this.attemptFire(this.input.mouse.x, this.input.mouse.y);
                    this.lastAutoClickTime = Date.now();
                }
            }
        }

        // Check Game Over
        if (this.cities.every(c => !c.active) && this.bases.every(b => b.hits >= b.maxHits)) {
            this.gameOver = true;
            this.ctx.fillStyle = 'white';
            this.ctx.font = '40px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText("FIM DE JOGO", this.width / 2, this.height / 2);
            this.ctx.font = '20px Courier New';
            this.ctx.fillText("Clique para Reiniciar", this.width / 2, this.height / 2 + 40);
            return; // Loop stops
        }

        // Spawn Enemies
        this.enemySpawnTimer += dt;
        const spawnRate = Math.max(CONSTANTS.ENEMY_SPAWN_BASE_RATE, 1.67 - (this.score / 3000));
        if (this.enemySpawnTimer >= spawnRate) {
            this.enemyMissiles.push(new EnemyMissile(this));
            this.difficultyMultiplier = Math.min(1.3, 1 + (this.score / 5000));
            this.enemySpawnTimer = 0;
        }

        // Updates and Draws
        [this.particles, this.explosions, this.lasers, this.enemyMissiles, this.playerMissiles, this.ufos, this.floatingTexts].forEach(list => {
            for (let i = list.length - 1; i >= 0; i--) {
                const entity = list[i];
                if (entity.update) entity.update(dt, this);
                if (entity.draw) entity.draw(this.ctx);
                if (!entity.active) list.splice(i, 1);
            }
        });

        this.cities.forEach(city => city.draw(this.ctx));
        this.bases.forEach(base => {
            base.update(dt);
            base.draw(this.ctx);
        });

        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, this.height - 20, this.width, 20);

        this.checkCollisions();
        this.updateScore();
        this.frameCount++;
        requestAnimationFrame(this.loop);
    }
}
