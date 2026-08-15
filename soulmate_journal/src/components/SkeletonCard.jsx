// =================== SKELETON LOADING COMPONENT ===================

export function SkeletonLine({ width = "100%", height = 14, style = {} }) {
  return (
    <div style={{
      width,
      height,
      borderRadius: 7,
      background: "linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.06) 100%)",
      backgroundSize: "400px 100%",
      animation: "skeletonShimmer 1.4s ease-in-out infinite",
      ...style,
    }} />
  );
}

export function SkeletonCard({ lines = 3, style = {} }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.09)",
      borderRadius: 20,
      padding: 24,
      ...style,
    }}>
      <SkeletonLine width="60%" height={18} style={{ marginBottom: 16 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine
          key={i}
          width={i === lines - 1 ? "75%" : "100%"}
          height={14}
          style={{ marginBottom: i < lines - 1 ? 10 : 0 }}
        />
      ))}
      <style>{`
      `}</style>
    </div>
  );
}

export function SkeletonResult() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SkeletonCard lines={2} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <SkeletonCard lines={3} />
        <SkeletonCard lines={3} />
      </div>
      <SkeletonCard lines={4} />
      <style>{`
      `}</style>
    </div>
  );
}

export function SkeletonText({ rows = 3 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonLine key={i} width={i === rows - 1 ? "70%" : "100%"} />
      ))}
      <style>{`
      `}</style>
    </div>
  );
}

export default SkeletonCard;
