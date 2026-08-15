import { useState, useEffect, useRef } from "react";
import { useAppContext } from "../context/AppContext.jsx";
import { useGarden } from "../hooks/useStorage.js";

// =================== WEB AUDIO PROCEDURAL SYNTHESIS ENGINE ===================
class ZenAudioEngine {
  constructor() {
    this.ctx = null;
    this.nodes = {};
    this.masterGain = null;
  }
  
  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
  }
  
  resume() {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }
  
  setVolume(soundId, volume) {
    // volume is 0 to 1
    if (!this.ctx) this.init();
    this.resume();
    
    const targetVol = volume * 0.18; // cap individual volume for comfortable mixing
    
    if (volume > 0) {
      if (!this.nodes[soundId]) {
        this.startSound(soundId);
      }
      if (this.nodes[soundId] && this.nodes[soundId].gainNode) {
        this.nodes[soundId].gainNode.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.15);
      }
    } else {
      if (this.nodes[soundId]) {
        this.stopSound(soundId);
      }
    }
  }
  
  startSound(soundId) {
    if (!this.ctx) this.init();
    
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
    gainNode.connect(this.masterGain);
    
    const activeNodes = [];
    
    if (soundId === "rain") {
      // Procedural Rain: White noise filtered through a bandpass filter
      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1100;
      filter.Q.value = 1.2;
      
      whiteNoise.connect(filter);
      filter.connect(gainNode);
      whiteNoise.start();
      
      activeNodes.push(whiteNoise, filter);
    } 
    else if (soundId === "ocean") {
      // Procedural Ocean Waves: Pinkish-brown noise modulated by a very slow sinusoidal LFO
      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02; // Simple lowpass
        lastOut = output[i];
        output[i] *= 3.5;
      }
      
      const brownNoise = this.ctx.createBufferSource();
      brownNoise.buffer = noiseBuffer;
      brownNoise.loop = true;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 320;
      
      // Wave LFO: 12-second wave cycle
      const lfo = this.ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 0.083; 
      
      const lfoFilterGain = this.ctx.createGain();
      lfoFilterGain.gain.value = 220;
      
      const lfoVolumeGain = this.ctx.createGain();
      lfoVolumeGain.gain.value = 0.45;
      
      lfo.connect(lfoFilterGain);
      lfoFilterGain.connect(filter.frequency);
      
      lfo.connect(lfoVolumeGain);
      
      const waveGain = this.ctx.createGain();
      waveGain.gain.value = 0.5;
      lfoVolumeGain.connect(waveGain.gain);
      
      brownNoise.connect(filter);
      filter.connect(waveGain);
      waveGain.connect(gainNode);
      
      brownNoise.start();
      lfo.start();
      
      activeNodes.push(brownNoise, filter, lfo, lfoFilterGain, lfoVolumeGain, waveGain);
    }
    else if (soundId === "chimes") {
      // Procedural Zen Chimes: Recursive random bell chimes with long decays playing a calming pentatonic scale
      let isPlaying = true;
      const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25]; // C D E G A C D E (Calm Pentatonic)
      
      const playNextChime = () => {
        if (!isPlaying || !this.ctx) return;
        const now = this.ctx.currentTime;
        const note = notes[Math.floor(Math.random() * notes.length)];
        
        const osc = this.ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(note, now);
        
        // Dynamic vibrato
        const vibrato = this.ctx.createOscillator();
        vibrato.frequency.value = 3.5;
        const vibGain = this.ctx.createGain();
        vibGain.gain.value = 1.8;
        
        vibrato.connect(vibGain);
        vibGain.connect(osc.frequency);
        vibrato.start();
        
        const chimeGain = this.ctx.createGain();
        chimeGain.gain.setValueAtTime(0, now);
        chimeGain.gain.linearRampToValueAtTime(0.06, now + 0.15);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 6); // 6-second tail decay
        
        osc.connect(chimeGain);
        chimeGain.connect(gainNode);
        
        osc.start();
        osc.stop(now + 6.1);
        vibrato.stop(now + 6.1);
        
        const nextDelay = Math.random() * 5000 + 2500; // random 2.5 - 7.5 seconds
        this.nodes[soundId].timers.push(setTimeout(playNextChime, nextDelay));
      };
      
      this.nodes[soundId] = {
        gainNode,
        timers: [],
        stop: () => {
          isPlaying = false;
          if (this.nodes[soundId]?.timers) {
            this.nodes[soundId].timers.forEach(clearTimeout);
          }
        }
      };
      
      playNextChime();
      return;
    }
    else if (soundId === "beats") {
      // Binaural beats for Alpha brain waves: 108Hz Left channel, 118Hz Right channel (10Hz Alpha entrainment)
      const oscL = this.ctx.createOscillator();
      oscL.type = "sine";
      oscL.frequency.value = 108;
      
      const oscR = this.ctx.createOscillator();
      oscR.type = "sine";
      oscR.frequency.value = 118;
      
      const pannerL = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
      const pannerR = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
      
      if (pannerL && pannerR) {
        pannerL.pan.value = -1;
        pannerR.pan.value = 1;
        oscL.connect(pannerL);
        oscR.connect(pannerR);
        pannerL.connect(gainNode);
        pannerR.connect(gainNode);
      } else {
        const merger = this.ctx.createChannelMerger(2);
        oscL.connect(merger, 0, 0);
        oscR.connect(merger, 0, 1);
        merger.connect(gainNode);
        activeNodes.push(merger);
      }
      
      oscL.start();
      oscR.start();
      
      activeNodes.push(oscL, oscR);
      if (pannerL) activeNodes.push(pannerL, pannerR);
    }
    else if (soundId === "wind") {
      // Ambient Wind: slowly modulating bandpass filter sweeping white noise
      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 350;
      filter.Q.value = 2.5;
      
      const sweepLfo = this.ctx.createOscillator();
      sweepLfo.type = "sine";
      sweepLfo.frequency.value = 0.045; // 22s sweep cycle
      
      const sweepGain = this.ctx.createGain();
      sweepGain.gain.value = 200;
      
      sweepLfo.connect(sweepGain);
      sweepGain.connect(filter.frequency);
      
      whiteNoise.connect(filter);
      filter.connect(gainNode);
      
      whiteNoise.start();
      sweepLfo.start();
      
      activeNodes.push(whiteNoise, filter, sweepLfo, sweepGain);
    }
    else if (soundId === "melody") {
      // Procedural Melodious Healing Ambient Music: Soft warm pads + gentle pentatonic flute notes
      let isPlaying = true;
      
      const chords = [
        [130.81, 164.81, 196.00, 246.94], // Cmaj7 (C3, E3, G3, B3)
        [174.61, 220.00, 261.63, 329.63], // Fmaj7 (F3, A3, C4, E4)
        [110.00, 164.81, 220.00, 261.63], // Am7 (A2, E3, A3, C4)
        [146.83, 196.00, 246.94, 293.66], // G (G3, G3, B3, D4)
      ];
      const melodyNotes = [329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00]; // E4 G4 A4 C5 D5 E5 G5 A5
      
      let chordIdx = 0;
      
      const playPad = () => {
        if (!isPlaying || !this.ctx) return;
        const now = this.ctx.currentTime;
        const chord = chords[chordIdx];
        chordIdx = (chordIdx + 1) % chords.length;
        
        chord.forEach((freq) => {
          const osc = this.ctx.createOscillator();
          const filter = this.ctx.createBiquadFilter();
          const oscGain = this.ctx.createGain();
          
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now);
          
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(400, now);
          
          oscGain.gain.setValueAtTime(0, now);
          oscGain.gain.linearRampToValueAtTime(0.04, now + 1.5); // slow attack
          oscGain.gain.setValueAtTime(0.04, now + 4.5);
          oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 6); // slow release
          
          osc.connect(filter);
          filter.connect(oscGain);
          oscGain.connect(gainNode);
          
          osc.start(now);
          osc.stop(now + 6.1);
          activeNodes.push(osc, filter, oscGain);
        });
        
        const padTimer = setTimeout(playPad, 6000);
        this.nodes[soundId].timers.push(padTimer);
      };
      
      const playMelody = () => {
        if (!isPlaying || !this.ctx) return;
        
        // 70% chance to play a note
        if (Math.random() < 0.7) {
          const now = this.ctx.currentTime;
          const freq = melodyNotes[Math.floor(Math.random() * melodyNotes.length)];
          
          const osc = this.ctx.createOscillator();
          const delay = this.ctx.createDelay ? this.ctx.createDelay() : null;
          const delayGain = this.ctx.createGain();
          const oscGain = this.ctx.createGain();
          
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now);
          
          // Add soft vibrato
          const vibrato = this.ctx.createOscillator();
          const vibGain = this.ctx.createGain();
          vibrato.frequency.value = 4.5;
          vibGain.gain.value = 2.0;
          vibrato.connect(vibGain);
          vibGain.connect(osc.frequency);
          
          oscGain.gain.setValueAtTime(0, now);
          oscGain.gain.linearRampToValueAtTime(0.03, now + 0.2); // soft attack
          oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);
          
          if (delay) {
            delay.delayTime.value = 0.4;
            delayGain.gain.value = 0.4; // feedback volume
            
            osc.connect(oscGain);
            oscGain.connect(gainNode);
            
            oscGain.connect(delay);
            delay.connect(delayGain);
            delayGain.connect(delay); 
            delayGain.connect(gainNode);
            activeNodes.push(osc, oscGain, delay, delayGain, vibrato, vibGain);
          } else {
            osc.connect(oscGain);
            oscGain.connect(gainNode);
            activeNodes.push(osc, oscGain, vibrato, vibGain);
          }
          
          osc.start(now);
          vibrato.start(now);
          osc.stop(now + 4);
          vibrato.stop(now + 4);
        }
        
        const nextDelay = 1500 + Math.random() * 1500; // 1.5 - 3 seconds
        const melTimer = setTimeout(playMelody, nextDelay);
        this.nodes[soundId].timers.push(melTimer);
      };
      
      this.nodes[soundId] = {
        gainNode,
        timers: [],
        stop: () => {
          isPlaying = false;
          if (this.nodes[soundId]?.timers) {
            this.nodes[soundId].timers.forEach(clearTimeout);
          }
          activeNodes.forEach(node => {
            try { node.stop(); } catch {}
          });
        }
      };
      
      playPad();
      playMelody();
      return;
    }
    
    this.nodes[soundId] = {
      gainNode,
      activeNodes,
      stop: () => {
        activeNodes.forEach(node => {
          try { node.stop(); } catch {}
        });
      }
    };
  }
  
  stopSound(soundId) {
    if (this.nodes[soundId]) {
      this.nodes[soundId].stop();
      delete this.nodes[soundId];
    }
  }
  
  stopAll() {
    Object.keys(this.nodes).forEach(id => this.stopSound(id));
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

// Instantiate shared soundscape engine
const sharedZenEngine = new ZenAudioEngine();

// =================== LOCALIZATION DICTIONARIES ===================
const ZEN_LOCALIZATION = {
  vi: {
    dock_tooltip: "Góc thiền định & Cân bằng",
    title: "Không Gian Thiền Zen",
    subtitle: "Giao hưởng âm thanh & Nhịp thở sinh học",
    tab_sounds: "🎧 Mixer Âm Thanh",
    tab_breath: "🌬️ Thở Thiền Định",
    tab_affirmations: "✨ Hạt Giống Tích Cực",
    sound_rain: "Mưa Rơi",
    sound_ocean: "Sóng Biển",
    sound_chimes: "Chuông Gió",
    sound_beats: "Sóng Não Alpha",
    sound_wind: "Gió Rì Rào",
    sound_melody: "Nhạc Thiền Du Dương",
    breath_breathe_in: "Hít Vào...",
    breath_hold: "Giữ Hơi...",
    breath_breathe_out: "Thở Ra...",
    breath_relax: "Nghỉ Ngơi...",
    breath_pattern: "Phương pháp thở:",
    breath_calm: "Thở hộp (Giảm stress)",
    breath_relax_pattern: "Thở 4-7-8 (Thư giãn sâu)",
    breath_coherence: "Thở cân bằng (Ổn định nhịp tim)",
    btn_mute_all: "Tắt âm thanh",
    affirm_draw: "Gieo hạt giống tích cực mới",
    empty_mixer: "Tất cả âm thanh đang tắt. Hãy trượt để pha trộn âm thanh của riêng bạn!",
    affirmations: [
      "Tôi luôn tử tế với chính mình. Tôi đang cố gắng từng ngày. 💙",
      "Mọi cảm xúc của tôi đều có giá trị và xứng đáng được lắng nghe. 🌿",
      "Hít vào bình yên, thở ra lo lắng. Tôi an sau trong khoảnh khắc này. ✨",
      "Quá khứ đã qua, tương lai chưa đến. Tôi trân trọng trọn vẹn hiện tại. 🧭",
      "Bản thân tôi là một vũ trụ diệu kỳ đang dần hé mở từng ngày. 🪐",
      "Tôi giải phóng mọi phán xét tiêu cực về bản thân hôm nay. 🌸",
      "Tâm hồn tôi như mặt hồ phẳng lặng, phản chiếu sự bình yên. 🌊",
      "Mỗi bước đi nhỏ đều đưa tôi đến gần hơn với sự chữa lành hoàn thiện. 🚀"
    ]
  },
  en: {
    dock_tooltip: "Zen Meditation & Balance Dock",
    title: "Zen Sanctuary",
    subtitle: "Custom ambient mixer & guided coherence breathing",
    tab_sounds: "🎧 Sound Mixer",
    tab_breath: "🌬️ Breathing Coach",
    tab_affirmations: "✨ Positivity Seeds",
    sound_rain: "Rainfall",
    sound_ocean: "Ocean Waves",
    sound_chimes: "Wind Chimes",
    sound_beats: "Alpha Beats",
    sound_wind: "Whistling Wind",
    sound_melody: "Healing Melody",
    breath_breathe_in: "Breathe In...",
    breath_hold: "Hold...",
    breath_breathe_out: "Breathe Out...",
    breath_relax: "Rest...",
    breath_pattern: "Breathing Pattern:",
    breath_calm: "Box Breathing (De-stress)",
    breath_relax_pattern: "4-7-8 Breathing (Deep Sleep)",
    breath_coherence: "Coherence 5-5 (Balance)",
    btn_mute_all: "Mute All Channels",
    affirm_draw: "Draw a new positive seed",
    empty_mixer: "All channels muted. Slide volume controls to mix your own soundscape!",
    affirmations: [
      "I am kind to myself. I am doing the best I can every day. 💙",
      "All of my emotions are valid and deserve to be heard. 🌿",
      "Inhale peace, exhale worry. I am safe in this present moment. ✨",
      "The past is gone, the future is unwritten. I embrace the now. 🧭",
      "I am a beautiful inner universe unfolding day by day. 🪐",
      "I release all harsh judgments about myself today. 🌸",
      "My mind is like a serene lake, reflecting calm and balance. 🌊",
      "Every small step brings me closer to total emotional healing. 🚀"
    ]
  }
};

// =================== ZEN MEDITATION DOCK COMPONENT ===================
export function ZenMeditationDock() {
  const { lang } = useAppContext();
  const { rewardXP } = useGarden();
  const activeLang = lang === "vi" ? "vi" : "en";
  const tLocal = ZEN_LOCALIZATION[activeLang];

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("sounds");
  
  // Audio Mixer State
  const [volumes, setVolumes] = useState({
    melody: 0,
    rain: 0,
    ocean: 0,
    chimes: 0,
    beats: 0,
    wind: 0
  });

  const handleVolumeChange = (soundId, value) => {
    const vol = parseFloat(value);
    setVolumes(prev => ({ ...prev, [soundId]: vol }));
    sharedZenEngine.setVolume(soundId, vol);
    if (vol > 0) {
      rewardXP(15, 4); // Quest 4: Ngồi yên 5 phút / Nghe nhạc thiền
    }
  };

  const handleMuteAll = () => {
    setVolumes({ melody: 0, rain: 0, ocean: 0, chimes: 0, beats: 0, wind: 0 });
    sharedZenEngine.stopAll();
  };

  // Guided Breathing States
  const [breathPattern, setBreathPattern] = useState("box"); // "box", "relax", "coherence"
  const [breathState, setBreathState] = useState("in"); // "in", "hold", "out", "hold_out"
  const [breathSeconds, setBreathSeconds] = useState(4);
  const breathTimer = useRef(null);

  // Breathing configuration loops
  const patternsConfig = {
    box: [
      { state: "in", duration: 4, text: tLocal.breath_breathe_in },
      { state: "hold", duration: 4, text: tLocal.breath_hold },
      { state: "out", duration: 4, text: tLocal.breath_breathe_out },
      { state: "hold_out", duration: 4, text: tLocal.breath_relax }
    ],
    relax: [
      { state: "in", duration: 4, text: tLocal.breath_breathe_in },
      { state: "hold", duration: 7, text: tLocal.breath_hold },
      { state: "out", duration: 8, text: tLocal.breath_breathe_out }
    ],
    coherence: [
      { state: "in", duration: 5, text: tLocal.breath_breathe_in },
      { state: "out", duration: 5, text: tLocal.breath_breathe_out }
    ]
  };

  // Open Zen Dock via event listener
  useEffect(() => {
    const handleOpen = (e) => {
      setIsOpen(true);
      if (e.detail?.tab) {
        setActiveTab(e.detail.tab);
      }
    };
    window.addEventListener("open-zen-dock", handleOpen);
    return () => window.removeEventListener("open-zen-dock", handleOpen);
  }, []);

  // Run guided breath countdown
  useEffect(() => {
    if (!isOpen || activeTab !== "breath") {
      if (breathTimer.current) clearInterval(breathTimer.current);
      return;
    }

    rewardXP(15, 1); // Quest 1: Hít thở sâu 2 phút

    const currentConfig = patternsConfig[breathPattern];
    let stepIdx = currentConfig.findIndex(c => c.state === breathState);
    if (stepIdx === -1) stepIdx = 0;

    let secondsLeft = breathSeconds;

    breathTimer.current = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft <= 0) {
        // Switch to next breathing phase
        const nextIdx = (stepIdx + 1) % currentConfig.length;
        const nextPhase = currentConfig[nextIdx];
        setBreathState(nextPhase.state);
        setBreathSeconds(nextPhase.duration);
        secondsLeft = nextPhase.duration;
      } else {
        setBreathSeconds(secondsLeft);
      }
    }, 1000);

    return () => clearInterval(breathTimer.current);
  }, [isOpen, activeTab, breathPattern, breathState, breathSeconds, activeLang]);

  // Affirmation Card State
  const [affirmationIdx, setAffirmationIdx] = useState(0);
  const [isFading, setIsFading] = useState(false);

  const drawAffirmation = () => {
    setIsFading(true);
    setTimeout(() => {
      const allAff = tLocal.affirmations;
      let nextIdx = Math.floor(Math.random() * allAff.length);
      while (nextIdx === affirmationIdx && allAff.length > 1) {
        nextIdx = Math.floor(Math.random() * allAff.length);
      }
      setAffirmationIdx(nextIdx);
      setIsFading(false);
    }, 350);
  };

  // Determine current breathing animation scale and text
  const currentConfig = patternsConfig[breathPattern];
  const currentStep = currentConfig?.find(c => c.state === breathState) || currentConfig?.[0];
  const currentBreathText = currentStep?.text || tLocal.breath_breathe_in;

  let bubbleScale = 1.0;
  if (breathState === "in") {
    // scale grows from 1 to 1.8 based on progress
    const pct = (currentStep.duration - breathSeconds) / currentStep.duration;
    bubbleScale = 1.0 + (pct * 0.75);
  } else if (breathState === "hold") {
    bubbleScale = 1.75;
  } else if (breathState === "out") {
    // scale shrinks from 1.75 to 1.0 based on progress
    const pct = (currentStep.duration - breathSeconds) / currentStep.duration;
    bubbleScale = 1.75 - (pct * 0.75);
  } else {
    bubbleScale = 1.0;
  }

  // Handle cleanup on unmount
  useEffect(() => {
    return () => {
      sharedZenEngine.stopAll();
    };
  }, []);

  return (
    <>
      {/* FLOATING TRIGGER BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={tLocal.dock_tooltip}
        aria-label={tLocal.dock_tooltip}
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          width: 58,
          height: 58,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #10b981, #047857)",
          border: "2px solid rgba(255,255,255,0.15)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 26,
          boxShadow: "0 8px 32px rgba(16,185,129,0.35), 0 0 15px rgba(16,185,129,0.2)",
          zIndex: 7500,
          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = "scale(1.1) rotate(10deg)";
          e.currentTarget.style.boxShadow = "0 10px 36px rgba(16,185,129,0.5), 0 0 25px rgba(16,185,129,0.3)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "scale(1) rotate(0deg)";
          e.currentTarget.style.boxShadow = "0 8px 32px rgba(16,185,129,0.35), 0 0 15px rgba(16,185,129,0.2)";
        }}
      >
        🧘
      </button>

      {/* ZEN SLIDE-OUT PANEL DRAWER */}
      <div style={{
        position: "fixed",
        top: 0,
        right: isOpen ? 0 : -420,
        width: 380,
        height: "100vh",
        background: "rgba(8, 7, 24, 0.94)",
        backdropFilter: "blur(24px)",
        borderLeft: "1px solid rgba(16,185,129,0.2)",
        boxShadow: "-10px 0 40px rgba(0,0,0,0.8)",
        zIndex: 8000,
        transition: "right 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
        display: "flex",
        flexDirection: "column",
        color: "white"
      }}>
        {/* Panel Header */}
        <div style={{
          padding: "28px 24px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: 19,
              fontWeight: 800,
              background: "linear-gradient(135deg, #10b981, #34d399, #60a5fa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>{tLocal.title}</h3>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11.5, display: "block", marginTop: 4 }}>{tLocal.subtitle}</span>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.03)",
              color: "rgba(255,255,255,0.5)",
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.color = "white"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
          >
            ✕
          </button>
        </div>

        {/* Tab Selection */}
        <div style={{
          display: "flex",
          padding: "12px 20px",
          gap: 6,
          background: "rgba(0,0,0,0.2)",
          borderBottom: "1px solid rgba(255,255,255,0.04)"
        }}>
          {[
            { id: "sounds", label: tLocal.tab_sounds.split(" ")[0] },
            { id: "breath", label: tLocal.tab_breath.split(" ")[0] },
            { id: "affirm", label: tLocal.tab_affirmations.split(" ")[0] }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: 10,
                border: "none",
                background: activeTab === tab.id ? "rgba(16,185,129,0.15)" : "transparent",
                color: activeTab === tab.id ? "#34d399" : "rgba(255,255,255,0.45)",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Panel Main Area */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {/* TAB 1: MIXER SOUNDS */}
          {activeTab === "sounds" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "fadeIn 0.3s ease" }}>
              {[
                { id: "melody", label: tLocal.sound_melody, icon: "🎵" },
                { id: "rain", label: tLocal.sound_rain, icon: "🌧️" },
                { id: "ocean", label: tLocal.sound_ocean, icon: "🌊" },
                { id: "chimes", label: tLocal.sound_chimes, icon: "🔔" },
                { id: "beats", label: tLocal.sound_beats, icon: "🧠" },
                { id: "wind", label: tLocal.sound_wind, icon: "💨" }
              ].map(sound => (
                <div key={sound.id} style={{
                  background: volumes[sound.id] > 0 ? "rgba(16,185,129,0.05)" : "rgba(255,255,255,0.01)",
                  border: `1px solid ${volumes[sound.id] > 0 ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.04)"}`,
                  borderRadius: 18,
                  padding: "16px 20px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700 }}>
                      <span style={{ fontSize: 20 }}>{sound.icon}</span>
                      <span style={{ color: volumes[sound.id] > 0 ? "#34d399" : "white" }}>{sound.label}</span>
                    </div>
                    {volumes[sound.id] > 0 && (
                      <span style={{ fontSize: 11, color: "#34d399", fontWeight: 800 }}>
                        {Math.round(volumes[sound.id] * 100)}%
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ opacity: 0.3, fontSize: 12 }}>🔈</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volumes[sound.id]}
                      onChange={e => handleVolumeChange(sound.id, e.target.value)}
                      style={{
                        flex: 1,
                        height: 5,
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: 3,
                        accentColor: "#10b981",
                        cursor: "pointer"
                      }}
                      aria-label={sound.label}
                    />
                    <span style={{ opacity: 0.3, fontSize: 12 }}>🔊</span>
                  </div>
                </div>
              ))}

              {Object.values(volumes).every(v => v === 0) ? (
                <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", padding: "20px 0", fontSize: 13, fontStyle: "italic" }}>
                  {tLocal.empty_mixer}
                </div>
              ) : (
                <button
                  onClick={handleMuteAll}
                  style={{
                    padding: "12px",
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    color: "#f87171",
                    borderRadius: 14,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    marginTop: 10,
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.15)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
                >
                  🔇 {tLocal.btn_mute_all}
                </button>
              )}
            </div>
          )}

          {/* TAB 2: BREATHING GUIDE */}
          {activeTab === "breath" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32, animation: "fadeIn 0.3s ease" }}>
              
              {/* Pattern Selector */}
              <div style={{ width: "100%" }}>
                <label style={{ display: "block", color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {tLocal.breath_pattern}
                </label>
                <select
                  value={breathPattern}
                  onChange={e => {
                    const nextPattern = e.target.value;
                    setBreathPattern(nextPattern);
                    const defaultPhase = patternsConfig[nextPattern][0];
                    setBreathState(defaultPhase.state);
                    setBreathSeconds(defaultPhase.duration);
                  }}
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    padding: "10px 14px",
                    color: "white",
                    fontSize: 14,
                    fontWeight: 600,
                    outline: "none"
                  }}
                >
                  <option value="box" style={{ background: "#080718" }}>{tLocal.breath_calm}</option>
                  <option value="relax" style={{ background: "#080718" }}>{tLocal.breath_relax_pattern}</option>
                  <option value="coherence" style={{ background: "#080718" }}>{tLocal.breath_coherence}</option>
                </select>
              </div>

              {/* Dynamic Breathing Bubble */}
              <div style={{
                position: "relative",
                width: 200,
                height: 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 20
              }}>
                {/* Pulsing Aura Rings */}
                <div style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)",
                  transform: `scale(${bubbleScale})`,
                  transition: "transform 1s linear",
                  zIndex: 0
                }} />
                
                {/* Main Orb Bubble */}
                <div style={{
                  position: "relative",
                  width: 130,
                  height: 130,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #10b981, #047857)",
                  border: "2px solid rgba(255,255,255,0.25)",
                  boxShadow: "0 0 30px rgba(16,185,129,0.4), inset 0 2px 10px rgba(255,255,255,0.3)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${bubbleScale * 0.85})`,
                  transition: "transform 1s linear",
                  zIndex: 1
                }}>
                  <span style={{ fontSize: 28, fontWeight: 900, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                    {breathSeconds}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 4, opacity: 0.8 }}>
                    sec
                  </span>
                </div>
              </div>

              {/* Instruction Text */}
              <div style={{ textAlign: "center" }}>
                <h4 style={{
                  margin: "0 0 8px",
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#34d399",
                  textShadow: "0 0 10px rgba(52,211,153,0.2)"
                }}>
                  {currentBreathText}
                </h4>
                <p style={{
                  margin: 0,
                  color: "rgba(255,255,255,0.45)",
                  fontSize: 13,
                  maxWidth: 240,
                  lineHeight: 1.5
                }}>
                  {breathPattern === "box" 
                    ? "Hít vào 4s, giữ hơi 4s, thở ra 4s, và dừng 4s."
                    : breathPattern === "relax"
                      ? "Hít vào 4s, giữ hơi thật sâu 7s, thở ra chậm rãi 8s."
                      : "Hít vào 5s sâu và thở ra 5s đều đặn."
                  }
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: DAILY POSITIVE SEEDS */}
          {activeTab === "affirm" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 28, animation: "fadeIn 0.3s ease" }}>
              {/* Positive Seed Glass Card */}
              <div style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
                border: "1px solid rgba(16,185,129,0.25)",
                borderRadius: 24,
                padding: "36px 28px",
                minHeight: 180,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                boxShadow: "0 15px 30px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1)",
                position: "relative",
                overflow: "hidden",
                transition: "opacity 0.35s ease, transform 0.35s ease",
                opacity: isFading ? 0 : 1,
                transform: isFading ? "scale(0.95)" : "scale(1)"
              }}>
                <div style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: "radial-gradient(circle at center, rgba(16,185,129,0.08) 0%, transparent 80%)",
                  pointerEvents: "none"
                }} />
                
                <p style={{
                  margin: 0,
                  fontSize: 16.5,
                  fontWeight: 700,
                  lineHeight: 1.8,
                  fontStyle: "italic",
                  color: "#e2e8f0",
                  textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                  position: "relative",
                  zIndex: 1
                }}>
                  "{tLocal.affirmations[affirmationIdx]}"
                </p>
              </div>

              {/* Draw Button */}
              <button
                onClick={drawAffirmation}
                style={{
                  padding: "12px 24px",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  border: "none",
                  color: "white",
                  borderRadius: 14,
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: "pointer",
                  boxShadow: "0 4px 15px rgba(16,185,129,0.25)",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
              >
                🌱 {tLocal.affirm_draw}
              </button>
            </div>
          )}
        </div>

        {/* Panel Footer */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          textAlign: "center",
          background: "rgba(0,0,0,0.15)"
        }}>
          <p style={{ margin: 0, fontSize: 10.5, color: "rgba(255,255,255,0.3)" }}>
            © 2026 EPIONARA · Zen Room
          </p>
        </div>
      </div>

      {/* Floating Buttons Styling Block */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          button[title*="Zen"], button[aria-label*="Zen"] {
            bottom: 80px !important;
          }
        }
      `}</style>
    </>
  );
}
