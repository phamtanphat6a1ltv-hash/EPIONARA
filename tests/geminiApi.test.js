import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  generateLocalMockResponse,
  streamLocalMockResponse,
  callGeminiAPI,
  streamGeminiAPI
} from "../src/utils/geminiApi.js";

describe("Gemini API and Local Mock Engine", () => {
  describe("generateLocalMockResponse", () => {
    it("should return default mock response for empty/undefined input", () => {
      const resp = generateLocalMockResponse("");
      expect(resp).toContain("Cảm ơn bạn đã chia sẻ");
    });

    it("should return stress-related response when keywords match", () => {
      const resp = generateLocalMockResponse("Mình đang rất áp lực và căng thẳng");
      expect(resp).toContain("Pop-it");
    });

    it("should return sad-related response when keywords match", () => {
      const resp = generateLocalMockResponse("Hôm nay mình buồn lắm");
      expect(resp).toContain("Âm thanh chữa lành");
    });

    it("should return happy-related response when keywords match", () => {
      const resp = generateLocalMockResponse("Mình rất vui và hạnh phúc");
      expect(resp).toContain("Nhật ký tâm hồn");
    });

    it("should handle greetings and thanks conversationally", () => {
      const greet = generateLocalMockResponse("chào bạn");
      expect(greet).toContain("MindBot");
      const thanks = generateLocalMockResponse("cảm ơn bạn nhiều nha");
      expect(thanks).toContain("đồng hành");
    });

    it("should handle welcome and no-problem phrases conversationally", () => {
      const welcome = generateLocalMockResponse("không có j");
      expect(welcome).toContain("Không có gì đâu nè");
      const welcome2 = generateLocalMockResponse("ko có gì đâu ạ");
      expect(welcome2).toContain("Không có gì đâu nè");
    });

    it("should remember previous emotional state context for follow-up questions", () => {
      const messages = [
        { role: "user", content: "mình cảm thấy cô đơn quá" },
        { role: "model", content: "..." },
        { role: "user", content: "vậy giờ tôi nên làm gì" }
      ];
      const resp = generateLocalMockResponse(messages);
      expect(resp).toContain("Âm thanh chữa lành"); // Matches SAD action advice
    });

    it("should handle agreement/acceptance responses (contextual)", () => {
      const stressMessages = [
        { role: "user", content: "mình mệt mỏi" },
        { role: "assistant", content: "Bạn có muốn thử trò chơi Pop-it giải tỏa căng thẳng không?" },
        { role: "user", content: "Tôi muốn" }
      ];
      const stressResp = generateLocalMockResponse(stressMessages);
      expect(stressResp).toContain("Pop-it");
      expect(stressResp).toContain("Cân bằng");

      const sadMessages = [
        { role: "user", content: "buồn quá đi" },
        { role: "assistant", content: "Bạn có muốn nghe thử Âm thanh chữa lành không?" },
        { role: "user", content: "có chứ" }
      ];
      const sadResp = generateLocalMockResponse(sadMessages);
      expect(sadResp).toContain("Âm thanh chữa lành");
    });

    it("should handle persona-specific mock responses based on system instruction", () => {
      // 1. Friend (Gen Z slang)
      const friendResp = generateLocalMockResponse("chào bạn", "Bạn là EPIONARA AI... Gen Z");
      expect(friendResp).toContain("ní");
      expect(friendResp).toContain("MindBot");

      // 2. Therapist (past trauma/root cause)
      const therapistResp = generateLocalMockResponse("Tôi căng thẳng", "Nhà trị liệu tâm lý... quá khứ");
      expect(therapistResp).toContain("tổn thương");
      expect(therapistResp).toContain("quá khứ");

      // 3. Coach (future goals)
      const coachResp = generateLocalMockResponse("Tôi muốn thay đổi", "Life Coach... tương lai... GROW");
      expect(coachResp).toContain("mục tiêu");
      expect(coachResp).toContain("hành động");
    });
  });

  describe("streamLocalMockResponse", () => {
    it("should stream response chunk by chunk", async () => {
      const mockText = "Hello world test";
      const chunks = [];
      for await (const chunk of streamLocalMockResponse(mockText)) {
        chunks.push(chunk);
      }
      expect(chunks.join("")).toContain("Hello world test");
      expect(chunks.length).toBeGreaterThan(1);
    });

    it("should respect abort signal", async () => {
      const controller = new AbortController();
      const mockText = "Word1 Word2 Word3 Word4";
      const chunks = [];
      let step = 0;
      for await (const chunk of streamLocalMockResponse(mockText, controller.signal)) {
        chunks.push(chunk);
        step++;
        if (step === 2) {
          controller.abort();
        }
      }
      expect(chunks.length).toBeLessThan(4);
    });
  });

  describe("callGeminiAPI with Demo Mode", () => {
    beforeEach(() => {
      vi.stubEnv("VITE_DEMO_MODE", "true");
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("should bypass network call and return mock response in Demo Mode", async () => {
      const response = await callGeminiAPI({
        messages: [{ role: "user", content: "Tôi mệt mỏi" }]
      });
      expect(response).toContain("Pop-it");
    });
  });

  describe("streamGeminiAPI with Demo Mode", () => {
    beforeEach(() => {
      vi.stubEnv("VITE_DEMO_MODE", "true");
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("should bypass network call and stream mock chunks in Demo Mode", async () => {
      const chunks = [];
      for await (const chunk of streamGeminiAPI({
        messages: [{ role: "user", content: "Tôi buồn quá" }]
      })) {
        chunks.push(chunk);
      }
      const fullText = chunks.join("");
      expect(fullText).toContain("Âm thanh chữa lành");
    });
  });

  describe("streamGeminiAPI fallback on fetch error", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("should fall back to local mock response when fetch fails", async () => {
      const fetchSpy = vi.fn().mockRejectedValue(new Error("API limit exceeded (quota)"));
      vi.stubGlobal("fetch", fetchSpy);

      const chunks = [];
      for await (const chunk of streamGeminiAPI({
        messages: [{ role: "user", content: "Tôi buồn quá" }]
      })) {
        chunks.push(chunk);
      }
      const fullText = chunks.join("");
      expect(fullText).toContain("Âm thanh chữa lành");
    });
  });
});
