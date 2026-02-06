// ── Game Configuration ──

const CONFIG = {
    TARGET_FPS: 60,
    FIXED_DT: 1 / 60,
    MAX_DT: 1 / 30,

    WORLD_WIDTH: 400,

    // Player (Abeer) - sits at bottom, moves left/right
    PLAYER: {
        WIDTH: 52,
        HEIGHT: 68,
        MOVE_SPEED: 320,
        SMOOTH_FACTOR: 0.18,
        Y_POSITION: 0.80,   // 80% down the screen
        CATCH_RADIUS: 40,
        // Visual
        HAIR_COLOR: '#1a1a2e',
        HAIR_HIGHLIGHT: '#6a4098',
        SKIN_COLOR: '#f5d0a8',
        DRESS_COLOR: '#ff9ec4',
        DRESS_HIGHLIGHT: '#ffb8d8',
        DRESS_FOLD: '#e87aaa',
        EYE_COLOR: '#2c1810',
        GLOW_COLOR: 'rgba(255,158,196,0.12)',
        GLOW_RADIUS: 60,
    },

    // Falling items
    ITEMS: {
        STAR:   { weight: 55, points: 10, size: 22, minSpeed: 90, maxSpeed: 170 },
        HEART:  { weight: 28, points: 25, size: 26, minSpeed: 80, maxSpeed: 150 },
        CLOUD:  { weight: 17, points: 0,  size: 36, minSpeed: 70, maxSpeed: 130 },
        LETTER: { points: 200, size: 34,  minSpeed: 65, maxSpeed: 85 },
    },

    SPAWN: {
        BASE_INTERVAL: 0.65,
        MIN_INTERVAL: 0.18,
        ACCELERATION: 0.0025,
        SPEED_INCREASE: 1.8,
        LETTER_INTERVAL: 20,
        LETTER_FIRST_DELAY: 8,
    },

    COMBO: {
        MILESTONES: [5, 10, 20, 50, 100],
    },

    LIVES: {
        STARTING: 3,
        MAX: 5,
    },

    // Particles
    PARTICLES: {
        POOL_SIZE: 800,
        TRAIL_RATE: 0.1,
        TRAIL_LIFE: 0.9,
        BURST_COUNT: 20,
        BURST_LIFE: 1.2,
        LANDING_COUNT: 12,
        LANDING_LIFE: 0.8,
    },

    // Love letters
    COLLECTIBLES: {
        TOTAL: 12,
        SLOW_MO_DURATION: 1200,
        SLOW_MO_SCALE: 0.3,
    },

    // Audio
    AUDIO: {
        MASTER_VOLUME: 0.3,
        MUSIC_VOLUME: 0.15,
        SFX_VOLUME: 0.25,
        BPM: 72,
    },

    // Visual
    VISUAL: {
        STAR_COUNT: 220,
        AURORA_RIBBONS: 5,
        AURORA_CONTROL_POINTS: 32,
        SCREEN_SHAKE_INTENSITY: 8,
        SCREEN_SHAKE_DURATION: 400,
        NEBULA_COUNT: 8,
        AMBIENT_MOTES: 40,
        BLOOM_ENABLED: true,
        BLOOM_BLUR: 12,
        BLOOM_ALPHA: 0.3,
        VIGNETTE_INTENSITY: 0.35,
        VIGNETTE_GAMEOVER: 0.55,
    },

    COLORS: {
        ACCENT: '#ff9ec4',
        ACCENT_LIGHT: '#ffc8e0',
        ACCENT_DARK: '#ff6fa8',
        STAR_GOLD: '#ffe566',
        CLOUD_DARK: '#2a1a3a',
        UI_TEXT: 'rgba(255, 255, 255, 0.95)',
        UI_SHADOW: 'rgba(255, 158, 196, 0.6)',
    },
};
