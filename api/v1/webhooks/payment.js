// =================== VERCEL SERVERLESS ENDPOINT — PAYMENT WEBHOOK ===================
// POST /api/v1/webhooks/payment

export default async function handler(req, res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

  const origin = req.headers.origin || "";
  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { transaction_id, status, user_id, plan_id, billing_cycle } = req.body || {};

  if (!transaction_id || !status || !user_id || !plan_id || !billing_cycle) {
    return res.status(400).json({ error: "Missing required fields: transaction_id, status, user_id, plan_id, billing_cycle" });
  }

  if (status !== "SUCCESS") {
    return res.status(200).json({ success: false, message: "Payment failed or pending." });
  }

  // Calculate subscription expiration date
  const now = new Date();
  let expiresAt = null;
  if (billing_cycle === "YEARLY") {
    expiresAt = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();
  } else if (billing_cycle === "MONTHLY") {
    expiresAt = new Date(now.setDate(now.getDate() + 30)).toISOString();
  }

  // Simulate updating database/sending email
  console.info(`[Payment Webhook] Transaction ${transaction_id} SUCCESS. User ${user_id} upgraded to ${plan_id.toUpperCase()}.`);

  return res.status(200).json({
    success: true,
    message: "Webhook processed successfully.",
    data: {
      user_id,
      plan_type: plan_id.toUpperCase(),
      subscription_expires_at: expiresAt,
      payment_customer_id: `cust_${Math.random().toString(36).substring(2, 10)}`
    }
  });
}
