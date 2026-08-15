import React from "react";

// Standard icon style for emoji icons
const baseEmojiStyle = {
  display: "inline-block",
  verticalAlign: "middle",
  width: "2.5em",
  height: "2.5em",
  transition: "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), filter 0.3s ease",
  cursor: "pointer",
};

// 1. Very Sad (Rất tệ) - Red theme (#ef4444)
export function ThreeDVerySad({ style = {}, ...props }) {
  return (
    <svg style={{ ...baseEmojiStyle, ...style }} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <defs>
        {/* Glow Aura */}
        <radialGradient id="verySadAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
        </radialGradient>
        {/* 3D Sphere Base */}
        <radialGradient id="verySadBody" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="40%" stopColor="#ef4444" />
          <stop offset="90%" stopColor="#991b1b" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </radialGradient>
        {/* Highlight */}
        <linearGradient id="verySadHighlight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        {/* Teardrop */}
        <radialGradient id="teardropGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </radialGradient>
      </defs>

      {/* Aura background */}
      <circle cx="50" cy="50" r="48" fill="url(#verySadAura)" />

      {/* Main 3D Sphere */}
      <circle cx="50" cy="50" r="36" fill="url(#verySadBody)" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.4))" />

      {/* Highlighting reflection (3D volume) */}
      <ellipse cx="40" cy="28" rx="14" ry="7" fill="url(#verySadHighlight)" transform="rotate(-15 40 28)" />

      {/* Sad downward eyebrows */}
      <path d="M28 38 C32 35, 38 37, 40 40" stroke="#7f1d1d" strokeWidth="3" strokeLinecap="round" />
      <path d="M72 38 C68 35, 62 37, 60 40" stroke="#7f1d1d" strokeWidth="3" strokeLinecap="round" />

      {/* Downcast eyes */}
      <circle cx="35" cy="48" r="4.5" fill="#450a0a" />
      <circle cx="65" cy="48" r="4.5" fill="#450a0a" />
      <circle cx="33.5" cy="46.5" r="1.5" fill="#ffffff" />
      <circle cx="63.5" cy="46.5" r="1.5" fill="#ffffff" />

      {/* Drooping/crying cheeks shadow */}
      <path d="M28 55 C28 55, 34 58, 38 55" stroke="#7f1d1d" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <path d="M72 55 C72 55, 66 58, 62 55" stroke="#7f1d1d" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />

      {/* Downward curved mouth */}
      <path d="M38 72 C44 65, 56 65, 62 72" stroke="#450a0a" strokeWidth="4" strokeLinecap="round" />

      {/* Glowing Teardrop */}
      <path d="M35 52 C32 58, 30 64, 33 68 C36 71, 40 68, 39 62 Z" fill="url(#teardropGrad)" filter="drop-shadow(0 0 4px #60a5fa)" />
    </svg>
  );
}

