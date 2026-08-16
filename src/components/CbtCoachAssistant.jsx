import { useState, useEffect, useRef, useCallback } from "react";
import { streamGeminiAPI, callGeminiAPI } from "../utils/geminiApi.js";
import { useAppContext } from "../context/AppContext.jsx";
import { nativeToast } from "../utils/nativeToast.js";
import { useErrorHandler } from "../utils/errorHandler.js";
import { COGNITIVE_DISTORTIONS_LIST } from "../utils/constants.js";

const COACH_TRANSLATIONS = {
  vi: {
    title: "Trợ lý Trị liệu CBT AI",
    subtitle: "Đồng hành tái cấu trúc nhận thức",
    placeholder: "Nhập tin nhắn...",
    btnSend: "Gửi",
    btnAutoAnalyze: "✨ AI Phân Tích & Điền Nhanh",
    btnApply: "Áp dụng vào Nhật ký",
    appliedSuccess: "Đã điền thông tin gợi ý vào Nhật ký CBT!",
    errorEmptyInputs: "Vui lòng nhập Tình huống (Bước 1) và Ý nghĩ tiêu cực (Bước 3) trước để AI có thể phân tích.",
    warningGenerating: "Đang xử lý phân tích...",
    suggestedDistortions: "Lỗi tư duy gợi ý:",
    evidenceForTitle: "Bằng chứng ủng hộ:",
    evidenceAgainstTitle: "Bằng chứng phản bác:",
    balancedThoughtTitle: "Suy nghĩ cân bằng:",
    chatAnalyzeRequest: "Hãy phân tích tình huống và ý nghĩ tiêu cực này giúp tôi.",
    analysisComplete: "Tôi đã hoàn thành phân tích. Bạn hãy xem các gợi ý ở dưới nhé!",
    emptyChatWelcome: "Chào bạn! Mình là CBT Coach AI. Hãy mô tả tình huống hoặc ý nghĩ làm bạn bận tâm ở cột bên trái, rồi nhấn **✨ AI Phân Tích & Điền Nhanh** để mình phân tích tự động. Hoặc bạn có thể chat trực tiếp với mình tại đây nhé! 🌿"
  },
  en: {
    title: "AI CBT Coach",
    subtitle: "Cognitive Restructuring Companion",
    placeholder: "Type your message...",
    btnSend: "Send",
    btnAutoAnalyze: "✨ AI Suggest & Autofill",
    btnApply: "Apply to Record",
    appliedSuccess: "Applied suggestions to CBT thought record!",
    errorEmptyInputs: "Please fill in the Situation (Step 1) and Automatic Thought (Step 3) first for AI analysis.",
    warningGenerating: "Analyzing thoughts...",
    suggestedDistortions: "Suggested distortions:",
    evidenceForTitle: "Evidence Supporting:",
    evidenceAgainstTitle: "Evidence Against:",
    balancedThoughtTitle: "Balanced Thought:",
    chatAnalyzeRequest: "Please analyze this situation and automatic negative thought.",
    analysisComplete: "Analysis complete. Review suggestions below!",
    emptyChatWelcome: "Hello! I am your AI CBT Coach. Describe the situation or thoughts bothering you on the left, then click **✨ AI Suggest & Autofill** to auto-analyze. Or you can chat with me directly right here! 🌿"
  },
  ja: {
    title: "AI CBTコーチ",
    subtitle: "認知再構成のパートナー",
    placeholder: "メッセージを入力...",
    btnSend: "送信",
    btnAutoAnalyze: "✨ AI分析＆自動入力",
    btnApply: "記録に適用",
    appliedSuccess: "提案された内容をCBT記録に適用しました！",
    errorEmptyInputs: "AI分析を行う前に、状況（ステップ1）とマイナス思考（ステップ3）を入力してください。",
    warningGenerating: "考えを分析中...",
    suggestedDistortions: "提案された認知の歪み：",
    evidenceForTitle: "裏付ける根拠：",
    evidenceAgainstTitle: "矛盾する根拠：",
    balancedThoughtTitle: "適応的思考：",
    chatAnalyzeRequest: "この状況と自動思考を分析してください。",
    analysisComplete: "分析が完了しました。以下の提案を確認してください！",
    emptyChatWelcome: "こんにちは！私はあなたのAI CBTコーチです。左側に状況や気になっている考えを入力し、**✨ AI分析＆自動入力**をクリックして自動分析を行うか、ここで直接チャットしてください！🌿"
  },
  ko: {
    title: "AI CBT 코치",
    subtitle: "인지 재구성 동반자",
    placeholder: "메시지 입력...",
    btnSend: "전송",
    btnAutoAnalyze: "✨ AI 분석 및 자동 입력",
    btnApply: "기록에 적용",
    appliedSuccess: "제안된 내용을 CBT 기록에 적용했습니다!",
    errorEmptyInputs: "AI 분석을 진행하기 전에 상황(1단계)과 부정적인 생각(3단계)을 먼저 입력해 주세요.",
    warningGenerating: "생각 분석 중...",
    suggestedDistortions: "제안된 인지적 왜곡:",
    evidenceForTitle: "지지하는 증거:",
    evidenceAgainstTitle: "반대되는 증거:",
    balancedThoughtTitle: "대안적 사고:",
    chatAnalyzeRequest: "이 상황과 부정적인 생각을 분석해 주세요.",
    analysisComplete: "분석이 완료되었습니다. 아래 제안을 검토해 보세요!",
    emptyChatWelcome: "안녕하세요! 저는 AI CBT 코치입니다. 왼쪽에 상황이나 고민되는 생각을 입력한 뒤 **✨ AI 분석 및 자동 입력**을 눌러 자동 분석을 받거나, 여기서 저와 직접 대화해 보세요! 🌿"
  },
  zh: {
    title: "AI CBT 导师",
    subtitle: "认知重构伴侣",
    placeholder: "输入消息...",
    btnSend: "发送",
    btnAutoAnalyze: "✨ AI 分析与快速填入",
    btnApply: "应用到日记",
    appliedSuccess: "已将建议信息填入 CBT 思维日记！",
    errorEmptyInputs: "请先在左侧输入实际情境（步骤1）和自动消极思维（步骤3），以便 AI 进行分析。",
    warningGenerating: "正在分析思维...",
    suggestedDistortions: "建议的认知偏差：",
    evidenceForTitle: "支持证据：",
    evidenceAgainstTitle: "驳斥证据：",
    balancedThoughtTitle: "平衡思维：",
    chatAnalyzeRequest: "请分析这个情境和自动消极思维。",
    analysisComplete: "分析已完成。请查看下方的建议！",
    emptyChatWelcome: "你好！我是你的 AI CBT 导师。请在左侧输入让你困扰的情境或想法，然后点击 **✨ AI 分析与快速填入** 进行自动 analysis。或者你也可以直接在这里与我聊天！🌿"
  },
  fr: {
    title: "Coach CBT AI",
    subtitle: "Restructuration Cognitive",
    placeholder: "Écrivez un message...",
    btnSend: "Envoyer",
    btnAutoAnalyze: "✨ AI Suggérer & Remplir",
    btnApply: "Appliquer",
    appliedSuccess: "Suggestions appliquées au journal CBT !",
    errorEmptyInputs: "Veuillez remplir la situation (étape 1) et la pensée automatique (étape 3) pour l'analyse AI.",
    warningGenerating: "Analyse en cours...",
    suggestedDistortions: "Distorsions cognitives suggérées :",
    evidenceForTitle: "Faits à l'appui :",
    evidenceAgainstTitle: "Faits opposés :",
    balancedThoughtTitle: "Pensée équilibrée :",
    chatAnalyzeRequest: "Veuillez analyser cette situation et cette pensée automatique négative.",
    analysisComplete: "Analyse terminée. Consultez les suggestions ci-dessous !",
    emptyChatWelcome: "Bonjour ! Je suis votre coach CBT AI. Décrivez la situation ou les pensées qui vous tracassent à gauche, puis cliquez sur **✨ AI Suggérer & Remplir** pour l'analyse automatique. Ou discutez directement avec moi ici ! 🌿"
  }
};

