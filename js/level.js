// Level and wave management
const LEVEL_DATA = [
    // Level 1: Shamblers only
    {
        waves: [
            { shambler: 5 },
            { shambler: 8 },
            { shambler: 12 }
        ]
    },
    // Level 2: + Runners
    {
        waves: [
            { shambler: 6, runner: 2 },
            { shambler: 5, runner: 5 },
            { shambler: 4, runner: 8 }
        ]
    },
    // Level 3: + Shooters
    {
        waves: [
            { shambler: 8, runner: 3 },
            { shambler: 4, runner: 4, shooter: 2 },
            { runner: 6, shooter: 4 },
            { shambler: 3, runner: 5, shooter: 4 }
        ]
    },
    // Level 4: + Tanks
    {
        waves: [
            { runner: 5, shooter: 4 },
            { shambler: 8, tank: 2 },
            { runner: 4, shooter: 3, tank: 2 },
            { runner: 6, shooter: 4, tank: 3 }
        ]
    },
    // Level 5: + Splitters, all types
    {
        waves: [
            { runner: 5, shooter: 3, tank: 2 },
            { shambler: 4, splitter: 4, shooter: 2 },
            { runner: 6, splitter: 3, tank: 3 },
            { shooter: 4, splitter: 4, tank: 2 },
            { runner: 8, shooter: 4, splitter: 3, tank: 2 }
        ]
    }
];

class LevelManager {
    constructor() {
        this.currentLevel = 0;
        this.currentWave = 0;
        this.enemies = [];
        this.enemyBullets = [];
        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.spawnInterval = 0.3;
        this.waveCountdown = 0;
        this.betweenWaves = false;
        this.levelComplete = false;
        this.waveCleared = false;
        this.totalWaves = 0;
        this.enemiesKilledThisLevel = 0;
        this.waveStartTime = 0;
        this.waveTimeTotal = 0;
    }

    startLevel(levelNum) {
        this.currentLevel = levelNum;
        this.currentWave = 0;
        this.enemies = [];
        this.enemyBullets = [];
        this.spawnQueue = [];
        this.levelComplete = false;
        this.enemiesKilledThisLevel = 0;
        this.waveTimeTotal = 0;

        const levelData = this.getLevelData(levelNum);
        this.totalWaves = levelData.waves.length;

        this.startWave();
    }

    getLevelData(levelNum) {
        if (levelNum < LEVEL_DATA.length) {
            return LEVEL_DATA[levelNum];
        }
        // Endless mode: scale level 5 data
        const baseLevel = LEVEL_DATA[4];
        const scale = 1 + (levelNum - 4) * 0.15;
        return {
            waves: baseLevel.waves.map(wave => {
                const scaled = {};
                for (const type in wave) {
                    scaled[type] = Math.ceil(wave[type] * scale);
                }
                return scaled;
            })
        };
    }

    startWave() {
        const levelData = this.getLevelData(this.currentLevel);
        const waveData = levelData.waves[this.currentWave];
        this.spawnQueue = [];
        this.waveStartTime = performance.now();

        for (const type in waveData) {
            for (let i = 0; i < waveData[type]; i++) {
                this.spawnQueue.push(type);
            }
        }
        // Shuffle spawn order
        for (let i = this.spawnQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.spawnQueue[i], this.spawnQueue[j]] = [this.spawnQueue[j], this.spawnQueue[i]];
        }

        this.spawnTimer = 0;
        this.betweenWaves = false;
        this.waveCleared = false;
    }

    spawnEnemy(type, canvasWidth, canvasHeight) {
        // Spawn from random edge
        const edge = Math.floor(Math.random() * 4);
        let x, y;
        const margin = 30;
        switch (edge) {
            case 0: x = Math.random() * canvasWidth; y = -margin; break;       // top
            case 1: x = canvasWidth + margin; y = Math.random() * canvasHeight; break; // right
            case 2: x = Math.random() * canvasWidth; y = canvasHeight + margin; break; // bottom
            case 3: x = -margin; y = Math.random() * canvasHeight; break;      // left
        }
        this.enemies.push(new Enemy(x, y, type));
    }

    update(dt, playerX, playerY, canvasWidth, canvasHeight, particles, audio) {
        // Spawn queued enemies
        if (this.spawnQueue.length > 0) {
            this.spawnTimer += dt;
            while (this.spawnTimer >= this.spawnInterval && this.spawnQueue.length > 0) {
                this.spawnTimer -= this.spawnInterval;
                this.spawnEnemy(this.spawnQueue.pop(), canvasWidth, canvasHeight);
            }
        }

        // Update enemies
        for (const enemy of this.enemies) {
            enemy.update(dt, playerX, playerY, this.enemyBullets);
        }

        // Update enemy bullets
        for (const bullet of this.enemyBullets) {
            bullet.update(dt, canvasWidth, canvasHeight);
        }

        // Handle dead enemies (splitting, removal)
        const newEnemies = [];
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (!enemy.alive) {
                if (enemy.shouldSplit()) {
                    // Spawn mini splitters
                    for (let j = 0; j < 2; j++) {
                        const offsetX = (Math.random() - 0.5) * 20;
                        const offsetY = (Math.random() - 0.5) * 20;
                        newEnemies.push(new Enemy(enemy.x + offsetX, enemy.y + offsetY, 'mini_splitter'));
                    }
                }
                this.enemies.splice(i, 1);
            }
        }
        this.enemies.push(...newEnemies);

        // Clean up dead bullets
        this.enemyBullets = this.enemyBullets.filter(b => b.alive);

        // Check if wave is cleared
        if (this.spawnQueue.length === 0 && this.enemies.length === 0 && !this.betweenWaves && !this.waveCleared) {
            this.waveCleared = true;
            this.waveTimeTotal += (performance.now() - this.waveStartTime) / 1000;

            if (this.currentWave + 1 >= this.totalWaves) {
                // Level complete
                this.levelComplete = true;
                audio.playLevelUp();
            } else {
                // Start countdown for next wave
                this.betweenWaves = true;
                this.waveCountdown = 3.0;
            }
        }

        // Wave countdown
        if (this.betweenWaves) {
            this.waveCountdown -= dt;
            if (this.waveCountdown <= 0) {
                this.currentWave++;
                this.startWave();
            }
        }
    }

    getWaveAnnouncement() {
        if (this.betweenWaves) {
            return `Wave ${this.currentWave + 2} incoming! ${Math.ceil(this.waveCountdown)}`;
        }
        return null;
    }

    draw(ctx) {
        // Draw enemies
        for (const enemy of this.enemies) {
            enemy.draw(ctx);
        }
        // Draw enemy bullets
        for (const bullet of this.enemyBullets) {
            bullet.draw(ctx);
        }
    }
}
