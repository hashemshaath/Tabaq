/**
 * Email Service — Production-ready provider abstraction
 *
 * In development (EMAIL_DEV_MODE=true or SMTP not configured):
 *   Logs the email to console — nothing is actually sent.
 *
 * In production:
 *   Reads SMTP credentials from platform_settings table.
 *   Uses nodemailer to send transactional email.
 *
 * Supported env vars (override DB settings):
 *   SMTP_HOST, SMTP_PORT, SMTP_EMAIL, SMTP_PASSWORD, SMTP_FROM_NAME
 */

import { logger } from "../lib/logger.js";

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SmtpConfig {
  host: string;
  port: number;
  email: string;
  password: string;
  fromName: string;
}

// ── Dev-mode mock ─────────────────────────────────────────────────────────────

function isDevMode(): boolean {
  return (
    process.env["NODE_ENV"] === "development" ||
    process.env["EMAIL_DEV_MODE"] === "true"
  );
}

async function sendMock(payload: EmailPayload & { devCode?: string }): Promise<EmailResult> {
  logger.info(
    { to: payload.to, subject: payload.subject, devCode: payload.devCode },
    "[email:mock] Email not sent — dev mode",
  );
  return { success: true, messageId: "mock-" + Date.now() };
}

// ── SMTP config loader ────────────────────────────────────────────────────────

async function loadSmtpConfig(): Promise<SmtpConfig | null> {
  // Env-var overrides take priority (useful for CI / self-hosted deployments)
  if (process.env["SMTP_HOST"] && process.env["SMTP_EMAIL"] && process.env["SMTP_PASSWORD"]) {
    return {
      host: process.env["SMTP_HOST"],
      port: parseInt(process.env["SMTP_PORT"] ?? "587", 10),
      email: process.env["SMTP_EMAIL"],
      password: process.env["SMTP_PASSWORD"],
      fromName: process.env["SMTP_FROM_NAME"] ?? "Tabaq",
    };
  }

  // Fall back to platform_settings stored by the admin dashboard
  try {
    const { db } = await import("@workspace/db");
    const { platformSettingsTable } = await import("@workspace/db/schema");
    const { inArray } = await import("drizzle-orm");

    const keys = ["smtp.host", "smtp.port", "smtp.email", "smtp.password", "smtp.fromName"];
    const rows = await db
      .select({ key: platformSettingsTable.key, value: platformSettingsTable.value })
      .from(platformSettingsTable)
      .where(inArray(platformSettingsTable.key, keys));

    const cfg: Record<string, string> = {};
    for (const row of rows) cfg[row.key] = row.value ?? "";

    if (!cfg["smtp.host"] || !cfg["smtp.email"] || !cfg["smtp.password"]) {
      return null;
    }

    return {
      host: cfg["smtp.host"]!,
      port: parseInt(cfg["smtp.port"] ?? "587", 10),
      email: cfg["smtp.email"]!,
      password: cfg["smtp.password"]!,
      fromName: cfg["smtp.fromName"] ?? "Tabaq",
    };
  } catch {
    return null;
  }
}

// ── Production SMTP send ──────────────────────────────────────────────────────

async function sendSmtp(payload: EmailPayload, cfg: SmtpConfig): Promise<EmailResult> {
  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 465,
      auth: { user: cfg.email, pass: cfg.password },
    });

    const info = await transporter.sendMail({
      from: `"${cfg.fromName}" <${cfg.email}>`,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text ?? payload.html.replace(/<[^>]+>/g, ""),
    });

    return { success: true, messageId: info.messageId };
  } catch (err) {
    logger.error({ err, to: payload.to }, "[email] Failed to send via SMTP");
    return { success: false, error: String(err) };
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function sendEmail(payload: EmailPayload & { devCode?: string }): Promise<EmailResult> {
  if (isDevMode()) {
    return sendMock(payload);
  }

  const cfg = await loadSmtpConfig();
  if (!cfg) {
    logger.warn({ to: payload.to }, "[email] SMTP not configured — falling back to mock");
    return sendMock(payload);
  }

  return sendSmtp(payload, cfg);
}

// ── Prebuilt templates ────────────────────────────────────────────────────────

export function passwordResetOtpEmail(otp: string, lang: "en" | "ar" = "en"): { subject: string; html: string } {
  if (lang === "ar") {
    return {
      subject: "طبق — إعادة تعيين كلمة المرور",
      html: `
        <div dir="rtl" style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2>إعادة تعيين كلمة المرور</h2>
          <p>استخدم هذا الرمز لإعادة تعيين كلمة المرور الخاصة بك:</p>
          <div style="font-size:32px;font-weight:bold;letter-spacing:8px;padding:16px;background:#f4f4f4;text-align:center;border-radius:8px">${otp}</div>
          <p>صالح لمدة <strong>10 دقائق</strong>. لا تشاركه مع أحد.</p>
          <p>إذا لم تطلب هذا، تجاهل هذه الرسالة.</p>
        </div>
      `,
    };
  }
  return {
    subject: "Tabaq — Reset Your Password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Reset Your Password</h2>
        <p>Use the code below to reset your Tabaq password:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;padding:16px;background:#f4f4f4;text-align:center;border-radius:8px">${otp}</div>
        <p>This code is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <p>If you didn't request a password reset, please ignore this email.</p>
      </div>
    `,
  };
}

export function passwordChangedEmail(lang: "en" | "ar" = "en"): { subject: string; html: string } {
  if (lang === "ar") {
    return {
      subject: "طبق — تم تغيير كلمة المرور",
      html: `
        <div dir="rtl" style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2>تم تغيير كلمة المرور</h2>
          <p>تم تغيير كلمة مرور حسابك على طبق بنجاح.</p>
          <p>إذا لم تكن أنت من قام بذلك، يُرجى التواصل مع الدعم فوراً.</p>
        </div>
      `,
    };
  }
  return {
    subject: "Tabaq — Your Password Was Changed",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Password Changed</h2>
        <p>Your Tabaq account password was successfully changed.</p>
        <p>If you did not make this change, please contact support immediately.</p>
      </div>
    `,
  };
}
