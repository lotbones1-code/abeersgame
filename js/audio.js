// ── Audio System (Web Audio API) ──

const GameAudio = {
    ctx: null,
    masterGain: null,
    musicGain: null,
    sfxGain: null,
    muted: false,
    initialized: false,

    // Reverb
    reverb: null,
    reverbGain: null,

    // Music state
    musicPlaying: false,
    padOsc: null,
    padGain: null,
    melodyTimer: 0,
    melodyInterval: 2.5,
    currentScale: [261.63, 293.66, 329.63, 392.00, 440.00],
    currentRoot: 0,
    beatTime: 0,
    bpm: CONFIG.AUDIO.BPM,

    init() {
        if (this.initialized) return;

        const muteBtn = document.getElementById('muteBtn');
        muteBtn.addEventListener('click', () => this.toggleMute());
        muteBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleMute();
        });
    },

    ensureContext() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = CONFIG.AUDIO.MASTER_VOLUME;
            this.masterGain.connect(this.ctx.destination);

            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = CONFIG.AUDIO.MUSIC_VOLUME;
            this.musicGain.connect(this.masterGain);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = CONFIG.AUDIO.SFX_VOLUME;
            this.sfxGain.connect(this.masterGain);

            // Create reverb
            this._createReverb();

            this.initialized = true;
        } catch {
            // Web Audio not available
        }
    },

    _createReverb() {
        try {
            this.reverb = this.ctx.createConvolver();
            const sampleRate = this.ctx.sampleRate;
            const length = sampleRate * 2; // 2 second reverb tail
            const impulse = this.ctx.createBuffer(2, length, sampleRate);
            for (let ch = 0; ch < 2; ch++) {
                const data = impulse.getChannelData(ch);
                for (let i = 0; i < length; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
                }
            }
            this.reverb.buffer = impulse;

            this.reverbGain = this.ctx.createGain();
            this.reverbGain.gain.value = 0.15;
            this.reverb.connect(this.reverbGain);
            this.reverbGain.connect(this.musicGain);
        } catch {
            this.reverb = null;
        }
    },

    toggleMute() {
        this.muted = !this.muted;
        const muteBtn = document.getElementById('muteBtn');
        if (this.muted) {
            muteBtn.classList.add('muted');
            muteBtn.textContent = '\u266A';
            if (this.masterGain) this.masterGain.gain.value = 0;
        } else {
            muteBtn.classList.remove('muted');
            muteBtn.textContent = '\u266A';
            if (this.masterGain) this.masterGain.gain.value = CONFIG.AUDIO.MASTER_VOLUME;
        }
    },

    showMuteButton() {
        document.getElementById('muteBtn').classList.add('visible');
    },

    hideMuteButton() {
        document.getElementById('muteBtn').classList.remove('visible');
    },

    // ── Music ──

    startMusic() {
        if (!this.ctx || this.musicPlaying) return;
        this.musicPlaying = true;

        this.padOsc = this.ctx.createOscillator();
        this.padOsc.type = 'sine';
        this.padOsc.frequency.value = 130.81;
        this.padGain = this.ctx.createGain();
        this.padGain.gain.value = 0;
        this.padGain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 3);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        filter.Q.value = 1;

        this.padOsc.connect(filter);
        filter.connect(this.padGain);
        this.padGain.connect(this.musicGain);
        this.padOsc.start();

        const pad2 = this.ctx.createOscillator();
        pad2.type = 'sine';
        pad2.frequency.value = 196.00;
        const pad2Gain = this.ctx.createGain();
        pad2Gain.gain.value = 0;
        pad2Gain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 3);

        const filter2 = this.ctx.createBiquadFilter();
        filter2.type = 'lowpass';
        filter2.frequency.value = 600;

        pad2.connect(filter2);
        filter2.connect(pad2Gain);
        pad2Gain.connect(this.musicGain);
        pad2.start();
    },

    stopMusic() {
        this.musicPlaying = false;
        if (this.padGain) {
            this.padGain.gain.linearRampToValueAtTime(0, (this.ctx?.currentTime || 0) + 1);
        }
    },

    updateMusic(dt) {
        if (!this.ctx || !this.musicPlaying) return;

        // Update scale based on current zone
        const zone = Zones.getZone(Game.time);
        if (zone.scale) this.currentScale = zone.scale;

        this.melodyTimer += dt;
        this.beatTime += dt;

        if (this.melodyTimer >= this.melodyInterval) {
            this.melodyTimer = 0;
            this.melodyInterval = Utils.randFloat(1.5, 3.5);
            this._playMelodyNote();
        }

        if (Math.random() < dt * 0.3) {
            this._playHarmonyPing();
        }
    },

    _playMelodyNote() {
        if (!this.ctx) return;
        const freq = Utils.randChoice(this.currentScale);
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = freq;

        const gain = this.ctx.createGain();
        const t = this.ctx.currentTime;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.15, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);

        osc.connect(gain);
        gain.connect(this.musicGain);

        // Send to reverb for spatial depth
        if (this.reverb) {
            gain.connect(this.reverb);
        }

        osc.start(t);
        osc.stop(t + 1.5);
    },

    _playHarmonyPing() {
        if (!this.ctx) return;
        const freq = Utils.randChoice(this.currentScale) * 2;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;

        const gain = this.ctx.createGain();
        const t = this.ctx.currentTime;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.06, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

        osc.connect(gain);
        gain.connect(this.musicGain);

        // Send to reverb
        if (this.reverb) {
            gain.connect(this.reverb);
        }

        osc.start(t);
        osc.stop(t + 0.8);
    },

    // ── SFX ──

    playCatch() {
        if (!this.ctx) return;
        const baseFreq = Utils.randChoice([350, 400, 450, 500]);
        const osc = this.ctx.createOscillator();
        osc.type = Utils.randChoice(['sine', 'triangle']);
        const t = this.ctx.currentTime;
        osc.frequency.setValueAtTime(baseFreq, t);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 2, t + 0.08);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(Utils.randFloat(0.14, 0.20), t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + Utils.randFloat(0.10, 0.15));

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.15);
    },

    playMiss() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        const t = this.ctx.currentTime;
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.2);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 500;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.25);
    },

    playPerfect() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;

        [523.25, 659.25, 783.99].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0, t + i * 0.03);
            gain.gain.linearRampToValueAtTime(0.12, t + i * 0.03 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(t + i * 0.03);
            osc.stop(t + 0.5);
        });
    },

    playCollect() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;

        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.value = freq;

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0, t + i * 0.08);
            gain.gain.linearRampToValueAtTime(0.15, t + i * 0.08 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.6);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(t + i * 0.08);
            osc.stop(t + i * 0.08 + 0.6);
        });

        const chime = this.ctx.createOscillator();
        chime.type = 'sine';
        chime.frequency.value = 1568;
        const chimeGain = this.ctx.createGain();
        chimeGain.gain.setValueAtTime(0, t + 0.3);
        chimeGain.gain.linearRampToValueAtTime(0.1, t + 0.32);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
        chime.connect(chimeGain);
        chimeGain.connect(this.sfxGain);
        chime.start(t + 0.3);
        chime.stop(t + 1.2);
    },

    playGameOver() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;

        [440, 392, 349.23, 329.63].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0, t + i * 0.25);
            gain.gain.linearRampToValueAtTime(0.1, t + i * 0.25 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.25 + 0.8);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(t + i * 0.25);
            osc.stop(t + i * 0.25 + 0.8);
        });
    },
};
