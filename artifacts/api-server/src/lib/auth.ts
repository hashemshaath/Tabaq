import jwt from "jsonwebtoken";

const JWT_SECRET = process.env["JWT_SECRET"];
if (!JWT_SECRET) throw new Error("JWT_SECRET environment variable is required");
const JWT_EXPIRES_IN = process.env["JWT_EXPIRES_IN"] ?? "30d";

export interface JwtPayload {
  userId: number;
  phone?: string | null;
  email?: string | null;
  isAdmin?: boolean;
  isOwner?: boolean;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET!) as JwtPayload;
  } catch {
    return null;
  }
}

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function otpExpiresAt(): Date {
  const minutes = parseInt(process.env["OTP_EXPIRY_MINUTES"] ?? "10");
  return new Date(Date.now() + minutes * 60 * 1000);
}
