/**
 * POST /api/upload
 *
 * Authenticated file upload endpoint.
 * Accepts multipart/form-data with a single file field named "file".
 * Returns the public URL of the uploaded file.
 *
 * Body:
 *   file       — The file to upload (multipart/form-data)
 *   context    — Optional context tag (e.g. "restaurant_cover", "dish_image")
 *
 * Response 200:
 *   { url: string; key: string; size: number; mimeType: string }
 *
 * Error responses:
 *   400 — missing file / invalid type / too large
 *   401 — not authenticated
 *   500 — storage error
 */

import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/requireAuth.js";
import { getStorageProvider, validateUpload } from "../services/storageService.js";

const router = Router();

const MAX_SIZE = parseInt(process.env["UPLOAD_MAX_SIZE_BYTES"] ?? "10485760", 10); // 10 MB

// Use memory storage so we can validate before persisting
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE, files: 1 },
  fileFilter(_req, file, cb) {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type '${file.mimetype}' is not allowed`));
    }
  },
});

router.post(
  "/upload",
  requireAuth,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "bad_request", message: "No file provided. Send a multipart form with field name 'file'." });
        return;
      }

      const validation = validateUpload(req.file.buffer, req.file.mimetype);
      if (!validation.valid) {
        res.status(400).json({ error: "invalid_file", message: validation.error });
        return;
      }

      const storage = getStorageProvider();
      const uploaded = await storage.upload(req.file.buffer, req.file.originalname, req.file.mimetype);

      req.log.info(
        { userId: req.auth?.userId, key: uploaded.key, size: uploaded.size },
        "File uploaded successfully",
      );

      res.json({
        url: uploaded.url,
        key: uploaded.key,
        size: uploaded.size,
        mimeType: uploaded.mimeType,
        originalName: uploaded.originalName,
      });
    } catch (err) {
      req.log.error({ err }, "Upload failed");
      res.status(500).json({ error: "upload_failed", message: "Failed to upload file. Please try again." });
    }
  },
);

// DELETE /api/upload — remove a previously uploaded file (admin only), key passed as query param
router.delete("/upload", requireAuth, async (req, res) => {
  try {
    if (!req.auth?.isAdmin) {
      res.status(403).json({ error: "forbidden", message: "Admin access required to delete files" });
      return;
    }
    const key = req.query["key"];
    if (!key || typeof key !== "string") {
      res.status(400).json({ error: "bad_request", message: "File key query param is required" });
      return;
    }
    const storage = getStorageProvider();
    await storage.delete(key);
    res.json({ success: true, message: "File deleted successfully" });
  } catch (err) {
    req.log.error({ err }, "Delete upload failed");
    res.status(500).json({ error: "delete_failed", message: "Failed to delete file" });
  }
});

export default router;
