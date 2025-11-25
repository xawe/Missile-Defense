/* ============================================
   GAME CONSTANTS
   ============================================ */

export const WEAPON_CONFIG = {
    autoClickRate: 180, // ms - base rate for most weapons
    standardMissileRate: Math.round(180 * 1.3), // 234ms - 30% slower for weapon 1
    mgMaxAmmo: 20,
    cannonCooldown: 1000,
    laserCooldown: 3000
};

export const GAME_CONFIG = {
    maxUFOs: 3,
    cityCount: 6,
    baseCount: 3,
    baseMaxHits: 5,
    baseCooldownTime: 2000
};

export const DIFFICULTY_CONFIG = {
    initialMultiplier: 1,
    maxMultiplier: 1.3,
    scoreThreshold: 5000,
    enemySpeedMultiplier: 0.7
};

export const PARTICLE_CONFIG = {
    debrisCount: 50,
    fireCount: 30,
    smokeCount: 20
};

export const EXPLOSION_CONFIG = {
    normalRadius: 70,
    groundImpactRadius: 80
};
