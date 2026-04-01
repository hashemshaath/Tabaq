/**
 * Storage Service — Production-ready file upload abstraction
 *
 * Supported providers (set STORAGE_PROVIDER env var):
 *   local   — stores files on local disk (development / single-server)
 *   s3      — AWS S3
 *   r2      — Cloudflare R2 (S3-compatible)
 *
 * The returned `url` is always a public HTTPS URL suitable for storing
 * in the database and returning to clients.
 */

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { logger } from "../lib/logger.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UploadedFile {
  /** Original file name */
  originalName: string;
  /** MIME type */
  mimeType: string;
  /** File size in bytes */
  size: number;
  /** Public URL to access the file */
  url: string;
  /** Storage key / path (used for deletion) */
  key: string;
}

export interface StorageProvider {
  upload(file: Buffer, originalName: string, mimeType: string): Promise<UploadedFile>;
  delete(key: string): Promise<void>;
}

// ── Validation helpers ────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const MAX_SIZE = parseInt(process.env["UPLOAD_MAX_SIZE_BYTES"] ?? "10485760", 10); // 10 MB

export function validateUpload(buffer: Buffer, mimeType: string): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return { valid: false, error: `File type '${mimeType}' is not allowed. Allowed: JPEG, PNG, WebP, GIF, SVG.` };
  }
  if (buffer.length > MAX_SIZE) {
    const mb = (buffer.length / 1024 / 1024).toFixed(1);
    const maxMb = (MAX_SIZE / 1024 / 1024).toFixed(0);
    return { valid: false, error: `File size ${mb}MB exceeds maximum allowed ${maxMb}MB.` };
  }
  return { valid: true };
}

function generateKey(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase() || ".jpg";
  const hash = crypto.randomBytes(16).toString("hex");
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `uploads/${date}/${hash}${ext}`;
}

// ── Local provider ────────────────────────────────────────────────────────────

class LocalStorageProvider implements StorageProvider {
  private readonly dir: string;
  private readonly publicUrl: string;

  constructor() {
    this.dir = path.resolve(process.env["STORAGE_LOCAL_DIR"] ?? "./uploads");
    this.publicUrl = (process.env["STORAGE_PUBLIC_URL"] ?? "http://localhost:8080/uploads").replace(/\/$/, "");
  }

  async upload(buffer: Buffer, originalName: string, mimeType: string): Promise<UploadedFile> {
    const key = generateKey(originalName);
    const fullPath = path.join(this.dir, key.replace("uploads/", ""));
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, buffer);
    const url = `${this.publicUrl}/${key.replace("uploads/", "")}`;
    logger.info({ key, url, size: buffer.length }, "[storage:local] File uploaded");
    return { originalName, mimeType, size: buffer.length, url, key };
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.join(this.dir, key.replace("uploads/", ""));
    try {
      await fs.unlink(fullPath);
      logger.info({ key }, "[storage:local] File deleted");
    } catch (err) {
      logger.warn({ err, key }, "[storage:local] File not found for deletion");
    }
  }
}

// ── S3 / R2 provider ──────────────────────────────────────────────────────────

class S3StorageProvider implements StorageProvider {
  private client: unknown;
  private bucket: string;
  private publicUrl: string;

  constructor(private readonly isR2: boolean) {
    this.bucket = isR2
      ? (process.env["R2_BUCKET"] ?? "tabaq-uploads")
      : (process.env["AWS_S3_BUCKET"] ?? "tabaq-uploads");
    this.publicUrl = isR2
      ? (process.env["R2_PUBLIC_URL"] ?? "").replace(/\/$/, "")
      : `https://${this.bucket}.s3.${process.env["AWS_REGION"] ?? "me-south-1"}.amazonaws.com`;
  }

  private async getClient() {
    if (this.client) return this.client;

    // Dynamic import so S3 SDK is not loaded unless needed
    const { S3Client } = await import("@aws-sdk/client-s3");

    if (this.isR2) {
      const accountId = process.env["R2_ACCOUNT_ID"];
      if (!accountId) throw new Error("R2_ACCOUNT_ID is required when STORAGE_PROVIDER=r2");
      this.client = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env["R2_ACCESS_KEY_ID"] ?? "",
          secretAccessKey: process.env["R2_SECRET_ACCESS_KEY"] ?? "",
        },
      });
    } else {
      this.client = new S3Client({
        region: process.env["AWS_REGION"] ?? "me-south-1",
        credentials: {
          accessKeyId: process.env["AWS_ACCESS_KEY_ID"] ?? "",
          secretAccessKey: process.env["AWS_SECRET_ACCESS_KEY"] ?? "",
        },
      });
    }
    return this.client;
  }

  async upload(buffer: Buffer, originalName: string, mimeType: string): Promise<UploadedFile> {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.getClient() as InstanceType<typeof import("@aws-sdk/client-s3").S3Client>;
    const key = generateKey(originalName);

    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );

    const url = `${this.publicUrl}/${key}`;
    const provider = this.isR2 ? "r2" : "s3";
    logger.info({ key, url, size: buffer.length }, `[storage:${provider}] File uploaded`);
    return { originalName, mimeType, size: buffer.length, url, key };
  }

  async delete(key: string): Promise<void> {
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.getClient() as InstanceType<typeof import("@aws-sdk/client-s3").S3Client>;
    await client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    const provider = this.isR2 ? "r2" : "s3";
    logger.info({ key }, `[storage:${provider}] File deleted`);
  }
}

// ── Provider factory ──────────────────────────────────────────────────────────

let _storageProvider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (_storageProvider) return _storageProvider;
  const provider = (process.env["STORAGE_PROVIDER"] ?? "local").toLowerCase();
  switch (provider) {
    case "s3":
      _storageProvider = new S3StorageProvider(false);
      break;
    case "r2":
      _storageProvider = new S3StorageProvider(true);
      break;
    case "local":
    default:
      _storageProvider = new LocalStorageProvider();
  }
  logger.info({ provider }, "[storage] Storage provider initialized");
  return _storageProvider;
}
