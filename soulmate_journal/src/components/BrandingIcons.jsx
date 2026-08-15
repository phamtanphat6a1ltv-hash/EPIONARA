import React from "react";

// Helper style to add a nice glow filter matching the color
const iconStyle = {
  display: "inline-block",
  verticalAlign: "middle",
  transition: "transform 0.3s ease",
};

const portalImgStyle = {
  ...iconStyle,
  mixBlendMode: "screen",
  filter: "contrast(1.2) brightness(1.08)", // Triệt tiêu viền xám mờ ở rìa ngoài để ảnh trong suốt hoàn hảo
};

// =================== PORTAL 1: MOMENTS ===================

export function IconMoments({ className, style, ...props }) {
  const width = props.width || "1.2em";
  const height = props.height || "1.2em";
  return (
    <img
      src="/portal-moments.png?v=3.1"
      alt="Moments"
      className={className}
      style={{
        ...portalImgStyle,
        width,
        height,
        objectFit: "contain",
        ...style
      }}
      {...props}
    />
  );
}

export function IconJournal(props) {
  return (
    <svg style={iconStyle} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 22C2 22 6 18 12 17C18 16 22 10 22 2C22 2 14 2 8 8C4.5 11.5 2 16 2 22Z" />
      <path d="M12 17L19 10" opacity="0.6" />
      <path d="M8 13L13 8" opacity="0.6" />
    </svg>
  );
}

export function IconReplay(props) {
  return (
    <svg style={iconStyle} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
      <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.2" />
    </svg>
  );
}

export function IconLetter(props) {
  return (
    <svg style={iconStyle} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

export function IconCBT(props) {
  return (
    <svg style={iconStyle} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18M15 3v18M3 9h18M3 15h18" opacity="0.4" />
      <circle cx="9" cy="9" r="2" fill="currentColor" />
      <circle cx="15" cy="15" r="2" fill="currentColor" />
    </svg>
  );
}

// =================== PORTAL 2: AI INTELLIGENCE ===================

export function IconAI({ className, style, ...props }) {
  const width = props.width || "1.2em";
  const height = props.height || "1.2em";
  return (
    <img
      src="/portal-ai.png?v=3.1"
      alt="AI"
      className={className}
      style={{
        ...portalImgStyle,
        width,
        height,
        objectFit: "contain",
        ...style
      }}
      {...props}
    />
  );
}

export function IconChat(props) {
  return (
    <svg style={iconStyle} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M8 10h.01M12 10h.01M16 10h.01" strokeWidth="3" />
    </svg>
  );
}

export function IconPredict(props) {
  return (
    <svg style={iconStyle} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" opacity="0.5" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}

export function IconAnalysis(props) {
  return (
    <svg style={iconStyle} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <path d="M3 20h18" />
    </svg>
  );
}

// =================== PORTAL 3: INNER MIRROR ===================

export function IconMirror({ className, style, ...props }) {
  const width = props.width || "1.2em";
  const height = props.height || "1.2em";
  return (
    <img
      src="/portal-mirror.png?v=3.1"
      alt="Inner Mirror"
      className={className}
      style={{
        ...portalImgStyle,
        width,
        height,
        objectFit: "contain",
        ...style
      }}
      {...props}
    />
  );
}

export function IconTest(props) {
  return (
    <svg style={iconStyle} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-3.12 3 3 0 0 1 0-3.88 2.5 2.5 0 0 1 0-3.12A2.5 2.5 0 0 1 9.5 2z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-3.12 3 3 0 0 0 0-3.88 2.5 2.5 0 0 0 0-3.12A2.5 2.5 0 0 0 14.5 2z" />
      <path d="M12 5c-1.5.5-2.5 1.5-2.5 3M12 10c-1.5.5-2.5 1.5-2.5 3M12 7c1.5.5 2.5 1.5 2.5 3M12 12c1.5.5 2.5 1.5 2.5 3" opacity="0.5" />
    </svg>
  );
}

export function IconFace(props) {
  return (
    <svg style={iconStyle} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
      <circle cx="12" cy="12" r="5" fill="currentColor" opacity="0.1" />
      <path d="M9 11h.01M15 11h.01" strokeWidth="3" />
      <path d="M9 15a3.5 3.5 0 0 0 6 0" />
    </svg>
  );
}

export function IconGrowth(props) {
  return (
    <svg style={iconStyle} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4.5 16.5c-1.5 1.25-2.5 3-2.5 4.5h20c0-1.5-1-3.25-2.5-4.5" />
      <path d="M12 2v14" />
      <path d="M12 5c-2.5 1-4 3-4 5.5S9.5 15 12 16" />
      <path d="M12 5c2.5 1 4 3 4 5.5S14.5 15 12 16" />
    </svg>
  );
}

export function IconGlobe(props) {
  return (
    <svg style={iconStyle} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <path d="M2 12h20" />
    </svg>
  );
}

export function IconReport(props) {
  return (
    <svg style={iconStyle} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <circle cx="10" cy="14" r="2" />
      <line x1="12" y1="16" x2="16" y2="20" />
    </svg>
  );
}

// =================== PORTAL 4: BALANCE ===================

export function IconBalance({ className, style, ...props }) {
  const width = props.width || "1.2em";
  const height = props.height || "1.2em";
  return (
    <img
      src="/portal-balance.png?v=3.1"
      alt="Balance"
      className={className}
      style={{
        ...portalImgStyle,
        width,
        height,
        objectFit: "contain",
        ...style
      }}
      {...props}
    />
  );
}

export function IconGarden(props) {
  return (
    <svg style={iconStyle} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 19V5M12 5c-2.5.5-5 2-5 4.5S9 14 12 14M12 7c2.5.5 5 2 5 4.5S15 16 12 16" />
      <path d="M3 22h18" />
    </svg>
  );
}

export function IconGame(props) {
  return (
    <svg style={iconStyle} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="6" width="20" height="12" rx="3" />
      <path d="M6 12h4M8 10v4" />
      <circle cx="15" cy="12" r="1" fill="currentColor" />
      <circle cx="18" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

export function IconCare(props) {
  return (
    <svg style={iconStyle} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor" opacity="0.15" />
      <path d="M12 5.5a2.5 2.5 0 0 0-5 0c0 3 5 6.5 5 6.5s5-3.5 5-6.5a2.5 2.5 0 0 0-5 0z" />
    </svg>
  );
}

// =================== PORTAL 5: LIBRARY ===================

export function IconLibrary({ className, style, ...props }) {
  const width = props.width || "1.2em";
  const height = props.height || "1.2em";
  return (
    <img
      src="/portal-library.png?v=3.1"
      alt="Library"
      className={className}
      style={{
        ...portalImgStyle,
        width,
        height,
        objectFit: "contain",
        ...style
      }}
      {...props}
    />
  );
}

export function IconKnowledge(props) {
  return (
    <svg style={iconStyle} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

export function IconDashboard(props) {
  return (
    <svg style={iconStyle} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 17V9M15 17v-4" />
    </svg>
  );
}

export function IconProgress(props) {
  return (
    <svg style={iconStyle} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

export function IconHome(props) {
  return (
    <svg style={iconStyle} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

