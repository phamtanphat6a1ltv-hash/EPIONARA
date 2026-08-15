import GlassCard from "../GlassCard.jsx";

export default function EmotionDisplay({ detected, history, t }) {
  const isUncertain = detected && detected.emotion === 'uncertain';

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Main result */}
      {detected ? (
        <div style={{
          background: `${detected.color}18`,
          border: `2px solid ${detected.color}44`,
          borderRadius: 18, padding: "24px", textAlign: "center",
          animation: "fadeInUp 0.4s ease",
          position: "relative"
        }}>
          <div style={{ fontSize: 56, marginBottom: 8, animation: "emojiPop 0.4s ease" }}>
            {detected.emoji}
          </div>
          
          <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: 20, marginBottom: 4 }}>
            {detected.localizedLabel || t[detected.key] || detected.emotion}
          </div>
          
          {detected.reason && (
             <div style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 12, fontStyle: "italic" }}>
               {detected.reason}
             </div>
          )}

          {!isUncertain && (
            <>
              <div style={{ color: detected.color, fontSize: 13, marginBottom: 12 }}>
                {detected.confidence}% {t.face_confidence || "độ tin cậy nhận diện"}
              </div>
              <div style={{
                height: 6, background: "var(--border2)",
                borderRadius: 99, overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", width: `${detected.confidence}%`,
                  background: detected.color,
                  borderRadius: 99, transition: "width 0.8s ease",
                }} />
              </div>
            </>
          )}

          {/* All emotions breakdown (Hide when uncertain to keep UI clean) */}
          {!isUncertain && detected.allEmotions && (
            <div style={{ marginTop: 16 }}>
              {Object.entries(detected.allEmotions)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(([em, val]) => {
                  // Fallback for color/emoji mapping logic if needed from constants
                  // But since EMOTION_MAP is in constants now, we might not have it here unless imported.
                  // For simplicity, we just show text and a generic bar if mapping is missing
                  // I'll assume we can use a basic mapped color if available.
                  const valPct = Math.round(val * 100);
                  if (valPct < 1) return null; // Hide extremely low bars
                  
                  return (
                    <div key={em} style={{
                      display: "flex", alignItems: "center", gap: 8, marginBottom: 6,
                    }}>
                      <span style={{ fontSize: 12, width: 60, textAlign: "left", color: "var(--text-secondary)" }}>
                        {em}
                      </span>
                      <div style={{ flex: 1, height: 4, background: "var(--border2)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", width: `${valPct}%`,
                          background: "#a78bfa",
                          borderRadius: 99,
                        }} />
                      </div>
                      <span style={{ color: "var(--text-secondary)", fontSize: 10, width: 30, textAlign: "right" }}>
                        {valPct}%
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      ) : (
        <GlassCard style={{
          padding: "32px", textAlign: "center",
          borderRadius: 18,
        }}>
          <div style={{ fontSize: 48, marginBottom: 8, opacity: 0.4 }}>😶</div>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: 0 }}>
            {t.face_detected || "Bật camera để bắt đầu nhận diện"}
          </p>
          <p style={{ color: "var(--text-secondary)", opacity: 0.7, fontSize: 11, marginTop: 8, margin: "8px 0 0" }}>
            {t.face_bring_face || "Đưa khuôn mặt vào khung hình"}
          </p>
        </GlassCard>
      )}

      {/* Emotion history */}
      {history.length > 0 && (
        <GlassCard style={{
          padding: "16px", borderRadius: 14,
        }}>
          <div style={{ color: "var(--text-secondary)", fontSize: 11, marginBottom: 10, fontWeight: 600 }}>
            {t.face_history || "📊 Lịch sử phát hiện"} ({history.length})
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {history.map((h, i) => {
              if (h.emotion === 'uncertain') return null; // Don't show uncertain in history
              return (
                <div
                  key={i}
                  title={`${h.localizedLabel || h.emotion} — ${h.confidence}%`}
                  style={{
                    padding: "4px 12px", borderRadius: 99,
                    background: `${h.color}15`, color: h.color,
                    border: `1px solid ${h.color}33`,
                    fontSize: 13, cursor: "default",
                  }}
                >
                  {h.emoji}
                </div>
              )
            })}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
