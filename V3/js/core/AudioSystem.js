export class AudioSystem {
    constructor() {
        this.sfxVolume = 1.0;
        this.musicVolume = 0.5;
        this.isMuted = false;
        this.explosionSounds = [];
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        this.initExplosionSounds();
    }

    initExplosionSounds() {
        for (let i = 0; i < 10; i++) {
            this.explosionSounds.push(this.createRealisticExplosion(i));
        }
    }

    createRealisticExplosion(index) {
        // We return a function that plays the sound
        return () => {
            if (this.isMuted) return;

            const ctx = this.audioContext;
            const now = ctx.currentTime;
            const masterGain = ctx.createGain();
            masterGain.gain.value = this.sfxVolume;
            masterGain.connect(ctx.destination);

            // 1. White noise (impact)
            const bufferSize = ctx.sampleRate * 0.5;
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }

            const noise = ctx.createBufferSource();
            noise.buffer = noiseBuffer;

            // 2. Low-pass filter (muffled sound)
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800 - (index * 50), now);
            filter.Q.setValueAtTime(1, now);

            // 3. Noise envelope
            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0.8, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

            // 4. Sub-bass (deep impact)
            const bass = ctx.createOscillator();
            bass.type = 'sine';
            bass.frequency.setValueAtTime(60 - (index * 3), now);
            bass.frequency.exponentialRampToValueAtTime(20, now + 0.4);

            const bassGain = ctx.createGain();
            bassGain.gain.setValueAtTime(0.6, now);
            bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

            // 5. Delay for reverb simulation
            const delay = ctx.createDelay();
            delay.delayTime.value = 0.05;
            const delayGain = ctx.createGain();
            delayGain.gain.value = 0.3;

            // Connections
            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(masterGain);
            noiseGain.connect(delay);
            delay.connect(delayGain);
            delayGain.connect(masterGain);

            bass.connect(bassGain);
            bassGain.connect(masterGain);

            // Start
            noise.start(now);
            noise.stop(now + 0.5);
            bass.start(now);
            bass.stop(now + 0.5);
        };
    }

    playExplosionSound() {
        if (this.isMuted) return;
        this.resumeContext(); // Ensure context is running (browser policy)
        const randomSound = this.explosionSounds[Math.floor(Math.random() * this.explosionSounds.length)];
        randomSound();
    }

    resumeContext() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    playMissileSound(type) {
        if (this.isMuted) return;
        this.resumeContext();

        // type: "standard", "homing", "machineGun", "cannon", "laser"
        const ctx = this.audioContext;
        const now = ctx.currentTime;

        if (type === 'standard') {
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'homing') {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.linearRampToValueAtTime(600, now + 0.2);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.15 * this.sfxVolume, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.2);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'machineGun') {
            const bufferSize = ctx.sampleRate * 0.05;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 1000;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.1 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            noise.start(now);
        } else if (type === 'cannon') {
            // Deep boom
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(80, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.4 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.25);
        } else if (type === 'laser') {
            const osc = ctx.createOscillator();
            osc.type = 'square';
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.3);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.3);
        }
    }
}
