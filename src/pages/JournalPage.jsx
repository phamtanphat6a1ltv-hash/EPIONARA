import React, { useRef, useEffect, useState, useMemo } from "react";
import PropTypes from "prop-types";
import Globe from "react-globe.gl";
import * as THREE from "three";
import { useBlocker } from "react-router-dom";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useJournal } from "../hooks/useJournal.js";
import { useAppContext } from "../context/AppContext.jsx";
import { MOOD_EMOJIS, MOOD_COLORS } from "../utils/constants.js";
import { THREE_D_MOOD_EMOJIS } from "../components/ThreeDEmojiIcons.jsx";
import GlassCard from "../components/GlassCard.jsx";
import { BackButton } from "../components/UIComponents.jsx";
import ErrorBoundary from "../components/ErrorBoundary.jsx";
import { VirtualJournalList } from "../components/VirtualJournalList.jsx";
import { EmptyJournalState } from "../components/EmptyStates.jsx";
import { ConfirmDialog } from "../components/ConfirmDialog.jsx";
import { Confetti } from "../components/Confetti.jsx";
import { useSoundEffects } from "../context/SoundEffectsContext.jsx";
import { useToast } from "../hooks/useToast.js";

import { CbtReframingModal } from "../components/CbtReframingModal.jsx";
import { DB } from "../utils/db.js";



// --- Glowing & Metallic custom icons for the redesign ---
const NeonDiaryIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 8, filter: "drop-shadow(0 0 8px rgba(34, 211, 238, 0.7))" }}>
    <defs>
      <linearGradient id="diaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22d3ee" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
    </defs>
    <rect x="5" y="3" width="14" height="18" rx="2" stroke="url(#diaryGrad)" strokeWidth="2.5" />
    <path d="M5 7h4M5 11h4M5 15h4" stroke="url(#diaryGrad)" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M13 7h2M13 11h2M13 15h2" stroke="url(#diaryGrad)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: "middle" }}>
    <defs>
      <linearGradient id="moonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c084fc" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
    </defs>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="url(#moonGrad)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
  </svg>
);

const GoldCoinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: "middle" }}>
    <defs>
      <linearGradient id="coinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="50%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#ca8a04" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="9" fill="url(#coinGrad)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
    <circle cx="12" cy="12" r="6" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
    <path d="M12 8v8M10 10h3a1.5 1.5 0 0 1 0 3h-2a1.5 1.5 0 0 0 0 3h3" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const DocIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: "middle" }}>
    <defs>
      <linearGradient id="docGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>
    </defs>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="url(#docGrad)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
    <polyline points="14 2 14 8 20 8" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.2)" />
    <line x1="16" y1="13" x2="8" y2="13" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="16" y1="17" x2="8" y2="17" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const CalendarStarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: "middle" }}>
    <defs>
      <linearGradient id="calStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4ade80" />
        <stop offset="100%" stopColor="#16a34a" />
      </linearGradient>
    </defs>
    <rect x="3" y="4" width="18" height="18" rx="2" fill="url(#calStarGrad)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
    <line x1="3" y1="10" x2="21" y2="10" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
    <path d="M12 11l1 2 2.5.5-1.8 1.7.5 2.5-2.2-1.2-2.2 1.2.5-2.5-1.8-1.7 2.5-.5z" fill="#fde047" stroke="#eab308" strokeWidth="0.5" />
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4, verticalAlign: "middle", display: "inline-block" }}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const RunningIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4, verticalAlign: "middle", display: "inline-block" }}>
    <path d="M18 8a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM14 9.5L12 7l-2.5 3-3-1M6.5 15l2-2.5 3 1.5 2.5-4 3.5 3M14 20l-1.5-3M8 20v-3.5L10 14" />
  </svg>
);

const WaterDropIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4, verticalAlign: "middle", display: "inline-block" }}>
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);

const ElegantSaveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: "middle" }}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const HEATMAP_JEWEL_COLORS = [
  "rgba(255, 255, 255, 0.03)", // 0 - Empty
  "#1d4ed8", // 1 - Very Sad: Sapphire Blue
  "#2563eb", // 2 - Sad: Rich Sapphire
  "#581c87", // 3 - Unhappy: Deep Amethyst
  "#7c3aed", // 4 - Neutral: Glowing Amethyst
  "#047857", // 5 - Ok: Deep Emerald
  "#10b981", // 6 - Happy: Bright Emerald
  "#ec4899", // 7 - Very Happy: Rose Ruby
  "#f43f5e"  // 8 - Excellent: Star Ruby
];

