import React, { useEffect, useState } from "react";

/**
 * Lightweight, pure CSS Confetti particle explosion component.
 */
export function Confetti({ duration = 4000 }) {
  const [pieces, setPieces] = useState([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const colors = ["#8b5cf6", "#22d3ee", "#ec4899", "#10b981", "#fbbf24", "#f97316"];
    const arr = Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100, // percentage
      delay: Math.random() * 1.5, // seconds
      duration: 2 + Math.random() * 2, // seconds
      size: 6 + Math.random() * 8, // px
      color: colors[Math.floor(Math.random() * colors.length)],
      rotate: Math.random() * 360,
      shape: Math.random() > 0.5 ? "circle" : "square",
    }));
    setPieces(arr);

    const timer = setTimeout(() => {
      setVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 99999,
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(105vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            top: -20,
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === "circle" ? "50%" : "2px",
            transform: `rotate(${p.rotate}deg)`,
            animation: `confettiFall ${p.duration}s linear ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
