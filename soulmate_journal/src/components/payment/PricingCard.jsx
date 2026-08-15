import { useState } from "react";
import PropTypes from "prop-types";
import { useAppContext } from "../../context/AppContext.jsx";

export default function PricingCard({ plan, isYearly, activePlan, onSelect, _t }) {
  const [loading, setLoading] = useState(false);

  const isCurrent = activePlan?.toLowerCase() === plan.id.toLowerCase();
  
  // Format price helper
  const formatPrice = (value) => {
    return new Intl.NumberFormat("vi-VN").format(value);
  };

  const handleSelect = async () => {
    if (isCurrent || plan.id === "free") return;
    setLoading(true);
    try {
      await onSelect(plan.id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const { lang } = useAppContext();

  // Pricing calculations
  const displayPrice = isYearly 
    ? plan.yearly_price 
    : plan.monthly_price;
  
  const originalYearlyPrice = plan.monthly_price * 12;
  const isPremium = plan.id !== "free";

  return (
    <div
      style={{
        flex: 1,
        minWidth: "260px",
        background: plan.id === "ultra" 
          ? "linear-gradient(135deg, rgba(236,72,153,0.12) 0%, rgba(167,139,250,0.12) 100%)"
          : "rgba(255, 255, 255, 0.03)",
        border: plan.id === "ultra"
          ? "2px solid rgba(236, 72, 153, 0.4)"
          : plan.id === "pro"
          ? "2px solid rgba(167, 139, 250, 0.3)"
          : "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "24px",
        padding: "32px 24px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s ease",
        boxShadow: plan.id === "ultra" ? "0 10px 30px rgba(236,72,153,0.1)" : "none",
      }}
    >
      {/* Popular tag for Ultra */}
      {plan.id === "ultra" && (
        <div
          style={{
            position: "absolute",
            top: 14,
            right: -32,
            background: "linear-gradient(135deg, #ec4899, #8b5cf6)",
            color: "white",
            fontSize: "10px",
            fontWeight: 800,
            padding: "4px 32px",
            transform: "rotate(45deg)",
          }}
        >
          ULTIMATE
        </div>
      )}

      {/* Header */}
      <div>
        <h3
          style={{
            margin: "0 0 8px",
            fontSize: "20px",
            fontWeight: 800,
            color: plan.id === "ultra" ? "#f472b6" : plan.id === "pro" ? "#a78bfa" : "#fff",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          {plan.name}
        </h3>

        {/* Pricing tag */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "16px" }}>
          {isPremium ? (
            <>
              <span style={{ fontSize: "28px", fontWeight: 800, color: "white" }}>
                {formatPrice(displayPrice)}đ
              </span>
              <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.5)" }}>
                {isYearly ? (lang === "vi" ? "/năm" : "/year") : (lang === "vi" ? "/tháng" : "/month")}
              </span>
            </>
          ) : (
            <span style={{ fontSize: "28px", fontWeight: 800, color: "white" }}>Miễn phí</span>
          )}
        </div>

        {/* Save/Discount details for Yearly */}
        {isPremium && isYearly && (
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.45)" }}>
              {lang === "vi"
                ? `Tương đương ${formatPrice(Math.round(plan.yearly_price / 12))}đ/tháng`
                : `Equivalent to ${formatPrice(Math.round(plan.yearly_price / 12))}đ/month`}
            </div>
            <div style={{ fontSize: "11px", color: "#34d399", fontWeight: 600, marginTop: "2px" }}>
              {lang === "vi"
                ? `Tiết kiệm ${formatPrice(originalYearlyPrice - plan.yearly_price)}đ so với mua lẻ tháng`
                : `Save ${formatPrice(originalYearlyPrice - plan.yearly_price)}đ compared to monthly`}
            </div>
          </div>
        )}

        <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.06)", margin: "0 0 20px" }} />

        {/* Features Checklist */}
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px" }}>
          {plan.features.map((feature, idx) => (
            <li
              key={idx}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                fontSize: "13px",
                color: "rgba(255,255,255,0.75)",
                lineHeight: "1.5",
                marginBottom: "12px",
              }}
            >
              <span style={{ color: "#34d399", fontWeight: "bold" }}>✓</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action CTA Button */}
      <button
        onClick={handleSelect}
        disabled={isCurrent || loading || plan.id === "free"}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "14px",
          border: isCurrent 
            ? "1px solid rgba(255,255,255,0.15)"
            : "none",
          background: isCurrent
            ? "rgba(255,255,255,0.06)"
            : plan.id === "ultra"
            ? "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)"
            : plan.id === "pro"
            ? "linear-gradient(135deg, #a78bfa 0%, #6c3de8 100%)"
            : "rgba(255,255,255,0.08)",
          color: isCurrent 
            ? "rgba(255,255,255,0.4)" 
            : plan.id === "free"
            ? "rgba(255,255,255,0.3)"
            : "white",
          fontSize: "13px",
          fontWeight: 700,
          cursor: isCurrent || loading || plan.id === "free" ? "not-allowed" : "pointer",
          transition: "all 0.2s ease",
          boxShadow: !isCurrent && plan.id !== "free" ? "0 4px 15px rgba(108,61,232,0.15)" : "none",
        }}
        onMouseEnter={(e) => {
          if (!isCurrent && !loading && plan.id !== "free") {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.filter = "brightness(1.1)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isCurrent && !loading && plan.id !== "free") {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.filter = "brightness(1)";
          }
        }}
      >
        {loading ? (
          <div
            style={{
              display: "inline-block",
              width: "16px",
              height: "16px",
              border: "2px solid rgba(255,255,255,0.3)",
              borderTop: "2px solid #fff",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
        ) : isCurrent ? (
          "Gói hiện tại"
        ) : plan.id === "free" ? (
          "Mặc định"
        ) : (
          "Nâng cấp ngay"
        )}
      </button>
    </div>
  );
}

PricingCard.propTypes = {
  plan: PropTypes.object.isRequired,
  isYearly: PropTypes.bool.isRequired,
  activePlan: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  t: PropTypes.object,
};
