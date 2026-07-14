class SoundscapeEngine {
  constructor() {
    this.audioContext = null;
    this.noiseNode = null;
    this.filterNode = null;
    this.gainNode = null;
    this.isPlaying = false;
  }

  init() {
    if (this.audioContext) return;
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  _createBrownNoise() {
    const bufferSize = 2 * this.audioContext.sampleRate;
    const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // (roughly) compensate for gain
    }

    const brownNoise = this.audioContext.createBufferSource();
    brownNoise.buffer = noiseBuffer;
    brownNoise.loop = true;
    return brownNoise;
  }

  start() {
    this.init();
    if (this.isPlaying) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.noiseNode = this._createBrownNoise();
    
    // Lowpass filter to muffle the noise into a "distant rain / cafe murmur" sound
    this.filterNode = this.audioContext.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.value = 400; // Deep, soothing rumble

    // Gain node for fade-in and volume control
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    // Fade in gently over 2 seconds
    this.gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 2);

    this.noiseNode.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    this.noiseNode.start();
    this.isPlaying = true;
  }

  stop() {
    if (!this.isPlaying) return;

    // Fade out gently over 1.5 seconds
    if (this.gainNode && this.audioContext) {
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, this.audioContext.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 1.5);
      
      // Schedule the actual stop and cleanup after the fade
      setTimeout(() => {
        if (this.noiseNode) {
          this.noiseNode.stop();
          this.noiseNode.disconnect();
          this.noiseNode = null;
        }
        if (this.filterNode) {
          this.filterNode.disconnect();
          this.filterNode = null;
        }
        if (this.gainNode) {
          this.gainNode.disconnect();
          this.gainNode = null;
        }
        this.isPlaying = false;
      }, 1500);
    } else {
      this.isPlaying = false;
    }
  }

  cleanup() {
    this.stop();
    if (this.audioContext) {
      setTimeout(() => {
        if (this.audioContext && this.audioContext.state !== 'closed') {
          this.audioContext.close();
        }
        this.audioContext = null;
      }, 2000);
    }
  }
}

// Export a singleton instance
export const soundscapeEngine = new SoundscapeEngine();
