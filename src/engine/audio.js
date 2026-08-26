// Web Audio synth engine for volleyball SFX with custom track support
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.customBuffer = null;
    this.customName = '';
    this.customSource = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  get hasCustom() { return !!this.customBuffer; }
  get fileName() { return this.customName; }
  get isLoaded() { return !!(this.ctx && this.enabled); }

  setEnabled(value) {
    this.enabled = !!value;
    if (value) this.init();
  }

  async loadCustom(file) {
    const ctx = this.init();
    if (!ctx || !file) return false;
    try {
      const buf = await ctx.decodeAudioData(await file.arrayBuffer());
      this.customBuffer = buf;
      this.customName = file.name;
      return true;
    } catch (err) {
      console.error('Audio decode failed:', err);
      return false;
    }
  }

  removeCustom() {
    this.customBuffer = null;
    this.customName = '';
  }

  playCustom() {
    if (!this.enabled || !this.customBuffer) return;
    const ctx = this.init();
    if (!ctx) return;
    if (this.customSource) { try { this.customSource.stop(); } catch { /* noop */ } }
    const src = ctx.createBufferSource();
    src.buffer = this.customBuffer;
    src.connect(ctx.destination);
    src.start(0);
    this.customSource = src;
  }

  /** Deep sub-bass thud + metallic clank noise burst */
  impact() {
    if (!this.enabled) return;
    if (this.customBuffer) return this.playCustom();
    const ctx = this.init();
    if (!ctx) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.5);
    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.5);

    const size = Math.floor(ctx.sampleRate * 0.2);
    const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 3;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.6, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    noise.connect(filter).connect(nGain).connect(ctx.destination);
    noise.start(t);
    noise.stop(t + 0.2);
  }

  /** Sawtooth pitch-sweep swoosh followed by the impact crash */
  spike() {
    if (!this.enabled) return;
    if (this.customBuffer) return this.playCustom();
    const ctx = this.init();
    if (!ctx) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.35);
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.35);

    setTimeout(() => this.impact(), 150);
  }

  /** Rising laser sweep with a high shimmer chime */
  ace() {
    if (!this.enabled) return;
    if (this.customBuffer) return this.playCustom();
    const ctx = this.init();
    if (!ctx) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(1800, t + 0.25);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.4);

    const chime = ctx.createOscillator();
    const cGain = ctx.createGain();
    chime.type = 'triangle';
    chime.frequency.setValueAtTime(2400, t + 0.15);
    cGain.gain.setValueAtTime(0.3, t + 0.15);
    cGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    chime.connect(cGain).connect(ctx.destination);
    chime.start(t + 0.15);
    chime.stop(t + 0.6);
  }

  /** Bright ascending score arpeggio pop */
  pop() {
    if (!this.enabled) return;
    if (this.customBuffer) return this.playCustom();
    const ctx = this.init();
    if (!ctx) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, t);
    osc.frequency.setValueAtTime(659.25, t + 0.08);
    osc.frequency.setValueAtTime(783.99, t + 0.16);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  /** Play the SFX matching a preset id */
  playForPreset(presetId) {
    switch (presetId) {
      case 'service_ace': return this.ace();
      case 'super_spike': return this.spike();
      case 'great_dig':
      case 'perfect_set':
      case 'match_point': return this.pop();
      default: return this.impact();
    }
  }
}

export const soundFX = new SoundEngine();
