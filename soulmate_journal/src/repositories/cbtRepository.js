import { IndexedDbAdapter } from "./storageAdapter.js";

const storeName = "cbtRecords";

/**
 * Repository for CBT thought records.
 */
export const cbtRepository = {
  /**
   * Get all CBT records.
   * @param {import("./storageAdapter").StorageAdapter} [adapter=IndexedDbAdapter]
   * @returns {Promise<any[]>}
   */
  getAll: async (adapter = IndexedDbAdapter) => {
    const data = await adapter.getAll(storeName);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Save a single CBT record (insert or update).
   * @param {Object} record
   * @param {import("./storageAdapter").StorageAdapter} [adapter=IndexedDbAdapter]
   * @returns {Promise<any>} The saved item
   */
  save: async (record, adapter = IndexedDbAdapter) => {
    const all = await cbtRepository.getAll(adapter);
    const existingIndex = all.findIndex((r) => String(r.id) === String(record.id));
    let updatedRecord = { ...record, ts: record.ts || Date.now() };
    if (existingIndex !== -1) {
      all[existingIndex] = { ...all[existingIndex], ...updatedRecord };
    } else {
      all.push(updatedRecord);
    }
    await adapter.save(storeName, updatedRecord);
    return updatedRecord;
  },

  /**
   * Delete a CBT record by ID.
   * @param {string} id
   * @param {import("./storageAdapter").StorageAdapter} [adapter=IndexedDbAdapter]
   * @returns {Promise<void>}
   */
  delete: async (id, adapter = IndexedDbAdapter) => {
    await adapter.delete(storeName, id);
  },

  /**
   * Clear all CBT records.
   * @param {import("./storageAdapter").StorageAdapter} [adapter=IndexedDbAdapter]
   * @returns {Promise<void>}
   */
  clear: async (adapter = IndexedDbAdapter) => {
    await adapter.clear(storeName);
  },
};
