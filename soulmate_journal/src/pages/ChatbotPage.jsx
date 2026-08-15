import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useChatbot } from "../hooks/useChatbot.js";
import { BackButton } from "../components/UIComponents.jsx";
import ErrorBoundary from "../components/ErrorBoundary.jsx";
import { MINDBOT_ROLES } from "../utils/constants.js";
import { useAppContext } from "../context/AppContext.jsx";
import { ConfirmDialog } from "../components/ConfirmDialog.jsx";
import { TextSkeleton } from "../components/LoadingStates.jsx";
import { EmptyChatbotState } from "../components/EmptyStates.jsx";
import styles from "./ChatbotPage.module.css";

/* Helper: renders chatbot avatar as image or emoji fallback */
const BotAvatar = ({ role, size = 32 }) => (
  role.avatarImg
    ? <img src={role.avatarImg} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }} />
    : <span style={{ fontSize: size * 0.5 }}>{role.avatar}</span>
);



/**
 * MindBot chatbot interface rendering messages history and streaming response container.
 */
function ChatbotContent({ minimal = false }) {
  const { user, t, setPage } = useAppContext();
  const { data, actions } = useChatbot();

  const [nickname, setNickname] = useState(() => localStorage.getItem("sj_mindbot_nickname") || "");
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [tempNickname, setTempNickname] = useState(nickname);


  const {
    messages,
    input,
    loading,
    mode,
    showSuggestions,
    copiedId,
    showConfirm,
    roleInfo,
  } = data;

  const {
    setInput,
    setMode,
    send,
    handleKey,
    copyMsg,
    clearChat,
    confirmClearChat,
    cancelClearChat,
  } = actions;

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll messages container to bottom on change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className={minimal ? styles.chatContainerMinimal : styles.chatContainer}>
      {!minimal && setPage && (
        <div style={{ padding: "8px 20px 0", maxWidth: 820, margin: "0 auto", width: "100%" }}>
          <BackButton onClick={() => setPage("home")} label={"← " + (t.back_home || "Trang chủ")} />
        </div>
      )}

      {/* Header */}
      <div className={minimal ? styles.headerMinimal : styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleRow}>
            <div className={styles.botInfo}>
              <div
                className={styles.botAvatarHeader}
                style={{
                  background: roleInfo.avatarImg ? "transparent" : roleInfo.gradient,
                  boxShadow: `0 0 20px ${roleInfo.color}33`,
                }}
              >
                <BotAvatar role={roleInfo} size={42} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 15 }}>
                    {mode === "friend" && nickname ? nickname : "MindBot"}
                  </span>
                  {mode === "friend" && (
                    <button
                      onClick={() => {
                        setTempNickname(nickname);
                        setIsEditingNickname(true);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-secondary)",
                        padding: 0,
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center"
                      }}
                      title="Đặt biệt danh cho người bạn thân"
                    >
                      ✏️
                    </button>
                  )}
                </div>
                <div className={styles.statusRow}>
                  <div className={styles.statusIndicator} style={{ background: roleInfo.color }} />
                  <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                    {loading ? t.chat_thinking : (t.status_online || "Online")}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={clearChat}
              title={t.chat_new}
              aria-label={t.clear_chat || "Xóa hội thoại"}
              className={styles.clearButton}
            >
              ✦ {t.chat_new}
            </button>
          </div>

          {/* Mode selectors */}
          <div className={styles.modeSelector}>
            <span className={styles.modeSelectorLabel}>{t.chat_mode_label}</span>
            <div className={styles.modeButtons}>
              {[
                { id: "friend", label: t.chat_mode_friend },
                { id: "therapist", label: t.chat_mode_therapist },
                { id: "coach", label: t.chat_mode_coach },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`${styles.modeBtn} ${mode === m.id ? styles[`modeBtn_${m.id}`] : styles.modeBtnInactive}`}
                >
                  <BotAvatar role={MINDBOT_ROLES[m.id]} size={18} />
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Messages layout */}
      <div className={styles.messagesArea}>
        <div className={styles.messagesWrapper}>
          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            const currentMsgMode = msg.mode || mode;
            const msgRoleInfo = MINDBOT_ROLES[currentMsgMode] || roleInfo;
            
            return (
              <div
                key={msg.id}
                className={styles.messageWrapper}
                style={{
                  alignItems: isUser ? "flex-end" : "flex-start",
                  animation: idx === messages.length - 1 ? "msgIn 0.35s cubic-bezier(.34,1.4,.64,1)" : "none",
                }}
              >
                <div className={`${styles.bubbleRow} ${isUser ? styles.bubbleRowUser : ""}`}>
                  {!isUser && (
                    <div
                      className={styles.botAvatar}
                      style={{ background: msgRoleInfo.avatarImg ? "transparent" : msgRoleInfo.gradient, overflow: "hidden" }}
                    >
                      <BotAvatar role={msgRoleInfo} size={32} />
                    </div>
                  )}

                  {isUser && (
                    <div className={styles.userAvatar}>
                      {user ? user.avatar || user.name?.slice(0, 2).toUpperCase() : "👤"}
                    </div>
                  )}

                  <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : ""}`}>
                    {msg.content || <TextSkeleton lines={2} style={{ minWidth: 160, display: "flex" }} />}
                  </div>
                </div>

                <div
                  className={styles.metaRow}
                  style={{
                    paddingLeft: isUser ? 0 : 42,
                    paddingRight: isUser ? 42 : 0,
                  }}
                >
                  <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>{msg.time}</span>
                  {!isUser && (
                    <button
                      onClick={() => copyMsg(msg.id, msg.content)}
                      className={styles.copyButton}
                      aria-label={t.copy || "Sao chép tin nhắn"}
                      style={{ color: copiedId === msg.id ? "#22c55e" : "var(--text-secondary)" }}
                    >
                      {copiedId === msg.id ? "✓ " + t.chat_copy : "⧉"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Chatbot typing animation dots */}
          {loading && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, animation: "msgIn 0.3s ease" }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: roleInfo.avatarImg ? "transparent" : roleInfo.gradient,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                <BotAvatar role={roleInfo} size={32} />
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "18px 18px 18px 4px",
                  padding: "14px 20px",
                  display: "flex",
                  gap: 5,
                  alignItems: "center",
                }}
              >
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: roleInfo.color,
                      animation: `dotBounce 1.2s ease ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Quick reply suggestions */}
          {showSuggestions && messages.length <= 1 && (
            <EmptyChatbotState t={t} onChipClick={send} />
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input textbox controls */}
      <div className={styles.inputArea}>
        <div className={styles.inputAreaContent}>


          <div className={styles.inputRow}>
            <div className={styles.textareaWrapper}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
                }}
                onKeyDown={handleKey}
                placeholder={t.chat_placeholder}
                rows={1}
                className={styles.textarea}
              />
              {input.length > 0 && <span className={styles.charCounter}>{input.length}</span>}
            </div>

            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              aria-label={t.chat_send || "Gửi tin nhắn"}
              className={`${styles.sendButton} ${input.trim() && !loading ? styles.sendButtonActive : ""}`}
              style={{
                background: input.trim() && !loading ? roleInfo.gradient : undefined,
                boxShadow: input.trim() && !loading ? `0 6px 16px ${roleInfo.color}35` : undefined,
              }}
            >
              {loading ? "⏳" : "➤"}
            </button>
          </div>

          <div className={styles.inputFooter}>
            <span className={styles.inputFooterText}>Enter ↵ {t.chat_send || "Gửi"} · Shift+Enter = {t.chat_newline || "xuống dòng"}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: roleInfo.color }} />
              <span style={{ color: "var(--text-secondary)", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                <BotAvatar role={roleInfo} size={16} /> {mode === "friend" && nickname ? nickname : "MindBot"} —{" "}
                {mode === "friend"
                  ? t.chat_mode_friend
                  : mode === "therapist"
                  ? t.chat_mode_therapist
                  : t.chat_mode_coach}
              </span>
            </div>
          </div>
        </div>
      </div>

      {showConfirm && (
        <ConfirmDialog
          message={t.chat_clear_confirm}
          confirmLabel={t.confirm_ok}
          cancelLabel={t.confirm_cancel}
          danger={true}
          onConfirm={confirmClearChat}
          onCancel={cancelClearChat}
        />
      )}

      {isEditingNickname && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          backdropFilter: "blur(6px)",
          padding: "20px"
        }}>
          <div style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "20px",
            padding: "28px",
            maxWidth: "380px",
            width: "100%",
            boxShadow: "0 25px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(139,92,246,0.08)",
            animation: "msgIn 0.3s cubic-bezier(.34,1.3,.64,1)"
          }}>
            <h3 style={{ margin: "0 0 6px", color: "#1f2937", fontSize: "18px", fontWeight: 800, letterSpacing: "0.2px" }}>
              ✨ Đặt Biệt Danh
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: "13.5px", color: "#6b7280", lineHeight: 1.5 }}>
              Hãy đặt cho MindBot một tên gọi đặc biệt khi đóng vai trò người bạn thân của bạn!
            </p>
            <input
              type="text"
              maxLength={20}
              value={tempNickname}
              onChange={(e) => setTempNickname(e.target.value)}
              placeholder="Ví dụ: Cún Con, Ní Yêu, Gấu Bông..."
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                border: "2px solid #e5e7eb",
                background: "#f9fafb",
                color: "#1f2937",
                fontSize: "14.5px",
                marginBottom: "22px",
                outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
                boxSizing: "border-box"
              }}
              onFocus={(e) => { e.target.style.borderColor = "#8b5cf6"; e.target.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.12)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
              autoFocus
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setIsEditingNickname(false)}
                style={{
                  padding: "9px 18px",
                  borderRadius: "10px",
                  border: "1.5px solid #d1d5db",
                  background: "#fff",
                  color: "#4b5563",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  const val = tempNickname.trim();
                  setNickname(val);
                  if (val) {
                    localStorage.setItem("sj_mindbot_nickname", val);
                  } else {
                    localStorage.removeItem("sj_mindbot_nickname");
                  }
                  setIsEditingNickname(false);
                }}
                style={{
                  padding: "9px 20px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                  color: "#fff",
                  fontSize: "13.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(139, 92, 246, 0.3)",
                  transition: "all 0.2s"
                }}
              >
                💾 Lưu lại
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

ChatbotContent.propTypes = {
  minimal: PropTypes.bool,
};

ChatbotPage.propTypes = {
  minimal: PropTypes.bool,
};

export default function ChatbotPage({ minimal = false }) {
  const { t } = useAppContext();
  return (
    <ErrorBoundary t={t}>
      <ChatbotContent minimal={minimal} />
    </ErrorBoundary>
  );
}
