import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/auth.js";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: number;
        phone?: string | null;
        email?: string | null;
        isAdmin?: boolean;
        isOwner?: boolean;
      };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: "unauthorized", message: "Authentication required" });
    return;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "unauthorized", message: "Invalid or expired token" });
    return;
  }
  req.auth = { userId: payload.userId, phone: payload.phone, email: payload.email, isAdmin: payload.isAdmin, isOwner: payload.isOwner };
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: "unauthorized", message: "Authentication required" });
    return;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "unauthorized", message: "Invalid or expired token" });
    return;
  }
  if (!payload.isAdmin) {
    res.status(403).json({ error: "forbidden", message: "Admin access required" });
    return;
  }
  req.auth = { userId: payload.userId, phone: payload.phone, email: payload.email, isAdmin: true, isOwner: payload.isOwner };
  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.auth = { userId: payload.userId, phone: payload.phone, email: payload.email };
    }
  }
  next();
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const cookie = req.cookies?.["tabaq_token"];
  if (cookie) return cookie;
  return null;
}
