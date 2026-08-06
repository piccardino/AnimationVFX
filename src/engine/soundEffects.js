// Web Audio API Synthesizer & Custom Audio Manager for Volleyball Overlays

class SoundEffectsEngine {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.customAudioBuffer = null;
    this.customAudioName = '';
    this.customAudioSource = null;
    this.destStreamNode = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  getDestinationNode() {
    this.init();
    if (!this.ctx) return null;
    return this.ctx.destination;
  }

  async loadCustomAudio(file) {
    this.init();
    if (!this.ctx || !file) return false;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const decodedBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      this.customAudioBuffer = decodedBuffer;
      this.customAudioName = file.name;
      return true;
    } catch (err) {
      console.error('Error loading custom audio file:', err);
      return false;
    }
  }

  removeCustomAudio() {
    this.customAudioBuffer = null;
    this.customAudioName = '';
  }

  playCustomAudio() {
    if (!this.enabled || !this.customAudioBuffer) return;
    this.init();
    if (!this.ctx) return;

    if (this.customAudioSource) {
      try { this.customAudioSource.stop(); } catch (e) {}
    }

    const source = this.ctx.createBufferSource();
    source.buffer = this.customAudioBuffer;
    source.connect(this.ctx.destination);
    source.start(0);
    this.customAudioSource = source;
  }

  playImpactBlock() {
    if (!this.enabled) return;
    if (this.customAudioBuffer) {
      this.playCustomAudio();
      return;
    }
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    
    // Sub bass thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.5);
    
    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.5);

    // Metal clank / impact noise
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 3;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    
    noise.start(t);
    noise.stop(t + 0.2);
  }

  playSuperSpike() {
    if (!this.enabled) return;
    if (this.customAudioBuffer) {
      this.playCustomAudio();
      return;
    }
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Pitch sweep fire swoosh
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.35);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.35);

    // Explosive crash
    setTimeout(() => this.playImpactBlock(), 150);
  }

  playAceLaser() {
    if (!this.enabled) return;
    if (this.customAudioBuffer) {
      this.playCustomAudio();
      return;
    }
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Laser frequency rise & chime
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(1800, t + 0.25);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.4);

    // High shimmer ping
    const chime = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    chime.type = 'triangle';
    chime.frequency.setValueAtTime(2400, t + 0.15);
    chimeGain.gain.setValueAtTime(0.3, t + 0.15);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    chime.connect(chimeGain);
    chimeGain.connect(this.ctx.destination);
    chime.start(t + 0.15);
    chime.stop(t + 0.6);
  }

  playScorePop() {
    if (!this.enabled) return;
    if (this.customAudioBuffer) {
      this.playCustomAudio();
      return;
    }
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, t);
    osc.frequency.setValueAtTime(659.25, t + 0.08);
    osc.frequency.setValueAtTime(783.99, t + 0.16);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.4);
  }
}

export const soundFX = new SoundEffectsEngine();
