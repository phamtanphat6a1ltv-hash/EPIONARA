// =================== SECURE STORAGE LAYER ===================
// Wrapper cho localStorage với encryption cho dữ liệu nhạy cảm

import { encryptData, decryptData, getDeviceKey, getEncryptionKey } from "./crypto";
import { nativeToast } from "./nativeToast.js";

const getStorageFullMessage = () => {
  const lang = localStorage.getItem("sj_lang") || "vi";
  const msgs = {
    vi: "Bộ nhớ trình duyệt đã đầy. Vui lòng xóa bớt dữ liệu.",
    en: "Browser storage is full. Please clear some data.",
    ja: "ブラウザのストレージがいっぱいです。データを削除してください。",
    ko: "브라우저 저장 공간이 가득 찼습니다. 일부 데이터를 삭제해 주세요.",
    zh: "浏览器存储已满。请清理一些数据。",
    fr: "Stockage du navigateur plein. Veuillez libérer de l'espace."
  };
  return msgs[lang] || msgs[lang.split("_")[0]] || msgs.en;
};


const SENSITIVE_KEYS = new Set([
  "sj_all_users",
  "sj_user",
  "sj_accounts",
  "sj_active_id",
  "sj_journals",
  "sj_ai_history",
  "sj_test_results",
  "sj_future_letters",
  "sj_growth_snaps",
  "sj_cbt_records"
]);

const USER_SPECIFIC_KEYS = new Set([
  "sj_user",
  "sj_test_results",
  "sj_future_letters",
  "sj_growth_snaps",
  "sj_cbt_records",
  "sj_garden_water",
  "sj_garden_quests",
  "sj_garden_xp",
  "sj_meta_stats"
]);

const SESSION_ONLY_KEYS_PREFIX = "sj_otp_";

/**
 * Saves a key-value pair securely. If the key is sensitive, the value is encrypted.
 * If the key prefix indicates a session key, it is saved in sessionStorage.
 * @param {string} key - The unique storage identifier.
 * @param {any} value - The content/object to save.
 * @returns {Promise<void>}
 */
export async function secureSet(key, value) {
  try {
    if (key.startsWith(SESSION_ONLY_KEYS_PREFIX)) {
      const serialized = typeof value === "string" ? value : JSON.stringify(value);
      const targetKey = await getDeviceKey();
      const encrypted = await encryptData(serialized, targetKey);
      sessionStorage.setItem(key, encrypted);
      return;
    }

    const activeId = localStorage.getItem("sj_active_id");
    const storageKey = (USER_SPECIFIC_KEYS.has(key) && activeId) ? `${key}_${activeId}` : key;

    if (SENSITIVE_KEYS.has(key)) {
      const serialized = typeof value === "string" ? value : JSON.stringify(value);
      // Resolve user key if user-specific, otherwise fall back to device key
      const userKey = USER_SPECIFIC_KEYS.has(key) ? await getEncryptionKey() : null;
      const targetKey = userKey || await getDeviceKey();
      
      const encrypted = await encryptData(serialized, targetKey);
      localStorage.setItem(storageKey, encrypted);
    } else {
      localStorage.setItem(storageKey, JSON.stringify(value));
    }
  } catch (e) {
    if (e.name === "QuotaExceededError") {
      console.error("[SecureStorage] Quota exceeded:", key);
      nativeToast(getStorageFullMessage(), "error");
    } else {
      console.error("[SecureStorage] Error saving:", key, e);
    }
  }
}

/**
 * Retrieves a key's value securely. Decrypts it if the key is marked as sensitive.
 * @param {string} key - The unique storage identifier.
 * @param {any} [defaultValue=null] - The fallback value if key does not exist.
 * @returns {Promise<any>} The decrypted/parsed object, or defaultValue if error or non-existent.
 */
