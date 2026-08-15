import React from "react";
import GlassCard from "./GlassCard.jsx";

/**
 * EmptyJournalState renders when the journal timeline is empty.
 * Displays a pen/notepad illustration and a scroll-to-action button.
 */
export function EmptyJournalState({ t, onWriteClick }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "32px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        animation: "fadeIn 0.5s ease",
      }}
    >
      <div
        style={{
          fontSize: 64,
          marginBottom: 16,
          filter: "drop-shadow(0 0 15px rgba(108,61,232,0.3))",
          animation: "emptyFloat 3s ease-in-out infinite",
        }}
      >
        📓✍️
      </div>
      <h4 style={{ color: "white", fontSize: 16, fontWeight: 700, margin: "0 0 8px" }}>
        {t.empty_journal_title || "Chưa có nhật ký cảm xúc"}
      </h4>
      <p
        style={{
          color: "rgba(255,255,255,0.55)",
          fontSize: 13,
          maxWidth: 320,
          margin: "0 0 20px",
          lineHeight: 1.6,
        }}
      >
        {t.empty_journal_desc || "Mỗi ngày là một trang sách mới. Hãy ghi lại cảm xúc đầu tiên để AI có thể phân tích xu hướng tâm lý của bạn."}
      </p>
      <button
        onClick={onWriteClick}
        style={{
          padding: "10px 24px",
          borderRadius: 99,
          border: "none",
          background: "linear-gradient(135deg, var(--purple, #6c3de8), var(--violet, #8b5cf6))",
          color: "white",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 8px 20px rgba(108, 61, 232, 0.3)",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
      >
        ✍️ {t.empty_journal_cta || "Viết nhật ký ngay"}
      </button>
      <style>{`
        @keyframes emptyFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}

/**
 * EmptyDashboardState displays when user records are fewer than 7.
 * Shows checklist guide helping users unlock psychological insights.
 */
export function EmptyDashboardState({ t, journalCount = 0, onWriteClick, onTestClick }) {
  const steps = [
    { label: (t.unlock_step1 || "Ghi nhật ký cảm xúc (Đã hoàn thành: {count}/7 ngày)").replace("{count}", journalCount), done: journalCount >= 7 },
    { label: t.unlock_step2 || "Làm bài trắc nghiệm tính cách MBTI", done: false },
    { label: t.unlock_step3 || "Phân tích trạng thái tâm trạng với AI", done: false },
  ];

  return (
    <GlassCard style={{ padding: "24px", animation: "fadeIn 0.5s ease" }}>
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 32 }}>📈</span>
        <div>
          <h4 style={{ color: "white", fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>
            {t.unlock_stats_title || "Mở khóa Phân tích Chuyên sâu"}
          </h4>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: 0 }}>
            {t.unlock_stats_desc || "Ghi nhận dữ liệu tối thiểu 7 ngày để biểu đồ xu hướng cảm xúc hoạt động."}
          </p>
        </div>
      </div>

      {/* Steps List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {steps.map((step, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              background: step.done ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${step.done ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.07)"}`,
              borderRadius: 12,
              fontSize: 13,
              color: step.done ? "#6ee7b7" : "rgba(255,255,255,0.75)",
            }}
          >
            <span style={{ fontSize: 16 }}>{step.done ? "✅" : "⏳"}</span>
            <span>{step.label}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={onWriteClick}
          className="btn-press-active"
          style={{
            padding: "8px 18px",
            borderRadius: 10,
            background: "rgba(108, 61, 232, 0.2)",
            border: "1px solid rgba(108, 61, 232, 0.4)",
            color: "#c4b5fd",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            flex: 1,
            minWidth: 120,
          }}
        >
          {t.unlock_btn_journal || "📔 Ghi nhật ký"}
        </button>
        <button
          onClick={onTestClick}
          className="btn-press-active"
          style={{
            padding: "8px 18px",
            borderRadius: 10,
            background: "rgba(34, 211, 238, 0.15)",
            border: "1px solid rgba(34, 211, 238, 0.35)",
            color: "#22d3ee",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            flex: 1,
            minWidth: 120,
          }}
        >
          {t.unlock_btn_test || "📝 Làm trắc nghiệm"}
        </button>
      </div>
    </GlassCard>
  );
}

/**
 * EmptyChatbotState displays chips below welcome text inside Chatbot page.
 */
export function EmptyChatbotState({ t, onChipClick }) {
  const suggestions = [
    t.chat_sugg1 || "Hôm nay tôi cảm thấy hơi căng thẳng, hãy khuyên tôi.",
    t.chat_sugg2 || "Làm sao để tập trung làm việc hiệu quả?",
    t.chat_sugg3 || "Kể cho tôi nghe một câu chuyện chữa lành.",
  ];

  return (
    <div style={{ marginTop: 24, animation: "fadeIn 0.5s ease" }}>
      <div style={{ color: "var(--text-secondary)", fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 12 }}>
        {t.chat_quick_suggest || "💡 GỢI Ý CÂU HỎI NHANH"}
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 12
      }}>
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => onChipClick(s)}
            className="btn-press-active"
            style={{
              padding: "16px 20px",
              background: "var(--glass-bg)",
              border: "1.5px solid var(--border2)",
              borderRadius: 16,
              color: "var(--text-primary)",
              textAlign: "left",
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "inherit",
              lineHeight: 1.5,
              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "var(--shadow-card)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--card-bg-purple)";
              e.currentTarget.style.borderColor = "var(--card-border-purple)";
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = "0 10px 24px -8px rgba(108, 61, 232, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--glass-bg)";
              e.currentTarget.style.borderColor = "var(--border2)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "var(--shadow-card)";
            }}
          >
            <span style={{ flex: 1 }}>{s}</span>
            <span style={{ fontSize: 14, opacity: 0.7 }}>➔</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * EmptyTestState displays benefit checklist when test history is empty.
 */
export function EmptyTestState({ t, onStartClick }) {
  const benefits = [
    t.empty_tests_benefit1 || "Khám phá các chiều hướng tâm lý bản thân qua trắc nghiệm MBTI khoa học.",
    t.empty_tests_benefit2 || "Theo dõi tiến trình phát triển và cải thiện chỉ số trí tuệ cảm xúc EQ.",
    t.empty_tests_benefit3 || "Nhận gợi ý, bài tập thực hành tâm lý cá nhân hóa dựa trên kết quả.",
  ];

  return (
    <div
      style={{
        textAlign: "center",
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        animation: "fadeIn 0.5s ease",
      }}
    >
      <div style={{ fontSize: 52, marginBottom: 14 }}>📝🧬</div>
      <h4 style={{ color: "white", fontSize: 16, fontWeight: 700, margin: "0 0 12px" }}>
        {t.empty_tests_title || "Chưa có kết quả trắc nghiệm"}
      </h4>

      {/* Benefits Checklist */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 360, margin: "0 0 24px", textAlign: "left" }}>
        {benefits.map((b, idx) => (
          <div key={idx} style={{ display: "flex", gap: 10, fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
            <span style={{ color: "#22d3ee" }}>✦</span>
            <span>{b}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onStartClick}
        style={{
          padding: "10px 24px",
          borderRadius: 99,
          border: "none",
          background: "linear-gradient(135deg, #06b6d4, #0891b2)",
          color: "white",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 8px 20px rgba(6, 182, 212, 0.3)",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
      >
        📝 {t.empty_tests_cta || "Bắt đầu làm Test"}
      </button>
    </div>
  );
}
