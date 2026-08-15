import { useState, useEffect, useRef } from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import { DB } from "../../utils/db.js";
import { callGeminiAPI } from "../../utils/geminiApi.js";

// =================== MENTAL HEALTH TIPS / ADVICE ===================
const staticTips = {
  vi: [
    "Gọi tên cảm xúc: Đặt tên cho cảm xúc của bạn (ví dụ: 'Mình đang lo lắng') sẽ giúp vùng não phân tích hoạt động và giảm bớt sự căng thẳng của nó đó!",
    "Kỹ thuật 5-4-3-2-1: Hãy nhìn 5 thứ xung quanh, chạm vào 4 thứ, lắng nghe 3 âm thanh, ngửi 2 mùi hương và nếm 1 vị. Cách này giúp bạn quay về thực tại cực nhanh khi quá tải.",
    "Lòng tự trắc ẩn: Hãy tự hỏi: 'Nếu người bạn thân gặp khó khăn này, mình sẽ khuyên họ thế nào?'. Sau đó hãy ôm lấy chính mình và tự nói lời khuyên đó nhé.",
    "Quy tắc 2 phút: Nếu một việc tự chăm sóc bản thân tốn chưa đầy 2 phút (như uống cốc nước, vươn vai), hãy đứng dậy và làm ngay nhé. Não bạn sẽ thấy dễ chịu hơn đó.",
    "Phương pháp Thở hộp (Box Breathing): Hít vào 4 giây, giữ hơi 4 giây, thở ra 4 giây, giữ hơi 4 giây. Chỉ cần lặp lại 4 vòng để làm dịu nhịp tim tức thì.",
    "Giải phóng suy nghĩ: Viết mọi lo lắng lo toan ra một mảnh giấy, sau đó xé vụn hoặc bỏ nó đi. Hành động vật lý này giúp não bộ có cảm giác 'đã xử lý xong'.",
    "Chánh niệm đi bộ: Dành ra 5-10 phút đi bộ chậm rãi mà không nhìn điện thoại, chỉ tập trung cảm nhận bàn chân tiếp xúc với mặt đất dưới chân.",
    "Lòng biết ơn nhỏ bé: Hãy ghi ra 3 điều nhỏ nhắn khiến bạn thấy vui hôm nay (như cốc sữa ấm, thời tiết đẹp, hay một chiếc clip hài hước)."
  ],
  en: [
    "Label your emotions: Naming what you feel (e.g., 'I feel anxious') helps activate the analytical brain and cools down the emotional intensity!",
    "5-4-3-2-1 Grounding: Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, and 1 you taste. This grounds you quickly when overwhelmed.",
    "Self-compassion: Ask yourself: 'What would I say to a friend in this situation?'. Treat yourself with the exact same kindness and understanding.",
    "The 2-minute rule: If a self-care action takes under 2 minutes (drinking water, stretching), do it immediately. Your brain will thank you.",
    "Box Breathing: Inhale for 4s, hold for 4s, exhale for 4s, hold for 4s. Repeat 4 cycles to immediately soothe your nervous system.",
    "Brain dump: Write all your thoughts and worries down on a piece of paper, then shred it. The physical act helps your brain release the stress.",
    "Mindful walk: Take a 5-10 minute walk without looking at your phone, focusing entirely on the physical connection of your feet to the floor.",
    "Micro-gratitudes: Jot down 3 tiny things that made you smile today (e.g., a warm drink, a sunny day, or a nice message)."
  ]
};

