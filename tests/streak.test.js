import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DB, MetaDB } from "../src/utils/db.js";
import { journalRepository } from "../src/repositories/journalRepository.js";

describe("Streak and Recovery Logic", () => {
  let getAllSpy;

  beforeEach(() => {
    localStorage.clear();
    getAllSpy = vi.spyOn(journalRepository, "getAll");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return streak 0 if no journal today and today is not recovered", async () => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Mock journals: user wrote yesterday but not today
    getAllSpy.mockResolvedValue([
      { id: "j1", date: yesterdayStr, ts: Date.now() - 24 * 3600 * 1000, score: 5, note: "yesterday" }
    ]);

    const stats = await DB.getStats();
    expect(stats.streak).toBe(0); // broken streak today because they haven't done anything today
    expect(stats.canRecover).toBe(false); // yesterday has a journal, no gap to recover
    expect(stats.breakDateStr).toBe(null); // no gap found
  });

  it("should calculate correct streak if journals are continuous including today", async () => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Mock journals: user wrote today and yesterday
    getAllSpy.mockResolvedValue([
      { id: "j1", date: today, ts: Date.now(), score: 5, note: "today" },
      { id: "j2", date: yesterdayStr, ts: Date.now() - 24 * 3600 * 1000, score: 5, note: "yesterday" }
    ]);

    const stats = await DB.getStats();
    expect(stats.streak).toBe(2);
    expect(stats.canRecover).toBe(false); // no breaks
  });

  it("should recover the streak when recoverStreak is called", async () => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const dayBefore = new Date();
    dayBefore.setDate(dayBefore.getDate() - 2);
    const dayBeforeStr = dayBefore.toISOString().split("T")[0];

    // Mock journals: user wrote today and day before yesterday, but missed yesterday
    getAllSpy.mockResolvedValue([
      { id: "j1", date: today, ts: Date.now(), score: 5, note: "today" },
      { id: "j2", date: dayBeforeStr, ts: Date.now() - 2 * 24 * 3600 * 1000, score: 5, note: "day before" }
    ]);

    // Initial check: streak is 1 (today only, breaks at yesterday)
    let stats = await DB.getStats();
    expect(stats.streak).toBe(1);
    expect(stats.canRecover).toBe(true);
    expect(stats.breakDateStr).toBe(yesterdayStr);
    expect(stats.streakRecoveriesLeft).toBe(5);

    // Trigger recovery
    const recoveryResult = await DB.recoverStreak();
    expect(recoveryResult.success).toBe(true);
    expect(recoveryResult.recoveredDate).toBe(yesterdayStr);
    expect(recoveryResult.streakRecoveriesLeft).toBe(4);

    // Recalculate stats: streak should now be 3 (today + recovered yesterday + dayBefore)
    stats = await DB.getStats();
    expect(stats.streak).toBe(3);
    expect(stats.canRecover).toBe(false); // no more breaks between today and dayBefore
    expect(stats.streakRecoveriesLeft).toBe(4);
  });

  it("should respect monthly recovery reset of 5 limits", async () => {
    // Set metadata to last month with 2 recoveries remaining
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStr = lastMonth.toISOString().slice(0, 7);

    MetaDB.updateMeta({
      streakRecoveriesLeft: 2,
      lastGrantMonth: lastMonthStr,
      recoveredDates: []
    });

    // Mock empty journals so getStats doesn't hit real IndexedDB
    getAllSpy.mockResolvedValue([]);

    // Verify it triggers reset
    const stats = await DB.getStats();
    expect(stats.streakRecoveriesLeft).toBe(5);

    const currentMonthStr = new Date().toISOString().slice(0, 7);
    const meta = MetaDB.getMeta();
    expect(meta.lastGrantMonth).toBe(currentMonthStr);
  });

  it("should throw error when trying to recover but 0 recoveries left", async () => {
    // Mock user having 0 recoveries left
    MetaDB.updateMeta({
      streakRecoveriesLeft: 0,
      recoveredDates: []
    });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    getAllSpy.mockResolvedValue([
      { id: "j1", date: yesterdayStr, ts: Date.now() - 24 * 3600 * 1000, score: 5, note: "yesterday" }
    ]);

    await expect(DB.recoverStreak()).rejects.toThrow("Bạn đã hết lượt hồi phục chuỗi trong tháng này.");
  });
});
