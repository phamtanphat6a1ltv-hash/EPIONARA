import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  pushToSyncQueue,
  getSyncQueue,
  processSyncQueue
} from "../src/utils/offlineManager.js";
import { setEncryptionKeyFromPassword } from "../src/utils/crypto";

describe("Offline Manager Utility", () => {
  beforeEach(async () => {
    localStorage.clear();
    // Setup test encryption key
    await setEncryptionKeyFromPassword("test_password", "test_user_123");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("should push items to sync queue encrypted", async () => {
    const data = { content: "Nhật ký hôm nay rất vui", id: "journal_1" };
    await pushToSyncQueue(data, "journal");

    const queue = getSyncQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].type).toBe("journal");
    expect(queue[0].id).toBe("journal_1");
    expect(queue[0].payload).toContain(":"); // Format iv:ciphertext
    expect(queue[0].payload).not.toContain("Nhật ký hôm nay"); // Must be encrypted
  });

  it("should process sync queue and clear items on successful fetch", async () => {
    const data = { content: "Nhật ký stress học tập", id: "journal_2" };
    await pushToSyncQueue(data, "journal");

    // Stub global fetch to return OK
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true })
    });
    vi.stubGlobal("fetch", fetchSpy);

    await processSyncQueue();

    expect(fetchSpy).toHaveBeenCalled();
    const queueAfter = getSyncQueue();
    expect(queueAfter.length).toBe(0); // Should be cleared on success
  });

  it("should keep failed sync items in the queue to retry later", async () => {
    const data = { content: "Nhật ký buồn", id: "journal_3" };
    await pushToSyncQueue(data, "journal");

    // Stub global fetch to fail
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: false,
      status: 500
    });
    vi.stubGlobal("fetch", fetchSpy);

    await processSyncQueue();

    expect(fetchSpy).toHaveBeenCalled();
    const queueAfter = getSyncQueue();
    expect(queueAfter.length).toBe(1); // Keep in queue
  });
});
