// NEONVOID — synthesized sound effects.
// No audio files: every sound is built from oscillators and filtered noise
// through the Web Audio API, created lazily on the first user gesture.

export class SoundBank {
  constructor() {
    this.context = null;
    this.master = null;
    this.muted = false;
  }

  // Browsers only allow audio after a gesture; call from the first
  // pointer or key event and ignore failure (headless / silent runs).
  unlock() {
    if (this.context) {
      if (this.context.state === 'suspended') this.context.resume().catch(() => {});
      return;
    }
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.context = new Ctx();
      this.master = this.context.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.context.destination);
    } catch {
      this.context = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // A short oscillator blip that slides from one frequency to another.
  blip(fromHz, toHz, seconds, type, volume) {
    if (!this.context || this.muted) return;
    try {
      const now = this.context.currentTime;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(fromHz, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, toHz), now + seconds);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(now);
      osc.stop(now + seconds + 0.02);
    } catch {
      // Sound is garnish: never let it break the game.
    }
  }

  // A burst of white noise through a low-pass filter (explosions, hits).
  noise(seconds, cutoffHz, volume) {
    if (!this.context || this.muted) return;
    try {
      const now = this.context.currentTime;
      const length = Math.max(1, Math.floor(this.context.sampleRate * seconds));
      const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      const filter = this.context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = cutoffHz;
      const gain = this.context.createGain();
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      source.start(now);
    } catch {
      // Sound is garnish: never let it break the game.
    }
  }

  shoot() { this.blip(880, 220, 0.09, 'square', 0.12); }
  enemyHit() { this.blip(320, 140, 0.06, 'triangle', 0.15); }
  playerHit() { this.noise(0.25, 900, 0.4); this.blip(180, 60, 0.25, 'sawtooth', 0.25); }
  explode() { this.noise(0.45, 1400, 0.5); this.blip(220, 40, 0.4, 'sawtooth', 0.2); }
  upgrade() {
    this.blip(523, 523, 0.1, 'sine', 0.25);
    setTimeout(() => this.blip(659, 659, 0.1, 'sine', 0.25), 90);
    setTimeout(() => this.blip(784, 784, 0.16, 'sine', 0.25), 180);
  }
  waveStart() { this.blip(220, 440, 0.25, 'sawtooth', 0.18); }
  victory() {
    [523, 659, 784, 1046].forEach((hz, i) => {
      setTimeout(() => this.blip(hz, hz, 0.22, 'sine', 0.28), i * 130);
    });
  }
  gameOver() { this.blip(392, 55, 0.9, 'sawtooth', 0.3); }
}
