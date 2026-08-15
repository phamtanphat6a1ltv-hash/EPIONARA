// =================== INDEXEDDB WRAPPER ===================
const DB_NAME = "EpionaraDB";
const DB_VERSION = 3;
const STORES = {
  journals: { keyPath: "id", indexes: [{ name: "date", keyPath: "date" }] },
  aiHistory: { keyPath: "id" },
  letters: { keyPath: "id" },
  cbtRecords: { keyPath: "id" },
};

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      Object.entries(STORES).forEach(([name, config]) => {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, { keyPath: config.keyPath });
          config.indexes?.forEach(idx => store.createIndex(idx.name, idx.keyPath));
        }
      });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const IDB = {
  async getAll(storeName) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },
  async put(storeName, item, fromSync = false) {
    if (item && !item.ts) {
      item.ts = Date.now();
    }
    const db = await openDB();
    const result = await new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    // Kích hoạt đồng bộ hóa nền
    if (!fromSync && ["journals", "aiHistory", "letters", "cbtRecords"].includes(storeName)) {
      import("./syncManager").then(({ SyncManager }) => {
        SyncManager.queueSync(storeName, item.id, "upsert", item);
      }).catch(err => console.warn("[IDB] Lỗi gọi đồng bộ:", err));
    }

    return result;
  },
  async delete(storeName, id, fromSync = false) {
    const db = await openDB();
    const result = await new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    // Kích hoạt đồng bộ hóa nền cho thao tác xóa
    if (!fromSync && ["journals", "aiHistory", "letters", "cbtRecords"].includes(storeName)) {
      import("./syncManager").then(({ SyncManager }) => {
        SyncManager.queueSync(storeName, id, "delete");
      }).catch(err => console.warn("[IDB] Lỗi gọi đồng bộ khi xóa:", err));
    }

    return result;
  },
  async clear(storeName) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },
  async getByIndex(storeName, indexName, value) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      const req = index.getAll(value);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },
};

// Migration: chạy một lần, chuyển localStorage → IndexedDB
export async function migrateFromLocalStorage() {
  try {
    const migrated = localStorage.getItem("sj_idb_migrated_v2");
    if (migrated) return;

    const journals = JSON.parse(localStorage.getItem("sj_journals") || "[]");
    const aiHistory = JSON.parse(localStorage.getItem("sj_ai_history") || "[]");
    const letters = JSON.parse(localStorage.getItem("sj_letters") || "[]");
    const cbtRecords = JSON.parse(localStorage.getItem("sj_cbt_records") || "[]");

    console.info(`[IDB Migration] Migrating data: ${journals.length} journals, ${aiHistory.length} AI items, ${letters.length} letters, ${cbtRecords.length} CBT records`);

    for (const j of journals) {
      if (!j.id) j.id = `${j.date}_${j.ts || Date.now()}`;
      await IDB.put("journals", j, true);
    }
    for (const h of aiHistory) {
      if (!h.id) h.id = String(h.ts || Date.now());
      await IDB.put("aiHistory", h, true);
    }
    for (const l of letters) {
      if (!l.id) l.id = String(l.id || l.createdAt || Date.now());
      await IDB.put("letters", l, true);
    }
    for (const c of cbtRecords) {
      if (!c.id) c.id = String(c.ts || Date.now());
      await IDB.put("cbtRecords", c, true);
    }

    localStorage.setItem("sj_idb_migrated_v2", "1");
    // Không xóa localStorage cũ ngay — giữ làm backup
    console.info("[IDB Migration] Hoàn tất chuyển dữ liệu sang IndexedDB bao gồm cả CBT.");
  } catch (err) {
    console.error("[IDB Migration] Lỗi di trú dữ liệu:", err);
  }
}

