/* ============================================
   MISSILE DEFENSE - GAME LOGIC
   ============================================ */

// ==================== CANVAS SETUP ====================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let width, height;

// ==================== GAME STATE ====================
let score = 0;
let gameOver = false;
let frameCount = 0;
let difficultyMultiplier = 1;
let homingMissileSpeedMultiplier = 1;

// ==================== WEAPON CONTROL ====================
let selectedWeapon = 1;
let isMouseDown = false;
let isSpaceDown = false;
let lastAutoClickTime = 0;

// ==================== FIRE RATE CONSTANTS ====================
const autoClickRate = 480; // ms - base rate for most weapons
const standardMissileRate = Math.round(autoClickRate * 1.3); // 234ms - 30% slower for weapon 1

// ==================== WEAPON CONFIGURATIONS ====================
const mgMaxAmmo = 20;
const cannonCooldown = 1000;
const laserCooldown = 3000;
let nuclearCooldownEndTime = 0;
let missileBarrageCooldownEndTime = 0;

// ==================== GAME ENTITIES ====================
let cities = [];
let bases = [];
let enemyMissiles = [];
let playerMissiles = [];
let explosions = [];
let particles = [];
let lasers = [];
let ufos = [];
let floatingTexts = [];

// ==================== COMBO SYSTEM ====================
let comboCount = 0;
let comboTimer = 0;
let comboActive = false;

const mouse = { x: 0, y: 0 };

// ==================== SOUND SYSTEM ====================
let sfxVolume = 1.0;
let musicVolume = 0.5;
let isMuted = false;

const explosionSounds = [];
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Create realistic explosion sounds using white noise + filters + sub-bass
function createRealisticExplosion(index) {
    return function () {
        if (isMuted) return;

        const ctx = audioContext;
        const now = ctx.currentTime;
        const masterGain = ctx.createGain();
        masterGain.gain.value = sfxVolume;
        masterGain.connect(ctx.destination);

        // 1. White noise (impact)
        const bufferSize = ctx.sampleRate * 0.5;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        // 2. Low-pass filter (muffled sound)
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800 - (index * 50), now);
        filter.Q.setValueAtTime(1, now);

        // 3. Noise envelope
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.8, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        // 4. Sub-bass (deep impact)
        const bass = ctx.createOscillator();
        bass.type = 'sine';
        bass.frequency.setValueAtTime(60 - (index * 3), now);
        bass.frequency.exponentialRampToValueAtTime(20, now + 0.4);

        const bassGain = ctx.createGain();
        bassGain.gain.setValueAtTime(0.6, now);
        bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        // 5. Delay for reverb simulation
        const delay = ctx.createDelay();
        delay.delayTime.value = 0.05;
        const delayGain = ctx.createGain();
        delayGain.gain.value = 0.3;

        // Connections
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(masterGain);
        noiseGain.connect(delay);
        delay.connect(delayGain);
        delayGain.connect(masterGain);

        bass.connect(bassGain);
        bassGain.connect(masterGain);

        // Start
        noise.start(now);
        noise.stop(now + 0.5);
        bass.start(now);
        bass.stop(now + 0.5);
    };
}

// Initialize 10 different realistic explosion sounds
for (let i = 0; i < 10; i++) {
    explosionSounds.push(createRealisticExplosion(i));
}

// Play a random explosion sound
function playExplosionSound() {
    const randomSound = explosionSounds[Math.floor(Math.random() * explosionSounds.length)];
    randomSound();
}

// Missile firing sounds
const missileSounds = {
    standard: function () {
        if (isMuted) return;
        const ctx = audioContext;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2 * sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
    },

    homing: function () {
        if (isMuted) return;
        const ctx = audioContext;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.2);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15 * sfxVolume, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);
    },

    machineGun: function () {
        if (isMuted) return;
        const ctx = audioContext;
        const now = ctx.currentTime;

        const bufferSize = ctx.sampleRate * 0.05;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1000;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.1 * sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);
    },

    cannon: function () {
        if (isMuted) return;
        const ctx = audioContext;
        const now = ctx.currentTime;

        // Deep boom
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4 * sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
    },

    laser: function () {
        if (isMuted) return;
        const ctx = audioContext;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.3);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2 * sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
    }
};


// ==================== EVENT LISTENERS ====================
window.addEventListener('resize', resize);

