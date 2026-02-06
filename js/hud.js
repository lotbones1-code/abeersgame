// ── HUD (Heads-Up Display) ──

const HUD = {
    scoreDisplay: 0,
    targetScore: 0,
    scorePopups: [],
    visible: false,
    lives: CONFIG.LIVES.STARTING,
    combo: 0,
    _prevLives: -1,
    _prevCombo: 0,

    init() {
        this.scoreDisplay = 0;
        this.targetScore = 0;
        this.scorePopups = [];
        this.visible = false;
        this.lives = CONFIG.LIVES.STARTING;
        this.combo = 0;
        this._prevLives = -1;
        this._prevCombo = 0;
    },

    show() {
        this.visible = true;
        document.getElementById('hud').classList.add('visible');
    },

    hide() {
        this.visible = false;
        document.getElementById('hud').classList.remove('visible');
    },

    setScore(score) {
        const jump = score - this.targetScore;
        this.targetScore = score;
        if (jump >= 50) {
            const scoreEl = document.getElementById('score');
            scoreEl.classList.remove('score-pop');
            // Force reflow to restart animation
            void scoreEl.offsetWidth;
            scoreEl.classList.add('score-pop');
        }
    },

    setLives(lives) {
        this.lives = lives;
    },

    setCombo(combo) {
        this.combo = combo;
    },

    addPopup(x, y, text, color) {
        this.scorePopups.push({
            x, y,
            text,
            color: color || '#fff',
            life: 1.2,
            maxLife: 1.2,
            vy: -60,
        });
    },

    update(dt) {
        // Smooth score counting
        if (this.scoreDisplay < this.targetScore) {
            const diff = this.targetScore - this.scoreDisplay;
            this.scoreDisplay += Math.max(1, diff * 8 * dt);
            if (this.scoreDisplay > this.targetScore) this.scoreDisplay = this.targetScore;
        }

        // Update DOM - score
        document.getElementById('score').textContent = Math.floor(this.scoreDisplay).toLocaleString();

        // Update DOM - lives (individual heart spans)
        if (this._prevLives !== this.lives) {
            const heartsEl = document.getElementById('hearts');
            const prevLives = this._prevLives;
            this._prevLives = this.lives;
            heartsEl.innerHTML = '';
            for (let i = 0; i < CONFIG.LIVES.MAX; i++) {
                const span = document.createElement('span');
                span.className = 'heart-icon';
                if (i < this.lives) {
                    span.textContent = '\u2764';
                } else {
                    span.textContent = '\u2661';
                    // Animate the heart that was just lost
                    if (i === this.lives && prevLives > this.lives && prevLives > 0) {
                        span.classList.add('heart-break');
                    }
                }
                heartsEl.appendChild(span);
            }
        }

        // Update DOM - combo with tier classes
        const comboEl = document.getElementById('combo');
        if (comboEl) {
            if (this.combo >= 3) {
                comboEl.textContent = `x${this.combo}`;
                comboEl.style.opacity = '1';
                // Add/remove tier classes
                comboEl.classList.toggle('combo-fire', this.combo >= 10 && this.combo < 20);
                comboEl.classList.toggle('combo-mega', this.combo >= 20);
            } else {
                comboEl.style.opacity = '0';
                comboEl.classList.remove('combo-fire', 'combo-mega');
            }
        }

        // Update popups
        for (let i = this.scorePopups.length - 1; i >= 0; i--) {
            const popup = this.scorePopups[i];
            popup.life -= dt;
            popup.y += popup.vy * dt;
            popup.vy *= 0.95;
            if (popup.life <= 0) {
                this.scorePopups.splice(i, 1);
            }
        }
    },

    drawPopups(ctx) {
        for (const popup of this.scorePopups) {
            const alpha = Utils.clamp(popup.life / popup.maxLife, 0, 1);
            const scale = 1 + (1 - alpha) * 0.3;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = `600 ${14 * scale}px "Quicksand", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillText(popup.text, popup.x + 1, popup.y + 1);

            // Text
            ctx.fillStyle = popup.color;
            ctx.fillText(popup.text, popup.x, popup.y);

            ctx.restore();
        }
    },
};
