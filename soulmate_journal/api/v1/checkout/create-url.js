// =================== VERCEL SERVERLESS ENDPOINT — CHECKOUT ===================
// POST /api/v1/checkout/create-url

import { randomUUID } from "crypto";

export default async function handler(req, res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

  const origin = req.headers.origin || "";
  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-User-Id, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { plan_id, billing_cycle, redirect_url } = req.body || {};
  const userId = req.headers["x-user-id"] || req.body.user_id;

  if (!plan_id || !billing_cycle || !redirect_url) {
    return res.status(400).json({ error: "Missing required fields: plan_id, billing_cycle, redirect_url" });
  }

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized. Missing user authentication identifier." });
  }

  // Generate transaction ID
  const transactionId = randomUUID ? randomUUID() : Math.random().toString(36).substring(2, 15);

  // Return the Mock Checkout URL redirecting to frontend checkout-mock route
  const checkoutUrl = `${origin}/checkout-mock?transaction_id=${transactionId}&plan_id=${plan_id}&billing_cycle=${billing_cycle}&redirect_url=${encodeURIComponent(redirect_url)}&user_id=${encodeURIComponent(userId)}`;

  return res.status(200).json({
    transaction_id: transactionId,
    checkout_url: checkoutUrl
  });
}
