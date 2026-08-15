// =================== CRYPTO UTILS ===================

/**
 * Hashes a password using PBKDF2 with 310,000 iterations and a random 16-byte salt.
 * Format: "pbkdf2v4:<iterations>:<saltHex>:<hashHex>"
 * @param password - The plain password to hash.
 * @returns The formatted hash string.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);

  // Sinh salt ngẫu nhiên 16 bytes (128-bit)
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iterations = 310000; // Nâng lên 310,000 lần lặp theo khuyến nghị bảo mật OWASP

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordData,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("");
  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  return `pbkdf2v4:${iterations}:${saltHex}:${hashHex}`;
}

/**
 * Compares a plain password against a stored PBKDF2 hash.
 * Supports pbkdf2v4 (custom iterations), pbkdf2v3 (100k random salt), and legacy pbkdf2 formats.
 * @param password - The plain password to verify.
 * @param storedHash - The stored hash string to compare against.
 * @returns True if the password is valid, false otherwise.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return false;
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);

  if (storedHash.startsWith("pbkdf2v4:")) {
    // --- Format v4 mới nhất: salt ngẫu nhiên + động số vòng lặp ---
    const parts = storedHash.split(":");
    if (parts.length !== 4) return false;
    const [, iterationsStr, saltHex, expectedHashHex] = parts;
    const iterations = parseInt(iterationsStr, 10);
    if (isNaN(iterations)) return false;
    
    const matchHex = saltHex.match(/.{1,2}/g);
    if (!matchHex) return false;
    const salt = new Uint8Array(matchHex.map(b => parseInt(b, 16)));

    const keyMaterial = await crypto.subtle.importKey(
      "raw", passwordData, { name: "PBKDF2" }, false, ["deriveBits"]
    );
    const derivedBits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
      keyMaterial, 256
    );
    const hashHex = Array.from(new Uint8Array(derivedBits))
      .map(b => b.toString(16).padStart(2, "0")).join("");
    return hashHex === expectedHashHex;

  } else if (storedHash.startsWith("pbkdf2v3:")) {
    // --- Format cũ v3: salt ngẫu nhiên ---
    const parts = storedHash.split(":");
    if (parts.length !== 3) return false;
    const [, saltHex, expectedHashHex] = parts;
    
    const matchHex = saltHex.match(/.{1,2}/g);
    if (!matchHex) return false;
    const salt = new Uint8Array(matchHex.map(b => parseInt(b, 16)));

    const keyMaterial = await crypto.subtle.importKey(
      "raw", passwordData, { name: "PBKDF2" }, false, ["deriveBits"]
    );
    const derivedBits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
      keyMaterial, 256
    );
    const hashHex = Array.from(new Uint8Array(derivedBits))
      .map(b => b.toString(16).padStart(2, "0")).join("");
    return hashHex === expectedHashHex;

  } else if (storedHash.startsWith("pbkdf2:")) {
    // --- Format cũ v2: salt cố định ---
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
    return `pbkdf2:${hashHex}` === storedHash;
  }

  return false;
}

/**
 * Computes a standard SHA-256 hash of a string.
 * @param str - The input string to hash.
 * @returns The hex-encoded SHA-256 hash of the input string.
 */
export async function sha256Hash(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Dual-hash MurmurHash3-inspired fast non-cryptographic string hash.
 * @param str - The input string to hash.
 * @returns The base-36 encoded hash string.
 */
export function simpleHash(str: string): string {
  let h1 = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h1 ^= str.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193);
  }
  h1 = h1 >>> 0;

  let h2 = 0xdeadbeef;
  for (let i = 0; i < str.length; i++) {
    let k = str.charCodeAt(i);
    k = Math.imul(k, 0xcc9e2d51);
    k = (k << 15) | (k >>> 17);
    k = Math.imul(k, 0x1b873593);
    h2 ^= k;
    h2 = (h2 << 13) | (h2 >>> 19);
    h2 = (Math.imul(h2, 5) + 0xe6546b64) | 0;
  }
  h2 ^= str.length;
  h2 ^= h2 >>> 16;
  h2 = Math.imul(h2, 0x85ebca6b);
  h2 ^= h2 >>> 13;
  h2 = Math.imul(h2, 0xc2b2ae35);
  h2 ^= h2 >>> 16;
  h2 = h2 >>> 0;

  return h1.toString(36) + h2.toString(36);
}

/**
 * Generates a cryptographically secure 6-digit OTP string.
 * @returns The generated 6-digit OTP string (e.g. "123456").
 */
