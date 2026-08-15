import { useState, useMemo, useCallback } from "react";
import { useJournals, useStats, useGarden } from "./useStorage.js";
import { useAppContext } from "../context/AppContext.jsx";
import { useErrorHandler } from "../utils/errorHandler.js";
import { DB } from "../utils/db.js";
import { getLocalizedNote } from "../utils/constants.js";
import { callGeminiAPI } from "../utils/geminiApi.js";

/**
 * Custom hook managing the Journal page logic and state.
 */
export function useJournal() {
  const { t, isPremium } = useAppContext();
  const { journals: moods, addJournal } = useJournals();
  const { stats, recoverStreak } = useStats();
  const { rewardXP } = useGarden();
  const { handleError } = useErrorHandler();

  const [todayMood, setTodayMood] = useState(null);
  const [todayNote, setTodayNote] = useState("");
  const [chartView, setChartView] = useState("area");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [sleep, setSleep] = useState(7);
  const [activity, setActivity] = useState(30);
  const [hydration, setHydration] = useState(8);

  // Premium CBT distortion detection states
  const [isScanningDistortions, setIsScanningDistortions] = useState(false);
  const [detectedDistortions, setDetectedDistortions] = useState([]);
  const [scannedEntryId, setScannedEntryId] = useState(null);

  const moodLabels = useMemo(
    () => [t.mood0, t.mood1, t.mood2, t.mood3, t.mood4, t.mood5, t.mood6, t.mood7],
    [t]
  );

  const handleAddMood = useCallback(async () => {
    if (todayMood === null) return;
    setLoading(true);
    setError(null);
    setDetectedDistortions([]);
    setScannedEntryId(null);

    const timestamp = Date.now();
    const todayStr = new Date().toISOString().split("T")[0];
    const entryId = `journal_${todayStr}_${timestamp}_${Math.floor(Math.random() * 1000)}`;

    let distortions = [];
    const cleanNote = todayNote.trim();

    // Trigger AI CBT Cognitive Distortion Scan for Premium users with note >= 15 chars
    if (isPremium && cleanNote.length >= 15) {
      setIsScanningDistortions(true);
      try {
        const systemPrompt = `You are an expert clinical psychologist and CBT therapist.
Analyze the following journal entry for cognitive distortions (thinking errors).
Identify if any of these 6 cognitive distortions are present:
1. "Catastrophizing" (expecting the worst possible outcome).
2. "All-or-Nothing" (seeing things in black-and-white, all good or all bad).
3. "Mind Reading" (assuming you know what others think without evidence).
4. "Emotional Reasoning" (believing that because you feel something, it must be true).
5. "Overgeneralization" (drawing a broad negative conclusion based on a single event).
6. "Personalization" (blaming yourself for things outside your control).

Reply ONLY with this exact JSON schema:
{
  "distortions": [
    {
      "type": "Catastrophizing",
      "thought": "the specific negative automatic thought in the text",
      "explanation_vi": "giải thích ngắn gọn lỗi suy nghĩ này bằng tiếng Việt",
      "explanation_en": "brief explanation in English",
      "reframed_vi": "suy nghĩ tích cực cân bằng thay thế đề xuất bằng tiếng Việt",
      "reframed_en": "proposed balanced thought in English"
    }
  ]
}
If no distortions are found, return {"distortions": []}.`;

        const responseText = await callGeminiAPI({
          system: systemPrompt,
          messages: [{ role: "user", content: cleanNote }],
          max_tokens: 600
        });

        let cleaned = responseText.trim();
        if (cleaned.includes("```")) {
          cleaned = cleaned.replace(/```json|```/g, "").trim();
        }
        const parsed = JSON.parse(cleaned);
        if (parsed && Array.isArray(parsed.distortions)) {
          distortions = parsed.distortions;
          setDetectedDistortions(distortions);
        }
      } catch (apiErr) {
        console.warn("[CBT Scan] AI scan failed:", apiErr);
      } finally {
        setIsScanningDistortions(false);
      }
    }

    try {
      const entry = {
        id: entryId,
        score: todayMood + 1,
        note: cleanNote || moodLabels[todayMood],
        sleep: Number(sleep),
        activity: Number(activity),
        hydration: Number(hydration),
        distortions: distortions,
        cbtReframed: false
      };

      await addJournal(entry);
      setScannedEntryId(entryId);

      await rewardXP(30, 3);
      setTodayMood(null);
      setTodayNote("");
      setSleep(7);
      setActivity(30);
      setHydration(8);

      // Mobile Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }

      // Check for 7 days streak
      const newStats = await DB.getStats();
      if (newStats && newStats.streak >= 7) {
        setShowConfetti(true);
      }
    } catch (err) {
      const appErr = handleError(err);
      setError(appErr);
    } finally {
      setLoading(false);
    }
  }, [todayMood, todayNote, moodLabels, addJournal, rewardXP, handleError, isPremium, sleep, activity, hydration]);

  const avg = useMemo(
    () => (moods.length ? (moods.reduce((a, m) => a + (m.score || 5), 0) / moods.length).toFixed(1) : "-"),
    [moods]
  );

  const best = useMemo(
    () => (moods.length ? moods.reduce((a, b) => ((a.score || 5) > (b.score || 5) ? a : b), moods[0]) : null),
    [moods]
  );

  const streak = useMemo(() => stats.streak || 0, [stats.streak]);

  const chartData = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - 29 + i);
      const ds = d.toISOString().split("T")[0];
      const m = moods.find((x) => x.date === ds);
      return {
        day: ds.slice(5).replace("-", "."),

        date: ds,
        score: m ? m.score : null,
        note: m ? getLocalizedNote(m.note, m.score, t) : "",
      };
    });
  }, [moods, t]);

  return {
    data: {
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
    },
    loading,
    error,
    actions: {
      setTodayMood,
      setTodayNote,
      setChartView,
      handleAddMood,
      setShowConfetti,
      setSleep,
      setActivity,
      setHydration,
      recoverStreak,
      clearScanningData: () => {
        setDetectedDistortions([]);
        setScannedEntryId(null);
      }
    },
  };
}
