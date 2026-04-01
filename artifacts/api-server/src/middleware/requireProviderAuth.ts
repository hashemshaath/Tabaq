import type { Request, Response, NextFunction } from "express";
import { verifyProviderToken, verifyElevatedToken } from "../lib/auth.js";

declare global {
  namespace Express {
    interface Request {
      providerAuth?: {
        providerUid: string;
        providerRole: "OWNER" | "MANAGER" | "STAFF";
        sub: string;
        email?: string | null;
        staffUid?: string | null;
        jti?: string;
      };
    }
  }
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

export function requireProviderAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: "unauthorized", message: "Provider authentication required" });
    return;
  }
  const payload = verifyProviderToken(token);
  if (!payload) {
    res.status(401).json({ error: "unauthorized", message: "Invalid or expired provider token" });
    return;
  }
  req.providerAuth = {
    providerUid: payload.providerUid,
    providerRole: payload.providerRole,
    sub: payload.sub,
    email: payload.email,
    staffUid: payload.staffUid,
    jti: payload.jti,
  };
  next();
}

export function requireElevatedToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "unauthorized", message: "Elevated token required" });
    return;
  }
  const payload = verifyElevatedToken(token);
  if (!payload) {
    res.status(401).json({ error: "unauthorized", message: "Invalid or expired elevated token" });
    return;
  }
  next();
}