// =================== ROBOT GUIDE (Mira Upgrade) ===================
function RobotGuide({ onClose }) {
  const { lang, t, setPage } = useAppContext();
  const currentLang = lang;

  // System Walkthrough Steps (Preserved)
  const steps = [
    { icon:"🪞", title:t.mira_s0_title||t.robot_hi||"Welcome to EPIONARA!", desc:t.mira_s0_desc||"I'm Mira 🤖 — your AI assistant!", highlight:null, mood:"wave", emoji:"✨🎉🌟", page:null, tryLabel:null },
    { icon:"🤖", title:t.mira_s1_title||"AI Emotion Analysis", desc:t.mira_s1_desc||"Share your emotions — AI will analyze!", highlight:"ai", mood:"think", emoji:"💭🧠💡", page:"ai", tryLabel:t.mira_s1_try||"🤖 Try it" },
    { icon:"🧩", title:t.mira_s2_title||"Personality Tests", desc:t.mira_s2_desc||"Discover your true self with MBTI!", highlight:"test", mood:"excited", emoji:"🎯🏆🌟", page:"test", tryLabel:t.mira_s2_try||"🧩 Take test" },
    { icon:"📔", title:t.mira_s3_title||"Emotion Journal", desc:t.mira_s3_desc||"Record your mood every day!", highlight:"journal", mood:"happy", emoji:"📅🌈💖", page:"journal", tryLabel:t.mira_s3_try||"📔 Write journal" },
    { icon:"🌊", title:t.mira_s4_title||"Mental Energy Map", desc:t.mira_s4_desc||"AI reads your aura!", highlight:"special", mood:"magic", emoji:"🔮🌊💜", page:"special", tryLabel:t.mira_s4_try||"🌊 Explore aura" },
    { icon:"💬", title:t.mira_s5_title||"Chat with MindBot", desc:t.mira_s5_desc||"Talk with AI 24/7!", highlight:"chat", mood:"friendly", emoji:"💬🤝💙", page:"chat", tryLabel:t.mira_s5_try||"💬 Chat now" },
    { icon:"📚", title:t.mira_s6_title||"Psychology Knowledge", desc:t.mira_s6_desc||"Read psychology articles!", highlight:"knowledge", mood:"think", emoji:"📚🧠💡", page:"knowledge", tryLabel:t.mira_s6_try||"📚 Read articles" },
    { icon:"🌿", title:t.mira_s7_title||"Mood Garden", desc:t.mira_s7_desc||"Nurture your mind tree!", highlight:"garden", mood:"happy", emoji:"🌿🌸🌟", page:"garden", tryLabel:t.mira_s7_try||"🌿 Visit Garden" },
    { icon:"✨", title:t.mira_s8_title||"Mind Replay", desc:t.mira_s8_desc||"AI summarizes your journey!", highlight:"replay", mood:"magic", emoji:"✨📅💜", page:"replay", tryLabel:t.mira_s8_try||"✨ View Replay" },
    { icon:"🔮", title:t.nav_predict||"AI Mood Prediction", desc:t.predict_sub||"AI predicts today's mood from your data!", highlight:"predict", mood:"magic", emoji:"🔮✨💜", page:"predict", tryLabel:t.predict_run||"🔮 Try Prediction" },
    { icon:"📄", title:t.nav_report||"PDF Report", desc:t.report_sub||"Export your personal psychology profile as PDF!", highlight:"report", mood:"think", emoji:"📄🎓⭐", page:"report", tryLabel:t.report_generate||"📄 Export PDF" },
    { icon:"💌", title:t.nav_letter||"Future Letter", desc:t.letter_sub||"Write a letter to your future self!", highlight:"letter", mood:"friendly", emoji:"💌✍️🌟", page:"letter", tryLabel:t.letter_write||"💌 Write Letter" },
    { icon:"🚀", title:t.mira_s9_title||"You're ready!", desc:t.mira_s9_desc||"Your journey starts here!", highlight:null, mood:"celebrate", emoji:"🎊🎉🥳", page:null, tryLabel:null },
  ];

  // Core Mascot States
  const [mode, setMode] = useState(() => {
    const seen = localStorage.getItem("sj_guide_seen");
    return seen ? "menu" : "guide"; // Start with guide for first-time visitors, menu for returners
  });
  const [step, setStep] = useState(0);
  const [bubbleVisible, setBubbleVisible] = useState(true);
  const [guideMinimized, setGuideMinimized] = useState(false);
  const [_exploring, setExploring] = useState(false);
  const [_exploredPage, setExploredPage] = useState(null);

  // Advanced Interactive States
  const [robotMood, setRobotMood] = useState("wave");

  // Sub-feature states: Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Sub-feature states: Mood Log
  const [selectedMood, setSelectedMood] = useState(null);
  const [moodSaved, setMoodSaved] = useState(false);

  // Sub-feature states: Health Advice
  const [adviceText, setAdviceText] = useState("");

  const robotFaces = {
    wave:      { color: "#6c3de8", anim: "robotWave" },
    think:     { color: "#8b5cf6", anim: "robotThink" },
    excited:   { color: "#f97316", anim: "robotJump" },
    happy:     { color: "#22c55e", anim: "robotBounce" },
    magic:     { color: "#22d3ee", anim: "robotSpin" },
    friendly:  { color: "#ec4899", anim: "robotNod" },
    celebrate: { color: "#a78bfa", anim: "robotDance" },
  };

  const currentStep = steps[step];
  const isLast = step === steps.length - 1;
  const isFirst = step === 0;

  // Compute active robot appearance
  const activeFace = mode === "guide" 
    ? (robotFaces[currentStep.mood] || robotFaces.wave)
    : (robotFaces[robotMood] || robotFaces.wave);


  // Heuristic Sentiment Classifier
  const analyzeSentiment = (text) => {
    const clean = text.toLowerCase();
    if (clean.includes("chúc mừng") || clean.includes("tuyệt vời") || clean.includes("yay") || clean.includes("great") || clean.includes("awesome") || clean.includes("celebrate") || clean.includes("🥳") || clean.includes("🎉")) {
      return "celebrate";
    }
    if (clean.includes("vui") || clean.includes("thích") || clean.includes("yêu") || clean.includes("happy") || clean.includes("love") || clean.includes("smile") || clean.includes("😊") || clean.includes("🥰") || clean.includes("💖")) {
      return "happy";
    }
    if (clean.includes("kỳ diệu") || clean.includes("năng lượng") || clean.includes("aura") || clean.includes("vũ trụ") || clean.includes("magic") || clean.includes("universe") || clean.includes("spark") || clean.includes("✨") || clean.includes("🔮")) {
      return "magic";
    }
    if (clean.includes("lo lắng") || clean.includes("buồn") || clean.includes("căng thẳng") || clean.includes("stress") || clean.includes("sad") || clean.includes("worry") || clean.includes("sorry") || clean.includes("khóc") || clean.includes("😢") || clean.includes("😭")) {
      return "friendly"; // Empathic nod
    }
    if (clean.includes("suy nghĩ") || clean.includes("tại sao") || clean.includes("như thế nào") || clean.includes("hỏi") || clean.includes("think") || clean.includes("why") || clean.includes("how") || clean.includes("💭") || clean.includes("🤔")) {
      return "think";
    }
    if (clean.includes("chào") || clean.includes("hello") || clean.includes("hi") || clean.includes("hey") || clean.includes("wave") || clean.includes("👋")) {
      return "wave";
    }
    return "friendly";
  };

  // Mode Transition helper
  const transitionMode = (newMode, cb) => {
    setBubbleVisible(false);
    setTimeout(() => {
      setMode(newMode);
      if (cb) cb();
      setBubbleVisible(true);
    }, 200);
  };

  // Walkthrough Guides transition helpers
  const goNext = () => {
    if (isLast) {
      localStorage.setItem("sj_guide_seen", "1");
      onClose();
      return;
    }
    setBubbleVisible(false);
    setTimeout(() => {
      setStep(s => s + 1);
      setBubbleVisible(true);
    }, 200);
  };
  const goPrev = () => {
    if (isFirst) return;
    setBubbleVisible(false);
    setTimeout(() => {
      setStep(s => s - 1);
      setBubbleVisible(true);
    }, 200);
  };

  const handleTryIt = () => {
    if (!currentStep.page) return;
    setExploring(true);
    setExploredPage(currentStep.page);
    setGuideMinimized(true);
    setPage(currentStep.page);
  };

  const handleBackToGuide = () => {
    setExploring(false);
    setExploredPage(null);
    setGuideMinimized(false);
    setPage("home");
    setTimeout(() => setBubbleVisible(true), 300);
  };

  // Initialize features — update robot mood on mode/step/lang change
  useEffect(() => {
    if (mode === "guide") {
      setRobotMood(currentStep.mood);
    } else if (mode === "menu") {
      setRobotMood("wave");
    }
  }, [mode, step, lang]);

  // Chat Setup & scrolling
  useEffect(() => {
    if (mode === "chat") {
      if (chatMessages.length === 0) {
        const initialGreet = currentLang === "vi" 
          ? "Hê lô! Mình là Mira 🤖. Hôm nay bạn thế nào rồi? Hãy chia sẻ với mình nhé! ✨" 
          : "Hello! I'm Mira 🤖. How is your day going? Feel free to share anything with me! ✨";
        setChatMessages([{ role: "assistant", content: initialGreet }]);
      }
    }
  }, [mode, lang]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatLoading]);

  // Handler: Quick Chat
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userText = chatInput.trim();
    const updatedMessages = [...chatMessages, { role: "user", content: userText }];
    setChatMessages(updatedMessages);
    setChatInput("");
    setChatLoading(true);
    setRobotMood("think");

    try {
      const langNames = {
        vi: "Vietnamese",
        en: "English",
        ja: "Japanese",
        ko: "Korean",
        zh: "Chinese"
      };
      const targetLang = langNames[currentLang] || "English";
      const systemInstruction = `You are Mira, a super cute, supportive, and sweet AI mascot inside the EPIONARA app.
      Keep your responses extremely short, concise, and helpful (maximum 3 sentences, around 50-60 words).
      Respond in ${targetLang} naturally and use cute emojis (e.g. 🤖, 💙, ✨). 
      Be encouraging, empathetic, and refer to yourself as Mira.`;

      // Call Gemini API (using message format required by utils/geminiApi.js)
      const resText = await callGeminiAPI({
        system: systemInstruction,
        messages: updatedMessages.map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          content: m.content
        }))
      });

      setChatMessages(prev => [...prev, { role: "assistant", content: resText }]);
      const detected = analyzeSentiment(resText);
      setRobotMood(detected);
    } catch {
      const errorMsg = currentLang === "vi" 
        ? "Có chút trục trặc kết nối rồi... Bạn thử nhắn lại nhé! 😢"
        : "Oops, I encountered a connection issue. Please try again! 😢";
      setChatMessages(prev => [...prev, { role: "assistant", content: errorMsg }]);
      setRobotMood("friendly");
    } finally {
      setChatLoading(false);
    }
  };

  // Handler: Quick Mood Log
  const saveQuickMood = async () => {
    if (!selectedMood) return;

    const moodsMap = {
      1: { emoji: "😢", label: t.mood0 || "Rất tệ" },
      2: { emoji: "😔", label: t.mood1 || "Buồn" },
      3: { emoji: "😕", label: t.mood2 || "Khó chịu" },
      4: { emoji: "😐", label: t.mood3 || "Bình thường" },
      5: { emoji: "🙂", label: t.mood4 || "Ổn" },
      6: { emoji: "😊", label: t.mood5 || "Vui" },
      7: { emoji: "😃", label: t.mood6 || "Rất vui" },
      8: { emoji: "🤩", label: t.mood7 || "Tuyệt vời" }
    };

    setRobotMood("think");
    try {
      const today = new Date().toISOString().split("T")[0];
      const timestamp = Date.now();
      const moodInfo = moodsMap[selectedMood];

      const entry = {
        id: `${today}_${timestamp}`,
        date: today,
        score: selectedMood,
        note: currentLang === "vi" 
          ? `[Mira Quick Log] Tâm trạng: ${moodInfo.emoji} ${moodInfo.label}`
          : `[Mira Quick Log] Mood: ${moodInfo.emoji} ${moodInfo.label}`,
        sleep: 7,
        hydration: 5,
        activity: 30,
        ts: timestamp
      };

      await DB.addJournal(entry);

      setMoodSaved(true);
      setRobotMood("celebrate");

      setTimeout(() => {
        setMoodSaved(false);
        setSelectedMood(null);
        transitionMode("menu");
      }, 1800);
    } catch (err) {
      console.error("[Mira Quick Mood] Error saving:", err);
      setRobotMood("friendly");
    }
  };

  // Handler: Mental Health Tip
  const loadRandomAdvice = () => {
    setRobotMood("magic");
    const list = staticTips[currentLang] || staticTips.en;
    const randomIndex = Math.floor(Math.random() * list.length);
    const tip = list[randomIndex];
    setAdviceText(tip);
  };

  // SVG Robot component
  const MiraRobot = ({ color, anim, size = 80 }) => (
    <div style={{ flexShrink: 0, animation: `${anim} 0.9s ease infinite alternate`, transformOrigin: "center bottom" }}>
      <svg width={size} height={Math.round(size * 1.2)} viewBox="0 0 80 96" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Glow behind */}
        <ellipse cx="40" cy="90" rx="24" ry="5" fill={color} opacity="0.2"/>
        {/* Antenna base */}
        <line x1="40" y1="2" x2="40" y2="14" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        {/* Antenna ball with glow */}
        <circle cx="40" cy="5" r="5" fill={color} opacity="0.3"/>
        <circle cx="40" cy="5" r="3" fill={color}>
          <animate attributeName="r" values="3;4.5;3" dur="1.4s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="1;0.6;1" dur="1.4s" repeatCount="indefinite"/>
        </circle>
        {/* Head */}
        <rect x="10" y="14" width="60" height="42" rx="14" fill="rgba(13,20,64,0.97)" stroke={color} strokeWidth="2.5"/>
        {/* Screen shine */}
        <rect x="12" y="16" width="28" height="8" rx="4" fill={color} opacity="0.06"/>
        {/* Eyes */}
        <circle cx="26" cy="32" r="9" fill={color} opacity="0.15"/>
        <circle cx="26" cy="32" r="7" fill={color} opacity="0.85"/>
        <circle cx="54" cy="32" r="9" fill={color} opacity="0.15"/>
        <circle cx="54" cy="32" r="7" fill={color} opacity="0.85"/>
        {/* Pupils */}
        <circle cx="28" cy="30" r="3.5" fill="white" opacity="0.95"/>
        <circle cx="56" cy="30" r="3.5" fill="white" opacity="0.95"/>
        {/* Eye shine */}
        <circle cx="29.5" cy="28.5" r="1.2" fill="white"/>
        <circle cx="57.5" cy="28.5" r="1.2" fill="white"/>
        {/* Mouth / expression bar */}
        <rect x="24" y="44" width="32" height="6" rx="3" fill={color} opacity="0.6"/>
        <rect x="27" y="45" width="26" height="4" rx="2" fill={color} opacity="0.4"/>
        {/* Neck */}
        <rect x="33" y="56" width="14" height="8" rx="4" fill={color} opacity="0.45"/>
        {/* Body */}
        <rect x="6" y="64" width="68" height="30" rx="14" fill="rgba(13,20,64,0.95)" stroke={color} strokeWidth="2.5"/>
        {/* Chest screen */}
        <rect x="16" y="70" width="48" height="18" rx="8" fill={color} opacity="0.08" stroke={color} strokeWidth="1" strokeOpacity="0.3"/>
        {/* Chest lights row */}
        <circle cx="28" cy="79" r="3.5" fill={color} opacity="0.5"><animate attributeName="opacity" values="0.5;1;0.5" dur="1.8s" begin="0s" repeatCount="indefinite"/></circle>
        <circle cx="40" cy="79" r="4" fill={color} opacity="0.8"><animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.2s" begin="0.3s" repeatCount="indefinite"/></circle>
        <circle cx="52" cy="79" r="3.5" fill={color} opacity="0.5"><animate attributeName="opacity" values="0.5;1;0.5" dur="2s" begin="0.6s" repeatCount="indefinite"/></circle>
        {/* Arms */}
        <rect x="-4" y="66" width="14" height="24" rx="7" fill={color} opacity="0.65"/>
        <rect x="70" y="66" width="14" height="24" rx="7" fill={color} opacity="0.65"/>
        {/* Hands */}
        <circle cx="3" cy="92" r="6" fill={color} opacity="0.75"/>
        <circle cx="77" cy="92" r="6" fill={color} opacity="0.75"/>
        {/* Ear bolts */}
        <circle cx="10" cy="35" r="3" fill={color} opacity="0.5"/>
        <circle cx="70" cy="35" r="3" fill={color} opacity="0.5"/>
      </svg>
    </div>
  );

  // Render: Minimized Floating State
  if (guideMinimized) {
    return (
      <div style={{ position: "fixed", bottom: 100, left: 28, zIndex: 7600, animation: "slideUpIn 0.4s ease" }}>
        <div style={{ background: "linear-gradient(135deg,rgba(13,20,64,0.98),rgba(26,10,60,0.98))", border: `2px solid ${activeFace.color}66`, borderRadius: 20, padding: "14px 18px", boxShadow: `0 16px 50px rgba(0,0,0,0.7),0 0 30px ${activeFace.color}22`, maxWidth: 260 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <MiraRobot color={activeFace.color} anim={activeFace.anim} size={44} />
            <div>
              <div style={{ color: activeFace.color, fontWeight: 700, fontSize: 12 }}>Mira 🤖</div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, lineHeight: 1.4 }}>{t.robot_done_explore || "Done exploring! Continue the guide 😊"}</div>
            </div>
          </div>
          <button onClick={handleBackToGuide} style={{ width: "100%", padding: "9px 14px", background: `linear-gradient(135deg,${activeFace.color},${activeFace.color}cc)`, border: "none", color: "white", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 700, boxShadow: `0 0 15px ${activeFace.color}44` }}>
            {t.robot_back_guide || "↩ Back to guide"}
          </button>
          <button onClick={onClose} style={{ width: "100%", marginTop: 7, padding: "7px", background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 11 }}>
            {t.robot_skip || "Skip guide"}
          </button>
        </div>
        <style>{`@keyframes slideUpIn{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}`}</style>
      </div>
    );
  }

  // Common Action Styles
  const optionButtonStyle = {
    width: "100%",
    padding: "11px 14px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    color: "white",
    cursor: "pointer",
    fontSize: 12.5,
    fontWeight: 600,
    textAlign: "left",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    transition: "all 0.2s ease-in-out",
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 7500, display: "flex", alignItems: "flex-end", justifyContent: "flex-start", padding: "0 24px 24px", pointerEvents: "none" }}>
      {/* Backdrop */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(5,8,20,0.65)", backdropFilter: "blur(6px)", pointerEvents: "all" }} onClick={onClose} />

      {/* Main card box */}
      <div style={{ position: "relative", width: "100%", maxWidth: 440, pointerEvents: "all", animation: "slideUpIn 0.5s cubic-bezier(.34,1.56,.64,1)", zIndex: 7501 }}>
        <div style={{ background: "linear-gradient(145deg,rgba(13,20,64,0.99),rgba(22,8,52,0.99))", border: `1.5px solid ${activeFace.color}44`, borderRadius: 24, padding: "24px 22px 20px", boxShadow: `0 32px 80px rgba(0,0,0,0.85),0 0 50px ${activeFace.color}18`, position: "relative", overflow: "hidden" }}>
          
          {/* Ambient glows */}
          <div style={{ position: "absolute", top: -80, right: -80, width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle,${activeFace.color}18,transparent)`, pointerEvents: "none" }} />

          {/* Top-Right Control Buttons */}
          <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 8, zIndex: 2 }}>
            {/* Close Button */}
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.2)"; e.currentTarget.style.color = "#f87171"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}>✕</button>
          </div>

          {/* Robot & Speech Bubble */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
            <MiraRobot color={activeFace.color} anim={activeFace.anim} size={76} />

            <div style={{ flex: 1, opacity: bubbleVisible ? 1 : 0, transform: bubbleVisible ? "translateY(0) scale(1)" : "translateY(10px) scale(0.96)", transition: "all 0.25s cubic-bezier(.34,1.4,.64,1)" }}>
              <div style={{ background: `linear-gradient(135deg,${activeFace.color}16,${activeFace.color}08)`, border: `1px solid ${activeFace.color}44`, borderRadius: "4px 18px 18px 18px", padding: "13px 15px", position: "relative" }}>
                <div style={{ position: "absolute", left: -9, top: 14, width: 0, height: 0, borderTop: "9px solid transparent", borderBottom: "9px solid transparent", borderRight: `9px solid ${activeFace.color}44` }} />
                
                {/* Mode-specific Speech Bubbles */}
                {mode === "menu" && (
                  <>
                    <div style={{ fontSize: 14, marginBottom: 6, letterSpacing: 2 }}>✨🤖💖</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                      <span style={{ color: "white", fontWeight: 800, fontSize: 15 }}>{t.mira_menu_title || "Menu Trợ Lý Mira"}</span>
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12.5, lineHeight: 1.6 }}>
                      {t.mira_menu_welcome || "Chào bạn! Mình là Mira 🤖. Hôm nay bạn cần mình hỗ trợ gì nào?"}
                    </div>
                  </>
                )}

                {mode === "guide" && (
                  <>
                    <div style={{ fontSize: 14, marginBottom: 6, letterSpacing: 2 }}>{currentStep.emoji}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                      <span style={{ fontSize: 18 }}>{currentStep.icon}</span>
                      <span style={{ color: "white", fontWeight: 800, fontSize: 15, lineHeight: 1.3 }}>{currentStep.title}</span>
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12.5, lineHeight: 1.7, whiteSpace: "pre-line" }}>
                      {currentStep.desc}
                    </div>
                  </>
                )}

                {mode === "chat" && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                      <span style={{ fontSize: 16 }}>💬</span>
                      <span style={{ color: "white", fontWeight: 800, fontSize: 14 }}>Mira Quick Chat</span>
                    </div>
                    {/* Chat messaging window */}
                    <div style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, paddingRight: 4, marginBottom: 2 }}>
                      {chatMessages.map((msg, i) => (
                        <div key={i} style={{
                          alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                          background: msg.role === "user" ? "rgba(108,61,232,0.25)" : "rgba(255,255,255,0.05)",
                          border: msg.role === "user" ? "1px solid rgba(108,61,232,0.4)" : "1px solid rgba(255,255,255,0.08)",
                          borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                          padding: "8px 11px",
                          maxWidth: "85%",
                          fontSize: 12,
                          lineHeight: 1.5,
                          color: msg.role === "user" ? "#e0d7ff" : "rgba(255,255,255,0.9)",
                          wordBreak: "break-word"
                        }}>
                          {msg.content}
                        </div>
                      ))}
                      {chatLoading && (
                        <div style={{ alignSelf: "flex-start", background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "6px 10px", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                          {t.mira_chat_thinking || "Mira đang suy nghĩ..."} 🤖⏳
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  </>
                )}

                {mode === "mood" && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                      <span style={{ fontSize: 16 }}>📊</span>
                      <span style={{ color: "white", fontWeight: 800, fontSize: 14 }}>{t.mira_mood_title || "Ghi Nhận Tâm Trạng"}</span>
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12.5, lineHeight: 1.5 }}>
                      {moodSaved 
                        ? (t.mira_mood_success || "Đã ghi nhận tâm trạng nhanh đạt điểm {score}! 🎉").replace("{score}", String(selectedMood))
                        : (t.mira_mood_title || "Hôm nay bạn thấy thế nào? Hãy chọn nhanh điểm tâm trạng từ 1 đến 8 ở bảng dưới nhé!")
                      }
                    </div>
                  </>
                )}

                {mode === "advice" && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                      <span style={{ fontSize: 16 }}>💡</span>
                      <span style={{ color: "white", fontWeight: 800, fontSize: 14 }}>{t.mira_advice_title || "Lời Khuyên Sức Khỏe"}</span>
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 12.5, lineHeight: 1.7, fontStyle: "italic" }}>
                      "{adviceText}"
                    </div>
                  </>
                )}

              </div>
            </div>
          </div>

          {/* Action panels for each mode */}
          {mode === "menu" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 4 }}>
              <button 
                onClick={() => transitionMode("chat")}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "translateX(4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.transform = "none"; }}
                style={optionButtonStyle}
              >
                <span>💬 {t.mira_opt_chat || "Tâm sự nhanh với Mira"}</span>
                <span style={{ color: activeFace.color }}>→</span>
              </button>
              <button 
                onClick={() => transitionMode("mood")}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "translateX(4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.transform = "none"; }}
                style={optionButtonStyle}
              >
                <span>📊 {t.mira_opt_mood || "Ghi nhận tâm trạng nhanh"}</span>
                <span style={{ color: activeFace.color }}>→</span>
              </button>
              <button 
                onClick={() => transitionMode("advice", loadRandomAdvice)}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "translateX(4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.transform = "none"; }}
                style={optionButtonStyle}
              >
                <span>💡 {t.mira_opt_advice || "Nhận lời khuyên sức khỏe"}</span>
                <span style={{ color: activeFace.color }}>→</span>
              </button>
              <button 
                onClick={() => transitionMode("guide", () => setStep(0))}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "translateX(4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.transform = "none"; }}
                style={optionButtonStyle}
              >
                <span>🗺️ {t.mira_opt_guide || "Hướng dẫn sử dụng hệ thống"}</span>
                <span style={{ color: activeFace.color }}>→</span>
              </button>
            </div>
          )}

          {mode === "guide" && (
            <div style={{ marginTop: 8 }}>
              {currentStep.page && (
                <button onClick={handleTryIt} style={{
                  width: "100%", padding: "11px 16px", marginBottom: 12,
                  background: `linear-gradient(135deg,${activeFace.color}25,${activeFace.color}15)`,
                  border: `1.5px solid ${activeFace.color}60`,
                  color: "white", borderRadius: 12, cursor: "pointer",
                  fontSize: 13, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "all 0.25s",
                  boxShadow: `0 0 20px ${activeFace.color}22`,
                  animation: "tryItPulse 2.5s ease infinite",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = `linear-gradient(135deg,${activeFace.color}40,${activeFace.color}28)`; e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = `0 0 30px ${activeFace.color}44`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = `linear-gradient(135deg,${activeFace.color}25,${activeFace.color}15)`; e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = `0 0 20px ${activeFace.color}22`; }}>
                  <span style={{ fontSize: 16 }}>👆</span>
                  {currentStep.tryLabel || (t.robot_try || "Try it!")}
                  <span style={{ marginLeft: "auto", background: `${activeFace.color}33`, padding: "2px 8px", borderRadius: 99, fontSize: 11, color: activeFace.color }}>{t.robot_try_short || "Try →"}</span>
                </button>
              )}

              {/* Progress counter & nav controls */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ color: "rgba(255,255,255,0.28)", fontSize: 11 }}>
                  {t.robot_step || "Step"} <span style={{ color: activeFace.color, fontWeight: 700 }}>{step + 1}</span> {t.robot_of || "/"} {steps.length}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {!isFirst && (
                    <button onClick={goPrev} style={{ padding: "8px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", borderRadius: 9, cursor: "pointer", fontSize: 12, transition: "all 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}>
                      ← {t.robot_prev || "Back"}
                    </button>
                  )}
                  <button onClick={goNext} style={{ padding: "9px 20px", background: `linear-gradient(135deg,${activeFace.color},${activeFace.color}bb)`, border: "none", color: "white", borderRadius: 9, cursor: "pointer", fontSize: 12, fontWeight: 700, boxShadow: `0 0 18px ${activeFace.color}44`, transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
                    {isLast ? (t.robot_finish || "🚀 Start!") : (t.robot_next || "Next →")}
                  </button>
                </div>
              </div>

              {/* Switch back to Main Menu / Skip */}
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 10 }}>
                <button onClick={() => transitionMode("menu")} style={{ flex: 1, padding: "6px", background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 11 }}>
                  ↩ Quay lại Menu
                </button>
                <button onClick={onClose} style={{ flex: 1, padding: "6px", background: "none", border: "none", color: "rgba(255,255,255,0.25)", cursor: "pointer", fontSize: 11 }}>
                  {t.robot_skip || "Skip guide"}
                </button>
              </div>
            </div>
          )}

          {mode === "chat" && (
            <div style={{ marginTop: 8 }}>
              {/* Sending form */}
              <form onSubmit={handleSendChat} style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder={t.mira_chat_placeholder || "Nhập tin nhắn..."}
                  disabled={chatLoading}
                  style={{
                    flex: 1,
                    background: "rgba(0,0,0,0.25)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    padding: "9px 12px",
                    color: "white",
                    fontSize: 12.5,
                    outline: "none",
                  }}
                />
                <button 
                  type="submit" 
                  disabled={chatLoading || !chatInput.trim()}
                  style={{ 
                    padding: "0 15px", 
                    background: `linear-gradient(135deg,${activeFace.color},${activeFace.color}dd)`, 
                    border: "none", 
                    color: "white", 
                    borderRadius: 10, 
                    fontWeight: 700,
                    cursor: "pointer",
                    opacity: (chatLoading || !chatInput.trim()) ? 0.5 : 1,
                    fontSize: 12.5
                  }}
                >
                  {t.mira_chat_send || "Gửi"}
                </button>
              </form>
              <button 
                onClick={() => transitionMode("menu")}
                style={{ width: "100%", marginTop: 8, padding: "7px", background: "none", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)", borderRadius: 10, cursor: "pointer", fontSize: 11.5 }}
              >
                {t.mira_btn_back || "↩ Quay lại menu"}
              </button>
            </div>
          )}

          {mode === "mood" && (
            <div style={{ marginTop: 8 }}>
              {!moodSaved ? (
                <>
                  {/* Grid Score select */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 4 }}>
                    {[
                      { val: 1, emoji: "😢", label: t.mood0 || "Tệ" },
                      { val: 2, emoji: "😔", label: t.mood1 || "Buồn" },
                      { val: 3, emoji: "😕", label: t.mood2 || "Khó chịu" },
                      { val: 4, emoji: "😐", label: t.mood3 || "Thường" },
                      { val: 5, emoji: "🙂", label: t.mood4 || "Ổn" },
                      { val: 6, emoji: "😊", label: t.mood5 || "Vui" },
                      { val: 7, emoji: "😃", label: t.mood6 || "Rất vui" },
                      { val: 8, emoji: "🤩", label: t.mood7 || "Tuyệt" }
                    ].map(m => (
                      <button 
                        key={m.val} 
                        onClick={() => setSelectedMood(m.val)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          padding: "6px 2px",
                          background: selectedMood === m.val ? `${activeFace.color}25` : "rgba(255,255,255,0.03)",
                          border: `1px solid ${selectedMood === m.val ? activeFace.color : "rgba(255,255,255,0.08)"}`,
                          borderRadius: 10,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span style={{ fontSize: 20 }}>{m.emoji}</span>
                        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", marginTop: 3 }}>{m.label}</span>
                      </button>
                    ))}
                  </div>
                  
                  {/* Controls */}
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button 
                      onClick={() => transitionMode("menu")}
                      style={{ flex: 1, padding: "8px", background: "none", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)", borderRadius: 10, cursor: "pointer", fontSize: 12 }}
                    >
                      {t.confirm_cancel || "Hủy"}
                    </button>
                    <button 
                      onClick={saveQuickMood}
                      disabled={!selectedMood}
                      style={{ 
                        flex: 1.5, 
                        padding: "8px", 
                        background: `linear-gradient(135deg,#22c55e,#10b981)`, 
                        border: "none", 
                        color: "white", 
                        borderRadius: 10, 
                        fontWeight: 700, 
                        cursor: "pointer",
                        opacity: !selectedMood ? 0.5 : 1,
                        fontSize: 12
                      }}
                    >
                      {t.mira_mood_save || "Lưu tâm trạng"}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ height: 35 }} />
              )}
            </div>
          )}

          {mode === "advice" && (
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button 
                onClick={() => transitionMode("menu")}
                style={{ flex: 1, padding: "8px", background: "none", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)", borderRadius: 10, cursor: "pointer", fontSize: 12 }}
              >
                {t.mira_btn_back || "↩ Quay lại menu"}
              </button>
              <button 
                onClick={loadRandomAdvice}
                style={{ 
                  flex: 1.5, 
                  padding: "8px", 
                  background: `linear-gradient(135deg,${activeFace.color},${activeFace.color}cc)`, 
                  border: "none", 
                  color: "white", 
                  borderRadius: 10, 
                  fontWeight: 700, 
                  cursor: "pointer",
                  fontSize: 12
                }}
              >
                {t.mira_advice_next || "Lời khuyên khác 💡"}
              </button>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes robotWave{0%{transform:translateY(0) rotate(-3deg)}100%{transform:translateY(-8px) rotate(3deg)}}
        @keyframes robotThink{0%{transform:translateX(0) rotate(-2deg)}100%{transform:translateX(5px) rotate(6deg)}}
        @keyframes robotJump{0%{transform:translateY(0) scaleY(1)}100%{transform:translateY(-14px) scaleY(0.93)}}
        @keyframes robotBounce{0%{transform:translateY(0) rotate(0deg)}100%{transform:translateY(-10px) rotate(-3deg)}}
        @keyframes robotSpin{0%{transform:rotate(-6deg) scale(1)}100%{transform:rotate(6deg) scale(1.04)}}
        @keyframes robotNod{0%{transform:rotate(-5deg) translateY(0)}100%{transform:rotate(5deg) translateY(-4px)}}
        @keyframes robotDance{0%{transform:translateX(-8px) rotate(-6deg)}100%{transform:translateX(8px) rotate(6deg)}}
        @keyframes slideUpIn{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
        @keyframes tryItPulse{0%,100%{box-shadow:0 0 20px rgba(108,61,232,0.22)}50%{box-shadow:0 0 35px rgba(108,61,232,0.45)}}
      `}</style>
    </div>
  );
}

// =================== FLOATING ROBOT BUTTON ===================
export function FloatingRobot({ onClick, color = "#6c3de8" }) {
  const { t } = useAppContext();
  const [hovered, setHovered] = useState(false);
  const [pulse, setPulse] = useState(0);
  const pulseEmojis = ["💡", "✨", "🔮"];

  useEffect(() => {
    const ti = setInterval(() => setPulse(p => (p + 1) % 3), 2200);
    return () => clearInterval(ti);
  }, []);

  return (
    <div style={{ position: "fixed", bottom: 28, left: 28, zIndex: 7000, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
      {hovered && (
        <div style={{ background: "rgba(13,20,64,0.97)", border: `1px solid ${color}55`, borderRadius: 14, padding: "10px 16px", color: "white", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", backdropFilter: "blur(12px)", animation: "fadeInUp 0.2s ease", boxShadow: `0 8px 30px rgba(0,0,0,0.5),0 0 20px ${color}22` }}>
          <span style={{ marginRight: 6 }}>🤖</span>MindBot — {t.robot_guide || "Quick Guide"}
        </div>
      )}
      <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        style={{ width: 60, height: 60, borderRadius: "50%", background: `linear-gradient(135deg,${color},#22d3ee)`, border: "2px solid rgba(255,255,255,0.15)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 30px ${color}55`, animation: "floatPulse 2.2s ease infinite", transition: "transform 0.2s", transform: hovered ? "scale(1.18)" : "scale(1)", padding: 0, overflow: "hidden" }}>
        <img src="/mindbot-avatar.png" alt="MindBot" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
      </button>
      <div style={{ position: "absolute", top: -3, left: 45, width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg,#ef4444,#f97316)", border: "2px solid #0a0e27", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, animation: "notifBounce 2.4s ease infinite" }}>
        {pulseEmojis[pulse]}
      </div>
      <style>{`
        @keyframes floatPulse{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes notifBounce{0%,100%{transform:scale(1) rotate(0deg)}50%{transform:scale(1.25) rotate(15deg)}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}

export default RobotGuide;
