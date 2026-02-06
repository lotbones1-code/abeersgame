// ── Utility Functions ──

const Utils = {
    // Linear interpolation
    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    // Clamp value between min and max
    clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    },

    // Random float between min and max
    randFloat(min, max) {
        return Math.random() * (max - min) + min;
    },

    // Random integer between min and max (inclusive)
    randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // Random element from array
    randChoice(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },

    // Distance between two points
    dist(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },

    // Easing functions
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    },

    easeInCubic(t) {
        return t * t * t;
    },

    easeOutElastic(t) {
        if (t === 0 || t === 1) return t;
        return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
    },

    easeOutBounce(t) {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1) return n1 * t * t;
        if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
        if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
    },

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    },

    // Color interpolation (hex strings)
    lerpColor(color1, color2, t) {
        const r1 = parseInt(color1.slice(1, 3), 16);
        const g1 = parseInt(color1.slice(3, 5), 16);
        const b1 = parseInt(color1.slice(5, 7), 16);
        const r2 = parseInt(color2.slice(1, 3), 16);
        const g2 = parseInt(color2.slice(3, 5), 16);
        const b2 = parseInt(color2.slice(5, 7), 16);
        const r = Math.round(Utils.lerp(r1, r2, t));
        const g = Math.round(Utils.lerp(g1, g2, t));
        const b = Math.round(Utils.lerp(b1, b2, t));
        return `rgb(${r},${g},${b})`;
    },

    // RGBA string helper
    rgba(r, g, b, a) {
        return `rgba(${r},${g},${b},${a})`;
    },

    // HSL to CSS string
    hsl(h, s, l, a = 1) {
        if (a < 1) return `hsla(${h},${s}%,${l}%,${a})`;
        return `hsl(${h},${s}%,${l}%)`;
    },

    // Smooth step
    smoothstep(edge0, edge1, x) {
        const t = Utils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
        return t * t * (3 - 2 * t);
    },

    // Map value from one range to another
    map(value, inMin, inMax, outMin, outMax) {
        return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
    },

    // Wrap value around (for screen wrapping)
    wrap(value, min, max) {
        const range = max - min;
        while (value < min) value += range;
        while (value >= max) value -= range;
        return value;
    }
};
