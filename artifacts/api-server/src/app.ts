import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { publicRateLimiter } from "./middleware/rateLimiter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

// Trust proxy headers when behind load balancer / nginx (required for correct IP rate limiting)
if (process.env["TRUST_PROXY"] === "true") {
  app.set("trust proxy", 1);
}

app.use(helmet());

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
const extraOrigins = (process.env["CORS_EXTRA_ORIGINS"] ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const ALLOWED_ORIGINS = [
  // Replit workspace proxy domain
  process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null,
  // Production deployment domain
  process.env.REPLIT_DEPLOYMENT_URL ?? null,
  // Local dev
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:80",
  ...extraOrigins,
].filter(Boolean) as string[];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (ALLOWED_ORIGINS.some((allowed) => origin === allowed || origin.endsWith(".replit.dev"))) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      }
    },
    credentials: true,
  }),
);

// Apply global public rate limiter — tighter limits applied per-route where needed
app.use("/api", publicRateLimiter);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cookieParser());

// Serve locally uploaded files in development / single-server deployments
// In production with S3/R2, this directory will be empty and the middleware is a no-op
const uploadsDir = path.resolve(process.env["STORAGE_LOCAL_DIR"] ?? "./uploads");
app.use("/uploads", express.static(uploadsDir, { maxAge: "1y" }));

app.use("/api", router);
app.use("/api/v1", router);

// Global error handler — catches unhandled route errors
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled route error");
  const status = (err as { status?: number }).status ?? 500;
  res.status(status).json({
    error: "internal_error",
    message: process.env["NODE_ENV"] === "production" ? "An unexpected error occurred" : err.message,
  });
});

export default app;