export function generateSecureOTP(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(100000 + (array[0] % 900000));
}

const DEVICE_KEY_SESSION = "sj_device_key";

/**
 * Retrieves the device session key from sessionStorage, or generates a new one.
 * @returns The hex-encoded 32-byte session key.
 */
export async function getDeviceKey(): Promise<string> {
  const existingLocal = localStorage.getItem("sj_device_key");
  if (existingLocal) return existingLocal;

  const existingSession = sessionStorage.getItem(DEVICE_KEY_SESSION);
  if (existingSession) {
    localStorage.setItem("sj_device_key", existingSession);
    return existingSession;
  }

  const keyBytes = crypto.getRandomValues(new Uint8Array(32));
  const keyHex = Array.from(keyBytes).map(b => b.toString(16).padStart(2, "0")).join("");
  localStorage.setItem("sj_device_key", keyHex);
  sessionStorage.setItem(DEVICE_KEY_SESSION, keyHex);
  return keyHex;
}

/**
 * Encrypts a plaintext string using AES-GCM (256-bit).
 * @param plaintext - The plaintext message to encrypt.
 * @param secretKey - The secret key used for encryption. If null, getDeviceKey() is used.
 * @returns Format: "ivHex:dataHex", or null if encryption fails.
 */
export async function encryptData(
  plaintext: string,
  secretKey: string | CryptoKey | null = null
): Promise<string | null> {
  try {
    const encoder = new TextEncoder();
    let keyMaterial: CryptoKey;

    if (secretKey && typeof secretKey === "object" && secretKey instanceof CryptoKey) {
      keyMaterial = secretKey;
    } else {
      const key = (secretKey as string) || await getDeviceKey();
      keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(key.padEnd(32, "0").substring(0, 32)),
        { name: "AES-GCM" },
        false,
        ["encrypt"]
      );
    }

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      keyMaterial,
      encoder.encode(plaintext)
    );

    const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, "0")).join("");
    const dataHex = Array.from(new Uint8Array(encryptedBuffer))
      .map(b => b.toString(16).padStart(2, "0")).join("");

    return `${ivHex}:${dataHex}`;
  } catch (error) {
    console.error("Lỗi mã hóa dữ liệu:", error);
    return null;
  }
}

/**
 * Decrypts an AES-GCM encrypted string.
 * @param ciphertext - The formatted "ivHex:dataHex" string.
 * @param secretKey - The secret key used for decryption. If null, getDeviceKey() is used.
 * @returns The decrypted plaintext string, or null if decryption fails.
 */
export async function decryptData(
  ciphertext: string,
  secretKey: string | CryptoKey | null = null
): Promise<string | null> {
  try {
    if (!ciphertext || !ciphertext.includes(":")) return null;

    const [ivHex, dataHex] = ciphertext.split(":");
    
    const matchIv = ivHex.match(/.{1,2}/g);
    const matchData = dataHex.match(/.{1,2}/g);
    if (!matchIv || !matchData) return null;

    const iv = new Uint8Array(matchIv.map(byte => parseInt(byte, 16)));
    const encryptedData = new Uint8Array(matchData.map(byte => parseInt(byte, 16)));
    const encoder = new TextEncoder();

    let keyMaterial: CryptoKey;
    if (secretKey && typeof secretKey === "object" && secretKey instanceof CryptoKey) {
      keyMaterial = secretKey;
    } else {
      const key = (secretKey as string) || await getDeviceKey();
      keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(key.padEnd(32, "0").substring(0, 32)),
        { name: "AES-GCM" },
        false,
        ["decrypt"]
      );
    }

    try {
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        keyMaterial,
        encryptedData
      );
      return new TextDecoder().decode(decryptedBuffer);
    } catch (decryptError) {
      const activeKey = await getEncryptionKey();
      if ((secretKey === null || secretKey === activeKey) && activeKey !== null) {
        const legacyKey = await getLegacyEncryptionKey();
        if (legacyKey && legacyKey !== activeKey) {
          const decryptedBuffer = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            legacyKey,
            encryptedData
          );
          return new TextDecoder().decode(decryptedBuffer);
        }
      }
      throw decryptError;
    }
  } catch {
    return null;
  }
}

let activeEncryptionKey: CryptoKey | null = null;
let legacyEncryptionKey: CryptoKey | null = null;

/**
 * Derives a cryptographic AES-GCM key from a password and a user ID using PBKDF2.
 * @param password - The password string.
 * @param userId - The user ID for unique salt salting.
 * @param iterations - Number of iterations for derivation.
 * @returns The derived CryptoKey for AES-GCM encryption.
 */
