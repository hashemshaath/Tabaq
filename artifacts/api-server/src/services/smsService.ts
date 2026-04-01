/**
 * SMS Service — Production-ready provider abstraction
 *
 * Supported providers (set SMS_PROVIDER env var):
 *   mock      — dev/test mode: logs the OTP to console, never sends a real SMS
 *   unifonic  — Unifonic REST API (popular in Saudi Arabia / MENA)
 *   twilio    — Twilio Messaging API (global)
 *
 * All providers implement the same interface so the rest of the app
 * never needs to know which provider is active.
 */

import { logger } from "../lib/logger.js";

// ── Provider types ────────────────────────────────────────────────────────────

interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface SmsProvider {
  send(to: string, message: string): Promise<SmsResult>;
}

// ── Mock provider (development / test) ───────────────────────────────────────

class MockSmsProvider implements SmsProvider {
  async send(to: string, message: string): Promise<SmsResult> {
    logger.info({ to, message }, "[SMS:mock] SMS not sent — dev mode");
    return { success: true, messageId: "mock-" + Date.now() };
  }
}

// ── Unifonic provider ─────────────────────────────────────────────────────────

class UnifonicSmsProvider implements SmsProvider {
  private readonly appSid: string;
  private readonly senderId: string;

  constructor() {
    const appSid = process.env["UNIFONIC_APP_SID"];
    const senderId = process.env["UNIFONIC_SENDER_ID"] ?? "Tabaq";
    if (!appSid) throw new Error("UNIFONIC_APP_SID is required when SMS_PROVIDER=unifonic");
    this.appSid = appSid;
    this.senderId = senderId;
  }

  async send(to: string, message: string): Promise<SmsResult> {
    try {
      const params = new URLSearchParams({
        AppSid: this.appSid,
        SenderID: this.senderId,
        Body: message,
        Recipient: to,
        responseType: "JSON",
      });

      const res = await fetch("https://api.unifonic.com/rest/Messages/Send", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });

      const data = (await res.json()) as { Success?: boolean; MessageID?: string; Message?: string };

      if (!res.ok || !data.Success) {
        logger.warn({ to, data }, "[SMS:unifonic] Failed to send SMS");
        return { success: false, error: data.Message ?? "Unifonic send failed" };
      }

      logger.info({ to, messageId: data.MessageID }, "[SMS:unifonic] SMS sent");
      return { success: true, messageId: String(data.MessageID ?? "") };
    } catch (err) {
      logger.error({ err, to }, "[SMS:unifonic] Error sending SMS");
      return { success: false, error: String(err) };
    }
  }
}

// ── Twilio provider ───────────────────────────────────────────────────────────

class TwilioSmsProvider implements SmsProvider {
  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly from: string;

  constructor() {
    const accountSid = process.env["TWILIO_ACCOUNT_SID"];
    const authToken = process.env["TWILIO_AUTH_TOKEN"];
    const from = process.env["TWILIO_FROM_NUMBER"];
    if (!accountSid || !authToken || !from) {
      throw new Error("TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER are required when SMS_PROVIDER=twilio");
    }
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.from = from;
  }

  async send(to: string, message: string): Promise<SmsResult> {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const params = new URLSearchParams({ To: to, From: this.from, Body: message });
      const credentials = Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64");

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const data = (await res.json()) as { sid?: string; error_message?: string; status?: string };

      if (!res.ok) {
        logger.warn({ to, data }, "[SMS:twilio] Failed to send SMS");
        return { success: false, error: data.error_message ?? "Twilio send failed" };
      }

      logger.info({ to, sid: data.sid, status: data.status }, "[SMS:twilio] SMS sent");
      return { success: true, messageId: data.sid };
    } catch (err) {
      logger.error({ err, to }, "[SMS:twilio] Error sending SMS");
      return { success: false, error: String(err) };
    }
  }
}

// ── Provider factory ──────────────────────────────────────────────────────────

function createSmsProvider(): SmsProvider {
  const provider = (process.env["SMS_PROVIDER"] ?? "mock").toLowerCase();
  switch (provider) {
    case "unifonic":
      return new UnifonicSmsProvider();
    case "twilio":
      return new TwilioSmsProvider();
    case "mock":
    default:
      return new MockSmsProvider();
  }
}

let _smsProvider: SmsProvider | null = null;

function getSmsProvider(): SmsProvider {
  if (!_smsProvider) {
    _smsProvider = createSmsProvider();
  }
  return _smsProvider;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Send an OTP code to a phone number.
 * Uses the bilingual message format (Arabic + English).
 */
export async function sendOtp(phone: string, code: string): Promise<SmsResult> {
  const message = `رمز التحقق الخاص بك في طبق هو: ${code}\nYour Tabaq verification code is: ${code}\n(Valid for 10 minutes — لا تشاركه مع أحد)`;
  return getSmsProvider().send(phone, message);
}

/**
 * Send a generic SMS message.
 */
export async function sendSms(to: string, message: string): Promise<SmsResult> {
  return getSmsProvider().send(to, message);
}

/** Check if SMS is running in mock/dev mode (useful for tests) */
export function isSmsDevMode(): boolean {
  return (process.env["SMS_PROVIDER"] ?? "mock").toLowerCase() === "mock";
}