window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('keydown', e => {
    if (['1', '2', '3', '4', '5', '6', '7', '8'].includes(e.key)) {
        setWeapon(parseInt(e.key));
    }
    if (e.code === 'Space') {
        isSpaceDown = true;
    }
});

window.addEventListener('keyup', e => {
    if (e.code === 'Space') {
        isSpaceDown = false;
    }
});

window.addEventListener('mousedown', e => {
    if (gameOver) {
        resetGame();
    } else {
        isMouseDown = true;
        if (selectedWeapon !== 3) {
            attemptFire(e.clientX, e.clientY);
            lastAutoClickTime = Date.now();
        }
    }
});

window.addEventListener('mouseup', () => {
    isMouseDown = false;
});

// Volume control event listeners
document.getElementById('sfx-volume').addEventListener('input', (e) => {
    sfxVolume = e.target.value / 100;
    document.getElementById('sfx-value').textContent = e.target.value + '%';
});

document.getElementById('music-volume').addEventListener('input', (e) => {
    musicVolume = e.target.value / 100;
    document.getElementById('music-value').textContent = e.target.value + '%';
    // TODO: Update background music volume when implemented
});

document.getElementById('mute-toggle').addEventListener('click', () => {
    isMuted = !isMuted;
    document.getElementById('mute-toggle').textContent = isMuted ? '🔇' : '🔊';
});

const audioToggleBtn = document.getElementById('audio-toggle');
if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', () => {
        const audioControls = document.getElementById('audio-controls');
        audioControls.classList.toggle('minimized');
        audioToggleBtn.textContent = audioControls.classList.contains('minimized') ? '+' : '-';
    });
}


// ==================== UI FUNCTIONS ====================
function setWeapon(type) {
    selectedWeapon = type;
    document.querySelectorAll('.weapon').forEach(el => el.classList.remove('active'));
    document.getElementById('w' + type).classList.add('active');

    const mgStatus = document.getElementById('mg-status');
    const statusText = document.getElementById('status-text');

    if (type === 3) {
        mgStatus.style.display = 'block';
        const activeBase = bases.find(b => b.active);
        if (activeBase) updateMgUI(activeBase);
    } else {
        mgStatus.style.display = 'none';
        statusText.innerText = "";
    }

    if (type === 2) {
        statusText.innerText = "Max: 4/Base | +Velocidade/Hit | Alvos Inteligentes";
    } else if (type === 4) {
        statusText.innerText = "Cooldown: 1 segundo";
    } else if (type === 5) {
        statusText.innerText = "Cooldown: 3 segundos | Instakill";
    } else if (type === 1) {
        statusText.innerText = "Velocidade: Standard (Reduzida)";
    } else if (type === 6) {
        statusText.innerText = "Drone Teleportador | Max: 3 | Kamikaze Explosivo";
    } else if (type === 7) {
        statusText.innerText = "Missel Nuclear | Max: 1 | Raio: 400 | Explosão 360° | Cooldown: 30s";
    } else if (type === 8) {
        statusText.innerText = "Rajada Teleguiada: 10 misseis/base | 30 total | Cooldown: 60s";
    }
}

function updateMgUI(base) {
    if (selectedWeapon !== 3) return;
    if (!base || !base.active) return;

    const bar = document.getElementById('mg-bar');
    const text = document.getElementById('status-text');
    const container = document.getElementById('mg-status');

    const pct = (base.mgAmmo / mgMaxAmmo) * 100;
    bar.style.width = pct + '%';

    if (base.mgOverheated) {
        container.classList.add('reloading');
        text.innerText = "SOBREAQUECIMENTO - A ARREFECER...";
        text.style.color = '#f00';
    } else {
        container.classList.remove('reloading');
        text.innerText = `MUNIÇÃO: ${base.mgAmmo}/${mgMaxAmmo}`;
        text.style.color = '#aaa';
    }
}

function updateScore() {
    document.getElementById('score-display').innerText = `PONTUAÇÃO: ${score}`;
}

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    if (cities.length > 0) initCities();
    if (bases.length > 0) initBases();
}

// ==================== CLASSES ====================

class City {
    constructor(x) {
        this.x = x;
        this.y = height - 40;
        this.width = 40;
        this.height = 20;
        this.active = true;
        this.color = '#00ffff';
    }

    draw() {
        if (!this.active) return;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);

