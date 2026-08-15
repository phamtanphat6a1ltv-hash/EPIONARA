import { encryptData, decryptData, getEncryptionKey } from "./crypto";
import { nativeToast } from "./nativeToast.js";

const SYNC_QUEUE_KEY = "sj_offline_sync_queue";

const getOfflineMessage = (key, param = null) => {
  const lang = localStorage.getItem("sj_lang") || "vi";
  const msgs = {
    vi: {
      offline_saved: "Đang ngoại tuyến. Nhật ký của bạn đã được mã hóa và lưu tạm thời.",
      syncing: `Phát hiện kết nối mạng. Đang tự động đồng bộ ${param} nhật ký chưa lưu...`,
      sync_success: "Đồng bộ dữ liệu ngoại tuyến thành công hoàn toàn!",
      sync_partial: `Đồng bộ hoàn tất. Còn ${param} bản ghi bị lỗi sẽ được thử lại sau.`,
      connection_lost: "Thiết bị mất mạng. Đã tự động chuyển sang chế độ hoạt động Ngoại tuyến."
    },
    en: {
      offline_saved: "Offline. Your journal has been encrypted and saved locally.",
      syncing: `Connection restored. Auto-syncing ${param} unsaved journals...`,
      sync_success: "Offline data fully synced successfully!",
      sync_partial: `Sync complete. ${param} failed records will be retried later.`,
      connection_lost: "Internet lost. Switched to offline-first mode automatically."
    },
    ja: {
      offline_saved: "オフラインです。ジャーナルは暗号化され、ローカルに一時保存されました。",
      syncing: `接続が回復しました。未同期のジャーナル ${param} 件を自動同期中...`,
      sync_success: "オフラインデータが完全に同期されました！",
      sync_partial: `同期完了。エラーの ${param} 件は後で再試行されます。`,
      connection_lost: "インターネット切断。自動的にオフラインファーストモードに切り替わりました。"
    },
    ko: {
      offline_saved: "오프라인 상태입니다. 일기가 암호화되어 기기에 임시 저장되었습니다.",
      syncing: `인터넷 연결 감지. 저장되지 않은 일기 ${param}개를 자동 동기화 중...`,
      sync_success: "오프라인 데이터 동기화 완료!",
      sync_partial: `동기화 완료. 오류가 발생한 ${param}개 항목은 나중에 다시 시도됩니다.`,
      connection_lost: "네트워크 끊김. 오프라인 모드로 자동 전환되었습니다."
    },
    zh: {
      offline_saved: "离线状态。您的日记已加密并临时保存在本地。",
      syncing: `检测到网络。正在自动同步 ${param} 篇未保存的日记...`,
      sync_success: "离线数据同步成功！",
      sync_partial: `同步完成。还有 ${param} 条错误记录将在稍后重试。`,
      connection_lost: "网络断开。已自动切换至离线模式。"
    },
    fr: {
      offline_saved: "Hors ligne. Votre journal a été chiffré et sauvegardé localement.",
      syncing: `Connexion détectée. Synchronisation de ${param} journaux...`,
      sync_success: "Données hors ligne entièrement synchronisées !",
      sync_partial: `Synchro terminée. ${param} erreurs seront retestées plus tard.`,
      connection_lost: "Connexion perdue. Passage automatique en mode hors ligne."
    }
  };
  
  const activeLang = (lang === "zh" || lang === "fr" || lang === "zh_fr") ? (lang === "fr" ? "fr" : "zh") : (["vi", "en", "ja", "ko"].includes(lang) ? lang : "vi");
  const dict = msgs[activeLang] || msgs.vi;
  return dict[key] || "";
};

/**
 * Lấy danh sách hàng đợi đồng bộ ngoại tuyến từ LocalStorage
 * @returns {Array<Object>}
 */
export function getSyncQueue() {
  try {
    return JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || "[]");
  } catch (e) {
    console.error("Lỗi đọc hàng đợi ngoại tuyến:", e);
    return [];
  }
}

