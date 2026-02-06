// ── Particle System (Screen-space for catcher game) ──

const Particles = {
    pool: [],
    active: [],

    init() {
        this.pool = [];
        this.active = [];
        for (let i = 0; i < CONFIG.PARTICLES.POOL_SIZE; i++) {
            this.pool.push(this._createParticle());
        }
    },

    _createParticle() {
        return {
            x: 0, y: 0,
            vx: 0, vy: 0,
            life: 0, maxLife: 1,
            size: 2,
            color: '#fff',
            alpha: 1,
            type: 'circle',
            gravity: 0,
            shrink: true,
        };
    },

    _spawn(config) {
        let p;
        if (this.pool.length > 0) {
            p = this.pool.pop();
        } else if (this.active.length > 0) {
            p = this.active.shift();
        } else {
            p = this._createParticle();
        }

        Object.assign(p, {
            x: config.x || 0,
            y: config.y || 0,
            vx: config.vx || 0,
            vy: config.vy || 0,
            life: config.life || 1,
            maxLife: config.life || 1,
            size: config.size || 2,
            color: config.color || '#fff',
            alpha: 1,
            type: config.type || 'circle',
            gravity: config.gravity || 0,
            shrink: config.shrink !== false,
        });

        this.active.push(p);
        return p;
    },

    emitSparkle(x, y) {
        this._spawn({
            x, y,
            vx: Utils.randFloat(-8, 8),
            vy: Utils.randFloat(-20, -5),
            life: Utils.randFloat(0.4, 0.8),
            size: Utils.randFloat(1, 2),
            color: CONFIG.COLORS.ACCENT_LIGHT,
            type: 'star',
            gravity: -10,
        });
    },

    emitBurst(x, y, count, color, sizeBase) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Utils.randFloat(-0.3, 0.3);
            const speed = Utils.randFloat(50, 150);
            this._spawn({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: CONFIG.PARTICLES.BURST_LIFE,
                size: (sizeBase || 2) + Utils.randFloat(-1, 1),
                color,
                gravity: 40,
            });
        }
    },

    emitHearts(x, y, count) {
        for (let i = 0; i < count; i++) {
            const angle = Utils.randFloat(0, Math.PI * 2);
            const speed = Utils.randFloat(40, 120);
            this._spawn({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 40,
                life: Utils.randFloat(1, 1.8),
                size: Utils.randFloat(4, 8),
                color: CONFIG.COLORS.ACCENT,
                type: 'heart',
                gravity: 30,
                shrink: false,
            });
        }
    },

    emitCatch(x, y, color) {
        for (let i = 0; i < 8; i++) {
            const angle = Utils.randFloat(-Math.PI * 0.8, -Math.PI * 0.2);
            const speed = Utils.randFloat(60, 130);
            this._spawn({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: Utils.randFloat(0.5, 0.9),
                size: Utils.randFloat(1.5, 3),
                color,
                gravity: 50,
            });
        }
    },

    emitTrail(x, y, itemType) {
        const color = itemType === 'heart' ? CONFIG.COLORS.ACCENT :
                      itemType === 'letter' ? 'rgba(255,200,225,0.8)' :
                      CONFIG.COLORS.STAR_GOLD;
        this._spawn({
            x: x + Utils.randFloat(-3, 3),
            y: y + Utils.randFloat(-2, 2),
            vx: Utils.randFloat(-5, 5),
            vy: Utils.randFloat(-8, 0),
            life: Utils.randFloat(0.3, 0.6),
            size: Utils.randFloat(0.8, 1.5),
            color,
            gravity: -5,
        });
    },

    emitCatchRing(x, y, color) {
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i;
            const speed = Utils.randFloat(80, 160);
            this._spawn({
                x, y: y - 10,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 30,
                life: Utils.randFloat(0.4, 0.7),
                size: Utils.randFloat(1, 2.5),
                color,
                type: 'star',
                gravity: 20,
            });
        }
    },

    emitComboMilestone(worldWidth, worldHeight, intensity) {
        const count = intensity === 'mega' ? 60 : intensity === 'big' ? 40 : 20;
        const colors = [CONFIG.COLORS.STAR_GOLD, CONFIG.COLORS.ACCENT, CONFIG.COLORS.ACCENT_LIGHT, '#fff'];
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const speed = Utils.randFloat(80, 250);
            const cx = worldWidth / 2;
            const cy = worldHeight * 0.5;
            this._spawn({
                x: cx, y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: Utils.randFloat(1.0, 2.5),
                size: Utils.randFloat(2, 5),
                color: colors[i % colors.length],
                type: ['star', 'heart', 'circle'][i % 3],
                gravity: 30,
            });
        }
    },

    emitZoneTransition(worldWidth, screenHeight) {
        for (let i = 0; i < 30; i++) {
            this._spawn({
                x: Utils.randFloat(0, worldWidth),
                y: Utils.randFloat(0, screenHeight * 0.3),
                vx: Utils.randFloat(-20, 20),
                vy: Utils.randFloat(20, 80),
                life: Utils.randFloat(1, 2),
                size: Utils.randFloat(2, 5),
                color: '#fff',
                gravity: -10,
            });
        }
    },

    update(dt) {
        for (let i = this.active.length - 1; i >= 0; i--) {
            const p = this.active[i];
            p.life -= dt;
            if (p.life <= 0) {
                this.active.splice(i, 1);
                this.pool.push(p);
                continue;
            }

            p.vx *= 0.98;
            p.vy += p.gravity * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.alpha = Utils.clamp(p.life / p.maxLife, 0, 1);
            if (p.shrink) {
                p.size *= 0.995;
            }
        }
    },

    draw(ctx) {
        for (const p of this.active) {
            ctx.save();
            ctx.globalAlpha = p.alpha;

            if (p.type === 'heart') {
                this._drawHeart(ctx, p.x, p.y, p.size, p.color);
            } else if (p.type === 'star') {
                this._drawStar(ctx, p.x, p.y, p.size, p.color);
            } else {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    },

    _drawHeart(ctx, x, y, size, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        const s = size / 2;
        ctx.moveTo(x, y + s * 0.4);
        ctx.bezierCurveTo(x, y - s * 0.2, x - s, y - s * 0.6, x - s, y);
        ctx.bezierCurveTo(x - s, y + s * 0.6, x, y + s, x, y + s * 1.2);
        ctx.bezierCurveTo(x, y + s, x + s, y + s * 0.6, x + s, y);
        ctx.bezierCurveTo(x + s, y - s * 0.6, x, y - s * 0.2, x, y + s * 0.4);
        ctx.fill();
    },

    _drawStar(ctx, x, y, size, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i;
            const ox = Math.cos(angle) * size;
            const oy = Math.sin(angle) * size;
            if (i === 0) ctx.moveTo(x + ox, y + oy);
            else ctx.lineTo(x + ox, y + oy);
            const midAngle = angle + Math.PI / 4;
            const mx = Math.cos(midAngle) * size * 0.35;
            const my = Math.sin(midAngle) * size * 0.35;
            ctx.lineTo(x + mx, y + my);
        }
        ctx.closePath();
        ctx.fill();
    },

    clear() {
        while (this.active.length > 0) {
            this.pool.push(this.active.pop());
        }
    },
};
