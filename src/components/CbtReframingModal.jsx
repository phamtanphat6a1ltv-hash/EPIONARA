import { useState } from "react";
import PropTypes from "prop-types";
import { useAppContext } from "../context/AppContext.jsx";
import { useCbtRecords, useJournals, useGarden } from "../hooks/useStorage.js";
import { useSoundEffects } from "../context/SoundEffectsContext.jsx";
import GlassCard from "./GlassCard.jsx";

const TRANSLATIONS = {
  vi: {
    title: "🧠 Trợ lý Tái Cấu Trúc Nhận Thức CBT",
    subtitle: "AI phát hiện một số lối tư duy có xu hướng tiêu cực. Hãy thực hiện bài tập CBT nhanh để giải tỏa tâm lý.",
    step1: "1. Nhận diện lỗi tư duy",
    step2: "2. Thách thức ý nghĩ",
    step3: "3. Suy nghĩ cân bằng mới",
    thought_label: "Ý nghĩ tự động tiêu cực:",
    distortion_detected: "Bẫy nhận thức phát hiện:",
    challenge_desc: "Hãy liệt kê các sự thật hoặc bằng chứng khách quan đi ngược lại ý nghĩ tiêu cực trên (Tại sao ý nghĩ đó chưa chắc đúng?):",
    challenge_placeholder: "Ví dụ: Đồng nghiệp không chào có thể là vì cô ấy đang vội hoặc đang tập trung suy nghĩ việc khác, chứ không liên quan đến mình...",
    balanced_desc: "Viết một ý nghĩ cân bằng, khách quan và cảm thông hơn dựa trên các bằng chứng thực tế:",
    balanced_placeholder: "Ví dụ: Mình vẫn làm tốt công việc và được mọi người yêu mến. Việc một ai đó bận rộn không có nghĩa là họ ghét mình...",
    use_ai_suggestion: "✨ Sử dụng gợi ý tái cấu trúc từ AI",
    btn_prev: "Quay lại",
    btn_next: "Tiếp tục",
    btn_complete: "Hoàn tất & Nhận +100 Coins",
    coins_claimed: "Chúc mừng! Bạn đã hoàn thành bài tập CBT và nhận +100 Soul Coins! 🪙🎉",
    btn_close: "Đóng",
    evidence_required: "Vui lòng điền nội dung phân tích bằng chứng trước khi tiếp tục.",
    balanced_required: "Vui lòng viết ý nghĩ cân bằng mới trước khi hoàn tất."
  },
  en: {
    title: "🧠 CBT Cognitive Reframing Assistant",
    subtitle: "AI detected some negative cognitive distortions in your entry. Take a quick CBT exercise to reframe your thoughts.",
    step1: "1. Identify Distortions",
    step2: "2. Challenge Thought",
    step3: "3. Balanced Alternative",
    thought_label: "Automatic Negative Thought:",
    distortion_detected: "Detected Distortion:",
    challenge_desc: "List objective facts or evidence that contradict the negative thought (Why might it not be 100% true?):",
    challenge_placeholder: "e.g., My colleague might have been busy or distracted, it's not necessarily about me...",
    balanced_desc: "Formulate a more balanced, realistic, and compassionate alternative thought:",
    balanced_placeholder: "e.g., I do a good job and my team values me. One person being busy doesn't mean they dislike me...",
    use_ai_suggestion: "✨ Use AI Reframed Suggestion",
    btn_prev: "Back",
    btn_next: "Next",
    btn_complete: "Complete & Earn +100 Coins",
    coins_claimed: "Congratulations! You completed the CBT exercise and claimed +100 Soul Coins! 🪙🎉",
    btn_close: "Close",
    evidence_required: "Please list contradicting facts before proceeding.",
    balanced_required: "Please write a balanced thought before completing."
  }
};

