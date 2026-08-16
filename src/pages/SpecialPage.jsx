import { useState, useEffect, useRef, useCallback } from "react";

import { callGeminiAPI } from "../utils/geminiApi.js";
import GlassCard from "../components/GlassCard.jsx";
import { BackButton } from "../components/UIComponents.jsx";
import { MOOD_EMOJIS, MOOD_COLORS } from "../utils/constants.js";
import { useAppContext } from "../context/AppContext.jsx";

// =================== SPECIAL PAGE ===================
function SpecialPage() {
  const { t, setPage } = useAppContext();
  const [mood, setMood] = useState(null);
  const [energy, setEnergy] = useState(5);
  const [word, setWord] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  const drawWave = useCallback((moodScore, energyScore) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth || 600;
    canvas.height = 200;
    let ti = 0;
    cancelAnimationFrame(animRef.current);
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const freq = .015 + energyScore / 10 * .02;
      const amp = 20 + moodScore * 8;
      const color = MOOD_COLORS[Math.min(moodScore - 1, 7)] || "#a78bfa";
      for (let layer = 3; layer >= 1; layer--) {
        ctx.beginPath();
        for (let x = 0; x <= canvas.width; x += 2) {
          const y = canvas.height / 2 + Math.sin(x * freq + ti + layer * .5) * amp * (1 - layer * .2) + Math.sin(x * freq * .5 + ti * .7) * amp * .4;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `${color}${Math.floor((.6 - layer * .15) * 255).toString(16).padStart(2, "0")}`;
        ctx.lineWidth = 3 - layer * .5; ctx.stroke();
      }
      ti += .03;
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
  }, []);

  useEffect(() => {
    if (mood !== null) drawWave(mood + 1, energy);
    return () => cancelAnimationFrame(animRef.current);
  }, [mood, energy, drawWave]);

  const analyze = async () => {
    if (!word.trim() || mood === null) return;
    setLoading(true);
    const moodLabels = [t.mood0, t.mood1, t.mood2, t.mood3, t.mood4, t.mood5, t.mood6, t.mood7];
    try {
      const auraText = await callGeminiAPI({
        messages: [{ role: "user", content: `User describes their energy with keyword: "${word}", mood: ${moodLabels[mood]}, energy: ${energy}/10. Reply ONLY JSON (no markdown):\n{"aura":"aura color name","auraColor":"#hex","element":"element (Fire/Water/Air/Earth/Light)","message":"short deep spiritual message","affirmation":"positive affirmation","archetype":"psychological archetype"}` }],
        max_tokens: 8192,
      });
      const parsed = JSON.parse(auraText.replace(/```json|```/g, "").trim());
      setResult(parsed);
    } catch { setResult({ aura: "Purple Creative", auraColor: "#8b5cf6", element: "Light", message: "Your energy is searching for direction. Trust your intuition.", affirmation: "I have enough strength to overcome any challenge.", archetype: "The Seeker" }); }
    setLoading(false);
  };

  const moodLabels = [t.mood0, t.mood1, t.mood2, t.mood3, t.mood4, t.mood5, t.mood6, t.mood7];

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 50% 0%,#1a0830 0%,#07091d 60%)", paddingTop: 80, paddingBottom: 60 }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
        {setPage && <BackButton onClick={() => setPage("home")} label={"← " + (t.back_home || "Trang chủ")} />}
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>🌊</div>
          <h1 style={{ fontSize: 34, fontWeight: 800, color: "white", margin: "0 0 10px" }}>{t.special_title}</h1>
          <p style={{ color: "rgba(255,255,255,.55)", fontSize: 15 }}>{t.special_sub}</p>
        </div>
        <GlassCard style={{ marginBottom: 20 }}>
          <h3 style={{ color: "white", fontSize: 15, fontWeight: 600, marginBottom: 16 }}>{t.step1}</h3>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
            {MOOD_EMOJIS.map((e, i) => <button key={i} onClick={() => setMood(i)} style={{ flex: 1, background: mood === i ? `${MOOD_COLORS[i]}33` : "rgba(255,255,255,.04)", border: mood === i ? `1px solid ${MOOD_COLORS[i]}` : "1px solid rgba(255,255,255,.07)", borderRadius: 9, padding: "10px 3px", fontSize: 22, cursor: "pointer", transition: "all .2s", transform: mood === i ? "scale(1.1)" : "scale(1)" }}>{e}</button>)}
          </div>
          {mood !== null && <div style={{ textAlign: "center", color: MOOD_COLORS[mood], fontSize: 13, fontWeight: 600, marginTop: 8 }}>{moodLabels[mood]}</div>}
        </GlassCard>
        <GlassCard style={{ marginBottom: 20 }}>
          <h3 style={{ color: "white", fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{t.step2} ({energy}/10)</h3>
          <input type="range" min={1} max={10} value={energy} onChange={e => setEnergy(+e.target.value)} style={{ width: "100%", accentColor: "#8b5cf6", margin: "8px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,.4)", fontSize: 11 }}>
            <span>{t.exhausted}</span><span>{t.normal}</span><span>{t.full}</span>
          </div>
        </GlassCard>
        {mood !== null && (
          <GlassCard style={{ marginBottom: 20, overflow: "hidden" }}>
            <div style={{ color: "rgba(255,255,255,.45)", fontSize: 11, marginBottom: 8 }}>{t.wave_label}</div>
            <canvas ref={canvasRef} style={{ width: "100%", height: 200, display: "block" }} />
          </GlassCard>
        )}
        <GlassCard style={{ marginBottom: 20 }}>
          <h3 style={{ color: "white", fontSize: 15, fontWeight: 600, marginBottom: 10 }}>{t.step3}</h3>
          <input value={word} onChange={e => setWord(e.target.value)} placeholder={t.step3_ph} style={{ width: "100%", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, color: "white", padding: "12px 14px", fontSize: 14, boxSizing: "border-box" }} onKeyDown={e => e.key === "Enter" && analyze()} />
          <button onClick={analyze} disabled={!word.trim() || mood === null || loading} style={{ width: "100%", marginTop: 10, padding: "13px", borderRadius: 10, background: word.trim() && mood !== null ? "linear-gradient(135deg,#6c3de8,#22d3ee)" : "rgba(255,255,255,.04)", border: "none", color: word.trim() && mood !== null ? "white" : "rgba(255,255,255,.3)", fontSize: 14, fontWeight: 600, cursor: word.trim() && mood !== null ? "pointer" : "not-allowed" }}>{loading ? t.reading : t.read_btn}</button>
        </GlassCard>
        {result && (
          <GlassCard style={{ background: `linear-gradient(135deg,${result.auraColor}15,rgba(34,211,238,.05))`, borderColor: `${result.auraColor}33`, textAlign: "center", animation: "fadeInUp .6s ease" }}>
            <div style={{ fontSize: 52, marginBottom: 10 }}>🌟</div>
            <h2 style={{ color: "white", fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>Aura: {result.aura}</h2>
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
              <div style={{ padding: "4px 14px", borderRadius: 99, background: `${result.auraColor}22`, color: result.auraColor, fontSize: 12 }}>{t.aura_label}: {result.element}</div>
              <div style={{ padding: "4px 14px", borderRadius: 99, background: "rgba(34,211,238,.15)", color: "#22d3ee", fontSize: 12 }}>{t.archetype_label}: {result.archetype}</div>
            </div>
            <div style={{ width: 70, height: 70, borderRadius: "50%", background: `radial-gradient(circle,${result.auraColor},${result.auraColor}44)`, margin: "0 auto 18px", boxShadow: `0 0 40px ${result.auraColor}66` }} />
            <p style={{ color: "rgba(255,255,255,.85)", fontSize: 15, lineHeight: 1.8, margin: "0 0 18px" }}>{result.message}</p>
            <div style={{ background: "rgba(255,255,255,.06)", borderRadius: 12, padding: "14px" }}>
              <div style={{ color: "rgba(255,255,255,.45)", fontSize: 11, marginBottom: 5 }}>{t.affirm_label}</div>
              <p style={{ color: "#c4b5fd", fontSize: 15, fontStyle: "italic", fontWeight: 500, margin: 0 }}>"{result.affirmation}"</p>
            </div>
          </GlassCard>
        )}
      </div>
      <style>{` `}</style>
    </div>
  );
}


export default SpecialPage;
