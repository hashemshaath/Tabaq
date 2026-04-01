import jwt from "jsonwebtoken";
import crypto from "crypto";
import * as OTPAuth from "otpauth";

const JWT_SECRET = process.env["JWT_SECRET"];
if (!JWT_SECRET) throw new Error("JWT_SECRET environment variable is required");

export const ADMIN_TOKEN_EXPIRES_IN = "8h";
export const PARTIAL_TOKEN_EXPIRES_IN = "5m";

export type AdminRole = "SUPER_ADMIN" | "ADMIN" | "FINANCE" | "SUPPORT" | "VIEWER";

export interface AdminJwtPayload {
  sub: string;
  type: "admin";
  role: AdminRole;
  permissions: string[];
  session_id: string;
  iat?: number;
  exp?: number;
}

export interface PartialTokenPayload {
  sub: string;
  type: "2fa_pending";
  scope: "2fa_pending";
  challenge_id: string;
  iat?: number;
  exp?: number;
}

export const PERMISSION_MATRIX: Record<AdminRole, string[]> = {
  SUPER_ADMIN: [
    "admin:read",
    "admin:write",
    "admin:delete",
    "users:read",
    "users:write",
    "restaurants:read",
    "restaurants:write",
    "offers:read",
    "offers:write",
    "offers:approve",
    "bookings:read",
    "bookings:write",
    "finance:read",
    "finance:write",
    "settings:read",
    "settings:write",
    "ai:use",
    "referrals:read",
    "experiences:read",
    "experiences:write",
    "modules:write",
    "audit:read",
    "sessions:manage",
  ],
  ADMIN: [
    "admin:read",
    "admin:write",
    "users:read",
    "users:write",
    "restaurants:read",
    "restaurants:write",
    "offers:read",
    "offers:write",
    "offers:approve",
    "bookings:read",
    "bookings:write",
    "finance:read",
    "settings:read",
    "ai:use",
    "referrals:read",
    "experiences:read",
    "experiences:write",
    "audit:read",
  ],
  FINANCE: [
    "admin:read",
    "finance:read",
    "finance:write",
    "restaurants:read",
    "offers:read",
    "bookings:read",
    "audit:read",
  ],
  SUPPORT: [
    "admin:read",
    "users:read",
    "restaurants:read",
    "offers:read",
    "bookings:read",
    "bookings:write",
    "experiences:read",
  ],
  VIEWER: [
    "admin:read",
    "users:read",
    "restaurants:read",
    "offers:read",
    "bookings:read",
    "finance:read",
    "referrals:read",
    "experiences:read",
  ],
};

export function signAdminToken(admUid: string, role: AdminRole, sessionId: string): string {
  const permissions = PERMISSION_MATRIX[role] ?? [];
  const payload: AdminJwtPayload = {
    sub: admUid,
    type: "admin",
    role,
    permissions,
    session_id: sessionId,
  };
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: ADMIN_TOKEN_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyAdminToken(token: string): AdminJwtPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET!) as AdminJwtPayload;
    if (payload.type !== "admin") return null;
    return payload;
  } catch {
    return null;
  }
}

export function signPartialToken(admUid: string, challengeId: string): string {
  const payload: PartialTokenPayload = {
    sub: admUid,
    type: "2fa_pending",
    scope: "2fa_pending",
    challenge_id: challengeId,
  };
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: PARTIAL_TOKEN_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyPartialToken(token: string): PartialTokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET!) as PartialTokenPayload;
    if (payload.type !== "2fa_pending") return null;
    return payload;
  } catch {
    return null;
  }
}

export function generateAdmUid(): string {
  const year = new Date().getFullYear();
  const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `ADM-${year}-${suffix}`;
}

export function generateSesUid(): string {
  return `SES-${crypto.randomUUID()}`;
}

export function generateChallengeId(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function generateTotpSecret(): OTPAuth.TOTP {
  const secret = new OTPAuth.Secret({ size: 20 });
  return new OTPAuth.TOTP({
    issuer: "Tabaq Admin",
    label: "admin",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });
}

export function getTotpSecretBase32(totp: OTPAuth.TOTP): string {
  return totp.secret.base32;
}

export function buildTotpFromSecret(secret: string, label: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: "Tabaq Admin",
    label,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
}

export function verifyTotp(secret: string, token: string, label: string): boolean {
  try {
    const totp = buildTotpFromSecret(secret, label);
    const delta = totp.validate({ token, window: 1 });
    return delta !== null;
  } catch {
    return false;
  }
}

export function generateBackupCodes(): string[] {
  return Array.from({ length: 10 }, () =>
    crypto.randomBytes(5).toString("hex").toUpperCase()
  );
}

export function hashBackupCode(code: string): string {
  return crypto.createHash("sha256").update(code.toUpperCase()).digest("hex");
}

export function hasPermission(permissions: string[], required: string): boolean {
  return permissions.includes(required);
}
