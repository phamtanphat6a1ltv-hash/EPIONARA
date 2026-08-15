import { useState } from "react";
import { UserStore } from "../../utils/db.js";
import { AuthAPI } from "../../utils/authApi.js";
import { LogoutModal } from "../nav/Nav.jsx";
import { useAppContext } from "../../context/AppContext.jsx";
import { useThemeContext } from "../../context/ThemeContext.jsx";
import { ConfirmDialog } from "../ConfirmDialog.jsx";
import styles from "./ProfilePage.module.css";
import { ARCHETYPES, RARITIES } from "../../utils/constants.js";

// =================== PROFILE PAGE ===================
function LoginHistoryPage({ onBack }) {
  const { user, t, lang } = useAppContext();
  const [showConfirm, setShowConfirm] = useState(false);
  const history = UserStore.getHistory(user.id);

  return (
    <div className={styles.historyContainer}>
      <div className={styles.historyInner}>
        <div className={styles.historyHeader}>
          <button
            onClick={onBack}
            aria-label={t.back || "Quay lại trang hồ sơ"}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)",
              padding: "8px 16px",
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            ← {t.back || "Back"}
          </button>
          <h1 style={{ color: "white", fontSize: 24, fontWeight: 800, margin: 0 }}>🔐 {t.login_history_title}</h1>
        </div>

        {history.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.55)", fontSize: 15 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            {t.hist_empty}
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className={styles.historyGrid}>
              {[
                { 
                  label: ({
                    vi: "Tổng đăng nhập",
                    en: "Total logins",
                    ja: "総ログイン数",
                    ko: "총 로그인 횟수",
                    zh: "总登录次数"
                  })[lang] || "Total logins", 
                  value: history.length, 
                  color: "#a78bfa", 
                  icon: "🔑" 
                },
                { label: t.hist_success, value: history.filter((h) => h.status === "success").length, color: "#22c55e", icon: "✅" },
                { label: t.hist_failed, value: history.filter((h) => h.status === "failed").length, color: "#ef4444", icon: "❌" },
                { label: t.hist_device || "Thiết bị", value: [...new Set(history.map((h) => h.browser || ""))].filter(Boolean).length || 1, color: "#22d3ee", icon: "💻" },
              ].map((s) => (
                <div key={s.label} className={styles.historyCard}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* History list */}
            <div className={styles.historyTable}>
              {/* Header row */}
              <div className={styles.tableHeaderRow}>
                {[t.hist_time, t.hist_device, t.hist_method, t.hist_status].map((h) => (
                  <div key={h} className={styles.tableHeaderCell}>
                    {h}
                  </div>
                ))}
              </div>

              {history.map((item, i) => (
                <div
                  key={item.id}
                  className={styles.tableDataRow}
                  style={{
                    borderBottom: i < history.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div>
                    <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 500 }}>
                      {item.time?.split(",")[0]}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, marginTop: 2 }}>
                      {item.time?.split(",")[1]?.trim()}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>{item.device}</div>
                    <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, marginTop: 2 }}>
                      {item.os} · {t.hist_ip}: {item.ip}
                    </div>
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>{item.method}</div>
                  <div>
                    <span
                      className={styles.statusBadge}
                      style={{
                        background: item.status === "success" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                        color: item.status === "success" ? "#22c55e" : "#f87171",
                        border: `1px solid ${item.status === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                      }}
                    >
                      {item.status === "success" ? "✅ OK" : "❌ Fail"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowConfirm(true)}
              className={styles.clearHistoryBtn}
              aria-label={t.hist_clear || "Xóa lịch sử đăng nhập"}
            >
              🗑️ {t.hist_clear}
            </button>

            {showConfirm && (
              <ConfirmDialog
                message={t.hist_clear_confirm}
                confirmLabel={t.confirm_ok}
                cancelLabel={t.confirm_cancel}
                danger={true}
                onConfirm={() => {
                  UserStore.clearHistory(user.id);
                  setShowConfirm(false);
                  window.location.reload();
                }}
                onCancel={() => setShowConfirm(false)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ProfilePage() {
  const { user, setUser, logout, t, lang, soulCoins, isPremium, unlockedCards, upgradePremium } = useAppContext();
  const { theme, setTheme } = useThemeContext();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...user });
  const [saved, setSaved] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPassSection, setShowPassSection] = useState(false);
  const [showProfileLogout, setShowProfileLogout] = useState(false);
  const [newPass, setNewPass] = useState({ current: "", next: "", confirm: "" });
  const [passMsg, setPassMsg] = useState(null);
  const [passLoading, setPassLoading] = useState(false);
  const [customKey, setCustomKey] = useState(() => localStorage.getItem("sj_custom_api_key") || "");
  const [keySaved, setKeySaved] = useState(false);
  const [showApiGuide, setShowApiGuide] = useState(false);
  const loginHistory = UserStore.getHistory(user.id);

  if (showHistory) return <LoginHistoryPage onBack={() => setShowHistory(false)} />;

  const saveKey = () => {
    let cleanKey = customKey.trim().replace(/^["'`]|["'`]$/g, "").replace(/^Bearer\s+/i, "").trim();
    if (cleanKey) {
      localStorage.setItem("sj_custom_api_key", cleanKey);
      setCustomKey(cleanKey);
    } else {
      localStorage.removeItem("sj_custom_api_key");
      setCustomKey("");
    }
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const save = async () => {
    let ageGroup = form.ageGroup || user.ageGroup || "adult";
    if (form.birthday && form.birthday !== user.birthday) {
      const birthYear = new Date(form.birthday).getFullYear();
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;
      if (age <= 11) ageGroup = "child";
      else if (age <= 17) ageGroup = "teen";
      else if (age <= 25) ageGroup = "young_adult";
      else if (age <= 55) ageGroup = "adult";
      else ageGroup = "elderly";
    }

    const updatedForm = { ...form, ageGroup };

    const allUsers = await UserStore.getUsers();
    const updatedUsers = allUsers.map((u) => (u.id === user.id ? { ...u, ...updatedForm } : u));
    await UserStore.saveUsers(updatedUsers);
    const sessionData = await UserStore.getSession();
    const rememberMe = sessionData ? sessionData.rememberMe : true;
    await UserStore.saveSession({ ...user, ...updatedForm }, rememberMe);
    setUser({ ...user, ...updatedForm });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const changePassword = async () => {
    if (!newPass.current || !newPass.next || !newPass.confirm) {
      setPassMsg({
        type: "error",
        text: ({
          vi: "Vui lòng điền đầy đủ",
          en: "Please fill in all fields",
          ja: "すべての項目を入力してください",
          ko: "모든 항목을 입력해 주세요",
          zh: "请填写所有字段"
        })[lang] || "Please fill in all fields"
      });
      return;
    }

    if (newPass.next.length < 6) {
      setPassMsg({ type: "error", text: t.err_password });
      return;
    }
    if (newPass.next !== newPass.confirm) {
      setPassMsg({ type: "error", text: t.err_confirm });
      return;
    }

    setPassLoading(true);
    try {
      const updatedUser = await AuthAPI.changePassword(user.id, newPass.current, newPass.next);
      const sessionData = await UserStore.getSession();
      const rememberMe = sessionData ? sessionData.rememberMe : true;
      await UserStore.saveSession(updatedUser, rememberMe);
      setUser(updatedUser);

      setPassMsg({
        type: "success",
        text: ({
          vi: "✅ Đổi mật khẩu thành công!",
          en: "✅ Password changed successfully!",
          ja: "✅ パスワードが正常に変更されました！",
          ko: "✅ 비밀번호 변경 완료!",
          zh: "✅ 密码修改成功！"
        })[lang] || "✅ Password changed successfully!"
      });
      setNewPass({ current: "", next: "", confirm: "" });
      setTimeout(() => setPassMsg(null), 3000);
    } catch (err) {
      setPassMsg({ type: "error", text: err.message });
    }
    setPassLoading(false);
  };

  const lastLogin = loginHistory[0];

  return (
    <div className={styles.container}>
      <div className={styles.innerContent}>
        <h1 className={styles.title}>👤 {t.profile_title}</h1>

        {/* Avatar card */}
        <div className={styles.avatarCard}>
          <div className={styles.avatarCircle} style={{ position: "relative" }}>
            {user.avatar}
            {isPremium && (
              <span
                style={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  fontSize: 16,
                  background: "#fbbf24",
                  borderRadius: "50%",
                  width: 24,
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 10px #fbbf24dd",
                }}
                title="Premium Member"
              >
                👑
              </span>
            )}
          </div>
          <h2 className={styles.userName} style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
            {user.name}
            {isPremium && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                  color: "#07091d",
                  padding: "2px 8px",
                  borderRadius: 99,
                  letterSpacing: 0.5,
                  boxShadow: "0 0 8px #fbbf2466",
                }}
              >
                PREMIUM
              </span>
            )}
          </h2>
          <p className={styles.userEmail}>{user.email}</p>

          <div className={styles.statsRow}>
            {[
              { v: "14", l: `${t.recorded} ${t.days}`, c: "#a78bfa" },
              { v: "3🔥", l: t.streak, c: "#22d3ee" },
              { v: "2", l: t.dash_tests, c: "#22c55e" },
            ].map((s) => (
              <div key={s.l} className={styles.statsItem}>
                <div className={styles.statsValue} style={{ color: s.c }}>
                  {s.v}
                </div>
                <div className={styles.statsLabel}>{s.l}</div>
              </div>
            ))}
          </div>
          {lastLogin && (
            <div className={styles.lastLoginRow}>
              <span className={styles.lastLoginLabel}>
                🕐 {({
                  vi: "Đăng nhập gần nhất:",
                  en: "Last logged in:",
                  ja: "最終ログイン時間:",
                  ko: "마지막 로그인:",
                  zh: "最近登录时间:"
                })[lang] || "Last logged in:"}
              </span>
              <span className={styles.lastLoginValue}>{lastLogin.time?.split(",")[0]}</span>
            </div>
          )}
        </div>

        {/* Quick action cards */}
        <div className={styles.grid2Col}>
          {[
            {
              icon: "🔐",
              label: t.login_history_title,
              sub: `${loginHistory.length} ` + ({
                vi: "lần",
                en: "times",
                ja: "回",
                ko: "회",
                zh: "次"
              })[lang] || "times",
              action: () => setShowHistory(true),
              color: "#a78bfa",
            },
            { 
              icon: "🔑", 
              label: ({
                vi: "Đổi mật khẩu",
                en: "Change password",
                ja: "パスワード変更",
                ko: "비밀번호 변경",
                zh: "修改密码"
              })[lang] || "Change password", 
              sub: "", 
              action: () => setShowPassSection((p) => !p), 
              color: "#22d3ee" 
            },
          ].map((c) => (
            <button
              key={c.label}
              onClick={c.action}
              className={styles.actionCardBtn}
              style={{
                background: `${c.color}0e`,
                border: `1px solid ${c.color}28`,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = `${c.color}18`)}
              onMouseLeave={(e) => (e.currentTarget.style.background = `${c.color}0e`)}
            >
              <div className={styles.actionCardIcon}>{c.icon}</div>
              <div className={styles.actionCardLabel}>{c.label}</div>
              <div className={styles.actionCardSub} style={{ color: c.color }}>
                {c.sub}
              </div>
            </button>
          ))}
        </div>

        {/* Theme Settings */}
        <div className={styles.aiConfigCard} style={{ marginTop: 24, marginBottom: 12 }}>
          <h3 className={styles.aiConfigTitle}>
            🎨 {({
              vi: "Thiết lập Giao diện",
              en: "Theme Settings",
              ja: "テーマ設定",
              ko: "테마 설정",
              zh: "主题设置"
            })[lang] || "Theme Settings"}
          </h3>
          <p className={styles.aiConfigDesc}>
            {({
              vi: "Lựa chọn giao diện hiển thị phù hợp với trạng thái tâm trạng của bạn.",
              en: "Select a theme that matches your current emotional state.",
              ja: "あなたの気分に合わせたテーマを選択してください。",
              ko: "당신의 마음 상태에 맞는 테마를 선택해 보세요.",
              zh: "选择适合您当前心情的主题。"
            })[lang] || "Select a theme that matches your current emotional state."}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginTop: 16 }}>
            {[
              { id: "dark", label: t.theme_dark, icon: "🌙", activeColor: "#a78bfa", desc: { vi: "Tĩnh lặng", en: "Silent Space", ja: "静かな空間", ko: "조용한 공간", zh: "安静空间" } },
              { id: "light", label: t.theme_light, icon: "☀️", activeColor: "#5c8273", desc: { vi: "Thảo mộc", en: "Healing Herbs", ja: "ハーブ療法", ko: "허브 치유", zh: "草药疗愈" } }
            ].map(tItem => {

              const isActive = theme === tItem.id;
              return (
                <button
                  key={tItem.id}
                  onClick={() => setTheme(tItem.id)}
                  style={{
                    background: isActive ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.02)",
                    border: isActive ? `2px solid ${tItem.activeColor}` : "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: 16,
                    padding: "16px 12px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.2s ease-in-out",
                    boxShadow: isActive ? `0 8px 24px -6px ${tItem.activeColor}44` : "none"
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                    }
                  }}
                >
                  <span style={{ fontSize: 24 }}>{tItem.icon}</span>
                  <span style={{ color: isActive ? "white" : "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: 13 }}>
                    {tItem.label}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>
                    {tItem.desc[lang] || tItem.desc.en}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* AI Configuration */}
        <div className={styles.aiConfigCard}>
          <h3 className={styles.aiConfigTitle}>
            🤖 {({
              vi: "Cấu hình AI Cá Nhân",
              en: "Personal AI Configuration",
              ja: "個人用AI設定",
              ko: "개인용 AI 설정",
              zh: "个人 AI 配置"
            })[lang] || "Personal AI Configuration"}
          </h3>
          <p className={styles.aiConfigDesc}>
            {({
              vi: "Sử dụng API Key riêng để tăng tốc độ phản hồi và không bị giới hạn.",
              en: "Use your own API Key to speed up responses and bypass rate limits.",
              ja: "独自のAPIキーを使用することで、応答速度が向上し、利用制限を回避できます。",
              ko: "본인의 API 키를 등록하여 빠른 응답을 받고 일일 쿼리 제한을 회피해 보세요.",
              zh: "使用您自己的 API 密钥以加快响应速度并绕过频率限制。"
            })[lang] || "Use your own API Key to speed up responses and bypass rate limits."}
          </p>

          <div className={styles.flexRow}>
            <input
              type="password"
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              placeholder={({
                vi: "Dán Gemini API Key tại đây...",
                en: "Paste Gemini API Key here...",
                ja: "ここにGeminiのAPIキーを貼り付け...",
                ko: "여기에 Gemini API 키 입력...",
                zh: "在此粘贴 Gemini API 密钥..."
              })[lang] || "Paste Gemini API Key here..."}
              className={styles.inputField}
              aria-label="Gemini API Key"
            />
            <button
              onClick={saveKey}
              className={styles.saveBtn}
              style={{
                background: keySaved ? "#22c55e" : "linear-gradient(135deg,#6c3de8,#8b5cf6)",
              }}
            >
              {keySaved 
                ? ((({ vi: "✓ Lưu", en: "✓ Saved", ja: "✓ 保存済み", ko: "✓ 저장됨", zh: "✓ 已保存" })[lang] || "✓ Saved") )
                : (({ vi: "Lưu", en: "Save", ja: "保存", ko: "저장", zh: "保存" })[lang] || "Save")}
            </button>
          </div>
          {customKey && (
            <button
              onClick={() => {
                setCustomKey("");
                localStorage.removeItem("sj_custom_api_key");
              }}
              className={styles.deleteKeyBtn}
            >
              {({
                vi: "✕ Xóa Key hiện tại",
                en: "✕ Delete current Key",
                ja: "✕ 現在のキーを削除",
                ko: "✕ 현재 키 삭제",
                zh: "✕ 删除当前密钥"
              })[lang] || "✕ Delete current Key"}
            </button>
          )}

          <div style={{ marginTop: 12 }}>
            <button
              onClick={() => setShowApiGuide(!showApiGuide)}
              className={styles.guideToggleBtn}
              type="button"
              aria-expanded={showApiGuide}
            >
              {showApiGuide 
                ? (({ vi: "📖 Ẩn hướng dẫn lấy API Key", en: "📖 Hide API Key Guide", ja: "📖 APIキーガイドを非表示", ko: "📖 API 키 가이드 숨기기", zh: "📖 隐藏 API 密钥指南" })[lang] || "📖 Hide API Key Guide")
                : (({ vi: "📖 Hướng dẫn lấy API Key cho người mới", en: "📖 How to get a Gemini API Key", ja: "📖 Gemini APIキーの取得方法", ko: "📖 Gemini API 키 발급 방법 안내", zh: "📖 如何获取 Gemini API 密钥" })[lang] || "📖 How to get a Gemini API Key")
              }
            </button>
          </div>

          {showApiGuide && (
            <div className={styles.apiGuideContainer}>
              <h4 className={styles.guideSubtitle}>
                {({
                  vi: "Các bước lấy Gemini API Key miễn phí:",
                  en: "Steps to get a free Gemini API Key:",
                  ja: "無料のGemini APIキーを取得する手順：",
                  ko: "Gemini 무료 API 키 발급 단계:",
                  zh: "免费获取 Gemini API 密钥的步骤："
                })[lang] || "Steps to get a free Gemini API Key:"}
              </h4>
              <ol className={styles.guideSteps}>
                <li>
                  <span className={styles.stepNum}>1</span>
                  <span>
                    {({
                      vi: "Truy cập trang phát triển AI của Google: ",
                      en: "Visit Google's AI developer site: ",
                      ja: "GoogleのAI開発者サイトにアクセスします： ",
                      ko: "구글 AI 개발자 사이트 접속: ",
                      zh: "访问 Google AI 开发者网站："
                    })[lang] || "Visit Google's AI developer site: "}
                    <a
                      href="https://aistudio.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.guideLink}
                    >
                      Google AI Studio ↗
                    </a>
                  </span>
                </li>
                <li>
                  <span className={styles.stepNum}>2</span>
                  <span>
                    {({
                      vi: "Đăng nhập bằng tài khoản Google (Gmail) của bạn.",
                      en: "Sign in with your Google (Gmail) account.",
                      ja: "お使い of Google（Gmail）アカウントでログインします。",
                      ko: "사용 중인 Google (Gmail) 계정으로 로그인합니다.",
                      zh: "使用您的 Google (Gmail) 账号登录。"
                    })[lang] || "Sign in with your Google (Gmail) account."}
                  </span>
                </li>
                <li>
                  <span className={styles.stepNum}>3</span>
                  <span>
                    {(() => {
                      if (lang === "vi") return <>Nhấn nút <strong style={{ color: "#a78bfa" }}>"Get API key"</strong> ở góc trên bên trái, sau đó chọn <strong style={{ color: "#a78bfa" }}>"Create API key"</strong>.</>;
                      if (lang === "ja") return <>左上の <strong style={{ color: "#a78bfa" }}>「Get API key」</strong> をクリックし、 <strong style={{ color: "#a78bfa" }}>「Create API key」</strong> を選択します。</>;
                      if (lang === "ko") return <>좌측 상단의 <strong style={{ color: "#a78bfa" }}>"Get API key"</strong>를 누른 후, <strong style={{ color: "#a78bfa" }}>"Create API key"</strong>를 선택합니다.</>;
                      if (lang === "zh") return <>点击左上角的 <strong style={{ color: "#a78bfa" }}>“Get API key”</strong>，然后选择 <strong style={{ color: "#a78bfa" }}>“Create API key”</strong>。</>;
                      return <>Click <strong style={{ color: "#a78bfa" }}>"Get API key"</strong> on the top left, then select <strong style={{ color: "#a78bfa" }}>"Create API key"</strong>.</>;
                    })()}
                  </span>
                </li>
                <li>
                  <span className={styles.stepNum}>4</span>
                  <span>
                    {(() => {
                      if (lang === "vi") return <>Chọn một dự án Google Cloud có sẵn hoặc tạo dự án mới, sau đó nhấn <strong style={{ color: "#a78bfa" }}>"Create API key in existing project"</strong>.</>;
                      if (lang === "ja") return <>既存のGoogle Cloudプロジェクトを選択するか新規作成し、 <strong style={{ color: "#a78bfa" }}>「Create API key in existing project」</strong> をクリックします。</>;
                      if (lang === "ko") return <>기존 Google Cloud 프로젝트를 선택하거나 새 프로젝트를 생성한 후, <strong style={{ color: "#a78bfa" }}>"Create API key in existing project"</strong>를 누릅니다.</>;
                      if (lang === "zh") return <>选择现有的 Google Cloud 项目或新建项目，然后点击 <strong style={{ color: "#a78bfa" }}>“Create API key in existing project”</strong>。</>;
                      return <>Select an existing Google Cloud project or create a new one, then click <strong style={{ color: "#a78bfa" }}>"Create API key in existing project"</strong>.</>;
                    })()}
                  </span>
                </li>
                <li>
                  <span className={styles.stepNum}>5</span>
                  <span>
                    {(() => {
                      if (lang === "vi") return <>Sao chép đoạn mã API Key hiển thị (thường bắt đầu bằng ký tự <code className={styles.inlineCode}>AIzaSy...</code>).</>;
                      if (lang === "ja") return <>生成されたAPIキー（通常は <code className={styles.inlineCode}>AIzaSy...</code> で始まります）をコピーします。</>;
                      if (lang === "ko") return <>생성된 API 키(보통 <code className={styles.inlineCode}>AIzaSy...</code>로 시작)를 복사합니다.</>;
                      if (lang === "zh") return <>复制生成的 API 密钥（通常以 <code className={styles.inlineCode}>AIzaSy...</code> 开头）。</>;
                      return <>Copy the generated API Key (usually starts with <code className={styles.inlineCode}>AIzaSy...</code>).</>;
                    })()}
                  </span>
                </li>
                <li>
                  <span className={styles.stepNum}>6</span>
                  <span>
                    {(() => {
                      if (lang === "vi") return <>Quay lại trang này, dán mã khóa vào ô nhập phía trên và nhấn nút <strong style={{ color: "#22d3ee" }}>"Lưu"</strong>.</>;
                      if (lang === "ja") return <>当ページに戻り、上の入力欄にキーを貼り付けて <strong style={{ color: "#22d3ee" }}>「保存」</strong> をクリックします。</>;
                      if (lang === "ko") return <>이 페이지로 돌아와 위의 입력창에 키를 붙여넣고 <strong style={{ color: "#22d3ee" }}>"저장"</strong>을 누릅니다.</>;
                      if (lang === "zh") return <>返回此页面，将密钥粘贴到上方的输入框中，然后点击 <strong style={{ color: "#22d3ee" }}>“保存”</strong>。</>;
                      return <>Return here, paste the key into the input field above, and click <strong style={{ color: "#22d3ee" }}>"Save"</strong>.</>;
                    })()}
                  </span>
                </li>
              </ol>
              <div className={styles.guideNote}>
                {(() => {
                  if (lang === "vi") return <>🔒 <strong>Bảo mật thông tin:</strong> API Key của bạn được mã hóa và lưu trực tiếp trong trình duyệt máy của bạn. EPIONARA hoàn toàn không gửi hay lưu trữ mã khóa này trên bất kỳ máy chủ nào khác.</>;
                  if (lang === "ja") return <>🔒 <strong>セキュリティについて:</strong> APIキーは暗号化され、お使いのブラウザにローカル保存されます。EPIONARAが外部サーバーへ送信したり、キーを保管したりすることは一切ありません。</>;
                  if (lang === "ko") return <>🔒 <strong>보안 유의사항:</strong> 사용자의 API 키는 암호화되어 브라우저 로컬 저장소에 안전하게 보관됩니다. EPIONARA는 사용자의 키를 외부 서버로 수집하거나 저장하지 않습니다.</>;
                  if (lang === "zh") return <>🔒 <strong>安全提示：</strong>您的 API 密钥将被加密并储存在浏览器本地。EPIONARA 绝不会将您的密钥上传或储存在任何外部服务器。</>;
                  return <>🔒 <strong>Privacy Note:</strong> Your API Key is encrypted and stored locally in your browser. EPIONARA never uploads or stores your key on any external server.</>;
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Change password section */}
        {showPassSection && (
          <div className={styles.collapsibleSection}>
            <h3 className={styles.sectionTitle}>
              🔑 {({
                vi: "Đổi mật khẩu",
                en: "Change password",
                ja: "パスワード変更",
                ko: "비밀번호 변경",
                zh: "修改密码"
              })[lang] || "Change password"}
            </h3>
            {[
              {
                key: "current",
                ph: ({
                  vi: "Mật khẩu hiện tại",
                  en: "Current password",
                  ja: "現在のパスワード",
                  ko: "현재 비밀번호",
                  zh: "当前密码"
                })[lang] || "Current password"
              },
              {
                key: "next",
                ph: ({
                  vi: "Mật khẩu mới (tối thiểu 6 ký tự)",
                  en: "New password (min 6 chars)",
                  ja: "新しいパスワード（最低6文字）",
                  ko: "새 비밀번호 (최소 6자)",
                  zh: "新密码（最少 6 个字符）"
                })[lang] || "New password (min 6 chars)"
              },
              {
                key: "confirm",
                ph: ({
                  vi: "Xác nhận mật khẩu mới",
                  en: "Confirm new password",
                  ja: "新しいパスワードの確認",
                  ko: "새 비밀번호 확인",
                  zh: "Confirm new password"
                })[lang] || "Confirm new password"
              },
            ].map((f) => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <input
                  type="password"
                  placeholder={f.ph}
                  value={newPass[f.key]}
                  onChange={(e) => setNewPass((p) => ({ ...p, [f.key]: e.target.value }))}
                  className={styles.inputField}
                  aria-label={f.ph}
                />
              </div>
            ))}
            {passMsg && (
              <div
                style={{
                  color: passMsg.type === "success" ? "#22c55e" : "#f87171",
                  fontSize: 12,
                  marginBottom: 10,
                }}
              >
                {passMsg.text}
              </div>
            )}
            <button
              onClick={changePassword}
              disabled={passLoading}
              className={styles.submitChangeBtn}
              style={{
                background: passLoading ? "rgba(108,61,232,0.3)" : "linear-gradient(135deg,#6c3de8,#8b5cf6)",
                cursor: passLoading ? "not-allowed" : "pointer",
              }}
            >
              {passLoading 
                ? (({ vi: "⏳ Đang cập nhật...", en: "⏳ Updating...", ja: "⏳ 更新中...", ko: "⏳ 업데이트 중...", zh: "⏳ 正在更新..." })[lang] || "⏳ Updating...") 
                : (({ vi: "💾 Cập nhật mật khẩu", en: "💾 Update password", ja: "💾 パスワードを更新", ko: "💾 비밀번호 업데이트", zh: "💾 更新密码" })[lang] || "💾 Update password")}
            </button>
          </div>
        )}





        {/* Personal info */}
        <div className={styles.collapsibleSection}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3 style={{ color: "white", fontSize: 15, fontWeight: 600, margin: 0 }}>
              📝 {({
                vi: "Thông tin cá nhân",
                en: "Personal Information",
                ja: "個人情報",
                ko: "개인 정보",
                zh: "个人信息"
              })[lang] || "Personal Information"}
            </h3>
            <button
              onClick={() => setEditing(!editing)}
              style={{
                background: "rgba(108,61,232,0.15)",
                border: "1px solid rgba(108,61,232,0.35)",
                color: "#a78bfa",
                padding: "5px 14px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                transition: "all 0.2s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(108,61,232,0.22)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(108,61,232,0.15)";
              }}
            >
              {editing 
                ? (({ vi: "✕ Hủy", en: "✕ Cancel", ja: "✕ キャンセル", ko: "✕ 취소", zh: "✕ 取消" })[lang] || "✕ Cancel") 
                : `✏️ ${t.edit_profile}`}
            </button>
          </div>
          {[
            { label: "👤 " + t.full_name, key: "name", type: "text" },
            { label: "📧 " + t.email, key: "email", type: "email" },
            { label: "📱 " + t.phone, key: "phone", type: "tel" },
            { label: "🎂 " + t.birthday, key: "birthday", type: "date" },
          ].map((f) => (
            <div key={f.key} className={styles.infoFieldGroup}>
              <div className={styles.infoFieldLabel}>{f.label}</div>
              {editing ? (
                <input
                  type={f.type}
                  value={form[f.key] || ""}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className={styles.inputField}
                  aria-label={f.label}
                  style={{ border: "1px solid rgba(108,61,232,0.3)" }}
                />
              ) : (
                <div className={styles.infoFieldValue}>{user[f.key] || "—"}</div>
              )}
            </div>
          ))}
          {editing && (
            <button onClick={save} className={styles.submitChangeBtn}>
              {saved 
                ? (({ vi: "✅ Đã lưu!", en: "✅ Saved!", ja: "✅ 保存しました！", ko: "✅ 저장됨!", zh: "✅ 已保存！" })[lang] || "✅ Saved!") 
                : `💾 ${t.save_profile}`}
            </button>
          )}
          <div style={{ marginTop: 14, color: "rgba(255,255,255,0.45)", fontSize: 11 }}>
            📅 {t.member_since}: {user.joinDate}
          </div>
        </div>

        <button onClick={() => setShowProfileLogout(true)} className={styles.logoutBtn}>
          🚪 {t.logout}
        </button>
        {showProfileLogout && (
          <LogoutModal
            user={user}
            t={t}
            onLogout={() => {
              setShowProfileLogout(false);
              UserStore.clearSession();
              logout();
            }}
            onSwitchAccount={() => setShowProfileLogout(false)}
            onCancel={() => setShowProfileLogout(false)}
          />
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
