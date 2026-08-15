import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useAppContext } from "../../context/AppContext.jsx";
import { PaymentAPI } from "../../utils/paymentApi.js";
import PricingCard from "./PricingCard.jsx";

export default function PricingModal({ onClose, t }) {
  const { user } = useAppContext();
  const [isYearly, setIsYearly] = useState(false);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Esc key closes modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Load plans on mount
  useEffect(() => {
    async function load() {
      try {
        const data = await PaymentAPI.fetchPlans();
        setPlans(data);
      } catch (err) {
        console.error("Lỗi lấy thông tin gói cước:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleUpgrade = async (planId) => {
    if (!user) {
      alert("Vui lòng đăng nhập để nâng cấp gói cước.");
      return;
    }
    const billingCycle = isYearly ? "YEARLY" : "MONTHLY";
    const redirectUrl = window.location.href; // Return back here on success
    
    try {
      const checkoutUrl = await PaymentAPI.createCheckoutUrl(
        planId,
        billingCycle,
        redirectUrl,
        user.id
      );
      // Redirect browser to checkout URL
      window.location.href = checkoutUrl;
    } catch (e) {
      console.error("[PricingModal] Lỗi tạo cổng thanh toán:", e);
      alert("Đã xảy ra lỗi khi kết nối đến cổng thanh toán. Vui lòng thử lại sau.");
    }
  };

  const currentPlan = user?.plan_type || "FREE";

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 5000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      {/* Backdrop blur overlay */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(5, 8, 22, 0.85)",
          backdropFilter: "blur(12px)",
        }}
      />

      {/* Modal Container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "1000px",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "linear-gradient(135deg, rgba(13, 20, 60, 0.98), rgba(20, 10, 50, 0.98))",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "32px",
          padding: "48px 32px 36px",
          boxShadow: "0 50px 120px rgba(0, 0, 0, 0.8)",
          animation: "modalInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label={t?.close || "Đóng"}
          style={{
            position: "absolute",
            top: 24,
            right: 24,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.6)",
            width: 38,
            height: 38,
            borderRadius: "50%",
            cursor: "pointer",
            fontSize: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            e.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            e.currentTarget.style.color = "rgba(255,255,255,0.6)";
          }}
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <h2
            style={{
              fontSize: "clamp(20px, 3.5vw, 28px)",
              fontWeight: 900,
              background: "linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.6) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              margin: "0 0 12px",
            }}
          >
            Nâng cấp gói để mở khóa toàn diện tính năng
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", maxWidth: "600px", margin: "0 auto" }}>
            Trải nghiệm phân tích tâm lý chuyên sâu, Mira AI Assistant, đo nhịp tim PPG, và không giới hạn ghi nhật ký.
          </p>
        </div>

        {/* Billing Toggle Switch */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              padding: "4px",
              borderRadius: "16px",
              gap: "4px",
            }}
          >
            <button
              onClick={() => setIsYearly(false)}
              style={{
                padding: "8px 16px",
                border: "none",
                borderRadius: "12px",
                background: !isYearly ? "rgba(255,255,255,0.08)" : "transparent",
                color: !isYearly ? "#fff" : "rgba(255,255,255,0.45)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              Hằng tháng
            </button>
            <button
              onClick={() => setIsYearly(true)}
              style={{
                padding: "8px 16px",
                border: "none",
                borderRadius: "12px",
                background: isYearly ? "linear-gradient(135deg, #38bdf8, #0284c7)" : "transparent",
                color: isYearly ? "#fff" : "rgba(255,255,255,0.45)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              Hằng năm 🎉
            </button>
          </div>
          {/* Discount text */}
          <span style={{ fontSize: "11px", color: "#34d399", fontWeight: 600 }}>
            🔥 Tiết kiệm 16% khi đăng ký hằng năm
          </span>
        </div>

        {/* Pricing Grid */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                border: "4px solid rgba(167,139,250,0.15)",
                borderTop: "4px solid #a78bfa",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
          </div>
        ) : (
          <div
            className="pricing-grid"
            style={{
              display: "flex",
              gap: "24px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {plans.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                isYearly={isYearly}
                activePlan={currentPlan}
                onSelect={handleUpgrade}
                t={t}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes modalInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .pricing-grid {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
}

PricingModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  t: PropTypes.object,
};
