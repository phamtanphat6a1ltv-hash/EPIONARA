import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { UserStore, getDeviceInfo, generateOTP } from "../../utils/db.js";
import { AuthAPI } from "../../utils/authApi.js";
import { useFocusTrap } from "../../hooks/useFocusTrap.js";
import styles from "./AuthModal.module.css";
import { encryptData, decryptData, getDeviceKey } from "../../utils/crypto";

// Helper to load saved credentials from localStorage securely
async function getSavedCredentials() {
  try {
    const deviceKey = await getDeviceKey();
    const raw = localStorage.getItem("sj_saved_credentials");
    if (!raw) return [];
    const decrypted = await decryptData(raw, deviceKey);
    return decrypted ? JSON.parse(decrypted) : [];
  } catch {
    return [];
  }
}

// Helper to save credentials securely on the device
async function saveCredential(user, password) {
  try {
    const list = await getSavedCredentials();
    const cleanList = list.filter((item) => item.id !== user.id);
    cleanList.push({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      email: user.email,
      phone: user.phone,
      password: password, // stored encrypted locally
      ts: Date.now(),
    });
    const deviceKey = await getDeviceKey();
    const encrypted = await encryptData(JSON.stringify(cleanList), deviceKey);
    if (encrypted) {
      localStorage.setItem("sj_saved_credentials", encrypted);
    }
  } catch (e) {
    console.error("Lỗi lưu tài khoản:", e);
  }
}

// Helper to delete saved credentials
async function deleteSavedCredential(id) {
  try {
    const list = await getSavedCredentials();
    const cleanList = list.filter((item) => item.id !== id);
    const deviceKey = await getDeviceKey();
    const encrypted = await encryptData(JSON.stringify(cleanList), deviceKey);
    if (encrypted) {
      localStorage.setItem("sj_saved_credentials", encrypted);
    } else {
      localStorage.removeItem("sj_saved_credentials");
    }
  } catch (e) {
    console.error("Lỗi xóa tài khoản đã lưu:", e);
  }
}

// =================== AUTH MODAL ===================
// OTP Simulator — shows demo notification in-app
function simulateEmailOTP(email, otp) {
  console.log(`[EPIONARA DEMO] Email OTP to ${email}: ${otp}`);
}
function simulateSMSOTP(phone, otp) {
  console.log(`[EPIONARA DEMO] SMS OTP to ${phone}: ${otp}`);
}

