import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { callGeminiAPI } from "../utils/geminiApi.js";
import { useAIHistory, useStats, useJournals } from "./useStorage.js";
import { useToast } from "./useToast.js";
import { useAppContext } from "../context/AppContext.jsx";
import { useErrorHandler } from "../utils/errorHandler.js";

/**
 * Custom hook managing the AI Emotion Analysis page states and functions.
 * @returns {{
 *   data: {
 *     input: string,
 *     loading: boolean,
 *     result: import("../utils/types").AIAnalysis["result"] | null,
 *     history: Array<{input: string, result: Object, time: string}>,
 *     analysisMode: 'friend' | 'science' | 'coach',
 *     showBreathing: boolean,
 *     typedAnalysis: string,
 *     presets: Array<{label: string, val: string}>
 *   },
 *   loading: boolean,
 *   error: import("../utils/errorHandler").AppError | null,
 *   actions: {
 *     setInput: function(string): void,
 *     setAnalysisMode: function('friend' | 'science' | 'coach'): void,
 *     setShowBreathing: function(boolean): void,
 *     analyze: function(): Promise<void>,
 *     copyResult: function(): void,
 *     clearInput: function(): void
 *   }
 * }}
 */
/**
 * Calculates the Pearson correlation coefficient between two arrays of numbers.
 * @param {number[]} x
 * @param {number[]} y
 * @returns {number|null}
 */
export function calculatePearsonCorrelation(x, y) {
  const n = x.length;
  if (n < 2) return null;

  let sumX = 0, sumY = 0, sumXY = 0;
  let sumX2 = 0, sumY2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
    sumY2 += y[i] * y[i];
  }

  const num = (n * sumXY) - (sumX * sumY);
  const den = Math.sqrt(((n * sumX2) - (sumX * sumX)) * ((n * sumY2) - (sumY * sumY)));

  if (den === 0) return 0;
  return num / den;
}

const LANG_NAMES = {
  vi: "Vietnamese",
  en: "English",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
  fr: "French"
};

const FALLBACK_TRANSLATIONS = {
  vi: {
    analysis: "Tôi đang lắng nghe bạn. Mỗi cảm xúc đều xứng đáng được nhìn nhận.",
    advice: "Hãy dành một chút thời gian để ở với cảm xúc của mình, không phán xét.",
    healing: "Bạn được phép cảm nhận đúng như những gì bạn đang cảm nhận.",
    tags: ["cảm xúc", "tâm trạng"]
  },
  en: {
    analysis: "I am listening to you. Every emotion deserves to be acknowledged.",
    advice: "Spend some time with your feelings without judgment.",
    healing: "You are allowed to feel exactly what you are feeling.",
    tags: ["feelings", "mood"]
  },
  ja: {
    analysis: "私はあなたに耳を傾けています。すべての感情は認められる価値があります。",
    advice: "判断せずに自分の感情と向き合う時間を取ってみてください。",
    healing: "あなたが今感じている通りに感じることは完全に許されています。",
    tags: ["感情", "気分"]
  },
  ko: {
    analysis: "당신의 이야기에 귀 기울이고 있습니다. 모든 감정은 존중받을 가치가 있습니다.",
    advice: "판단하지 말고 잠시 당신의 감정과 함께 머물러 보세요.",
    healing: "당신이 느끼는 그대로 느끼는 것은 지극히 자연스러운 일입니다.",
    tags: ["감정", "기분"]
  },
  zh: {
    analysis: "我正在倾听您的心声。每一种情绪都值得被接纳和看见。",
    advice: "花点时间与自己的感受待在一起，不要对自己进行评判。",
    healing: "允许自己去感受你此刻所感受的一切。",
    tags: ["情感", "心情"]
  },
  fr: {
    analysis: "Je suis à votre écoute. Chaque émotion mérite d'être reconnue.",
    advice: "Prenez du temps pour accueillir vos sentiments sans jugement.",
    healing: "Vous avez le droit de ressentir exactement ce que vous ressentez.",
    tags: ["émotions", "humeur"]
  }
};

