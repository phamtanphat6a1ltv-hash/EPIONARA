import React from "react";
import GlassCard from "./GlassCard.jsx";

// Standard shimmer background style using linear gradient
const shimmerStyle = {
  background: "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmerWave 1.8s infinite linear",
};

/**
 * TextSkeleton renders lines of placeholder bars with shifting animated light patterns.
 */
export function TextSkeleton({ lines = 3, style = {} }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", ...style }}>
      {Array.from({ length: lines }).map((_, i) => {
        // Random width for natural look
        const width = i === lines - 1 ? "60%" : i === 0 ? "90%" : "100%";
        return (
          <div
            key={i}
            style={{
              height: 14,
              width,
              borderRadius: 4,
              ...shimmerStyle,
            }}
          />
        );
      })}
    </div>
  );
}

/**
 * ChartSkeleton renders an animated pulsing area representing a visual chart.
 */
export function ChartSkeleton({ height = 180, style = {} }) {
  return (
    <GlassCard style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 12, ...style }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ height: 16, width: "35%", borderRadius: 4, ...shimmerStyle }} />
        <div style={{ height: 16, width: "15%", borderRadius: 99, ...shimmerStyle }} />
      </div>
      <div
        style={{
          height,
          width: "100%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 10,
          padding: "10px 0 0",
        }}
      >
        {[40, 75, 55, 90, 60, 45, 80, 50, 70, 85, 30, 95].map((h, idx) => (
          <div
            key={idx}
            style={{
              height: `${h}%`,
              flex: 1,
              borderRadius: "4px 4px 0 0",
              background: "rgba(139, 92, 246, 0.15)",
              border: "1px solid rgba(139, 92, 246, 0.25)",
              animation: "skeletonPulse 1.5s ease-in-out infinite",
              animationDelay: `${idx * 0.1}s`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes shimmerWave {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes skeletonPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.85; }
        }
      `}</style>
    </GlassCard>
  );
}

/**
 * PageSkeleton represents the structure of an entire loading view.
 * Displays a visual header skeleton alongside three dynamic content cards.
 */
export function PageSkeleton() {
  return (
    <div style={{ minHeight: "100vh", padding: "80px 16px 40px", maxWidth: 1000, margin: "0 auto" }}>
      {/* Title Header Skeleton */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          marginBottom: 36,
        }}
      >
        <div style={{ height: 32, width: "45%", borderRadius: 6, ...shimmerStyle }} />
        <div style={{ height: 16, width: "30%", borderRadius: 4, ...shimmerStyle }} />
      </div>

      {/* Grid skeleton */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Row 1: Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          {[1, 2, 3, 4].map((i) => (
            <GlassCard key={i} style={{ padding: "16px", textAlign: "center" }}>
              <div style={{ height: 14, width: "50%", margin: "0 auto 8px", borderRadius: 4, ...shimmerStyle }} />
              <div style={{ height: 26, width: "40%", margin: "0 auto", borderRadius: 6, ...shimmerStyle }} />
            </GlassCard>
          ))}
        </div>

        {/* Row 2: Charts and Form */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 16 }}>
          <GlassCard style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ height: 18, width: "40%", borderRadius: 4, ...shimmerStyle }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} style={{ height: 36, borderRadius: 8, ...shimmerStyle }} />
              ))}
            </div>
            <div style={{ height: 60, borderRadius: 8, ...shimmerStyle }} />
          </GlassCard>
          <ChartSkeleton height={140} />
        </div>

        {/* Row 3: History list */}
        <GlassCard style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ height: 18, width: "20%", borderRadius: 4, ...shimmerStyle }} />
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "8px 0",
                borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none",
              }}
            >
              <div style={{ width: 28, height: 28, borderRadius: "50%", ...shimmerStyle }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ height: 14, width: "80%", borderRadius: 4, ...shimmerStyle }} />
                <div style={{ height: 10, width: "20%", borderRadius: 4, ...shimmerStyle }} />
              </div>
              <div style={{ width: 60, height: 18, borderRadius: 10, ...shimmerStyle }} />
            </div>
          ))}
        </GlassCard>
      </div>
    </div>
  );
}
