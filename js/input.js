// ── Input Handler (Drag to move, Phone-First) ──

const Input = {
    left: false,
    right: false,
    targetX: null,
    touching: false,
    anyKeyPressed: false,
    initialized: false,

    init() {
        if (this.initialized) return;
        this.initialized = true;

        window.addEventListener('keydown', (e) => this._onKeyDown(e));
        window.addEventListener('keyup', (e) => this._onKeyUp(e));

        const canvas = document.getElementById('gameCanvas');
        canvas.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: false });
        canvas.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: false });
        canvas.addEventListener('touchend', (e) => this._onTouchEnd(e), { passive: false });
        canvas.addEventListener('mousedown', (e) => this._onMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
        canvas.addEventListener('mouseup', (e) => this._onMouseUp(e));
    },

    reset() {
        this.left = false;
        this.right = false;
        this.targetX = null;
        this.touching = false;
        this.anyKeyPressed = false;
    },

    consumeAnyKey() { this.anyKeyPressed = false; },

    _onKeyDown(e) {
        this.anyKeyPressed = true;
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') { this.left = true; e.preventDefault(); }
        if (e.code === 'ArrowRight' || e.code === 'KeyD') { this.right = true; e.preventDefault(); }
        if (e.code === 'Space') e.preventDefault();
    },

    _onKeyUp(e) {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.left = false;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') this.right = false;
    },

    _onTouchStart(e) {
        e.preventDefault();
        this.anyKeyPressed = true;
        this.touching = true;
        this.targetX = e.touches[0].clientX;
    },

    _onTouchMove(e) {
        e.preventDefault();
        if (this.touching) this.targetX = e.touches[0].clientX;
    },

    _onTouchEnd(e) {
        e.preventDefault();
        if (e.touches.length === 0) { this.touching = false; this.targetX = null; }
    },

    _onMouseDown(e) {
        this.anyKeyPressed = true;
        this.touching = true;
        this.targetX = e.clientX;
    },

    _onMouseMove(e) {
        if (this.touching) this.targetX = e.clientX;
    },

    _onMouseUp() {
        this.touching = false;
        this.targetX = null;
    },
};