/**
 * Lưu danh sách hàng đợi đồng bộ ngoại tuyến vào LocalStorage
 * @param {Array<Object>} queue 
 */
export function saveSyncQueue(queue) {
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error("Lỗi ghi hàng đợi ngoại tuyến:", e);
  }
}

/**
 * Đẩy một bản ghi mới vào hàng đợi ngoại tuyến (Đã mã hóa)
 * @param {Object} plaintextData - Dữ liệu rõ cần đồng bộ
 * @param {string} type - Loại dữ liệu (ví dụ: 'journal' hoặc 'ai_chat')
 */
export async function pushToSyncQueue(plaintextData, type = "journal") {
  const userKey = await getEncryptionKey();
  
  // Mã hóa dữ liệu trước khi lưu vào hàng đợi cục bộ để bảo mật tuyệt đối
  const encryptedPayload = await encryptData(JSON.stringify(plaintextData), userKey);
  
  if (!encryptedPayload) {
    console.error("Lỗi mã hóa dữ liệu hàng đợi.");
    return;
  }

  const queue = getSyncQueue();
  
  // Gán ID duy nhất (Client-side UUID/Timestamp) để đảm bảo tính Idempotency khi đồng bộ lại
  const queueItem = {
    id: plaintextData.id || `off_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    payload: encryptedPayload,
    ts: Date.now()
  };

  queue.push(queueItem);
  saveSyncQueue(queue);
  
  nativeToast(getOfflineMessage("offline_saved"), "info");
}

/**
 * Đồng bộ hàng đợi ngoại tuyến lên Server/API khi có kết nối mạng trở lại
 */
export async function processSyncQueue() {
  const queue = getSyncQueue();
  if (queue.length === 0) return;

  const userKey = await getEncryptionKey();
  nativeToast(getOfflineMessage("syncing", queue.length), "info");

  const failedItems = [];

  for (const item of queue) {
    try {
      // 1. Giải mã dữ liệu trong bộ nhớ RAM
      const decryptedStr = await decryptData(item.payload, userKey);
      if (!decryptedStr) {
        throw new Error("Không thể giải mã dữ liệu hàng đợi (sai khóa hoặc session hết hạn)");
      }

      const data = JSON.parse(decryptedStr);

      // 2. Gửi dữ liệu rõ lên Server API để xử lý (giả lập cuộc gọi API qua fetch)
      // Để đảm bảo Idempotency, Server sẽ kiểm tra trùng lặp qua item.id
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Client-Record-ID": item.id // Gửi ID duy nhất làm khóa Idempotency
        },
        body: JSON.stringify({
          id: item.id,
          type: item.type,
          data
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      // Xử lý thành công -> không lưu lại vào failedItems (sẽ bị loại khỏi queue)
      console.log(`Đồng bộ thành công bản ghi: ${item.id}`);
    } catch (error) {
      console.error(`Lỗi đồng bộ bản ghi ${item.id}:`, error.message);
      // Nếu là lỗi mạng hoặc lỗi tạm thời, giữ lại trong hàng đợi để thử lại sau
      failedItems.push(item);
    }
  }

  // Cập nhật lại hàng đợi chỉ chứa các bản ghi đồng bộ lỗi
  saveSyncQueue(failedItems);

  if (failedItems.length === 0) {
    nativeToast(getOfflineMessage("sync_success"), "success");
  } else {
    nativeToast(getOfflineMessage("sync_partial", failedItems.length), "warning");
  }
}

// --- Event Listeners đăng ký tự động ---
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    console.info("[Offline Manager] Thiết bị đã trực tuyến trở lại.");
    processSyncQueue();
  });

  window.addEventListener("offline", () => {
    console.warn("[Offline Manager] Thiết bị đã mất kết nối mạng.");
    nativeToast(getOfflineMessage("connection_lost"), "warning");
  });
}
