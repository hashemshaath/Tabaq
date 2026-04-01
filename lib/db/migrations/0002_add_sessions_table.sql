-- Migration: Create sessions table and add user_uid column
-- Implements JWT refresh token storage with rotation and theft detection

CREATE TABLE IF NOT EXISTS "sessions" (
  "ses_uid" varchar(64) PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "user_uid" text REFERENCES "users"("user_uid") ON DELETE CASCADE,
  "user_type" text NOT NULL DEFAULT 'USER',
  "refresh_token_hash" text NOT NULL UNIQUE,
  "prev_refresh_token_hash" text,
  "device_fingerprint" text,
  "device_name" text,
  "device_os" text,
  "app_version" text,
  "ip_address" text,
  "location_country" text,
  "location_city" text,
  "is_revoked" boolean NOT NULL DEFAULT false,
  "flagged_suspicious" boolean NOT NULL DEFAULT false,
  "last_used_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "expires_at" timestamp NOT NULL
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions"("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_refresh_token_hash_idx" ON "sessions"("refresh_token_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_is_revoked_idx" ON "sessions"("is_revoked");--> statement-breakpoint

-- Add user_uid column if table already exists without it (idempotent)
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "user_uid" text REFERENCES "users"("user_uid") ON DELETE CASCADE;
