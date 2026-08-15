// =================== VERCEL SERVERLESS PROXY — GEMINI API ===================
// File này chạy server-side trên Vercel.
// API key KHÔNG bao giờ được gửi xuống client.

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_BASE = "https://generativelanguage.googleapis.com";

// Rate limiting đơn giản: theo dõi requests/IP trong sliding window 60 giây
const rateLimitMap = new Map(); // ip -> [timestamps]
const RATE_LIMIT = 10;          // max 10 requests
const RATE_WINDOW = 60_000;     // per 60 seconds

async function checkRateLimit(ip) {
  // 1. Cố gắng sử dụng Vercel KV REST API nếu cấu hình sẵn
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const key = `sj_rate:${ip}`;
      const url = `${process.env.KV_REST_API_URL}/pipeline`;
      const kvRes = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify([
          ["INCR", key],
          ["TTL", key]
        ])
      });
      if (kvRes.ok) {
        const results = await kvRes.json();
        const count = results[0]?.result;
        let ttl = results[1]?.result;
        if (count === 1 || ttl === -1) {
          // Đặt hạn sử dụng 60s cho key mới tạo
          await fetch(`${process.env.KV_REST_API_URL}/expire/${key}/60`, {
            headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` }
          });
          ttl = 60;
        }
        if (count > RATE_LIMIT) {
          return { limited: true, retryAfter: ttl > 0 ? ttl : 60 };
        }
        return { limited: false };
      }
    } catch (e) {
      console.warn("[Rate Limit] Lỗi kết nối KV, chuyển sang chế độ fallback bộ nhớ:", e.message);
    }
  }

  // 2. Chế độ dự phòng: in-memory sliding limits
  const now = Date.now();
  const timestamps = (rateLimitMap.get(ip) || []).filter(t => now - t < RATE_WINDOW);
  if (timestamps.length >= RATE_LIMIT) {
    const oldestTs = timestamps[0];
    const retryAfter = Math.ceil((RATE_WINDOW - (now - oldestTs)) / 1000);
    return { limited: true, retryAfter };
  }
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  // Dọn dẹp map định kỳ để tránh memory leak (chỉ giữ IPs active)
  if (rateLimitMap.size > 10000) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (val.every(t => now - t >= RATE_WINDOW)) rateLimitMap.delete(key);
    }
  }
  return { limited: false };
}

export default async function handler(req, res) {
  // Cấu hình các Header bảo mật cơ bản cho API response
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Content-Security-Policy", "default-src 'none'");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

  // Chỉ chấp nhận POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // CORS: chỉ cho phép cùng origin (production) hoặc localhost (dev)
  const origin = req.headers.origin || "";
  const allowedOrigins = new Set([
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    "http://localhost:5173",
    "http://localhost:4173",
  ].filter(Boolean));

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // CORS preflight
  if (req.method === "OPTIONS") return res.status(200).end();

  // Kiểm tra kích thước payload của body để chống tấn công cạn kiệt tài nguyên (DoS)
  const bodyStr = JSON.stringify(req.body || {});
  if (bodyStr.length > 50 * 1024) { // Giới hạn tối đa 50KB cho prompt text
    return res.status(413).json({ error: "Payload too large. Kích thước yêu cầu vượt quá giới hạn an toàn (50KB)." });
  }

  // Rate limiting
  const clientIp =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown";

  const { limited, retryAfter } = await checkRateLimit(clientIp);
  if (limited) {
    return res.status(429).json({
      error: "RATE_LIMIT",
      message: `Bạn đang gọi AI quá nhanh. Vui lòng chờ ${retryAfter} giây.`,
      retryAfter,
    });
  }

  const { model = "gemini-2.0-flash", stream = false, apiKey: clientApiKey, body: requestBody } = req.body || {};

  // Validate model để tránh gọi các model lạ không hợp lệ
  const ALLOWED_MODELS = new Set([
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-1.0-pro"
  ]);
  if (!ALLOWED_MODELS.has(model)) {
    return res.status(400).json({ error: "Model không hợp lệ hoặc không được hỗ trợ trên nền tảng này." });
  }

  const apiKey = clientApiKey || GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(400).json({ error: "Thiếu API key. Vui lòng cấu hình API key trên hệ thống hoặc nhập key cá nhân." });
  }

  if (!requestBody || !Array.isArray(requestBody.contents)) {
    return res.status(400).json({ error: "Thiếu hoặc cấu trúc nội dung yêu cầu (body.contents) không hợp lệ." });
  }

  const endpoint = stream
    ? `${GOOGLE_BASE}/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`
    : `${GOOGLE_BASE}/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const googleRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (stream) {
      // Pipe SSE stream thẳng về client
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("X-Accel-Buffering", "no");

      if (!googleRes.ok) {
        const err = await googleRes.json().catch(() => ({}));
        return res.status(googleRes.status).json({ error: err?.error?.message || `HTTP ${googleRes.status}` });
      }

      const reader = googleRes.body.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(decoder.decode(value, { stream: true }));
        }
      } finally {
        reader.releaseLock();
        res.end();
      }
    } else {
      // Non-streaming: trả về JSON bình thường
      const data = await googleRes.json();
      if (!googleRes.ok) {
        return res.status(googleRes.status).json({ error: data?.error?.message || `HTTP ${googleRes.status}` });
      }
      return res.status(200).json(data);
    }
  } catch (err) {
    console.error("[Gemini Proxy] Error:", err);
    return res.status(502).json({ error: "Lỗi kết nối đến Google API." });
  }
}
