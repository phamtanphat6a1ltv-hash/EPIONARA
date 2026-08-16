import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { streamGeminiAPI } from "../utils/geminiApi.js";
import { MINDBOT_ROLES } from "../utils/constants.js";
import { useAppContext } from "../context/AppContext.jsx";
import { useErrorHandler } from "../utils/errorHandler.js";
import { useTestResults, useStats, useJournals } from "./useStorage.js";

/**
 * Custom hook to encapsulate the Chatbot business logic.
 * @returns {{
 *   data: {
 *     messages: Array<{id: number, role: string, content: string, time: string, mode?: string}>,
 *     input: string,
 *     loading: boolean,
 *     mode: string,
 *     showSuggestions: boolean,
 *     copiedId: number | null,
 *     showConfirm: boolean,
 *     roleInfo: Object,
 *     suggestions: string[]
 *   },
 *   loading: boolean,
 *   error: import("../utils/errorHandler").AppError | null,
 *   actions: {
 *     setInput: function(string): void,
 *     setMode: function(string): void,
 *     setShowSuggestions: function(boolean): void,
 *     setShowConfirm: function(boolean): void,
 *     send: function(string=): Promise<void>,
 *     handleKey: function(Object): void,
 *     copyMsg: function(number, string): void,
 *     clearChat: function(): void,
 *     confirmClearChat: function(): void,
 *     cancelClearChat: function(): void
 *   }
 * }}
 */
