import { describe, it, expect, vi, beforeEach } from "vitest";
import { PaymentAPI } from "../src/utils/paymentApi.js";
import { userRepository } from "../src/repositories/userRepository.js";

describe("Premium Membership & Payment Module", () => {
  describe("PaymentAPI Client Utility", () => {
    it("should fetch plans with correct IDs and properties", async () => {
      const plans = await PaymentAPI.fetchPlans();
      expect(plans).toBeInstanceOf(Array);
      expect(plans.length).toBe(3);
      
      const free = plans.find(p => p.id === "free");
      const pro = plans.find(p => p.id === "pro");
      const ultra = plans.find(p => p.id === "ultra");

      expect(free.name).toBe("FREE");
      expect(pro.monthly_price).toBe(79000);
      expect(ultra.yearly_price).toBe(Math.round(149000 * 12 * 0.84));
    });

    it("should generate a valid checkout URL containing all parameter overrides", async () => {
      const planId = "pro";
      const billingCycle = "YEARLY";
      const redirectUrl = "http://localhost:3000/profile";
      const userId = "test_user_123";

      const url = await PaymentAPI.createCheckoutUrl(planId, billingCycle, redirectUrl, userId);
      
      expect(url).toContain("/checkout-mock");
      expect(url).toContain("plan_id=pro");
      expect(url).toContain("billing_cycle=YEARLY");
      expect(url).toContain(`redirect_url=${encodeURIComponent(redirectUrl)}`);
      expect(url).toContain("user_id=test_user_123");
      expect(url).toContain("transaction_id=");
    });

    it("should handle payment success webhook call and compute expiration dates", async () => {
      const transactionId = "tx_123456";
      const userId = "test_user_123";
      const planId = "pro";

      // 1. Monthly Expiration (30 days)
      const monthlyRes = await PaymentAPI.triggerPaymentWebhook(transactionId, "SUCCESS", userId, planId, "MONTHLY");
      expect(monthlyRes.success).toBe(true);
      expect(monthlyRes.data.plan_type).toBe("PRO");
      expect(monthlyRes.data.subscription_expires_at).toBeDefined();

      const monthlyDate = new Date(monthlyRes.data.subscription_expires_at);
      const expectedMonthly = new Date();
      expectedMonthly.setDate(expectedMonthly.getDate() + 30);
      expect(monthlyDate.getDate()).toBe(expectedMonthly.getDate());

      // 2. Yearly Expiration (365 days)
      const yearlyRes = await PaymentAPI.triggerPaymentWebhook(transactionId, "SUCCESS", userId, planId, "YEARLY");
      expect(yearlyRes.success).toBe(true);
      expect(yearlyRes.data.plan_type).toBe("PRO");
      expect(yearlyRes.data.subscription_expires_at).toBeDefined();

      const yearlyDate = new Date(yearlyRes.data.subscription_expires_at);
      const expectedYearly = new Date();
      expectedYearly.setFullYear(expectedYearly.getFullYear() + 1);
      expect(yearlyDate.getFullYear()).toBe(expectedYearly.getFullYear());
    });
  });

  describe("userRepository default plan fields", () => {
    beforeEach(async () => {
      await userRepository.clear();
    });

    it("should assign FREE plan by default to newly registered or saved users", async () => {
      const mockUser = {
        id: "new_user",
        name: "Test User",
        email: "test@domain.com"
      };

      const saved = await userRepository.save(mockUser);
      expect(saved.plan_type).toBe("FREE");
      expect(saved.subscription_expires_at).toBeNull();
      expect(saved.payment_customer_id).toBe("");

      const retrieved = await userRepository.getById("new_user");
      expect(retrieved.plan_type).toBe("FREE");
    });
  });
});
