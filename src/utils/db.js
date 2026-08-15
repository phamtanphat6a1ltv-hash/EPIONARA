// =================== PERSISTENT DATA LAYER ===================
// Cloud-ready DB: localStorage/IndexedDB với schema chuẩn, dễ swap sang Supabase sau

import {
  generateSecureOTP,
  encryptData,
  decryptData,
  clearEncryptionKey,
  getEncryptionKey,
  getDeviceKey
} from "./crypto";
import { nativeToast } from "./nativeToast.js";
import { IDB } from "./idb.js";
import { secureGet, secureSet, secureRemove, SyncStorage } from "./secureStorage.js";

// Import new repositories
import { journalRepository } from "../repositories/journalRepository.js";
import { aiRepository } from "../repositories/aiRepository.js";
import { userRepository } from "../repositories/userRepository.js";
import { cbtRepository } from "../repositories/cbtRepository.js";

// Re-export repositories for standard use
export { journalRepository, aiRepository, userRepository, cbtRepository };

/**
 * DB Configuration
 */
export const DB_CONFIG = {
  multipleEntriesPerDay: true,
};

/**
 * Safe Storage Setter for non-sensitive, non-encrypted localStorage.
 * @param {string} key
 * @param {string} value
 */
function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    if (e.name === "QuotaExceededError" || e.code === 22 || e.name === "NS_ERROR_DOM_QUOTA_REACHED") {
      console.error(`[EPIONARA DB Error] LocalStorage bị đầy khi lưu ${key}. Hãy dọn dẹp bớt dữ liệu.`);
      nativeToast(
        "Bộ nhớ tạm của trình duyệt đã đầy. Vui lòng dọn dẹp bớt lịch sử để có thể lưu dữ liệu mới.",
        "warning"
      );
    } else {
      console.error(`[EPIONARA DB Error] Lỗi lưu trữ ${key}:`, e);
    }
  }
}

/**
 * Metadata counter store.
 */
export const MetaDB = {
  /**
   * Get metadata stats from localStorage.
   * @returns {{totalJournals: number, totalAiCount: number, posAiCount: number}}
   */
  getMeta: () => {
    return SyncStorage.get("sj_meta_stats", {
      totalJournals: 0,
      totalAiCount: 0,
      posAiCount: 0,
      recoveredDates: [],
      streakRecoveriesLeft: 5,
      lastGrantMonth: new Date().toISOString().slice(0, 7),
    });
  },

  /**
   * Update metadata stats in localStorage.
   * @param {Object} updates
   */
  updateMeta: (updates) => {
    const meta = MetaDB.getMeta();
    SyncStorage.set("sj_meta_stats", { ...meta, ...updates });
  }
};

/**
 * Unified DB Aggregator Interface (Delegates to Repositories)
 */