        ctx.fillStyle = '#000';
        ctx.shadowBlur = 0;
        ctx.fillRect(this.x - 10, this.y + 5, 4, 4);
        ctx.fillRect(this.x + 5, this.y + 5, 4, 4);
    }
}

class DefenseBase {
    constructor(x, id) {
        this.x = x;
        this.y = height - 10;
        this.radius = 20;
        this.active = true;
        this.color = '#0088ff';
        this.id = id;

        this.hits = 0;
        this.maxHits = 5;
        this.cooldownTimer = 0;

        // Weapon states for this specific base
        this.mgAmmo = mgMaxAmmo;
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

    takeDamage() {
        if (this.hits >= this.maxHits) return;

        this.hits++;
        if (this.hits >= this.maxHits) {
            this.active = false;
            createExplosion(this.x, this.y, '#ff0000', true);
        } else {
            this.active = false;
            this.cooldownTimer = 2000;
        }
    }

    draw() {
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
        updateMgUI(this);
        setTimeout(() => {
            this.mgAmmo = mgMaxAmmo;
            this.mgOverheated = false;
            updateMgUI(this);
        }, 2000);
    }

    fireMissile(targetX, targetY, type) {
        if (targetY > height - 50) targetY = height - 50;

        if (type === 3) {
            targetX += (Math.random() * 40 - 20);
            targetY += (Math.random() * 40 - 20);
        }

        playerMissiles.push(new PlayerMissile(this.x, this.y, targetX, targetY, type, 0, this.id));
    }

    fireCannonSpread(targetX, targetY) {
        if (targetY > height - 50) targetY = height - 50;
        const spreadAngles = [-0.2, -0.1, 0, 0.1, 0.2];
        spreadAngles.forEach(angleOffset => {
            playerMissiles.push(new PlayerMissile(this.x, this.y, targetX, targetY, 4, angleOffset, this.id));
        });
    }

    fireLaser(targetX, targetY) {
        lasers.push(new LaserBeam(this.x, this.y, targetX, targetY));
    }
}

class LaserBeam {
    constructor(startX, startY, targetX, targetY, isShortRange = false) {
        this.startX = startX;
        this.startY = startY;

        const angle = Math.atan2(targetY - this.startY, targetX - this.startX);

        let length = Math.max(width, height) * 1.5;
        if (isShortRange) length = Math.hypot(targetX - startX, targetY - startY);

        this.endX = this.startX + Math.cos(angle) * length;
        this.endY = this.startY + Math.sin(angle) * length;

        this.life = 1.0;
        this.decay = 0.012;
        if (isShortRange) this.decay = 0.1;

        this.active = true;
        this.width = isShortRange ? 2 : 4;
        this.color = isShortRange ? '#00ff00' : '#ff00ff';
    }

    update() {
        this.life -= this.decay;
        if (this.life <= 0) this.active = false;
    }

    draw() {
        if (!this.active) return;

        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.globalCompositeOperation = 'lighter';

        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(this.endX, this.endY);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = this.width;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(this.endX, this.endY);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.width * 4;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.stroke();

        ctx.restore();
    }
}

class UFO {
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

    update() {
        if (Date.now() - this.teleportTimer > this.teleportInterval) {
            this.teleport();
            this.teleportTimer = Date.now();
        }

        if (Date.now() - this.lastShot > this.fireRate) {
            let closest = null;
            let minDist = this.range;

            enemyMissiles.forEach(e => {
                if (!e.active) return;
                const dist = Math.hypot(e.x - this.x, e.y - this.y);
                if (dist < minDist) {
                    minDist = dist;
                    closest = e;
                }
            });

            if (closest) {
                lasers.push(new LaserBeam(this.x, this.y, closest.x, closest.y, true));
                this.lastShot = Date.now();
            }
        }
    }

    teleport() {
        this.x = Math.random() * width;
        this.y = Math.random() * (height * 0.6);
        createExplosion(this.x, this.y, '#00ffaa', false);
    }

