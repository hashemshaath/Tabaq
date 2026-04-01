import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env["JWT_SECRET"];
if (!JWT_SECRET) throw new Error("JWT_SECRET environment variable is required");

export const ACCESS_TOKEN_EXPIRES_IN = "15m";
export const REFRESH_TOKEN_EXPIRES_IN_MS = 30 * 24 * 60 * 60 * 1000;

export interface JwtPayload {
  sub: string;
  userId: number;
  type: "access";
  role: "user" | "admin" | "owner";
  jti: string;
  phone?: string | null;
  email?: string | null;
  isAdmin?: boolean;
  isOwner?: boolean;
}

export function signToken(payload: Omit<JwtPayload, "jti" | "type"> & { jti?: string; type?: string }): string {
  const fullPayload: JwtPayload = {
    ...payload,
    type: "access",
    jti: payload.jti ?? crypto.randomUUID(),
    sub: payload.sub,
    role: payload.role ?? (payload.isAdmin ? "admin" : payload.isOwner ? "owner" : "user"),
  };
  return jwt.sign(fullPayload, JWT_SECRET!, { expiresIn: ACCESS_TOKEN_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET!) as JwtPayload;
  } catch {
    return null;
  }
}

export function generateOtp(): string {
  return String(crypto.randomInt(100000, 999999));
}

export function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export function otpExpiresAt(): Date {
  return new Date(Date.now() + 5 * 60 * 1000);
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function normalizePhone(raw: string): string | null {
  const cleaned = raw.replace(/[\s\-\(\)\.]/g, "");
  if (/^\+[1-9]\d{6,14}$/.test(cleaned)) return cleaned;
  if (/^009\d{2}/.test(cleaned)) return "+" + cleaned.slice(2);
  if (/^05\d{8}$/.test(cleaned)) return "+966" + cleaned.slice(1);
  if (/^5\d{8}$/.test(cleaned)) return "+966" + cleaned;
  return null;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function validatePasswordStrength(password: string): { valid: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (password.length < 8) reasons.push("at least 8 characters");
  if (!/[A-Z]/.test(password)) reasons.push("at least 1 uppercase letter");
  if (!/[0-9]/.test(password)) reasons.push("at least 1 number");
  return { valid: reasons.length === 0, reasons };
}
