import { describe, it, expect } from "vitest";
import { cleanTokenize, retrieveSemanticContext } from "../src/utils/ragEngine";

describe("Client-side RAG Engine Utilities", () => {
  describe("cleanTokenize", () => {
    it("should convert text to lowercase and remove punctuation", () => {
      const text = "Chào bạn! Hôm nay, tôi thấy rất vui và hạnh phúc.";
      const tokens = cleanTokenize(text);
      expect(tokens).toContain("chào");
      expect(tokens).toContain("vui");
      expect(tokens).toContain("hạnh");
      expect(tokens).toContain("phúc");
      // Cần loại bỏ từ dừng
      expect(tokens).not.toContain("và");
      expect(tokens).not.toContain("là");
      expect(tokens).not.toContain("tôi");
    });

    it("should return empty array for null/empty inputs", () => {
      expect(cleanTokenize("")).toEqual([]);
      expect(cleanTokenize(null)).toEqual([]);
    });
  });

  describe("retrieveSemanticContext", () => {
    const mockJournals = [
      { id: "1", date: "2026-06-10", note: "Hôm nay tôi đi dã ngoại ở công viên và bị dính mưa to, cảm thấy rất buồn và chán nản.", score: 2 },
      { id: "2", date: "2026-06-11", note: "Hoàn thành dự án lập trình xuất sắc, nhận được lời khen từ giáo viên. Cực kỳ phấn khởi và vui vẻ!", score: 8 },
      { id: "3", date: "2026-06-12", note: "Một ngày bình thường, không có nhiều biến động. Chỉ ở nhà đọc sách.", score: 5 },
    ];

    it("should return semantic matches related to 'mưa' and 'buồn'", () => {
      const context = retrieveSemanticContext("mình bị dính mưa buồn quá", mockJournals, 1);
      expect(context).toContain("2026-06-10");
      expect(context).toContain("dính mưa to");
      expect(context).not.toContain("2026-06-11");
    });

    it("should return semantic matches related to 'lập trình' and 'vui'", () => {
      const context = retrieveSemanticContext("tôi học lập trình rất phấn khởi", mockJournals, 1);
      expect(context).toContain("2026-06-11");
      expect(context).toContain("phấn khởi");
      expect(context).not.toContain("2026-06-10");
    });

    it("should return empty string if no keywords match above the threshold", () => {
      const context = retrieveSemanticContext("thức ăn ngon ngoài cửa hàng", mockJournals, 1);
      expect(context).toBe("");
    });

    it("should perform Emotion-aware Query Expansion to match emotional synonyms", () => {
      const journalsWithSynonyms = [
        { id: "1", date: "2026-06-10", note: "Mọi dự định của tôi đều tan vỡ, cuộc sống lúc này thật tuyệt vọng.", score: 2 },
        { id: "2", date: "2026-06-11", note: "Hôm nay tôi đi mua sắm ở siêu thị lớn.", score: 6 },
      ];
      // Truy vấn chứa "buồn" (không có trong nhật ký 1) sẽ kích hoạt mở rộng sang "tuyệt vọng" và khớp nhật ký 1
      const context = retrieveSemanticContext("tôi cảm thấy buồn quá", journalsWithSynonyms, 1);
      expect(context).toContain("2026-06-10");
      expect(context).toContain("tuyệt vọng");
      expect(context).not.toContain("2026-06-11");
    });

    it("should apply Temporal Decay to prioritize recent journals over old ones with similar content", () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const hundredDaysAgo = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);
      const oldStr = hundredDaysAgo.toISOString().split("T")[0];

      const journalsWithDifferentDates = [
        { id: "old", date: oldStr, note: "Học lập trình Javascript rất thú vị và bổ ích.", score: 7 },
        { id: "new", date: todayStr, note: "Học lập trình Javascript rất thú vị và bổ ích.", score: 7 },
      ];

      // Khi truy vấn và giới hạn kết quả là 1, nhật ký mới hơn sẽ đứng đầu do có điểm số cao hơn sau khi suy giảm
      const context = retrieveSemanticContext("học lập trình Javascript", journalsWithDifferentDates, 1);
      expect(context).toContain(todayStr);
      expect(context).not.toContain(oldStr);
    });
  });
});
