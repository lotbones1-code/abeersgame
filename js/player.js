// ── Player (Abeer) - Beautiful character ──

const Player = {
    x: 0,
    y: 0,
    vx: 0,
    width: CONFIG.PLAYER.WIDTH,
    height: CONFIG.PLAYER.HEIGHT,
    facingRight: true,

    // Animation
    squash: 1.0,
    stretch: 1.0,
    squashVel: 0,
    hairAngle: 0,
    hairVel: 0,
    sparkleTimer: 0,
    catchAnim: 0,
    breathe: 0,
    armWave: 0,

    // Expression system
    expression: 'neutral', // 'neutral' | 'happy' | 'hurt'
    expressionTimer: 0,

    // Hit flash
    hitFlash: 0,

    init(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.squash = 1.0;
        this.stretch = 1.0;
        this.squashVel = 0;
        this.hairAngle = 0;
        this.hairVel = 0;
        this.sparkleTimer = 0;
        this.catchAnim = 0;
        this.breathe = 0;
        this.armWave = 0;
        this.expression = 'neutral';
        this.expressionTimer = 0;
        this.hitFlash = 0;
    },

    update(dt, screenWidth, scale) {
        const cfg = CONFIG.PLAYER;
        let prevX = this.x;

        if (Input.targetX !== null) {
            const worldTargetX = Input.targetX / scale;
            const diff = worldTargetX - this.x;
            this.x += diff * cfg.SMOOTH_FACTOR * (dt * 60);
        } else {
            let moveDir = 0;
            if (Input.left) moveDir -= 1;
            if (Input.right) moveDir += 1;
            this.x += moveDir * cfg.MOVE_SPEED * dt;
        }

        const hw = this.width / 2;
        this.x = Utils.clamp(this.x, hw, CONFIG.WORLD_WIDTH - hw);

        this.vx = (this.x - prevX) / dt;
        if (Math.abs(this.vx) > 5) this.facingRight = this.vx > 0;

        // Squash/stretch spring
        const springK = 15;
        const damping = 0.75;
        this.squashVel += (1.0 - this.squash) * springK * dt;
        this.squashVel *= (1 - damping * dt * 10);
        this.squash += this.squashVel;
        this.stretch = 1.0 / this.squash;

        // Hair sway
        const targetAngle = -this.vx * 0.002;
        this.hairVel += (targetAngle - this.hairAngle) * 8 * dt;
        this.hairVel *= 0.90;
        this.hairAngle += this.hairVel;

        this.breathe += dt * 2.2;
        this.armWave += dt * (this.catchAnim > 0 ? 12 : 3);
        if (this.catchAnim > 0) this.catchAnim -= dt * 4;

        // Expression timer
        if (this.expressionTimer > 0) {
            this.expressionTimer -= dt;
            if (this.expressionTimer <= 0) this.expression = 'neutral';
        }

        // Hit flash decay
        if (this.hitFlash > 0) this.hitFlash -= dt * 5;

        this.sparkleTimer += dt;
        if (this.sparkleTimer > 0.12 && Math.random() < 0.4) {
            this.sparkleTimer = 0;
            Particles.emitSparkle(
                this.x + Utils.randFloat(-18, 18),
                this.y + Utils.randFloat(-10, this.height * 0.7),
            );
        }
    },

    onCatch() {
        this.squash = 0.7;
        this.catchAnim = 1.2;
        this.expression = 'happy';
        this.expressionTimer = 0.5;
    },

    onHit() {
        this.squash = 1.3;
        this.expression = 'hurt';
        this.expressionTimer = 0.6;
        this.hitFlash = 1.0;
    },

    draw(ctx) {
        const cfg = CONFIG.PLAYER;
        ctx.save();
        ctx.translate(this.x, this.y + this.height / 2);
        ctx.scale(this.squash, this.stretch);

        const hw = this.width / 2;
        const hh = this.height / 2;
        const br = Math.sin(this.breathe) * 0.6;

        // ── Soft glow aura ──
        const glow = ctx.createRadialGradient(0, -hh * 0.2, 0, 0, -hh * 0.2, hw * 2.5);
        glow.addColorStop(0, 'rgba(255,180,210,0.13)');
        glow.addColorStop(0.5, 'rgba(255,158,196,0.04)');
        glow.addColorStop(1, 'rgba(255,158,196,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(-hw * 2.5, -hh * 2.5, hw * 5, hh * 5);

        // ── Ground light ──
        const gl = ctx.createRadialGradient(0, hh + 2, 0, 0, hh + 2, hw * 1.3);
        gl.addColorStop(0, 'rgba(255,158,196,0.1)');
        gl.addColorStop(1, 'rgba(255,158,196,0)');
        ctx.fillStyle = gl;
        ctx.fillRect(-hw * 1.3, hh - 2, hw * 2.6, 14);

        // ── Hair behind (back layer) ──
        this._drawHairBack(ctx, hw, hh, br);

        // ── Arms ──
        this._drawArms(ctx, hw, hh, br, cfg);

        // ── Body / Dress ──
        this._drawDress(ctx, hw, hh, br, cfg);

        // ── Head ──
        const headR = hw * 0.48;
        const headY = -hh * 0.5 + br * 0.4;

        // Neck
        ctx.fillStyle = cfg.SKIN_COLOR;
        ctx.fillRect(-hw * 0.1, headY + headR * 0.7, hw * 0.2, hh * 0.12);

        // Head circle
        ctx.fillStyle = cfg.SKIN_COLOR;
        ctx.beginPath();
        ctx.arc(0, headY, headR, 0, Math.PI * 2);
        ctx.fill();

        // ── Hair front (bangs + sides) ──
        this._drawHairFront(ctx, hw, hh, headR, headY, br, cfg);

        // ── Face ──
        this._drawFace(ctx, headR, headY, cfg);

        // ── Hit flash red tint ──
        if (this.hitFlash > 0) {
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillStyle = `rgba(255, 60, 60, ${this.hitFlash * 0.4})`;
            ctx.fillRect(-hw * 2.5, -hh * 2.5, hw * 5, hh * 5);
            ctx.globalCompositeOperation = 'source-over';
        }

        ctx.restore();
    },

    _drawHairBack(ctx, hw, hh, br) {
        const cfg = CONFIG.PLAYER;
        const headY = -hh * 0.5 + br * 0.4;
        const headR = hw * 0.48;
        const sway = this.hairAngle * 8;

        ctx.fillStyle = cfg.HAIR_COLOR;

        // Left hair stream (behind body)
        ctx.beginPath();
        ctx.moveTo(-headR - 2, headY + headR * 0.3);
        ctx.quadraticCurveTo(
            -headR - 4 + sway * 0.5, headY + headR * 2,
            -headR - 1 + sway, headY + headR * 3.2
        );
        ctx.quadraticCurveTo(
            -headR + 4 + sway * 0.3, headY + headR * 3,
            -headR + 3, headY + headR * 1.5
        );
        ctx.closePath();
        ctx.fill();

        // Right hair stream
        ctx.beginPath();
        ctx.moveTo(headR + 2, headY + headR * 0.3);
        ctx.quadraticCurveTo(
            headR + 4 + sway * 0.5, headY + headR * 2,
            headR + 1 + sway, headY + headR * 3.2
        );
        ctx.quadraticCurveTo(
            headR - 4 + sway * 0.3, headY + headR * 3,
            headR - 3, headY + headR * 1.5
        );
        ctx.closePath();
        ctx.fill();

        // Center back hair
        ctx.beginPath();
        ctx.moveTo(-headR * 0.4, headY + headR * 0.5);
        ctx.quadraticCurveTo(
            sway * 0.3, headY + headR * 2.5,
            sway * 0.5, headY + headR * 3.5
        );
        ctx.quadraticCurveTo(
            headR * 0.2 + sway * 0.3, headY + headR * 3,
            headR * 0.4, headY + headR * 0.5
        );
        ctx.closePath();
        ctx.fill();
    },

    _drawArms(ctx, hw, hh, br, cfg) {
        const armSwing = Math.sin(this.armWave) * 0.2 + (this.catchAnim > 0 ? -0.4 : 0);
        const armLen = hh * 0.5;
        const shoulderY = -hh * 0.08 + br;

        ctx.strokeStyle = cfg.SKIN_COLOR;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        // Left arm
        ctx.save();
        ctx.translate(-hw * 0.38, shoulderY);
        ctx.rotate(-0.5 + armSwing);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-armLen * 0.2, -armLen * 0.9);
        ctx.stroke();
        ctx.fillStyle = cfg.SKIN_COLOR;
        ctx.beginPath();
        ctx.arc(-armLen * 0.2, -armLen * 0.9, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Right arm
        ctx.save();
        ctx.translate(hw * 0.38, shoulderY);
        ctx.rotate(0.5 - armSwing);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(armLen * 0.2, -armLen * 0.9);
        ctx.stroke();
        ctx.fillStyle = cfg.SKIN_COLOR;
        ctx.beginPath();
        ctx.arc(armLen * 0.2, -armLen * 0.9, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },

    _drawDress(ctx, hw, hh, br, cfg) {
        const top = -hh * 0.15 + br;
        const bot = hh;

        // Main dress
        ctx.fillStyle = cfg.DRESS_COLOR;
        ctx.beginPath();
        ctx.moveTo(-hw * 0.32, top);
        ctx.lineTo(hw * 0.32, top);
        ctx.quadraticCurveTo(hw * 0.6, (top + bot) * 0.5, hw * 0.65, bot);
        ctx.quadraticCurveTo(hw * 0.3, bot + 4, 0, bot + 3);
        ctx.quadraticCurveTo(-hw * 0.3, bot + 4, -hw * 0.65, bot);
        ctx.quadraticCurveTo(-hw * 0.6, (top + bot) * 0.5, -hw * 0.32, top);
        ctx.closePath();
        ctx.fill();

        // Dress gradient overlay for depth
        const dressGrad = ctx.createLinearGradient(-hw * 0.5, top, hw * 0.5, bot);
        dressGrad.addColorStop(0, 'rgba(255,255,255,0.08)');
        dressGrad.addColorStop(0.4, 'rgba(255,255,255,0)');
        dressGrad.addColorStop(0.6, 'rgba(0,0,0,0)');
        dressGrad.addColorStop(1, 'rgba(0,0,0,0.08)');
        ctx.fillStyle = dressGrad;
        ctx.fill();

        // Center highlight
        ctx.fillStyle = 'rgba(255,220,235,0.2)';
        ctx.beginPath();
        ctx.moveTo(-hw * 0.08, top + 3);
        ctx.quadraticCurveTo(-hw * 0.15, (top + bot) * 0.5, -hw * 0.12, bot - 2);
        ctx.quadraticCurveTo(0, bot + 1, hw * 0.12, bot - 2);
        ctx.quadraticCurveTo(hw * 0.15, (top + bot) * 0.5, hw * 0.08, top + 3);
        ctx.closePath();
        ctx.fill();

        // Hem glow
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-hw * 0.6, bot);
        ctx.quadraticCurveTo(0, bot + 4, hw * 0.6, bot);
        ctx.stroke();

        // Collar
        ctx.fillStyle = cfg.SKIN_COLOR;
        ctx.beginPath();
        ctx.ellipse(0, top, hw * 0.2, 3, 0, 0, Math.PI * 2);
        ctx.fill();
    },

    _drawHairFront(ctx, hw, hh, headR, headY, br, cfg) {
        const sway = this.hairAngle * 6;

        ctx.fillStyle = cfg.HAIR_COLOR;

        // Top volume - a simple dome
        ctx.beginPath();
        ctx.arc(0, headY - 1, headR + 2.5, Math.PI * 0.82, Math.PI * 0.18, true);
        // Right side
        ctx.quadraticCurveTo(headR + 4, headY + headR * 0.1, headR + 2, headY + headR * 0.6);
        ctx.lineTo(headR - 1, headY + headR * 0.3);
        // Inner arc across face
        ctx.arc(0, headY - 1, headR * 0.85, Math.PI * 0.1, Math.PI * 0.9);
        // Left side
        ctx.lineTo(-headR + 1, headY + headR * 0.3);
        ctx.lineTo(-headR - 2, headY + headR * 0.6);
        ctx.quadraticCurveTo(-headR - 4, headY + headR * 0.1, -headR - 2.5, headY - 1);
        ctx.closePath();
        ctx.fill();

        // Bangs - soft curved fringe
        ctx.beginPath();
        ctx.moveTo(-headR * 0.7, headY - headR * 0.4);
        ctx.quadraticCurveTo(-headR * 0.3, headY + headR * 0.15, 0, headY - headR * 0.1);
        ctx.quadraticCurveTo(headR * 0.3, headY - headR * 0.35, headR * 0.6, headY - headR * 0.2);
        ctx.lineTo(headR * 0.7, headY - headR * 0.5);
        ctx.arc(0, headY - 1, headR + 1, Math.PI * 0.2, Math.PI * 0.8, true);
        ctx.closePath();
        ctx.fill();

        // Hair highlight streaks
        ctx.fillStyle = cfg.HAIR_HIGHLIGHT;
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.ellipse(-headR * 0.25, headY - headR * 0.5, headR * 0.12, headR * 0.4, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(headR * 0.2, headY - headR * 0.6, headR * 0.08, headR * 0.3, 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    },

    _drawFace(ctx, headR, headY, cfg) {
        const eyeY = headY + headR * 0.12;
        const eyeSp = headR * 0.38;
        const eyeW = 4;
        const eyeH = 4.5;

        if (this.expression === 'happy') {
            this._drawFaceHappy(ctx, headR, headY, eyeY, eyeSp, eyeW, eyeH, cfg);
        } else if (this.expression === 'hurt') {
            this._drawFaceHurt(ctx, headR, headY, eyeY, eyeSp, eyeW, eyeH, cfg);
        } else {
            this._drawFaceNeutral(ctx, headR, headY, eyeY, eyeSp, eyeW, eyeH, cfg);
        }
    },

    _drawFaceNeutral(ctx, headR, headY, eyeY, eyeSp, eyeW, eyeH, cfg) {
        // Eye whites
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(-eyeSp, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(eyeSp, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2);
        ctx.fill();

        // Iris
        const lx = this.facingRight ? 0.8 : -0.8;
        ctx.fillStyle = '#3a2218';
        ctx.beginPath();
        ctx.arc(-eyeSp + lx, eyeY + 0.3, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeSp + lx, eyeY + 0.3, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Pupil
        ctx.fillStyle = '#150a05';
        ctx.beginPath();
        ctx.arc(-eyeSp + lx, eyeY + 0.3, 1.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeSp + lx, eyeY + 0.3, 1.3, 0, Math.PI * 2);
        ctx.fill();

        // Big eye sparkle
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.arc(-eyeSp + lx - 0.7, eyeY - 0.8, 1.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeSp + lx - 0.7, eyeY - 0.8, 1.1, 0, Math.PI * 2);
        ctx.fill();

        // Small eye sparkle
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(-eyeSp + lx + 0.6, eyeY + 1, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeSp + lx + 0.6, eyeY + 1, 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Eyelashes
        this._drawEyelashes(ctx, eyeY, eyeSp, eyeW, eyeH, cfg);

        // Blush
        ctx.fillStyle = 'rgba(255,140,175,0.22)';
        ctx.beginPath();
        ctx.ellipse(-eyeSp - 1, eyeY + eyeH + 1.5, 3.5, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(eyeSp + 1, eyeY + eyeH + 1.5, 3.5, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nose (tiny)
        ctx.fillStyle = 'rgba(200,150,130,0.15)';
        ctx.beginPath();
        ctx.ellipse(0, eyeY + 3, 1.2, 0.8, 0, 0, Math.PI);
        ctx.fill();

        // Smile
        ctx.strokeStyle = '#c0776a';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.arc(0, eyeY + eyeH + 0.5, 3, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
    },

    _drawFaceHappy(ctx, headR, headY, eyeY, eyeSp, eyeW, eyeH, cfg) {
        // Happy squinted eyes (closed arcs)
        ctx.strokeStyle = cfg.EYE_COLOR;
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';

        // Left eye - happy arc
        ctx.beginPath();
        ctx.arc(-eyeSp, eyeY, eyeW * 0.7, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();

        // Right eye - happy arc
        ctx.beginPath();
        ctx.arc(eyeSp, eyeY, eyeW * 0.7, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();

        // Eyelashes
        this._drawEyelashes(ctx, eyeY, eyeSp, eyeW, eyeH, cfg);

        // Extra rosy blush (bigger when happy)
        ctx.fillStyle = 'rgba(255,140,175,0.35)';
        ctx.beginPath();
        ctx.ellipse(-eyeSp - 1, eyeY + eyeH + 1.5, 4, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(eyeSp + 1, eyeY + eyeH + 1.5, 4, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nose
        ctx.fillStyle = 'rgba(200,150,130,0.15)';
        ctx.beginPath();
        ctx.ellipse(0, eyeY + 3, 1.2, 0.8, 0, 0, Math.PI);
        ctx.fill();

        // Big wide smile
        ctx.strokeStyle = '#c0776a';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(0, eyeY + eyeH + 0.5, 4.5, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
    },

    _drawFaceHurt(ctx, headR, headY, eyeY, eyeSp, eyeW, eyeH, cfg) {
        // Eye whites (slightly smaller - squinting)
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(-eyeSp, eyeY, eyeW * 0.85, eyeH * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(eyeSp, eyeY, eyeW * 0.85, eyeH * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Iris
        ctx.fillStyle = '#3a2218';
        ctx.beginPath();
        ctx.arc(-eyeSp, eyeY + 0.3, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeSp, eyeY + 0.3, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Pupil (smaller when hurt)
        ctx.fillStyle = '#150a05';
        ctx.beginPath();
        ctx.arc(-eyeSp, eyeY + 0.3, 1.0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeSp, eyeY + 0.3, 1.0, 0, Math.PI * 2);
        ctx.fill();

        // Worried eyebrows (angled lines above eyes)
        ctx.strokeStyle = cfg.HAIR_COLOR;
        ctx.lineWidth = 1.3;
        ctx.lineCap = 'round';
        // Left eyebrow (high outer, low inner)
        ctx.beginPath();
        ctx.moveTo(-eyeSp - 4, eyeY - eyeH - 2);
        ctx.lineTo(-eyeSp + 1, eyeY - eyeH);
        ctx.stroke();
        // Right eyebrow (high outer, low inner)
        ctx.beginPath();
        ctx.moveTo(eyeSp + 4, eyeY - eyeH - 2);
        ctx.lineTo(eyeSp - 1, eyeY - eyeH);
        ctx.stroke();

        // Eyelashes
        this._drawEyelashes(ctx, eyeY, eyeSp, eyeW, eyeH, cfg);

        // Reduced blush
        ctx.fillStyle = 'rgba(255,140,175,0.12)';
        ctx.beginPath();
        ctx.ellipse(-eyeSp - 1, eyeY + eyeH + 1.5, 3, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(eyeSp + 1, eyeY + eyeH + 1.5, 3, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nose
        ctx.fillStyle = 'rgba(200,150,130,0.15)';
        ctx.beginPath();
        ctx.ellipse(0, eyeY + 3, 1.2, 0.8, 0, 0, Math.PI);
        ctx.fill();

        // Small O-shaped mouth
        ctx.strokeStyle = '#c0776a';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.arc(0, eyeY + eyeH + 2, 2, 0, Math.PI * 2);
        ctx.stroke();
    },

    _drawEyelashes(ctx, eyeY, eyeSp, eyeW, eyeH, cfg) {
        ctx.strokeStyle = cfg.HAIR_COLOR;
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';

        const lashLen = 3;

        // Left eye lashes
        for (let i = 0; i < 3; i++) {
            const a = Math.PI * 1.1 + i * 0.25;
            const bx = -eyeSp + Math.cos(a) * eyeW * 0.85;
            const by = eyeY + Math.sin(a) * eyeH * 0.85;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + Math.cos(a) * lashLen, by + Math.sin(a) * lashLen);
            ctx.stroke();
        }

        // Right eye lashes
        for (let i = 0; i < 3; i++) {
            const a = Math.PI * 1.65 + i * 0.25;
            const bx = eyeSp + Math.cos(a) * eyeW * 0.85;
            const by = eyeY + Math.sin(a) * eyeH * 0.85;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + Math.cos(a) * lashLen, by + Math.sin(a) * lashLen);
            ctx.stroke();
        }
    },
};
