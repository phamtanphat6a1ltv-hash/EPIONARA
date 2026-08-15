// =================== NATIVE TOAST ===================
// Toast đơn giản không phụ thuộc React — dùng được trong utils/db.js, secureStorage.js
// Inject DOM element trực tiếp thay vì alert()

const TOAST_STYLES = {
  error:   { bg: "#ef4444", icon: "⚠️" },
  success: { bg: "#22c55e", icon: "✅" },
  info:    { bg: "#6366f1", icon: "ℹ️"  },
  warning: { bg: "#f59e0b", icon: "⚠️" },
};

let container = null;

function getContainer() {
  if (container && document.body.contains(container)) return container;

  container = document.createElement("div");
  container.id = "sj-native-toast-container";
  Object.assign(container.style, {
    position: "fixed",
    bottom: "80px",   // trên mobile tab bar (~60px)
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: "99999",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    pointerEvents: "none",
    width: "max-content",
    maxWidth: "min(90vw, 420px)",
  });
  document.body.appendChild(container);
  return container;
}

export function nativeToast(message, type = "error", duration = 4000) {
  // Nếu chưa có document (SSR/test), fallback sang console
  if (typeof document === "undefined") {
    console.warn("[nativeToast]", type, message);
    return;
  }

  const { bg, icon } = TOAST_STYLES[type] || TOAST_STYLES.info;
  const c = getContainer();

  const toast = document.createElement("div");
  toast.textContent = `${icon} ${message}`;
  Object.assign(toast.style, {
    background: bg,
    color: "#fff",
    padding: "10px 18px",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: "600",
    fontFamily: "system-ui, sans-serif",
    boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
    opacity: "0",
    transition: "opacity 0.25s ease, transform 0.25s ease",
    transform: "translateY(8px)",
    pointerEvents: "auto",
    cursor: "pointer",
    lineHeight: "1.4",
    textAlign: "center",
  });

  // Bấm để xóa nhanh
  toast.addEventListener("click", () => dismiss(toast));

  c.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });
  });

  // Auto dismiss
  const timer = setTimeout(() => dismiss(toast), duration);

  function dismiss(el) {
    clearTimeout(timer);
    el.style.opacity = "0";
    el.style.transform = "translateY(8px)";
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
  }
}
