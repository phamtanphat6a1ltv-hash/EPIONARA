import { UserStore } from "./db.js";
import { hashPassword, verifyPassword, setEncryptionKeyFromPassword } from "./crypto";
import { sanitizeEmail, sanitizePhone, sanitizeText } from "./sanitize";

const ATTEMPT_LIMIT = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes in ms

function checkRateLimit(identifier) {
  const key = `sj_login_attempts_${identifier}`;
  const raw = localStorage.getItem(key);
  if (!raw) return { limited: false };

  const data = JSON.parse(raw);
  if (data.attempts >= ATTEMPT_LIMIT) {
    const elapsed = Date.now() - data.lastAttempt;
    if (elapsed < LOCKOUT_TIME) {
      const remainingSeconds = Math.ceil((LOCKOUT_TIME - elapsed) / 1000);
      return { limited: true, remainingSeconds };
    } else {
      // Lockout expired
      localStorage.removeItem(key);
      return { limited: false };
    }
  }
  return { limited: false };
}

function recordAttempt(identifier, isSuccess) {
  const key = `sj_login_attempts_${identifier}`;
  if (isSuccess) {
    localStorage.removeItem(key);
    return;
  }

  const raw = localStorage.getItem(key);
  let data = raw ? JSON.parse(raw) : { attempts: 0, lastAttempt: 0 };
  
  if (Date.now() - data.lastAttempt > LOCKOUT_TIME) {
    data = { attempts: 0, lastAttempt: 0 };
  }

  data.attempts += 1;
  data.lastAttempt = Date.now();
  localStorage.setItem(key, JSON.stringify(data));
}

