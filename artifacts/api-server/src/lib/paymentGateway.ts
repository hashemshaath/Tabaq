/**
 * Payment Gateway Abstraction
 *
 * Gateway selection via PAYMENT_GATEWAY environment variable:
 *   'hyperpay' → HyperPay Checkout API (Saudi Arabia)
 *   'stripe'   → Stripe PaymentIntents API
 *   'mock'     → Always succeeds — use for dev/test
 *   (unset)    → defaults to 'mock'
 *
 * All gateway responses are normalized to the internal format before returning.
 * Callers never touch raw gateway objects.
 */

import { logger } from "./logger.js";

export interface PaymentInitParams {
  amount: number;
  currency: string;
  orderId: string;
  description: string;
  customerEmail?: string;
  customerPhone?: string;
  returnUrl?: string;
}

export interface PaymentInitResult {
  success: boolean;
  transactionId: string;
  redirectUrl?: string;
  checkoutId?: string;
  rawResponse?: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
}

export interface PaymentVerifyResult {
  success: boolean;
  status: "completed" | "pending" | "failed";
  transactionId: string;
  amount?: number;
  currency?: string;
  rawResponse?: Record<string, unknown>;
}

export interface RefundParams {
  transactionId: string;
  amount: number;
  reason?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  rawResponse?: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
}

const GATEWAY = (process.env["PAYMENT_GATEWAY"] ?? "mock").toLowerCase();

// ─── Mock Gateway ─────────────────────────────────────────────────────────────

async function mockInitPayment(params: PaymentInitParams): Promise<PaymentInitResult> {
  const transactionId = `MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  logger.info({ transactionId, amount: params.amount, orderId: params.orderId }, "MOCK payment initiated");
  return { success: true, transactionId };
}

async function mockVerifyPayment(transactionId: string): Promise<PaymentVerifyResult> {
  return { success: true, status: "completed", transactionId };
}

async function mockRefund(params: RefundParams): Promise<RefundResult> {
  const refundId = `MOCK-REFUND-${Date.now()}`;
  logger.info({ refundId, transactionId: params.transactionId, amount: params.amount }, "MOCK refund processed");
  return { success: true, refundId };
}

// ─── HyperPay Gateway ─────────────────────────────────────────────────────────

async function hyperpayInitPayment(params: PaymentInitParams): Promise<PaymentInitResult> {
  const accessToken = process.env["HYPERPAY_ACCESS_TOKEN"];
  const entityId = process.env["HYPERPAY_ENTITY_ID"];
  const baseUrl = process.env["HYPERPAY_BASE_URL"] ?? "https://eu-test.oppwa.com";

  if (!accessToken || !entityId) {
    logger.error("HyperPay credentials missing — set HYPERPAY_ACCESS_TOKEN and HYPERPAY_ENTITY_ID");
    return { success: false, transactionId: "", errorCode: "config_error", errorMessage: "Gateway not configured" };
  }

  try {
    const body = new URLSearchParams({
      "entityId": entityId,
      "amount": params.amount.toFixed(2),
      "currency": params.currency,
      "paymentType": "DB",
      "merchantTransactionId": params.orderId,
      "customer.email": params.customerEmail ?? "",
    });

    const resp = await fetch(`${baseUrl}/v1/checkouts`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const raw = await resp.json() as Record<string, unknown>;
    const checkoutId = raw["id"] as string | undefined;
    const resultCode = (raw["result"] as Record<string, unknown>)?.["code"] as string | undefined;
    const success = resultCode?.startsWith("000.") ?? false;

    return {
      success,
      transactionId: checkoutId ?? "",
      checkoutId,
      redirectUrl: checkoutId
        ? `${baseUrl}/v1/paymentWidgets.js?checkoutId=${checkoutId}`
        : undefined,
      rawResponse: raw,
      errorCode: success ? undefined : resultCode,
      errorMessage: success ? undefined : ((raw["result"] as Record<string, unknown>)?.["description"] as string),
    };
  } catch (err) {
    logger.error({ err }, "HyperPay initPayment request failed");
    return { success: false, transactionId: "", errorCode: "network_error", errorMessage: String(err) };
  }
}

async function hyperpayVerifyPayment(transactionId: string): Promise<PaymentVerifyResult> {
  const accessToken = process.env["HYPERPAY_ACCESS_TOKEN"];
  const entityId = process.env["HYPERPAY_ENTITY_ID"];
  const baseUrl = process.env["HYPERPAY_BASE_URL"] ?? "https://eu-test.oppwa.com";

  if (!accessToken || !entityId) {
    return { success: false, status: "failed", transactionId };
  }

  try {
    const resp = await fetch(
      `${baseUrl}/v1/checkouts/${transactionId}/payment?entityId=${entityId}`,
      { headers: { "Authorization": `Bearer ${accessToken}` } },
    );
    const raw = await resp.json() as Record<string, unknown>;
    const resultCode = (raw["result"] as Record<string, unknown>)?.["code"] as string | undefined;
    const success = resultCode?.startsWith("000.") ?? false;

    return {
      success,
      status: success ? "completed" : "failed",
      transactionId,
      amount: raw["amount"] ? parseFloat(raw["amount"] as string) : undefined,
      currency: raw["currency"] as string | undefined,
      rawResponse: raw,
    };
  } catch (err) {
    logger.error({ err }, "HyperPay verifyPayment request failed");
    return { success: false, status: "failed", transactionId };
  }
}

async function hyperpayRefund(params: RefundParams): Promise<RefundResult> {
  const accessToken = process.env["HYPERPAY_ACCESS_TOKEN"];
  const entityId = process.env["HYPERPAY_ENTITY_ID"];
  const baseUrl = process.env["HYPERPAY_BASE_URL"] ?? "https://eu-test.oppwa.com";

  if (!accessToken || !entityId) {
    return { success: false, errorCode: "config_error" };
  }

  try {
    const body = new URLSearchParams({
      "entityId": entityId,
      "amount": params.amount.toFixed(2),
      "currency": "SAR",
      "paymentType": "RF",
    });

    const resp = await fetch(`${baseUrl}/v1/payments/${params.transactionId}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const raw = await resp.json() as Record<string, unknown>;
    const resultCode = (raw["result"] as Record<string, unknown>)?.["code"] as string | undefined;
    const success = resultCode?.startsWith("000.") ?? false;

    return {
      success,
      refundId: raw["id"] as string | undefined,
      rawResponse: raw,
      errorCode: success ? undefined : resultCode,
    };
  } catch (err) {
    logger.error({ err }, "HyperPay refund request failed");
    return { success: false, errorCode: "network_error", errorMessage: String(err) };
  }
}