export async function secureGet(key, defaultValue = null) {
  try {
    if (key.startsWith(SESSION_ONLY_KEYS_PREFIX)) {
      const raw = sessionStorage.getItem(key);
      if (!raw) return defaultValue;
      const deviceKey = await getDeviceKey();
      const decrypted = await decryptData(raw, deviceKey);
      if (decrypted === null) return defaultValue;
      try { return JSON.parse(decrypted); } catch { return decrypted; }
    }

    const activeId = localStorage.getItem("sj_active_id");
    const storageKey = (USER_SPECIFIC_KEYS.has(key) && activeId) ? `${key}_${activeId}` : key;

    let raw = localStorage.getItem(storageKey);
    // Fallback: if user-specific key with suffix doesn't exist, try loading the non-suffixed version
    if (raw === null && USER_SPECIFIC_KEYS.has(key) && activeId) {
      raw = localStorage.getItem(key);
    }

    if (raw === null) return defaultValue;

    if (SENSITIVE_KEYS.has(key)) {
      let decrypted = null;
      const userKey = USER_SPECIFIC_KEYS.has(key) ? await getEncryptionKey() : null;

      // 1. Try to decrypt using the active user-specific password-derived key
      if (userKey) {
        decrypted = await decryptData(raw, userKey);
      }

      // 2. Fallback to device key
      if (decrypted === null) {
        const deviceKey = await getDeviceKey();
        decrypted = await decryptData(raw, deviceKey);
      }

      if (decrypted === null) return defaultValue;

      // Nếu value được lưu là JSON string, parse nó
      try { return JSON.parse(decrypted); } catch { return decrypted; }
    }

    return JSON.parse(raw) ?? defaultValue;
  } catch (e) {
    console.error("[SecureStorage] Error reading:", key, e);
    return defaultValue;
  }
}

/**
 * Removes a key-value pair from storage.
 * @param {string} key - The unique storage identifier to remove.
 */
export function secureRemove(key) {
  if (key.startsWith(SESSION_ONLY_KEYS_PREFIX)) {
    sessionStorage.removeItem(key);
  } else {
    const activeId = localStorage.getItem("sj_active_id");
    const storageKey = (USER_SPECIFIC_KEYS.has(key) && activeId) ? `${key}_${activeId}` : key;
    localStorage.removeItem(storageKey);
  }
}

/**
 * Synchronous non-sensitive localStorage wrapper.
 */
export const SyncStorage = {
  /**
   * Retrieves a non-sensitive item.
   * @param {string} key - Storage key.
   * @param {any} [defaultValue=null] - Fallback value.
   * @returns {any} Parsed value or defaultValue.
   */
  get(key, defaultValue = null) {
    try {
      const activeId = localStorage.getItem("sj_active_id");
      const storageKey = (USER_SPECIFIC_KEYS.has(key) && activeId) ? `${key}_${activeId}` : key;
      let raw = localStorage.getItem(storageKey);
      if (raw === null && USER_SPECIFIC_KEYS.has(key) && activeId) {
        raw = localStorage.getItem(key);
      }
      return raw !== null ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  /**
   * Saves a non-sensitive item.
   * @param {string} key - Storage key.
   * @param {any} value - Value to save.
   */
  set(key, value) {
    try {
      const activeId = localStorage.getItem("sj_active_id");
      const storageKey = (USER_SPECIFIC_KEYS.has(key) && activeId) ? `${key}_${activeId}` : key;
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (e) {
      if (e.name === "QuotaExceededError") {
        console.error("[Storage] Quota exceeded:", key);
        nativeToast(getStorageFullMessage(), "error");
      }
    }
  },

  /**
   * Removes a non-sensitive item.
   * @param {string} key - Storage key.
   */
  remove(key) {
    const activeId = localStorage.getItem("sj_active_id");
    const storageKey = (USER_SPECIFIC_KEYS.has(key) && activeId) ? `${key}_${activeId}` : key;
    localStorage.removeItem(storageKey);
  }
};

