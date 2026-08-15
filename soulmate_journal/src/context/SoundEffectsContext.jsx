import React, { createContext, useContext, useState, useEffect, useRef } from "react";

const SoundEffectsContext = createContext();

export function SoundEffectsProvider({ children }) {
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem("sj_sound_muted") !== "false"; // Default to muted
    } catch {
      return true;
    }
  });

  const audioCtxRef = useRef(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playClick = () => {
    if (isMuted) return;
    try {
      const ctx = initAudio();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      console.warn("Audio play fail:", e);
    }
  };

  const playBubble = () => {
    if (isMuted) return;
    try {
      const ctx = initAudio();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(350, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.warn("Audio play fail:", e);
    }
  };

  const playWater = () => {
    if (isMuted) return;
    try {
      const ctx = initAudio();
      const now = ctx.currentTime;
      
      // Let's create two bubble sweep sounds overlayed for a realistic splash
      [0, 0.05].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(180, now + delay);
        osc.frequency.exponentialRampToValueAtTime(1400, now + delay + 0.15);
        
        gain.gain.setValueAtTime(0.12, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.15);
        
        osc.start(now + delay);
        osc.stop(now + delay + 0.16);
      });
    } catch (e) {
      console.warn("Audio play fail:", e);
    }
  };

  const playSuccess = () => {
    if (isMuted) return;
    try {
      const ctx = initAudio();
      const now = ctx.currentTime;
      // Harmonic chime chord arpeggio (C5 -> E5 -> G5 -> C6)
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      
      freqs.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + index * 0.08);
        
        gain.gain.setValueAtTime(0.06, now + index * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.35);
        
        osc.start(now + index * 0.08);
        osc.stop(now + index * 0.08 + 0.4);
      });
    } catch (e) {
      console.warn("Audio play fail:", e);
    }
  };

  const playLevelUp = () => {
    if (isMuted) return;
    try {
      const ctx = initAudio();
      const now = ctx.currentTime;
      // Bright major scale upward fanfare
      const freqs = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51];
      
      freqs.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = index === freqs.length - 1 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq, now + index * 0.07);
        
        gain.gain.setValueAtTime(0.08, now + index * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.07 + 0.3);
        
        osc.start(now + index * 0.07);
        osc.stop(now + index * 0.07 + 0.35);
      });
    } catch (e) {
      console.warn("Audio play fail:", e);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem("sj_sound_muted", isMuted ? "true" : "false");
    } catch {}
  }, [isMuted]);

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (nextMute === false) {
      // Small trigger sound upon unmuting so the user gets immediate audio confirmation
      setTimeout(() => {
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(600, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
          gain.gain.setValueAtTime(0.05, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
          osc.start();
          osc.stop(ctx.currentTime + 0.15);
        } catch {}
      }, 50);
    }
  };

  return (
    <SoundEffectsContext.Provider value={{ isMuted, toggleMute, playClick, playBubble, playWater, playSuccess, playLevelUp }}>
      {children}
    </SoundEffectsContext.Provider>
  );
}

export function useSoundEffects() {
  const context = useContext(SoundEffectsContext);
  if (!context) {
    throw new Error("useSoundEffects must be used within a SoundEffectsProvider");
  }
  return context;
}
