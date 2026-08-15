import { IndexedDbAdapter } from "./storageAdapter.js";

const storeName = "aiHistory";

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
    console.error("[aiRepository] Lỗi lưu sj_meta_stats:", e);
  }
}

/**
 * Repository for AI Analysis entries.
 */
export const aiRepository = {
  /**
   * Get all AI history entries, sorted by timestamp descending.
   * @param {import("./storageAdapter").StorageAdapter} [adapter=IndexedDbAdapter]
   * @returns {Promise<import("../utils/types").AIAnalysis[]>}
   */
  getAll: async (adapter = IndexedDbAdapter) => {
    const list = await adapter.getAll(storeName);
    return list.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  },

  /**
   * Get AI history entry by ID.
   * @param {string} id
   * @param {import("./storageAdapter").StorageAdapter} [adapter=IndexedDbAdapter]
   * @returns {Promise<import("../utils/types").AIAnalysis | null>}
   */
  getById: async (id, adapter = IndexedDbAdapter) => {
    return adapter.getById(storeName, id);
  },

  /**
   * Save a single AI Analysis entry. Truncates database to 200 items max.
   * @param {import("../utils/types").AIAnalysis} entry
   * @param {import("./storageAdapter").StorageAdapter} [adapter=IndexedDbAdapter]
   * @returns {Promise<any>} The saved entry
   */
  save: async (entry, adapter = IndexedDbAdapter) => {
    const all = await aiRepository.getAll(adapter);
    const timestamp = Date.now();
    const id = entry.id || String(timestamp);
    const newEntry = { ...entry, id, ts: entry.ts || timestamp };

    await adapter.save(storeName, newEntry);
    let updated = [newEntry, ...all];

    // Truncate to max 200
    if (updated.length > 200) {
      const toKeep = updated.slice(0, 200);
      const toDelete = updated.slice(200);
      for (const item of toDelete) {
        await adapter.delete(storeName, item.id);
      }
      updated = toKeep;
    }

    const meta = getMetaStats();
    const isPos = (entry.result?.positive || 0) >= 60;
    updateMetaStats({
      totalAiCount: updated.length,
      posAiCount: isPos ? meta.posAiCount + 1 : meta.posAiCount,
    });

    return newEntry;
  },

  /**
   * Delete AI analysis entry by ID.
   * @param {string} id
   * @param {import("./storageAdapter").StorageAdapter} [adapter=IndexedDbAdapter]
   * @returns {Promise<void>}
   */
  delete: async (id, adapter = IndexedDbAdapter) => {
    await adapter.delete(storeName, id);
    const all = await aiRepository.getAll(adapter);
    updateMetaStats({ totalAiCount: all.length });
  },

  /**
   * Clear all AI history entries.
   * @param {import("./storageAdapter").StorageAdapter} [adapter=IndexedDbAdapter]
   * @returns {Promise<void>}
   */
  clear: async (adapter = IndexedDbAdapter) => {
    await adapter.clear(storeName);
    updateMetaStats({ totalAiCount: 0, posAiCount: 0 });
  },
};
