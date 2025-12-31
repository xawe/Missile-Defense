export const CONSTANTS = {
    CANVAS_WIDTH: window.innerWidth,
    CANVAS_HEIGHT: window.innerHeight,
    GRAVITY: 0.08,
    ENEMY_SPAWN_BASE_RATE: 0.33,
    AUTO_CLICK_RATE: 480,
    STANDARD_MISSILE_RATE: Math.round(480 * 1.3),
    MG_MAX_AMMO: 20,
    CANNON_COOLDOWN: 1000,
    LASER_COOLDOWN: 3000,
    NUCLEAR_COOLDOWN: 30000,
    MISSILE_BARRAGE_COOLDOWN: 60000,
    // Colors
    COLOR_CITY: '#00ffff',
    COLOR_BASE: '#0088ff',
    COLOR_ENEMY: '#ff0055',
    COLOR_FRIENDLY_MISSILE: '#00ffff',
    COLOR_HOMING_MISSILE: '#00ff00',
    COLOR_MG: '#ffff00',
    COLOR_CANNON: '#ff8800',
    COLOR_NUCLEAR: '#ff0000e5',
    COLOR_BARRAGE: '#ffff33',
    COLOR_UFO: '#00ffaa'
};

export const WEAPON_TYPES = {
    STANDARD: 1,
    HOMING: 2,
    MACHINE_GUN: 3,
    CANNON: 4,
    LASER: 5,
    UFO: 6,
    NUCLEAR: 7,
    BARRAGE: 8
};
