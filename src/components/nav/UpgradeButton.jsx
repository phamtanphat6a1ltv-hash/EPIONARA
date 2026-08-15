import PropTypes from "prop-types";

export default function UpgradeButton({ onClick, t }) {
  return (
    <button
      onClick={onClick}
      aria-label={t?.upgrade_now || "Nâng cấp gói"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 18px",
        borderRadius: "99px",
        background: "rgba(56, 189, 248, 0.15)",
        border: "1px solid rgba(56, 189, 248, 0.35)",
        color: "#38bdf8",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: 700,
        transition: "all 0.3s ease",
        boxShadow: "0 4px 15px rgba(56, 189, 248, 0.15)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(56, 189, 248, 0.25)";
        e.currentTarget.style.transform = "scale(1.04)";
        e.currentTarget.style.boxShadow = "0 6px 20px rgba(56, 189, 248, 0.25)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(56, 189, 248, 0.15)";
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 4px 15px rgba(56, 189, 248, 0.15)";
      }}
    >
      <span style={{ fontSize: "14px", display: "inline-block", transform: "translateY(-1px)" }}>✨</span>
      <span>{t?.upgrade_btn || "Nâng cấp"}</span>
    </button>
  );
}

UpgradeButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  t: PropTypes.object,
};
