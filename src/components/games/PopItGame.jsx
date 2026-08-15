import { useState } from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import { asmrSoundManager } from "../../utils/asmrSoundManager.js";
import { useGarden } from "../../hooks/useStorage.js";

export function PopItGame() {
  const { t } = useAppContext();
  const { rewardXP } = useGarden();
  const [bubbles, setBubbles] = useState(Array(36).fill(false));
  const [isFlipped, setIsFlipped] = useState(false);

  const handleBubbleClick = (index) => {
    const isCurrentlySunken = isFlipped ? !bubbles[index] : bubbles[index];
    if (isCurrentlySunken) return;

    rewardXP(15, 5); // Quest 5: Làm 1 điều khiến bạn vui
    asmrSoundManager.init();
    setBubbles((prev) => {
      const next = [...prev];
      next[index] = !isFlipped;
      return next;
    });
    asmrSoundManager.play("pop", 0.8);
  };

  const handleFlip = () => {
    asmrSoundManager.init();
    setIsFlipped((prev) => !prev);
    asmrSoundManager.play("pop", 0.55);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <div style={{ perspective: 1000, width: "100%", maxWidth: 300 }}>
        <div
          style={{
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            transformStyle: "preserve-3d",
            transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            background: "rgba(255,255,255,0.02)",
            border: "4px solid rgba(255,255,255,0.06)",
            borderRadius: 24,
            padding: 16,
            boxShadow: "0 20px 40px rgba(0,0,0,0.45), inset 0 2px 4px rgba(255,255,255,0.05)",
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 12,
          }}
        >
          {bubbles.map((_, i) => {
            const isSunken = isFlipped ? !bubbles[i] : bubbles[i];
            const row = Math.floor(i / 6);
            const rowColors = [
              { border: "#ef4444", bg: "#ef444433" },
              { border: "#f97316", bg: "#f9731633" },
              { border: "#eab308", bg: "#eab30833" },
              { border: "#22c55e", bg: "#22c55e33" },
              { border: "#3b82f6", bg: "#3b82f633" },
              { border: "#8b5cf6", bg: "#8b5cf633" },
            ];
            const c = rowColors[row] || rowColors[0];

            return (
              <button
                key={i}
                onClick={() => handleBubbleClick(i)}
                style={{
                  aspectRatio: "1",
                  borderRadius: "50%",
                  border: `2px solid ${isSunken ? c.border + "55" : c.border}`,
                  background: isSunken ? c.border + "22" : c.bg,
                  cursor: isSunken ? "default" : "pointer",
                  transition: "all 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                  boxShadow: isSunken
                    ? "inset 3px 3px 8px rgba(0,0,0,0.85), inset -1px -1px 3px rgba(255,255,255,0.05)"
                    : `inset -2px -2px 4px rgba(0,0,0,0.4), inset 2px 2px 4px ${c.border}55, 0 4px 6px rgba(0,0,0,0.25)`,
                  transform: isSunken ? "scale(0.92)" : "scale(1)",
                  outline: "none",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {!isSunken && (
                  <div
                    style={{
                      position: "absolute",
                      top: "15%",
                      left: "15%",
                      width: "30%",
                      height: "30%",
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.35)",
                      filter: "blur(0.5px)",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
      <button
        onClick={handleFlip}
        style={{
          padding: "10px 24px",
          background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
          border: "none",
          color: "#07091d",
          borderRadius: 99,
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 6px 15px rgba(245, 158, 11, 0.25)",
          transition: "all 0.2s",
        }}
      >
        {t.game_popit_flip || "🔄 Lật Mặt Pop-it"}
      </button>
    </div>
  );
}
