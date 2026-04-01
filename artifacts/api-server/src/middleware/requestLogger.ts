import type { Request, Response, NextFunction } from "express";

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startMs = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startMs;
    const userUid = req.auth?.userUid ?? null;

    req.log.info({
      method: req.method,
      path: req.path,
      ip: (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.ip ?? "unknown",
      user_agent: req.headers["user-agent"] ?? null,
      status_code: res.statusCode,
      duration_ms: durationMs,
      user_uid: userUid,
    }, `${req.method} ${req.path} ${res.statusCode} ${durationMs}ms`);
  });

  next();
}
