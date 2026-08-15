import { useEffect } from "react";
import { useFocusTrap } from "../hooks/useFocusTrap.js";
import { useAppContext } from "../context/AppContext.jsx";

export function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  confirmLabel,
  cancelLabel,
  danger = false,
}) {
  const { t } = useAppContext();
  const resolvedConfirmLabel = confirmLabel || t.confirm_ok || "Xác nhận";
  const resolvedCancelLabel = cancelLabel || t.confirm_cancel || "Hủy";
  const trapRef = useFocusTrap(true);

  // Close on Escape key press
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(5, 8, 20, 0.88)",
          backdropFilter: "blur(16px)",
        }}
        onClick={onCancel}
      />

      {/* Modal Container */}
      <div
        ref={trapRef}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 400,
          background: "linear-gradient(135deg, rgba(13, 20, 64, 0.99), rgba(26, 10, 60, 0.99))",
          border: `1px solid ${danger ? "rgba(239, 68, 68, 0.35)" : "rgba(108, 61, 232, 0.35)"}`,
          borderRadius: 24,
          padding: "36px 32px",
          textAlign: "center",
          boxShadow: "0 40px 100px rgba(0,0,0,0.8)",
          animation: "modalIn 0.35s cubic-bezier(.34, 1.56, .64, 1)",
        }}
      >
        {/* Close Icon button */}
        <button
          onClick={onCancel}
          aria-label="Đóng hộp thoại"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            background: "rgba(255, 255, 255, 0.08)",
            border: "none",
            color: "rgba(255, 255, 255, 0.6)",
            width: 30,
            height: 30,
            borderRadius: "50%",
            cursor: "pointer",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>

        {/* Header Icon */}
        <div style={{ fontSize: 56, marginBottom: 12 }}>
          {danger ? "⚠️" : "💡"}
        </div>

        {/* Message Title */}
        <h2
          id="confirm-dialog-title"
          style={{
            color: "white",
            fontSize: 18,
            fontWeight: 700,
            margin: "0 0 16px",
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
          }}
        >
          {message}
        </h2>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "12px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "rgba(255, 255, 255, 0.8)",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)")}
          >
            {resolvedCancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "12px",
              background: danger
                ? "linear-gradient(135deg, #ef4444, #dc2626)"
                : "linear-gradient(135deg, #6c3de8, #8b5cf6)",
              border: "none",
              color: "white",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: danger
                ? "0 4px 15px rgba(239, 68, 68, 0.3)"
                : "0 4px 15px rgba(108, 61, 232, 0.3)",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {resolvedConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