// ─── Stripe Gateway ───────────────────────────────────────────────────────────

async function stripeInitPayment(params: PaymentInitParams): Promise<PaymentInitResult> {
  const secretKey = process.env["STRIPE_SECRET_KEY"];
  if (!secretKey) {
    return { success: false, transactionId: "", errorCode: "config_error", errorMessage: "Stripe not configured" };
  }

  try {
    const body = new URLSearchParams({
      "amount": Math.round(params.amount * 100).toString(),
      "currency": params.currency.toLowerCase(),
      "description": params.description,
      "metadata[orderId]": params.orderId,
    });

    const resp = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const raw = await resp.json() as Record<string, unknown>;
    const success = raw["status"] === "requires_payment_method" || raw["status"] === "succeeded";

    return {
      success,
      transactionId: raw["id"] as string ?? "",
      rawResponse: raw,
      errorCode: raw["error"] ? (raw["error"] as Record<string, unknown>)?.["code"] as string : undefined,
      errorMessage: raw["error"] ? (raw["error"] as Record<string, unknown>)?.["message"] as string : undefined,
    };
  } catch (err) {
    logger.error({ err }, "Stripe initPayment request failed");
    return { success: false, transactionId: "", errorCode: "network_error", errorMessage: String(err) };
  }
}

async function stripeVerifyPayment(transactionId: string): Promise<PaymentVerifyResult> {
  const secretKey = process.env["STRIPE_SECRET_KEY"];
  if (!secretKey) return { success: false, status: "failed", transactionId };

  try {
    const resp = await fetch(`https://api.stripe.com/v1/payment_intents/${transactionId}`, {
      headers: { "Authorization": `Bearer ${secretKey}` },
    });
    const raw = await resp.json() as Record<string, unknown>;
    const stripeStatus = raw["status"] as string;
    const status: PaymentVerifyResult["status"] =
      stripeStatus === "succeeded" ? "completed"
      : stripeStatus === "processing" ? "pending"
      : "failed";

    return {
      success: status === "completed",
      status,
      transactionId,
      amount: raw["amount"] ? (raw["amount"] as number) / 100 : undefined,
      currency: (raw["currency"] as string)?.toUpperCase(),
      rawResponse: raw,
    };
  } catch (err) {
    return { success: false, status: "failed", transactionId };
  }
}

async function stripeRefund(params: RefundParams): Promise<RefundResult> {
  const secretKey = process.env["STRIPE_SECRET_KEY"];
  if (!secretKey) return { success: false, errorCode: "config_error" };

  try {
    const body = new URLSearchParams({
      "payment_intent": params.transactionId,
      "amount": Math.round(params.amount * 100).toString(),
      ...(params.reason ? { "reason": params.reason } : {}),
    });

    const resp = await fetch("https://api.stripe.com/v1/refunds", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const raw = await resp.json() as Record<string, unknown>;
    const success = raw["status"] === "succeeded";

    return {
      success,
      refundId: raw["id"] as string | undefined,
      rawResponse: raw,
      errorCode: success ? undefined : (raw["error"] as Record<string, unknown>)?.["code"] as string,
    };
  } catch (err) {
    return { success: false, errorCode: "network_error", errorMessage: String(err) };
  }
}

// ─── Public API (gateway-agnostic) ────────────────────────────────────────────

export async function initiatePayment(params: PaymentInitParams): Promise<PaymentInitResult> {
  switch (GATEWAY) {
    case "hyperpay": return hyperpayInitPayment(params);
    case "stripe":   return stripeInitPayment(params);
    default:         return mockInitPayment(params);
  }
}

export async function verifyPayment(transactionId: string): Promise<PaymentVerifyResult> {
  switch (GATEWAY) {
    case "hyperpay": return hyperpayVerifyPayment(transactionId);
    case "stripe":   return stripeVerifyPayment(transactionId);
    default:         return mockVerifyPayment(transactionId);
  }
}

export async function processRefund(params: RefundParams): Promise<RefundResult> {
  switch (GATEWAY) {
    case "hyperpay": return hyperpayRefund(params);
    case "stripe":   return stripeRefund(params);
    default:         return mockRefund(params);
  }
}

export const activeGateway = GATEWAY;