function OTPStep({ channel, target, otp, onVerified, onResend, onBack, t }) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const inputs = useRef([]);

  const handleDigit = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const nc = [...code];
    nc[i] = val.slice(-1);
    setCode(nc);
    setError("");
    if (val && i < 5) inputs.current[i + 1]?.focus();
    if (nc.every((d) => d) && nc.join("").length === 6) {
      setTimeout(() => verify(nc.join("")), 100);
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const verify = async (fullCode) => {
    const stored = await UserStore.getOTP(target);
    if (stored && fullCode === stored) {
      setVerified(true);
      await UserStore.clearOTP(target);
      setTimeout(onVerified, 800);
    } else {
      setError(t.otp_invalid);
      setCode(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{channel === "email" ? "📧" : "📱"}</div>
      <h3 style={{ color: "white", fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>{t.otp_title}</h3>
      <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, margin: "0 0 24px", lineHeight: 1.6 }}>
        {channel === "email" ? t.otp_sub_email : t.otp_sub_phone}
        <br />
        <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>{target}</span>
      </p>

      {/* Demo OTP display */}
      <div
        style={{
          background: "rgba(34,211,238,0.08)",
          border: "1px solid rgba(34,211,238,0.25)",
          borderRadius: 10,
          padding: "10px 16px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 8,
          justifyContent: "center",
        }}
      >
        <span style={{ color: "#22d3ee", fontSize: 13 }}>{t.otp_demo_note}</span>
        <span style={{ color: "white", fontWeight: 800, fontSize: 18, letterSpacing: 4 }}>{otp}</span>
      </div>

      {/* 6-digit input */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20 }}>
        {code.map((d, i) => (
          <input
            key={i}
            ref={(el) => (inputs.current[i] = el)}
            value={d}
            onChange={(e) => handleDigit(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            maxLength={1}
            aria-label={`OTP Digit ${i + 1}`}
            style={{
              width: 44,
              height: 52,
              textAlign: "center",
              fontSize: 22,
              fontWeight: 700,
              background: d ? "rgba(108,61,232,0.2)" : "rgba(255,255,255,0.06)",
              border: `1px solid ${d ? "rgba(108,61,232,0.6)" : "rgba(255,255,255,0.12)"}`,
              borderRadius: 10,
              color: "white",
              outline: "none",
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
          />
        ))}
      </div>

      {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{error}</div>}
      {verified && (
        <div
          style={{
            color: "#22c55e",
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 12,
            animation: "fadeInDown 0.3s ease",
          }}
        >
          {t.otp_success}
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={onBack}
          style={{
            flex: 1,
            padding: "11px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.65)",
            borderRadius: 10,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          ← Back
        </button>
        <button
          onClick={() => {
            const c = code.join("");
            if (c.length === 6) verify(c);
          }}
          style={{
            flex: 2,
            padding: "11px",
            background: "linear-gradient(135deg,#6c3de8,#8b5cf6)",
            border: "none",
            color: "white",
            borderRadius: 10,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {t.otp_verify}
        </button>
      </div>
      <button
        onClick={onResend}
        style={{
          background: "none",
          border: "none",
          color: "#a78bfa",
          cursor: "pointer",
          fontSize: 12,
          marginTop: 14,
        }}
      >
        {t.otp_resend}
      </button>
    </div>
  );
}

function AuthModal({ mode, onClose, onSuccess, t }) {
  const [isLogin, setIsLogin] = useState(mode === "login");
  const [loginMethod, setLoginMethod] = useState("email"); // "email" | "phone"
  const [form, setForm] = useState({ name: "", email: "", phone: "", birthday: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [otpStep, setOtpStep] = useState(false); // show OTP screen
  const [currentOTP, setCurrentOTP] = useState("");
  const [pendingUser, setPendingUser] = useState(null);
  const [rememberMe, setRememberMe] = useState(true);

  // Strong Authentication: Brute-force protection state
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(0);

  // Saved credentials state
  const [savedAccounts, setSavedAccounts] = useState([]);

  // Google Selector State
  const [showGoogleSelector, setShowGoogleSelector] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [isAddingGoogleAccount, setIsAddingGoogleAccount] = useState(false);

  useEffect(() => {
    const loadSaved = async () => {
      const list = await getSavedCredentials();
      setSavedAccounts(list);
    };
    loadSaved();
  }, [isLogin]);

  // Generate a strong, cryptographically secure password
  const handleSuggestPassword = () => {
    const length = 12;
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()";
    const allChars = uppercase + lowercase + numbers + symbols;

    let generated = "";
    // Guarantee at least one from each character class
    generated += uppercase[Math.floor(Math.random() * uppercase.length)];
    generated += lowercase[Math.floor(Math.random() * lowercase.length)];
    generated += numbers[Math.floor(Math.random() * numbers.length)];
    generated += symbols[Math.floor(Math.random() * symbols.length)];

    for (let i = 4; i < length; i++) {
      generated += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password characters
    const shuffled = generated.split("").sort(() => 0.5 - Math.random()).join("");
    setForm({ ...form, password: shuffled, confirm: shuffled });
    showToast("Đã tạo mật khẩu mạnh và tự điền!", "#10b981");
  };

  const trapRef = useFocusTrap(true);

  const firstInputRef = useRef(null);

  // Touch Drag-to-Dismiss State for mobile bottom sheet
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [dragging, setDragging] = useState(false);

  // Autofocus first visible input field
  const getFirstInputKey = () => {
    if (!isLogin) return "name";
    return loginMethod === "email" ? "email" : "phone";
  };

  useEffect(() => {
    if (!otpStep) {
      const timer = setTimeout(() => {
        firstInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isLogin, loginMethod, otpStep]);

  // Touch Handlers for mobile swipe down gesture
  const handleTouchStart = (e) => {
    if (window.innerWidth > 768) return;
    setStartY(e.touches[0].clientY);
    setDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!dragging) return;
    const diff = e.touches[0].clientY - startY;
    if (diff > 0) {
      setCurrentY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!dragging) return;
    setDragging(false);
    if (currentY > 150) {
      onClose();
    } else {
      setCurrentY(0);
    }
  };

  // Password Strength Entropy Calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: "", color: "transparent" };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) {
      return { score, label: t.pwd_weak || "Yếu", color: "#ef4444" };
    } else if (score <= 4) {
      return { score, label: t.pwd_medium || "Trung bình", color: "#fbbf24" };
    } else {
      return { score, label: t.pwd_strong || "Mạnh", color: "#10b981" };
    }
  };

  // Real-time on-blur validation
  const validateField = (key, value) => {
    const newErrors = { ...errors };
    if (key === "name" && !isLogin && !value.trim()) {
      newErrors.name = t.err_required || "Trường này là bắt buộc";
    } else if (key === "email") {
      if (loginMethod === "email" || !isLogin) {
        if (!value.trim()) {
          newErrors.email = t.err_required || "Trường này là bắt buộc";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = t.err_email || "Email không hợp lệ";
        } else {
          delete newErrors.email;
        }
      }
    } else if (key === "phone") {
      if (loginMethod === "phone" || !isLogin) {
        if (!value.trim()) {
          newErrors.phone = t.err_required || "Trường này là bắt buộc";
        } else if (!/^[0-9+\s\-]{8,15}$/.test(value)) {
          newErrors.phone = t.err_phone || "Số điện thoại không hợp lệ";
        } else {
          delete newErrors.phone;
        }
      }
    } else if (key === "password") {
      // Strong Authentication: Enforce strict password policy
      const isStrong = value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value);
      if (!isStrong) {
        newErrors.password = t.err_password_secure || "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, thường, số và ký tự đặc biệt";
      } else {
        delete newErrors.password;
      }
    } else if (key === "confirm" && !isLogin) {
      if (value !== form.password) {
        newErrors.confirm = t.err_confirm || "Mật khẩu không khớp";
      } else {
        delete newErrors.confirm;
      }
    } else {
      delete newErrors[key];
    }
    setErrors(newErrors);
  };

  // Close on Escape key press
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const showToast = (msg, color = "#22c55e") => {
    setToast({ msg, color });
    setTimeout(() => setToast(""), 3500);
  };

  const validate = () => {
    const e = {};
    if (!isLogin && !form.name.trim()) e.name = t.err_required;
    if (loginMethod === "email") {
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t.err_email;
    } else {
      if (!form.phone.trim() || !/^[0-9+\s\-]{8,15}$/.test(form.phone)) e.phone = t.err_phone;
    }
    if (!isLogin && loginMethod === "email" && (!form.phone.trim() || !/^[0-9+\s\-]{8,15}$/.test(form.phone)))
      e.phone = t.err_phone;
    
    // Strong Authentication: Enforce strict password policy
    const isPassStrong = form.password.length >= 8 && /[A-Z]/.test(form.password) && /[a-z]/.test(form.password) && /[0-9]/.test(form.password) && /[^A-Za-z0-9]/.test(form.password);
    if (!isPassStrong) e.password = t.err_password_secure || "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, thường, số và ký tự đặc biệt";
    if (!isLogin && form.password !== form.confirm) e.confirm = t.err_confirm;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const doLogin = async (user) => {
    // Save account & credentials locally
    if (form.password) {
      await saveCredential(user, form.password);
    }
    const dev = getDeviceInfo();
    const entry = {
      time: new Date().toLocaleString(),
      method: loginMethod === "phone" ? t.hist_method_phone : t.hist_method_email,
      device: `${dev.device} · ${dev.browser}`,
      os: dev.os,
      status: "success",
      ip: "127.0.0.x",
    };
    UserStore.addHistory(user.id, entry);
    await UserStore.saveSession(user, rememberMe);
    showToast(t.login_success);
    setTimeout(() => {
      onSuccess(user);
      onClose();
    }, 900);
  };

  const handleSubmit = async () => {
    // Strong Authentication: Check lockout status
    if (isLogin && Date.now() < lockoutUntil) {
      const waitTime = Math.ceil((lockoutUntil - Date.now()) / 1000);
      setErrors({ submit: `Tài khoản tạm thời bị khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau ${waitTime} giây.` });
      return;
    }

    if (!validate()) return;
    setLoading(true);

    const identifier = loginMethod === "phone" ? form.phone : form.email;

    try {
      if (isLogin) {
        const user = await AuthAPI.login(loginMethod, identifier, form.password);
        setLoginAttempts(0); // Reset on success

        setPendingUser(user);
        // Trigger OTP
        const otp = generateOTP();
        const otpKey = loginMethod === "email" ? user.email : user.phone;
        await UserStore.setOTP(otpKey, otp);
        setCurrentOTP(otp);
        if (loginMethod === "email") simulateEmailOTP(user.email, otp);
        else simulateSMSOTP(user.phone, otp);
        setOtpStep(true);
      } else {
        const newUser = await AuthAPI.register({
          name: form.name,
          email: form.email,
          phone: form.phone,
          birthday: form.birthday,
          password: form.password,
          loginMethod,
        });

        const dev = getDeviceInfo();
        UserStore.addHistory(newUser.id, {
          time: new Date().toLocaleString(),
          method: loginMethod === "phone" ? t.hist_method_phone : t.hist_method_email,
          device: `${dev.device} · ${dev.browser}`,
          os: dev.os,
          status: "success",
          ip: "127.0.0.x",
        });
        // Save account & credentials locally
        await saveCredential(newUser, form.password);
        await UserStore.saveSession(newUser, rememberMe);
        showToast(t.register_success);
        setTimeout(() => {
          onSuccess(newUser);
          onClose();
        }, 900);
      }
    } catch (err) {
      // Log failed login attempt and increment brute-force counter
      if (isLogin) {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        if (newAttempts >= 5) {
          setLockoutUntil(Date.now() + 60 * 1000); // 1 minute lockout
        }
        
        try {
          const users = await UserStore.getUsers();
          const cleanIdentifier = loginMethod === "email" ? identifier.trim().toLowerCase() : identifier.trim();
          const matchedUser = users.find(u => (loginMethod === "email" ? u.email === cleanIdentifier : u.phone === cleanIdentifier));
          if (matchedUser) {
            const dev = getDeviceInfo();
            UserStore.addHistory(matchedUser.id, {
              time: new Date().toLocaleString(),
              method: loginMethod === "phone" ? t.hist_method_phone : t.hist_method_email,
              device: `${dev.device} · ${dev.browser}`,
              os: dev.os,
              status: "failed",
              ip: "127.0.0.x",
            });
          }
        } catch (e) {
          console.error("Lỗi ghi lịch sử thất bại:", e);
        }
      }
      setErrors({ submit: err.message || t.err_login });
    }

    setLoading(false);
  };

  const resendOTP = async () => {
    const otp = generateOTP();
    const otpKey = loginMethod === "email" ? pendingUser?.email : pendingUser?.phone;
    await UserStore.setOTP(otpKey, otp);
    setCurrentOTP(otp);
    if (loginMethod === "email") simulateEmailOTP(otpKey, otp);
    else simulateSMSOTP(otpKey, otp);
    showToast("OTP mới đã được gửi!", "#3b82f6");
  };

  const handleSelectGoogleAccount = async (email, name) => {
    setGoogleLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));

      const cleanEmail = email.trim().toLowerCase();
      const password = `google_auth_sec_${cleanEmail}`;

      const users = await UserStore.getUsers();
      let user = users.find(u => u.email === cleanEmail);

      if (!user) {
        user = await AuthAPI.register({
          name: name,
          email: cleanEmail,
          phone: "",
          birthday: "",
          password: password,
          loginMethod: "email"
        });
        showToast("Đã liên kết tài khoản Google mới thành công! 🎉");
      } else {
        user = await AuthAPI.login("email", cleanEmail, password);
      }

      await doLogin(user);
      setShowGoogleSelector(false);
    } catch (err) {
      console.error("[Google Auth Error]:", err);
      showToast(err.message || "Lỗi liên kết Google", "#ef4444");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setShowGoogleSelector(true);
  };

  const inp = (key, placeholder, type = "text") => {
    const isError = !!errors[key];
    const isFirstInput = key === getFirstInputKey();
    const pwdStrength = getPasswordStrength(form.password);

    return (
      <div className={styles.inputGroup}>
        <input
          ref={isFirstInput ? firstInputRef : null}
          type={type === "password" ? (showPass ? "text" : "password") : type}
          placeholder={placeholder}
          value={form[key]}
          onChange={(e) => {
            setForm({ ...form, [key]: e.target.value });
            setErrors({ ...errors, [key]: "" });
          }}
          onBlur={() => validateField(key, form[key])}
          className={`${styles.inputField} ${isError ? styles.inputFieldError : ""}`}
        />
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPass((p) => !p)}
            className={styles.passwordToggle}
            aria-label={showPass ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
          >
            {showPass ? "🙈" : "👁️"}
          </button>
        )}
        {key === "password" && !isLogin && (
          <button
            type="button"
            onClick={handleSuggestPassword}
            style={{
              background: "rgba(167,139,250,0.15)",
              border: "1px solid rgba(167,139,250,0.3)",
              color: "#c084fc",
              padding: "5px 10px",
              borderRadius: 8,
              fontSize: 10,
              cursor: "pointer",
              marginTop: 6,
              fontWeight: 600,
              width: "fit-content",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(167,139,250,0.25)";
              e.currentTarget.style.borderColor = "#c084fc";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "rgba(167,139,250,0.15)";
              e.currentTarget.style.borderColor = "rgba(167,139,250,0.3)";
            }}
          >
            ✨ Gợi ý mật khẩu mạnh
          </button>
        )}
        {key === "password" && form.password && (
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
              <span>Độ mạnh mật khẩu:</span>
              <span style={{ color: pwdStrength.color, fontWeight: 600 }}>{pwdStrength.label}</span>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 99, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${(pwdStrength.score / 5) * 100}%`,
                  background: pwdStrength.color,
                  borderRadius: 99,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        )}
        {errors[key] && <div className={styles.errorText}>{errors[key]}</div>}
      </div>
    );
  };

  return (
    <div className={styles.modalOverlay}>
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: `linear-gradient(135deg,${toast.color},${toast.color}cc)`,
            color: "white",
            padding: "11px 26px",
            borderRadius: 99,
            fontSize: 13,
            fontWeight: 600,
            zIndex: 6000,
            boxShadow: `0 8px 30px ${toast.color}55`,
            animation: "fadeInDown 0.3s ease",
            whiteSpace: "nowrap",
          }}
        >
          {toast.msg}
        </div>
      )}

      {showGoogleSelector ? (
        <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className={styles.backdrop} onClick={() => { if (!googleLoading) setShowGoogleSelector(false); }} />
          <div
            ref={trapRef}
            role="dialog"
            aria-modal="true"
            className={styles.modalContent}
            style={{ animation: "modalIn 0.35s cubic-bezier(.34,1.56,.64,1)", zIndex: 100, display: "flex", flexDirection: "column" }}
          >
            <button onClick={() => { if (!googleLoading) setShowGoogleSelector(false); }} aria-label={t.close || "Đóng"} className={styles.closeButton}>
              ✕
            </button>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <svg width="32" height="32" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            
            <h3 style={{ color: "white", fontSize: 20, fontWeight: 800, margin: "0 0 6px" }}>
              {googleLoading ? "Đang kết nối Google..." : "Đăng nhập bằng Google"}
            </h3>
            <p style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 13, margin: "0 0 24px" }}>
              {googleLoading ? "Vui lòng chờ trong giây lát..." : "Chọn tài khoản để tiếp tục tới EPIONARA"}
            </p>

            {googleLoading ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0" }}>
                <div style={{ width: 40, height: 40, border: "3px solid rgba(66, 133, 244, 0.2)", borderTop: "3px solid #4285F4", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : (
              <>
                {isAddingGoogleAccount ? (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (googleEmail.trim() && googleName.trim()) {
                      handleSelectGoogleAccount(googleEmail.trim(), googleName.trim());
                    }
                  }} style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: "left" }}>
                    <div>
                      <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, display: "block", marginBottom: 6, fontWeight: 600 }}>ĐỊA CHỈ EMAIL GOOGLE:</label>
                      <input
                        type="email"
                        value={googleEmail}
                        onChange={e => setGoogleEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        required
                        style={{
                          width: "100%",
                          background: "rgba(0,0,0,0.25)",
                          border: "1.5px solid rgba(255,255,255,0.12)",
                          borderRadius: 10,
                          padding: "10px 14px",
                          color: "white",
                          fontSize: 13,
                          outline: "none"
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, display: "block", marginBottom: 6, fontWeight: 600 }}>TÊN CỦA BẠN:</label>
                      <input
                        type="text"
                        value={googleName}
                        onChange={e => setGoogleName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        required
                        style={{
                          width: "100%",
                          background: "rgba(0,0,0,0.25)",
                          border: "1.5px solid rgba(255,255,255,0.12)",
                          borderRadius: 10,
                          padding: "10px 14px",
                          color: "white",
                          fontSize: 13,
                          outline: "none"
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button type="button" onClick={() => setIsAddingGoogleAccount(false)} style={{
                        flex: 1, padding: "10px", background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", borderRadius: 10, cursor: "pointer", fontSize: 13
                      }}>{t.confirm_cancel || "Hủy"}</button>
                      <button type="submit" style={{
                        flex: 1.5, padding: "10px", background: "linear-gradient(135deg, #4285F4, #357ae8)", border: "none", color: "white", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600
                      }}>Tiếp theo</button>
                    </div>
                  </form>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { email: "viana.nguyen@gmail.com", name: "Nguyễn Văn A", avatar: "VA" },
                      { email: "thi.b.tran@gmail.com", name: "Trần Thị B", avatar: "TB" }
                    ].map(acc => (
                      <button 
                        key={acc.email}
                        onClick={() => handleSelectGoogleAccount(acc.email, acc.name)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          width: "100%",
                          padding: "12px 14px",
                          background: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: 12,
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(66, 133, 244, 0.1)"; e.currentTarget.style.borderColor = "rgba(66, 133, 244, 0.3)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)"; e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)"; }}
                      >
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #4285F4, #34A853)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 12 }}>
                          {acc.avatar}
                        </div>
                        <div style={{ textAlign: "left" }}>
                          <div style={{ color: "white", fontWeight: 600, fontSize: 13 }}>{acc.name}</div>
                          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>{acc.email}</div>
                        </div>
                      </button>
                    ))}
                    
                    <button 
                      onClick={() => {
                        setGoogleEmail("");
                        setGoogleName("");
                        setIsAddingGoogleAccount(true);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        width: "100%",
                        padding: "12px 14px",
                        background: "none",
                        border: "1px dashed rgba(255, 255, 255, 0.15)",
                        borderRadius: 12,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        color: "rgba(255,255,255,0.65)",
                        fontSize: 13,
                        fontWeight: 500,
                        justifyContent: "center"
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
                    >
                      <span>➕</span> Sử dụng tài khoản khác
                    </button>

                    <button 
                      onClick={() => setShowGoogleSelector(false)}
                      style={{
                        marginTop: 14,
                        padding: "10px",
                        background: "none",
                        border: "none",
                        color: "rgba(255,255,255,0.35)",
                        cursor: "pointer",
                        fontSize: 12,
                        textDecoration: "underline"
                      }}
                    >
                      Quay lại đăng nhập
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className={styles.backdrop} onClick={otpStep ? undefined : onClose} />
          <div
            ref={trapRef}
            role="dialog"
            aria-modal="true"
            className={styles.modalContent}
            style={{
              transform: `translateY(${currentY}px)`,
              transition: dragging ? "none" : "transform 0.25s ease",
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Drag handle for mobile */}
            <div
              style={{
                width: 40,
                height: 5,
                background: "rgba(255, 255, 255, 0.25)",
                borderRadius: 99,
                margin: "-20px auto 20px",
                display: "none",
              }}
              className={styles.dragHandle}
            />

            <button onClick={onClose} aria-label={t.close || "Đóng"} className={styles.closeButton}>
              ✕
            </button>

            {otpStep ? (
              <OTPStep
                channel={loginMethod}
                target={loginMethod === "email" ? pendingUser?.email : pendingUser?.phone}
                otp={currentOTP}
                t={t}
                onVerified={() => doLogin(pendingUser)}
                onResend={resendOTP}
                onBack={() => {
                  setOtpStep(false);
                  setCurrentOTP("");
                }}
              />
            ) : (
              <>
                {/* Header */}
                <div className={styles.header}>
                  <div className={styles.headerIcon}>🪞</div>
                  <h2 className={styles.headerTitle}>{isLogin ? t.auth_welcome : t.auth_create}</h2>
                  <p className={styles.headerSub}>{isLogin ? t.auth_sub : t.auth_sub2}</p>
                </div>

                {/* Login/Register tabs */}
                <div className={styles.tabs}>
                  {[
                    { label: t.login, val: true },
                    { label: t.register, val: false },
                  ].map(({ label, val }) => (
                    <button
                      key={String(val)}
                      onClick={() => {
                        setIsLogin(val);
                        setErrors({});
                      }}
                      className={`${styles.tabButton} ${isLogin === val ? styles.tabButtonActive : ""}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Method selector (only for login) */}
                {isLogin && (
                  <div className={styles.methodSelector}>
                    {[
                      { id: "email", label: "📧 Email / Google" },
                      { id: "phone", label: "📱 SMS" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setLoginMethod(m.id);
                          setErrors({});
                        }}
                        className={`${styles.methodButton} ${loginMethod === m.id ? styles.methodButtonActive : ""}`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Saved Accounts section */}
                {isLogin && savedAccounts.length > 0 && (
                  <div style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    borderRadius: 16,
                    padding: "10px 12px",
                    marginBottom: 16,
                  }}>
                    <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 6, letterSpacing: "0.5px" }}>
                      <span>🔑</span> {t.saved_pw_label || "TÀI KHOẢN ĐÃ LƯU TRÊN THIẾT BỊ"}
                    </div>
                    <div style={{ 
                      display: "flex", 
                      flexDirection: "column", 
                      gap: 4, 
                      maxHeight: "135px", 
                      overflowY: "auto",
                      paddingRight: 4,
                    }}>
                      {savedAccounts.map(acc => (
                        <div 
                          key={acc.id} 
                          style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "space-between",
                            padding: "6px 10px", 
                            background: "rgba(255, 255, 255, 0.02)", 
                            border: "1px solid rgba(255, 255, 255, 0.04)",
                            borderRadius: 8,
                            cursor: "pointer",
                            transition: "all 0.15s ease"
                          }}
                          onClick={() => {
                            setForm({
                              ...form,
                              email: acc.email || "",
                              phone: acc.phone || "",
                              password: acc.password || ""
                            });
                            setLoginMethod(acc.phone ? "phone" : "email");
                            showToast(`Đã điền ${acc.name}!`, "#3b82f6");
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = "rgba(167,139,250,0.08)";
                            e.currentTarget.style.borderColor = "rgba(167,139,250,0.2)";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.04)";
                          }}
                          title="Click để điền nhanh"
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
                            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg,#6c3de8,#22d3ee)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "white", flexShrink: 0 }}>
                              {acc.avatar}
                            </div>
                            <div style={{ textAlign: "left", minWidth: 0, flex: 1 }}>
                              <div style={{ color: "white", fontWeight: 600, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{acc.name}</div>
                              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{acc.email || acc.phone}</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await deleteSavedCredential(acc.id);
                              const list = await getSavedCredentials();
                              setSavedAccounts(list);
                              showToast("Đã xóa tài khoản đã lưu!", "#ef4444");
                            }}
                            aria-label="Xóa thông tin đã lưu"
                            style={{
                              background: "rgba(255,255,255,0.04)",
                              border: "none",
                              color: "rgba(255,255,255,0.4)",
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 10,
                              marginLeft: 8,
                              transition: "all 0.15s ease",
                              flexShrink: 0
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = "rgba(239,68,68,0.15)";
                              e.currentTarget.style.color = "#f87171";
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                              e.currentTarget.style.color = "rgba(255,255,255,0.4)";
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Form fields */}
                {!isLogin && inp("name", t.full_name)}
                {(loginMethod === "email" || !isLogin) && inp("email", t.email, "email")}
                {(loginMethod === "phone" || !isLogin) && inp("phone", t.phone, "tel")}
                {!isLogin && (
                  <div style={{ marginBottom: 14 }}>
                    <input
                      type="date"
                      value={form.birthday}
                      aria-label={t.birthday || "Ngày sinh"}
                      onChange={(e) => setForm({ ...form, birthday: e.target.value })}
                      style={{
                        width: "100%",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 12,
                        color: "white",
                        padding: "12px 14px",
                        fontSize: 14,
                        boxSizing: "border-box",
                        colorScheme: "dark",
                        fontFamily: "inherit",
                      }}
                    />
                    <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, marginTop: 3 }}>📅 {t.birthday}</div>
                  </div>
                )}
                {inp("password", t.password, "password")}
                {!isLogin && inp("confirm", t.confirm_password, "password")}

                {/* Remember Me Checkbox */}
                <label className={styles.rememberMeRow}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className={styles.rememberMeCheckbox}
                  />
                  <span>{t.remember_me || "Ghi nhớ đăng nhập"}</span>
                </label>

                {errors.submit && <div className={styles.submitError}>{errors.submit}</div>}

                <button onClick={handleSubmit} disabled={loading} className={styles.submitButton}>
                  {loading ? "⏳ ..." : isLogin ? t.login : t.register}
                </button>

                {((isLogin && loginMethod === "email") || !isLogin) && (
                  <>
                    <div className={styles.divider}>
                      <div className={styles.dividerLine} />
                      <span className={styles.dividerText}>{t.or}</span>
                      <div className={styles.dividerLine} />
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      className={styles.googleButton}
                      style={{ marginBottom: 16 }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span>{t.google_sign_in}</span>
                    </button>
                  </>
                )}
                <div className={styles.switchText}>
                  {isLogin ? t.no_account : t.have_account}{" "}
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setErrors({});
                    }}
                    className={styles.switchButton}
                  >
                    {isLogin ? t.register_here : t.login_here}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

OTPStep.propTypes = {
  channel: PropTypes.string,
  target: PropTypes.string.isRequired,
  otp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onVerified: PropTypes.func.isRequired,
  onResend: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  t: PropTypes.object.isRequired,
};

AuthModal.propTypes = {
  mode: PropTypes.oneOf(["login", "register"]).isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  t: PropTypes.object.isRequired,
};

export default AuthModal;
