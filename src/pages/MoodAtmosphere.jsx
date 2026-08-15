import { useState, useEffect, useRef } from "react";
import { MOOD_ATMOSPHERES } from "../utils/constants.js";
import { useThemeContext } from "../context/ThemeContext.jsx";

// =================== MOOD AVATAR ===================
export function MoodAvatar({ mood = 5, size = 120 }) {
  const atm = MOOD_ATMOSPHERES[mood] || MOOD_ATMOSPHERES[5];
  const emojis = { 8:"🤩", 7:"😄", 6:"😊", 5:"🙂", 4:"😐", 3:"😕", 2:"😢", 1:"😭" };
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `radial-gradient(circle at 35% 35%, ${atm.accent}33, ${atm.accent}11)`,
      border: `2px solid ${atm.accent}44`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.45,
      boxShadow: `0 0 ${size*0.3}px ${atm.aurora}, 0 0 ${size*0.1}px ${atm.accent}22`,
      animation: "glowPulse 3s ease-in-out infinite",
      flexShrink: 0,
    }}>
      {emojis[mood] || "🙂"}
      <style>{`
        @keyframes glowPulse {
          0%,100% { box-shadow: 0 0 ${size*0.3}px ${atm.aurora}, 0 0 ${size*0.1}px ${atm.accent}22; }
          50%      { box-shadow: 0 0 ${size*0.5}px ${atm.aurora}, 0 0 ${size*0.2}px ${atm.accent}44; }
        }
      `}</style>
    </div>
  );
}