export function useChatbot() {
  const { t, lang, moodContext, user } = useAppContext();
  const { handleError } = useErrorHandler();
  const ageGroup = user?.ageGroup || "adult";

  const { testResults } = useTestResults();
  const { stats } = useStats();
  const { journals } = useJournals();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("friend");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState(null);

  const inputRef = useRef(input);
  inputRef.current = input;

  const roleInfo = MINDBOT_ROLES[mode];
  const suggestions = useMemo(() => [t.chat_sugg1, t.chat_sugg2, t.chat_sugg3, t.chat_sugg4], [t]);

  // Helper: generate time-based greeting for returning users
  const getTimeGreeting = useCallback(() => {
    const hour = new Date().getHours();
    const activeNickname = localStorage.getItem("sj_mindbot_nickname");
    const botName = activeNickname && mode === "friend" ? activeNickname : "MindBot";

    let greeting = "";
    if (lang === "vi") {
      let customIntro = `Mình là ${botName} — mình có thể giúp gì cho bạn hôm nay? 💙`;
      if (mode === "friend") {
        if (ageGroup === "child") customIntro = `Chào cậu! 🌟 Hôm nay trong bụng cậu đang có đám mây đen xì 🌧️ hay mặt trời chói chang ☀️ thế? Cậu nói cho tớ nghe nha!`;
        else if (ageGroup === "teen") customIntro = `Hi, dạo này pin xã hội của bồ đang ở vạch nào rồi? 🔋 Cứ gõ vài chữ thả trôi ở đây nhé.`;
        else if (ageGroup === "young_adult") customIntro = `Chào bạn, 24h qua não bộ của bạn phải mở bao nhiêu tab rồi? 🌪️ Có suy nghĩ overthinking nào muốn 'đóng tab' không?`;
        else if (ageGroup === "elderly") customIntro = `Dạ cháu chào bác ạ! Hôm nay trong lòng bác có thấy bình yên không? Cháu ở đây để nghe bác kể chuyện ạ. 🌿`;
      }

      if (hour >= 5 && hour < 12) greeting = `Chào buổi sáng! ☀️`;
      else if (hour >= 12 && hour < 18) greeting = `Chào buổi chiều! 🌤️`;
      else if (hour >= 18 && hour < 22) greeting = `Chào buổi tối! 🌙`;
      else greeting = `Chào bạn! 🌙`;
      return `${greeting}\n\n${customIntro}`;
    } else if (lang === "ja") {
      if (hour >= 5 && hour < 12) greeting = `おはようございます！☀️`;
      else if (hour >= 12 && hour < 18) greeting = `こんにちは！🌤️`;
      else greeting = `こんばんは！🌙`;
      return `${greeting}\n\n${botName}です。今日はどのようなお手伝いができますか？ 💙`;
    } else if (lang === "ko") {
      if (hour >= 5 && hour < 12) greeting = `좋은 아침이에요! ☀️`;
      else if (hour >= 12 && hour < 18) greeting = `안녕하세요! 🌤️`;
      else greeting = `좋은 저녁이에요! 🌙`;
      return `${greeting}\n\n${botName}입니다. 오늘 어떤 도움이 필요하신가요? 💙`;
    } else if (lang === "zh") {
      if (hour >= 5 && hour < 12) greeting = `早上好！☀️`;
      else if (hour >= 12 && hour < 18) greeting = `下午好！🌤️`;
      else greeting = `晚上好！🌙`;
      return `${greeting}\n\n我是${botName}，今天有什么可以帮您的吗？ 💙`;
    } else {
      if (hour >= 5 && hour < 12) greeting = `Good morning! ☀️`;
      else if (hour >= 12 && hour < 18) greeting = `Good afternoon! 🌤️`;
      else greeting = `Good evening! 🌙`;
      return `${greeting}\n\nI'm ${botName} — how can I help you today? 💙`;
    }
  }, [lang, mode, ageGroup]);

  // Load chat history from localStorage on initialization or mode change
  useEffect(() => {
    const saved = localStorage.getItem(`sj_chat_history_${mode}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && (parsed.length > 1 || (parsed.length === 1 && parsed[0].role === "user"))) {
          setMessages(parsed);
          setShowSuggestions(false);
          return;
        }
      } catch (err) {
        console.warn("Failed to load chat history from localStorage", err);
      }
    }

    // Check if user has opened this chat mode before
    const firstVisitKey = `sj_first_chat_done_${mode}`;
    const isReturningUser = localStorage.getItem(firstVisitKey) === "true";

    let welcome;

    if (isReturningUser) {
      // Returning user: show time-based greeting only
      welcome = getTimeGreeting();
    } else {
      // First-time user: show full welcome message
      welcome = t.chat_welcome;
      const activeNickname = localStorage.getItem("sj_mindbot_nickname");
      if (mode === "friend" && activeNickname) {
        welcome = welcome.replace(/MindBot/g, activeNickname);
      }

      try {
        const context = moodContext;
        if (context && Date.now() - context.ts < 1800000) {
          if (context.source === "face") {
            if (lang === "vi") {
              welcome = `Chào bạn! Mình vừa thấy bạn có vẻ ${context.mood} ${context.emoji}. Bạn có muốn chia sẻ thêm về cảm xúc này không? 💙`;
            } else if (lang === "ja") {
              welcome = `こんにちは！表情から${context.mood} ${context.emoji}のようですね。もう少し詳しく教えていただけますか？ 💙`;
            } else if (lang === "ko") {
              welcome = `안녕하세요! 표정에서 ${context.mood} ${context.emoji} 기분이 느껴지네요. 더 이야기를 나누어 보시겠어요? 💙`;
            } else if (lang === "zh") {
              welcome = `你好！我觉得你看起来像是在 ${context.mood} ${context.emoji}。你想多聊聊关于这个情绪吗？ 💙`;
            } else {
              welcome = `Hello! I noticed you look ${context.mood} ${context.emoji}. Would you like to share more about it? 💙`;
            }
          } else if (context.source === "predict") {
            if (lang === "vi") {
              welcome = `Chào bạn! Theo dự báo hôm nay tâm trạng của bạn có thể là ${context.mood}. "${context.insight}". Bạn thấy sao về điều này? 🌿`;
            } else if (lang === "ja") {
              welcome = `こんにちは！今日の気分予測は${context.mood}のようです。「${context.insight}」。どう感じますか？ 🌿`;
            } else if (lang === "ko") {
              welcome = `안녕하세요! 오늘 감정 예측은 ${context.mood}인 것 같아요. "${context.insight}". 이에 대해 어떻게 생각하세요? 🌿`;
            } else if (lang === "zh") {
              welcome = `你好！根据预测，你今天的心情可能是 ${context.mood}。"${context.insight}"。你怎么看？ 🌿`;
            } else {
              welcome = `Hello! According to the prediction, your mood today might be ${context.mood}. "${context.insight}". How do you feel about this? 🌿`;
            }
          }
        }
      } catch (e) {
        console.error("EPIONARA Parse Error:", e);
      }

      // Mark this mode as visited
      localStorage.setItem(firstVisitKey, "true");
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages([
      {
        id: Date.now(),
        role: "assistant",
        content: welcome,
        time: timeStr,
        mode,
      },
    ]);
    setShowSuggestions(true);
  }, [mode, t.chat_welcome, moodContext, lang, getTimeGreeting]);

  // Persist messages changes to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(`sj_chat_history_${mode}`, JSON.stringify(messages));
      } catch (err) {
        console.warn("Failed to save chat history to localStorage", err);
      }
    }
  }, [messages, mode]);

  const send = useCallback(async (text) => {
    const msgText = (text || inputRef.current).trim();
    if (!msgText || loading) return;

    if (navigator.vibrate) {
      navigator.vibrate(10);
    }

    setInput("");
    setShowSuggestions(false);
    setError(null);

    const userMsg = {
      id: Date.now(),
      role: "user",
      content: msgText,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => {
      const updatedMessages = [...prev, userMsg];
      
      // Perform AI generation nested in next tick
      generateAIResponse(updatedMessages);
      return updatedMessages;
    });
  }, [loading, roleInfo, lang]);

  // Helper method for AI processing within the hook
  const generateAIResponse = async (updatedMessages) => {
    setLoading(true);
    const botId = Date.now() + 1;
    const botTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    
    // Add empty placeholder message first
    setMessages((prev) => [...prev, { id: botId, role: "assistant", content: "", time: botTime, mode }]);

    const lastUserMsg = updatedMessages.filter(m => m.role === "user").slice(-1)[0]?.content || "";

    // RAG cục bộ: Lấy ngữ cảnh nhật ký liên quan đến tin nhắn cuối
    let ragContext = "";
    try {
      const { IDB } = await import("../utils/idb.js");
      const journals = await IDB.getAll("journals");
      const { retrieveSemanticContext } = await import("../utils/ragEngine");
      ragContext = retrieveSemanticContext(lastUserMsg, journals, 2);
    } catch (ragErr) {
      console.warn("[Chatbot RAG] Lỗi trích xuất:", ragErr);
    }

    // --- BỘ NHỚ HỘI THOẠI NÂNG CAO ---
    // Cửa sổ chính: 40 tin nhắn gần nhất (đủ cho cuộc trò chuyện dài)
    const HISTORY_WINDOW = 40;
    const recentMessages = updatedMessages.slice(-HISTORY_WINDOW);
    const olderMessages = updatedMessages.slice(0, Math.max(0, updatedMessages.length - HISTORY_WINDOW));

    // Tạo bản tóm tắt cục bộ cho các tin nhắn cũ hơn cửa sổ
    let conversationSummary = "";
    if (olderMessages.length > 0) {
      const summaryParts = [];
      const userMsgs = olderMessages.filter(m => m.role === "user");
      const botMsgs = olderMessages.filter(m => m.role === "assistant");

      // Trích xuất các chủ đề chính từ tin nhắn user
      if (userMsgs.length > 0) {
        const topicSnippets = userMsgs.map(m => {
          const text = (m.content || "").trim();
          // Lấy 120 ký tự đầu tiên, cắt tại ranh giới từ
          if (text.length <= 120) return text;
          const cut = text.substring(0, 120);
          const lastSpace = cut.lastIndexOf(" ");
          return (lastSpace > 80 ? cut.substring(0, lastSpace) : cut) + "...";
        });
        summaryParts.push(
          lang === "vi"
            ? `Người dùng đã chia sẻ ${userMsgs.length} tin nhắn trước đó, bao gồm các nội dung chính:\n${topicSnippets.map((s, i) => `  ${i + 1}. "${s}"`).join("\n")}`
            : `The user shared ${userMsgs.length} earlier messages, key topics:\n${topicSnippets.map((s, i) => `  ${i + 1}. "${s}"`).join("\n")}`
        );
      }

      // Trích xuất các điểm quan trọng từ phản hồi bot
      if (botMsgs.length > 0) {
        const botSnippets = botMsgs.slice(-3).map(m => {
          const text = (m.content || "").trim();
          if (text.length <= 100) return text;
          const cut = text.substring(0, 100);
          const lastSpace = cut.lastIndexOf(" ");
          return (lastSpace > 60 ? cut.substring(0, lastSpace) : cut) + "...";
        });
        summaryParts.push(
          lang === "vi"
            ? `Bạn (MindBot) đã phản hồi ${botMsgs.length} lần. Các phản hồi gần nhất của bạn:\n${botSnippets.map((s, i) => `  - "${s}"`).join("\n")}`
            : `You (MindBot) responded ${botMsgs.length} times. Your most recent replies:\n${botSnippets.map((s, i) => `  - "${s}"`).join("\n")}`
        );
      }

      conversationSummary = lang === "vi"
        ? `\n\n[TÓM TẮT LỊCH SỬ HỘI THOẠI TRƯỚC ĐÓ - ${olderMessages.length} tin nhắn cũ hơn]:\n${summaryParts.join("\n\n")}\n(Đây là bản tóm tắt các tin nhắn cũ đã nằm ngoài cửa sổ hội thoại. Hãy nhớ và tham chiếu lại khi cần thiết để duy trì mạch trò chuyện liền mạch).`
        : `\n\n[EARLIER CONVERSATION SUMMARY - ${olderMessages.length} older messages]:\n${summaryParts.join("\n\n")}\n(This summarizes older messages outside the current window. Reference them when needed to maintain conversational continuity).`;
    }

    const history = recentMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Hướng dẫn duy trì mạch hội thoại
    const continuityInstruction = lang === "vi"
      ? `\n\n[QUY TẮC DUY TRÌ MẠCH HỘI THOẠI]:
- Luôn nhớ và tham chiếu lại những gì người dùng đã nói trước đó trong cuộc trò chuyện này. Nếu họ từng đề cập đến một chủ đề, tên người, sự kiện, cảm xúc — hãy kết nối lại khi phù hợp.
- Khi trả lời, hãy xây dựng câu trả lời dựa trên ngữ cảnh đã có, không lặp lại những gì đã nói, không hỏi lại những thông tin đã được cung cấp.
- Nếu cuộc trò chuyện đang đi theo một mạch cụ thể, hãy giữ nhịp đó và đào sâu thay vì chuyển hướng đột ngột.
- Phản hồi dài hơn, chi tiết hơn khi chủ đề phức tạp. Ngắn gọn khi chỉ cần đáp lại nhẹ nhàng.`
      : `\n\n[CONVERSATION CONTINUITY RULES]:
- Always remember and reference what the user has previously said in this conversation. If they mentioned a topic, name, event, or emotion — connect back to it when relevant.
- Build your answers on existing context, don't repeat what's been said, don't re-ask for information already provided.
- If the conversation is following a specific thread, maintain that flow and go deeper rather than abruptly changing direction.
- Give longer, more detailed responses for complex topics. Keep it brief when a light reply suffices.`;

    // Xây dựng thông tin cá nhân hóa (Personalization Context)
    const mbti = testResults?.mbti?.type;
    let sleepVal = null;
    let activityVal = null;
    let hydrationVal = null;
    
    const todayJournal = stats?.todayJournal;
    if (todayJournal) {
      if (typeof todayJournal.sleep === "number") sleepVal = todayJournal.sleep;
      if (typeof todayJournal.activity === "number") activityVal = todayJournal.activity;
      if (typeof todayJournal.hydration === "number") hydrationVal = todayJournal.hydration;
    }
    
    let moodTrend = "";
    if (journals && journals.length > 0) {
      const sorted = [...journals]
        .filter(j => j.date && typeof j.score === "number")
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      
      if (sorted.length >= 3) {
        const last3Scores = sorted.slice(0, 3).map(j => j.score);
        const avgScore = last3Scores.reduce((s, x) => s + x, 0) / 3;
        if (avgScore <= 3) {
          moodTrend = lang === "vi" 
            ? "Tâm trạng 3 ngày gần nhất có xu hướng đi xuống rõ rệt (trung bình dưới 3/8 điểm)"
            : "Mood trend for the past 3 days is significantly down (average score below 3/8)";
        } else if (avgScore >= 6) {
          moodTrend = lang === "vi"
            ? "Tâm trạng 3 ngày gần nhất rất tốt và ổn định (trung bình trên 6/8 điểm)"
            : "Mood trend for the past 3 days is very stable and positive (average score above 6/8)";
        }
      }
    }

    const contextParts = [];
    if (ageGroup) {
      contextParts.push(lang === "vi" ? `- Thuộc nhóm tuổi sinh học: ${ageGroup} (Hãy chọn từ vựng, mức độ phức tạp và xưng hô phù hợp với độ tuổi này)` : `- Age group: ${ageGroup}`);
    }
    if (mbti) {
      contextParts.push(lang === "vi" ? `- Tính cách MBTI: ${mbti}` : `- MBTI Type: ${mbti}`);
    }
    if (sleepVal !== null) {
      contextParts.push(lang === "vi" ? `- Giấc ngủ hôm nay: ${sleepVal} giờ` : `- Sleep today: ${sleepVal} hours`);
    }
    if (activityVal !== null) {
      contextParts.push(lang === "vi" ? `- Hoạt động thể chất: ${activityVal} phút` : `- Exercise today: ${activityVal} minutes`);
    }
    if (hydrationVal !== null) {
      contextParts.push(lang === "vi" ? `- Lượng nước uống: ${hydrationVal} cốc` : `- Hydration today: ${hydrationVal} cups`);
    }
    if (moodTrend) {
      contextParts.push(`- ${moodTrend}`);
    }
    
    let personalizationContext = "";
    if (contextParts.length > 0) {
      personalizationContext = `\n\n[USER PERSONALIZATION PROFILE]:\n${contextParts.join("\n")}\n(Hãy khéo léo điều chỉnh tông giọng thấu cảm, lời khuyên thói quen sức khỏe hoặc phong cách khích lệ dựa trên hồ sơ cá nhân này của người dùng. Nếu họ thiếu ngủ, hãy khuyên họ nghỉ ngơi nhẹ nhàng. Nếu MBTI phù hợp, hãy trò chuyện theo hướng thấu hiểu tính cách đó).`;
    }

    try {
      let systemInstruction = roleInfo.system(lang);
      if (ragContext) {
        systemInstruction += `\n\n[TRÍ NHỚ AI - THÔNG TIN TỪ NHẬT KÝ QUÁ KHỨ CỦA NGƯỜI DÙNG LIÊN QUAN ĐẾN TIN NHẮN NÀY]:\n${ragContext}\n(Hãy đối chiếu và khéo léo kết hợp thông tin quá khứ này để tỏ ra bạn nhớ và quan tâm đến những gì họ từng viết trước đây).`;
      }
      if (personalizationContext) {
        systemInstruction += personalizationContext;
      }
      if (conversationSummary) {
        systemInstruction += conversationSummary;
      }
      systemInstruction += continuityInstruction;

      const gen = streamGeminiAPI({
        system: systemInstruction,
        messages: history,
        max_tokens: 8192,
      });

      let full = "";
      for await (const chunk of gen) {
        full += chunk;
        setMessages((prev) =>
          prev.map((m) => (m.id === botId ? { ...m, content: full } : m))
        );
      }
      if (!full) throw new Error("empty_response");
    } catch (err) {
      const appErr = handleError(err, "chatbot");
      setError(appErr);
      setMessages((prev) =>
        prev.map((m) => (m.id === botId ? { ...m, content: appErr.message } : m))
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKey = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }, [send]);

  const copyMsg = useCallback((id, text) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  }, []);

  const clearChat = useCallback(() => {
    setShowConfirm(true);
  }, []);

  const confirmClearChat = useCallback(() => {
    localStorage.removeItem(`sj_chat_history_${mode}`);
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    let welcome = t.chat_welcome;
    const activeNickname = localStorage.getItem("sj_mindbot_nickname");
    if (mode === "friend" && activeNickname) {
      welcome = welcome.replace(/MindBot/g, activeNickname);
    }
    setMessages([
      {
        id: Date.now(),
        role: "assistant",
        content: welcome,
        time: timeStr,
        mode,
      },
    ]);
    setShowSuggestions(true);
    setShowConfirm(false);
  }, [t.chat_welcome, mode]);

  const cancelClearChat = useCallback(() => {
    setShowConfirm(false);
  }, []);

  return {
    data: {
      messages,
      input,
      loading,
      mode,
      showSuggestions,
      copiedId,
      showConfirm,
      roleInfo,
      suggestions,
    },
    loading,
    error,
    actions: {
      setInput,
      setMode,
      setShowSuggestions,
      setShowConfirm,
      send,
      handleKey,
      copyMsg,
      clearChat,
      confirmClearChat,
      cancelClearChat,
    },
  };
}
