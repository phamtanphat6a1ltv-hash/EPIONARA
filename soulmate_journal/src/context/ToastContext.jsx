import { createContext, useContext, useState, useCallback, useRef } from "react";

const ToastContext = createContext(null);

let _toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
  }, []);

  const addToast = useCallback(({ message, type = "info", duration = 3000, icon }) => {
    const id = ++_toastId;
    setToasts(prev => [...prev.slice(-4), { id, message, type, icon }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const success = useCallback((msg, opts) => addToast({ message: msg, type: "success", icon: "✓", ...opts }), [addToast]);
  const error   = useCallback((msg, opts) => addToast({ message: msg, type: "error",   icon: "✕", duration: 4500, ...opts }), [addToast]);
  const info    = useCallback((msg, opts) => addToast({ message: msg, type: "info",    icon: "ℹ", ...opts }), [addToast]);
  const warning = useCallback((msg, opts) => addToast({ message: msg, type: "warning", icon: "⚠", ...opts }), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, success, error, info, warning, addToast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToastContext must be used within ToastProvider");
  return ctx;
}

// =================== Toast Container UI ===================
const TYPE_STYLES = {
  success: { bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.4)", color: "#6ee7b7" },
  error:   { bg: "rgba(239,68,68,0.15)",  border: "rgba(239,68,68,0.4)",  color: "#fca5a5" },
  info:    { bg: "rgba(108,61,232,0.15)", border: "rgba(108,61,232,0.4)", color: "#c4b5fd" },
  warning: { bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.4)", color: "#fde68a" },
};

function ToastContainer({ toasts, onDismiss }) {
  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      style={{
        position: "fixed", bottom: 90, right: 20, zIndex: 99999,
        display: "flex", flexDirection: "column", gap: 10,
        pointerEvents: "none",
      }}
    >
      {toasts.map(t => {
        const s = TYPE_STYLES[t.type] || TYPE_STYLES.info;
        return (
          <div
            key={t.id}
            role="alert"
            aria-atomic="true"
            onClick={() => onDismiss(t.id)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              background: s.bg, border: `1px solid ${s.border}`,
              borderRadius: 12, padding: "12px 16px",
              backdropFilter: "blur(20px)",
              pointerEvents: "all", cursor: "pointer",
              maxWidth: 320, minWidth: 200,
              animation: t.exiting
                ? "toastOut 0.3s ease forwards"
                : "toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
          >
            {t.icon && (
              <span style={{
                color: s.color, fontSize: 16, fontWeight: 700,
                width: 20, textAlign: "center", flexShrink: 0,
              }}>
                {t.icon}
              </span>
            )}
            <span style={{ color: s.color, fontSize: 13, lineHeight: 1.5, flex: 1 }}>
              {t.message}
            </span>
          </div>
        );
      })}
      <style>{`
        @keyframes toastIn {
          from { opacity:0; transform:translateX(40px) scale(0.9); }
          to   { opacity:1; transform:translateX(0) scale(1); }
        }
        @keyframes toastOut {
          from { opacity:1; transform:translateX(0) scale(1); }
          to   { opacity:0; transform:translateX(40px) scale(0.9); }
        }
      `}</style>
    </div>
  );
}
