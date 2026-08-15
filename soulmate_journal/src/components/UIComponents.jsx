import { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext.jsx";

// =================== EPIONARA LOGO ===================
export function SoulmateJournalLogo({ size = 36, showText = true }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: showText ? 10 : 0, flexShrink: 0 }}>
      <img 
        src="/logo.png" 
        alt="EPIONARA logo" 
        style={{ 
          width: size, 
          height: size, 
          borderRadius: "50%", 
          objectFit: "cover",
          boxShadow: "0 0 10px rgba(34, 211, 238, 0.25)",
          flexShrink: 0 
        }} 
      />
      {showText && (
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <span className="brand-text" style={{
            fontSize: size * 0.45, fontWeight: 900, letterSpacing: -0.5,
          }}>EPIONARA</span>
        </div>
      )}
    </div>
  );
}


// =================== STAR FIELD ===================
export function StarField() {
  const stars = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 2 + 0.5,
    dur: `${Math.random() * 4 + 2}s`,
    delay: `${Math.random() * 4}s`,
  }));

  return (
    <div
      className="star-field"
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}
    >
      {stars.map(s => (
        <div
          key={s.id}
          className="star"
          style={{
            position: "absolute",
            left: s.left, top: s.top,
            width: s.size, height: s.size,
            borderRadius: "50%",
            background: "var(--text-secondary, white)",
            "--dur": s.dur, "--delay": s.delay,
            animation: `starTwinkle ${s.dur} ${s.delay} ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

// =================== BACK BUTTON ===================
export function BackButton({ onClick, label }) {
  const { t } = useAppContext();
  const resolvedLabel = label || `← ${t.nav_home || "Trang chủ"}`;
  const cleanLabel = resolvedLabel.replace(/[←←]/g, "").trim();
  return (
    <button
      onClick={onClick}
      aria-label={cleanLabel || t.back_label || "Quay lại"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "var(--glass1, rgba(255,255,255,0.06))",
        border: "1px solid var(--border1, rgba(255,255,255,0.12))",
        borderRadius: 99,
        padding: "8px 16px",
        color: "var(--text-secondary, rgba(255,255,255,0.7))",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 500,
        marginBottom: 24,
        transition: "all 0.2s ease",
        fontFamily: "inherit",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = "var(--glass2, rgba(255,255,255,0.1))";
        e.currentTarget.style.color = "var(--text-primary, rgba(255,255,255,0.9))";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "var(--glass1, rgba(255,255,255,0.06))";
        e.currentTarget.style.color = "var(--text-secondary, rgba(255,255,255,0.7))";
      }}
    >
      {resolvedLabel}
    </button>
  );
}

// =================== INTERACTIVE MASCOT MIRA ===================
export function FloatingRobot({ onClick, color = "#6c3de8" }) {
  const { t } = useAppContext();
  const [hovered, setHovered] = useState(false);
  const [pulse, setPulse] = useState(0);
  const pulseEmojis = ["💡", "✨", "🔮"];

  useEffect(() => {
    const ti = setInterval(() => setPulse(p => (p + 1) % 3), 2200);
    return () => clearInterval(ti);
  }, []);

  return (
    <div style={{ position: "fixed", bottom: 28, left: 28, zIndex: 7000, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
      {hovered && (
        <div style={{ background: "rgba(13,20,64,0.97)", border: `1px solid ${color}55`, borderRadius: 14, padding: "10px 16px", color: "white", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", backdropFilter: "blur(12px)", animation: "fadeInUp 0.2s ease", boxShadow: `0 8px 30px rgba(0,0,0,0.5),0 0 20px ${color}22` }}>
           {t.mira_hover_greet || "Hê lô! Chạm vào mình để xem hướng dẫn nhé! ✨"}
        </div>
      )}
      <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        style={{ width: 60, height: 60, borderRadius: "50%", background: `linear-gradient(135deg,${color},#22d3ee)`, border: "2px solid rgba(255,255,255,0.15)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, boxShadow: `0 8px 30px ${color}55`, animation: "floatPulse 2.2s ease infinite", transition: "transform 0.2s", transform: hovered ? "scale(1.18)" : "scale(1)" }}>
        🤖
      </button>
      <div style={{ position: "absolute", top: -3, left: 45, width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg,#ef4444,#f97316)", border: "2px solid #0a0e27", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, animation: "notifBounce 2.4s ease infinite" }}>
        {pulseEmojis[pulse]}
      </div>
      <style>{`
        @keyframes floatPulse{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes notifBounce{0%,100%{transform:scale(1) rotate(0deg)}50%{transform:scale(1.25) rotate(15deg)}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}
