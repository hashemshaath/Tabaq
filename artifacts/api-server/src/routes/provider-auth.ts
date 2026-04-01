import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@workspace/db";
import {
  providerAccountsTable,
  providerAccountDocumentsTable,
  providerStaffTable,
  otpRequestsTable,
} from "@workspace/db/schema";
import { eq, and, isNull, gt, desc, gte } from "drizzle-orm";
import {
  signProviderToken,
  signElevatedToken,
  generateOtp,
  hashOtp,
  otpExpiresAt,
  normalizePhone,
  validateEmail,
  validateProviderPasswordStrength,
} from "../lib/auth.js";
import { requireProviderAuth } from "../middleware/requireProviderAuth.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";
import { sendOtp, isSmsDevMode } from "../services/smsService.js";
import { sendEmail } from "../services/emailService.js";
import multer from "multer";
import { getStorageProvider, validateUpload } from "../services/storageService.js";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const IS_DEV = process.env["NODE_ENV"] !== "production";
const BCRYPT_ROUNDS = 12;
const FAILED_LOGIN_MAX = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const ADMIN_EMAIL = process.env["ADMIN_EMAIL"] ?? "admin@tabaq.app";

function generateProviderUid(): string {
  const year = new Date().getFullYear();
  const suffix = crypto.randomBytes(5).toString("hex").toUpperCase();
  return `PRV-${year}-${suffix}`;
}

function generateStaffUid(): string {
  const suffix = crypto.randomBytes(5).toString("hex").toUpperCase();
  return `STF-${suffix}`;
}

function getClientIp(req: import("express").Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0]?.trim() ?? "unknown";
  return req.socket?.remoteAddress ?? "unknown";
}

async function recordProviderLoginSuccess(providerUid: string, ip: string) {
  await db.update(providerAccountsTable).set({
    failedLoginCount: 0,
    lockedUntil: null,
    lastLoginAt: new Date(),
    lastLoginIp: ip,
    updatedAt: new Date(),
  }).where(eq(providerAccountsTable.providerUid, providerUid));
}

async function recordProviderLoginFailure(providerUid: string) {
  const [provider] = await db
    .select({ failedLoginCount: providerAccountsTable.failedLoginCount })
    .from(providerAccountsTable)
    .where(eq(providerAccountsTable.providerUid, providerUid));
  if (!provider) return;
  const newCount = (provider.failedLoginCount ?? 0) + 1;
  const lockedUntil = newCount >= FAILED_LOGIN_MAX ? new Date(Date.now() + LOCK_DURATION_MS) : null;
  await db.update(providerAccountsTable).set({
    failedLoginCount: newCount,
    ...(lockedUntil ? { lockedUntil } : {}),
    updatedAt: new Date(),
  }).where(eq(providerAccountsTable.providerUid, providerUid));
}

// ── REGISTRATION STEP 1: Start ────────────────────────────────────────────────

