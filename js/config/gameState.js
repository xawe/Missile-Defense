/* ============================================
   GAME STATE MANAGER
   ============================================ */

export class GameState {
    constructor() {
        this.score = 0;
        this.gameOver = false;
        this.frameCount = 0;
        this.difficultyMultiplier = 1;
        this.homingMissileSpeedMultiplier = 1;

        // Entity arrays
        this.cities = [];
        this.bases = [];
        this.enemyMissiles = [];
        this.playerMissiles = [];
        this.explosions = [];
        this.particles = [];
        this.lasers = [];
        this.ufos = [];
    }

    reset() {
        this.score = 0;
        this.difficultyMultiplier = 1;
        this.frameCount = 0;
        this.homingMissileSpeedMultiplier = 1;
        this.gameOver = false;
        this.clearEntities();
    }

    clearEntities() {
        this.enemyMissiles = [];
        this.playerMissiles = [];
        this.explosions = [];
        this.particles = [];
        this.lasers = [];
        this.ufos = [];
    }
}

// Singleton instance
export const gameState = new GameState();
