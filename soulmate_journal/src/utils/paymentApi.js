// =================== FRONTEND PAYMENT API CLIENT ===================
// Handles calls toplans, checkout, and webhook endpoints with local dev fallbacks.

const STATIC_PLANS = [
  {
    id: "free",
    name: "FREE",
    monthly_price: 0,
    yearly_price: 0,
    features: [
      "2 nhật ký mỗi ngày",
      "Nhận dạng cảm xúc cơ bản",
      "1 bài test MBTI cơ bản",
      "Lưu trữ dữ liệu cục bộ"
    ]
  },
  {
    id: "pro",
    name: "PRO",
    monthly_price: 79000,
    yearly_price: Math.round(79000 * 12 * 0.84), // 16% discount
    features: [
      "Không giới hạn nhật ký",
      "Phân tích cảm xúc AI chuyên sâu",
      "Toàn bộ trắc nghiệm MBTI, EQ, Stress",
      "Sao lưu đám mây Supabase an toàn",
      "Nhịp tim sinh học PPG"
    ]
  },
  {
    id: "ultra",
    name: "ULTRA",
    monthly_price: 149000,
    yearly_price: Math.round(149000 * 12 * 0.84), // 16% discount
    features: [
      "Tất cả quyền lợi của gói PRO",
      "Bản đồ phát hiện tính cách AI nâng cao",
      "Ưu tiên phản hồi AI tốc độ cao",
      "Mira MindBot AI Coach riêng tư 24/7",
      "Xuất báo cáo PDF chuyên sâu không giới hạn"
    ]
  }
];

export const PaymentAPI = {
  fetchPlans: async () => {
    try {
      const res = await fetch("/api/v1/plans");
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn("[PaymentAPI] Lấy danh sách gói từ server thất bại, sử dụng bản mock cục bộ:", e.message);
      return STATIC_PLANS;
    }
  },

  createCheckoutUrl: async (planId, billingCycle, redirectUrl, userId) => {
    try {
      const res = await fetch("/api/v1/checkout/create-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": String(userId)
        },
        body: JSON.stringify({
          plan_id: planId,
          billing_cycle: billingCycle,
          redirect_url: redirectUrl,
          user_id: userId
        })
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      return data.checkout_url;
    } catch (e) {
      console.warn("[PaymentAPI] Gọi tạo checkout URL thất bại, sử dụng mock client-side:", e.message);
      const transactionId = "tx_mock_" + Math.random().toString(36).substring(2, 12);
      const host = window.location.origin;
      return `${host}/checkout-mock?transaction_id=${transactionId}&plan_id=${planId}&billing_cycle=${billingCycle}&redirect_url=${encodeURIComponent(redirectUrl)}&user_id=${encodeURIComponent(userId)}`;
    }
  },

  triggerPaymentWebhook: async (transactionId, status, userId, planId, billingCycle) => {
    try {
      const res = await fetch("/api/v1/webhooks/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_id: transactionId,
          status,
          user_id: userId,
          plan_id: planId,
          billing_cycle: billingCycle
        })
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn("[PaymentAPI] Gọi webhook thanh toán thất bại, giả lập phản hồi thành công cục bộ:", e.message);
      const now = new Date();
      let expiresAt = null;
      if (billingCycle === "YEARLY") {
        expiresAt = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();
      } else if (billingCycle === "MONTHLY") {
        expiresAt = new Date(now.setDate(now.getDate() + 30)).toISOString();
      }

      return {
        success: status === "SUCCESS",
        message: "Simulated local webhook processing.",
        data: {
          user_id: userId,
          plan_type: planId.toUpperCase(),
          subscription_expires_at: expiresAt,
          payment_customer_id: `cust_mock_${Math.random().toString(36).substring(2, 10)}`
        }
      };
    }
  }
};