export async function deriveEncryptionKey(
  password: string,
  userId: string | number,
  iterations: number = 310000
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  const saltData = encoder.encode(String(userId) + "sj_enc_v1");

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordData,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltData,
      iterations: iterations,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  return derivedKey;
}

/**
 * Sets the active encryption key in memory and sessionStorage from a password.
 * Derives both active key (310k iterations) and legacy key (100k iterations) for fallback.
 * @param password - The user password.
 * @param userId - The user ID.
 * @returns
 */
export async function setEncryptionKeyFromPassword(password: string, userId: string | number): Promise<void> {
  try {
    const key = await deriveEncryptionKey(password, userId, 310000);
    activeEncryptionKey = key;

    const exported = await crypto.subtle.exportKey("raw", key);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
    sessionStorage.setItem("sj_user_key_base64_" + userId, base64);
    sessionStorage.setItem("sj_user_key_base64", base64);

    const legacyKey = await deriveEncryptionKey(password, userId, 100000);
    legacyEncryptionKey = legacyKey;
    const legacyExported = await crypto.subtle.exportKey("raw", legacyKey);
    const legacyBase64 = btoa(String.fromCharCode(...new Uint8Array(legacyExported)));
    sessionStorage.setItem("sj_user_key_v1_base64_" + userId, legacyBase64);
    sessionStorage.setItem("sj_user_key_v1_base64", legacyBase64);
  } catch (e) {
    console.error("Failed to set encryption key from password:", e);
  }
}

/**
 * Clears the active encryption key and legacy key from memory and sessionStorage.
 */
export function clearEncryptionKey(): void {
  activeEncryptionKey = null;
  legacyEncryptionKey = null;
  const activeId = localStorage.getItem("sj_active_id");
  if (activeId) {
    sessionStorage.removeItem("sj_user_key_base64_" + activeId);
    sessionStorage.removeItem("sj_user_key_v1_base64_" + activeId);
  }
  sessionStorage.removeItem("sj_user_key_base64");
  sessionStorage.removeItem("sj_user_key_v1_base64");
}

export function resetActiveKeyCache(): void {
  activeEncryptionKey = null;
  legacyEncryptionKey = null;
}

/**
 * Retrieves the active user encryption key, checking cache and sessionStorage.
 * @returns The active CryptoKey, or null if not set.
 */
export async function getEncryptionKey(): Promise<CryptoKey | null> {
  if (activeEncryptionKey) return activeEncryptionKey;

  const activeId = localStorage.getItem("sj_active_id");
  let base64 = (activeId && sessionStorage.getItem("sj_user_key_base64_" + activeId)) || sessionStorage.getItem("sj_user_key_base64");
  
  if (!base64 && activeId) {
    const encrypted = localStorage.getItem("sj_user_key_encrypted_" + activeId) || localStorage.getItem("sj_user_key_encrypted");
    if (encrypted) {
      const deviceKey = await getDeviceKey();
      base64 = await decryptData(encrypted, deviceKey);
    }
  }

  if (base64) {
    try {
      const rawBytes = new Uint8Array(atob(base64).split("").map(c => c.charCodeAt(0)));
      activeEncryptionKey = await crypto.subtle.importKey(
        "raw",
        rawBytes,
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"]
      );
      
      if (activeId) {
        sessionStorage.setItem("sj_user_key_base64_" + activeId, base64);
      }
      sessionStorage.setItem("sj_user_key_base64", base64);
      
      return activeEncryptionKey;
    } catch (e) {
      console.error("Failed to load user encryption key:", e);
    }
  }
  return null;
}

/**
 * Retrieves the legacy user encryption key (100k iterations) for backward compatibility.
 * @returns The legacy CryptoKey, or null if not set.
 */
export async function getLegacyEncryptionKey(): Promise<CryptoKey | null> {
  if (legacyEncryptionKey) return legacyEncryptionKey;

  const activeId = localStorage.getItem("sj_active_id");
  const base64 = (activeId && sessionStorage.getItem("sj_user_key_v1_base64_" + activeId)) || sessionStorage.getItem("sj_user_key_v1_base64");
  
  if (base64) {
    try {
      const rawBytes = new Uint8Array(atob(base64).split("").map(c => c.charCodeAt(0)));
      legacyEncryptionKey = await crypto.subtle.importKey(
        "raw",
        rawBytes,
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"]
      );
      return legacyEncryptionKey;
    } catch (e) {
      console.error("Failed to load legacy user encryption key:", e);
    }
  }
  return null;
}
