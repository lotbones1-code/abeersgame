// ── Storage (localStorage) ──

const Storage = {
    KEY_PREFIX: 'abeer_aurora_',

    _get(key, defaultVal) {
        try {
            const val = localStorage.getItem(this.KEY_PREFIX + key);
            return val !== null ? JSON.parse(val) : defaultVal;
        } catch {
            return defaultVal;
        }
    },

    _set(key, val) {
        try {
            localStorage.setItem(this.KEY_PREFIX + key, JSON.stringify(val));
        } catch {
            // localStorage full or unavailable
        }
    },

    // High score
    getHighScore() {
        return this._get('highscore', 0);
    },

    setHighScore(score) {
        const current = this.getHighScore();
        if (score > current) {
            this._set('highscore', score);
            return true; // New high score!
        }
        return false;
    },

    // Max altitude reached
    getMaxAltitude() {
        return this._get('maxalt', 0);
    },

    setMaxAltitude(alt) {
        const current = this.getMaxAltitude();
        if (alt > current) {
            this._set('maxalt', alt);
        }
    },

    // Collected love letters (array of indices)
    getCollectedLetters() {
        return this._get('letters', []);
    },

    collectLetter(index) {
        const collected = this.getCollectedLetters();
        if (!collected.includes(index)) {
            collected.push(index);
            this._set('letters', collected);
        }
        return collected;
    },

    getAllLettersCollected() {
        return this.getCollectedLetters().length >= CONFIG.COLLECTIBLES.TOTAL;
    },

    // First launch flag
    isFirstLaunch() {
        return this._get('launched', false) === false;
    },

    markLaunched() {
        this._set('launched', true);
    },

    // Total play count
    getPlayCount() {
        return this._get('plays', 0);
    },

    incrementPlayCount() {
        const count = this.getPlayCount() + 1;
        this._set('plays', count);
        return count;
    },

    // Reset all data
    resetAll() {
        const keys = ['highscore', 'maxalt', 'letters', 'launched', 'plays'];
        keys.forEach(k => {
            try { localStorage.removeItem(this.KEY_PREFIX + k); } catch {}
        });
    },
};
