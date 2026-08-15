import { useState, useEffect, useRef } from "react";
import { SoulmateJournalLogo } from "./UIComponents.jsx";

export default function LoadingScreen({ onDone, t }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  
  const phases = [
    t?.load1 || "Hít vào thật sâu... Lắng dịu tâm trí 🌬️ (4 giây)",
    t?.load2 || "Nhẹ nhàng giữ hơi thở... Nuôi dưỡng bình yên 🌿 (7 giây)",
    t?.load3 || "Thở ra chậm rãi... Buông bỏ muộn phiền 🍃 (8 giây)",
    t?.load4 || "Sẵn sàng đón nhận sự chữa lành! 💙",
  ];
  const canvasRef = useRef(null);

  // Cosmic Galaxy Vortex Particle System
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener("resize", handleResize);

    // Initializing spiral galaxy particles
    const particles = Array.from({ length: 220 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.pow(Math.random(), 1.6) * Math.max(canvas.width, canvas.height) * 0.7;
      const speed = (Math.random() * 0.007 + 0.002) * (1 - dist / (Math.max(canvas.width, canvas.height) * 0.7));
      const size = Math.random() * 1.6 + 0.3;
      
      // Tone màu chữa lành dịu mát
      const colors = ["#ffffff", "#8da399", "#a3c2c9", "#6e857b", "#739ca6", "#f4f6f5"];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      return {
        angle,
        dist,
        speed: speed + 0.001,
        radialSpeed: (Math.random() - 0.35) * 0.08,
        size,
        color,
        opacity: Math.random() * 0.6 + 0.4,
      };
    });

    let raf;
    const draw = () => {
      ctx.fillStyle = "rgba(13, 18, 16, 0.12)"; // Sage Dark background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      particles.forEach(p => {
        p.angle += p.speed;
        p.dist += p.radialSpeed;

        if (p.dist < 25) {
          p.dist = Math.max(canvas.width, canvas.height) * 0.6 * (Math.random() * 0.4 + 0.6);
          p.angle = Math.random() * Math.PI * 2;
        } else if (p.dist > Math.max(canvas.width, canvas.height) * 0.75) {
          p.dist = 25 + Math.random() * 80;
        }

        const x = cx + Math.cos(p.angle) * p.dist;
        const y = cy + Math.sin(p.angle) * p.dist * 0.68;

        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);

        // Convert hex to rgb for opacity handling
        let rgb = "255, 255, 255";
        if (p.color === "#8da399") rgb = "141, 163, 153";
        else if (p.color === "#a3c2c9") rgb = "163, 194, 201";
        else if (p.color === "#6e857b") rgb = "110, 133, 123";
        else if (p.color === "#739ca6") rgb = "115, 156, 166";
        else if (p.color === "#f4f6f5") rgb = "244, 246, 245";

        const edgeFade = 1 - p.dist / (Math.max(canvas.width, canvas.height) * 0.75);
        ctx.fillStyle = `rgba(${rgb}, ${p.opacity * edgeFade})`;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Progress Loading Simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(timer);
          setIsExiting(true);
          setTimeout(onDone, 800);
          return 100;
        }
        setPhase(Math.floor(p / 25));
        return p + 1.2;
      });
    }, 45); // Tải chậm hơn một chút để người dùng có thời gian tập trung thở sâu
  }, [onDone]);

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "radial-gradient(ellipse at 50% 0%,#182420 0%,#0d1210 60%,#0a0e0d 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      zIndex: 9999, overflow: "hidden",
      opacity: isExiting ? 0 : 1,
      transform: isExiting ? "scale(1.06)" : "scale(1)",
      filter: isExiting ? "blur(8px)" : "none",
      transition: "opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), filter 0.8s ease",
    }}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, opacity: 0.8, pointerEvents: "none" }}
      />

      {/* Aurora blobs (Sage green & Soft blue) */}
      <div aria-hidden="true" style={{ position: "absolute", top: "10%", left: "20%", width: 450, height: 450, borderRadius: "50%", background: "radial-gradient(circle,rgba(110,133,123,0.18),transparent 70%)", animation: "orbFloat 8s ease-in-out infinite", pointerEvents: "none" }} />
      <div aria-hidden="true" style={{ position: "absolute", bottom: "15%", right: "15%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(115,156,166,0.12),transparent 70%)", animation: "orbFloat 10s ease-in-out 2s infinite", pointerEvents: "none" }} />

      {/* Main content container with load-in transition */}
      <div style={{ 
        position: "relative", zIndex: 1, 
        display: "flex", flexDirection: "column", alignItems: "center",
        animation: "introFadeIn 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards"
      }}>
        
        {/* Breathing Orbital rings */}
        <div style={{ 
          position: "relative", width: 200, height: 200, marginBottom: 40,
          animation: "orbitBreathe 4s ease-in-out infinite" // Nhịp thở 4 giây
        }} aria-hidden="true">
          {[0, 1, 2].map(i => {
            const baseDur = 4.5 + i * 1.5;
            const currentDur = Math.max(1.0, baseDur - (progress / 100) * (baseDur * 0.7));
            return (
              <div key={i} style={{
                position: "absolute", top: "50%", left: "50%",
                width: 100 + i * 50, height: 100 + i * 50,
                borderRadius: "50%",
                border: `1.5px solid rgba(110,133,123,${0.5 - i * 0.12})`,
                transform: "translate(-50%,-50%)",
                animation: `spin ${currentDur}s linear infinite`,
                boxShadow: `0 0 ${10 + i * 5}px rgba(110,133,123,${0.18 - i * 0.04})`,
              }}>
                <div style={{
                  position: "absolute", width: 6, height: 6, borderRadius: "50%",
                  background: ["#6e857b", "#739ca6", "#ad8870"][i],
                  top: -3, left: "calc(50% - 3px)",
                  boxShadow: `0 0 12px ${["#6e857b", "#739ca6", "#ad8870"][i]}`,
                }} />
              </div>
            );
          })}
          
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            width: 76, height: 76, borderRadius: "50%",
            background: "linear-gradient(135deg,rgba(110,133,123,0.45),rgba(115,156,166,0.25))",
            border: "2px solid rgba(110,133,123,0.65)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 45px rgba(110,133,123,0.6),inset 0 0 22px rgba(110,133,123,0.25)",
            animation: "pulseGlow 2.5s ease-in-out infinite",
          }}>
            <SoulmateJournalLogo size={48} showText={false} animate />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <SoulmateJournalLogo size={52} showText animate />
        </div>

        <div
          role="status"
          aria-live="polite"
          style={{
            color: "rgba(255,255,255,0.75)", fontSize: 13,
            marginBottom: 36, letterSpacing: 1,
            textAlign: "center", fontWeight: 500,
            animation: "pulse 2s ease infinite",
            maxWidth: 320,
            lineHeight: 1.5,
          }}
        >
          {phases[phase] || phases[3]}
        </div>

        {/* Progress bar */}
        <div style={{ width: 280, position: "relative" }}>
          <div role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}
            style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${progress}%`,
              background: "linear-gradient(90deg,#6e857b,#739ca6 50%,#ad8870)",
              borderRadius: 99, transition: "width 0.08s linear",
              boxShadow: "0 0 12px rgba(110,133,123,0.6)",
            }} />
          </div>
          <div style={{ marginTop: 10, textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 500 }}>
            {Math.round(progress)}%
          </div>
        </div>
      </div>

      <style>{`
        @keyframes orbFloat {
          0%,100% { transform:translateX(0) translateY(0); }
          33% { transform:translateX(6%) translateY(-4%); }
          66% { transform:translateX(-4%) translateY(6%); }
        }
        @keyframes spin { to { transform:translate(-50%,-50%) rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 45px rgba(108,61,232,0.6), inset 0 0 22px rgba(108,61,232,0.25); }
          50% { box-shadow: 0 0 65px rgba(108,61,232,0.85), inset 0 0 35px rgba(108,61,232,0.45); }
        }
        @keyframes orbitBreathe {
          0%, 100% { transform: scale(0.95); }
          50% { transform: scale(1.05); }
        }
        @keyframes introFadeIn {
          from {
            opacity: 0;
            transform: translateY(24px);
            filter: blur(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }
      `}</style>
    </div>
  );
}
