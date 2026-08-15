import { IDB } from "../utils/idb.js";
import { secureGet, secureSet, secureRemove } from "../utils/secureStorage.js";

/**
 * @typedef {Object} StorageAdapter
 * @property {function(string): Promise<any[]>} getAll
 * @property {function(string, string): Promise<any>} getById
 * @property {function(string, any): Promise<any>} save
 * @property {function(string, string): Promise<void>} delete
 * @property {function(string): Promise<void>} clear
 */

/**
 * Storage adapter implementation using IndexedDB (IDB wrapper).
 * Used for journals, aiHistory, and letters.
 * @type {StorageAdapter}
 */
export const IndexedDbAdapter = {
  getAll: async (storeName) => {
    const list = await IDB.getAll(storeName);
    const activeId = localStorage.getItem("sj_active_id");
    if (!activeId) return list;
    return list.filter(item => String(item.userId) === String(activeId) || !item.userId);
  },
  getById: async (storeName, id) => {
    const list = await IndexedDbAdapter.getAll(storeName);
    return list.find((item) => String(item.id) === String(id)) || null;
  },
  save: async (storeName, item) => {
    const activeId = localStorage.getItem("sj_active_id");
    const itemWithUser = activeId ? { ...item, userId: String(activeId) } : item;
    return IDB.put(storeName, itemWithUser);
  },
  delete: async (storeName, id) => {
    return IDB.delete(storeName, id);
  },
  clear: async (storeName) => {
    const activeId = localStorage.getItem("sj_active_id");
    if (!activeId) {
      return IDB.clear(storeName);
    }
    const all = await IDB.getAll(storeName);
    for (const item of all) {
      if (String(item.userId) === String(activeId) || !item.userId) {
        await IDB.delete(storeName, item.id);
      }
    }
  },
};


/**
 * Storage adapter implementation using standard LocalStorage.
 * Used for configurations, stats, garden data.
 * @type {StorageAdapter}
 */
export const LocalStorageAdapter = {
  getAll: async (key) => {
    try {
      const data = localStorage.getItem(key);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  },
  getById: async (key, id) => {
    try {
      const data = localStorage.getItem(key);
      if (!data) return null;
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.find((item) => String(item.id) === String(id)) || null;
      }
      return parsed[id] || null;
    } catch {
      return null;
    }
  },
  save: async (key, item) => {
    try {
      localStorage.setItem(key, typeof item === "string" ? item : JSON.stringify(item));
      return item;
    } catch (e) {
      throw e;
    }
  },
  delete: async (key, id) => {
    try {
      const data = localStorage.getItem(key);
      if (!data) return;
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter((item) => String(item.id) !== String(id));
        localStorage.setItem(key, JSON.stringify(filtered));
      } else if (parsed && typeof parsed === "object") {
        delete parsed[id];
        localStorage.setItem(key, JSON.stringify(parsed));
      }
    } catch (e) {
      throw e;
    }
  },
  clear: async (key) => {
    localStorage.removeItem(key);
  },
};

/**
 * Storage adapter implementation using encrypted SecureStorage.
 * Used for user accounts, passwords, profile details.
 * @type {StorageAdapter}
 */
export const SecureStorageAdapter = {
  getAll: async (key) => {
    try {
      const data = await secureGet(key);
      if (!data) return [];
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  },
  getById: async (key, id) => {
    try {
      const data = await secureGet(key);
      if (!data) return null;
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      if (Array.isArray(parsed)) {
        return parsed.find((item) => String(item.id) === String(id)) || null;
      }
      return parsed[id] || null;
    } catch {
      return null;
    }
  },
  save: async (key, item) => {
    try {
      const valStr = typeof item === "string" ? item : JSON.stringify(item);
      await secureSet(key, valStr);
      return item;
    } catch (e) {
      throw e;
    }
  },
  delete: async (key, id) => {
    try {
      const data = await secureGet(key);
      if (!data) return;
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter((item) => String(item.id) !== String(id));
        await secureSet(key, JSON.stringify(filtered));
      } else if (parsed && typeof parsed === "object") {
        delete parsed[id];
        await secureSet(key, JSON.stringify(parsed));
      }
    } catch (e) {
      throw e;
    }
  },
  clear: async (key) => {
    await secureRemove(key);
  },
};
