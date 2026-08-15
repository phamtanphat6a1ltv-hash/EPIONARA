import { SecureStorageAdapter } from "./storageAdapter.js";

const keyName = "sj_all_users";

/**
 * Repository for User account management.
 */
export const userRepository = {
  /**
   * Get all registered users from secure storage.
   * @param {import("./storageAdapter").StorageAdapter} [adapter=SecureStorageAdapter]
   * @returns {Promise<import("../utils/types").User[]>}
   */
  getAll: async (adapter = SecureStorageAdapter) => {
    const data = await adapter.getAll(keyName);
    return Array.isArray(data)
      ? data.map((u) => ({
          plan_type: "FREE",
          subscription_expires_at: null,
          payment_customer_id: "",
          ...u,
        }))
      : [];
  },

  /**
   * Get a registered user by their ID.
   * @param {string} id
   * @param {import("./storageAdapter").StorageAdapter} [adapter=SecureStorageAdapter]
   * @returns {Promise<import("../utils/types").User | null>}
   */
  getById: async (id, adapter = SecureStorageAdapter) => {
    const all = await userRepository.getAll(adapter);
    return all.find((u) => String(u.id) === String(id)) || null;
  },

  /**
   * Save a user account. Updates the user details if existing, else inserts a new account.
   * If an array is passed, overrides the whole user base.
   * @param {import("../utils/types").User | import("../utils/types").User[]} user
   * @param {import("./storageAdapter").StorageAdapter} [adapter=SecureStorageAdapter]
   * @returns {Promise<any>} The saved item
   */
  save: async (user, adapter = SecureStorageAdapter) => {
    if (Array.isArray(user)) {
      const mapped = user.map((u) => ({
        plan_type: "FREE",
        subscription_expires_at: null,
        payment_customer_id: "",
        ...u,
      }));
      await adapter.save(keyName, mapped);
      return mapped;
    }

    const all = await userRepository.getAll(adapter);
    const existingIndex = all.findIndex((u) => String(u.id) === String(user.id));
    const finalUser = {
      plan_type: "FREE",
      subscription_expires_at: null,
      payment_customer_id: "",
      ...user,
    };
    if (existingIndex !== -1) {
      all[existingIndex] = { ...all[existingIndex], ...finalUser };
    } else {
      all.push(finalUser);
    }
    await adapter.save(keyName, all);
    return finalUser;
  },

  /**
   * Delete user by ID from secure storage.
   * @param {string} id
   * @param {import("./storageAdapter").StorageAdapter} [adapter=SecureStorageAdapter]
   * @returns {Promise<void>}
   */
  delete: async (id, adapter = SecureStorageAdapter) => {
    const all = await userRepository.getAll(adapter);
    const filtered = all.filter((u) => String(u.id) !== String(id));
    await adapter.save(keyName, filtered);
  },

  /**
   * Clear all user profiles.
   * @param {import("./storageAdapter").StorageAdapter} [adapter=SecureStorageAdapter]
   * @returns {Promise<void>}
   */
  clear: async (adapter = SecureStorageAdapter) => {
    await adapter.clear(keyName);
  },
};
