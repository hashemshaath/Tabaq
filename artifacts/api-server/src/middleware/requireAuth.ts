import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/auth.js";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: number;
        userUid?: string;
        phone?: string | null;
        email?: string | null;
        isAdmin?: boolean;
        isOwner?: boolean;
        role?: "user" | "admin" | "owner";
        jti?: string;
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
  req.auth = {
    userId: payload.userId,
    userUid: payload.sub,
    phone: payload.phone,
    email: payload.email,
    isAdmin: payload.isAdmin ?? payload.role === "admin",
    isOwner: payload.isOwner ?? payload.role === "owner",
    role: payload.role,
    jti: payload.jti,
  };
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
  const isAdmin = payload.isAdmin ?? payload.role === "admin";
  if (!isAdmin) {
    res.status(403).json({ error: "forbidden", message: "Admin access required" });
    return;
  }
  req.auth = {
    userId: payload.userId,
    userUid: payload.sub,
    phone: payload.phone,
    email: payload.email,
    isAdmin: true,
    isOwner: payload.isOwner ?? payload.role === "owner",
    role: payload.role,
    jti: payload.jti,
  };
  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.auth = {
        userId: payload.userId,
        userUid: payload.sub,
        phone: payload.phone,
        email: payload.email,
        isAdmin: payload.isAdmin ?? payload.role === "admin",
        isOwner: payload.isOwner ?? payload.role === "owner",
        role: payload.role,
        jti: payload.jti,
      };
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
