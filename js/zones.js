// ── Zone Definitions (Time-based for catcher game) ──

const Zones = {
    definitions: [
        {
            name: 'Twilight',
            minTime: 0,
            maxTime: 30,
            skyTop: '#060818',
            skyBottom: '#10122e',
            skyMid: '#0c0e24',
            auroraColors: ['#4466bb', '#6688dd', '#3355bb'],
            scale: [261.63, 311.13, 349.23, 392.00, 466.16], // C minor pentatonic
        },
        {
            name: 'Violet Dream',
            minTime: 30,
            maxTime: 70,
            skyTop: '#0e0c28',
            skyBottom: '#28143e',
            skyMid: '#1a1035',
            auroraColors: ['#9944dd', '#bb66ff', '#7733bb'],
            scale: [311.13, 349.23, 392.00, 466.16, 523.25], // Eb major pentatonic
        },
        {
            name: 'Rose Glow',
            minTime: 70,
            maxTime: 120,
            skyTop: '#200e30',
            skyBottom: '#3a1535',
            skyMid: '#2d1232',
            auroraColors: ['#dd4488', '#ff66bb', '#bb3377'],
            scale: [349.23, 392.00, 440.00, 523.25, 587.33], // F major pentatonic
        },
        {
            name: 'Golden Hour',
            minTime: 120,
            maxTime: 180,
            skyTop: '#2a1228',
            skyBottom: '#45250e',
            skyMid: '#381c1a',
            auroraColors: ['#dd9944', '#ffbb66', '#bb7733'],
            scale: [392.00, 440.00, 493.88, 587.33, 659.25], // G major pentatonic
        },
        {
            name: 'Solar Flare',
            minTime: 180,
            maxTime: 260,
            skyTop: '#3a1e0e',
            skyBottom: '#4a300e',
            skyMid: '#422810',
            auroraColors: ['#eedd44', '#ffee88', '#ddbb22'],
            scale: [440.00, 493.88, 554.37, 659.25, 739.99], // A major pentatonic
        },
        {
            name: 'The Beyond',
            minTime: 260,
            maxTime: Infinity,
            skyTop: '#120820',
            skyBottom: '#081828',
            skyMid: '#0e1024',
            auroraColors: ['#bb66ff', '#ff66bb', '#66bbff', '#66ffbb'],
            scale: [523.25, 587.33, 659.25, 739.99, 830.61], // High register
        },
    ],

    getZone(time) {
        for (let i = this.definitions.length - 1; i >= 0; i--) {
            if (time >= this.definitions[i].minTime) {
                return this.definitions[i];
            }
        }
        return this.definitions[0];
    },

    getSkyColors(time) {
        const zone = this.getZone(time);
        const zoneIdx = this.definitions.indexOf(zone);
        const nextZone = this.definitions[Math.min(zoneIdx + 1, this.definitions.length - 1)];

        const zoneRange = zone.maxTime - zone.minTime;
        const progress = zoneRange === Infinity ? 0 : Utils.clamp((time - zone.minTime) / zoneRange, 0, 1);

        if (progress > 0.7 && zoneIdx < this.definitions.length - 1) {
            const blendT = (progress - 0.7) / 0.3;
            return {
                top: Utils.lerpColor(zone.skyTop, nextZone.skyTop, blendT),
                bottom: Utils.lerpColor(zone.skyBottom, nextZone.skyBottom, blendT),
                mid: Utils.lerpColor(zone.skyMid || zone.skyTop, nextZone.skyMid || nextZone.skyTop, blendT),
            };
        }

        return { top: zone.skyTop, bottom: zone.skyBottom, mid: zone.skyMid || zone.skyTop };
    },

    getAuroraColors(time) {
        const zone = this.getZone(time);
        return zone.auroraColors;
    },
};
