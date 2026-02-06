// ── Screens (Title, Intro, Game Over, Star Map) ──

const Screens = {
    // Intro state
    introPhase: 0,
    introTimer: 0,
    introLines: [
        { text: "Shamil made this", delay: 0, duration: 2.5 },
        { text: "for someone special...", delay: 2, duration: 2.5 },
        { text: "for you, Abeer", delay: 4.5, duration: 3 },
    ],
    introDone: false,

    // Title state
    titleAlpha: 0,
    titlePulse: 0,
    titleReady: false,
    promptAlpha: 0,
    promptPulse: 0,

    // Tutorial state
    tutorialShown: false,
    tutorialAlpha: 0,
    tutorialTimer: 0,

    // Game over state
    gameOverAlpha: 0,
    gameOverTimer: 0,
    gameOverData: null,
    showRestart: false,

    // Star map state
    starMapActive: false,
    starMapAlpha: 0,

    // Screen shake
    shakeIntensity: 0,
    shakeTimer: 0,
    shakeX: 0,
    shakeY: 0,

    // Decorative floating particles for menus
    menuParticles: [],

    init() {
        this.introPhase = 0;
        this.introTimer = 0;
        this.introDone = false;
        this.titleAlpha = 0;
        this.titleReady = false;
        this.promptAlpha = 0;
        this.gameOverAlpha = 0;
        this.gameOverTimer = 0;
        this.showRestart = false;
        this.starMapActive = false;
        this.tutorialShown = false;
        this.tutorialAlpha = 0;
        this.tutorialTimer = 0;

        this.menuParticles = [];
        for (let i = 0; i < 40; i++) {
            this.menuParticles.push({
                x: Math.random(),
                y: Math.random(),
                size: Utils.randFloat(1, 3),
                speed: Utils.randFloat(0.005, 0.02),
                alpha: Utils.randFloat(0.1, 0.4),
                drift: Utils.randFloat(-0.002, 0.002),
            });
        }
    },

    // ── Screen Shake ──

    startShake(intensity, duration) {
        this.shakeIntensity = intensity || CONFIG.VISUAL.SCREEN_SHAKE_INTENSITY;
        this.shakeTimer = duration || CONFIG.VISUAL.SCREEN_SHAKE_DURATION / 1000;
    },

    updateShake(dt) {
        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt;
            const t = this.shakeTimer > 0 ? this.shakeIntensity * (this.shakeTimer / (CONFIG.VISUAL.SCREEN_SHAKE_DURATION / 1000)) : 0;
            this.shakeX = Utils.randFloat(-t, t);
            this.shakeY = Utils.randFloat(-t, t);
        } else {
            this.shakeX = 0;
            this.shakeY = 0;
        }
    },

    _updateMenuParticles() {
        for (const p of this.menuParticles) {
            p.y -= p.speed * 0.016;
            p.x += p.drift;
            if (p.y < -0.05) {
                p.y = 1.05;
                p.x = Math.random();
            }
            if (p.x < 0) p.x = 1;
            if (p.x > 1) p.x = 0;
        }
    },

    _drawMenuParticles(ctx, w, h) {
        for (const p of this.menuParticles) {
            ctx.fillStyle = `rgba(255,158,196,${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x * w, p.y * h, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    // ── Intro ──

    updateIntro(dt) {
        this.introTimer += dt;
        this._updateMenuParticles();
        if (this.introTimer > 8) {
            this.introDone = true;
        }
    },

    drawIntro(ctx, w, h) {
        ctx.fillStyle = '#050010';
        ctx.fillRect(0, 0, w, h);

        this._drawMenuParticles(ctx, w, h);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (const line of this.introLines) {
            const t = this.introTimer - line.delay;
            if (t < 0) continue;

            let alpha = 0;
            if (t < 0.8) alpha = Utils.easeOutCubic(t / 0.8);
            else if (t < line.duration - 0.8) alpha = 1;
            else if (t < line.duration) alpha = 1 - Utils.easeOutCubic((t - (line.duration - 0.8)) / 0.8);

            if (alpha <= 0) continue;

            ctx.save();
            ctx.globalAlpha = alpha;

            if (line.text === "for you, Abeer") {
                ctx.font = 'italic 600 28px "Quicksand", sans-serif';
                ctx.fillStyle = CONFIG.COLORS.ACCENT;
                ctx.shadowColor = CONFIG.COLORS.ACCENT;
                ctx.shadowBlur = 30;
                ctx.fillText(line.text, w / 2, h / 2);
                ctx.shadowBlur = 0;
            } else {
                ctx.font = '300 19px "Quicksand", sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.75)';
                ctx.fillText(line.text, w / 2, h / 2);
            }

            ctx.restore();
        }

        if (this.introTimer > 1.5) {
            ctx.save();
            ctx.globalAlpha = 0.25;
            ctx.font = '300 12px "Quicksand", sans-serif';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText('tap to skip', w / 2, h - 50);
            ctx.restore();
        }
    },

    // ── Title Screen ──

    updateTitle(dt) {
        this.titleAlpha = Math.min(1, this.titleAlpha + dt * 0.6);
        this.titlePulse += dt;
        this.promptPulse += dt * 2;
        if (this.titleAlpha >= 0.9) this.titleReady = true;
        this.promptAlpha = this.titleReady ? 0.4 + Math.sin(this.promptPulse) * 0.3 : 0;
        this._updateMenuParticles();
    },

    drawTitle(ctx, w, h) {
        this._drawMenuParticles(ctx, w, h);

        ctx.save();
        ctx.globalAlpha = this.titleAlpha;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const titleY = h * 0.26;

        // Decorative line above title
        const lineW = 60;
        ctx.strokeStyle = `rgba(255,158,196,${0.3 * this.titleAlpha})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(w / 2 - lineW, titleY - 45);
        ctx.lineTo(w / 2 + lineW, titleY - 45);
        ctx.stroke();

        ctx.fillStyle = `rgba(255,158,196,${0.5 * this.titleAlpha})`;
        ctx.font = '10px sans-serif';
        ctx.fillText('\u2726', w / 2, titleY - 55);

        // "Abeer" - large, glowing
        ctx.font = '700 38px "Quicksand", sans-serif';
        ctx.fillStyle = '#fff';
        ctx.shadowColor = CONFIG.COLORS.ACCENT;
        ctx.shadowBlur = 40;
        ctx.fillText('Abeer', w / 2, titleY);
        ctx.shadowBlur = 20;
        ctx.fillText('Abeer', w / 2, titleY);
        ctx.shadowBlur = 0;

        // "&"
        ctx.font = '300 15px "Quicksand", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText('&', w / 2, titleY + 30);

        // "The Infinite Aurora"
        ctx.font = '400 22px "Quicksand", sans-serif';
        ctx.fillStyle = CONFIG.COLORS.ACCENT;
        ctx.shadowColor = CONFIG.COLORS.ACCENT;
        ctx.shadowBlur = 20;
        ctx.fillText('The Infinite Aurora', w / 2, titleY + 55);
        ctx.shadowBlur = 0;

        // Line below title
        ctx.strokeStyle = `rgba(255,158,196,${0.3 * this.titleAlpha})`;
        ctx.beginPath();
        ctx.moveTo(w / 2 - lineW, titleY + 78);
        ctx.lineTo(w / 2 + lineW, titleY + 78);
        ctx.stroke();

        // Subtitle
        ctx.font = 'italic 300 13px "Quicksand", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillText('A game made for you, by Shamil', w / 2, titleY + 102);

        // ── How to Play ──
        const howY = h * 0.53;
        ctx.font = '500 12px "Quicksand", sans-serif';
        ctx.fillStyle = 'rgba(255,158,196,0.55)';
        ctx.fillText('H O W   T O   P L A Y', w / 2, howY);

        ctx.font = '300 13px "Quicksand", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        const instructions = [
            '\u2B50  Drag to move Abeer left & right',
            '\u2764  Catch stars and hearts for points',
            '\u2601  Avoid the dark clouds!',
            '\u2709  Collect love letters for surprises!',
        ];
        instructions.forEach((text, i) => {
            ctx.fillText(text, w / 2, howY + 26 + i * 23);
        });

        // High score
        const highScore = Storage.getHighScore();
        const statsY = howY + 26 + instructions.length * 23 + 20;
        if (highScore > 0) {
            ctx.font = '400 13px "Quicksand", sans-serif';
            ctx.fillStyle = 'rgba(255,158,196,0.4)';
            ctx.fillText(`Best: ${Math.floor(highScore).toLocaleString()}`, w / 2, statsY);

            const letters = Storage.getCollectedLetters().length;
            if (letters > 0) {
                ctx.fillText(`\u2764 ${letters}/${CONFIG.COLLECTIBLES.TOTAL} letters`, w / 2, statsY + 22);
            }
        }

        // Play prompt
        ctx.globalAlpha = this.promptAlpha;
        ctx.font = '400 16px "Quicksand", sans-serif';
        ctx.fillStyle = '#fff';
        ctx.shadowColor = CONFIG.COLORS.ACCENT;
        ctx.shadowBlur = 15;
        ctx.fillText('Tap anywhere to play', w / 2, h * 0.89);
        ctx.shadowBlur = 0;

        ctx.restore();
    },

    // ── Tutorial Overlay ──

    updateTutorial(dt) {
        this.tutorialTimer += dt;
        if (this.tutorialTimer < 0.5) {
            this.tutorialAlpha = Utils.easeOutCubic(this.tutorialTimer / 0.5);
        } else if (this.tutorialTimer > 4) {
            this.tutorialAlpha = Math.max(0, 1 - (this.tutorialTimer - 4) / 1);
        }
        if (this.tutorialTimer > 5) {
            this.tutorialShown = true;
        }
    },

    drawTutorial(ctx, w, h) {
        if (this.tutorialShown || this.tutorialAlpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = this.tutorialAlpha * 0.6;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Drag hint
        ctx.font = '500 16px "Quicksand", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText('\u25C0  Drag to move  \u25B6', w / 2, h * 0.65);

        ctx.font = '300 12px "Quicksand", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillText('Catch the stars, avoid the clouds!', w / 2, h * 0.65 + 24);

        ctx.restore();
    },

    // ── Game Over ──

    startGameOver(score, time, lettersThisRun, isNewHighScore, maxCombo) {
        this.gameOverAlpha = 0;
        this.gameOverTimer = 0;
        this.showRestart = false;
        this.gameOverData = { score, time, lettersThisRun, isNewHighScore, maxCombo };
    },

    updateGameOver(dt) {
        this.gameOverTimer += dt;
        this.gameOverAlpha = Math.min(1, this.gameOverTimer * 0.6);
        this._updateMenuParticles();
        if (this.gameOverTimer > 2.5) {
            this.showRestart = true;
        }
    },

    drawGameOver(ctx, w, h) {
        if (!this.gameOverData) return;
        const data = this.gameOverData;
        const t = this.gameOverTimer;

        ctx.save();

        // Dark gradient overlay
        const overlayGrad = ctx.createLinearGradient(0, 0, 0, h);
        overlayGrad.addColorStop(0, `rgba(5, 0, 16, ${this.gameOverAlpha * 0.85})`);
        overlayGrad.addColorStop(0.5, `rgba(10, 2, 25, ${this.gameOverAlpha * 0.75})`);
        overlayGrad.addColorStop(1, `rgba(5, 0, 16, ${this.gameOverAlpha * 0.85})`);
        ctx.fillStyle = overlayGrad;
        ctx.fillRect(0, 0, w, h);

        this._drawMenuParticles(ctx, w, h);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const centerY = h * 0.3;

        // Staggered reveal helper
        const reveal = (delay) => {
            const localT = t - delay;
            if (localT <= 0) return 0;
            return Math.min(1, localT * 2) * this.gameOverAlpha;
        };
        const revealScale = (delay) => {
            const localT = t - delay;
            if (localT <= 0) return 0.9;
            return 0.9 + 0.1 * Utils.easeOutCubic(Math.min(1, localT * 2));
        };

        // Decorative sparkle (delay 0.3)
        let a = reveal(0.3);
        if (a > 0) {
            ctx.globalAlpha = a * 0.4;
            ctx.font = '12px sans-serif';
            ctx.fillStyle = CONFIG.COLORS.ACCENT;
            ctx.fillText('\u2726', w / 2, centerY - 30);
        }

        // Main message (delay 0.5)
        a = reveal(0.5);
        if (a > 0) {
            ctx.save();
            ctx.globalAlpha = a;
            const s = revealScale(0.5);
            ctx.translate(w / 2, centerY + 15);
            ctx.scale(s, s);
            ctx.translate(-w / 2, -(centerY + 15));
            ctx.font = 'italic 500 22px "Quicksand", sans-serif';
            ctx.fillStyle = CONFIG.COLORS.ACCENT;
            ctx.shadowColor = CONFIG.COLORS.ACCENT;
            ctx.shadowBlur = 25;
            ctx.fillText('The stars will wait', w / 2, centerY);
            ctx.fillText('for you, Abeer', w / 2, centerY + 30);
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        // Line (delay 1.0)
        a = reveal(1.0);
        if (a > 0) {
            ctx.globalAlpha = a * 0.25;
            ctx.strokeStyle = CONFIG.COLORS.ACCENT;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(w / 2 - 50, centerY + 55);
            ctx.lineTo(w / 2 + 50, centerY + 55);
            ctx.stroke();
        }

        // Score (delay 1.2)
        a = reveal(1.2);
        if (a > 0) {
            ctx.save();
            ctx.globalAlpha = a;
            const s = revealScale(1.2);
            ctx.translate(w / 2, centerY + 95);
            ctx.scale(s, s);
            ctx.translate(-w / 2, -(centerY + 95));
            ctx.font = '400 24px "Quicksand", sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.fillText(`${Math.floor(data.score).toLocaleString()}`, w / 2, centerY + 85);
            ctx.font = '300 12px "Quicksand", sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.fillText('score', w / 2, centerY + 105);
            ctx.restore();
        }

        // Time survived (delay 1.6)
        a = reveal(1.6);
        if (a > 0) {
            ctx.save();
            ctx.globalAlpha = a;
            const s = revealScale(1.6);
            ctx.translate(w / 2, centerY + 144);
            ctx.scale(s, s);
            ctx.translate(-w / 2, -(centerY + 144));
            const mins = Math.floor(data.time / 60);
            const secs = Math.floor(data.time % 60);
            const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
            ctx.font = '400 16px "Quicksand", sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.65)';
            ctx.fillText(timeStr, w / 2, centerY + 135);
            ctx.font = '300 12px "Quicksand", sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.fillText('time survived', w / 2, centerY + 153);
            ctx.restore();
        }

        // Max combo (delay 1.9)
        if (data.maxCombo >= 5) {
            a = reveal(1.9);
            if (a > 0) {
                ctx.globalAlpha = a;
                ctx.font = '400 14px "Quicksand", sans-serif';
                ctx.fillStyle = CONFIG.COLORS.STAR_GOLD;
                ctx.fillText(`Best combo: x${data.maxCombo}`, w / 2, centerY + 180);
            }
        }

        // Letters (delay 2.1)
        if (data.lettersThisRun > 0) {
            a = reveal(2.1);
            if (a > 0) {
                ctx.globalAlpha = a;
                ctx.font = '400 16px "Quicksand", sans-serif';
                ctx.fillStyle = CONFIG.COLORS.ACCENT;
                ctx.fillText(`\u2764 ${data.lettersThisRun} letter${data.lettersThisRun > 1 ? 's' : ''} found`, w / 2, centerY + 210);
            }
        }

        // New high score (delay 2.3)
        if (data.isNewHighScore) {
            a = reveal(2.3);
            if (a > 0) {
                const pulse = 0.7 + Math.sin(this.gameOverTimer * 3) * 0.3;
                ctx.globalAlpha = a * pulse;
                ctx.font = '600 17px "Quicksand", sans-serif';
                ctx.fillStyle = '#ffd700';
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 20;
                ctx.fillText('\u2605 New Best! \u2605', w / 2, centerY + 245);
                ctx.shadowBlur = 0;
            }
        }

        // Restart
        if (this.showRestart) {
            const restartAlpha = 0.4 + Math.sin(this.gameOverTimer * 2) * 0.3;
            ctx.globalAlpha = this.gameOverAlpha * restartAlpha;
            ctx.font = '400 16px "Quicksand", sans-serif';
            ctx.fillStyle = '#fff';
            ctx.shadowColor = CONFIG.COLORS.ACCENT;
            ctx.shadowBlur = 10;
            ctx.fillText('Tap to try again', w / 2, h * 0.88);
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    },

    // ── Star Map ──

    drawStarMap(ctx, w, h) {
        ctx.save();
        ctx.fillStyle = 'rgba(5, 0, 16, 0.96)';
        ctx.fillRect(0, 0, w, h);

        this._drawMenuParticles(ctx, w, h);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.font = '500 22px "Quicksand", sans-serif';
        ctx.fillStyle = CONFIG.COLORS.ACCENT;
        ctx.shadowColor = CONFIG.COLORS.ACCENT;
        ctx.shadowBlur = 20;
        ctx.fillText("Abeer's Star Map", w / 2, 55);
        ctx.shadowBlur = 0;

        const collected = Storage.getCollectedLetters();
        const total = CONFIG.COLLECTIBLES.TOTAL;

        const heartPoints = this._getHeartPoints(total, w / 2, h * 0.45, Math.min(w, h) * 0.3);

        for (let i = 0; i < total; i++) {
            const pt = heartPoints[i];
            const isCollected = collected.includes(i);

            if (isCollected) {
                ctx.fillStyle = CONFIG.COLORS.ACCENT;
                ctx.shadowColor = CONFIG.COLORS.ACCENT;
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                if (i > 0 && collected.includes(i - 1)) {
                    const prev = heartPoints[i - 1];
                    ctx.strokeStyle = 'rgba(255,158,196,0.25)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(prev.x, prev.y);
                    ctx.lineTo(pt.x, pt.y);
                    ctx.stroke();
                }
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0.12)';
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.font = '300 14px "Quicksand", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillText(`${collected.length} / ${total} stars discovered`, w / 2, h * 0.78);

        if (collected.length >= total) {
            ctx.font = 'italic 500 17px "Quicksand", sans-serif';
            ctx.fillStyle = CONFIG.COLORS.ACCENT;
            ctx.shadowColor = CONFIG.COLORS.ACCENT;
            ctx.shadowBlur = 25;
            ctx.fillText('Every star shines for you, Abeer \u2764', w / 2, h * 0.85);
            ctx.shadowBlur = 0;
        }

        ctx.font = '300 12px "Quicksand", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillText('tap to close', w / 2, h - 45);

        ctx.restore();
    },

    _getHeartPoints(count, cx, cy, size) {
        const points = [];
        for (let i = 0; i < count; i++) {
            const t = (i / count) * Math.PI * 2 - Math.PI / 2;
            const x = 16 * Math.pow(Math.sin(t), 3);
            const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
            points.push({
                x: cx + (x / 16) * size,
                y: cy + (y / 16) * size,
            });
        }
        return points;
    },
};
