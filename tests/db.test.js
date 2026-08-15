import { describe, it, expect, beforeEach } from "vitest";
import { journalRepository } from "../src/repositories/journalRepository.js";

describe("Journal Repository", () => {
  let mockStore;
  let mockAdapter;

  beforeEach(() => {
    mockStore = {
      journals: [],
    };
    mockAdapter = {
      getAll: async (storeName) => {
        return mockStore[storeName] ? [...mockStore[storeName]] : [];
      },
      getById: async (storeName, id) => {
        const list = mockStore[storeName] ? [...mockStore[storeName]] : [];
        return list.find((item) => String(item.id) === String(id)) || null;
      },
      save: async (storeName, item) => {
        if (!mockStore[storeName]) mockStore[storeName] = [];
        const idx = mockStore[storeName].findIndex((x) => String(x.id) === String(item.id));
        if (idx !== -1) {
          mockStore[storeName][idx] = item;
        } else {
          mockStore[storeName].push(item);
        }
        return item;
      },
      delete: async (storeName, id) => {
        if (!mockStore[storeName]) return;
        mockStore[storeName] = mockStore[storeName].filter((item) => String(item.id) !== String(id));
      },
      clear: async (storeName) => {
        mockStore[storeName] = [];
      },
    };
  });

  it("should retrieve sorted list of journals by timestamp descending", async () => {
    mockStore.journals = [
      { id: "1", date: "2026-06-01", ts: 1000, score: 5, note: "Day 1" },
      { id: "2", date: "2026-06-02", ts: 3000, score: 6, note: "Day 2" },
      { id: "3", date: "2026-06-03", ts: 2000, score: 7, note: "Day 3" },
    ];

    const all = await journalRepository.getAll(mockAdapter);
    expect(all).toHaveLength(3);
    expect(all[0].id).toBe("2"); // ts: 3000
    expect(all[1].id).toBe("3"); // ts: 2000
    expect(all[2].id).toBe("1"); // ts: 1000
  });

  it("should save a single entry", async () => {
    const entry = { score: 7, note: "Feeling awesome today", date: "2026-06-09", ts: 1234567 };
    const result = await journalRepository.save(entry, mockAdapter);

    expect(result).toHaveLength(1);
    expect(result[0].note).toBe("Feeling awesome today");
    expect(mockStore.journals).toHaveLength(1);
  });

  it("should overwrite whole list when saving an array", async () => {
    const list = [
      { id: "a", date: "2026-06-01", ts: 10, score: 4, note: "Note A" },
      { id: "b", date: "2026-06-02", ts: 20, score: 5, note: "Note B" },
    ];
    const result = await journalRepository.save(list, mockAdapter);

    expect(result).toEqual(list);
    expect(mockStore.journals).toHaveLength(2);
    expect(mockStore.journals[0].id).toBe("a");
    expect(mockStore.journals[1].id).toBe("b");
  });

  it("should enforce maximum size limit of 365 entries and delete older ones", async () => {
    // Populate store with 365 existing journals, with timestamps descending (older are at the end)
    const existing = [];
    const baseTime = 1700000000000;
    for (let i = 1; i <= 365; i++) {
      existing.push({
        id: `id_${i}`,
        date: `2026-01-01`,
        ts: baseTime + (365 - i) * 1000, // id_1 is newest, id_365 is oldest
        score: 5,
        note: `Note ${i}`,
      });
    }
    // Set mock store directly
    mockStore.journals = existing;

    // Save a new entry (it will be prepended as the newest because of high timestamp)
    const newEntry = {
      score: 8,
      note: "Brand new entry",
      date: "2026-06-09",
      ts: baseTime + 400 * 1000, // highest timestamp
    };

    const result = await journalRepository.save(newEntry, mockAdapter);

    // Total should remain capped at 365
    expect(result).toHaveLength(365);
    expect(mockStore.journals).toHaveLength(365);

    // Newest entry should be first
    expect(result[0].note).toBe("Brand new entry");

    // The old limit was 365, so adding 1 means the oldest is removed
    // The oldest was id_365
    const foundOldest = mockStore.journals.find(x => x.id === "id_365");
    expect(foundOldest).toBeUndefined();

    // Second oldest id_364 should still exist
    const foundSecondOldest = mockStore.journals.find(x => x.id === "id_364");
    expect(foundSecondOldest).toBeDefined();
  });
});
