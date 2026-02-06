// ── Aurora Borealis Effect ──

const Aurora = {
    ribbons: [],
    time: 0,

    init() {
        this.ribbons = [];
        const count = CONFIG.VISUAL.AURORA_RIBBONS;
        for (let i = 0; i < count; i++) {
            this.ribbons.push({
                points: this._generatePoints(),
                speed: Utils.randFloat(0.3, 0.9),
                amplitude: Utils.randFloat(35, 100),
                yOffset: Utils.randFloat(0.08, 0.55),
                thickness: Utils.randFloat(50, 100),
                alpha: Utils.randFloat(0.1, 0.22),
                phase: Utils.randFloat(0, Math.PI * 2),
                frequency: Utils.randFloat(0.5, 1.5),
            });
        }
        this.time = 0;
    },

    _generatePoints() {
        const count = CONFIG.VISUAL.AURORA_CONTROL_POINTS;
        const points = [];
        for (let i = 0; i < count; i++) {
            points.push({
                baseX: i / (count - 1),
                offsetX: Utils.randFloat(-0.05, 0.05),
                offsetY: Utils.randFloat(-0.02, 0.02),
                speedX: Utils.randFloat(0.2, 0.6),
                speedY: Utils.randFloat(0.3, 0.7),
                phaseX: Utils.randFloat(0, Math.PI * 2),
                phaseY: Utils.randFloat(0, Math.PI * 2),
            });
        }
        return points;
    },

    update(dt) {
        this.time += dt;
    },

    draw(ctx, screenWidth, screenHeight, altitude) {
        const colors = Zones.getAuroraColors(altitude);

        for (let r = 0; r < this.ribbons.length; r++) {
            const ribbon = this.ribbons[r];
            const baseY = screenHeight * ribbon.yOffset;
            const colorIdx = r % colors.length;
            const color = colors[colorIdx];

            ctx.save();
            ctx.globalAlpha = ribbon.alpha;

            // Build the ribbon path
            const topPoints = [];
            const bottomPoints = [];

            for (const point of ribbon.points) {
                const t = this.time * ribbon.speed;
                const x = (point.baseX + Math.sin(t * point.speedX + point.phaseX) * point.offsetX) * screenWidth;
                const yOff = Math.sin(t * point.speedY + point.phaseY + ribbon.phase) * ribbon.amplitude;
                const y = baseY + yOff + point.offsetY * screenHeight;

                topPoints.push({ x, y: y - ribbon.thickness / 2 });
                bottomPoints.push({ x, y: y + ribbon.thickness / 2 });
            }

            // Draw filled ribbon
            ctx.beginPath();
            ctx.moveTo(topPoints[0].x, topPoints[0].y);

            // Top edge (smooth curve)
            for (let i = 1; i < topPoints.length - 1; i++) {
                const xc = (topPoints[i].x + topPoints[i + 1].x) / 2;
                const yc = (topPoints[i].y + topPoints[i + 1].y) / 2;
                ctx.quadraticCurveTo(topPoints[i].x, topPoints[i].y, xc, yc);
            }
            ctx.lineTo(topPoints[topPoints.length - 1].x, topPoints[topPoints.length - 1].y);

            // Bottom edge (reverse, smooth curve)
            ctx.lineTo(bottomPoints[bottomPoints.length - 1].x, bottomPoints[bottomPoints.length - 1].y);
            for (let i = bottomPoints.length - 2; i > 0; i--) {
                const xc = (bottomPoints[i].x + bottomPoints[i - 1].x) / 2;
                const yc = (bottomPoints[i].y + bottomPoints[i - 1].y) / 2;
                ctx.quadraticCurveTo(bottomPoints[i].x, bottomPoints[i].y, xc, yc);
            }
            ctx.lineTo(bottomPoints[0].x, bottomPoints[0].y);
            ctx.closePath();

            // Gradient fill
            const grad = ctx.createLinearGradient(0, baseY - ribbon.thickness, 0, baseY + ribbon.thickness);
            grad.addColorStop(0, 'rgba(0,0,0,0)');
            grad.addColorStop(0.3, color);
            grad.addColorStop(0.5, color);
            grad.addColorStop(0.7, color);
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.fill();

            // Bright center line
            ctx.globalAlpha = ribbon.alpha * 0.5;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            const midPoints = topPoints.map((tp, i) => ({
                x: (tp.x + bottomPoints[i].x) / 2,
                y: (tp.y + bottomPoints[i].y) / 2,
            }));
            ctx.moveTo(midPoints[0].x, midPoints[0].y);
            for (let i = 1; i < midPoints.length - 1; i++) {
                const xc = (midPoints[i].x + midPoints[i + 1].x) / 2;
                const yc = (midPoints[i].y + midPoints[i + 1].y) / 2;
                ctx.quadraticCurveTo(midPoints[i].x, midPoints[i].y, xc, yc);
            }
            ctx.stroke();

            ctx.restore();
        }
    },
};
