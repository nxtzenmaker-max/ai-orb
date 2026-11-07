// src/sound.js
// Procedural Web Audio Sound Synthesizer
// Pure mathematical harmonic synthesis — zero external MP3/WAV files required.
// Designed for emotional warmth, organic cadence, and sensory delight.

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.compressor = null;
    this.analyser = null;

    // Listen for first interaction to unlock AudioContext in strict browsers
    this._setupUserGestureUnlock();
  }

  _setupUserGestureUnlock() {
    const unlock = async () => {
      await this.ensureContext();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('pointerdown', unlock, { once: true, passive: true });
    window.addEventListener('keydown', unlock, { once: true, passive: true });
    window.addEventListener('touchstart', unlock, { once: true, passive: true });
  }

  // Connect external AnalyserNode so 3D Orb & 2D ring react to chimes
  connectAnalyser(analyser) {
    this.analyser = analyser;
    if (this.masterGain && this.analyser) {
      try {
        this.masterGain.connect(this.analyser);
      } catch (e) {
        // Safe connection catch
      }
    }
  }

  async ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      // Master dynamics compressor: warm acoustic response, prevents digital harshness
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(24, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(3.5, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.2, this.ctx.currentTime);

      // Master Gain Node
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.65, this.ctx.currentTime);

      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);

      if (this.analyser) {
        try {
          this.masterGain.connect(this.analyser);
        } catch (e) {}
      }
    }

    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (e) {
        // Will auto-resume on first user pointer/key gesture
      }
    }
    return this.ctx;
  }

  setMute(muted) {
    this.isMuted = !!muted;
    if (this.masterGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
      this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : 0.65, t + 0.05);
    }
  }

  // Main Chime Player: 'activate' | 'complete' | 'response' | 'tap' | 'toggle' | 'clear' | 'error'
  playChime(type) {
    if (this.isMuted) return;

    this.ensureContext().then(ctx => {
      if (!ctx || ctx.state !== 'running') return;

      switch (type) {
        case 'activate':
          this._playActivate(ctx);
          break;
        case 'complete':
          this._playComplete(ctx);
          break;
        case 'response':
          this._playResponse(ctx);
          break;
        case 'tap':
          this._playTap(ctx);
          break;
        case 'toggle':
          this._playToggle(ctx);
          break;
        case 'clear':
          this._playClear(ctx);
          break;
        case 'error':
          this._playError(ctx);
          break;
        default:
          this._playTap(ctx);
      }
    }).catch(() => {});
  }

  /**
   * 1. 'activate': Soft warm harmonic chord (528Hz Solfeggio & 792Hz Perfect 5th)
   * Plays when microphone begins listening.
   * Gentle sine wave fade-in and smooth release, giving an uplifting, inviting feel.
   */
  _playActivate(ctx) {
    const t = ctx.currentTime;
    const dur = 0.58;

    // Gentle low-pass filter to ensure buttery acoustic smoothness
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, t);
    filter.Q.setValueAtTime(0.7, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    // Smooth 22ms attack
    gain.gain.linearRampToValueAtTime(0.18, t + 0.022);
    // Exponential warm decay
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    // Harmonic frequencies: 264Hz (warm sub), 528Hz (love frequency root), 792Hz (perfect fifth)
    const freqs = [264, 528, 792];
    const oscs = freqs.map((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(f, t);
      // Subtle organic pitch inflection (slight lift)
      osc.frequency.exponentialRampToValueAtTime(f * 1.015, t + dur);
      return osc;
    });

    oscs.forEach(osc => {
      osc.connect(gain);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    });

    gain.connect(filter);
    filter.connect(this.masterGain);
  }

  /**
   * 2. 'complete': Subtle tone when speech processing starts / query is captured.
   * Two pleasant ascending notes (587Hz -> 880Hz) with gentle decay.
   */
  _playComplete(ctx) {
    const t = ctx.currentTime;
    const dur = 0.32;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, t);

    // Note 1: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, t);

    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0.0001, t);
    gain1.gain.linearRampToValueAtTime(0.12, t + 0.015);
    gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);

    osc1.connect(gain1);
    gain1.connect(filter);
    osc1.start(t);
    osc1.stop(t + 0.18);

    // Note 2: 880 Hz (A5 - Pure Fifth higher)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, t + 0.06);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.0001, t + 0.06);
    gain2.gain.linearRampToValueAtTime(0.14, t + 0.075);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc2.connect(gain2);
    gain2.connect(filter);
    osc2.start(t + 0.06);
    osc2.stop(t + dur + 0.05);

    filter.connect(this.masterGain);
  }

  /**
   * 3. 'response': Soft ambient shimmer when AI begins speaking.
   * A staggered celestial chime chord (528Hz, 660Hz, 792Hz, 1056Hz)
   * with airy envelope, creating an impression of neural radiance and intelligence.
   */
  _playResponse(ctx) {
    const t = ctx.currentTime;
    const dur = 0.72;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3600, t);
    filter.Q.setValueAtTime(0.8, t);

    // Pentatonic shimmer notes
    const chord = [
      { f: 528, delay: 0.000, g: 0.11 }, // Solfeggio Root
      { f: 660, delay: 0.035, g: 0.10 }, // Major Third
      { f: 792, delay: 0.070, g: 0.11 }, // Perfect Fifth
      { f: 1056, delay: 0.105, g: 0.08 } // Octave Shimmer
    ];

    chord.forEach(({ f, delay, g }) => {
      const startT = t + delay;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, startT);
      // Soft drift
      osc.frequency.linearRampToValueAtTime(f * 1.008, startT + (dur - delay));

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, startT);
      gain.gain.linearRampToValueAtTime(g, startT + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, startT + (dur - delay));

      osc.connect(gain);
      gain.connect(filter);

      osc.start(startT);
      osc.stop(startT + dur);
    });

    filter.connect(this.masterGain);
  }

  /**
   * 4. 'tap': Tiny haptic-like click sound for UI buttons.
   * Ultra-crisp, tactile, 18ms micro-damped chirp mimicking high-end haptics.
   */
  _playTap(ctx) {
    const t = ctx.currentTime;
    const dur = 0.022;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    // Swift frequency drop gives a solid, organic "click"
    osc.frequency.setValueAtTime(720, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + dur);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + dur + 0.005);
  }

  /**
   * 5. 'toggle': Smooth blip for switch toggles (visualizer, mute, drawer)
   */
  _playToggle(ctx) {
    const t = ctx.currentTime;
    const dur = 0.06;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(660, t + dur);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + dur + 0.01);
  }

  /**
   * 6. 'clear': Soft descending whisper sweep for clearing memory/chat
   */
  _playClear(ctx) {
    const t = ctx.currentTime;
    const dur = 0.28;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + dur);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.10, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + dur + 0.01);
  }

  /**
   * 7. 'error': Subtle non-jarring low tone
   */
  _playError(ctx) {
    const t = ctx.currentTime;
    const dur = 0.24;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.linearRampToValueAtTime(220, t + dur);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.09, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + dur + 0.01);
  }
}

// Export singleton instance for seamless app-wide access
export const sound = new SoundEngine();