/**
 * Journal page content displaying streak stats, mood log entry, charts and virtualized logs list.
 */
function JournalPageContent({ minimal = false }) {
  const { t, lang, setPage, isPremium, dailySpinsCount, incrementSpins, user } = useAppContext();
  const ageGroup = user?.ageGroup || "adult";
  
  const ageFontScale = ageGroup === "elderly" ? "1.15em" : "1em";
  const ageBgClass = ageGroup === "teen" ? "dark-lofi-bg" : (ageGroup === "child" ? "colorful-kids-bg" : "cosmic-galaxy-bg");
  const { data, actions } = useJournal();
  const { playBubble, playSuccess } = useSoundEffects();

  const {
    moods,
    todayMood,
    todayNote,
    chartView,
    moodLabels,
    avg,
    best,
    streak,
    chartData,
    showConfetti,
    sleep,
    activity,
    hydration,
    isScanningDistortions,
    detectedDistortions,
    scannedEntryId,
    stats
  } = data;

  const {
    setTodayMood,
    setTodayNote,
    setChartView,
    handleAddMood,
    setShowConfetti,
    setSleep,
    setActivity,
    setHydration,
    recoverStreak,
    clearScanningData
  } = actions;

  const { success: toastSuccess, error: toastError } = useToast();

  const handleRecoverClick = async () => {
    const breakDate = stats?.breakDateStr;
    const msg = (t.streak_recover_confirm || "Bạn có muốn dùng 1 lượt hồi phục chuỗi để khôi phục cho ngày {date} không?").replace("{date}", breakDate);
    if (window.confirm(msg)) {
      try {
        const res = await recoverStreak();
        if (res && res.success) {
          const successMsg = (t.streak_recover_success || "Đã khôi phục chuỗi ngày {date} thành công! 🎉").replace("{date}", breakDate);
          toastSuccess(successMsg);
        }
      } catch (err) {
        toastError(err.message || "Lỗi hồi phục chuỗi");
      }
    }
  };

  // Reset confetti after duration
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 4500);
      return () => clearTimeout(timer);
    }
  }, [showConfetti, setShowConfetti]);

  const [showRecent, setShowRecent] = useState(true);

  const globePoints = useMemo(() => {
    if (!chartData) return [];
    return chartData.filter(d => d.score !== null).map(d => {
      let hash = 0;
      for (let i = 0; i < d.date.length; i++) {
        hash = d.date.charCodeAt(i) + ((hash << 5) - hash);
      }
      const rnd1 = Math.abs(Math.sin(hash)) * 10000;
      const rnd2 = Math.abs(Math.cos(hash)) * 10000;
      const lat = (rnd1 - Math.floor(rnd1)) * 180 - 90;
      const lng = (rnd2 - Math.floor(rnd2)) * 360 - 180;
      
      const color = MOOD_COLORS[Math.min(d.score - 1, 7)];
      const emoji = THREE_D_MOOD_EMOJIS[Math.min(d.score - 1, 7)] || "";
      
      return {
        lat,
        lng,
        size: 3.5, // Increased size to make it stand out
        color,
        label: `<div style="padding:4px 8px;background:rgba(0,0,0,0.8);border-radius:6px;color:white;font-family:sans-serif;font-size:12px;text-align:center;">
          <b>${d.date}</b><br/>
          <span style="font-size:16px">${emoji}</span> ${moodLabels[Math.min(d.score - 1, 7)]}<br/>
          Điểm: ${d.score}/8
        </div>`
      };
    });
  }, [chartData, moodLabels]);

  const globeArcs = useMemo(() => {
    if (!globePoints || globePoints.length === 0) return [];
    const arcs = [];
    // Generate arcs connecting random locations to the mood points to simulate data streams
    for (let i = 0; i < 20; i++) {
      const targetPoint = globePoints[Math.floor(Math.random() * globePoints.length)];
      const startLat = (Math.random() - 0.5) * 180;
      const startLng = (Math.random() - 0.5) * 360;
      arcs.push({
        startLat,
        startLng,
        endLat: targetPoint.lat,
        endLng: targetPoint.lng,
        color: targetPoint.color,
      });
    }
    return arcs;
  }, [globePoints]);

  const globeMaterial = useMemo(() => {
    return new THREE.MeshPhongMaterial({
      color: "#0f172a", // Dark slate background
      emissive: "#015380", // Dimmer cyan/blue glow to let points pop
      wireframe: true,
      transparent: true,
      opacity: 0.15, // Reduced opacity
    });
  }, []);

  // Seeding mock data for exact visual match
  useEffect(() => {
    const hasSeeded = localStorage.getItem("sj_demo_seeded");
    if (!hasSeeded) {
      const runSeed = async () => {
        const demoEntries = [
          {
            id: "demo_1",
            date: "2026-07-12",
            score: 6,
            note: "开心",
            sleep: 7,
            activity: 30,
            hydration: 8,
            ts: new Date("2026-07-12T10:00:00").getTime()
          },
          {
            id: "demo_2",
            date: "2026-07-12",
            score: 7,
            note: "非常开心",
            sleep: 7,
            activity: 30,
            hydration: 8,
            ts: new Date("2026-07-12T11:00:00").getTime()
          }
        ];
        await DB.saveJournals(demoEntries);
        
        // Setup stats in localStorage so it reflects streak: 0, totalDays: 2, avgMood: 6.5
        localStorage.setItem("sj_meta_stats", JSON.stringify({
          totalJournals: 2,
          totalAiCount: 0,
          posAiCount: 0
        }));
        
        localStorage.setItem("sj_demo_seeded", "true");
        window.location.reload();
      };
      runSeed();
    }
  }, []);

  // Trigger CBT Prompt directly after scanning is completed
  useEffect(() => {
    if (!isScanningDistortions && detectedDistortions && detectedDistortions.length > 0 && scannedEntryId) {
      setShowCbtPrompt(true);
    }
  }, [isScanningDistortions, detectedDistortions, scannedEntryId]);


  const textareaRef = useRef(null);
  const [noteError, setNoteError] = useState("");
  const [gachaNote, setGachaNote] = useState("");

  const [showCbtPrompt, setShowCbtPrompt] = useState(false);
  const [activeCbtModal, setActiveCbtModal] = useState(false);

  const hasUnsavedChanges = todayMood !== null || todayNote.trim() !== "";

  // Real-time blur validation
  const handleNoteBlur = () => {
    if (!todayNote.trim() && todayMood !== null) {
      setNoteError(t.journal_error_empty);
    } else {
      setNoteError("");
    }
  };

  // Prevent accidental navigation - beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Prevent accidental navigation - React Router blocker
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
  );

  const handleWriteClick = () => {
    textareaRef.current?.focus();
    textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length || !payload[0].value) return null;
    const val = payload[0].value;
    return (
      <div
        style={{
          background: "var(--nav-dropdown-bg, rgba(13,18,60,0.98))",
          border: "1.5px solid var(--border2)",
          borderRadius: 10,
          padding: "8px 14px",
          fontSize: 12,
        }}
      >
        <div style={{ color: "#a78bfa", fontWeight: 600, marginBottom: 2 }}>{label}</div>
        <div style={{ color: "var(--text-primary)" }}>
          {MOOD_EMOJIS[val - 1]} {moodLabels[val - 1]} ({val}/8)
        </div>
        {payload[0].payload?.note && (
          <div style={{ color: "var(--text-secondary)", marginTop: 2 }}>
            {payload[0].payload.note}
          </div>
        )}
      </div>
    );
  };

  CustomTooltip.propTypes = {
    active: PropTypes.bool,
    payload: PropTypes.array,
    label: PropTypes.string,
  };

  return (
    <div
      className={minimal ? "" : ageBgClass}
      style={{
        minHeight: minimal ? "auto" : "100vh",
        paddingTop: minimal ? 0 : 50,
        paddingBottom: minimal ? 0 : 80,
        position: "relative",
        fontSize: ageFontScale,
      }}
    >
      {!minimal && <div className="vignette-overlay" />}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: minimal ? 0 : "0 16px", position: "relative", zIndex: 2 }}>
        {!minimal && setPage && (

          <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", marginBottom: 30, paddingTop: 10 }}>
            <BackButton onClick={() => setPage("home")} label={`← ${t.back_home}`} />
          </div>
        )}


        {!minimal && (
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <h1
              className="neon-glow-text"
              style={{
                fontSize: "clamp(24px,5vw,34px)",
                fontWeight: 900,
                margin: "0 0 10px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <NeonDiaryIcon />
              {t.journal_title}
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, fontWeight: 400, fontFamily: "'Inter', sans-serif" }}>
              {t.journal_sub}
            </p>
          </div>
        )}

        {/* Stats Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
            gap: 12,
            marginBottom: 20,
          }}
        >
          {[
            { label: t.avg_mood, value: avg, unit: "/8", color: "#fbbf24", icon: <MoonIcon /> },
            { label: t.streak, value: streak, unit: "", color: "#fbbf24", icon: <GoldCoinIcon />, isStreak: true },
            { label: t.recorded, value: moods.length, unit: " " + t.days, color: "#fbbf24", icon: <DocIcon /> },
            { label: t.best, value: best?.score || "-", unit: "/8 *", color: "#fbbf24", icon: <CalendarStarIcon /> },
          ].map((s) => (
            <GlassCard 
              key={s.label} 
              className={`foreground-card ${s.isStreak ? "streak-pulse-glow" : ""}`}
              style={{ 
                textAlign: "center", 
                padding: "16px 12px",
                borderRadius: 18,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "center",
                minHeight: 110
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, color: "var(--text-secondary)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                  {s.icon}
                  <span>{s.label}</span>
                </div>
                <div 
                  style={{ 
                    fontSize: 24, 
                    fontWeight: 800, 
                    background: "linear-gradient(135deg, #f59e0b, #fbbf24, #d97706)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontFamily: "'Poppins', 'Inter', sans-serif",
                    filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25))"
                  }}
                >
                  {s.value}
                  <span style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 500, marginLeft: 2 }}>{s.unit}</span>
                </div>
              </div>
              {s.isStreak && stats?.canRecover && stats?.streakRecoveriesLeft > 0 && (
                <button
                  onClick={handleRecoverClick}
                  style={{
                    marginTop: 8,
                    padding: "3px 10px",
                    borderRadius: 10,
                    border: "none",
                    background: "linear-gradient(135deg, #f59e0b, #ea580c)",
                    color: "white",
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(245,158,11,0.4)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow = "0 4px 10px rgba(245,158,11,0.6)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0 2px 6px rgba(245,158,11,0.4)";
                  }}
                >
                  ⚡ {t.streak_recover_btn || "Hồi phục"} ({stats.streakRecoveriesLeft})
                </button>
              )}
            </GlassCard>
          ))}
        </div>

        {/* Entry Log Box + Charts */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) minmax(0,1.6fr)",
            gap: 16,
            marginBottom: 18,
          }}
        >
          <GlassCard
            className="foreground-card"
            style={{
              borderRadius: 20,
              boxShadow: "var(--shadow-card)"
            }}
          >
            <h3 
              style={{ 
                color: "var(--text-primary)", 
                fontSize: 14, 
                fontWeight: 600, 
                marginBottom: 2,
              }}
            >
              {lang === "vi" ? "Ghi chú tâm trạng" : "Mood Notes"}
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: 11, marginBottom: 14 }}>
              {t.journal_today || "Hôm nay bạn cảm thấy thế nào?"}
            </p>

            {/* Emojis Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 12 }}>
              {THREE_D_MOOD_EMOJIS.map((e, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setTodayMood(i);
                    playBubble();
                  }}
                  className={`journal-emoji-btn emoji-glow-aura-${i}`}
                  style={{
                    background: todayMood === i ? "var(--glass2)" : "var(--glass1)",
                    border: todayMood === i ? `1.5px solid ${MOOD_COLORS[i]}` : "1.5px solid var(--border2)",
                    borderRadius: 14,
                    padding: "8px 4px",
                    cursor: "pointer",
                    transform: todayMood === i ? "scale(1.15)" : "scale(1)",
                    transition: "all .2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    boxShadow: todayMood === i ? `0 0 15px ${MOOD_COLORS[i]}44` : "none",
                  }}
                >
                  <div style={{ width: 34, height: 34, margin: "0 auto" }}>
                    {React.cloneElement(e, { style: { width: "100%", height: "100%" } })}
                  </div>
                </button>
              ))}
            </div>

            {todayMood !== null && (
              <div
                style={{
                  textAlign: "center",
                  color: MOOD_COLORS[todayMood],
                  fontWeight: 700,
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 10,
                  textShadow: `0 0 10px ${MOOD_COLORS[todayMood]}44`
                }}
              >
                {moodLabels[todayMood]}
              </div>
            )}

            {/* Note Area */}
            <textarea
              ref={textareaRef}
              value={todayNote}
              onBlur={handleNoteBlur}
              onChange={(e) => {
                setTodayNote(e.target.value);
                setNoteError("");
              }}
              placeholder={t.journal_note}
              style={{
                width: "100%",
                minHeight: 70,
                background: "var(--bg0)",
                border: noteError ? "1.5px solid #ef4444" : "1.5px solid var(--border2)",
                borderRadius: 12,
                color: "var(--text-primary)",
                padding: "10px 12px",
                fontSize: 12,
                resize: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4, fontSize: 11, minHeight: 16 }}>
              <span style={{ color: "#f87171", fontWeight: 500 }}>{noteError}</span>
              <span style={{ color: "var(--text-secondary)" }}>
                {todayNote.length}
              </span>
            </div>

            {/* Sliders Removed */}

            
            <button
              onClick={async () => {
                playSuccess();
                
                // Store note text before handleAddMood resets it
                const noteText = todayNote;
                setGachaNote(noteText);
                await handleAddMood();
                setShowConfetti(true);
              }}
              disabled={todayMood === null || !!noteError || isScanningDistortions}
              className="neon-btn-save"
              style={{
                width: "100%",
                marginTop: 6,
                padding: "12px",
                borderRadius: 12,
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                cursor: (todayMood !== null && !noteError) ? "pointer" : "not-allowed",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {t.journal_save ? t.journal_save.replace("💾", "").trim() : ""}
            </button>


          </GlassCard>

          {/* Right Panel: Glowing Charts */}
          <GlassCard
            className="foreground-card"
            style={{
              background: "var(--glass-bg, rgba(6, 8, 20, 0.75))",
              border: "1.5px solid var(--border2)",
              borderRadius: 20,
              boxShadow: "var(--shadow-card)"
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <h3 style={{ color: "var(--text-primary)", fontSize: 14, fontWeight: 600, margin: 0 }}>
                {t.journal_chart} — 30 {t.day_label}
              </h3>
              <div className="premium-segmented-control">
                <button
                  onClick={() => setChartView("area")}
                  className={`premium-segment-btn ${chartView === "area" ? "active" : ""}`}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" style={{ display: "inline-block" }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Line
                  </span>
                </button>
                <button
                  onClick={() => setChartView("bar")}
                  className={`premium-segment-btn ${chartView === "bar" ? "active" : ""}`}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ display: "inline-block" }}>
                      <rect x="3" y="12" width="4" height="8" />
                      <rect x="10" y="8" width="4" height="12" />
                      <rect x="17" y="4" width="4" height="16" />
                    </svg>
                    Bar
                  </span>
                </button>
                <button
                  onClick={() => setChartView("globe")}
                  className={`premium-segment-btn ${chartView === "globe" ? "active" : ""}`}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ display: "inline-block" }}>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    Globe
                  </span>
                </button>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={260}>
              {chartView === "globe" ? (
                <div style={{ width: "100%", height: 260, position: "relative", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", borderRadius: 12 }}>
                  <Globe
                    width={typeof window !== "undefined" ? Math.min(window.innerWidth - 60, 600) : 300}
                    height={260}
                    backgroundColor="rgba(0,0,0,0)"
                    showGlobe={true}
                    globeMaterial={globeMaterial}
                    showAtmosphere={false}
                    pointsData={globePoints}
                    pointAltitude={0.08}
                    pointColor="color"
                    pointRadius="size"
                    pointLabel="label"
                  />
                </div>
              ) : chartView === "area" ? (
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c084fc" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorMood" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#ec4899" />
                      <stop offset="35%" stopColor="#8b5cf6" />
                      <stop offset="70%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                    <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border1)" />
                  <XAxis dataKey="day" tick={{ fill: "var(--text-secondary)", fontSize: 9 }} interval={4} />
                  <YAxis domain={[0, 8]} tick={{ fill: "var(--text-secondary)", fontSize: 9 }} ticks={[0, 2, 4, 6, 8]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="url(#colorMood)"
                    strokeWidth={3}
                    fill="url(#moodGrad)"
                    dot={{ r: 3.5, stroke: "url(#colorMood)", strokeWidth: 1.5, fill: "var(--bg0, #0c0a1c)" }}
                    activeDot={{ r: 5.5, stroke: "#ffffff", strokeWidth: 2, fill: "#3b82f6", filter: "url(#glowFilter)" }}
                    filter="url(#glowFilter)"
                    connectNulls={false}
                  />

                </AreaChart>
              ) : (
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border1)" />
                  <XAxis dataKey="day" tick={{ fill: "var(--text-secondary)", fontSize: 9 }} interval={4} />
                  <YAxis domain={[0, 8]} tick={{ fill: "var(--text-secondary)", fontSize: 9 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]} filter="url(#glowFilter)">
                    {chartData.map((entry, i) => (
                      <rect
                        key={i}
                        fill={entry.score ? MOOD_COLORS[Math.min(entry.score - 1, 7)] : "transparent"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </GlassCard>
        </div>

        {/* Recent Entries */}
        <GlassCard
          className="foreground-card"
          style={{
            borderRadius: 20,
            boxShadow: "var(--shadow-card)"
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <h3 style={{ color: "var(--text-primary)", fontSize: 14, fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              {t.journal_recent}
            </h3>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {moods.length > 5 && (
                <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                  {t.journal_showing_entries?.replace("{count}", moods.length)}
                </span>
              )}
              <button 
                onClick={() => setShowRecent(!showRecent)}
                style={{
                  background: "transparent", border: "none", color: "var(--text-secondary)",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  padding: 4, borderRadius: "50%",
                }}
              >
                {showRecent ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {showRecent && (
            moods.length === 0 ? (
              <EmptyJournalState t={t} onWriteClick={handleWriteClick} />
            ) : (
              <VirtualJournalList
                items={moods}
                moodLabels={moodLabels}
                moodColors={MOOD_COLORS}
                moodEmojis={THREE_D_MOOD_EMOJIS}
                height={moods.length > 5 ? 320 : moods.length * 64}
                itemHeight={64}
              />
            )
          )}
        </GlassCard>
      </div>

      {blocker.state === "blocked" && (
        <ConfirmDialog
          message={t.journal_unsaved_warning}
          confirmLabel={t.confirm_leave}
          cancelLabel={t.keep_editing}
          danger={true}
          onConfirm={() => blocker.proceed()}
          onCancel={() => blocker.reset()}
        />
      )}
      {showConfetti && <Confetti />}

      {showCbtPrompt && (
        <ConfirmDialog
          message={
            lang === "vi"
              ? "AI phát hiện ý nghĩ của bạn có xu hướng tiêu cực (CBT). Bạn có muốn làm bài tập nhanh giải tỏa tâm lý không?"
              : "AI detected some cognitive distortions. Would you like to do a quick CBT exercise to reframe your thoughts?"
          }
          confirmLabel={lang === "vi" ? "Bắt đầu CBT" : "Start CBT"}
          cancelLabel={lang === "vi" ? "Để sau" : "Later"}
          onConfirm={() => {
            setShowCbtPrompt(false);
            setActiveCbtModal(true);
          }}
          onCancel={() => {
            setShowCbtPrompt(false);
            setGachaNote("");
            clearScanningData();
          }}
        />
      )}

      {activeCbtModal && scannedEntryId && (
        <CbtReframingModal
          entryId={scannedEntryId}
          distortions={detectedDistortions}
          note={gachaNote || ""}
          onClose={() => {
            setActiveCbtModal(false);
            setGachaNote("");
            clearScanningData();
          }}
        />
      )}

      {/* AI Cognitive Distortion Scanning Overlay */}
      {isScanningDistortions && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(6, 8, 24, 0.85)",
          backdropFilter: "blur(12px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99999
        }}>
          <div style={{
            width: 64,
            height: 64,
            border: "4px dashed rgba(167, 139, 250, 0.2)",
            borderTop: "4px solid #a78bfa",
            borderRadius: "50%",
            animation: "spin 1.2s linear infinite"
          }} />
          <h3 style={{ marginTop: 24, color: "var(--text-primary, white)", fontSize: 16, fontWeight: 700 }}>
            {lang === "vi" ? "AI đang rà soát nhận thức..." : "AI is scanning cognitive distortions..."}
          </h3>
          <p style={{ color: "var(--text-secondary, rgba(255,255,255,0.5))", fontSize: 12, marginTop: 8 }}>
            {lang === "vi" ? "Tìm kiếm các lỗi suy nghĩ tiêu cực để hỗ trợ tâm lý (CBT)." : "Identifying thinking errors to support mental wellness (CBT)."}
          </p>
        </div>
      )}


      <style>{`
        .cosmic-galaxy-bg {
          background: radial-gradient(circle at 15% 15%, rgba(12, 20, 60, 0.9), transparent 50%),
                      radial-gradient(circle at 85% 85%, rgba(45, 10, 80, 0.85), transparent 50%),
                      radial-gradient(circle at 50% 50%, rgba(10, 50, 70, 0.9), #03040b);
          background-attachment: fixed;
          position: relative;
          overflow: hidden;
        }
        .cosmic-galaxy-bg::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at 40% 40%, rgba(34, 211, 238, 0.03) 0%, transparent 40%),
                      radial-gradient(circle at 70% 60%, rgba(139, 92, 246, 0.04) 0%, transparent 40%);
          animation: rotateGalaxy 120s linear infinite;
          pointer-events: none;
          z-index: 0;
        }
        @keyframes rotateGalaxy {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .vignette-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle, transparent 65%, rgba(4, 5, 12, 0.6) 100%);
          pointer-events: none;
          z-index: 1;
        }
        .foreground-card {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
          z-index: 2;
          position: relative;
        }
        .foreground-card:hover {
          transform: scale(1.008) translateY(-2px);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35), 0 0 25px rgba(139, 92, 246, 0.15) !important;
          border-color: rgba(255, 255, 255, 0.15) !important;
        }
        .neon-glow-text {
          background: linear-gradient(135deg, #22d3ee 0%, #c084fc 60%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 0 10px rgba(34, 211, 238, 0.35));
        }
        .top-header-icon {
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .top-header-icon:hover {
          transform: scale(1.15);
        }
        .streak-pulse-glow {
          animation: streakPulse 2.5s infinite alternate;
        }
        @keyframes streakPulse {
          0% {
            box-shadow: 0 0 8px rgba(245, 158, 11, 0.15), inset 0 0 10px rgba(245, 158, 11, 0.05);
            border-color: rgba(245, 158, 11, 0.15);
          }
          100% {
            box-shadow: 0 0 22px rgba(245, 158, 11, 0.55), inset 0 0 12px rgba(245, 158, 11, 0.15);
            border-color: rgba(245, 158, 11, 0.45);
          }
        }
        .journal-emoji-btn {
          transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .journal-emoji-btn:hover {
          transform: scale(1.18) translateY(-2px) !important;
          background: rgba(255, 255, 255, 0.08) !important;
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.3);
        }
        .journal-emoji-btn:active {
          transform: scale(1.05) translateY(0) !important;
        }
        .emoji-glow-aura-0:hover { filter: drop-shadow(0 0 12px rgba(239, 68, 68, 0.4)); }
        .emoji-glow-aura-1:hover { filter: drop-shadow(0 0 12px rgba(249, 115, 22, 0.4)); }
        .emoji-glow-aura-2:hover { filter: drop-shadow(0 0 12px rgba(234, 179, 8, 0.4)); }
        .emoji-glow-aura-3:hover { filter: drop-shadow(0 0 12px rgba(148, 163, 184, 0.3)); }
        .emoji-glow-aura-4:hover { filter: drop-shadow(0 0 12px rgba(34, 197, 94, 0.4)); }
        .emoji-glow-aura-5:hover { filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.4)); }
        .emoji-glow-aura-6:hover { filter: drop-shadow(0 0 12px rgba(139, 92, 246, 0.4)); }
        .emoji-glow-aura-7:hover { filter: drop-shadow(0 0 12px rgba(236, 72, 153, 0.45)); }

        /* Custom range sliders */
        .custom-slider-sleep, .custom-slider-activity, .custom-slider-hydration {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 99px;
          outline: none;
          background: rgba(255, 255, 255, 0.08);
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5);
          transition: all 0.2s ease;
        }
        
        /* Sleep (amethyst) */
        .custom-slider-sleep::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #e879f9 0%, #a78bfa 50%, #6d28d9 100%);
          box-shadow: 0 0 10px #a78bfa, 0 0 2px rgba(0,0,0,0.5);
          cursor: pointer;
          margin-top: -4.5px;
          transition: transform 0.1s ease, box-shadow 0.1s ease;
        }
        .custom-slider-sleep::-webkit-slider-thumb:hover {
          transform: scale(1.25);
          box-shadow: 0 0 15px #c084fc, 0 0 4px rgba(0,0,0,0.6);
        }
        
        /* Activity (sapphire) */
        .custom-slider-activity::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #60a5fa 0%, #3b82f6 50%, #1d4ed8 100%);
          box-shadow: 0 0 10px #3b82f6, 0 0 2px rgba(0,0,0,0.5);
          cursor: pointer;
          margin-top: -4.5px;
          transition: transform 0.1s ease, box-shadow 0.1s ease;
        }
        .custom-slider-activity::-webkit-slider-thumb:hover {
          transform: scale(1.25);
          box-shadow: 0 0 15px #60a5fa, 0 0 4px rgba(0,0,0,0.6);
        }
        
        /* Hydration (emerald) */
        .custom-slider-hydration::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #67e8f9 0%, #22d3ee 50%, #0891b2 100%);
          box-shadow: 0 0 10px #22d3ee, 0 0 2px rgba(0,0,0,0.5);
          cursor: pointer;
          margin-top: -4.5px;
          transition: transform 0.1s ease, box-shadow 0.1s ease;
        }
        .custom-slider-hydration::-webkit-slider-thumb:hover {
          transform: scale(1.25);
          box-shadow: 0 0 15px #67e8f9, 0 0 4px rgba(0,0,0,0.6);
        }

        .neon-btn-save {
          background: linear-gradient(to right, #9333ea 0%, #4f46e5 50%, #06b6d4 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.3) !important;
          box-shadow: 0 0 18px rgba(147, 51, 234, 0.35), 0 0 18px rgba(6, 182, 212, 0.35), inset 0 1px 1.5px rgba(255, 255, 255, 0.4);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }
        .neon-btn-save:hover:not(:disabled) {
          background: linear-gradient(to right, #a855f7 0%, #6366f1 50%, #22d3ee 100%);
          border-color: rgba(255, 255, 255, 0.55) !important;
          box-shadow: 0 0 28px rgba(147, 51, 234, 0.6), 0 0 28px rgba(6, 182, 212, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.55);
          transform: translateY(-2px);
        }
        .neon-btn-save:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 0 12px rgba(147, 51, 234, 0.4), 0 0 12px rgba(6, 182, 212, 0.4), inset 0 1px 1.5px rgba(255, 255, 255, 0.3);
        }



        /* Segmented controls */
        .premium-segmented-control {
          background: rgba(10, 10, 20, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 99px;
          padding: 2px;
          display: inline-flex;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4);
        }
        .premium-segment-btn {
          padding: 4px 14px;
          border-radius: 99px;
          border: none;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          background: transparent;
          color: rgba(255, 255, 255, 0.45);
        }
        .premium-segment-btn.active {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(6, 182, 212, 0.1) 100%);
          border: 1px solid rgba(139, 92, 246, 0.35);
          color: #c4b5fd;
          box-shadow: 0 2px 10px rgba(139, 92, 246, 0.25);
          text-shadow: 0 0 8px rgba(196, 181, 253, 0.45);
        }

        /* Pulse animation for latest entry heatmap */
        .heatmap-latest-pulse {
          animation: heatmapPulse 1.8s infinite alternate;
        }
        @keyframes heatmapPulse {
          0% { transform: scale(1); filter: drop-shadow(0 0 2px var(--pulse-color)); }
          100% { transform: scale(1.22); filter: drop-shadow(0 0 10px var(--pulse-color)); }
        }

        .recent-journal-card:hover {
          border-color: rgba(255, 255, 255, 0.15) !important;
          background: rgba(255, 255, 255, 0.045) !important;
          transform: translateY(-1.5px);
        }
      `}</style>
    </div>
  );
}

JournalPageContent.propTypes = {
  minimal: PropTypes.bool,
};

JournalPage.propTypes = {
  minimal: PropTypes.bool,
};

export default function JournalPage(props) {
  const { t } = useAppContext();
  return (
    <ErrorBoundary t={t}>
      <JournalPageContent {...props} />
    </ErrorBoundary>
  );
}