// 2. Sad (Buồn) - Orange theme (#f97316)
export function ThreeDSad({ style = {}, ...props }) {
  return (
    <svg style={{ ...baseEmojiStyle, ...style }} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <defs>
        <radialGradient id="sadAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sadBody" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#ffedd5" />
          <stop offset="40%" stopColor="#f97316" />
          <stop offset="90%" stopColor="#c2410c" />
          <stop offset="100%" stopColor="#7c2d12" />
        </radialGradient>
        <linearGradient id="sadHighlight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <circle cx="50" cy="50" r="48" fill="url(#sadAura)" />
      <circle cx="50" cy="50" r="36" fill="url(#sadBody)" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.4))" />
      <ellipse cx="40" cy="28" rx="14" ry="7" fill="url(#sadHighlight)" transform="rotate(-15 40 28)" />

      {/* Slightly sad eyebrows */}
      <path d="M30 39 C34 37, 39 39, 41 42" stroke="#7c2d12" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M70 39 C66 37, 61 39, 59 42" stroke="#7c2d12" strokeWidth="2.5" strokeLinecap="round" />

      {/* Worried eyes */}
      <circle cx="36" cy="49" r="4" fill="#431407" />
      <circle cx="64" cy="49" r="4" fill="#431407" />
      <circle cx="34.5" cy="47.5" r="1.3" fill="#ffffff" />
      <circle cx="62.5" cy="47.5" r="1.3" fill="#ffffff" />

      {/* Sad mouth */}
      <path d="M40 68 C45 62, 55 62, 60 68" stroke="#431407" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

// 3. Uneasy (Khó chịu) - Yellow theme (#eab308)
export function ThreeDUnhappy({ style = {}, ...props }) {
  return (
    <svg style={{ ...baseEmojiStyle, ...style }} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <defs>
        <radialGradient id="unhappyAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#eab308" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="unhappyBody" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="40%" stopColor="#eab308" />
          <stop offset="90%" stopColor="#854d0e" />
          <stop offset="100%" stopColor="#713f12" />
        </radialGradient>
        <linearGradient id="unhappyHighlight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <circle cx="50" cy="50" r="48" fill="url(#unhappyAura)" />
      <circle cx="50" cy="50" r="36" fill="url(#unhappyBody)" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.4))" />
      <ellipse cx="40" cy="28" rx="14" ry="7" fill="url(#unhappyHighlight)" transform="rotate(-15 40 28)" />

      {/* Irritated eyebrows */}
      <path d="M28 43 C33 41, 38 43, 40 46" stroke="#713f12" strokeWidth="3" strokeLinecap="round" />
      <path d="M72 43 C67 41, 62 43, 60 46" stroke="#713f12" strokeWidth="3" strokeLinecap="round" />

      {/* Slanted annoyed eyes */}
      <path d="M30 50 L40 48" stroke="#451a03" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M70 50 L60 48" stroke="#451a03" strokeWidth="4.5" strokeLinecap="round" />

      {/* Zigzag frustrated mouth */}
      <path d="M36 64 L42 67 L48 63 L54 67 L60 63 L64 66" stroke="#451a03" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 4. Neutral (Bình thường) - Gray theme (#6b7280)
export function ThreeDNeutral({ style = {}, ...props }) {
  return (
    <svg style={{ ...baseEmojiStyle, ...style }} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <defs>
        <radialGradient id="neutralAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#94a3b8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="neutralBody" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="40%" stopColor="#94a3b8" />
          <stop offset="90%" stopColor="#475569" />
          <stop offset="100%" stopColor="#334155" />
        </radialGradient>
        <linearGradient id="neutralHighlight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <circle cx="50" cy="50" r="48" fill="url(#neutralAura)" />
      <circle cx="50" cy="50" r="36" fill="url(#neutralBody)" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.35))" />
      <ellipse cx="40" cy="28" rx="14" ry="7" fill="url(#neutralHighlight)" transform="rotate(-15 40 28)" />

      {/* Plain staring eyes */}
      <circle cx="36" cy="48" r="4" fill="#1e293b" />
      <circle cx="64" cy="48" r="4" fill="#1e293b" />
      <circle cx="35" cy="46.5" r="1.2" fill="#ffffff" />
      <circle cx="63" cy="46.5" r="1.2" fill="#ffffff" />

      {/* Straight expressionless mouth */}
      <line x1="36" y1="64" x2="64" y2="64" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

// 5. OK (Ổn) - Green theme (#22c55e)
export function ThreeDOk({ style = {}, ...props }) {
  return (
    <svg style={{ ...baseEmojiStyle, ...style }} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <defs>
        <radialGradient id="okAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="okBody" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#dcfce7" />
          <stop offset="40%" stopColor="#22c55e" />
          <stop offset="90%" stopColor="#166534" />
          <stop offset="100%" stopColor="#14532d" />
        </radialGradient>
        <linearGradient id="okHighlight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <circle cx="50" cy="50" r="48" fill="url(#okAura)" />
      <circle cx="50" cy="50" r="36" fill="url(#okBody)" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.4))" />
      <ellipse cx="40" cy="28" rx="14" ry="7" fill="url(#okHighlight)" transform="rotate(-15 40 28)" />

      {/* Relaxed smiling eyes */}
      <path d="M30 48 C32 45, 38 45, 40 48" stroke="#14532d" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M70 48 C68 45, 62 45, 60 48" stroke="#14532d" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* Soft smile */}
      <path d="M38 62 C43 67, 57 67, 62 62" stroke="#052e16" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// 6. Happy (Vui) - Blue theme (#3b82f6)
export function ThreeDHappy({ style = {}, ...props }) {
  return (
    <svg style={{ ...baseEmojiStyle, ...style }} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <defs>
        <radialGradient id="happyAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="happyBody" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#dbeafe" />
          <stop offset="40%" stopColor="#3b82f6" />
          <stop offset="90%" stopColor="#1e40af" />
          <stop offset="100%" stopColor="#172554" />
        </radialGradient>
        <linearGradient id="happyHighlight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        {/* Inside mouth depth */}
        <linearGradient id="happyMouth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
      </defs>

      <circle cx="50" cy="50" r="48" fill="url(#happyAura)" />
      <circle cx="50" cy="50" r="36" fill="url(#happyBody)" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.4))" />
      <ellipse cx="40" cy="28" rx="14" ry="7" fill="url(#happyHighlight)" transform="rotate(-15 40 28)" />

      {/* Cheerful curved eyebrows */}
      <path d="M28 38 C32 34, 38 34, 40 37" stroke="#1e40af" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M72 38 C68 34, 62 34, 60 37" stroke="#1e40af" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* Smiling eyes */}
      <path d="M28 48 C30 43, 38 43, 40 48" stroke="#172554" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M72 48 C70 43, 62 43, 60 48" stroke="#172554" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <circle cx="34" cy="47" r="1" fill="#ffffff" />
      <circle cx="66" cy="47" r="1" fill="#ffffff" />

      {/* Open happy smile */}
      <path d="M35 58 C35 58, 50 74, 65 58 Z" fill="url(#happyMouth)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))" />
      <path d="M35 58 C45 61, 55 61, 65 58" stroke="#172554" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// 7. Very Happy (Rất vui) - Purple theme (#8b5cf6)
export function ThreeDVeryHappy({ style = {}, ...props }) {
  return (
    <svg style={{ ...baseEmojiStyle, ...style }} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <defs>
        <radialGradient id="vHappyAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="vHappyBody" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#f5f3ff" />
          <stop offset="40%" stopColor="#8b5cf6" />
          <stop offset="90%" stopColor="#5b21b6" />
          <stop offset="100%" stopColor="#3b0764" />
        </radialGradient>
        <linearGradient id="vHappyHighlight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="vHappyMouth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fda4af" />
          <stop offset="60%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#be185d" />
        </linearGradient>
      </defs>

      <circle cx="50" cy="50" r="48" fill="url(#vHappyAura)" />
      <circle cx="50" cy="50" r="36" fill="url(#vHappyBody)" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.45))" />
      <ellipse cx="40" cy="28" rx="14" ry="7" fill="url(#vHappyHighlight)" transform="rotate(-15 40 28)" />

      {/* Laughing closed eyes (^^) */}
      <path d="M26 47 L34 40 L42 47" stroke="#3b0764" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M58 47 L66 40 L74 47" stroke="#3b0764" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Big joyful laugh mouth */}
      <path d="M30 55 C30 55, 50 80, 70 55 C70 55, 62 58, 50 58 C38 58, 30 55, 30 55 Z" fill="url(#vHappyMouth)" filter="drop-shadow(0 3px 5px rgba(0,0,0,0.3))" />
      <path d="M30 55 C40 59, 60 59, 70 55" stroke="#3b0764" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

// 8. Excellent (Tuyệt vời) - Pink theme (#ec4899)
export function ThreeDExcellent({ style = {}, ...props }) {
  return (
    <svg style={{ ...baseEmojiStyle, ...style }} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <defs>
        <radialGradient id="excellentAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ec4899" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="excellentBody" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#fdf2f8" />
          <stop offset="40%" stopColor="#ec4899" />
          <stop offset="90%" stopColor="#9d174d" />
          <stop offset="100%" stopColor="#500724" />
        </radialGradient>
        <linearGradient id="excellentHighlight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="excellentMouth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe4e6" />
          <stop offset="40%" stopColor="#fda4af" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>
        <linearGradient id="starGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#eab308" />
        </linearGradient>
      </defs>

      <circle cx="50" cy="50" r="48" fill="url(#excellentAura)" />
      <circle cx="50" cy="50" r="36" fill="url(#excellentBody)" filter="drop-shadow(0 6px 14px rgba(0,0,0,0.5))" />
      <ellipse cx="40" cy="28" rx="14" ry="7" fill="url(#excellentHighlight)" transform="rotate(-15 40 28)" />

      {/* Sparkling Star Eyes */}
      {/* Left Star */}
      <path d="M34 32 L36.5 38.5 L43 39 L38 43.5 L39.5 50 L34 46.5 L28.5 50 L30 43.5 L25 39 L31.5 38.5 Z" fill="url(#starGrad)" stroke="#854d0e" strokeWidth="1" filter="drop-shadow(0 0 6px rgba(254,240,138,0.8))" />
      {/* Right Star */}
      <path d="M66 32 L68.5 38.5 L75 39 L70 43.5 L71.5 50 L66 46.5 L60.5 50 L62 43.5 L57 39 L63.5 38.5 Z" fill="url(#starGrad)" stroke="#854d0e" strokeWidth="1" filter="drop-shadow(0 0 6px rgba(254,240,138,0.8))" />

      {/* Giant open grin */}
      <path d="M26 53 C26 53, 50 82, 74 53 C74 53, 65 57, 50 57 C35 57, 26 53, 26 53 Z" fill="url(#excellentMouth)" filter="drop-shadow(0 3px 6px rgba(0,0,0,0.4))" />
      <path d="M26 53 C36 58, 64 58, 74 53" stroke="#500724" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}

// Array mapping mood index (0 to 7) to 3D SVG component
export const THREE_D_MOOD_EMOJIS = [
  <ThreeDVerySad key="very_sad" />,
  <ThreeDSad key="sad" />,
  <ThreeDUnhappy key="unhappy" />,
  <ThreeDNeutral key="neutral" />,
  <ThreeDOk key="ok" />,
  <ThreeDHappy key="happy" />,
  <ThreeDVeryHappy key="very_happy" />,
  <ThreeDExcellent key="excellent" />
];
