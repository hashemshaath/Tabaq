DO $$ BEGIN
  CREATE TYPE "public"."provider_account_status" AS ENUM('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'SUSPENDED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "provider_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_uid" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"preferred_contact" text DEFAULT 'email' NOT NULL,
	"password_hash" text,
	"status" "provider_account_status" DEFAULT 'DRAFT' NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"phone_verified" boolean DEFAULT false NOT NULL,
	"two_fa_enabled" boolean DEFAULT false NOT NULL,
	"business_name" text,
	"business_name_ar" text,
	"business_type" text,
	"cr_number" text,
	"vat_number" text,
	"business_address" text,
	"city" text,
	"country" text,
	"website_url" text,
	"contact_name" text,
	"rejection_reason" text,
	"suspension_reason" text,
	"registration_step" integer DEFAULT 1 NOT NULL,
	"failed_login_count" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp,
	"last_login_at" timestamp,
	"last_login_ip" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "provider_accounts_provider_uid_unique" UNIQUE("provider_uid"),
	CONSTRAINT "provider_accounts_email_unique" UNIQUE("email"),
	CONSTRAINT "provider_accounts_phone_unique" UNIQUE("phone")
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "provider_account_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_uid" text NOT NULL,
	"cr_document_url" text,
	"vat_document_url" text,
	"owner_id_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "provider_account_documents" ADD CONSTRAINT "provider_account_documents_provider_uid_fkey" FOREIGN KEY ("provider_uid") REFERENCES "public"."provider_accounts"("provider_uid") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "provider_staff" ADD CONSTRAINT "provider_staff_provider_uid_provider_accounts_fk" FOREIGN KEY ("provider_uid") REFERENCES "public"."provider_accounts"("provider_uid") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
