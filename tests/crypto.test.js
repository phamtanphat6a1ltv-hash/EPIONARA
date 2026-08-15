import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, encryptData, decryptData, generateSecureOTP } from "../src/utils/crypto";

describe("Crypto Utilities", () => {
  describe("generateSecureOTP", () => {
    it("should generate a 6-digit OTP string", () => {
      for (let i = 0; i < 50; i++) {
        const otp = generateSecureOTP();
        expect(otp).toBeTypeOf("string");
        expect(otp).toHaveLength(6);
        expect(/^\d{6}$/.test(otp)).toBe(true);
      }
    });
  });

  describe("hashPassword and verifyPassword", () => {
    const password = "my_secure_password_123";

    it("should produce a formatted pbkdf2v4 hash", async () => {
      const hash = await hashPassword(password);
      expect(hash).toBeTypeOf("string");
      expect(hash.startsWith("pbkdf2v4:")).toBe(true);
      const parts = hash.split(":");
      expect(parts).toHaveLength(4); // pbkdf2v4, iterations, saltHex, hashHex
    });

    it("should produce different hashes/salts for the same password due to random salt", async () => {
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      expect(hash1).not.toBe(hash2);
    });

    it("should verify correct password for pbkdf2v4 format", async () => {
      const hash = await hashPassword(password);
      const isCorrect = await verifyPassword(password, hash);
      expect(isCorrect).toBe(true);
    });

    it("should reject incorrect password for pbkdf2v4 format", async () => {
      const hash = await hashPassword(password);
      const isCorrect = await verifyPassword("wrong_password", hash);
      expect(isCorrect).toBe(false);
    });

    it("should verify correct password for pbkdf2v3 format (backward compatibility)", async () => {
      const encoder = new TextEncoder();
      const passwordData = encoder.encode(password);
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const keyMaterial = await crypto.subtle.importKey(
        "raw", passwordData, { name: "PBKDF2" }, false, ["deriveBits"]
      );
      const derivedBits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
        keyMaterial, 256
      );
      const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("");
      const hashHex = Array.from(new Uint8Array(derivedBits))
        .map(b => b.toString(16).padStart(2, "0")).join("");
      const v3Hash = `pbkdf2v3:${saltHex}:${hashHex}`;

      const isCorrect = await verifyPassword(password, v3Hash);
      expect(isCorrect).toBe(true);

      const isWrong = await verifyPassword("wrong_password", v3Hash);
      expect(isWrong).toBe(false);
    });

    it("should verify correct password for legacy pbkdf2 format", async () => {
      // Legacy format uses a fixed salt "Soulmate JournalSalt_v2"
      // Let's create a legacy hash representation to check verification backward compatibility
      const encoder = new TextEncoder();
      const passwordData = encoder.encode(password);
      const saltData = encoder.encode("Soulmate JournalSalt_v2");
      const keyMaterial = await crypto.subtle.importKey(
        "raw", passwordData, { name: "PBKDF2" }, false, ["deriveBits"]
      );
      const derivedBits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt: saltData, iterations: 100000, hash: "SHA-256" },
        keyMaterial, 256
      );
      const hashHex = Array.from(new Uint8Array(derivedBits))
        .map(b => b.toString(16).padStart(2, "0")).join("");
      const legacyHash = `pbkdf2:${hashHex}`;

      const isCorrect = await verifyPassword(password, legacyHash);
      expect(isCorrect).toBe(true);

      const isWrong = await verifyPassword("wrong_password", legacyHash);
      expect(isWrong).toBe(false);
    });
  });

  describe("AES-GCM encryptData and decryptData", () => {
    const plaintext = "This is some secret mental health journal entry text.";
    const key = "custom_secret_key_for_testing";

    it("should encrypt and decrypt back to the same string using default key", async () => {
      const ciphertext = await encryptData(plaintext);
      expect(ciphertext).toBeTypeOf("string");
      expect(ciphertext.includes(":")).toBe(true);

      const decrypted = await decryptData(ciphertext);
      expect(decrypted).toBe(plaintext);
    });

    it("should encrypt and decrypt back to the same string using custom key", async () => {
      const ciphertext = await encryptData(plaintext, key);
      expect(ciphertext).toBeTypeOf("string");
      expect(ciphertext.includes(":")).toBe(true);

      const decrypted = await decryptData(ciphertext, key);
      expect(decrypted).toBe(plaintext);
    });

    it("should return null when decrypting invalid format ciphertext", async () => {
      const decrypted = await decryptData("invalid-ciphertext-format");
      expect(decrypted).toBeNull();
    });

    it("should return null when decrypting with incorrect key", async () => {
      const ciphertext = await encryptData(plaintext, "key1");
      const decrypted = await decryptData(ciphertext, "key2"); // different key
      expect(decrypted).toBeNull();
    });
  });

  describe("Secure Session Storage and OTP Encryption", () => {
    it("should encrypt and save OTP in sessionStorage and decrypt it back", async () => {
      const { UserStore } = await import("../src/utils/db.js");
      const testIdentifier = "test_user_or_email";
      const testOtp = "999888";

      // Set OTP
      await UserStore.setOTP(testIdentifier, testOtp);

      // Verify that the stored value in sessionStorage is NOT plaintext testOtp
      const rawStored = sessionStorage.getItem(`sj_otp_${testIdentifier}`);
      expect(rawStored).toBeDefined();
      expect(rawStored).not.toBeNull();
      expect(rawStored).not.toContain(testOtp); // It must be encrypted ciphertext (ivHex:dataHex)

      // Retrieve OTP and verify it decrypts to the original OTP
      const retrievedOtp = await UserStore.getOTP(testIdentifier);
      expect(retrievedOtp).toBe(testOtp);

      // Clear OTP
      await UserStore.clearOTP(testIdentifier);
      const afterClear = sessionStorage.getItem(`sj_otp_${testIdentifier}`);
      expect(afterClear).toBeNull();
    });
  });

  describe("Login Lockout Rate Limiting", () => {
    it("should lockout user after 5 failed attempts and persist lockout across session clearing", async () => {
      const { AuthAPI } = await import("../src/utils/authApi.js");
      const testUser = "lockout_test_user@example.com";

      // Clear any previous attempts
      localStorage.removeItem(`sj_login_attempts_${testUser}`);

      // We simulate 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        try {
          await AuthAPI.login("email", testUser, "incorrect_pass");
        } catch (err) {
          // Expected error
        }
      }

      // 6th attempt should throw a RATE_LIMITED error
      let errorThrown = null;
      try {
        await AuthAPI.login("email", testUser, "incorrect_pass");
      } catch (err) {
        errorThrown = err;
      }

      expect(errorThrown).not.toBeNull();
      expect(errorThrown.code).toBe("RATE_LIMITED");
      expect(errorThrown.remainingSeconds).toBeGreaterThan(0);

      // Verify that the login attempts are stored in localStorage
      const attemptsData = localStorage.getItem(`sj_login_attempts_${testUser}`);
      expect(attemptsData).not.toBeNull();
      const parsedData = JSON.parse(attemptsData);
      expect(parsedData.attempts).toBe(5);

      // Clear storage
      localStorage.removeItem(`sj_login_attempts_${testUser}`);
    }, 15000);
  });
});
