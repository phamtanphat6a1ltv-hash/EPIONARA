import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PaymentAPI } from "../utils/paymentApi.js";
import { useAppContext } from "../context/AppContext.jsx";
import { useToast } from "../hooks/useToast.js";

export default function CheckoutMockPage() {
  const [searchParams] = useSearchParams();
  const { upgradePremiumPlan } = useAppContext();
  const { success, warning } = useToast();

  const transactionId = searchParams.get("transaction_id");
  const planId = searchParams.get("plan_id") || "pro";
  const billingCycle = searchParams.get("billing_cycle") || "MONTHLY";
  const redirectUrl = searchParams.get("redirect_url") || "/";
  const userId = searchParams.get("user_id");

  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  // Billing amount details for mockup
  const planPrice = planId === "ultra" 
    ? (billingCycle === "YEARLY" ? Math.round(149000 * 12 * 0.84) : 149000) 
    : (billingCycle === "YEARLY" ? Math.round(79000 * 12 * 0.84) : 79000);

  const formatPrice = (value) => {
    return new Intl.NumberFormat("vi-VN").format(value);
  };

  const handlePaySuccess = async () => {
    setLoading(true);
    try {
      // 1. Call Payment Webhook API
      const webhookRes = await PaymentAPI.triggerPaymentWebhook(
        transactionId,
        "SUCCESS",
        userId,
        planId,
        billingCycle
      );

      if (webhookRes && webhookRes.success) {
        // 2. Perform client upgrade mutation
        await upgradePremiumPlan(planId, webhookRes.data.subscription_expires_at);

        success("Thanh toán thành công! Gói cước của bạn đã được nâng cấp. 🎉");
        
        // 3. Wait and redirect
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 2000);
      } else {
        throw new Error(webhookRes?.message || "Webhook response indicates failure");
      }
    } catch (e) {
      console.error(e);
      warning("Lỗi xử lý thanh toán từ máy chủ. Đang thử lại chế độ offline...");
      // Fallback update in case API is offline
      const now = new Date();
      const expiresAt = billingCycle === "YEARLY"
        ? new Date(now.setFullYear(now.getFullYear() + 1)).toISOString()
        : new Date(now.setDate(now.getDate() + 30)).toISOString();
      await upgradePremiumPlan(planId, expiresAt);
      
      success("Đã nâng cấp gói cước thành công ở chế độ Offline! 🎉");
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 2000);
    }
  };

  const handlePayCancel = () => {
    setFailed(true);
    warning("Giao dịch thanh toán đã bị hủy bỏ.");
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 1500);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 50% 0%, #111827 0%, #030712 70%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        color: "white",
        fontFamily: "'Segoe UI', Roboto, sans-serif"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "28px",
          padding: "36px 32px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          textAlign: "center"
        }}
      >
        {/* Header Logo Mock */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "28px" }}>
          <span style={{ fontSize: "28px" }}>💳</span>
          <span style={{ fontSize: "20px", fontWeight: 900, letterSpacing: "1px", background: "linear-gradient(135deg, #ec4899, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            SOULPAY SECURE GATEWAY
          </span>
        </div>

        <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>Cổng thanh toán giả lập</h2>
        <p style={{ color: "rgba(255, 255, 255, 0.45)", fontSize: "13px", margin: "0 0 24px" }}>
          Môi trường kiểm thử an toàn hỗ trợ phát triển (Sandbox)
        </p>

        {/* Order Details Panel */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: "16px",
            padding: "20px",
            textAlign: "left",
            marginBottom: "28px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "13px" }}>Gói dịch vụ:</span>
            <span style={{ fontWeight: 700, color: "#a78bfa" }}>
              {planId.toUpperCase()} ({billingCycle === "YEARLY" ? "Năm" : "Tháng"})
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "13px" }}>Mã giao dịch:</span>
            <span style={{ fontFamily: "monospace", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
              {transactionId?.substring(0, 18)}...
            </span>
          </div>
          <hr style={{ border: "none", borderTop: "1px solid rgba(255, 255, 255, 0.08)", margin: "12px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontWeight: 600, fontSize: "14px" }}>Tổng số tiền:</span>
            <span style={{ fontSize: "22px", fontWeight: 800, color: "#34d399" }}>
              {formatPrice(planPrice)}đ
            </span>
          </div>
        </div>

        {/* Card Mockup fields */}
        <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
          <div>
            <label style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "4px" }}>SỐ THẺ</label>
            <input
              type="text"
              readOnly
              value="4111 •••• •••• 8888"
              style={{ width: "100%", padding: "10px 14px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", color: "white", fontSize: "13px" }}
            />
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "4px" }}>HẠN DÙNG</label>
              <input
                type="text"
                readOnly
                value="12 / 29"
                style={{ width: "100%", padding: "10px 14px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", color: "white", fontSize: "13px" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "4px" }}>MÃ CVC</label>
              <input
                type="text"
                readOnly
                value="***"
                style={{ width: "100%", padding: "10px 14px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", color: "white", fontSize: "13px" }}
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <button
            onClick={handlePaySuccess}
            disabled={loading || failed}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "14px",
              border: "none",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "white",
              fontSize: "14px",
              fontWeight: 700,
              cursor: loading || failed ? "not-allowed" : "pointer",
              transition: "transform 0.2s ease",
              boxShadow: "0 4px 20px rgba(16,185,129,0.25)"
            }}
            onMouseEnter={(e) => { if (!loading && !failed) e.currentTarget.style.transform = "scale(1.02)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
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
                  animation: "spin 0.8s linear infinite"
                }}
              />
            ) : (
              "Xác nhận Thanh toán (Thành công)"
            )}
          </button>

          <button
            onClick={handlePayCancel}
            disabled={loading || failed}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "14px",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              background: "rgba(239, 68, 68, 0.1)",
              color: "#f87171",
              fontSize: "13px",
              fontWeight: 600,
              cursor: loading || failed ? "not-allowed" : "pointer"
            }}
          >
            Hủy giao dịch (Thất bại)
          </button>
        </div>

        {/* Security Note */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "24px", color: "rgba(255,255,255,0.35)", fontSize: "11px" }}>
          <span>🔒</span>
          <span>Hệ thống bảo mật giả lập đạt chứng chỉ PCI-DSS Mock</span>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