export function useAIAnalysis() {
  const { t, lang } = useAppContext();
  const { addEntry, aiHistory } = useAIHistory();
  const { journals } = useJournals();
  const { stats } = useStats();
  const { success } = useToast();
  const { handleError } = useErrorHandler();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [analysisMode, setAnalysisMode] = useState("friend");
  const [showBreathing, setShowBreathing] = useState(false);
  const [typedAnalysis, setTypedAnalysis] = useState("");
  const [error, setError] = useState(null);

  const typeInterval = useRef(null);

  const activeLang = useMemo(() => {
    if (!lang) return "vi";
    if (["vi", "en", "ja", "ko", "zh", "fr"].includes(lang)) return lang;
    if (lang.startsWith("zh")) return "zh";
    if (lang.startsWith("fr")) return "fr";
    return "en";
  }, [lang]);

  const MOOD_PRESETS = useMemo(
    () => [
      {
        label: t.preset_overwhelmed_label || "Tôi thấy quá tải 😫",
        val: t.preset_overwhelmed_val || "Tôi đang cảm thấy cực kỳ áp lực và quá tải với công việc/cuộc sống hiện tại."
      },
      {
        label: t.preset_motivation_label || "Cần động lực 🚀",
        val: t.preset_motivation_val || "Tôi đang cảm thấy mất phương hướng và cần một chút động lực để bắt đầu."
      },
      {
        label: t.preset_wonderful_label || "Một ngày tuyệt vời ✨",
        val: t.preset_wonderful_val || "Hôm nay là một ngày thật sự ý nghĩa, tôi muốn lưu giữ cảm xúc tích cực này."
      },
      {
        label: t.preset_lonely_label || "Thấy cô đơn 💙",
        val: t.preset_lonely_val || "Tôi đang cảm thấy hơi trống trải và cần một người lắng nghe."
      },
    ],
    [t]
  );

  const typeEffect = useCallback((text) => {
    if (typeInterval.current) clearInterval(typeInterval.current);
    setTypedAnalysis("");
    let i = 0;
    typeInterval.current = setInterval(() => {
      setTypedAnalysis(text.slice(0, i));
      i++;
      if (i > text.length) clearInterval(typeInterval.current);
    }, 14);
  }, []);

  useEffect(() => {
    return () => {
      if (typeInterval.current) clearInterval(typeInterval.current);
    };
  }, []);

  // Sync historical reports from local storage on mount
  useEffect(() => {
    if (aiHistory && aiHistory.length > 0) {
      setHistory(
        aiHistory.slice(0, 5).map((h) => ({
          input: h.input,
          result: h.result,
          time: new Date(h.ts || Date.now()).toLocaleTimeString(),
        }))
      );
    }
  }, [aiHistory]);

  const analyze = useCallback(async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setResult(null);
    setShowBreathing(false);
    setTypedAnalysis("");
    setError(null);

    try {
      const modePrompt = {
        friend: "Analyze as a close friend, using warm, intimate, and friendly language.",
        science: "Analyze from the perspective of psychological and behavioral science, using professional yet easy-to-understand language.",
        coach: "Analyze as a Life Coach, focusing on solutions, actionable steps, and positive growth.",
      }[analysisMode];

      let userContextStr = "";

      // RAG cục bộ: Truy vấn ngữ cảnh nhật ký cũ liên quan
      if (journals && journals.length > 0) {
        try {
          const { retrieveSemanticContext } = await import("../utils/ragEngine");
          const ragContext = retrieveSemanticContext(input, journals, 2);
          if (ragContext) {
            userContextStr += `\n\n[TRÍ NHỚ AI - CÁC DÒNG NHẬT KÝ CŨ CỦA NGƯỜI DÙNG LIÊN QUAN ĐẾN CHỦ ĐỀ NÀY]:\n${ragContext}\n(Hãy đối chiếu và tham khảo thông tin quá khứ này để đưa ra phân tích có tính liên kết và chứng minh bạn thấu hiểu hành trình của họ).`;
          }
        } catch (ragErr) {
          console.warn("[RAG] Lỗi trích xuất ngữ cảnh:", ragErr);
        }
      }

      const todayJournal = stats?.todayJournal;
      if (todayJournal) {
        const factors = [];
        if (todayJournal.sleep !== undefined && todayJournal.sleep !== null) {
          factors.push(`sleep: ${todayJournal.sleep} hours`);
        }
        if (todayJournal.activity !== undefined && todayJournal.activity !== null) {
          factors.push(`exercise/activity: ${todayJournal.activity} minutes`);
        }
        if (todayJournal.hydration !== undefined && todayJournal.hydration !== null) {
          factors.push(`hydration: ${todayJournal.hydration} glasses/cups of water`);
        }
        if (factors.length > 0) {
          userContextStr = `\nContext on user's lifestyle today: ${factors.join(", ")}. Use this context to analyze correlations and offer customized advice.`;
        }
      }

      // Calculate Pearson correlation coefficients
      if (journals && journals.length > 0) {
        const validSleepX = [];
        const validActivityX = [];
        const validHydrationX = [];
        const sleepY = [];
        const activityY = [];
        const hydrationY = [];

        journals.forEach(entry => {
          const score = entry.score;
          if (typeof score === 'number') {
            if (typeof entry.sleep === 'number') {
              validSleepX.push(entry.sleep);
              sleepY.push(score);
            }
            if (typeof entry.activity === 'number') {
              validActivityX.push(entry.activity);
              activityY.push(score);
            }
            if (typeof entry.hydration === 'number') {
              validHydrationX.push(entry.hydration);
              hydrationY.push(score);
            }
          }
        });

        const rSleep = calculatePearsonCorrelation(validSleepX, sleepY);
        const rActivity = calculatePearsonCorrelation(validActivityX, activityY);
        const rHydration = calculatePearsonCorrelation(validHydrationX, hydrationY);

        const correlationInfo = [];
        if (rSleep !== null) correlationInfo.push(`Sleep vs Mood: ${rSleep.toFixed(2)}`);
        if (rActivity !== null) correlationInfo.push(`Activity vs Mood: ${rActivity.toFixed(2)}`);
        if (rHydration !== null) correlationInfo.push(`Hydration vs Mood: ${rHydration.toFixed(2)}`);

        if (correlationInfo.length > 0) {
          userContextStr += `\nHistorical Pearson correlation coefficients (where -1.0 means perfect negative correlation, 0.0 means no linear correlation, and +1.0 means perfect positive correlation): ${correlationInfo.join(", ")}. Reference these scientific figures directly when explaining how their habits affect their mood. If a strong positive or negative correlation (+/- 0.40 or stronger) is found, highlight it in your advice.`;
        }
      }

      const systemPrompt = `You are an expert AI emotion analyst for EPIONARA.
${modePrompt}
The user shares their feelings. Analyze with depth.
You MUST write all output text fields (emotion, analysis, advice, healing, tags) in ${LANG_NAMES[activeLang] || "English"}.
Context on user's lifestyle today: ${userContextStr}

Reply ONLY with this exact JSON schema:
{
  "emotion": "main emotion (translated to ${LANG_NAMES[activeLang] || "English"})",
  "positive": 65,
  "intensity": 70,
  "analysis": "deep analysis 2-3 sentences (translated to ${LANG_NAMES[activeLang] || "English"})",
  "advice": "personalized advice 2-3 sentences (translated to ${LANG_NAMES[activeLang] || "English"})",
  "healing": "short quote (translated to ${LANG_NAMES[activeLang] || "English"})",
  "tags": ["tag1", "tag2"],
  "emoji": "1 emoji",
  "suggested_game": "popit",
  "radar": [
    {"subject": "Happiness", "A": 70, "full": 100},
    {"subject": "Anxiety", "A": 40, "full": 100},
    {"subject": "Anger", "A": 20, "full": 100},
    {"subject": "Sadness", "A": 30, "full": 100},
    {"subject": "Peace", "A": 60, "full": 100}
  ]
}
For the "radar" field: Analyze the input and distribute exactly 100 points across the five standard subjects ("Happiness", "Anxiety", "Anger", "Sadness", "Peace"). You MUST use these exact English subject names in the radar array. Do NOT translate the "subject" field in the JSON; it must remain "Happiness", "Anxiety", "Anger", "Sadness", "Peace".`;

      const text = await callGeminiAPI({
        system: systemPrompt,
        messages: [{ role: "user", content: input }],
        max_tokens: 8192,
      });

      // Strict JSON cleaning
      let cleanText = text.trim();
      if (cleanText.includes("```")) {
        cleanText = cleanText.replace(/```json|```/g, "").trim();
      }

      const parsed = JSON.parse(cleanText);
      setResult(parsed);
      typeEffect(parsed.analysis);
      await addEntry({ input, result: parsed });
    } catch (err) {
      const appErr = handleError(err, "ai");
      setError(appErr);

      const fallbackLang = FALLBACK_TRANSLATIONS[activeLang] || FALLBACK_TRANSLATIONS.en;
      const fallback = {
        emotion: "...",
        positive: 50,
        intensity: 50,
        analysis: appErr.message || fallbackLang.analysis,
        advice: fallbackLang.advice,
        healing: fallbackLang.healing,
        tags: fallbackLang.tags,
        emoji: "💙",
        radar: [
          { subject: "Happiness", A: 50 },
          { subject: "Anxiety", A: 50 },
          { subject: "Anger", A: 50 },
          { subject: "Sadness", A: 50 },
          { subject: "Peace", A: 50 },
        ],
      };
      setResult(fallback);
      typeEffect(fallback.analysis);
    } finally {
      setLoading(false);
    }
  }, [input, loading, analysisMode, typeEffect, addEntry, handleError, journals, stats, activeLang]);

  const copyResult = useCallback(() => {
    if (!result) return;
    const shareText = `[EPIONARA AI Analysis]\nMain Emotion: ${result.emotion} (${result.emoji})\nAnalysis: ${result.analysis}\nAdvice: ${result.advice}`;
    navigator.clipboard?.writeText(shareText);
    success(t.copy || "Đã sao chép kết quả!");
  }, [result, t.copy, success]);

  const clearInput = useCallback(() => {
    setInput("");
  }, []);

  return {
    data: {
      input,
      loading,
      result,
      history,
      analysisMode,
      showBreathing,
      typedAnalysis,
      presets: MOOD_PRESETS,
    },
    loading,
    error,
    actions: {
      setInput,
      setAnalysisMode,
      setShowBreathing,
      analyze,
      copyResult,
      clearInput,
    },
  };
}
