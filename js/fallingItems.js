// ── Falling Items System (Core Game Mechanic) ──

const FallingItems = {
    items: [],
    spawnTimer: 0,
    letterTimer: 0,
    gameTime: 0,
    combo: 0,
    maxCombo: 0,
    nextLetterIndex: 0,

    init() {
        this.items = [];
        this.spawnTimer = 0;
        this.letterTimer = 0;
        this.gameTime = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.nextLetterIndex = 0;
    },

    update(dt, player, worldHeight) {
        this.gameTime += dt;

        // Spawn regular items
        this.spawnTimer += dt;
        const interval = this._getSpawnInterval();
        if (this.spawnTimer >= interval) {
            this.spawnTimer = 0;
            this._spawnItem(worldHeight);
        }

        // Spawn love letters on timer
        this.letterTimer += dt;
        const letterDelay = this.nextLetterIndex === 0 ? CONFIG.SPAWN.LETTER_FIRST_DELAY : CONFIG.SPAWN.LETTER_INTERVAL;
        if (this.letterTimer >= letterDelay && this.nextLetterIndex < LoveLetters.length) {
            const collected = Storage.getCollectedLetters();
            if (!collected.includes(this.nextLetterIndex)) {
                this._spawnLetter(worldHeight);
            }
            this.nextLetterIndex++;
            this.letterTimer = 0;
        }

        // Update items
        const speedMult = this._getSpeedMultiplier();
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];

            // Fall
            item.y += item.speed * speedMult * dt;

            // Wobble
            item.wobblePhase += item.wobbleSpeed * dt;
            item.visualX = item.x + Math.sin(item.wobblePhase) * item.wobbleAmount;

            // Glow / bob animation
            item.animPhase += 3.5 * dt;

            // Emit trail particles (not for clouds)
            if (item.type !== 'cloud') {
                item.trailTimer += dt;
                if (item.trailTimer > 0.08) {
                    item.trailTimer = 0;
                    Particles.emitTrail(item.visualX, item.y, item.type);
                }
            }

            // Check collision with player
            const dx = Math.abs(player.x - item.visualX);
            const dy = Math.abs(player.y - item.y);
            const catchDist = CONFIG.PLAYER.CATCH_RADIUS + item.size * 0.5;

            if (dx < catchDist && dy < catchDist * 1.2) {
                this._onCatch(item, player);
                this.items.splice(i, 1);
                continue;
            }

            // Remove if below screen
            if (item.y > worldHeight + 60) {
                if (item.type !== 'cloud') {
                    this._onMiss(item);
                }
                this.items.splice(i, 1);
            }
        }
    },

    _getSpawnInterval() {
        const progress = Math.min(this.gameTime * CONFIG.SPAWN.ACCELERATION, 1);
        return Utils.lerp(CONFIG.SPAWN.BASE_INTERVAL, CONFIG.SPAWN.MIN_INTERVAL, progress);
    },

    _getSpeedMultiplier() {
        const progress = Math.min(this.gameTime / 180, 1); // Maxes out at 3 minutes
        return 1 + progress * CONFIG.SPAWN.SPEED_INCREASE;
    },

    _spawnItem(worldHeight) {
        // Weighted random selection
        const types = CONFIG.ITEMS;
        const totalWeight = types.STAR.weight + types.HEART.weight + types.CLOUD.weight;
        let roll = Math.random() * totalWeight;

        let type, cfg;
        if (roll < types.STAR.weight) {
            type = 'star';
            cfg = types.STAR;
        } else if (roll < types.STAR.weight + types.HEART.weight) {
            type = 'heart';
            cfg = types.HEART;
        } else {
            type = 'cloud';
            cfg = types.CLOUD;
        }

        const margin = cfg.size + 10;
        this.items.push({
            type,
            x: Utils.randFloat(margin, CONFIG.WORLD_WIDTH - margin),
            y: -cfg.size,
            visualX: 0,
            speed: Utils.randFloat(cfg.minSpeed, cfg.maxSpeed),
            size: cfg.size,
            points: cfg.points,
            wobblePhase: Math.random() * Math.PI * 2,
            wobbleSpeed: Utils.randFloat(2, 5),
            wobbleAmount: Utils.randFloat(3, 12),
            animPhase: Math.random() * Math.PI * 2,
            letterIndex: -1,
            trailTimer: 0,
        });
    },

    _spawnLetter(worldHeight) {
        const cfg = CONFIG.ITEMS.LETTER;
        const margin = cfg.size + 10;
        this.items.push({
            type: 'letter',
            x: Utils.randFloat(margin, CONFIG.WORLD_WIDTH - margin),
            y: -cfg.size,
            visualX: 0,
            speed: Utils.randFloat(cfg.minSpeed, cfg.maxSpeed),
            size: cfg.size,
            points: cfg.points,
            wobblePhase: Math.random() * Math.PI * 2,
            wobbleSpeed: Utils.randFloat(1.5, 3),
            wobbleAmount: Utils.randFloat(5, 15),
            animPhase: Math.random() * Math.PI * 2,
            letterIndex: this.nextLetterIndex,
            trailTimer: 0,
        });
    },

    _onCatch(item, player) {
        if (item.type === 'cloud') {
            // Cloud = damage
            this.combo = 0;
            player.onHit();
            Game.loseLife();
            Particles.emitBurst(item.visualX, item.y, 8, CONFIG.COLORS.CLOUD_DARK, 2);
            Screens.startShake(4, 0.2);
            GameAudio.playMiss();
            return { type: 'hit' };
        }

        // Good item caught
        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        player.onCatch();

        // Particles
        const color = item.type === 'heart' ? CONFIG.COLORS.ACCENT : CONFIG.COLORS.STAR_GOLD;
        if (item.type === 'letter') {
            Particles.emitHearts(item.visualX, item.y, 15);
        } else {
            Particles.emitBurst(item.visualX, item.y, 10, color, 2.5);
            Particles.emitCatchRing(item.visualX, item.y, color);
        }

        // Combo milestone celebrations
        if (CONFIG.COMBO.MILESTONES.includes(this.combo)) {
            const worldH = Canvas.getWorldHeight();
            const intensity = this.combo >= 50 ? 'mega' : this.combo >= 20 ? 'big' : 'normal';
            Particles.emitComboMilestone(CONFIG.WORLD_WIDTH, worldH, intensity);
            Game.flashAlpha = intensity === 'mega' ? 0.5 : intensity === 'big' ? 0.35 : 0.2;
            Game.flashColor = '#ffe566';
            Screens.startShake(intensity === 'mega' ? 8 : intensity === 'big' ? 5 : 3, 0.3);
        }

        // Score
        let points = item.points;
        const comboMultiplier = 1 + Math.floor(this.combo / 5) * 0.2;
        points = Math.floor(points * comboMultiplier);

        Game.addScore(points, item.visualX, item.y, item.type);

        // Sound
        if (item.type === 'letter') {
            GameAudio.playCollect();
            // Trigger love letter collection
            Collectibles.triggerLetter(item.letterIndex);
        } else if (this.combo > 0 && this.combo % 5 === 0) {
            GameAudio.playPerfect();
        } else {
            GameAudio.playCatch();
        }

        return { type: 'catch', points };
    },

    _onMiss(item) {
        // Missing a good item resets combo
        if (item.type === 'star' || item.type === 'heart') {
            this.combo = 0;
        }
    },

    draw(ctx, worldHeight) {
        for (const item of this.items) {
            if (item.y < -item.size * 2 || item.y > worldHeight + item.size * 2) continue;

            const x = item.visualX;
            const y = item.y;
            const pulse = 0.85 + Math.sin(item.animPhase) * 0.15;

            ctx.save();

            if (item.type === 'star') {
                this._drawStar(ctx, x, y, item.size * pulse, item.animPhase);
            } else if (item.type === 'heart') {
                this._drawHeart(ctx, x, y, item.size * pulse, item.animPhase);
            } else if (item.type === 'cloud') {
                this._drawCloud(ctx, x, y, item.size * pulse, item.animPhase);
            } else if (item.type === 'letter') {
                this._drawLetter(ctx, x, y, item.size * pulse, item.animPhase);
            }

            ctx.restore();
        }
    },

    _drawStar(ctx, x, y, size, phase) {
        const s = size / 2;
        const rot = phase * 0.4;

        // Outer glow (bigger, softer)
        const grad = ctx.createRadialGradient(x, y, 0, x, y, size * 1.5);
        grad.addColorStop(0, 'rgba(255,229,102,0.3)');
        grad.addColorStop(0.5, 'rgba(255,229,102,0.1)');
        grad.addColorStop(1, 'rgba(255,229,102,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(x - size * 1.5, y - size * 1.5, size * 3, size * 3);

        // Rotating star shape
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.fillStyle = CONFIG.COLORS.STAR_GOLD;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
            const outerX = Math.cos(angle) * s;
            const outerY = Math.sin(angle) * s;
            if (i === 0) ctx.moveTo(outerX, outerY);
            else ctx.lineTo(outerX, outerY);

            const innerAngle = angle + Math.PI / 5;
            const innerX = Math.cos(innerAngle) * s * 0.4;
            const innerY = Math.sin(innerAngle) * s * 0.4;
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();

        // Inner bright core
        const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.4);
        coreGrad.addColorStop(0, 'rgba(255,255,255,0.7)');
        coreGrad.addColorStop(0.5, 'rgba(255,245,200,0.3)');
        coreGrad.addColorStop(1, 'rgba(255,229,102,0)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Light rays (cross)
        const rayAlpha = 0.15 + Math.sin(phase * 2) * 0.1;
        ctx.strokeStyle = `rgba(255,245,200,${rayAlpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.8, y);
        ctx.lineTo(x + size * 0.8, y);
        ctx.moveTo(x, y - size * 0.8);
        ctx.lineTo(x, y + size * 0.8);
        ctx.stroke();
    },

    _drawHeart(ctx, x, y, size, phase) {
        const s = size / 2;

        // Outer glow (layered for richness)
        const grad = ctx.createRadialGradient(x, y, 0, x, y, size * 1.4);
        grad.addColorStop(0, 'rgba(255,158,196,0.35)');
        grad.addColorStop(0.4, 'rgba(255,158,196,0.12)');
        grad.addColorStop(1, 'rgba(255,158,196,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(x - size * 1.4, y - size * 1.4, size * 2.8, size * 2.8);

        // Slight bob rotation
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.sin(phase * 0.7) * 0.12);

        // Heart shape
        ctx.fillStyle = CONFIG.COLORS.ACCENT;
        ctx.beginPath();
        ctx.moveTo(0, s * 0.4);
        ctx.bezierCurveTo(0, -s * 0.3, -s, -s * 0.7, -s, -s * 0.1);
        ctx.bezierCurveTo(-s, s * 0.5, 0, s * 0.8, 0, s);
        ctx.bezierCurveTo(0, s * 0.8, s, s * 0.5, s, -s * 0.1);
        ctx.bezierCurveTo(s, -s * 0.7, 0, -s * 0.3, 0, s * 0.4);
        ctx.fill();

        // Gradient sheen
        const sheen = ctx.createLinearGradient(-s * 0.5, -s * 0.5, s * 0.5, s * 0.5);
        sheen.addColorStop(0, 'rgba(255,255,255,0.25)');
        sheen.addColorStop(0.5, 'rgba(255,255,255,0)');
        sheen.addColorStop(1, 'rgba(200,80,130,0.15)');
        ctx.fillStyle = sheen;
        ctx.fill();

        // Highlight spot
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.ellipse(-s * 0.3, -s * 0.25, s * 0.18, s * 0.28, -0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    },

    _drawCloud(ctx, x, y, size, phase) {
        const s = size / 2;

        // Menacing dark aura
        const auraGrad = ctx.createRadialGradient(x, y, 0, x, y, size);
        auraGrad.addColorStop(0, 'rgba(60,20,50,0.15)');
        auraGrad.addColorStop(1, 'rgba(40,10,40,0)');
        ctx.fillStyle = auraGrad;
        ctx.fillRect(x - size, y - size, size * 2, size * 2);

        // Dark blob
        ctx.fillStyle = CONFIG.COLORS.CLOUD_DARK;
        ctx.globalAlpha = 0.85;

        // Four overlapping circles for fluffier cloud
        ctx.beginPath();
        ctx.arc(x, y - s * 0.2, s * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x - s * 0.4, y + s * 0.08, s * 0.48, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + s * 0.4, y + s * 0.08, s * 0.48, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y + s * 0.2, s * 0.42, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;

        // Angry eyebrows
        ctx.strokeStyle = '#8a4060';
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - s * 0.35, y - s * 0.25);
        ctx.lineTo(x - s * 0.1, y - s * 0.15);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + s * 0.35, y - s * 0.25);
        ctx.lineTo(x + s * 0.1, y - s * 0.15);
        ctx.stroke();

        // Angry eyes (red-ish tint)
        ctx.fillStyle = '#8a3050';
        ctx.beginPath();
        ctx.arc(x - s * 0.2, y - s * 0.05, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + s * 0.2, y - s * 0.05, 3, 0, Math.PI * 2);
        ctx.fill();

        // Evil eye glint
        ctx.fillStyle = 'rgba(255,100,100,0.5)';
        ctx.beginPath();
        ctx.arc(x - s * 0.18, y - s * 0.08, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + s * 0.18, y - s * 0.08, 1, 0, Math.PI * 2);
        ctx.fill();

        // Frown
        ctx.strokeStyle = '#6a3050';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y + s * 0.22, 3.5, Math.PI * 1.2, Math.PI * 1.8);
        ctx.stroke();
    },

    _drawLetter(ctx, x, y, size, phase) {
        const s = size / 2;

        // Big multi-layered glow
        const grad2 = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
        grad2.addColorStop(0, 'rgba(255,182,212,0.2)');
        grad2.addColorStop(0.5, 'rgba(255,182,212,0.05)');
        grad2.addColorStop(1, 'rgba(255,182,212,0)');
        ctx.fillStyle = grad2;
        ctx.fillRect(x - size * 2, y - size * 2, size * 4, size * 4);

        const grad = ctx.createRadialGradient(x, y, 0, x, y, size * 1.2);
        grad.addColorStop(0, 'rgba(255,200,220,0.35)');
        grad.addColorStop(0.6, 'rgba(255,182,212,0.1)');
        grad.addColorStop(1, 'rgba(255,182,212,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(x - size * 1.2, y - size * 1.2, size * 2.4, size * 2.4);

        // Gentle bob
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.sin(phase * 0.5) * 0.08);

        // Envelope body with rounded corners feel
        ctx.fillStyle = '#fff5f8';
        ctx.strokeStyle = CONFIG.COLORS.ACCENT;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-s + 2, -s * 0.6);
        ctx.lineTo(s - 2, -s * 0.6);
        ctx.quadraticCurveTo(s, -s * 0.6, s, -s * 0.6 + 2);
        ctx.lineTo(s, s * 0.6 - 2);
        ctx.quadraticCurveTo(s, s * 0.6, s - 2, s * 0.6);
        ctx.lineTo(-s + 2, s * 0.6);
        ctx.quadraticCurveTo(-s, s * 0.6, -s, s * 0.6 - 2);
        ctx.lineTo(-s, -s * 0.6 + 2);
        ctx.quadraticCurveTo(-s, -s * 0.6, -s + 2, -s * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Envelope flap
        ctx.fillStyle = '#ffe8f0';
        ctx.beginPath();
        ctx.moveTo(-s, -s * 0.6);
        ctx.lineTo(0, s * 0.1);
        ctx.lineTo(s, -s * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Heart seal (bigger, more detailed)
        ctx.fillStyle = CONFIG.COLORS.ACCENT;
        const hs = 6;
        ctx.beginPath();
        ctx.moveTo(0, hs * 0.4 - s * 0.15);
        const hsy = -s * 0.15;
        ctx.bezierCurveTo(0, hsy - hs * 0.2, -hs, hsy - hs * 0.5, -hs, hsy + hs * 0.05);
        ctx.bezierCurveTo(-hs, hsy + hs * 0.4, 0, hsy + hs * 0.7, 0, hsy + hs);
        ctx.bezierCurveTo(0, hsy + hs * 0.7, hs, hsy + hs * 0.4, hs, hsy + hs * 0.05);
        ctx.bezierCurveTo(hs, hsy - hs * 0.5, 0, hsy - hs * 0.2, 0, hs * 0.4 - s * 0.15);
        ctx.fill();

        // Heart seal highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.ellipse(-hs * 0.25, hsy - hs * 0.1, hs * 0.2, hs * 0.15, -0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Orbiting sparkles (more, varied sizes)
        for (let i = 0; i < 5; i++) {
            const angle = phase * 1.2 + (Math.PI * 2 / 5) * i;
            const orbitR = size * (0.8 + i * 0.1);
            const sx = x + Math.cos(angle) * orbitR;
            const sy = y + Math.sin(angle) * orbitR * 0.6;
            const sparkleAlpha = 0.3 + Math.sin(phase * 2 + i) * 0.25;
            const sparkleSize = 1.5 + (i % 2) * 1;
            ctx.fillStyle = `rgba(255,200,225,${sparkleAlpha})`;
            ctx.beginPath();
            ctx.arc(sx, sy, sparkleSize, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    getCombo() { return this.combo; },
    getMaxCombo() { return this.maxCombo; },
};