    draw() {
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

class Particle {
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

    draw() {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1.0;
    }
}

class FireParticle extends Particle {
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

class SmokeParticle extends Particle {
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

    draw() {
        ctx.globalAlpha = Math.max(0, this.life * 0.5);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

class TrailParticle extends Particle {
    constructor(x, y, color) {
        super(x, y, color);
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = (Math.random() - 0.5) * 1;
        this.gravity = 0.02;
        this.decay = 0.016; // ~1 second life (60 frames)
        this.size = Math.random() * 2 + 1;
    }
}

class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color || '#fff';
        this.life = 3.0;
        this.vy = -1;
        this.active = true;
    }

    update() {
        this.y += this.vy;
        this.life -= 0.016;
        if (this.life <= 0) this.active = false;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;

        // Vibrant color cycle
        const hue = (Date.now() / 10) % 360;
        ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
        ctx.font = 'bold 32px Courier New';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 8;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

class Explosion {
    constructor(x, y, color, maxRadius = 70) {
        this.x = x;
        this.y = y;
        this.radius = 1;
        this.maxRadius = maxRadius;
        this.growthRate = 2;
        this.life = 1;
        this.decay = 0.04;
        this.color = color || '#ffffff';
        this.active = true;
    }

    update() {
        if (this.radius < this.maxRadius) {
            this.radius += this.growthRate;
        } else {
            this.life -= this.decay;
        }
        if (this.life <= 0) this.active = false;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.life * 0.3})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = this.life;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';
    }
}

class EnemyMissile {
    constructor() {
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
        this.speed = ((Math.random() * 1.5 + 0.5) * difficultyMultiplier) * 0.7;

        const angle = Math.atan2(this.targetY - this.startY, targetX - this.startX);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;

        this.active = true;
        this.color = '#ff0055';
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.y >= height - 20) {
            this.active = false;
            createExplosion(this.x, height - 20, '#ffaa00', true);
            checkCityCollision(this.x);
            checkBaseCollision(this.x);
        }
    }

    draw() {
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

class PlayerMissile {
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
        this.gravity = 0; // Default gravity
        this.acceleration = 0; // Default acceleration

        if (type === 1) {
            this.speed = 3.5;
            this.color = '#00ffff';
        } else if (type === 2) {
            this.speed = 0.8 * homingMissileSpeedMultiplier; // Start slow
            this.acceleration = 0.02; // Accelerate
            this.color = '#00ff00';
            this.turnSpeed = 0.010;
            this.maxFlightTime = 7000;
        } else if (type === 3) {
            this.speed = 6;
            this.color = '#ffff00';
            this.gravity = 0.015; // Add gravity for machine gun
        } else if (type === 4) {
            this.speed = 5;
            this.color = '#ff8800';
            this.gravity = 0.02; // Add gravity for cannon
        } else if (type === 7) {
            this.speed = 2.0 * homingMissileSpeedMultiplier; // Same initial speed as weapon 2
            this.color = '#ff0000e5'; // Purple/Pink for Nuclear
            // Constant speed, no acceleration
        } else if (type === 8) {
            this.speed = 0.6 * homingMissileSpeedMultiplier; // Start slow
            this.acceleration = 0.008; // Accelerate
            this.color = '#ffff33'; // Neon yellow
            this.turnSpeed = 0.015;
            this.maxFlightTime = 15000;
        }

        this.angle = Math.atan2(targetY - this.startY, targetX - this.startX);
        this.angle += angleOffset;

        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
    }

    update() {
        if (this.type === 2 || this.type === 8) {
            if (Date.now() - this.creationTime > this.maxFlightTime) {
                this.active = false;
                createExplosion(this.x, this.y, this.color, false);
                return;
            }

            // Apply acceleration for type 2 and 8
            if (this.acceleration > 0) {
                this.speed += this.acceleration;
            }

            if (!this.target || !this.target.active) {
                this.target = null;

                const otherHomingMissiles = playerMissiles.filter(p => p !== this && p.active && (p.type === 2 || p.type === 8) && p.target);
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
            } else {
                // Update velocity vector with new speed if no target
                const currentAngle = Math.atan2(this.vy, this.vx);
                this.vx = Math.cos(currentAngle) * this.speed;
                this.vy = Math.sin(currentAngle) * this.speed;
            }
        }

        // Apply gravity if applicable
        if (this.gravity !== 0) {
            this.vy += this.gravity;
        }

        if (this.type === 4) {
            particles.push(new TrailParticle(this.x, this.y, this.color));
        }

        this.x += this.vx;
        this.y += this.vy;

        if (this.type === 1) {
            const distToTarget = Math.hypot(this.x - this.targetX, this.y - this.targetY);
            if (distToTarget < this.speed || (this.vy < 0 && this.y <= this.targetY)) {
                this.active = false;
                createExplosion(this.targetX, this.targetY, this.color, false);
            }
        } else if (this.type === 7) {
            const distToTarget = Math.hypot(this.x - this.targetX, this.y - this.targetY);
            if (distToTarget < this.speed || (this.vy < 0 && this.y <= this.targetY)) {
                this.active = false;
                createNuclearExplosion(this.targetX, this.targetY);
            }
        } else {
            if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
                this.active = false;
            }
        }
    }

    draw() {
        ctx.beginPath();
        if (this.type === 1) {
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

// ==================== GAME FUNCTIONS ====================

function initCities() {
    cities = [];
    const spacing = width / 7;
    for (let i = 1; i <= 6; i++) {
        cities.push(new City(spacing * i));
    }
}

function initBases() {
    bases = [];
    bases.push(new DefenseBase(50, 0));
    bases.push(new DefenseBase(width / 2, 1));
    bases.push(new DefenseBase(width - 50, 2));
}

function attemptFire(x, y) {
    const now = Date.now();
    let closestBase = null;
    let minDist = Infinity;

    bases.forEach(base => {
        if (base.active) {
            const dist = Math.abs(x - base.x);
            if (dist < minDist) {
                minDist = dist;
                closestBase = base;
            }
        }
    });

    if (!closestBase) return;

    if (selectedWeapon === 2) {
        const activeHomingFromBase = playerMissiles.filter(p => p.active && p.type === 2 && p.sourceId === closestBase.id).length;
        if (activeHomingFromBase >= 4) return;
        missileSounds.homing();
        closestBase.fireMissile(x, y, 2);
    }
    else if (selectedWeapon === 3) {
        if (closestBase.mgOverheated) return;
        if (now - closestBase.lastShotTime > 100) {
            if (closestBase.mgAmmo > 0) {
                closestBase.mgAmmo--;
                missileSounds.machineGun();
                closestBase.fireMissile(x, y, 3);
                closestBase.lastShotTime = now;
                updateMgUI(closestBase);
            }
            if (closestBase.mgAmmo <= 0 && !closestBase.mgOverheated) {
                closestBase.startMgCooldown();
            }
        }
    }
    else if (selectedWeapon === 4) {
        if (now - closestBase.cannonLastShot > cannonCooldown) {
            missileSounds.cannon();
            closestBase.fireCannonSpread(x, y);
            closestBase.cannonLastShot = now;
        }
    }
    else if (selectedWeapon === 5) {
        if (now - closestBase.laserLastShot > laserCooldown) {
            missileSounds.laser();
            closestBase.fireLaser(x, y);
            closestBase.laserLastShot = now;
        }
    }
    else if (selectedWeapon === 6) {
        if (ufos.length < 3) {
            ufos.push(new UFO(closestBase.x, closestBase.y - 30));
        }
    }
    else if (selectedWeapon === 7) {
        // Check if a nuclear missile is already active
        const activeNuclear = playerMissiles.some(p => p.active && p.type === 7);
        // Check cooldown
        const now = Date.now();
        if (!activeNuclear && now > nuclearCooldownEndTime) {
            missileSounds.standard(); // Use standard sound or maybe a deeper one if available
            closestBase.fireMissile(x, y, 7);
        }
    }
    else if (selectedWeapon === 8) {
        const now = Date.now();
        if (now > missileBarrageCooldownEndTime) {
            // Fire 10 missiles from each active base with 500ms interval between each missile
            bases.forEach(base => {
                if (base.active) {
                    for (let i = 0; i < 10; i++) {
                        setTimeout(() => {
                            if (base.active) {
                                base.fireMissile(x, y, 8);
                                missileSounds.homing();
                            }
                        }, i * 200);
                    }
                }
            });
            missileBarrageCooldownEndTime = now + 60000;
        }
    }
    else {
        missileSounds.standard();
        closestBase.fireMissile(x, y, 1);
    }
}

function createExplosion(x, y, color, isGroundImpact = false) {
    // Play random explosion sound
    playExplosionSound();

    const radius = isGroundImpact ? 80 : 70;
    explosions.push(new Explosion(x, y, color, radius));

    for (let i = 0; i < 50; i++) {
        particles.push(new Particle(x, y, color));
    }

    for (let i = 0; i < 30; i++) {
        particles.push(new FireParticle(x, y));
    }

    for (let i = 0; i < 20; i++) {
        particles.push(new SmokeParticle(x, y));
    }
}

function createNuclearExplosion(x, y) {
    playExplosionSound();

    // Set cooldown for 30 seconds from now
    nuclearCooldownEndTime = Date.now() + 30000;

    const radius = 400;
    explosions.push(new Explosion(x, y, '#e60000ff', radius));

    // More particles for 360 effect
    for (let i = 0; i < 4000; i++) {
        const angle = (Math.PI * 2 * i) / 4000;
        const speed = Math.random() * 8 + 2;
        const p = new Particle(x, y, `hsl(${Math.random() * 360}, 100%, 50%)`);
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.life = 2.5;
        particles.push(p);
    }

    for (let i = 0; i < 1000; i++) {
        particles.push(new FireParticle(x, y));
    }

    for (let i = 0; i < 200; i++) {
        particles.push(new SmokeParticle(x, y));
    }
}

function checkBaseCollision(impactX) {
    bases.forEach(base => {
        if (base.active && Math.abs(impactX - base.x) < base.radius) {
            base.takeDamage();
        }
    });
}

function checkCityCollision(impactX) {
    cities.forEach(city => {
        if (city.active && Math.abs(impactX - city.x) < 30) {
            city.active = false;
            for (let k = 0; k < 5; k++) {
                setTimeout(() => {
                    createExplosion(city.x + (Math.random() * 20 - 10), city.y - (Math.random() * 10), '#ff0000', true);
                }, k * 100);
            }
        }
    });
}

function distToSegment(p, v, w) {
    function sqr(x) { return x * x }
    function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y) }
    let l2 = dist2(v, w);
    if (l2 == 0) return Math.sqrt(dist2(p, v));
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.sqrt(dist2(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) }));
}

function checkCollisions() {
    explosions.forEach(exp => {
        if (!exp.active) return;

        // Count how many enemies this explosion hits
        let hitsThisExplosion = 0;

        enemyMissiles.forEach(enemy => {
            if (!enemy.active) return;
            const dist = Math.hypot(enemy.x - exp.x, enemy.y - exp.y);
            if (dist < exp.radius) {
                enemy.active = false;
                hitsThisExplosion++;
                createExplosion(enemy.x, enemy.y, '#ffaa00', false);
            }
        });

        // Apply combo logic
        if (hitsThisExplosion > 0) {
            comboCount++;
            comboTimer = Date.now() + 2000;
            comboActive = true;

            // If multiple hits, apply 2x multiplier
            if (hitsThisExplosion >= 2) {
                score += 100 * 2 * hitsThisExplosion;
            } else {
                score += 100;
            }
        }
    });

    playerMissiles.forEach(pm => {
        if (!pm.active || pm.type === 1) return;

        enemyMissiles.forEach(enemy => {
            if (!enemy.active) return;
            const dist = Math.hypot(pm.x - enemy.x, pm.y - enemy.y);
            const hitRadius = (pm.type === 4) ? 25 : 15;

            if (dist < hitRadius) {
                enemy.active = false;
                pm.active = false;

                // Combo logic
                comboCount++;
                comboTimer = Date.now() + 2000;
                comboActive = true;
                score += 150;

                createExplosion(enemy.x, enemy.y, '#ffaa00', false);

                if (pm.type === 2) {
                    homingMissileSpeedMultiplier += 0.001;
                }
            }
        });
    });

    lasers.forEach(laser => {
        if (!laser.active) return;
        enemyMissiles.forEach(enemy => {
            if (!enemy.active) return;

            const dist = distToSegment(
                { x: enemy.x, y: enemy.y },
                { x: laser.startX, y: laser.startY },
                { x: laser.endX, y: laser.endY }
            );

            if (dist < 10) {
                enemy.active = false;

                // Combo logic
                comboCount++;
                comboTimer = Date.now() + 2000;
                comboActive = true;
                score += 200;

                createExplosion(enemy.x, enemy.y, '#ff00ff', false);
            }
        });
    });

    ufos.forEach(ufo => {
        if (!ufo.active) return;

        enemyMissiles.forEach(enemy => {
            if (!enemy.active) return;
            const dist = Math.hypot(ufo.x - enemy.x, ufo.y - enemy.y);

            if (dist < ufo.radius + 5) {
                ufo.active = false;
                enemy.active = false;

                const blastRadius = width * 0.20;
                createExplosion(ufo.x, ufo.y, '#00ffaa', false);

                enemyMissiles.forEach(e => {
                    if (e.active && Math.hypot(e.x - ufo.x, e.y - ufo.y) < blastRadius) {
                        e.active = false;
                        createExplosion(e.x, e.y, '#ffaa00', false);

                        // Combo logic
                        comboCount++;
                        comboTimer = Date.now() + 2000;
                        comboActive = true;
                        score += 50;
                    }
                });

                explosions.push(new Explosion(ufo.x, ufo.y, '#ffffff', blastRadius));
            }
        });
    });
}

function resetGame() {
    score = 0;
    difficultyMultiplier = 1;
    frameCount = 0;
    enemyMissiles = [];
    playerMissiles = [];
    explosions = [];
    particles = [];
    lasers = [];
    ufos = [];
    floatingTexts = [];
    homingMissileSpeedMultiplier = 1;

    // Reset combo system
    comboCount = 0;
    comboTimer = 0;
    comboActive = false;

    // Reset weapon cooldowns
    nuclearCooldownEndTime = 0;
    missileBarrageCooldownEndTime = 0;

    initBases();
    initCities();
    gameOver = false;
    loop();
}

// ==================== MAIN LOOP ====================

function loop() {
    if (gameOver) return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, width, height);

