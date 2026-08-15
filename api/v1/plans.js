// =================== VERCEL SERVERLESS ENDPOINT — PLANS ===================
// GET /api/v1/plans

export default async function handler(req, res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

  // Allow CORS from same-origin/localhost
  const origin = req.headers.origin || "";
  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const plans = [
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

  return res.status(200).json(plans);
}
