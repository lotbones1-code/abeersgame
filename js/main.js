// ── Main Game Loop (Catcher Game) ──

const Game = {
    // States
    STATE: {
        INTRO: 'intro',
        TITLE: 'title',
        PLAYING: 'playing',
        GAME_OVER: 'game_over',
    },

    state: 'intro',
    time: 0,
    score: 0,
    lives: CONFIG.LIVES.STARTING,

    // Stars background
    stars: [],

    // Nebulae
    nebulae: [],

    // Ambient floating motes
    motes: [],

    // Shooting stars
    shootingStars: [],
    shootingStarTimer: 0,

    // Timing
    lastTime: 0,

    // Slow motion
    slowMoScale: 1,
    slowMoTimer: 0,

    // Previous zone (for transition effects)
    prevZoneName: '',

    // Screen flash
    flashAlpha: 0,
    flashColor: '#ffffff',

    // Parallax
    parallaxX: 0,

    init() {
        Canvas.init();
        Input.init();
        GameAudio.init();
        Particles.init();
        Aurora.init();
        Screens.init();

        // Generate stars
        this.stars = [];
        for (let i = 0; i < CONFIG.VISUAL.STAR_COUNT; i++) {
            this.stars.push({
                x: Math.random(),
                y: Math.random(),
                size: Utils.randFloat(0.3, 2.2),
                twinkleSpeed: Utils.randFloat(0.8, 3.5),
                twinklePhase: Math.random() * Math.PI * 2,
                brightness: Utils.randFloat(0.2, 0.9),
                hue: Utils.randChoice([0, 0, 0, 210, 280, 340]),
            });
        }

        // Generate nebulae
        this.nebulae = [];
        for (let i = 0; i < (CONFIG.VISUAL.NEBULA_COUNT || 5); i++) {
            this.nebulae.push({
                x: Math.random(),
                y: Math.random(),
                radius: Utils.randFloat(0.1, 0.3),
                alpha: Utils.randFloat(0.03, 0.08),
                hue: Utils.randChoice([280, 320, 200, 250, 340]),
                driftX: Utils.randFloat(-0.0012, 0.0012),
                driftY: Utils.randFloat(-0.0012, 0.0012),
            });
        }

        // Generate ambient floating motes
        this.motes = [];
        for (let i = 0; i < (CONFIG.VISUAL.AMBIENT_MOTES || 40); i++) {
            this.motes.push({
                x: Math.random(),
                y: Math.random(),
                size: Utils.randFloat(0.8, 2.5),
                speed: Utils.randFloat(0.005, 0.02),
                wobbleSpeed: Utils.randFloat(0.5, 2),
                wobbleAmt: Utils.randFloat(0.005, 0.02),
                phase: Math.random() * Math.PI * 2,
                alpha: Utils.randFloat(0.1, 0.4),
                hue: Utils.randChoice([320, 280, 210, 45, 0]),
            });
        }

        // Check if first launch
        if (Storage.isFirstLaunch()) {
            this.state = this.STATE.INTRO;
        } else {
            this.state = this.STATE.TITLE;
        }

        // Start the loop
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    },

    loop(timestamp) {
        requestAnimationFrame((t) => this.loop(t));

        let dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        if (dt > CONFIG.MAX_DT) dt = CONFIG.MAX_DT;

        // Apply slow motion
        if (this.slowMoTimer > 0) {
            this.slowMoTimer -= dt;
            this.slowMoScale = Utils.lerp(1, CONFIG.COLLECTIBLES.SLOW_MO_SCALE, Utils.clamp(this.slowMoTimer / (CONFIG.COLLECTIBLES.SLOW_MO_DURATION / 1000), 0, 1));
        } else {
            this.slowMoScale = 1;
        }

        const gameDt = dt * this.slowMoScale;

        this.update(gameDt, dt);
        this.render();
    },

    update(gameDt, realDt) {
        this.time += gameDt;
        Screens.updateShake(realDt);

        // Update screen flash
        if (this.flashAlpha > 0) {
            this.flashAlpha -= realDt * 1.5;
            if (this.flashAlpha < 0) this.flashAlpha = 0;
        }

        switch (this.state) {
            case this.STATE.INTRO:
                this._updateIntro(realDt);
                break;
            case this.STATE.TITLE:
                this._updateTitle(realDt);
                break;
            case this.STATE.PLAYING:
                this._updatePlaying(gameDt, realDt);
                break;
            case this.STATE.GAME_OVER:
                this._updateGameOver(realDt);
                break;
        }

        Aurora.update(realDt);
        Particles.update(gameDt);

        // Drift nebulae
        for (const n of this.nebulae) {
            n.x += n.driftX;
            n.y += n.driftY;
            if (n.x < -0.2) n.x = 1.2;
            if (n.x > 1.2) n.x = -0.2;
            if (n.y < -0.2) n.y = 1.2;
            if (n.y > 1.2) n.y = -0.2;
        }

        // Drift ambient motes
        for (const m of this.motes) {
            m.phase += realDt * m.wobbleSpeed;
            m.y -= m.speed * realDt;
            m.x += Math.sin(m.phase) * m.wobbleAmt * realDt * 60;
            if (m.y < -0.05) { m.y = 1.05; m.x = Math.random(); }
            if (m.x < -0.05) m.x = 1.05;
            if (m.x > 1.05) m.x = -0.05;
        }

        // Update shooting stars
        this._updateShootingStars(realDt);
    },

    _updateShootingStars(dt) {
        this.shootingStarTimer += dt;
        if (this.shootingStarTimer > Utils.randFloat(4, 12)) {
            this.shootingStarTimer = 0;
            const w = Canvas.width;
            const h = Canvas.height;
            this.shootingStars.push({
                x: Utils.randFloat(w * 0.1, w * 0.9),
                y: Utils.randFloat(0, h * 0.35),
                angle: Utils.randFloat(0.3, 0.8),
                speed: Utils.randFloat(400, 800),
                life: 1.0,
                maxLife: 1.0,
                length: Utils.randFloat(40, 100),
            });
        }
        for (let i = this.shootingStars.length - 1; i >= 0; i--) {
            const s = this.shootingStars[i];
            s.life -= dt;
            s.x += Math.cos(s.angle) * s.speed * dt;
            s.y += Math.sin(s.angle) * s.speed * dt;
            if (s.life <= 0) this.shootingStars.splice(i, 1);
        }
    },

    _updateIntro(dt) {
        Screens.updateIntro(dt);

        if (Screens.introDone || (Input.anyKeyPressed && Screens.introTimer > 0.5)) {
            Input.consumeAnyKey();
            Storage.markLaunched();
            this.state = this.STATE.TITLE;
            Screens.titleAlpha = 0;
        }
    },

    _updateTitle(dt) {
        Screens.updateTitle(dt);

        if (Input.anyKeyPressed && Screens.titleReady) {
            Input.consumeAnyKey();
            this._startGame();
        }
    },

    _startGame() {
        this.state = this.STATE.PLAYING;
        this.time = 0;
        this.score = 0;
        this.lives = CONFIG.LIVES.STARTING;
        this.prevZoneName = '';
        this.parallaxX = 0;

        // Init game systems
        const worldH = Canvas.getWorldHeight();
        const playerY = worldH * CONFIG.PLAYER.Y_POSITION;
        Player.init(CONFIG.WORLD_WIDTH / 2, playerY);

        FallingItems.init();
        Collectibles.init();
        Particles.clear();
        HUD.init();
        HUD.setLives(this.lives);
        HUD.show();

        // Reset tutorial
        Screens.tutorialShown = false;
        Screens.tutorialAlpha = 0;
        Screens.tutorialTimer = 0;

        // Audio
        GameAudio.ensureContext();
        GameAudio.startMusic();
        GameAudio.showMuteButton();

        Storage.incrementPlayCount();
    },

    _updatePlaying(dt, realDt) {
        // Update tutorial
        if (!Screens.tutorialShown) {
            Screens.updateTutorial(realDt);
        }

        const worldH = Canvas.getWorldHeight();

        // Update player
        Player.update(dt, Canvas.width, Canvas.scale);

        // Update parallax
        this.parallaxX = (Player.x / CONFIG.WORLD_WIDTH - 0.5) * 2;

        // Update falling items
        FallingItems.update(dt, Player, worldH);

        // Update collectibles (message display)
        Collectibles.update(dt);

        // Trigger slow-mo on new love letter
        if (Collectibles.activeMessage && Collectibles.messageTimer < 0.1) {
            this.slowMoTimer = CONFIG.COLLECTIBLES.SLOW_MO_DURATION / 1000;
        }

        // Update HUD
        HUD.setScore(this.score);
        HUD.setLives(this.lives);
        HUD.setCombo(FallingItems.getCombo());
        HUD.update(dt);

        // Zone transitions
        const currentZone = Zones.getZone(this.time);
        if (currentZone.name !== this.prevZoneName && this.prevZoneName !== '') {
            Particles.emitZoneTransition(CONFIG.WORLD_WIDTH, worldH);
            this.flashAlpha = 0.3;
            this.flashColor = currentZone.auroraColors ? currentZone.auroraColors[0] : '#ffffff';
        }
        this.prevZoneName = currentZone.name;

        // Update music
        GameAudio.updateMusic(dt);

        // Game over check: no lives left
        if (this.lives <= 0) {
            this._gameOver();
        }
    },

    addScore(points, x, y, itemType) {
        this.score += points;
        const color = itemType === 'heart' ? CONFIG.COLORS.ACCENT :
                      itemType === 'letter' ? CONFIG.COLORS.ACCENT :
                      CONFIG.COLORS.STAR_GOLD;
        const text = itemType === 'letter' ? `\u2764 +${points}` : `+${points}`;
        HUD.addPopup(x, y, text, color);
    },

    loseLife() {
        this.lives--;
        HUD.setLives(this.lives);
    },

    _gameOver() {
        this.state = this.STATE.GAME_OVER;
        const isNewHighScore = Storage.setHighScore(this.score);

        Screens.startGameOver(
            this.score,
            this.time,
            Collectibles.getCollectedThisRun(),
            isNewHighScore,
            FallingItems.getMaxCombo()
        );

        Screens.startShake(6, 0.3);
        GameAudio.playGameOver();
        GameAudio.stopMusic();
        HUD.hide();
    },

    _updateGameOver(dt) {
        Screens.updateGameOver(dt);

        if (Input.anyKeyPressed && Screens.showRestart) {
            Input.consumeAnyKey();
            this.state = this.STATE.TITLE;
            Screens.titleAlpha = 0;
            Screens.titleReady = false;
            GameAudio.hideMuteButton();
        }
    },

    // ── Rendering ──

    render() {
        const ctx = Canvas.ctx;
        const w = Canvas.width;
        const h = Canvas.height;

        Canvas.clear();

        // Apply screen shake
        ctx.save();
        ctx.translate(Screens.shakeX, Screens.shakeY);

        // Draw sky background
        const skyColors = Zones.getSkyColors(this.time);
        Canvas.drawGradient(skyColors.top, skyColors.bottom, skyColors.mid);

        // Draw "Shamil ♥ Abeer" watermark in background
        this._drawWatermark(ctx, w, h);

        // Draw nebulae (with parallax)
        this._drawNebulae(ctx, w, h);

        // Draw stars (with parallax)
        this._drawStars(ctx, w, h);

        // Draw shooting stars
        this._drawShootingStars(ctx, w, h);

        // Draw aurora
        Aurora.draw(ctx, w, h, this.time);

        // Capture bloom after aurora (the brightest elements)
        Canvas.captureBloom();

        // Draw ambient floating motes (with parallax)
        this._drawMotes(ctx, w, h);

        // State-specific rendering
        switch (this.state) {
            case this.STATE.INTRO:
                Screens.drawIntro(ctx, w, h);
                break;

            case this.STATE.TITLE:
                Screens.drawTitle(ctx, w, h);
                break;

            case this.STATE.PLAYING:
                this._renderGame(ctx, w, h);
                break;

            case this.STATE.GAME_OVER:
                this._renderGame(ctx, w, h);
                Screens.drawGameOver(ctx, w, h);
                break;
        }

        // Composite bloom (additive glow over everything)
        Canvas.compositeBloom();

        // Screen flash overlay
        if (this.flashAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = this.flashAlpha;
            ctx.fillStyle = this.flashColor;
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        }

        // Vignette overlay
        const vignetteIntensity = this.state === this.STATE.GAME_OVER ?
            CONFIG.VISUAL.VIGNETTE_GAMEOVER : CONFIG.VISUAL.VIGNETTE_INTENSITY;
        Canvas.drawVignette(vignetteIntensity);

        ctx.restore(); // End screen shake
    },

    _renderGame(ctx, w, h) {
        // Scale to world coordinates
        Canvas.beginWorld();

        // Draw falling items
        FallingItems.draw(ctx, Canvas.getWorldHeight());

        // Draw player
        Player.draw(ctx);

        // Draw particles (in world space)
        Particles.draw(ctx);

        // Draw score popups
        HUD.drawPopups(ctx);

        Canvas.endWorld();

        // Draw love letter message (screen-space)
        Collectibles.drawMessage(ctx, w, h);

        // Draw tutorial overlay (screen-space)
        if (!Screens.tutorialShown) {
            Screens.drawTutorial(ctx, w, h);
        }
    },

    _drawStars(ctx, w, h) {
        const px = this.state === this.STATE.PLAYING || this.state === this.STATE.GAME_OVER ? this.parallaxX : 0;
        for (const star of this.stars) {
            const sy = star.y * h;
            // Parallax: smaller stars (farther) shift less
            const depthFactor = 1 - star.size / 2.5;
            const sx = star.x * w + px * -5 * depthFactor;

            const twinkle = star.brightness * (0.5 + 0.5 * Math.sin(this.time * star.twinkleSpeed + star.twinklePhase));

            // Soft halo for bright stars
            if (star.brightness > 0.6 && star.size > 1.2 && twinkle > 0.35) {
                const haloR = star.size * 4;
                const haloGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, haloR);
                if (star.hue === 0) {
                    haloGrad.addColorStop(0, `rgba(200,210,255,${twinkle * 0.08})`);
                } else {
                    haloGrad.addColorStop(0, Utils.hsl(star.hue, 40, 80, twinkle * 0.08));
                }
                haloGrad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = haloGrad;
                ctx.fillRect(sx - haloR, sy - haloR, haloR * 2, haloR * 2);
            }

            if (star.hue === 0) {
                ctx.fillStyle = `rgba(255,255,255,${twinkle})`;
            } else {
                ctx.fillStyle = Utils.hsl(star.hue, 60, 80, twinkle);
            }
            ctx.beginPath();
            ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
            ctx.fill();

            // Cross sparkle on brightest stars
            if (star.brightness > 0.75 && star.size > 1.6 && twinkle > 0.5) {
                ctx.strokeStyle = `rgba(255,255,255,${twinkle * 0.25})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(sx - star.size * 2.5, sy);
                ctx.lineTo(sx + star.size * 2.5, sy);
                ctx.moveTo(sx, sy - star.size * 2.5);
                ctx.lineTo(sx, sy + star.size * 2.5);
                ctx.stroke();
            }
        }
    },

    _drawNebulae(ctx, w, h) {
        const px = this.state === this.STATE.PLAYING || this.state === this.STATE.GAME_OVER ? this.parallaxX : 0;
        for (const n of this.nebulae) {
            const x = n.x * w + px * -15;
            const y = n.y * h;
            const r = n.radius * Math.max(w, h);

            const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
            grad.addColorStop(0, Utils.hsl(n.hue, 50, 40, n.alpha));
            grad.addColorStop(0.5, Utils.hsl(n.hue, 40, 30, n.alpha * 0.4));
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(x - r, y - r, r * 2, r * 2);
        }
    },

    _drawWatermark(ctx, w, h) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Gentle drift so it feels alive
        const drift = Math.sin(this.time * 0.15) * 8;
        const pulse = 0.03 + Math.sin(this.time * 0.4) * 0.01;

        ctx.globalAlpha = pulse;
        ctx.font = '600 42px "Quicksand", sans-serif';
        ctx.fillStyle = 'rgba(255,158,196,1)';
        ctx.fillText('Shamil \u2665 Abeer', w / 2 + drift, h * 0.42);

        // Subtle glow version behind
        ctx.globalAlpha = pulse * 0.6;
        ctx.shadowColor = 'rgba(255,158,196,0.5)';
        ctx.shadowBlur = 40;
        ctx.fillText('Shamil \u2665 Abeer', w / 2 + drift, h * 0.42);
        ctx.shadowBlur = 0;

        ctx.restore();
    },

    _drawMotes(ctx, w, h) {
        const px = this.state === this.STATE.PLAYING || this.state === this.STATE.GAME_OVER ? this.parallaxX : 0;
        for (const m of this.motes) {
            const mx = m.x * w + px * -20;
            const my = m.y * h;
            const pulse = 0.6 + 0.4 * Math.sin(this.time * 2 + m.phase);
            const a = m.alpha * pulse;

            if (m.hue === 0) {
                ctx.fillStyle = `rgba(255,255,255,${a})`;
            } else {
                ctx.fillStyle = Utils.hsl(m.hue, 60, 80, a);
            }
            ctx.beginPath();
            ctx.arc(mx, my, m.size, 0, Math.PI * 2);
            ctx.fill();

            // Soft glow around brighter motes
            if (m.size > 1.5) {
                const gGrad = ctx.createRadialGradient(mx, my, 0, mx, my, m.size * 4);
                if (m.hue === 0) {
                    gGrad.addColorStop(0, `rgba(255,255,255,${a * 0.15})`);
                } else {
                    gGrad.addColorStop(0, Utils.hsl(m.hue, 50, 70, a * 0.15));
                }
                gGrad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = gGrad;
                ctx.fillRect(mx - m.size * 4, my - m.size * 4, m.size * 8, m.size * 8);
            }
        }
    },

    _drawShootingStars(ctx, w, h) {
        for (const s of this.shootingStars) {
            const alpha = Utils.clamp(s.life / s.maxLife, 0, 1);
            const tailX = s.x - Math.cos(s.angle) * s.length;
            const tailY = s.y - Math.sin(s.angle) * s.length;
            const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
            grad.addColorStop(0, `rgba(255,255,255,0)`);
            grad.addColorStop(0.7, `rgba(255,255,255,${alpha * 0.6})`);
            grad.addColorStop(1, `rgba(255,255,255,${alpha})`);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(s.x, s.y);
            ctx.stroke();

            // Bright head
            ctx.fillStyle = `rgba(255,255,255,${alpha})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    },
};

// ── Start the game ──
window.addEventListener('load', () => {
    Game.init();
});
