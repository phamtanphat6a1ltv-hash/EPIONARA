import { useStats } from "../hooks/useStorage.js";
import { useAppContext } from "../context/AppContext.jsx";
import { useThemeContext } from "../context/ThemeContext.jsx";
import { MOOD_ATMOSPHERES } from "../utils/constants.js";

/**
 * Fluid Aura CSS Background that shifts colors smoothly based on user's active mood.
 */
export default function AuraBackground() {
  const { moodContext } = useAppContext();
  const { stats } = useStats();
  const { theme } = useThemeContext();

  // Active mood: priority is predicted moodContext, then today's logged mood, default to 6 (Happy)
  const activeMood = moodContext?.score || stats?.todayJournal?.score || 6;
  const atm = MOOD_ATMOSPHERES[activeMood] || MOOD_ATMOSPHERES[6];

  let primaryColor = atm.aurora;
  let secondaryColor = atm.accent;
  let bgColor = atm.bg;

  if (theme === "light") {
    bgColor = "#f4f7f6";
    primaryColor = "rgba(174, 195, 255, 0.35)";
    secondaryColor = "rgba(224, 206, 255, 0.35)";
  } else if (theme === "ocean") {
    bgColor = "#C6FFC9";
    primaryColor = "rgba(0, 161, 206, 0.25)";
    secondaryColor = "rgba(28, 235, 196, 0.25)";
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: bgColor,
        zIndex: -2,
        pointerEvents: "none",
        overflow: "hidden",
        transition: "background 2s ease-in-out",
      }}
    >
      {/* Fluid glowing aura blobs */}
      <div
        className="aura-blob-1"
        style={{
          position: "absolute",
          width: "90vw",
          height: "90vw",
          top: "-20vh",
          left: "-10vw",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)`,
          opacity: 0.45,
          filter: "blur(60px)",
          transition: "background 2s ease-in-out, opacity 2s ease-in-out",
        }}
      />
      <div
        className="aura-blob-2"
        style={{
          position: "absolute",
          width: "80vw",
          height: "80vw",
          bottom: "-15vh",
          right: "-10vw",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${secondaryColor} 0%, transparent 70%)`,
          opacity: 0.4,
          filter: "blur(60px)",
          transition: "background 2s ease-in-out, opacity 2s ease-in-out",
        }}
      />
      <div
        className="aura-blob-3"
        style={{
          position: "absolute",
          width: "70vw",
          height: "70vw",
          top: "30vh",
          left: "25vw",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${secondaryColor} 0%, transparent 60%)`,
          opacity: 0.25,
          filter: "blur(70px)",
          transition: "background 2s ease-in-out, opacity 2s ease-in-out",
        }}
      />

      <style>{`
        .aura-blob-1 {
          animation: floatBlob1 35s infinite alternate ease-in-out;
        }
        .aura-blob-2 {
          animation: floatBlob2 40s infinite alternate ease-in-out;
        }
        .aura-blob-3 {
          animation: floatBlob3 45s infinite alternate ease-in-out;
        }
        @keyframes floatBlob1 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(8vw, 12vh) scale(1.1); }
          100% { transform: translate(-4vw, -4vh) scale(0.95); }
        }
        @keyframes floatBlob2 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-12vw, -8vh) scale(0.9); }
          100% { transform: translate(4vw, 8vh) scale(1.05); }
        }
        @keyframes floatBlob3 {
          0% { transform: translate(0, 0) scale(0.9); }
          50% { transform: translate(8vw, -12vh) scale(1.15); }
          100% { transform: translate(-8vw, 8vh) scale(0.95); }
        }
      `}</style>
    </div>
  );
}
