// =================== SANITIZE UTILITIES ===================

/**
 * Sanitizes plain text inputs by trimming, removing null bytes, and truncating to a maximum length.
 * @param input - The raw text input.
 * @param maxLength - Maximum permitted length.
 * @returns The sanitized string.
 */
export function sanitizeText(input: unknown, maxLength: number = 4000): string {
  if (typeof input !== "string") return "";
  // Strip null bytes and control chars
  let clean = input.replace(/\0/g, "").replace(/\u0000/g, "");
  clean = clean.trim();
  if (clean.length > maxLength) {
    clean = clean.substring(0, maxLength);
  }
  return clean;
}

/**
 * Sanitizes and validates an email address.
 * Throws an error if the format is invalid.
 * @param input - The raw email input.
 * @returns The sanitized email string.
 */
export function sanitizeEmail(input: unknown): string {
  if (typeof input !== "string") {
    throw new Error("Email phải là một chuỗi ký tự");
  }
  const clean = input.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(clean)) {
    throw new Error("Định dạng email không hợp lệ");
  }
  return clean;
}

/**
 * Sanitizes and validates a phone number.
 * Keeps only digits, +, -, and spaces.
 * @param input - The raw phone number.
 * @returns The sanitized phone number.
 */
export function sanitizePhone(input: unknown): string {
  if (typeof input !== "string") {
    throw new Error("Số điện thoại phải là một chuỗi ký tự");
  }
  const clean = input.trim();
  // Keep only numbers, spaces, + and -
  const phoneClean = clean.replace(/[^0-9+\-\s]/g, "");
  if (phoneClean.length < 8 || phoneClean.length > 20) {
    throw new Error("Số điện thoại phải có độ dài từ 8 đến 20 ký tự");
  }
  return phoneClean;
}

/**
 * Validates the structure of a Google API Key (e.g. Gemini key).
 * @param key - The raw API key string.
 * @returns True if valid, false otherwise.
 */
export function validateApiKey(key: unknown): boolean {
  if (typeof key !== "string") return false;
  const clean = key.trim();
  const regex = /^AIzaSy[A-Za-z0-9_-]{33}$/;
  return regex.test(clean);
}