export const DB = {
  /**
   * Fetch all journal entries.
   * @returns {Promise<import("./types").Journal[]>}
   */
  getJournals: async () => {
    return journalRepository.getAll();
  },

  /**
   * Bulk save or import journals.
   * @param {import("./types").Journal[]} d
   * @returns {Promise<void>}
   */
  saveJournals: async (d) => {
    await journalRepository.save(d);
  },

  /**
   * Save a single journal entry.
   * @param {import("./types").MoodEntry} entry
   * @returns {Promise<import("./types").Journal[]>}
   */
  addJournal: async (entry) => {
    await journalRepository.save(entry);
    return journalRepository.getAll();
  },

  /**
   * Filter journals by date.
   * @param {string} date - ISO Date string YYYY-MM-DD
   * @returns {Promise<import("./types").Journal[]>}
   */
  getJournalsByDate: async (date) => {
    const all = await journalRepository.getAll();
    return all.filter((x) => x.date === date);
  },

  /**
   * Get latest journal entry for a date.
   * @param {string} date - ISO Date string YYYY-MM-DD
   * @returns {Promise<import("./types").Journal | null>}
   */
  getLatestByDate: async (date) => {
    const all = await journalRepository.getAll();
    const matches = all.filter((x) => x.date === date);
    if (matches.length === 0) return null;
    return matches.sort((a, b) => (b.ts || 0) - (a.ts || 0))[0];
  },

  /**
   * Fetch AI history entries.
   * @returns {Promise<import("./types").AIAnalysis[]>}
   */
  getAIHistory: async () => {
    return aiRepository.getAll();
  },

  /**
   * Save an AI analysis entry.
   * @param {Object} entry
   * @returns {Promise<import("./types").AIAnalysis[]>}
   */
  addAIHistory: async (entry) => {
    await aiRepository.save(entry);
    return aiRepository.getAll();
  },

  /**
   * Fetch all test results.
   * @returns {Promise<Object<string, import("./types").TestResult>>}
   */
  getTestResults: async () => {
    return secureGet("sj_test_results", {});
  },

  /**
   * Save a single test result.
   * @param {string} testId
   * @param {import("./types").TestResult} result
   * @returns {Promise<void>}
   */
  saveTestResult: async (testId, result) => {
    const all = await DB.getTestResults();
    all[testId] = { ...result, savedAt: Date.now() };
    await secureSet("sj_test_results", all);
  },

  /**
   * Fetch all personality growth map snapshots.
   * @returns {Promise<Array<Object>>}
   */
  getGrowthSnapshots: async () => {
    return secureGet("sj_growth_snaps", []);
  },

  /**
   * Add a growth snapshot.
   * @param {Object} snap
   * @returns {Promise<Array<Object>>}
   */
  addGrowthSnapshot: async (snap) => {
    const all = await DB.getGrowthSnapshots();
    const updated = [
      { ...snap, ts: Date.now(), date: new Date().toLocaleDateString("vi-VN") },
      ...all
    ].slice(0, 52);
    await secureSet("sj_growth_snaps", updated);
    return updated;
  },

  /**
   * Compute aggregated statistics from data layers.
   * @returns {Promise<Object>}
   */
  getStats: async () => {
    const journals = await journalRepository.getAll();
    const tests = await DB.getTestResults();
    const meta = MetaDB.getMeta();
    const today = new Date().toISOString().split("T")[0];

    const currentMonth = new Date().toISOString().slice(0, 7);
    if (meta.lastGrantMonth !== currentMonth) {
      meta.streakRecoveriesLeft = 5;
      meta.lastGrantMonth = currentMonth;
      MetaDB.updateMeta(meta);
    }

    const avgMood = journals.length
      ? (journals.reduce((s, j) => s + (j.score || 5), 0) / journals.length).toFixed(1)
      : null;
    const todayJournal = journals.find((j) => j.date === today);

    let streak = 0;
    const recoveredDates = meta.recoveredDates || [];
    const journalDates = new Set(journals.map((j) => j.date));

    const scanDate = new Date();
    while (true) {
      const dateStr = scanDate.toISOString().split("T")[0];
      if (journalDates.has(dateStr) || recoveredDates.includes(dateStr)) {
        streak++;
      } else {
        break;
      }
      scanDate.setDate(scanDate.getDate() - 1);
    }

    let canRecover = false;
    let breakDateStr = null;
    if (journals.length > 0) {
      const earliestDateStr = journals.reduce((min, j) => (j.date < min ? j.date : min), journals[0].date);
      const earliestDate = new Date(earliestDateStr);
      const checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - 1); // start checking from yesterday

      while (checkDate >= earliestDate) {
        const ds = checkDate.toISOString().split("T")[0];
        if (!journalDates.has(ds) && !recoveredDates.includes(ds)) {
          canRecover = true;
          breakDateStr = ds;
          break;
        }
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    const posRate = meta.totalAiCount ? Math.round((meta.posAiCount / meta.totalAiCount) * 100) : null;

    return {
      avgMood,
      streak,
      totalDays: meta.totalJournals || journals.length,
      tests,
      posRate,
      todayJournal,
      aiCount: meta.totalAiCount,
      streakRecoveriesLeft: meta.streakRecoveriesLeft,
      canRecover,
      breakDateStr,
      recoveredDates,
    };
  },

  /**
   * Recover the first broken streak date.
   * @returns {Promise<Object>}
   */
  recoverStreak: async () => {
    const meta = MetaDB.getMeta();
    if (meta.streakRecoveriesLeft <= 0) {
      throw new Error("Bạn đã hết lượt hồi phục chuỗi trong tháng này.");
    }

    const journals = await journalRepository.getAll();
    if (journals.length === 0) {
      throw new Error("Bạn chưa viết nhật ký nào, không có chuỗi để hồi phục.");
    }

    const recoveredDates = meta.recoveredDates || [];
    const journalDates = new Set(journals.map(j => j.date));
    const earliestDateStr = journals.reduce((min, j) => j.date < min ? j.date : min, journals[0].date);
    const earliestDate = new Date(earliestDateStr);

    const today = new Date();
    let targetDateStr = null;

    // Scan backwards from yesterday to find the first missing date
    const scanDate = new Date(today);
    scanDate.setDate(scanDate.getDate() - 1);

    while (scanDate >= earliestDate) {
      const dateStr = scanDate.toISOString().split("T")[0];
      if (!journalDates.has(dateStr) && !recoveredDates.includes(dateStr)) {
        targetDateStr = dateStr;
        break;
      }
      scanDate.setDate(scanDate.getDate() - 1);
    }

    if (!targetDateStr) {
      throw new Error("Không tìm thấy ngày nào bị gián đoạn cần hồi phục.");
    }

    meta.recoveredDates = [...recoveredDates, targetDateStr];
    meta.streakRecoveriesLeft -= 1;
    MetaDB.updateMeta(meta);

    return {
      success: true,
      recoveredDate: targetDateStr,
      streakRecoveriesLeft: meta.streakRecoveriesLeft,
    };
  },

  /**
   * Fetch future letters list.
   * @returns {Promise<Array<Object>>}
   */
  getLetters: async () => {
    try {
      const list = await IDB.getAll("letters");
      return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch (e) {
      console.error("[EPIONARA DB Error] Lỗi đọc sj_letters từ IndexedDB:", e);
      return [];
    }
  },

  /**
   * Write a new future letter.
   * @param {Object} letter
   * @returns {Promise<Array<Object>>}
   */
  addLetter: async (letter) => {
    const all = await DB.getLetters();
    const timestamp = Date.now();
    const id = String(timestamp);
    const newLetter = { ...letter, id, createdAt: timestamp };
    await IDB.put("letters", newLetter);
    return [newLetter, ...all];
  },

  /**
   * Update letter properties.
   * @param {string} id
   * @param {Object} changes
   * @returns {Promise<Array<Object>>}
   */
  updateLetter: async (id, changes) => {
    const all = await DB.getLetters();
    const letter = all.find((l) => String(l.id) === String(id));
    if (letter) {
      const updatedLetter = { ...letter, ...changes };
      await IDB.put("letters", updatedLetter);
      return all.map((l) => (String(l.id) === String(id) ? updatedLetter : l));
    }
    return all;
  },

  /**
   * Fetch garden data.
   * @returns {Promise<{isWatered: boolean, quests: Array, xp: number}>}
   */
  getGarden: async () => {
    try {
      return {
        isWatered: SyncStorage.get("sj_garden_water") === new Date().toDateString(),
        quests: SyncStorage.get("sj_garden_quests", []),
        xp: +SyncStorage.get("sj_garden_xp", 0),
      };
    } catch {
      return { isWatered: false, quests: [], xp: 0 };
    }
  },

  /**
   * Save garden state.
   * @param {{isWatered: boolean, quests: Array, xp: number}} garden
   * @returns {Promise<void>}
   */
  saveGarden: async (garden) => {
    if (garden.isWatered) SyncStorage.set("sj_garden_water", new Date().toDateString());
    SyncStorage.set("sj_garden_quests", garden.quests || []);
    SyncStorage.set("sj_garden_xp", String(garden.xp || 0));
  },

  /**
   * Reward garden experience points and complete quest.
   * @param {number} amt
   * @param {number|null} [questIdx=null]
   * @returns {Promise<void>}
   */
  rewardXP: async (amt, questIdx = null) => {
    const currentXp = +SyncStorage.get("sj_garden_xp", 0);
    SyncStorage.set("sj_garden_xp", String(currentXp + amt));

    if (questIdx !== null) {
      try {
        const quests = SyncStorage.get("sj_garden_quests", []);
        if (!quests.includes(questIdx)) {
          quests.push(questIdx);
          SyncStorage.set("sj_garden_quests", quests);
        }
      } catch (e) {
        console.error("EPIONARA Garden Error:", e);
      }
    }

    if (amt >= 20) {
      SyncStorage.set("sj_garden_water", new Date().toDateString());
    }
  },

  /**
   * Fetch all CBT thought records.
   * @returns {Promise<Array<Object>>}
   */
  getCbtRecords: async () => {
    return cbtRepository.getAll();
  },

  /**
   * Save a single CBT thought record.
   * @param {Object} record
   * @returns {Promise<Array<Object>>}
   */
  addCbtRecord: async (record) => {
    await cbtRepository.save(record);
    return cbtRepository.getAll();
  },

  /**
   * Delete a CBT thought record.
   * @param {string} id
   * @returns {Promise<Array<Object>>}
   */
  deleteCbtRecord: async (id) => {
    await cbtRepository.delete(id);
    return cbtRepository.getAll();
  },
};

/**
 * User Store Wrapper (Delegates to userRepository)
 */
export const UserStore = {
  /**
   * Get all registered users.
   * @returns {Promise<import("./types").User[]>}
   */
  getUsers: async () => {
    return userRepository.getAll();
  },

  /**
   * Save all users.
   * @param {import("./types").User[]} users
   * @returns {Promise<void>}
   */
  saveUsers: async (users) => {
    await userRepository.save(users);
  },

  /**
   * Get the active session details.
   * @returns {Promise<import("./types").User | null>}
   */
  getSession: async () => {
    try {
      const raw = sessionStorage.getItem("sj_user") || localStorage.getItem("sj_user");
      if (!raw) return null;

      const userKey = await getEncryptionKey();
      let decrypted = null;
      if (userKey) {
        decrypted = await decryptData(raw, userKey);
      }
      if (decrypted === null) {
        decrypted = await decryptData(raw);
      }
      if (decrypted === null) return null;

      let parsed;
      try {
        parsed = JSON.parse(decrypted);
      } catch {
        parsed = decrypted;
      }

      if (parsed && typeof parsed === "object" && parsed.user) {
        const expiresAt = parsed.sessionExpiresAt || parsed.savedAt + 24 * 60 * 60 * 1000;
        if (Date.now() > expiresAt) {
          console.info("[UserStore] Session expired");
          sessionStorage.removeItem("sj_user");
          localStorage.removeItem("sj_user");
          clearEncryptionKey();
          return null;
        }
        return parsed.user;
      }
      return parsed;
    } catch (e) {
      console.error("[EPIONARA DB Error] Lỗi đọc sj_user:", e);
      return null;
    }
  },

  /**
   * Save a user session.
   * @param {import("./types").User} user
   * @param {boolean|null} [rememberMe=null]
   * @returns {Promise<void>}
   */
  saveSession: async (user, rememberMe = null) => {
    let finalRememberMe = rememberMe;
    if (finalRememberMe === null) {
      try {
        const raw = sessionStorage.getItem("sj_user") || localStorage.getItem("sj_user");
        if (raw) {
          const userKey = await getEncryptionKey();
          let decrypted = null;
          if (userKey) {
            decrypted = await decryptData(raw, userKey);
          }
          if (decrypted === null) {
            decrypted = await decryptData(raw);
          }
          if (decrypted) {
            const parsed = JSON.parse(decrypted);
            if (parsed && typeof parsed === "object" && "rememberMe" in parsed) {
              finalRememberMe = parsed.rememberMe;
            }
          }
        }
      } catch (e) {
        console.error("[UserStore] Error resolving previous rememberMe state:", e);
      }
    }
    if (finalRememberMe === null) {
      finalRememberMe = true;
    }

    const generateSessionToken = () => {
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    };

    const sessionData = {
      user,
      token: generateSessionToken(),
      savedAt: Date.now(),
      sessionExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
      rememberMe: finalRememberMe,
    };

    const userKey = await getEncryptionKey();
    const targetKey = userKey || (await getDeviceKey());
    const encrypted = await encryptData(JSON.stringify(sessionData), targetKey);

    if (finalRememberMe) {
      localStorage.setItem("sj_user", encrypted);
      sessionStorage.removeItem("sj_user");
    } else {
      sessionStorage.setItem("sj_user", encrypted);
      localStorage.removeItem("sj_user");
    }

    // Persist or clean up encrypted password-derived user key in localStorage based on rememberMe
    if (finalRememberMe) {
      const activeId = user.id;
      const base64 = sessionStorage.getItem("sj_user_key_base64_" + activeId) || sessionStorage.getItem("sj_user_key_base64");
      if (base64) {
        const deviceKey = await getDeviceKey();
        const encryptedKey = await encryptData(base64, deviceKey);
        if (encryptedKey) {
          localStorage.setItem("sj_user_key_encrypted_" + activeId, encryptedKey);
          localStorage.setItem("sj_user_key_encrypted", encryptedKey);
        }
      }
    } else {
      localStorage.removeItem("sj_user_key_encrypted_" + user.id);
      localStorage.removeItem("sj_user_key_encrypted");
    }
  },

  /**
   * Clear active user session.
   * @returns {Promise<void>}
   */
  clearSession: async () => {
    try {
      sessionStorage.removeItem("sj_user");
      localStorage.removeItem("sj_user");
      const activeId = localStorage.getItem("sj_active_id");
      if (activeId) {
        localStorage.removeItem("sj_user_key_encrypted_" + activeId);
      }
      localStorage.removeItem("sj_user_key_encrypted");
      localStorage.removeItem("sj_active_id");
      clearEncryptionKey();
    } catch (e) {
      console.error("[EPIONARA DB Error] Lỗi xóa sj_user:", e);
    }
  },

  /**
   * Refresh session expiration.
   * @returns {Promise<void>}
   */
  refreshSession: async () => {
    try {
      const raw = sessionStorage.getItem("sj_user") || localStorage.getItem("sj_user");
      if (!raw) return;

      const userKey = await getEncryptionKey();
      let decrypted = null;
      if (userKey) {
        decrypted = await decryptData(raw, userKey);
      }
      if (decrypted === null) {
        decrypted = await decryptData(raw);
      }
      if (decrypted === null) return;

      const parsed = JSON.parse(decrypted);
      if (parsed && typeof parsed === "object" && parsed.user) {
        parsed.sessionExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
        parsed.savedAt = Date.now();

        const targetKey = userKey || (await getDeviceKey());
        const encrypted = await encryptData(JSON.stringify(parsed), targetKey);

        if (parsed.rememberMe) {
          localStorage.setItem("sj_user", encrypted);
        } else {
          sessionStorage.setItem("sj_user", encrypted);
        }
        console.info("[UserStore] Session refreshed successfully");
      }
    } catch (e) {
      console.error("[UserStore] Failed to refresh session:", e);
    }
  },

  /**
   * Set dynamic verification OTP.
   * @param {string} key
   * @param {string} otp
   */
  setOTP: async (key, otp) => {
    await secureSet(`sj_otp_${key}`, { otp, ts: Date.now() });
  },

  /**
   * Retrieve dynamic verification OTP.
   * @param {string} key
   * @returns {Promise<string|null>}
   */
  getOTP: async (key) => {
    try {
      const data = await secureGet(`sj_otp_${key}`);
      if (data && Date.now() - data.ts < 300000) return data.otp;
      return null;
    } catch (e) {
      console.error(`[EPIONARA DB Error] Lỗi đọc OTP cho ${key}:`, e);
      return null;
    }
  },

  /**
   * Clear authentication OTP.
   * @param {string} key
   */
  clearOTP: async (key) => {
    try {
      secureRemove(`sj_otp_${key}`);
    } catch (e) {
      console.error(`[EPIONARA DB Error] Lỗi xóa OTP ${key}:`, e);
    }
  },

  /**
   * Log login events.
   * @param {string} userId
   * @param {Object} entry
   */
  addHistory: (userId, entry) => {
    try {
      const key = `sj_history_${userId}`;
      const all = JSON.parse(localStorage.getItem(key) || "[]");
      const updated = [{ ...entry, id: Date.now(), ts: Date.now() }, ...all].slice(0, 50);
      safeSetItem(key, JSON.stringify(updated));
    } catch (e) {
      console.error(`[EPIONARA DB Error] Lỗi thêm lịch sử đăng nhập cho ${userId}:`, e);
    }
  },

  /**
   * Retrieve login history.
   * @param {string} userId
   * @returns {Array}
   */
  getHistory: (userId) => {
    try {
      return JSON.parse(localStorage.getItem(`sj_history_${userId}`) || "[]");
    } catch (e) {
      console.error(`[EPIONARA DB Error] Lỗi đọc lịch sử đăng nhập cho ${userId}:`, e);
      return [];
    }
  },

  /**
   * Wipe login history logs.
   * @param {string} userId
   */
  clearHistory: (userId) => {
    try {
      localStorage.removeItem(`sj_history_${userId}`);
    } catch (e) {
      console.error(`[EPIONARA DB Error] Lỗi xóa lịch sử đăng nhập ${userId}:`, e);
    }
  },
};

/**
 * Account Store for multi-login.
 */
export const AccountStore = {
  /**
   * Fetch all registered device accounts.
   * @returns {Array}
   */
  getAccounts: () => {
    try {
      return JSON.parse(localStorage.getItem("sj_accounts") || "[]");
    } catch (e) {
      console.error("[EPIONARA DB Error] Lỗi đọc sj_accounts:", e);
      return [];
    }
  },

  /**
   * Save active accounts array.
   * @param {Array} list
   */
  saveAccounts: (list) => {
    safeSetItem("sj_accounts", JSON.stringify(list));
  },

  /**
   * Register device profile profile.
   * @param {import("./types").User} user
   */
  addAccount: (user) => {
    const list = AccountStore.getAccounts();
    if (!list.find((a) => a.id === user.id)) {
      list.push({
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        phone: user.phone,
      });
      AccountStore.saveAccounts(list);
    }
  },

  /**
   * Wipe registered account profile.
   * @param {string} id
   */
  removeAccount: (id) => {
    AccountStore.saveAccounts(AccountStore.getAccounts().filter((a) => a.id !== id));
    localStorage.removeItem("sj_user_key_encrypted_" + id);
    const activeId = localStorage.getItem("sj_active_id");
    if (String(activeId) === String(id)) {
      localStorage.removeItem("sj_active_id");
      localStorage.removeItem("sj_user");
      localStorage.removeItem("sj_user_key_encrypted");
      sessionStorage.removeItem("sj_user");
    }
  },

  /**
   * Get active account identifier.
   * @returns {string|null}
   */
  getActive: () => {
    try {
      return JSON.parse(localStorage.getItem("sj_active_id") || "null");
    } catch (e) {
      console.error("[EPIONARA DB Error] Lỗi đọc sj_active_id:", e);
      return null;
    }
  },

  /**
   * Save active account identifier.
   * @param {string} id
   */
  saveActive: (id) => {
    safeSetItem("sj_active_id", String(id));
  },

  /**
   * Set active account alias.
   * @param {string} id
   */
  setActive: (id) => {
    AccountStore.saveActive(id);
  },
};

/**
 * Capture browser configuration statistics.
 * @returns {string}
 */
export function getDeviceInfo() {
  const ua = navigator.userAgent;
  const browser = ua.includes("Chrome")
    ? "Chrome"
    : ua.includes("Firefox")
    ? "Firefox"
    : ua.includes("Safari")
    ? "Safari"
    : ua.includes("Edge")
    ? "Edge"
    : "Unknown";
  const os = ua.includes("Windows")
    ? "Windows"
    : ua.includes("Mac")
    ? "macOS"
    : ua.includes("iPhone")
    ? "iPhone"
    : ua.includes("Android")
    ? "Android"
    : ua.includes("Linux")
    ? "Linux"
    : "Unknown";
  return `${browser} / ${os}`;
}

// Re-export generateOTP
export { generateSecureOTP as generateOTP };

/**
 * Initialize mood tables.
 * @returns {Promise<import("./types").Journal[]>}
 */
export async function loadMoods() {
  const stored = await DB.getJournals();
  if (stored.length > 0) return stored;

  const seed = [];
  const now = new Date();
  const baseScores = [6, 5, 7, 4, 6, 7, 5, 6, 4, 3, 5, 6, 7, 6, 5];
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - (13 - i));
    const entry = {
      id: `${d.toISOString().split("T")[0]}_${d.getTime()}`,
      date: d.toISOString().split("T")[0],
      score: baseScores[i] || 5,
      note: "",
      sleep: Math.floor(Math.random() * 4) + 6, // 6 to 9 hours
      activity: Math.floor(Math.random() * 4) * 20 + 20, // 20 to 80 mins
      hydration: Math.floor(Math.random() * 6) + 4, // 4 to 9 cups
      ts: d.getTime(),
    };
    seed.push(entry);
    await IDB.put("journals", entry);
  }
  return seed;
}

/**
 * Backup profile data as JSON.
 * @returns {Promise<void>}
 */
export async function exportDataAsJSON() {
  const data = {
    exportedAt: new Date().toISOString(),
    version: "2.0",
    journals: await DB.getJournals(),
    aiHistory: await DB.getAIHistory(),
    testResults: await DB.getTestResults(),
    growthSnapshots: await DB.getGrowthSnapshots(),
    letters: await DB.getLetters(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `epionara-data-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export mood records to CSV.
 * @returns {Promise<void>}
 */
export async function exportDataAsCSV() {
  const journals = await DB.getJournals();
  if (!journals.length) return;

  const headers = ["Date", "Score", "Mood", "Note"];
  const moodLabels = ["Rất tệ", "Buồn", "Khó chịu", "Bình thường", "Ổn", "Vui", "Rất vui", "Tuyệt vời"];
  const rows = journals.map((j) => [
    j.date,
    j.score || "",
    moodLabels[j.score - 1] || "",
    `"${(j.note || "").replace(/"/g, '""')}"`,
  ]);

  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `epionara-journals-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