// Lớp giả lập Backend API cho xác thực
export const AuthAPI = {
  login: async (method, identifier, password) => {
    await new Promise(resolve => setTimeout(resolve, 800));

    // Sanitize input identifier
    const cleanIdentifier = method === "email" ? sanitizeEmail(identifier) : sanitizePhone(identifier);

    // 1. Check Rate Limit
    const limitCheck = checkRateLimit(cleanIdentifier);
    if (limitCheck.limited) {
      const err = new Error(`Tài khoản tạm thời bị khóa do nhập sai mật khẩu quá nhiều lần. Vui lòng thử lại sau ${limitCheck.remainingSeconds} giây.`);
      err.code = "RATE_LIMITED";
      err.remainingSeconds = limitCheck.remainingSeconds;
      throw err;
    }

    const users = await UserStore.getUsers();
    let user;
    if (method === "email") {
      user = users.find(u => u.email === cleanIdentifier);
    } else {
      user = users.find(u => u.phone === cleanIdentifier);
    }

    if (!user) {
      recordAttempt(cleanIdentifier, false);
      throw new Error("Thông tin đăng nhập không chính xác");
    }

    let isAuthenticated = false;

    if (!user.password.includes(":")) {
      // --- Hash SHA-256 cũ nhất (không có dấu ":") ---
      const legacySha256 = await legacyHashSHA256(password);
      if (legacySha256 === user.password) {
        // Nâng cấp trực tiếp lên pbkdf2v4
        const newHash = await hashPassword(password);
        const updatedUsers = users.map(u =>
          u.id === user.id ? { ...u, password: newHash } : u
        );
        await UserStore.saveUsers(updatedUsers);
        user = { ...user, password: newHash };
        isAuthenticated = true;
        console.info("[Auth] Mật khẩu nâng cấp SHA-256 → pbkdf2v4:", user.id);
      }
    } else if (user.password.startsWith("pbkdf2:")) {
      // --- Format pbkdf2 cũ (salt cố định) → migration sang pbkdf2v4 ---
      const verified = await verifyPassword(password, user.password);
      if (verified) {
        const newHash = await hashPassword(password);
        const updatedUsers = users.map(u =>
          u.id === user.id ? { ...u, password: newHash } : u
        );
        await UserStore.saveUsers(updatedUsers);
        user = { ...user, password: newHash };
        isAuthenticated = true;
        console.info("[Auth] Mật khẩu nâng cấp pbkdf2 → pbkdf2v4:", user.id);
      }
    } else if (user.password.startsWith("pbkdf2v3:")) {
      // --- Format pbkdf2v3 (100k vòng) → migration sang pbkdf2v4 (310k vòng) ---
      const verified = await verifyPassword(password, user.password);
      if (verified) {
        const newHash = await hashPassword(password);
        const updatedUsers = users.map(u =>
          u.id === user.id ? { ...u, password: newHash } : u
        );
        await UserStore.saveUsers(updatedUsers);
        user = { ...user, password: newHash };
        isAuthenticated = true;
        console.info("[Auth] Mật khẩu nâng cấp pbkdf2v3 → pbkdf2v4:", user.id);
      }
    } else {
      // --- Format pbkdf2v4 mới nhất (310k vòng) ---
      isAuthenticated = await verifyPassword(password, user.password);
    }

    if (!isAuthenticated) {
      recordAttempt(cleanIdentifier, false);
      throw new Error("Thông tin đăng nhập không chính xác");
    }

    // Success: reset rate limit attempts
    recordAttempt(cleanIdentifier, true);

    // Derive and store key in memory/sessionStorage
    await setEncryptionKeyFromPassword(password, user.id);

    return user;
  },

  register: async (userData) => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const cleanName = sanitizeText(userData.name, 100);
    const cleanEmail = userData.email ? sanitizeEmail(userData.email) : "";
    const cleanPhone = userData.phone ? sanitizePhone(userData.phone) : "";

    const users = await UserStore.getUsers();

    if (cleanEmail && users.find(u => u.email === cleanEmail)) {
      throw new Error("Email đã được sử dụng");
    }
    if (cleanPhone && users.find(u => u.phone === cleanPhone)) {
      throw new Error("Số điện thoại đã được sử dụng");
    }

    const hashedPassword = await hashPassword(userData.password);

    let ageGroup = "adult";
    if (userData.birthday) {
      const birthYear = new Date(userData.birthday).getFullYear();
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;
      if (age <= 11) ageGroup = "child";
      else if (age <= 17) ageGroup = "teen";
      else if (age <= 25) ageGroup = "young_adult";
      else if (age <= 55) ageGroup = "adult";
      else ageGroup = "elderly";
    } else if (userData.ageGroup) {
      ageGroup = userData.ageGroup;
    }

    const newUser = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + "_" + Math.random().toString(36).slice(2, 11),
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      birthday: userData.birthday,
      ageGroup: ageGroup,
      password: hashedPassword,
      joinDate: new Date().toLocaleDateString(),
      avatar: cleanName
        ? cleanName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
        : "👤",
      loginMethod: userData.loginMethod,
    };

    await UserStore.saveUsers([...users, newUser]);

    // Derive key for new user
    await setEncryptionKeyFromPassword(userData.password, newUser.id);

    return newUser;
  },

  changePassword: async (userId, currentPassword, newPassword) => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const users = await UserStore.getUsers();
    const user = users.find(u => u.id === userId);

    if (!user) throw new Error("Người dùng không tồn tại");

    const isValid = await verifyPassword(currentPassword, user.password);
    if (!isValid) {
      throw new Error("Mật khẩu hiện tại không đúng");
    }

    const hashedNext = await hashPassword(newPassword);
    const updatedUser = { ...user, password: hashedNext };

    const updatedUsers = users.map(u => u.id === userId ? updatedUser : u);
    await UserStore.saveUsers(updatedUsers);

    // Update active encryption key for the new password
    await setEncryptionKeyFromPassword(newPassword, userId);

    const currentSession = await UserStore.getSession();
    if (currentSession && currentSession.id === userId) {
      await UserStore.saveSession(updatedUser);
    }

    return updatedUser;
  }
};

// --- Helper nội bộ: SHA-256 thuần (dùng khi migration hash cũ nhất) ---
async function legacyHashSHA256(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
