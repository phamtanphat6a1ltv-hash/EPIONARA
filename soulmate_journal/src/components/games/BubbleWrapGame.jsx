import { useState } from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import { asmrSoundManager } from "../../utils/asmrSoundManager.js";
import { useGarden } from "../../hooks/useStorage.js";

export function BubbleWrapGame() {
  const { t } = useAppContext();
  const { rewardXP } = useGarden();
  const [bubbles, setBubbles] = useState(
    Array.from({ length: 42 }, (_, i) => ({ id: i, popped: false }))
  );

  const handlePop = (id) => {
    asmrSoundManager.init();
    setBubbles((prev) =>
      prev.map((b) => {
        if (b.id === id && !b.popped) {
          rewardXP(15, 5); // Quest 5: Làm 1 điều khiến bạn vui
          asmrSoundManager.play("snap", 0.95);
          return { ...b, popped: true };
        }
        return b;
      })
    );
  };

  const handleReset = () => {
    asmrSoundManager.init();
    setBubbles((prev) => prev.map((b) => ({ ...b, popped: false })));
    asmrSoundManager.play("snap", 0.5);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <div
        style={{
          background: "rgba(255,255,255,0.01)",
          border: "2px solid rgba(255,255,255,0.06)",
          borderRadius: 20,
          padding: "20px 14px",
          width: "100%",
          maxWidth: 320,
          boxShadow: "0 15px 30px rgba(0,0,0,0.3)",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px 8px" }}>
          {bubbles.map((b, i) => {
            const isOddRow = Math.floor(i / 6) % 2 === 1;
            return (
              <div
                key={b.id}
                onMouseEnter={() => handlePop(b.id)}
                onClick={() => handlePop(b.id)}
                style={{
                  aspectRatio: "1",
                  borderRadius: "50%",
                  border: b.popped
                    ? "1.5px solid rgba(255,255,255,0.04)"
                    : "1.5px solid rgba(255,255,255,0.22)",
                  background: b.popped
                    ? "rgba(255,255,255,0.01)"
                    : "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.02) 70%)",
                  cursor: b.popped ? "default" : "pointer",
                  transition: "all 0.1s ease-out",
                  boxShadow: b.popped
                    ? "inset 1px 1px 3px rgba(0,0,0,0.5)"
                    : "0 4px 8px rgba(0,0,0,0.15), inset -2px -2px 4px rgba(0,0,0,0.25), inset 2px 2px 4px rgba(255,255,255,0.2)",
                  transform: b.popped ? "scale(0.95)" : "scale(1)",
                  marginLeft: isOddRow ? 14 : 0,
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {b.popped && (
                  <svg width="65%" height="65%" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5">
                    <path d="M12 2v20M2 12h20M5 5l14 14M5 19L19 5" />
                  </svg>
                )}
                {!b.popped && (
                  <div
                    style={{
                      position: "absolute",
                      top: "10%",
                      left: "10%",
                      width: "25%",
                      height: "25%",
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.5)",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      <button
        onClick={handleReset}
        style={{
          padding: "10px 24px",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "rgba(255,255,255,0.8)",
          borderRadius: 99,
          fontWeight: 700,
          cursor: "pointer",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
      >
        {t.game_bubblewrap_reset || "🔄 Trải Tấm Mới (Reset)"}
      </button>
    </div>
  );
}
