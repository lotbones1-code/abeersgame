// ── Canvas Utilities (High Quality Rendering) ──

const Canvas = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    scale: 1,
    dpr: 1,

    // Bloom post-processing
    bloomCanvas: null,
    bloomCtx: null,
    bloomSupported: false,

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.resize();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.resize(), 100);
        });

        // Check bloom support (ctx.filter)
        if (CONFIG.VISUAL.BLOOM_ENABLED) {
            this.bloomCanvas = document.createElement('canvas');
            this.bloomCtx = this.bloomCanvas.getContext('2d');
            // Test filter support
            try {
                this.bloomCtx.filter = 'blur(1px)';
                this.bloomSupported = this.bloomCtx.filter === 'blur(1px)';
            } catch (e) {
                this.bloomSupported = false;
            }
            this.bloomCtx.filter = 'none';
        }
    },

    resize() {
        this.dpr = Math.min(window.devicePixelRatio || 1, 3); // Cap at 3x for performance
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.canvas.width = Math.floor(this.width * this.dpr);
        this.canvas.height = Math.floor(this.height * this.dpr);
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';

        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

        // Smooth rendering
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';

        // Calculate scale to fit virtual world width
        this.scale = this.width / CONFIG.WORLD_WIDTH;

        // Resize bloom canvas (half resolution)
        if (this.bloomCanvas) {
            this.bloomCanvas.width = Math.floor(this.canvas.width / 2);
            this.bloomCanvas.height = Math.floor(this.canvas.height / 2);
        }
    },

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    },

    // Apply world transform (scales virtual coords to screen)
    beginWorld(camera) {
        this.ctx.save();
        this.ctx.scale(this.scale, this.scale);
    },

    endWorld() {
        this.ctx.restore();
    },

    // Get virtual world height (how tall the screen is in world units)
    getWorldHeight() {
        return this.height / this.scale;
    },

    // Draw gradient background with optional middle color
    drawGradient(colorTop, colorBottom, colorMid) {
        const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);
        grad.addColorStop(0, colorTop);
        if (colorMid) grad.addColorStop(0.5, colorMid);
        grad.addColorStop(1, colorBottom);
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.width, this.height);
    },

    // Draw a soft glow circle
    drawGlow(x, y, radius, color, alpha) {
        const ctx = this.ctx;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, color.replace(')', `,${alpha})`).replace('rgb', 'rgba'));
        grad.addColorStop(0.5, color.replace(')', `,${alpha * 0.3})`).replace('rgb', 'rgba'));
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    },

    // ── Bloom Post-Processing ──

    captureBloom() {
        if (!this.bloomSupported || !CONFIG.VISUAL.BLOOM_ENABLED) return;
        const bc = this.bloomCtx;
        const bw = this.bloomCanvas.width;
        const bh = this.bloomCanvas.height;

        // Draw main canvas scaled down to half-res
        bc.filter = 'none';
        bc.globalAlpha = 1;
        bc.globalCompositeOperation = 'source-over';
        bc.drawImage(this.canvas, 0, 0, bw, bh);

        // Apply blur
        bc.filter = `blur(${CONFIG.VISUAL.BLOOM_BLUR}px)`;
        bc.drawImage(this.bloomCanvas, 0, 0, bw, bh);
        bc.filter = 'none';
    },

    compositeBloom() {
        if (!this.bloomSupported || !CONFIG.VISUAL.BLOOM_ENABLED) return;
        const ctx = this.ctx;
        ctx.save();
        // Reset transform so we draw in pixel space
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = CONFIG.VISUAL.BLOOM_ALPHA;
        ctx.drawImage(this.bloomCanvas, 0, 0, this.canvas.width, this.canvas.height);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.restore();
    },

    // ── Vignette Overlay ──

    drawVignette(intensity) {
        const ctx = this.ctx;
        const cx = this.width / 2;
        const cy = this.height / 2;
        const r = Math.max(this.width, this.height) * 0.7;
        const grad = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, `rgba(0,0,0,${intensity})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, this.height);
    },
};