export function CbtReframingModal({ entryId, distortions, note, onClose }) {
  const { lang, addCoins } = useAppContext();
  const { addJournal, journals } = useJournals();
  const { addRecord } = useCbtRecords();
  const { rewardXP } = useGarden();
  const { playSuccess, playBubble } = useSoundEffects();

  const t = TRANSLATIONS[lang] || TRANSLATIONS.vi;

  const [step, setStep] = useState(1);
  const [evidenceAgainst, setEvidenceAgainst] = useState("");
  const [balancedThought, setBalancedThought] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);

  // Take the primary distortion to display details
  const primaryDistortion = distortions[0] || {
    type: "Unspecified Distortion",
    thought: note,
    explanation_vi: "Lối suy nghĩ chưa tối ưu.",
    explanation_en: "Suboptimal thinking pattern.",
    reframed_vi: "Hãy suy nghĩ tích cực hơn.",
    reframed_en: "Try to think more positively."
  };

  const handleNext = () => {
    if (step === 2 && !evidenceAgainst.trim()) {
      alert(t.evidence_required);
      return;
    }
    playBubble();
    setStep(prev => prev + 1);
  };

  const handlePrev = () => {
    playBubble();
    setStep(prev => prev - 1);
  };

  const handleUseAiSuggestion = () => {
    playBubble();
    const suggestion = lang === "vi" ? primaryDistortion.reframed_vi : primaryDistortion.reframed_en;
    setBalancedThought(suggestion);
  };

  const handleComplete = async () => {
    if (!balancedThought.trim()) {
      alert(t.balanced_required);
      return;
    }

    try {
      // 1. Update the journal entry in local storage
      const existingEntry = journals.find(j => j.id === entryId);
      if (existingEntry) {
        const updatedEntry = {
          ...existingEntry,
          cbtReframed: true,
          reframedThought: balancedThought
        };
        await addJournal(updatedEntry);
      }

      // 2. Add to CBT thought record database
      const cbtRecord = {
        id: `cbt_${Date.now()}`,
        createdAt: Date.now(),
        situation: note,
        automaticThought: primaryDistortion.thought || note,
        distortions: distortions.map(d => d.type.toLowerCase().replace(/ /g, "_")),
        evidenceFor: lang === "vi" ? "AI tự động phát hiện trong nhật ký" : "AI auto-detected in journal",
        evidenceAgainst: evidenceAgainst,
        balancedThought: balancedThought,
        emotions: [
          { id: "anxiety", label: lang === "vi" ? "Căng thẳng" : "Distress", initial: 75, post: 30 }
        ]
      };
      await addRecord(cbtRecord);
      await rewardXP(15, 0); // Quest 0: Viết 1 điều biết ơn / CBT
      await rewardXP(15, 2); // Quest 2: Đừng tự trách bản thân hôm nay

      // 3. Award coins & play sound
      addCoins(100);
      playSuccess();
      setIsCompleted(true);
    } catch (err) {
      console.error("CBT Reframing save error:", err);
      setIsCompleted(true);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(6, 8, 24, 0.93)",
        backdropFilter: "blur(16px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: 16,
        color: "white"
      }}
    >
      <div style={{ width: "100%", maxWidth: 580, animation: "modalIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
        <GlassCard style={{ padding: "32px 28px", border: "1px solid rgba(139, 92, 246, 0.35)", boxShadow: "0 25px 50px -12px rgba(139, 92, 246, 0.25)" }}>
          
          {!isCompleted ? (
            <>
              {/* Header */}
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px", color: "#a78bfa" }}>
                {t.title}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12.5, margin: "0 0 24px", lineHeight: 1.5 }}>
                {t.subtitle}
              </p>

              {/* Progress bar */}
              <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                {[1, 2, 3].map(s => (
                  <div
                    key={s}
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 2,
                      background: s <= step ? "linear-gradient(90deg, #a78bfa, #8b5cf6)" : "rgba(255,255,255,0.08)",
                      transition: "all 0.3s ease"
                    }}
                  />
                ))}
              </div>

              {/* Steps container */}
              <div style={{ minHeight: 180, marginBottom: 28 }}>
                {step === 1 && (
                  <div style={{ animation: "fadeIn 0.2s ease" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#cbd5e1", marginBottom: 8 }}>{t.step1}</div>
                    
                    <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px dashed rgba(239, 68, 68, 0.25)", borderRadius: 12, padding: 14, marginBottom: 16 }}>
                      <span style={{ fontSize: 11, color: "#f87171", fontWeight: 700, display: "block", textTransform: "uppercase", marginBottom: 4 }}>
                        {t.thought_label}
                      </span>
                      <p style={{ margin: 0, fontSize: 13, color: "#fca5a5", fontStyle: "italic", lineHeight: 1.5 }}>
                        "{primaryDistortion.thought}"
                      </p>
                    </div>

                    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 14 }}>
                      <span style={{ fontSize: 11, color: "#c084fc", fontWeight: 700, display: "block", textTransform: "uppercase", marginBottom: 4 }}>
                        {t.distortion_detected}: {primaryDistortion.type}
                      </span>
                      <p style={{ margin: 0, fontSize: 13, color: "#e2e8f0", lineHeight: 1.5 }}>
                        {lang === "vi" ? primaryDistortion.explanation_vi : primaryDistortion.explanation_en}
                      </p>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div style={{ animation: "fadeIn 0.2s ease" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#cbd5e1", marginBottom: 8 }}>{t.step2}</div>
                    <label htmlFor="evidence-input" style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.85)", marginBottom: 12, lineHeight: 1.5 }}>
                      {t.challenge_desc}
                    </label>
                    <textarea
                      id="evidence-input"
                      value={evidenceAgainst}
                      onChange={(e) => setEvidenceAgainst(e.target.value)}
                      placeholder={t.challenge_placeholder}
                      style={{
                        width: "100%",
                        minHeight: 100,
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 12,
                        color: "white",
                        padding: 12,
                        fontSize: 13,
                        resize: "none",
                        fontFamily: "inherit",
                        boxSizing: "border-box",
                        outline: "none"
                      }}
                    />
                  </div>
                )}

                {step === 3 && (
                  <div style={{ animation: "fadeIn 0.2s ease" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#cbd5e1", marginBottom: 8 }}>{t.step3}</div>
                    <label htmlFor="balanced-input" style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.85)", marginBottom: 12, lineHeight: 1.5 }}>
                      {t.balanced_desc}
                    </label>
                    <textarea
                      id="balanced-input"
                      value={balancedThought}
                      onChange={(e) => setBalancedThought(e.target.value)}
                      placeholder={t.balanced_placeholder}
                      style={{
                        width: "100%",
                        minHeight: 80,
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 12,
                        color: "white",
                        padding: 12,
                        fontSize: 13,
                        resize: "none",
                        fontFamily: "inherit",
                        boxSizing: "border-box",
                        outline: "none"
                      }}
                    />
                    <button
                      onClick={handleUseAiSuggestion}
                      style={{
                        background: "rgba(167, 139, 250, 0.15)",
                        border: "1px solid rgba(167, 139, 250, 0.35)",
                        color: "#c4b5fd",
                        padding: "6px 12px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        marginTop: 10,
                        transition: "all 0.2s"
                      }}
                    >
                      {t.use_ai_suggestion}
                    </button>
                  </div>
                )}
              </div>

              {/* Navigation Actions */}
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                {step > 1 ? (
                  <button
                    onClick={handlePrev}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.7)",
                      padding: "10px 20px",
                      borderRadius: 10,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600
                    }}
                  >
                    {t.btn_prev}
                  </button>
                ) : <div />}

                {step < 3 ? (
                  <button
                    onClick={handleNext}
                    style={{
                      background: "linear-gradient(135deg, #6c3de8, #8b5cf6)",
                      border: "none",
                      color: "white",
                      padding: "10px 24px",
                      borderRadius: 10,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600
                    }}
                  >
                    {t.btn_next}
                  </button>
                ) : (
                  <button
                    onClick={handleComplete}
                    style={{
                      background: "linear-gradient(135deg, #10b981, #059669)",
                      border: "none",
                      color: "white",
                      padding: "10px 24px",
                      borderRadius: 10,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                      boxShadow: "0 0 15px rgba(16, 185, 129, 0.4)"
                    }}
                  >
                    {t.btn_complete}
                  </button>
                )}
              </div>
            </>
          ) : (
            /* Completed Screen */
            <div style={{ textAlign: "center", padding: "20px 10px", animation: "scaleIn 0.3s ease" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🪙✨</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#10b981", margin: "0 0 12px" }}>
                {lang === "vi" ? "Đã nhận phần thưởng!" : "Reward Claimed!"}
              </h3>
              <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13.5, lineHeight: 1.6, margin: "0 0 24px" }}>
                {t.coins_claimed}
              </p>
              <button
                onClick={onClose}
                style={{
                  background: "linear-gradient(135deg, #6c3de8, #8b5cf6)",
                  border: "none",
                  color: "white",
                  padding: "10px 32px",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600
                }}
              >
                {t.btn_close}
              </button>
            </div>
          )}

        </GlassCard>
      </div>
      <style>{`
        @keyframes modalIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

CbtReframingModal.propTypes = {
  entryId: PropTypes.string.isRequired,
  distortions: PropTypes.array.isRequired,
  note: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired
};
