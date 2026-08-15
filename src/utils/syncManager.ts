// =================== OFFLINE-FIRST SYNC MANAGER ===================
import { SupabaseClient } from "./supabaseClient";
import { IDB } from "./idb.js";
import { encryptData, decryptData, getEncryptionKey } from "./crypto";
import { nativeToast } from "./nativeToast.js";

const QUEUE_KEY = "sj_sync_queue";

interface SyncQueueItem {
  storeName: string;
  recordId: string;
  action: 'upsert' | 'delete';
  recordData: any | null;
  userId: string;
  ts: number;
}

// Map từ Store Name cục bộ (IndexedDB) sang Table Name trên Supabase
const TABLE_MAP: Record<string, string> = {
  journals: "journals",
  aiHistory: "ai_history",
  letters: "letters",
  cbtRecords: "cbt_records"
};

export const SyncManager = {
  /**
   * Kiểm tra xem người dùng có đang đăng nhập và có khóa mã hóa đầu cuối không.
   */
  canSync: async (): Promise<boolean> => {
    if (!SupabaseClient.isEnabled()) return false;
    const activeId = localStorage.getItem("sj_active_id");
    if (!activeId) return false;
    const key = await getEncryptionKey();
    return !!key;
  },

  /**
   * Thêm một thao tác đồng bộ vào hàng đợi offline
   * @param storeName - Tên store cục bộ
   * @param recordId - ID bản ghi
   * @param action - Hành động thực hiện
   * @param recordData - Dữ liệu bản ghi (nếu có)
   */
  queueSync: async (
    storeName: string,
    recordId: string,
    action: 'upsert' | 'delete',
    recordData: any | null = null
  ): Promise<void> => {
    const activeId = localStorage.getItem("sj_active_id");
    if (!activeId) return;

    const queue: SyncQueueItem[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");

    // Loại bỏ các thao tác cũ hơn của cùng một bản ghi trong hàng đợi để tránh lặp
    const filteredQueue = queue.filter(
      item => !(item.storeName === storeName && item.recordId === recordId)
    );

    filteredQueue.push({
      storeName,
      recordId,
      action,
      recordData, // Lưu cục bộ để sync sau nếu cần
      userId: activeId,
      ts: Date.now()
    });

    localStorage.setItem(QUEUE_KEY, JSON.stringify(filteredQueue));

    // Nếu mạng online, thử đồng bộ hàng đợi lập tức
    if (navigator.onLine) {
      await SyncManager.processQueue();
    }
  },

  /**
   * Xử lý hàng đợi offline
   */
  processQueue: async (): Promise<void> => {
    if (!(await SyncManager.canSync())) return;
    if (!navigator.onLine) return;

    const queue: SyncQueueItem[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    if (queue.length === 0) return;

    console.info(`[SyncManager] Đang đồng bộ ${queue.length} thao tác trong hàng đợi offline...`);
    const activeId = localStorage.getItem("sj_active_id");
    const encryptionKey = await getEncryptionKey();

    const remaining: SyncQueueItem[] = [];

    for (const item of queue) {
      if (String(item.userId) !== String(activeId)) {
        remaining.push(item);
        continue;
      }

      const remoteTable = TABLE_MAP[item.storeName];
      if (!remoteTable) continue;

      try {
        if (item.action === "delete") {
          const ok = await SupabaseClient.deleteRecord(remoteTable, item.recordId);
          if (!ok) throw new Error("Delete failed");
        } else if (item.action === "upsert") {
          // Lấy dữ liệu mới nhất từ IndexedDB để tránh dữ liệu cũ trong queue
          let data = item.recordData;
          if (!data) {
            const list = await IDB.getAll(item.storeName);
            data = list.find((r: any) => String(r.id) === String(item.recordId));
          }

          if (data) {
            // E2EE Mã hóa toàn bộ dữ liệu trước khi đồng bộ
            const plainStr = JSON.stringify(data);
            const cipherText = await encryptData(plainStr, encryptionKey);

            const payload = {
              id: String(item.recordId),
              user_id: String(activeId),
              encrypted_data: cipherText,
              ts: data.ts || Date.now()
            };

            const ok = await SupabaseClient.upsertRecord(remoteTable, payload);
            if (!ok) throw new Error("Upsert failed");
          }
        }
      } catch (err: any) {
        console.warn(
          `[SyncManager] Thao tác đồng bộ cho ${item.storeName}:${item.recordId} thất bại, giữ lại hàng đợi:`,
          err.message
        );
        remaining.push(item);
      }
    }

    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  },

  /**
   * Đồng bộ hai chiều (Two-way Synchronization)
   */
  syncAll: async (silent: boolean = true): Promise<void> => {
    if (!(await SyncManager.canSync())) {
      if (!silent) nativeToast("Vui lòng đăng nhập để sử dụng tính năng đồng bộ đám mây.", "info");
      return;
    }
    if (!navigator.onLine) {
      if (!silent) nativeToast("Thiết bị đang offline. Không thể đồng bộ.", "warning");
      return;
    }

    // 1. Giải quyết hàng đợi offline trước
    await SyncManager.processQueue();

    const activeId = localStorage.getItem("sj_active_id") || "";
    const encryptionKey = await getEncryptionKey();
    let syncSuccessCount = 0;

    console.info("[SyncManager] Bắt đầu đồng bộ hai chiều...");

    for (const [storeName, remoteTable] of Object.entries(TABLE_MAP)) {
      try {
        // Lấy dữ liệu local và remote
        const localList = await IDB.getAll(storeName);
        const remoteList = await SupabaseClient.fetchRecords(remoteTable, activeId);

        const localMap = new Map<string, any>(localList.map((item: any) => [String(item.id), item]));
        const remoteMap = new Map<string, any>(remoteList.map((item: any) => [String(item.id), item]));

        // Tập hợp tất cả khóa ID độc bản
        const allIds = new Set([...localMap.keys(), ...remoteMap.keys()]);

        for (const id of allIds) {
          const localItem = localMap.get(id);
          const remoteItem = remoteMap.get(id);

          if (localItem && !remoteItem) {
            // Chỉ có ở local -> Đẩy lên Cloud
            const plainStr = JSON.stringify(localItem);
            const cipherText = await encryptData(plainStr, encryptionKey);

            await SupabaseClient.upsertRecord(remoteTable, {
              id: String(localItem.id),
              user_id: String(activeId),
              encrypted_data: cipherText,
              ts: localItem.ts || Date.now()
            });
            syncSuccessCount++;

          } else if (!localItem && remoteItem) {
            // Chỉ có ở Cloud -> Tải về local (Decrypt và lưu)
            try {
              const decrypted = await decryptData(remoteItem.encrypted_data, encryptionKey);
              if (decrypted) {
                const parsed = JSON.parse(decrypted);
                // Gán userId để nhất quán
                parsed.userId = String(activeId);
                await IDB.put(storeName, parsed);
                syncSuccessCount++;
              }
            } catch {
              console.warn(`[SyncManager] Giải mã bản ghi ${storeName}:${id} thất bại (có thể do sai khóa giải mã E2EE)`);
            }

          } else if (localItem && remoteItem) {
            // Có ở cả hai nơi -> So sánh nhãn thời gian (timestamp)
            const localTs = localItem.ts || 0;
            const remoteTs = remoteItem.ts || 0;

            if (localTs > remoteTs) {
              // Local mới hơn -> Đẩy lên Cloud
              const plainStr = JSON.stringify(localItem);
              const cipherText = await encryptData(plainStr, encryptionKey);

              await SupabaseClient.upsertRecord(remoteTable, {
                id: String(localItem.id),
                user_id: String(activeId),
                encrypted_data: cipherText,
                ts: localTs
              });
              syncSuccessCount++;

            } else if (remoteTs > localTs) {
              // Remote mới hơn -> Tải về local
              try {
                const decrypted = await decryptData(remoteItem.encrypted_data, encryptionKey);
                if (decrypted) {
                  const parsed = JSON.parse(decrypted);
                  parsed.userId = String(activeId);
                  await IDB.put(storeName, parsed);
                  syncSuccessCount++;
                }
              } catch {
                console.warn(`[SyncManager] Giải mã bản ghi ${storeName}:${id} thất bại`);
              }
            }
          }
        }
      } catch (err) {
        console.error(`[SyncManager] Lỗi đồng bộ cấu phần ${storeName}:`, err);
      }
    }

    if (syncSuccessCount > 0 && !silent) {
      nativeToast(`Đã đồng bộ thành công ${syncSuccessCount} bản ghi với Cloud E2EE.`, "success");
    } else if (!silent) {
      nativeToast("Dữ liệu của bạn đã được cập nhật mới nhất.", "success");
    }
    console.info("[SyncManager] Đồng bộ hai chiều hoàn tất.");
  }
};