// =================== MOOD ATMOSPHERE WRAPPER ===================
// Wraps children in a dynamic atmospheric background based on mood score
export function MoodAtmosphereWrapper({ mood = 5, children }) {
  const { theme } = useThemeContext();
  const atm = MOOD_ATMOSPHERES[mood] || MOOD_ATMOSPHERES[5];
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  let bgColor = atm.bg;
  let auroraColor = atm.aurora;
  let particleColor = atm.particle;

  if (theme === "light") {
    bgColor = "#f4f7f6";
    auroraColor = "rgba(108, 61, 232, 0.12)";
    particleColor = "108, 61, 232";
  } else if (theme === "ocean") {
    bgColor = "#C6FFC9";
    auroraColor = "rgba(0, 123, 210, 0.15)";
    particleColor = "0, 123, 210";
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth || 800;
    canvas.height = canvas.offsetHeight || 600;

    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -Math.random() * 0.6 - 0.2,
      alpha: Math.random() * 0.4 + 0.1,
    }));

    const rgb = particleColor;

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.alpha -= 0.001;
        if (p.y < 0 || p.alpha <= 0) {
          p.x = Math.random() * canvas.width;
          p.y = canvas.height + 10;
          p.alpha = Math.random() * 0.4 + 0.1;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${p.alpha})`;
        ctx.fill();
      });
      animRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [mood, particleColor]);

  return (
    <div style={{ position: "relative", background: bgColor, minHeight: "100vh", overflow: "hidden", transition: "background 1s ease" }}>
      {/* Aurora glow */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "40%",
        background: `radial-gradient(ellipse at 50% 0%, ${auroraColor} 0%, transparent 70%)`,
        pointerEvents: "none", zIndex: 0,
        transition: "background 1s ease"
      }} />
      {/* Particles */}
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}
      />
      {/* Content */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}

// Global shared AudioContext to prevent memory leaks
let sharedAudioCtx = null;
const getAudioCtx = () => {
  if (!sharedAudioCtx) sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return sharedAudioCtx;
};

// =================== HEALING SOUNDS WIDGET ===================
export function HealingSounds({ t = {} }) {
  const [playing, setPlaying] = useState(null);
  const [vol, setVol] = useState(60);
  const freqRef = useRef(null);

  const sounds = [
    { id:"rain",   label: t.sound_rain   || "🌧️ Rain",       color:"#3b82f6", freq:440, type:"sawtooth" },
    { id:"ocean",  label: t.sound_ocean  || "🌊 Ocean",       color:"#22d3ee", freq:180, type:"sine"     },
    { id:"piano",  label: t.sound_piano  || "🎹 Piano",       color:"#a78bfa", freq:528, type:"sine"     },
    { id:"forest", label: t.sound_forest || "🌲 Rừng",        color:"#22c55e", freq:396, type:"triangle" },
    { id:"cafe",   label: t.sound_cafe   || "☕ Café",         color:"#f59e0b", freq:320, type:"triangle" },
    { id:"white",  label: t.sound_white  || "🔮 White Noise", color:"#6b7280", freq:0,   type:"noise"    },
  ];

  const play = (sound) => {
    if (playing === sound.id) {
      setPlaying(null);
      if (freqRef.current) { freqRef.current.stop(); freqRef.current = null; }
      return;
    }
    if (freqRef.current) { freqRef.current.stop(); freqRef.current = null; }
    try {
      const ctx = getAudioCtx();
      if (ctx.state === "suspended") ctx.resume();
      let src;
      if (sound.type === "noise") {
        const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      } else {
        src = ctx.createOscillator(); src.type = sound.type; src.frequency.value = sound.freq;
        const lfo = ctx.createOscillator(); lfo.frequency.value = 0.3;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = sound.id === "ocean" ? 40 : sound.id === "rain" ? 60 : 8;
        lfo.connect(lfoGain); lfoGain.connect(src.frequency); lfo.start();
      }
      const gainNode = ctx.createGain(); gainNode.gain.value = vol / 500;
      src.connect(gainNode); gainNode.connect(ctx.destination); src.start();
      freqRef.current = { stop: () => { try { src.stop(); } catch(e) { console.error("EPIONARA Audio Error:", e); } } };
    } catch(e) { console.error("EPIONARA Audio Error:", e); }
    setPlaying(sound.id);
  };

  useEffect(() => () => { if (freqRef.current) freqRef.current.stop(); }, []);

  return (
    <div style={{ background:"var(--glass-bg, rgba(255,255,255,0.04))", border:"1px solid var(--glass-border, rgba(255,255,255,0.09))", borderRadius:20, padding:"24px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
        <span style={{ fontSize:20 }}>🎧</span>
        <span style={{ color:"var(--text-primary, white)", fontWeight:700, fontSize:16 }}>{t.sound_title || "Healing Sounds"}</span>
        {playing && <span style={{ marginLeft:"auto", color:"#22c55e", fontSize:12, animation:"pulse 1.5s ease infinite" }}>● {t.sound_playing || "Playing..."}</span>}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:16 }}>
        {sounds.map(s => (
          <button key={s.id} onClick={() => play(s)} style={{
            padding:"12px 8px", borderRadius:14,
            background: playing === s.id ? `${s.color}25` : "var(--glass1, rgba(255,255,255,0.04))",
            border:`1px solid ${playing === s.id ? s.color+"66" : "var(--border1, rgba(255,255,255,0.08))"}`,
            color: playing === s.id ? s.color : "var(--text-secondary, rgba(255,255,255,0.75))",
            cursor:"pointer", fontSize:12, fontWeight: playing === s.id ? 700 : 400,
            transition:"all 0.2s", display:"flex", flexDirection:"column", alignItems:"center", gap:4,
            boxShadow: playing === s.id ? `0 0 16px ${s.color}33` : "none",
          }}>
            <span style={{ fontSize:20 }}>{s.label.split(" ")[0]}</span>
            <span>{s.label.split(" ").slice(1).join(" ")}</span>
            {playing === s.id && (
              <div style={{ display:"flex", gap:2, marginTop:2 }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{
                    width:3, borderRadius:2, background:s.color,
                    animation:`soundBar 0.8s ${i*0.15}s ease-in-out infinite alternate`, height:8+i*3
                  }} />
                ))}
              </div>
            )}
          </button>
        ))}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ color:"var(--text-secondary, rgba(255,255,255,0.5))", fontSize:12 }}>🔈</span>
        <input
          type="range" min={10} max={100} value={vol}
          onChange={e => setVol(+e.target.value)}
          style={{ flex:1, accentColor:"#6c3de8" }}
          aria-label="Volume"
        />
        <span style={{ color:"var(--text-secondary, rgba(255,255,255,0.5))", fontSize:12 }}>🔊</span>
        <span style={{ color:"var(--text-secondary, rgba(255,255,255,0.4))", fontSize:11, minWidth:28 }}>{vol}%</span>
      </div>
      <style>{`@keyframes soundBar{from{transform:scaleY(0.4)}to{transform:scaleY(1.6)}}`}</style>
    </div>
  );
}

// Default export — the wrapper is the main export
export default MoodAtmosphereWrapper;