    const activeBase = bases.find(b => b.active);
    if (activeBase) {
        updateMgUI(activeBase);
    }

    // Combo Timeout Check
    if (comboActive && Date.now() > comboTimer) {
        if (comboCount > 1) {
            floatingTexts.push(new FloatingText(width / 2, height / 2, `COMBO ${comboCount} X`, '#ffff00'));
        }
        comboCount = 0;
        comboActive = false;
    }

    // AUTO-FIRE LOGIC with weapon-specific fire rates
    if (isMouseDown || isSpaceDown) {
        if (selectedWeapon === 3) {
            attemptFire(mouse.x, mouse.y);
        } else {
            // Use standardMissileRate for weapon 1, autoClickRate for others
            const rate = (selectedWeapon === 1) ? standardMissileRate : autoClickRate;
            if (Date.now() - lastAutoClickTime > rate) {
                attemptFire(mouse.x, mouse.y);
                lastAutoClickTime = Date.now();
            }
        }
    }

    if (cities.every(c => !c.active) && bases.every(b => b.hits >= b.maxHits)) {
        gameOver = true;
        ctx.fillStyle = 'white';
        ctx.font = '40px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText("FIM DE JOGO", width / 2, height / 2);
        ctx.font = '20px Courier New';
        ctx.fillText("Clique para Reiniciar", width / 2, height / 2 + 40);
        return;
    }

