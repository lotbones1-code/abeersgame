// ── Collectibles (Love Letter Message Display) ──

const Collectibles = {
    activeMessage: null,
    messageTimer: 0,
    messageDuration: 4,
    messageAlpha: 0,
    collectedThisRun: 0,

    init() {
        this.activeMessage = null;
        this.messageTimer = 0;
        this.collectedThisRun = 0;
    },

    triggerLetter(index) {
        if (index < 0 || index >= LoveLetters.length) return;

        this.collectedThisRun++;
        Storage.collectLetter(index);

        this.activeMessage = LoveLetters[index].message;
        this.messageTimer = 0;
        this.messageAlpha = 0;
    },

    update(dt) {
        if (this.activeMessage) {
            this.messageTimer += dt;
            if (this.messageTimer < 0.5) {
                this.messageAlpha = Utils.easeOutCubic(this.messageTimer / 0.5);
            } else if (this.messageTimer > this.messageDuration - 0.8) {
                this.messageAlpha = Utils.easeOutCubic((this.messageDuration - this.messageTimer) / 0.8);
            } else {
                this.messageAlpha = 1;
            }

            if (this.messageTimer >= this.messageDuration) {
                this.activeMessage = null;
            }
        }
    },

    drawMessage(ctx, screenWidth, screenHeight) {
        if (!this.activeMessage || this.messageAlpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = this.messageAlpha;

        const padding = 20;
        const maxWidth = Math.min(screenWidth * 0.8, 350);
        ctx.font = '16px "Quicksand", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const words = this.activeMessage.split(' ');
        const lines = [];
        let currentLine = '';
        for (const word of words) {
            const testLine = currentLine ? currentLine + ' ' + word : word;
            if (ctx.measureText(testLine).width > maxWidth - padding * 2) {
                if (currentLine) lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);

        const lineHeight = 24;
        const boxHeight = lines.length * lineHeight + padding * 2;
        const boxY = screenHeight * 0.3 - boxHeight / 2;

        ctx.fillStyle = 'rgba(10, 5, 20, 0.7)';
        const boxWidth = maxWidth;
        const boxX = (screenWidth - boxWidth) / 2;
        const radius = 12;

        ctx.beginPath();
        ctx.moveTo(boxX + radius, boxY);
        ctx.lineTo(boxX + boxWidth - radius, boxY);
        ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + radius);
        ctx.lineTo(boxX + boxWidth, boxY + boxHeight - radius);
        ctx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - radius, boxY + boxHeight);
        ctx.lineTo(boxX + radius, boxY + boxHeight);
        ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - radius);
        ctx.lineTo(boxX, boxY + radius);
        ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = `rgba(255,182,212,${0.4 * this.messageAlpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        const heartX = screenWidth / 2;
        const heartTopY = boxY - 15;
        ctx.fillStyle = CONFIG.COLORS.ACCENT;
        ctx.font = '14px sans-serif';
        ctx.fillText('\u2764', heartX, heartTopY);

        ctx.fillStyle = '#fff';
        ctx.font = 'italic 16px "Quicksand", sans-serif';
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], screenWidth / 2, boxY + padding + lineHeight / 2 + i * lineHeight);
        }

        ctx.font = '12px "Quicksand", sans-serif';
        ctx.fillStyle = 'rgba(255,182,212,0.6)';
        ctx.fillText('- Shamil', screenWidth / 2 + 40, boxY + boxHeight + 15);

        ctx.restore();
    },

    getTotalCollected() {
        return Storage.getCollectedLetters().length;
    },

    getCollectedThisRun() {
        return this.collectedThisRun;
    },
};
