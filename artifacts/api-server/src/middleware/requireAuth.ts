import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/auth.js";
import { verifyAdminToken, hasPermission, type AdminRole } from "../lib/admin-auth.js";
import { db } from "@workspace/db";
import { adminSessionsTable, auditLogTable } from "@workspace/db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";

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
      adminAuth?: {
        admUid: string;
        role: AdminRole;
        permissions: string[];
        sessionId: string;
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

export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({ error: "unauthorized", message: "Authentication required" });
      return;
    }

    const payload = verifyAdminToken(token);
    if (!payload) {
      res.status(401).json({ error: "unauthorized", message: "Invalid or expired token" });
      return;
    }

    const now = new Date();
    const [session] = await db
      .select({ sesUid: adminSessionsTable.sesUid, revokedAt: adminSessionsTable.revokedAt })
      .from(adminSessionsTable)
      .where(
        and(
          eq(adminSessionsTable.sesUid, payload.session_id),
          isNull(adminSessionsTable.revokedAt),
          gt(adminSessionsTable.expiresAt, now),
        )
      )
      .limit(1);

    if (!session) {
      res.status(401).json({ error: "unauthorized", message: "Session expired or revoked" });
      return;
    }

    if (!hasPermission(payload.permissions, permission)) {
      res.status(403).json({ error: "forbidden", message: "Insufficient permissions" });
      return;
    }

    req.adminAuth = {
      admUid: payload.sub,
      role: payload.role,
      permissions: payload.permissions,
      sessionId: payload.session_id,
    };

    const ip = getClientIp(req);
    await db.insert(auditLogTable).values({
      admUid: payload.sub,
      action: `${req.method} ${req.path}`,
      entityType: null,
      entityUid: null,
      ip,
      metadata: { permission },
    }).catch(() => {});

    next();
  };
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

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0]?.trim() ?? "unknown";
  return req.socket?.remoteAddress ?? "unknown";
}
