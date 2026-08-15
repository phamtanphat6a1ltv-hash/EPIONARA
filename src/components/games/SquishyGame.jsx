import { useState } from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import { asmrSoundManager } from "../../utils/asmrSoundManager.js";
import { useGarden } from "../../hooks/useStorage.js";

export function SquishyGame() {
  const { t } = useAppContext();
  const { rewardXP } = useGarden();
  const [isSquished, setIsSquished] = useState(false);

  const handleMouseDown = () => {
    asmrSoundManager.init();
    setIsSquished(true);
    rewardXP(15, 5); // Quest 5: Làm 1 điều khiến bạn vui
    asmrSoundManager.play("squish_in", 0.9);
  };

  const handleMouseUp = () => {
    if (!isSquished) return;
    setIsSquished(false);
    asmrSoundManager.play("squish_out", 0.85);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 0", gap: 20 }}>
      <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, textAlign: "center" }}>
        {t.game_squishy_tip || "👇 Nhấp và Giữ chuột để bóp Squishy, nhả ra để phồng lại"}
      </div>
      <div
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        style={{
          width: 170,
          height: 170,
          cursor: "pointer",
          userSelect: "none",
          transform: isSquished ? "scale(0.6, 0.42) translateY(50px)" : "scale(1, 1) translateY(0)",
          transition: isSquished
            ? "transform 0.14s cubic-bezier(0.25, 0.8, 0.25, 1)"
            : "transform 1.6s cubic-bezier(0.25, 1, 0.4, 1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src="/game-squishy.png"
          alt="Squishy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none",
            filter: isSquished ? "brightness(0.85) contrast(1.15)" : "none",
            transition: "filter 0.2s",
          }}
        />
      </div>
    </div>
  );
}
