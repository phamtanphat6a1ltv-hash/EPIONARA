class ASMRSoundManager {
  constructor() {
    this.ctx = null;
    this.buffers = {};
    this.initialized = false;
    this.loading = false;
    
    // Slime loops
    this.slimeSource = null;
    this.slimeGain = null;
  }

  async init() {
    if (this.initialized || this.loading) return;
    this.loading = true;
    
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        console.warn("Web Audio API is not supported in this browser.");
        this.loading = false;
        return;
      }
      
      this.ctx = new AudioContextClass();
      
      // Pre-load all 5 files
      await Promise.all([
        this.loadSound("pop", "/assets/audio/pop_heavy.wav"),
        this.loadSound("snap", "/assets/audio/bubble_snap.wav"),
        this.loadSound("squish_in", "/assets/audio/squish_in.mp3"),
        this.loadSound("squish_out", "/assets/audio/squish_out.mp3"),
        this.loadSound("slime", "/assets/audio/slime_loop.wav")
      ]);
      
      this.initialized = true;
      console.log("ASMR Audio Context initialized successfully!");
    } catch (e) {
      console.error("Failed to initialize ASMR sound context:", e);
    } finally {
      this.loading = false;
    }
  }

  async loadSound(name, url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      // Decode audio data
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      this.buffers[name] = audioBuffer;
    } catch (e) {
      console.warn(`Failed to load/decode ASMR sound "${name}" from "${url}":`, e);
    }
  }

  // Play a single-shot sound
  play(name, volume = 1) {
    if (!this.initialized || !this.ctx) return null;
    const buffer = this.buffers[name];
    if (!buffer) return null;

    try {
      // Resume context if suspended (browser security)
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;

      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);

      source.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      source.start(0);
      return { source, gainNode };
    } catch (e) {
      console.warn(`Failed to play sound "${name}":`, e);
      return null;
    }
  }

  // Slime continuous sound loops
  startSlimeLoop() {
    if (!this.initialized || !this.ctx) return;
    const buffer = this.buffers["slime"];
    if (!buffer || this.slimeSource) return;

    try {
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }

      this.slimeSource = this.ctx.createBufferSource();
      this.slimeSource.buffer = buffer;
      this.slimeSource.loop = true;

      this.slimeGain = this.ctx.createGain();
      this.slimeGain.gain.setValueAtTime(0, this.ctx.currentTime); // start silent

      this.slimeSource.connect(this.slimeGain);
      this.slimeGain.connect(this.ctx.destination);
      this.slimeSource.start(0);
    } catch (e) {
      console.warn("Failed to start slime audio loop:", e);
    }
  }

  setSlimeVolume(vol) {
    if (!this.initialized || !this.slimeGain || !this.ctx) return;
    try {
      // Smoothly transition volume to avoid popping clicks
      this.slimeGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05);
    } catch {
      // Fallback
      this.slimeGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }

  stopSlimeLoop() {
    if (this.slimeSource) {
      try {
        this.slimeSource.stop();
      } catch {}
      this.slimeSource = null;
      this.slimeGain = null;
    }
  }
}

// Export a singleton instance
export const asmrSoundManager = new ASMRSoundManager();
