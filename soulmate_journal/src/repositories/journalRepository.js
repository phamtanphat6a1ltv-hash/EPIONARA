import { IndexedDbAdapter } from "./storageAdapter.js";

const storeName = "journals";

/**
 * Helper: Read meta statistics from localStorage.
 * @returns {{totalJournals: number, totalAiCount: number, posAiCount: number}}
 */
function getMetaStats() {
  try {
    const meta = localStorage.getItem("sj_meta_stats");
    return meta ? JSON.parse(meta) : { totalJournals: 0, totalAiCount: 0, posAiCount: 0 };
  } catch {
    return { totalJournals: 0, totalAiCount: 0, posAiCount: 0 };
  }
}

/**
 * Helper: Save meta statistics to localStorage.
 * @param {Object} updates
 */
function updateMetaStats(updates) {
  try {
    const meta = getMetaStats();
    localStorage.setItem("sj_meta_stats", JSON.stringify({ ...meta, ...updates }));
  } catch (e) {
    console.error("[journalRepository] Lỗi lưu sj_meta_stats:", e);
  }
}

/**
 * Repository for Journal entries.
 */
export const journalRepository = {
  /**
   * Get all journals, sorted by timestamp descending.
   * @param {import("./storageAdapter").StorageAdapter} [adapter=IndexedDbAdapter]
   * @returns {Promise<import("../utils/types").Journal[]>}
   */
  getAll: async (adapter = IndexedDbAdapter) => {
    const list = await adapter.getAll(storeName);
    return list.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  },

  /**
   * Get journal by ID.
   * @param {string} id
   * @param {import("./storageAdapter").StorageAdapter} [adapter=IndexedDbAdapter]
   * @returns {Promise<import("../utils/types").Journal | null>}
   */
  getById: async (id, adapter = IndexedDbAdapter) => {
    return adapter.getById(storeName, id);
  },

  /**
   * Add or overwrite journals. Handles array of journals or a single journal entry.
   * @param {import("../utils/types").Journal | import("../utils/types").Journal[]} entry
   * @param {import("./storageAdapter").StorageAdapter} [adapter=IndexedDbAdapter]
   * @returns {Promise<any>} Saved items or updated array
   */
  save: async (entry, adapter = IndexedDbAdapter) => {
    // If it's an array, overwrite the whole list (usually for data imports)
    if (Array.isArray(entry)) {
      await adapter.clear(storeName);
      for (const item of entry) {
        if (!item.id) item.id = `${item.date}_${item.ts || Date.now()}`;
        await adapter.save(storeName, item);
      }
      updateMetaStats({ totalJournals: entry.length });
      return entry;
    }

    // Adding or updating a single entry
    const all = await journalRepository.getAll(adapter);
    const today = new Date().toISOString().split("T")[0];
    const timestamp = Date.now();

    // Check if configuration allows multiple entries per day
    // We default to true to keep it aligned with original app context toggle
    const multipleEntriesPerDay = true;
    let updated;

    if (multipleEntriesPerDay) {
      const id = entry.id || `${today}_${timestamp}`;
      const newEntry = { ...entry, id, date: entry.date || today, ts: entry.ts || timestamp };
      await adapter.save(storeName, newEntry);
      updated = [newEntry, ...all];
    } else {
      const existingIdx = all.findIndex((x) => x.date === today);
      if (existingIdx !== -1) {
        const existing = all[existingIdx];
        const newEntry = { ...existing, ...entry, ts: timestamp };
        await adapter.save(storeName, newEntry);
        all[existingIdx] = newEntry;
        updated = [...all];
      } else {
        const id = entry.id || `${today}_${timestamp}`;
        const newEntry = { ...entry, id, date: entry.date || today, ts: entry.ts || timestamp };
        await adapter.save(storeName, newEntry);
        updated = [newEntry, ...all];
      }
    }

    // Keep size limit to 365 items
    if (updated.length > 365) {
      const toKeep = updated.slice(0, 365);
      const toDelete = updated.slice(365);
      for (const item of toDelete) {
        await adapter.delete(storeName, item.id);
      }
      updated = toKeep;
    }

    updateMetaStats({ totalJournals: updated.length });
    return updated;
  },

  /**
   * Delete journal by ID.
   * @param {string} id
   * @param {import("./storageAdapter").StorageAdapter} [adapter=IndexedDbAdapter]
   * @returns {Promise<void>}
   */
  delete: async (id, adapter = IndexedDbAdapter) => {
    await adapter.delete(storeName, id);
    const all = await journalRepository.getAll(adapter);
    updateMetaStats({ totalJournals: all.length });
  },

  /**
   * Clear all journals.
   * @param {import("./storageAdapter").StorageAdapter} [adapter=IndexedDbAdapter]
   * @returns {Promise<void>}
   */
  clear: async (adapter = IndexedDbAdapter) => {
    await adapter.clear(storeName);
    updateMetaStats({ totalJournals: 0 });
  },
};
