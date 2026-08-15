import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { T } from "../i18n/index.js";
import { UserStore, AccountStore } from "../utils/db.js";
import { initStore } from "../hooks/useStorage.js";
import { resetActiveKeyCache } from "../utils/crypto";

const AppContext = createContext();

export function AppProvider({ children }) {
  const navigateHook = useNavigate();
  const location = useLocation();
  const page = location.pathname.slice(1) || "home";

  // Map từ route path → tab id cho mobile bottom bar
  const TAB_ROUTE_MAP = {
    "": "home", "home": "home",
    "portal_ai": "ai", "ai": "ai",
    "portal_moments": "journal", "journal": "journal",
    "chat": "chat",
    "portal_balance": "growth", "growth": "growth",
    "balance": "growth", "test": "growth", "dashboard": "growth",
    "progress": "growth", "knowledge": "growth", "personality": "growth",
    "special": "growth", "portal_mirror": "growth", "portal_library": "growth",
    "mood_garden": "journal", "mind_replay": "journal", "replay": "journal", "moments": "journal",
    "future_letter": "journal", "care_mode": "journal", "mood_atmosphere": "journal",
    "mood_predict": "ai", "face_emotion": "ai", "emotion_globe": "ai", "pdf_report": "ai",
  };
  const activeTab = TAB_ROUTE_MAP[page] ??
    Object.entries(TAB_ROUTE_MAP).find(([k]) => k && page.startsWith(k))?.[1] ??
    page;

  const [lang, setLang] = useState(() => {
    try {
      if (!localStorage.getItem("sj_lang_en_forced_v1")) {
        localStorage.setItem("sj_lang", "en");
        localStorage.setItem("sj_lang_en_forced_v1", "true");
        return "en";
      }
      return localStorage.getItem("sj_lang") || "en";
    }
    catch { return "en"; }
  });
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [authModal, setAuthModal] = useState(null);
  const [moodContext, setMoodContext] = useState(null);

  const [soulCoins, setSoulCoins] = useState(() => {
    try {
      const val = localStorage.getItem("sj_soul_coins");
      return val ? parseInt(val, 10) : 500;
    } catch { return 500; }
  });
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [coinsPremium, setCoinsPremium] = useState(() => {
    try { return localStorage.getItem("sj_is_premium") === "true"; }
    catch { return false; }
  });
  const isPremium = true;
  const [unlockedCards, setUnlockedCards] = useState(() => {
    try {
      const val = localStorage.getItem("sj_unlocked_cards");
      return val ? JSON.parse(val) : [];
    } catch { return []; }
  });
  const [dailySpinsCount, setDailySpinsCount] = useState(() => {
    try {
      const val = localStorage.getItem("sj_daily_spins_count");
      const date = localStorage.getItem("sj_last_spin_date");
      const today = new Date().toISOString().split("T")[0];
      if (date !== today) return 0;
      return val ? parseInt(val, 10) : 0;
    } catch { return 0; }
  });

  const addCoins = (amount) => {
    setSoulCoins(prev => {
      const next = prev + amount;
      try { localStorage.setItem("sj_soul_coins", next); } catch {}
      return next;
    });
  };

  const spendCoins = (amount) => {
    let success = false;
    setSoulCoins(prev => {
      if (prev >= amount) {
        success = true;
        const next = prev - amount;
        try { localStorage.setItem("sj_soul_coins", next); } catch {}
        return next;
      }
      return prev;
    });
    return success;
  };

  const collectCard = (card) => {
    setUnlockedCards(prev => {
      const exists = prev.some(c => c.id === card.id);
      if (exists) return prev;
      const next = [...prev, card];
      try { localStorage.setItem("sj_unlocked_cards", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const incrementSpins = () => {
    setDailySpinsCount(prev => {
      const next = prev + 1;
      const today = new Date().toISOString().split("T")[0];
      try {
        localStorage.setItem("sj_daily_spins_count", next);
        localStorage.setItem("sj_last_spin_date", today);
      } catch {}
      return next;
    });
  };

  const upgradePremium = (useCoins = false) => {
    if (useCoins) {
      if (soulCoins >= 10000) {
        spendCoins(10000);
        setCoinsPremium(true);
        try { localStorage.setItem("sj_is_premium", "true"); } catch {}
        return true;
      }
      return false;
    } else {
      setCoinsPremium(true);
      try { localStorage.setItem("sj_is_premium", "true"); } catch {}
      return true;
    }
  };

  const upgradePremiumPlan = async (planType, expiresAt) => {
    if (!user) return;
    const updatedUser = {
      ...user,
      plan_type: planType.toUpperCase(),
      subscription_expires_at: expiresAt
    };
    setUser(updatedUser);
    await UserStore.saveSession(updatedUser);
    const { userRepository } = await import("../repositories/userRepository.js");
    await userRepository.save(updatedUser);
  };

  const t = useMemo(() => T[lang] || T.vi, [lang]);

  // Persist language choice
  useEffect(() => {
    try { localStorage.setItem("sj_lang", lang); }
    catch {}
  }, [lang]);

  // Load session asynchronously on mount
  useEffect(() => {
    async function loadSession() {
      try {
        await initStore();
        const session = await UserStore.getSession();
        if (session) {
          const { userRepository } = await import("../repositories/userRepository.js");
          const allUsers = await userRepository.getAll();
          const updatedUsers = allUsers.map(u => {
            if (u.id === session.id) {
              return {
                ...u,
                plan_type: u.plan_type === "FREE" ? "PRO" : u.plan_type
              };
            } else {
              return {
                ...u,
                plan_type: "FREE",
                subscription_expires_at: null
              };
            }
          });
          await userRepository.save(updatedUsers);
          
          const activeUserUpdated = updatedUsers.find(u => u.id === session.id);
          if (activeUserUpdated) {
            setUser(activeUserUpdated);
            await UserStore.saveSession(activeUserUpdated);
          } else {
            setUser(session);
          }

          import("../utils/syncManager").then(({ SyncManager }) => {
            SyncManager.syncAll(true);
          }).catch(err => console.warn("Lỗi chạy đồng bộ ban đầu:", err));
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error("Failed to load session:", e);
      } finally {
        setIsInitializing(false);
      }
    }
    loadSession();
  }, []);

  useEffect(() => {
    if (!user) return;
    let lastRefresh = Date.now();
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastRefresh > 5 * 60 * 1000) { // Limit activity updates to every 5 minutes
        lastRefresh = now;
        UserStore.refreshSession().catch(err => console.error("Session refresh failed:", err));
      }
    };
    window.addEventListener("click", handleActivity);
    window.addEventListener("keydown", handleActivity);
    return () => {
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("keydown", handleActivity);
    };
  }, [user]);
  const navigate = (p) => {
    if (p === "home") navigateHook("/");
    else navigateHook("/" + p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const login = async (u) => {
    setUser(u);
    AccountStore.addAccount(u);
    AccountStore.saveActive(u.id);
    resetActiveKeyCache();
    await initStore(true);
    import("../utils/syncManager").then(({ SyncManager }) => {
      SyncManager.syncAll(false);
    }).catch(err => console.warn("Lỗi đồng bộ khi đăng nhập:", err));
  };

  const logout = () => {
    UserStore.clearSession();
    setUser(null);
    navigate("home");
  };

  const switchUser = async (u) => {
    AccountStore.saveActive(u.id);
    resetActiveKeyCache();
    await UserStore.saveSession(u);
    setUser(u);
    await initStore(true);
    import("../utils/syncManager").then(({ SyncManager }) => {
      SyncManager.syncAll(false);
    }).catch(err => console.warn("Lỗi đồng bộ khi đổi tài khoản:", err));
  };

  const value = {
    lang,
    setLang,
    t,
    user,
    setUser,
    isInitializing,
    login,
    logout,
    switchUser,
    page,
    activeTab,
    setPage: navigate,
    authModal,
    setAuthModal,
    moodContext,
    setMoodContext,
    soulCoins,
    isPremium,
    unlockedCards,
    dailySpinsCount,
    addCoins,
    spendCoins,
    collectCard,
    incrementSpins,
    upgradePremium,
    showPricingModal,
    setShowPricingModal,
    upgradePremiumPlan,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
