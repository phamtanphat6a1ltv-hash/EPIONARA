import { useState, useRef } from "react";

export default function VoiceInputBtn({ onResult, t, lang = "vi" }) {
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => !!(window.SpeechRecognition || window.webkitSpeechRecognition));
  const recRef = useRef(null);

  if (!supported) {
    return (
      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
        {t?.voice_no_support || "Voice not supported"}
      </span>
    );
  }

  const getLangCode = (lang) => {
    const codes = { vi: "vi-VN", en: "en-US", ja: "ja-JP", ko: "ko-KR", zh: "zh-CN", fr: "fr-FR" };
    return codes[lang] || "vi-VN";
  };

  const toggle = () => {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.lang = getLangCode(lang);
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => setListening(true);
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      onResult(transcript);
      setListening(false);
    };
    rec.onerror = (e) => {
      console.warn("[VoiceInput] Error:", e.error);
      setListening(false);
    };
    rec.onend = () => setListening(false);

    recRef.current = rec;
    try {
      rec.start();
    } catch (e) {
      console.warn("[VoiceInput] Could not start:", e.message);
      setListening(false);
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={listening ? (t?.voice_stop || "Dừng nghe") : (t?.voice_input || "Nhập bằng giọng nói")}
      aria-pressed={listening}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 16px",
        background: listening ? "rgba(239,68,68,0.15)" : "rgba(108,61,232,0.1)",
        border: `1px solid ${listening ? "rgba(239,68,68,0.35)" : "rgba(108,61,232,0.3)"}`,
        color: listening ? "#f87171" : "#a78bfa",
        borderRadius: 99,
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 600,
        marginTop: 10,
        transition: "all 0.2s",
        fontFamily: "inherit",
      }}
    >
      <span style={{ fontSize: 16 }}>{listening ? "⏹" : "🎙️"}</span>
      {listening
        ? (t?.voice_listening || "Đang nghe...")
        : (t?.voice_start || "Nói thay vì gõ")
      }
      {listening && (
        <span style={{
          width: 8, height: 8,
          borderRadius: "50%",
          background: "#ef4444",
          animation: "pulse 0.8s ease infinite",
          flexShrink: 0,
        }} />
      )}
      <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.6;transform:scale(0.95)}}`}</style>
    </button>
  );
}