router.post("/auth/provider/register/start", authRateLimiter, async (req, res) => {
  try {
    const { email: rawEmail, phone: rawPhone, preferred_contact } = req.body as {
      email?: string;
      phone?: string;
      preferred_contact?: string;
    };

    if (!rawEmail) {
      res.status(400).json({ error: "bad_request", message: "email is required" });
      return;
    }
    if (!validateEmail(rawEmail)) {
      res.status(400).json({ error: "invalid_email", message: "Invalid email address" });
      return;
    }

    const email = rawEmail.trim().toLowerCase();
    let phone: string | null = null;
    if (rawPhone) {
      phone = normalizePhone(rawPhone);
      if (!phone) {
        res.status(400).json({ error: "invalid_phone", message: "Invalid phone number. Use E.164 format e.g. +966501234567" });
        return;
      }
    }

    const preferredContact = preferred_contact === "phone" && phone ? "phone" : "email";

    // Check if email already in use
    const [existing] = await db
      .select({ providerUid: providerAccountsTable.providerUid, status: providerAccountsTable.status })
      .from(providerAccountsTable)
      .where(eq(providerAccountsTable.email, email))
      .limit(1);

    if (existing) {
      res.status(409).json({ error: "EMAIL_ALREADY_EXISTS", message: "A provider account with this email already exists" });
      return;
    }

    const providerUid = generateProviderUid();

    await db.insert(providerAccountsTable).values({
      providerUid,
      email,
      phone: phone ?? null,
      preferredContact,
      status: "DRAFT",
      registrationStep: 1,
    });

    const code = generateOtp();
    const otpHash = hashOtp(code);
    const expiresAt = otpExpiresAt();

    if (preferredContact === "phone" && phone) {
      await db.insert(otpRequestsTable).values({ phone, code: "HASHED", otpHash, expiresAt });
      const smsResult = await sendOtp(phone, code);
      if (!smsResult.success) {
        req.log.warn({ phone, error: smsResult.error }, "Provider SMS OTP send failed");
      }
      if (isSmsDevMode()) {
        req.log.info({ code }, "Provider OTP generated (SMS dev mode)");
        res.status(201).json({ providerUid, message: "OTP sent to phone", ...(IS_DEV ? { devCode: code } : {}) });
      } else {
        res.status(201).json({ providerUid, message: "OTP sent to phone" });
      }
    } else {
      await db.insert(otpRequestsTable).values({ email, code: "HASHED", otpHash, expiresAt });
      await sendEmail({
        to: email,
        subject: "Tabaq Provider — Verify Your Email",
        html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2>Verify Your Email</h2>
          <p>Use the code below to verify your provider account email:</p>
          <div style="font-size:32px;font-weight:bold;letter-spacing:8px;padding:16px;background:#f4f4f4;text-align:center;border-radius:8px">${code}</div>
          <p>Valid for <strong>5 minutes</strong>. Do not share it.</p>
        </div>`,
        devCode: IS_DEV ? code : undefined,
      });
      req.log.info({ code }, "Provider OTP generated (email)");
      res.status(201).json({ providerUid, message: "OTP sent to email", ...(IS_DEV ? { devCode: code } : {}) });
    }
  } catch (err) {
    req.log.error({ err }, "Failed to start provider registration");
    res.status(500).json({ error: "internal_error", message: "Failed to start registration" });
  }
});

// ── REGISTRATION STEP 2: Verify OTP ──────────────────────────────────────────

router.post("/auth/provider/register/verify-otp", authRateLimiter, async (req, res) => {
  try {
    const { provider_uid, code } = req.body as { provider_uid?: string; code?: string };

    if (!provider_uid || !code) {
      res.status(400).json({ error: "bad_request", message: "provider_uid and code are required" });
      return;
    }

    const [provider] = await db
      .select()
      .from(providerAccountsTable)
      .where(eq(providerAccountsTable.providerUid, provider_uid))
      .limit(1);

    if (!provider) {
      res.status(404).json({ error: "not_found", message: "Provider account not found" });
      return;
    }

    const now = new Date();
    const submittedHash = hashOtp(code);

    const condition = provider.preferredContact === "phone" && provider.phone
      ? and(eq(otpRequestsTable.phone, provider.phone), isNull(otpRequestsTable.usedAt), gt(otpRequestsTable.expiresAt, now))
      : and(eq(otpRequestsTable.email, provider.email), isNull(otpRequestsTable.usedAt), gt(otpRequestsTable.expiresAt, now));

    const [otp] = await db.select().from(otpRequestsTable)
      .where(condition!)
      .orderBy(desc(otpRequestsTable.createdAt))
      .limit(1);

    if (!otp) {
      res.status(401).json({ error: "invalid_otp", message: "Invalid or expired OTP" });
      return;
    }

    const storedHash = otp.otpHash ?? "";
    if (storedHash === "LEGACY" || storedHash !== submittedHash) {
      const newAttempts = (otp.attempts ?? 0) + 1;
      if (newAttempts >= 3) {
        await db.update(otpRequestsTable).set({ usedAt: now }).where(eq(otpRequestsTable.id, otp.id));
        res.status(401).json({ error: "otp_voided", message: "Too many failed attempts. Please request a new code." });
      } else {
        await db.update(otpRequestsTable).set({ attempts: newAttempts }).where(eq(otpRequestsTable.id, otp.id));
        res.status(401).json({ error: "invalid_otp", message: "Invalid OTP", attemptsRemaining: 3 - newAttempts });
      }
      return;
    }

    await db.update(otpRequestsTable).set({ usedAt: now }).where(eq(otpRequestsTable.id, otp.id));

    const updateFields = provider.preferredContact === "phone"
      ? { phoneVerified: true, registrationStep: 2, updatedAt: new Date() }
      : { emailVerified: true, registrationStep: 2, updatedAt: new Date() };

    await db.update(providerAccountsTable).set(updateFields).where(eq(providerAccountsTable.providerUid, provider_uid));

    res.json({ message: "Contact verified", provider_uid, next_step: "set-password" });
  } catch (err) {
    req.log.error({ err }, "Failed to verify provider OTP");
    res.status(500).json({ error: "internal_error", message: "Failed to verify OTP" });
  }
});

// ── REGISTRATION STEP 3: Set Password ────────────────────────────────────────

router.post("/auth/provider/register/set-password", authRateLimiter, async (req, res) => {
  try {
    const { provider_uid, password } = req.body as { provider_uid?: string; password?: string };

    if (!provider_uid || !password) {
      res.status(400).json({ error: "bad_request", message: "provider_uid and password are required" });
      return;
    }

    const [provider] = await db
      .select({ providerUid: providerAccountsTable.providerUid, registrationStep: providerAccountsTable.registrationStep })
      .from(providerAccountsTable)
      .where(eq(providerAccountsTable.providerUid, provider_uid))
      .limit(1);

    if (!provider) {
      res.status(404).json({ error: "not_found", message: "Provider account not found" });
      return;
    }

    if (provider.registrationStep < 2) {
      res.status(400).json({ error: "step_skipped", message: "Please complete contact verification first" });
      return;
    }

    const strength = validateProviderPasswordStrength(password);
    if (!strength.valid) {
      res.status(400).json({ error: "PASSWORD_TOO_WEAK", message: "Password does not meet requirements", requirements: strength.reasons });
      return;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await db.update(providerAccountsTable).set({ passwordHash, registrationStep: 3, updatedAt: new Date() })
      .where(eq(providerAccountsTable.providerUid, provider_uid));

    res.json({ message: "Password set", provider_uid, next_step: "business-details" });
  } catch (err) {
    req.log.error({ err }, "Failed to set provider password");
    res.status(500).json({ error: "internal_error", message: "Failed to set password" });
  }
});

// ── REGISTRATION STEP 4: Business Details ────────────────────────────────────

router.post("/auth/provider/register/business-details", authRateLimiter, async (req, res) => {
  try {
    const {
      provider_uid,
      business_name,
      business_name_ar,
      business_type,
      cr_number,
      vat_number,
      business_address,
      city,
      country,
      website_url,
      contact_name,
    } = req.body as {
      provider_uid?: string;
      business_name?: string;
      business_name_ar?: string;
      business_type?: string;
      cr_number?: string;
      vat_number?: string;
      business_address?: string;
      city?: string;
      country?: string;
      website_url?: string;
      contact_name?: string;
    };

    if (!provider_uid || !business_name) {
      res.status(400).json({ error: "bad_request", message: "provider_uid and business_name are required" });
      return;
    }

    const [provider] = await db
      .select({ providerUid: providerAccountsTable.providerUid, registrationStep: providerAccountsTable.registrationStep })
      .from(providerAccountsTable)
      .where(eq(providerAccountsTable.providerUid, provider_uid))
      .limit(1);

    if (!provider) {
      res.status(404).json({ error: "not_found", message: "Provider account not found" });
      return;
    }

    if (provider.registrationStep < 3) {
      res.status(400).json({ error: "step_skipped", message: "Please complete password setup first" });
      return;
    }

    await db.update(providerAccountsTable).set({
      businessName: business_name ?? null,
      businessNameAr: business_name_ar ?? null,
      businessType: business_type ?? null,
      crNumber: cr_number ?? null,
      vatNumber: vat_number ?? null,
      businessAddress: business_address ?? null,
      city: city ?? null,
      country: country ?? null,
      websiteUrl: website_url ?? null,
      contactName: contact_name ?? null,
      registrationStep: 4,
      updatedAt: new Date(),
    }).where(eq(providerAccountsTable.providerUid, provider_uid));

    res.json({ message: "Business details saved", provider_uid, next_step: "upload-documents" });
  } catch (err) {
    req.log.error({ err }, "Failed to save provider business details");
    res.status(500).json({ error: "internal_error", message: "Failed to save business details" });
  }
});

// ── REGISTRATION STEP 5: Upload Documents ────────────────────────────────────

router.post(
  "/auth/provider/register/upload-documents",
  authRateLimiter,
  upload.fields([
    { name: "cr_document", maxCount: 1 },
    { name: "vat_document", maxCount: 1 },
    { name: "owner_id", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { provider_uid } = req.body as { provider_uid?: string };

      if (!provider_uid) {
        res.status(400).json({ error: "bad_request", message: "provider_uid is required" });
        return;
      }

      const [provider] = await db
        .select()
        .from(providerAccountsTable)
        .where(eq(providerAccountsTable.providerUid, provider_uid))
        .limit(1);

      if (!provider) {
        res.status(404).json({ error: "not_found", message: "Provider account not found" });
        return;
      }

      if (provider.registrationStep < 4) {
        res.status(400).json({ error: "step_skipped", message: "Please complete business details first" });
        return;
      }

      const files = req.files as Record<string, Express.Multer.File[]> | undefined;

      const crFile = files?.["cr_document"]?.[0];
      const vatFile = files?.["vat_document"]?.[0];
      const ownerIdFile = files?.["owner_id"]?.[0];

      if (!crFile || !vatFile || !ownerIdFile) {
        res.status(400).json({
          error: "missing_documents",
          message: "All three documents are required: cr_document, vat_document, and owner_id",
          required: ["cr_document", "vat_document", "owner_id"],
          received: Object.keys(files ?? {}),
        });
        return;
      }

      const storageProvider = getStorageProvider();

      async function uploadFile(file: Express.Multer.File | undefined): Promise<string | null> {
        if (!file) return null;
        const validation = validateUpload(file.buffer, file.mimetype);
        if (!validation.valid) {
          throw new Error(validation.error ?? "Invalid file");
        }
        const uploaded = await storageProvider.upload(file.buffer, file.originalname, file.mimetype);
        return uploaded.url;
      }

      const crDocumentUrl = await uploadFile(crFile);
      const vatDocumentUrl = await uploadFile(vatFile);
      const ownerIdUrl = await uploadFile(ownerIdFile);

      // Upsert provider documents
      const [existingDoc] = await db
        .select({ id: providerAccountDocumentsTable.id })
        .from(providerAccountDocumentsTable)
        .where(eq(providerAccountDocumentsTable.providerUid, provider_uid))
        .limit(1);

      if (existingDoc) {
        await db.update(providerAccountDocumentsTable).set({
          crDocumentUrl: crDocumentUrl ?? undefined,
          vatDocumentUrl: vatDocumentUrl ?? undefined,
          ownerIdUrl: ownerIdUrl ?? undefined,
          updatedAt: new Date(),
        }).where(eq(providerAccountDocumentsTable.providerUid, provider_uid));
      } else {
        await db.insert(providerAccountDocumentsTable).values({
          providerUid: provider_uid,
          crDocumentUrl,
          vatDocumentUrl,
          ownerIdUrl,
        });
      }

      await db.update(providerAccountsTable).set({
        status: "PENDING_REVIEW",
        registrationStep: 5,
        updatedAt: new Date(),
      }).where(eq(providerAccountsTable.providerUid, provider_uid));

      await sendEmail({
        to: ADMIN_EMAIL,
        subject: "Tabaq — New Provider Application Submitted",
        html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2>New Provider Application</h2>
          <p>A new provider application has been submitted and is awaiting review.</p>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:4px;font-weight:bold">Provider UID</td><td style="padding:4px">${provider_uid}</td></tr>
            <tr><td style="padding:4px;font-weight:bold">Email</td><td style="padding:4px">${provider.email}</td></tr>
            <tr><td style="padding:4px;font-weight:bold">Business Name</td><td style="padding:4px">${provider.businessName ?? "—"}</td></tr>
            <tr><td style="padding:4px;font-weight:bold">Business Type</td><td style="padding:4px">${provider.businessType ?? "—"}</td></tr>
          </table>
          <p>Please review and approve or reject this application in the admin dashboard.</p>
        </div>`,
      });

      res.json({ message: "Documents uploaded. Application is now pending review.", provider_uid, status: "PENDING_REVIEW" });
    } catch (err) {
      req.log.error({ err }, "Failed to upload provider documents");
      res.status(500).json({ error: "internal_error", message: "Failed to upload documents" });
    }
  }
);

// ── PROVIDER LOGIN ────────────────────────────────────────────────────────────

router.post("/auth/provider/login", authRateLimiter, async (req, res) => {
  try {
    const { email: rawEmail, password } = req.body as { email?: string; password?: string };

    if (!rawEmail || !password) {
      res.status(400).json({ error: "bad_request", message: "email and password are required" });
      return;
    }
    if (!validateEmail(rawEmail)) {
      res.status(400).json({ error: "invalid_email", message: "Invalid email address" });
      return;
    }

    const email = rawEmail.trim().toLowerCase();
    const [provider] = await db
      .select()
      .from(providerAccountsTable)
      .where(eq(providerAccountsTable.email, email))
      .limit(1);

    if (!provider) {
      res.status(401).json({ error: "invalid_credentials", message: "Invalid email or password" });
      return;
    }

    // Check lockout
    if (provider.lockedUntil && provider.lockedUntil > new Date()) {
      const retryAfter = Math.ceil((provider.lockedUntil.getTime() - Date.now()) / 1000);
      res.status(403).json({ error: "ACCOUNT_LOCKED", message: "Account temporarily locked due to too many failed attempts.", retry_after: retryAfter });
      return;
    }

    // Check status
    if (provider.status === "PENDING_REVIEW") {
      res.status(403).json({ error: "ACCOUNT_PENDING_REVIEW", message: "Your application is under review. You will be notified by email once it is approved." });
      return;
    }
    if (provider.status === "REJECTED") {
      res.status(403).json({ error: "ACCOUNT_REJECTED", message: "Your application was rejected.", reason: provider.rejectionReason });
      return;
    }
    if (provider.status === "SUSPENDED") {
      res.status(403).json({ error: "ACCOUNT_SUSPENDED", message: "Your account has been suspended.", reason: provider.suspensionReason });
      return;
    }
    if (provider.status === "DRAFT") {
      res.status(403).json({ error: "REGISTRATION_INCOMPLETE", message: "Please complete your registration before logging in." });
      return;
    }

    if (!provider.passwordHash) {
      res.status(401).json({ error: "invalid_credentials", message: "Invalid email or password" });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, provider.passwordHash);
    if (!passwordMatch) {
      await recordProviderLoginFailure(provider.providerUid);
      res.status(401).json({ error: "invalid_credentials", message: "Invalid email or password" });
      return;
    }

    const ip = getClientIp(req);
    await recordProviderLoginSuccess(provider.providerUid, ip);

    const token = signProviderToken({
      sub: provider.providerUid,
      providerUid: provider.providerUid,
      providerRole: "OWNER",
      email: provider.email,
    });

    res.json({ token, providerUid: provider.providerUid, role: "OWNER" });
  } catch (err) {
    req.log.error({ err }, "Provider login failed");
    res.status(500).json({ error: "internal_error", message: "Login failed" });
  }
});

// ── PROVIDER 2FA ──────────────────────────────────────────────────────────────

router.post("/auth/provider/2fa/send", requireProviderAuth, async (req, res) => {
  try {
    const { providerUid } = req.providerAuth!;

    const [provider] = await db
      .select({ email: providerAccountsTable.email, phone: providerAccountsTable.phone, preferredContact: providerAccountsTable.preferredContact })
      .from(providerAccountsTable)
      .where(eq(providerAccountsTable.providerUid, providerUid))
      .limit(1);

    if (!provider) {
      res.status(404).json({ error: "not_found", message: "Provider account not found" });
      return;
    }

    const code = generateOtp();
    const otpHash = hashOtp(code);
    const expiresAt = otpExpiresAt();

    if (provider.preferredContact === "phone" && provider.phone) {
      await db.insert(otpRequestsTable).values({ phone: provider.phone, code: "HASHED", otpHash, expiresAt });
      await sendOtp(provider.phone, code);
      res.json({ message: "2FA code sent to phone", ...(IS_DEV ? { devCode: code } : {}) });
    } else {
      await db.insert(otpRequestsTable).values({ email: provider.email, code: "HASHED", otpHash, expiresAt });
      await sendEmail({
        to: provider.email,
        subject: "Tabaq Provider — 2FA Verification Code",
        html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2>2FA Verification Code</h2>
          <p>Use the code below to complete your two-factor authentication:</p>
          <div style="font-size:32px;font-weight:bold;letter-spacing:8px;padding:16px;background:#f4f4f4;text-align:center;border-radius:8px">${code}</div>
          <p>Valid for <strong>5 minutes</strong>. Do not share it.</p>
        </div>`,
        devCode: IS_DEV ? code : undefined,
      });
      res.json({ message: "2FA code sent to email", ...(IS_DEV ? { devCode: code } : {}) });
    }
  } catch (err) {
    req.log.error({ err }, "Failed to send provider 2FA code");
    res.status(500).json({ error: "internal_error", message: "Failed to send 2FA code" });
  }
});

router.post("/auth/provider/2fa/verify", requireProviderAuth, async (req, res) => {
  try {
    const { providerUid } = req.providerAuth!;
    const { code } = req.body as { code?: string };

    if (!code) {
      res.status(400).json({ error: "bad_request", message: "code is required" });
      return;
    }

    const [provider] = await db
      .select({ email: providerAccountsTable.email, phone: providerAccountsTable.phone, preferredContact: providerAccountsTable.preferredContact })
      .from(providerAccountsTable)
      .where(eq(providerAccountsTable.providerUid, providerUid))
      .limit(1);

    if (!provider) {
      res.status(404).json({ error: "not_found", message: "Provider account not found" });
      return;
    }

    const now = new Date();
    const submittedHash = hashOtp(code);

    const condition = provider.preferredContact === "phone" && provider.phone
      ? and(eq(otpRequestsTable.phone, provider.phone), isNull(otpRequestsTable.usedAt), gt(otpRequestsTable.expiresAt, now))
      : and(eq(otpRequestsTable.email, provider.email), isNull(otpRequestsTable.usedAt), gt(otpRequestsTable.expiresAt, now));

    const [otp] = await db.select().from(otpRequestsTable)
      .where(condition!)
      .orderBy(desc(otpRequestsTable.createdAt))
      .limit(1);

    if (!otp || otp.otpHash !== submittedHash) {
      res.status(401).json({ error: "invalid_otp", message: "Invalid or expired 2FA code" });
      return;
    }

    await db.update(otpRequestsTable).set({ usedAt: now }).where(eq(otpRequestsTable.id, otp.id));

    const elevatedToken = signElevatedToken(providerUid, req.providerAuth!.sub);

    res.json({ elevated_token: elevatedToken });
  } catch (err) {
    req.log.error({ err }, "Failed to verify provider 2FA");
    res.status(500).json({ error: "internal_error", message: "Failed to verify 2FA code" });
  }
});

// ── STAFF INVITE ──────────────────────────────────────────────────────────────

router.post("/auth/provider/invite-staff", requireProviderAuth, async (req, res) => {
  try {
    const { providerUid, providerRole } = req.providerAuth!;

    if (providerRole !== "OWNER" && providerRole !== "MANAGER") {
      res.status(403).json({ error: "forbidden", message: "Only OWNER or MANAGER can invite staff" });
      return;
    }

    const { email: rawEmail, role } = req.body as { email?: string; role?: string };

    if (!rawEmail) {
      res.status(400).json({ error: "bad_request", message: "email is required" });
      return;
    }
    if (!validateEmail(rawEmail)) {
      res.status(400).json({ error: "invalid_email", message: "Invalid email address" });
      return;
    }

    const allowedRolesForOwner: Array<"OWNER" | "MANAGER" | "STAFF"> = ["OWNER", "MANAGER", "STAFF"];
    const allowedRolesForManager: Array<"MANAGER" | "STAFF"> = ["MANAGER", "STAFF"];
    const allowedRoles = providerRole === "OWNER" ? allowedRolesForOwner : allowedRolesForManager;
    const requestedRole = (role ?? "STAFF") as string;
    if (!allowedRoles.includes(requestedRole as "OWNER" | "MANAGER" | "STAFF")) {
      res.status(403).json({ error: "forbidden", message: `Your role (${providerRole}) cannot assign the role '${requestedRole}'` });
      return;
    }
    const staffRole = requestedRole as "OWNER" | "MANAGER" | "STAFF";
    const email = rawEmail.trim().toLowerCase();

    const [existing] = await db
      .select({ id: providerStaffTable.id })
      .from(providerStaffTable)
      .where(and(eq(providerStaffTable.providerUid, providerUid), eq(providerStaffTable.email, email)))
      .limit(1);

    if (existing) {
      res.status(409).json({ error: "STAFF_ALREADY_INVITED", message: "This email has already been invited" });
      return;
    }

    const staffUid = generateStaffUid();
    const inviteToken = crypto.randomBytes(32).toString("hex");
    const inviteTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.insert(providerStaffTable).values({
      staffUid,
      providerUid,
      email,
      role: staffRole,
      status: "INVITED",
      inviteToken,
      inviteTokenExpiresAt,
      invitedBy: req.providerAuth!.sub,
    });

    const inviteUrl = `${process.env["APP_URL"] ?? "https://tabaq.app"}/provider/staff/accept-invite?token=${inviteToken}`;

    await sendEmail({
      to: email,
      subject: "You've been invited to join a Tabaq provider account",
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>You're Invited!</h2>
        <p>You've been invited to join a Tabaq provider account as a <strong>${staffRole}</strong>.</p>
        <p>Click the link below to accept your invitation and set up your account:</p>
        <a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#e63946;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">Accept Invitation</a>
        <p style="margin-top:16px;color:#666">This link expires in 24 hours.</p>
        <p>If you didn't expect this invitation, you can safely ignore this email.</p>
      </div>`,
    });

    res.status(201).json({ message: "Invitation sent", staffUid, email, role: staffRole });
  } catch (err) {
    req.log.error({ err }, "Failed to invite staff");
    res.status(500).json({ error: "internal_error", message: "Failed to send invitation" });
  }
});

// ── STAFF ACCEPT INVITE ───────────────────────────────────────────────────────

router.post("/auth/provider/staff/accept-invite", authRateLimiter, async (req, res) => {
  try {
    const { invite_token, name_en, password } = req.body as {
      invite_token?: string;
      name_en?: string;
      password?: string;
    };

    if (!invite_token || !password) {
      res.status(400).json({ error: "bad_request", message: "invite_token and password are required" });
      return;
    }

    const [staff] = await db
      .select()
      .from(providerStaffTable)
      .where(eq(providerStaffTable.inviteToken, invite_token))
      .limit(1);

    if (!staff) {
      res.status(404).json({ error: "invalid_token", message: "Invalid invitation token" });
      return;
    }

    if (staff.status !== "INVITED") {
      res.status(409).json({ error: "INVITE_ALREADY_USED", message: "This invitation has already been accepted" });
      return;
    }

    if (staff.inviteTokenExpiresAt && staff.inviteTokenExpiresAt < new Date()) {
      res.status(410).json({ error: "INVITE_EXPIRED", message: "This invitation has expired. Please request a new one." });
      return;
    }

    const strength = validateProviderPasswordStrength(password);
    if (!strength.valid) {
      res.status(400).json({ error: "PASSWORD_TOO_WEAK", message: "Password does not meet requirements", requirements: strength.reasons });
      return;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    await db.update(providerStaffTable).set({
      passwordHash,
      nameEn: name_en?.trim() ?? null,
      status: "ACTIVE",
      inviteToken: null,
      inviteTokenExpiresAt: null,
      updatedAt: new Date(),
    }).where(eq(providerStaffTable.id, staff.id));

    const token = signProviderToken({
      sub: staff.staffUid,
      providerUid: staff.providerUid,
      providerRole: staff.role,
      email: staff.email,
      staffUid: staff.staffUid,
    });

    res.json({ token, staffUid: staff.staffUid, providerUid: staff.providerUid, role: staff.role });
  } catch (err) {
    req.log.error({ err }, "Failed to accept staff invite");
    res.status(500).json({ error: "internal_error", message: "Failed to accept invitation" });
  }
});

export default router;
