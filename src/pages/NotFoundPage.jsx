import { useAppContext } from "../context/AppContext.jsx";

export default function NotFoundPage() {
  const { setPage, t } = useAppContext();
  return (
    <div
      className="page-transition"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 24,
        background: "radial-gradient(ellipse at 50% 50%, #0f1035 0%, #07091d 70%)",
      }}
    >
      <div style={{ fontSize: 80, marginBottom: 16, animation: "float 4s ease-in-out infinite" }}>
        🌌
      </div>
      <h1
        style={{
          fontSize: "clamp(24px, 5vw, 36px)",
          fontWeight: 800,
          color: "white",
          marginBottom: 8,
          background: "linear-gradient(135deg, #c4b5fd, #a78bfa, #22d3ee)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {t.notfound_title || "Trang không tồn tại"}
      </h1>
      <p
        style={{
          color: "rgba(255, 255, 255, 0.6)",
          fontSize: 15,
          marginBottom: 32,
          maxWidth: 450,
          lineHeight: 1.6,
        }}
      >
        {t.notfound_sub || "Có vẻ bạn đã lạc vào khoảng trống vũ trụ."}
      </p>
      <button
        onClick={() => {
          setPage("home");
          window.location.hash = ""; // Clear routes if applicable
        }}
        className="btn-primary"
        style={{
          padding: "12px 32px",
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {t.notfound_home || "🚀 Về trang chủ"}
      </button>
    </div>
  );
}
