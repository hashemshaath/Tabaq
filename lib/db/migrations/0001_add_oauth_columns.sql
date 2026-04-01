-- Migration: Add OAuth provider columns to users table
-- Adds Google and Apple OAuth fields for mobile-first token verification flow

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "google_id" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "apple_id" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profile_picture_url" varchar(500);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "auth_providers" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_google_id_unique" UNIQUE("google_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_apple_id_unique" UNIQUE("apple_id");
