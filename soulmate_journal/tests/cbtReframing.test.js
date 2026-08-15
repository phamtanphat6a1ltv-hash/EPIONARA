import { describe, it, expect, beforeEach } from "vitest";
import { journalRepository } from "../src/repositories/journalRepository.js";

describe("CBT Reframing & Cognitive Distortion Properties", () => {
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

  it("should successfully save journal entries with cognitive distortions", async () => {
    const entry = {
      id: "journal_test_1",
      score: 3,
      note: "Nobody likes me and they all hate me.",
      date: "2026-06-27",
      ts: Date.now(),
      distortions: [
        {
          type: "Catastrophizing",
          thought: "Nobody likes me and they all hate me.",
          explanation_vi: "Phóng đại suy nghĩ tiêu cực.",
          reframed_vi: "Mọi người đều có mối bận tâm riêng."
        }
      ],
      cbtReframed: false
    };

    const result = await journalRepository.save(entry, mockAdapter);
    expect(result).toHaveLength(1);
    expect(result[0].distortions).toHaveLength(1);
    expect(result[0].distortions[0].type).toBe("Catastrophizing");
    expect(result[0].cbtReframed).toBe(false);
  });

  it("should successfully update cbtReframed and reframedThought properties on an existing entry", async () => {
    const originalEntry = {
      id: "journal_test_2",
      score: 2,
      note: "I am going to fail the exam.",
      date: "2026-06-27",
      ts: Date.now(),
      distortions: [
        {
          type: "Catastrophizing",
          thought: "I am going to fail the exam.",
          explanation_vi: "Giả định kết quả xấu nhất.",
          reframed_vi: "Mình đã chuẩn bị bài, kết quả sẽ tương xứng."
        }
      ],
      cbtReframed: false
    };

    // Save initial
    await journalRepository.save(originalEntry, mockAdapter);

    // Fetch and update
    const fetched = await journalRepository.getById("journal_test_2", mockAdapter);
    expect(fetched).not.toBeNull();

    const updatedEntry = {
      ...fetched,
      cbtReframed: true,
      reframedThought: "Mình đã chuẩn bị bài và hoàn toàn có thể vượt qua bài kiểm tra."
    };

    const saveResult = await journalRepository.save(updatedEntry, mockAdapter);
    
    // Find the updated entry
    const finalFetched = await journalRepository.getById("journal_test_2", mockAdapter);
    expect(finalFetched.cbtReframed).toBe(true);
    expect(finalFetched.reframedThought).toBe("Mình đã chuẩn bị bài và hoàn toàn có thể vượt qua bài kiểm tra.");
  });
});