const LANG_NAMES = {
  vi: "Vietnamese",
  en: "English",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
  fr: "French"
};

/**
 * CbtCoachAssistant Component
 * A luxurious glassmorphic sidebar companion chatbot for Cognitive Behavioral Therapy.
 */
export default function CbtCoachAssistant({
  situation,
  automaticThought,
  setSelectedDistortions,
  setEvidenceFor,
  setEvidenceAgainst,
  setBalancedThought,
  step,
  setStep,
  onClose
}) {
  const { lang } = useAppContext();
  const { handleError } = useErrorHandler();
  const activeLang = ["vi", "en", "ja", "ko", "zh", "fr"].includes(lang) ? lang : (lang.startsWith("zh") ? "zh" : (lang.startsWith("fr") ? "fr" : "en"));

  // Chat message state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const chatBodyRef = useRef(null);

  // Translation helpers
  const labels = COACH_TRANSLATIONS[activeLang] || COACH_TRANSLATIONS.en;

  // Auto-scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Welcome message on mount
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: labels.emptyChatWelcome,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
  }, [lang]);

  // Chat with CBT Coach API streaming
  const handleSend = useCallback(async (textToSend) => {
    const msgText = (textToSend || input).trim();
    if (!msgText || loading) return;

    setInput("");
    setLoading(true);

    const userMsg = {
      id: Date.now().toString(),
      role: "user",
      content: msgText,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    const botId = (Date.now() + 1).toString();
    const botTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Set placeholder assistant message
    setMessages((prev) => [...prev, { id: botId, role: "assistant", content: "", time: botTime }]);

    // Gather short conversation history
    const history = newMessages.slice(-8).map((m) => ({
      role: m.role,
      content: m.content
    }));

    try {
      const systemPrompt = `You are an expert Cognitive Behavioral Therapy (CBT) Clinician and Coach.
Your mission is to help the user identify, analyze, and restructure their Automatic Negative Thoughts (ANTs).
Adhere to the following clinical principles:
1. Warmth and Empathy: Express deep understanding and validation of the user's emotional distress.
2. Socratic Dialogue: Guide the user step-by-step with open-ended, probing questions to analyze their thoughts. Do not just hand them the answers.
3. Cognitive Restructuring: Help them separate feelings from objective reality, identify thinking biases, examine the evidence, and construct balanced, realistic alternative thoughts.
4. Psychoeducation: Explain the evolutionary purpose of cognitive distortions (e.g., how catastrophizing is the brain's overactive defense mechanism trying to keep us safe) to reduce shame.

Current user context:
- Situation: "${situation || "(Not provided)"}"
- Automatic Negative Thought: "${automaticThought || "(Not provided)"}"
Keep your responses warm, focused, and deeply therapeutic. Response must be in ${LANG_NAMES[activeLang] || "English"}.`;

      const gen = streamGeminiAPI({
        system: systemPrompt,
        messages: history,
        max_tokens: 8192
      });

      let fullResponse = "";
      for await (const chunk of gen) {
        fullResponse += chunk;
        setMessages((prev) =>
          prev.map((m) => (m.id === botId ? { ...m, content: fullResponse } : m))
        );
      }
    } catch (err) {
      const appErr = handleError(err, "cbt-coach");
      setMessages((prev) =>
        prev.map((m) => (m.id === botId ? { ...m, content: appErr.message || "Error generating response" } : m))
      );
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, situation, automaticThought, activeLang, handleError]);

  // AI Suggest and Autofill Trigger
  const handleAutoAnalyze = async () => {
    if (!situation.trim() || !automaticThought.trim()) {
      nativeToast(labels.errorEmptyInputs, "warning");
      return;
    }

    setSuggestLoading(true);

    const userMsg = {
      id: Date.now().toString(),
      role: "user",
      content: labels.chatAnalyzeRequest,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);

    const botId = (Date.now() + 1).toString();
    const botTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [...prev, { id: botId, role: "assistant", content: labels.warningGenerating, time: botTime }]);

    try {
      const systemPrompt = `You are a highly skilled Cognitive Behavioral Therapy (CBT) specialist.
Perform a clinical, structured analysis of this cognitive situation and automatic negative thought:
- Situation: "${situation}"
- Automatic Thought: "${automaticThought}"

Instructions:
1. Identify the most applicable cognitive distortions from this list of IDs:
   - "all_or_nothing" (All-or-Nothing thinking)
   - "overgeneralization" (Overgeneralization)
   - "mental_filter" (Mental Filter)
   - "disqualifying_positive" (Disqualifying the positive)
   - "jumping_conclusions" (Jumping to conclusions)
   - "catastrophizing" (Catastrophizing)
   - "emotional_reasoning" (Emotional reasoning)
   - "should_statements" (Should/Must statements)
   - "labeling" (Labeling)
   - "personalization" (Personalization)

2. Formulate:
   - "evidence_for": List ONLY strictly verifiable, objective facts supporting the automatic thought. Remind yourself that feelings, assumptions, or personal interpretations are NOT objective facts. If no facts exist, explicitly state so.
   - "evidence_against": Provide concrete, verifiable facts and alternative interpretations that contradict or soften the automatic thought.
   - "balanced_thought": Synthesize both sides of the evidence into a balanced, compassionate, and realistic alternative thought. Do NOT use toxic positivity or unrealistic optimism; focus on a grounded, practical viewpoint.
   - "coach_message": Provide a warm, clinically insightful message. Explain the psychology behind the identified distortions (e.g., how the brain's threat-detection system defaults to these distortions as survival mechanism) and guide them on how to practice this restructuring.

You MUST reply ONLY with this exact JSON format (in the user's language: ${LANG_NAMES[activeLang] || "English"} for all text fields):
{
  "suggested_distortions": ["distortion_id1", "distortion_id2"],
  "evidence_for": "Facts supporting the thought...",
  "evidence_against": "Facts opposing the thought...",
  "balanced_thought": "A balanced, realistic alternative thought...",
  "coach_message": "A supportive, clinically rich explanation from the CBT Coach..."
}`;

      const responseText = await callGeminiAPI({
        system: systemPrompt,
        messages: [{ role: "user", content: "Analyze situation and thoughts in JSON" }],
        max_tokens: 8192
      });

      let cleanText = responseText.trim();
      if (cleanText.includes("```")) {
        cleanText = cleanText.replace(/```json|```/g, "").trim();
      }

      const parsed = JSON.parse(cleanText);

      // Save suggestion details so the user can inspect and apply them

      setMessages((prev) =>
        prev.map((m) =>
          m.id === botId
            ? {
                ...m,
                content: parsed.coach_message || labels.analysisComplete,
                isSuggestionResult: true,
                suggestionData: parsed
              }
            : m
        )
      );
    } catch (err) {
      const appErr = handleError(err, "cbt-coach");
      setMessages((prev) =>
        prev.map((m) => (m.id === botId ? { ...m, content: appErr.message || "Error analyzing thoughts" } : m))
      );
    } finally {
      setSuggestLoading(false);
    }
  };

  // Apply Suggestion to the Form
  const handleApplySuggestion = (data) => {
    if (!data) return;

    if (data.suggested_distortions && Array.isArray(data.suggested_distortions)) {
      setSelectedDistortions(data.suggested_distortions);
    }
    if (data.evidence_for) {
      setEvidenceFor(data.evidence_for);
    }
    if (data.evidence_against) {
      setEvidenceAgainst(data.evidence_against);
    }
    if (data.balanced_thought) {
      setBalancedThought(data.balanced_thought);
    }

    nativeToast(labels.appliedSuccess, "success");

    // Automatically navigate the wizard forward to show the applied fields
    if (step < 4) {
      setStep(4);
    } else if (step === 4) {
      setStep(5);
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      background: "rgba(20, 15, 38, 0.45)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      borderRadius: 24,
      boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
      backdropFilter: "blur(25px)",
      overflow: "hidden",
      position: "relative"
    }}>
      {/* Sidebar Header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "rgba(255, 255, 255, 0.02)"
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#c084fc", display: "flex", alignItems: "center", gap: 8 }}>
            🧘 {labels.title}
          </h3>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255, 255, 255, 0.5)" }}>
            {labels.subtitle}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "none",
              color: "rgba(255, 255, 255, 0.6)",
              borderRadius: "50%",
              width: 32,
              height: 32,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              transition: "all 0.2s"
            }}
            onMouseEnter={e => e.target.style.background = "rgba(255, 255, 255, 0.1)"}
            onMouseLeave={e => e.target.style.background = "rgba(255, 255, 255, 0.05)"}
          >
            ✕
          </button>
        )}
      </div>

      {/* Chat Messages Body */}
      <div
        ref={chatBodyRef}
        style={{
          flex: 1,
          padding: "20px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          scrollBehavior: "smooth"
        }}
      >
        {messages.map((m) => {
          const isAssistant = m.role === "assistant";
          return (
            <div
              key={m.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isAssistant ? "flex-start" : "flex-end",
                maxWidth: "85%",
                alignSelf: isAssistant ? "flex-start" : "flex-end",
                animation: "fadeInMsg 0.25s ease-out"
              }}
            >
              <div style={{
                background: isAssistant 
                  ? "rgba(255, 255, 255, 0.05)" 
                  : "linear-gradient(135deg, #6c3de8, #4f46e5)",
                border: isAssistant ? "1px solid rgba(255, 255, 255, 0.08)" : "none",
                padding: "12px 16px",
                borderRadius: isAssistant ? "18px 18px 18px 4px" : "18px 18px 4px 18px",
                color: "white",
                fontSize: 14,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap"
              }}>
                {m.content}

                {/* If the message contains parsed Suggestion Results, render them beautifully */}
                {m.isSuggestionResult && m.suggestionData && (
                  <div style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                    fontSize: 13,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10
                  }}>
                    {m.suggestionData.suggested_distortions?.length > 0 && (
                      <div>
                        <strong>{labels.suggestedDistortions}</strong>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                          {m.suggestionData.suggested_distortions.map((d) => {
                            const list = COGNITIVE_DISTORTIONS_LIST[activeLang] || COGNITIVE_DISTORTIONS_LIST.en;
                            const found = list.find(item => item.id === d);
                            const displayName = found ? `${found.emoji} ${found.label}` : d.replace(/_/g, " ");
                            return (
                              <span key={d} style={{
                                background: "rgba(192, 132, 252, 0.15)",
                                border: "1px solid rgba(192, 132, 252, 0.3)",
                                padding: "2px 8px",
                                borderRadius: 8,
                                fontSize: 11,
                                color: "#d8b4fe"
                              }}>
                                {displayName}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {m.suggestionData.evidence_for && (
                      <div>
                        <strong style={{ color: "#fbbf24" }}>{labels.evidenceForTitle}</strong>
                        <div style={{ color: "rgba(255, 255, 255, 0.85)", marginTop: 2 }}>{m.suggestionData.evidence_for}</div>
                      </div>
                    )}
                    {m.suggestionData.evidence_against && (
                      <div>
                        <strong style={{ color: "#3b82f6" }}>{labels.evidenceAgainstTitle}</strong>
                        <div style={{ color: "rgba(255, 255, 255, 0.85)", marginTop: 2 }}>{m.suggestionData.evidence_against}</div>
                      </div>
                    )}
                    {m.suggestionData.balanced_thought && (
                      <div>
                        <strong style={{ color: "#10b981" }}>{labels.balancedThoughtTitle}</strong>
                        <div style={{ color: "rgba(255, 255, 255, 0.85)", marginTop: 2 }}>{m.suggestionData.balanced_thought}</div>
                      </div>
                    )}

                    <button
                      onClick={() => handleApplySuggestion(m.suggestionData)}
                      style={{
                        marginTop: 6,
                        padding: "8px 16px",
                        background: "linear-gradient(135deg, #10b981, #059669)",
                        border: "none",
                        color: "white",
                        borderRadius: 10,
                        fontWeight: "bold",
                        cursor: "pointer",
                        fontSize: 12.5,
                        transition: "all 0.2s"
                      }}
                    >
                      ✓ {labels.btnApply}
                    </button>
                  </div>
                )}
              </div>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
                {m.time}
              </span>
            </div>
          );
        })}

        {loading && (
          <div style={{ display: "flex", gap: 6, alignSelf: "flex-start", padding: "12px 16px", background: "rgba(255, 255, 255, 0.03)", borderRadius: "18px 18px 18px 4px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ width: 8, height: 8, background: "rgba(255,255,255,0.5)", borderRadius: "50%", display: "inline-block", animation: "bounce 1.4s infinite ease-in-out" }}></span>
            <span style={{ width: 8, height: 8, background: "rgba(255,255,255,0.5)", borderRadius: "50%", display: "inline-block", animation: "bounce 1.4s infinite ease-in-out 0.2s" }}></span>
            <span style={{ width: 8, height: 8, background: "rgba(255,255,255,0.5)", borderRadius: "50%", display: "inline-block", animation: "bounce 1.4s infinite ease-in-out 0.4s" }}></span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Action Trigger for AI Suggestions */}
      {situation.trim() && automaticThought.trim() && (
        <div style={{
          padding: "10px 20px",
          background: "rgba(108, 61, 232, 0.1)",
          borderTop: "1px solid rgba(108, 61, 232, 0.2)",
          display: "flex",
          justifyContent: "center"
        }}>
          <button
            onClick={handleAutoAnalyze}
            disabled={suggestLoading}
            style={{
              width: "100%",
              padding: "10px 16px",
              background: suggestLoading ? "rgba(255, 255, 255, 0.1)" : "linear-gradient(135deg, #7c3aed, #2563eb)",
              color: "white",
              border: "none",
              borderRadius: 12,
              fontWeight: 800,
              fontSize: 13,
              cursor: suggestLoading ? "default" : "pointer",
              boxShadow: "0 4px 12px rgba(124, 58, 237, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.2s"
            }}
          >
            {suggestLoading ? (
              <span className="spinner" style={{
                width: 14,
                height: 14,
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "white",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite"
              }}></span>
            ) : "✨"} {labels.btnAutoAnalyze}
          </button>
        </div>
      )}

      {/* Chat Input Bar */}
      <div style={{
        padding: "16px 20px",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        background: "rgba(255, 255, 255, 0.01)"
      }}>
        <div style={{
          display: "flex",
          gap: 10,
          background: "rgba(0, 0, 0, 0.2)",
          borderRadius: 14,
          padding: 6,
          border: "1px solid rgba(255, 255, 255, 0.06)"
        }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={labels.placeholder}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              color: "white",
              fontSize: 14,
              paddingLeft: 10,
              outline: "none"
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            style={{
              padding: "8px 16px",
              background: input.trim() && !loading ? "linear-gradient(135deg, #c084fc, #818cf8)" : "rgba(255, 255, 255, 0.05)",
              color: input.trim() && !loading ? "white" : "rgba(255, 255, 255, 0.4)",
              border: "none",
              borderRadius: 10,
              fontWeight: 700,
              cursor: input.trim() && !loading ? "pointer" : "default",
              transition: "all 0.2s"
            }}
          >
            {labels.btnSend}
          </button>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        @keyframes fadeInMsg {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
