// Web Audio API Synthesizer for realistic drone motor sound
// Creates quadcopter multi-harmonic rotor hum + propeller air turbulences

class DroneAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private motorOscs: { osc: OscillatorNode; gain: GainNode }[] = [];
  private noiseNode: AudioNode | null = null;
  private noiseGain: GainNode | null = null;
  private isRunning: boolean = false;

  public init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Quadcopter fundamental motor frequencies (4 brushless DC motors at ~130-180 Hz)
    const baseFreqs = [142, 144, 148, 151];

    baseFreqs.forEach((freq) => {
      if (!this.ctx || !this.masterGain) return;
      // Fundamental saw/square motor hum
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      // Low-pass filter to simulate drone shell damping
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start();

      this.motorOscs.push({ osc, gain });
    });

    // Rotor aerodynamic turbulence (pink/filtered white noise)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.06;
      b6 = white * 0.115926;
    }

    const whiteNoiseSource = this.ctx.createBufferSource();
    whiteNoiseSource.buffer = noiseBuffer;
    whiteNoiseSource.loop = true;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
    noiseFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    whiteNoiseSource.connect(noiseFilter);
    noiseFilter.connect(this.noiseGain);
    this.noiseGain.connect(this.masterGain);
    whiteNoiseSource.start();
    this.noiseNode = whiteNoiseSource;
  }

  public setThrottle(speedMultiplier: number) {
    if (!this.ctx || !this.isRunning) return;
    const baseFreqs = [142, 144, 148, 151];
    const targetMultiplier = Math.min(2.0, Math.max(0.8, speedMultiplier));

    this.motorOscs.forEach(({ osc }, idx) => {
      if (this.ctx) {
        osc.frequency.setTargetAtTime(
          baseFreqs[idx] * targetMultiplier,
          this.ctx.currentTime,
          0.05
        );
      }
    });
  }

  public start() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + 0.3);
    this.isRunning = true;
  }

  public stop() {
    if (!this.ctx || !this.masterGain) return;
    this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.4);
    this.isRunning = false;
  }

  public toggle(): boolean {
    if (this.isRunning) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public getIsPlaying(): boolean {
    return this.isRunning;
  }
}

export const droneAudio = new DroneAudioEngine();