    if (frameCount % Math.max(20, 100 - Math.floor(score / 500)) === 0) {
        enemyMissiles.push(new EnemyMissile());
        difficultyMultiplier = Math.min(1.3, 1 + (score / 5000));
    }

    particles.forEach((p, index) => {
        p.update();
        p.draw();
        if (!p.active) particles.splice(index, 1);
    });

    explosions.forEach((e, index) => {
        e.update();
        e.draw();
        if (!e.active) explosions.splice(index, 1);
    });

    lasers.forEach((l, index) => {
        l.update();
        l.draw();
        if (!l.active) lasers.splice(index, 1);
    });

    enemyMissiles.forEach((m, index) => {
        m.update();
        m.draw();
        if (!m.active) enemyMissiles.splice(index, 1);
    });

    playerMissiles.forEach((m, index) => {
        m.update();
        m.draw();
        if (!m.active) playerMissiles.splice(index, 1);
    });

    ufos.forEach((u, index) => {
        u.update();
        u.draw();
        if (!u.active) ufos.splice(index, 1);
    });

    floatingTexts.forEach((ft, index) => {
        ft.update();
        ft.draw();
        if (!ft.active) floatingTexts.splice(index, 1);
    });

    cities.forEach(city => city.draw());

    bases.forEach(base => {
        base.update();
        base.draw();
    });

    ctx.fillStyle = '#333';
    ctx.fillRect(0, height - 20, width, 20);

    checkCollisions();
    updateScore();
    frameCount++;
    requestAnimationFrame(loop);
}

// ==================== INITIALIZATION ====================
resize();
initCities();
initBases();
updateMgUI(bases[0]);
loop();
