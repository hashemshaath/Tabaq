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

const RESERVED_USERNAMES = new Set([
  "admin", "tabaq", "support", "api", "help", "app", "www", "mail",
  "user", "users", "profile", "settings", "dashboard", "billing",
  "terms", "privacy", "about", "contact", "blog", "feed", "search",
  "signin", "signup", "logout", "partners", "legal",
]);

const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;

export function validateUsername(username: string): { valid: boolean; reason?: string } {
  if (!username) return { valid: false, reason: "Username is required" };
  if (!USERNAME_REGEX.test(username)) {
    if (username.length < 3) return { valid: false, reason: "Must be at least 3 characters" };
    if (username.length > 30) return { valid: false, reason: "Must be 30 characters or fewer" };
    return { valid: false, reason: "Only letters, numbers, underscores, and hyphens allowed" };
  }
  if (RESERVED_USERNAMES.has(username.toLowerCase())) {
    return { valid: false, reason: "This username is reserved" };
  }
  return { valid: true };
}

export function classifyIdentifier(raw: string): "email" | "phone" | "username" {
  const trimmed = raw.trim();
  if (trimmed.includes("@")) return "email";
  const cleaned = trimmed.replace(/[\s\-\(\)\.]/g, "");
  if (/^\+?[0-9]{7,15}$/.test(cleaned)) return "phone";
  return "username";
}
