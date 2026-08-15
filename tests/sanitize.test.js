import { describe, it, expect } from "vitest";
import { sanitizeText, sanitizeEmail, sanitizePhone, validateApiKey } from "../src/utils/sanitize";

describe("Sanitize and Validation Utilities", () => {
  describe("sanitizeText", () => {
    it("should return empty string for non-string inputs", () => {
      expect(sanitizeText(null)).toBe("");
      expect(sanitizeText(undefined)).toBe("");
      expect(sanitizeText(123)).toBe("");
    });

    it("should trim whitespace and remove null bytes", () => {
      expect(sanitizeText("  hello\0world  ")).toBe("helloworld");
      expect(sanitizeText("test\u0000abc")).toBe("testabc");
    });

    it("should truncate long text to the specified maxLength", () => {
      const longText = "a".repeat(100);
      expect(sanitizeText(longText, 10)).toBe("aaaaaaaaaa");
    });

    it("should truncate long text to default maxLength of 4000", () => {
      const longText = "a".repeat(4500);
      expect(sanitizeText(longText).length).toBe(4000);
    });
  });

  describe("sanitizeEmail", () => {
    it("should throw error for non-string input", () => {
      expect(() => sanitizeEmail(123)).toThrow("Email phải là một chuỗi ký tự");
    });

    it("should sanitize and lowercase a valid email", () => {
      expect(sanitizeEmail("  TEST@example.COM ")).toBe("test@example.com");
    });

    it("should throw error for invalid email formats", () => {
      expect(() => sanitizeEmail("invalid-email")).toThrow("Định dạng email không hợp lệ");
      expect(() => sanitizeEmail("test@example")).toThrow("Định dạng email không hợp lệ");
      expect(() => sanitizeEmail("@example.com")).toThrow("Định dạng email không hợp lệ");
    });
  });

  describe("sanitizePhone", () => {
    it("should throw error for non-string input", () => {
      expect(() => sanitizePhone(123)).toThrow("Số điện thoại phải là một chuỗi ký tự");
    });

    it("should keep valid characters and trim whitespace", () => {
      expect(sanitizePhone("  +84-123 456 78  ")).toBe("+84-123 456 78");
    });

    it("should strip invalid characters but retain phone-like ones", () => {
      expect(sanitizePhone("+84-123#abc 456")).toBe("+84-123 456");
    });

    it("should throw error for phone numbers that are too short or too long", () => {
      expect(() => sanitizePhone("12345")).toThrow("Số điện thoại phải có độ dài từ 8 đến 20 ký tự");
      expect(() => sanitizePhone("1".repeat(25))).toThrow("Số điện thoại phải có độ dài từ 8 đến 20 ký tự");
    });
  });

  describe("validateApiKey", () => {
    it("should return false for non-string input", () => {
      expect(validateApiKey(null)).toBe(false);
      expect(validateApiKey(123)).toBe(false);
    });

    it("should return true for valid Gemini API key format", () => {
      const validKey = "AIzaSy" + "A".repeat(33);
      expect(validateApiKey(validKey)).toBe(true);
      expect(validateApiKey("   " + validKey + "  ")).toBe(true);
    });

    it("should return false for invalid Gemini API key format", () => {
      expect(validateApiKey("AIzaSyShort")).toBe(false);
      expect(validateApiKey("BIzaSy" + "A".repeat(33))).toBe(false);
      expect(validateApiKey("AIzaSy" + "A".repeat(34))).toBe(false);
    });
  });
});
