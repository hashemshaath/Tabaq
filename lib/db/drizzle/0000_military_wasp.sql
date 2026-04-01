CREATE TYPE "public"."price_tier" AS ENUM('budget', 'mid', 'upscale', 'fine_dining');--> statement-breakpoint
CREATE TYPE "public"."menu_type" AS ENUM('food', 'drinks', 'desserts', 'set_menu', 'buffet', 'catering', 'home_kitchen');--> statement-breakpoint
CREATE TYPE "public"."story_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."table_type" AS ENUM('indoor', 'outdoor', 'vip', 'window_seat');--> statement-breakpoint
CREATE TYPE "public"."waitlist_status" AS ENUM('waiting', 'notified', 'confirmed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'submitted', 'under_review', 'approved', 'live', 'paused', 'ended', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."campaign_type" AS ENUM('spend_credit', 'item_voucher', 'discount_deal');--> statement-breakpoint
CREATE TYPE "public"."offer_approval_status" AS ENUM('pending', 'approved', 'rejected', 'revision_requested');--> statement-breakpoint
CREATE TYPE "public"."offer_payment_model" AS ENUM('full_collection', 'partial_collection', 'direct_payment');--> statement-breakpoint
CREATE TYPE "public"."promo_code_funding" AS ENUM('tabaq', 'merchant', 'partner', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."promo_code_type" AS ENUM('percent', 'fixed', 'free_item');--> statement-breakpoint
CREATE TYPE "public"."redemption_method" AS ENUM('on_site', 'on_demand', 'online');--> statement-breakpoint
CREATE TYPE "public"."voucher_status" AS ENUM('issued', 'sold', 'active', 'reserved', 'redeemed', 'partially_redeemed', 'refunded', 'expired', 'voided', 'used');--> statement-breakpoint
CREATE TYPE "public"."points_action" AS ENUM('review_written', 'booking_made', 'voucher_purchased', 'review_liked', 'email_verified', 'referral_signup', 'referral_converted', 'profile_completed', 'admin_grant', 'redemption', 'order_placed', 'order_completed', 'order_returned');--> statement-breakpoint
CREATE TYPE "public"."points_status" AS ENUM('pending', 'redeemable', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."referral_status" AS ENUM('pending', 'signed_up', 'converted', 'expired');--> statement-breakpoint
CREATE TYPE "public"."contract_status" AS ENUM('draft', 'active', 'suspended', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."customer_invoice_source" AS ENUM('order', 'booking', 'voucher_purchase', 'experience_booking', 'membership', 'return');--> statement-breakpoint
CREATE TYPE "public"."customer_invoice_status" AS ENUM('paid', 'refunded', 'void', 'credit');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'sent', 'paid', 'overdue', 'disputed', 'void');--> statement-breakpoint
CREATE TYPE "public"."payment_model" AS ENUM('full_collection', 'partial_collection', 'direct_payment');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'completed', 'failed', 'refunded', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('voucher_sale', 'voucher_refund', 'commission_charge', 'settlement_payout', 'adjustment', 'platform_fee', 'order');--> statement-breakpoint
CREATE TYPE "public"."commission_status" AS ENUM('pending', 'settled', 'waived');--> statement-breakpoint
CREATE TYPE "public"."experience_booking_status" AS ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."experience_category" AS ENUM('heritage', 'street_food', 'fine_dining', 'live_show', 'cultural');--> statement-breakpoint
CREATE TYPE "public"."experience_payment_status" AS ENUM('pending', 'completed', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."experience_payment_type" AS ENUM('deposit', 'full');--> statement-breakpoint
CREATE TYPE "public"."experience_status" AS ENUM('draft', 'pending_approval', 'active', 'suspended', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."gift_card_design" AS ENUM('classic', 'birthday', 'anniversary', 'celebration', 'ramadan');--> statement-breakpoint
CREATE TYPE "public"."gift_status" AS ENUM('sent', 'redeemed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."provider_application_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."blog_post_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."order_mode" AS ENUM('delivery', 'pickup', 'dine_in');--> statement-breakpoint
CREATE TYPE "public"."order_payment" AS ENUM('card', 'apple_pay', 'stc_pay', 'cash', 'points', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('placed', 'confirmed', 'preparing', 'out_for_delivery', 'ready_for_pickup', 'delivered', 'cancelled', 'completed', 'disputed', 'return_requested', 'returned');--> statement-breakpoint
CREATE TYPE "public"."dispute_status" AS ENUM('open', 'under_review', 'resolved_refund', 'resolved_no_refund', 'escalated');--> statement-breakpoint
CREATE TYPE "public"."membership_billing" AS ENUM('monthly', 'annual');--> statement-breakpoint
CREATE TYPE "public"."membership_plan" AS ENUM('gourmet', 'elite');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('pending', 'active', 'suspended', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."provider_staff_role" AS ENUM('OWNER', 'MANAGER', 'STAFF');--> statement-breakpoint
CREATE TYPE "public"."provider_staff_status" AS ENUM('INVITED', 'ACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."provider_status" AS ENUM('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'SUSPENDED');--> statement-breakpoint
CREATE TABLE "cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"country_id" integer NOT NULL,
	"latitude" double precision,
	"longitude" double precision
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"code" text NOT NULL,
	"flag" text,
	CONSTRAINT "countries_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"icon" text,
	"slug" text NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "occasions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"icon" text,
	"slug" text NOT NULL,
	CONSTRAINT "occasions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "email_verification_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "otp_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" text,
	"email" text,
	"code" text NOT NULL,
	"otp_hash" text,
	"expires_at" timestamp NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token_hash" text NOT NULL,
	"device_info" text,
	"ip_address" text,
	"last_used_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "user_blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"blocker_id" integer NOT NULL,
	"blocked_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_devices" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"device_fingerprint" text NOT NULL,
	"device_info" text,
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_follows" (
	"id" serial PRIMARY KEY NOT NULL,
	"follower_id" integer NOT NULL,
	"following_id" integer NOT NULL,
	"status" text DEFAULT 'accepted' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_interests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"interest_type" text NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_mutes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_notification_prefs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"notif_type" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"channels" text DEFAULT 'in_app' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_uid" text,
	"ref_code" text,
	"phone" text,
	"email" text,
	"username" text,
	"display_name" text,
	"password_hash" text,
	"name_en" text,
	"name_ar" text,
	"avatar_url" text,
	"bio" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"credibility_score" numeric(5, 2) DEFAULT '0' NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"level_title" text DEFAULT 'Food Explorer' NOT NULL,
	"referral_code" text,
	"preferred_language" text DEFAULT 'en' NOT NULL,
	"city_id" integer,
	"is_admin" boolean DEFAULT false NOT NULL,
	"is_owner" boolean DEFAULT false NOT NULL,
	"account_type" text DEFAULT 'basic' NOT NULL,
	"gold_plan" text,
	"gold_billing" text,
	"gold_since" timestamp,
	"cover_photo_url" text,
	"location" text,
	"instagram_url" text,
	"x_url" text,
	"tiktok_url" text,
	"snapchat_url" text,
	"website_url" text,
	"privacy_settings" jsonb DEFAULT '{"profileVisibility":"public","visitsVisibility":"public","reviewsVisibility":"public","favoritesVisibility":"public","plansVisibility":"public","showInLeaderboard":true,"showInSuggested":true}'::jsonb,
	"notification_prefs" jsonb DEFAULT '{"newFollower":true,"reviewLiked":true,"reviewComment":true,"bookingConfirmed":true,"bookingReminder":true,"newOffer":false,"pointsEarned":true,"weeklyDigest":true}'::jsonb,
	"failed_login_count" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp,
	"last_login_at" timestamp,
	"last_login_ip" text,
	"passcode_hash" varchar(100),
	"passcode_set_at" timestamp,
	"passcode_failed_attempts" smallint DEFAULT 0 NOT NULL,
	"passcode_locked_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_user_uid_unique" UNIQUE("user_uid"),
	CONSTRAINT "users_ref_code_unique" UNIQUE("ref_code"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "user_addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"label" text DEFAULT 'Home' NOT NULL,
	"label_ar" text DEFAULT 'البيت',
	"is_default" boolean DEFAULT false NOT NULL,
	"address_line1" text NOT NULL,
	"address_line2" text,
	"district" text,
	"city" text NOT NULL,
	"region" text,
	"postal_code" text,
	"country_code" text DEFAULT 'SA' NOT NULL,
	"national_address" text,
	"building_number" text,
	"additional_number" text,
	"unit_number" text,
	"contact_name" text,
	"contact_phone" text,
	"latitude" double precision,
	"longitude" double precision,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opening_hours" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_id" integer NOT NULL,
	"day_of_week" integer NOT NULL,
	"open_time" text,
	"close_time" text,
	"is_closed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurant_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_id" integer NOT NULL,
	"category_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurant_follows" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"restaurant_id" integer NOT NULL,
	"follow_type" text DEFAULT 'all' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurant_occasions" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_id" integer NOT NULL,
	"occasion_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurants" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref_code" text,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"description_en" text,
	"description_ar" text,
	"slug" text NOT NULL,
	"cover_image_url" text,
	"logo_url" text,
	"price_tier" "price_tier" DEFAULT 'mid' NOT NULL,
	"avg_rating" double precision DEFAULT 0 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"follower_count" integer DEFAULT 0 NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"city_id" integer NOT NULL,
	"neighborhood_id" integer,
	"country_id" integer NOT NULL,
	"address" text,
	"latitude" double precision,
	"longitude" double precision,
	"phone" text,
	"website" text,
	"instagram_handle" text,
	"has_parking" boolean DEFAULT false NOT NULL,
	"has_outdoor_seating" boolean DEFAULT false NOT NULL,
	"has_private_room" boolean DEFAULT false NOT NULL,
	"is_halal" boolean DEFAULT false NOT NULL,
	"owner_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "restaurants_ref_code_unique" UNIQUE("ref_code"),
	CONSTRAINT "restaurants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_saved_restaurants" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"restaurant_id" integer NOT NULL,
	"saved_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dishes" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_id" integer NOT NULL,
	"menu_section_id" integer,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"description_en" text,
	"description_ar" text,
	"price" numeric(10, 2),
	"discount_percentage" numeric(5, 2) DEFAULT '0',
	"currency" text DEFAULT 'SAR' NOT NULL,
	"image_url" text,
	"gallery_images" jsonb DEFAULT '[]'::jsonb,
	"video_url" text,
	"avg_rating" numeric(3, 2) DEFAULT '0' NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"popularity_score" numeric(10, 4) DEFAULT '0' NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"is_halal" boolean DEFAULT false NOT NULL,
	"is_vegetarian" boolean DEFAULT false NOT NULL,
	"is_vegan" boolean DEFAULT false NOT NULL,
	"is_gluten_free" boolean DEFAULT false NOT NULL,
	"is_dairy_free" boolean DEFAULT false NOT NULL,
	"is_nut_free" boolean DEFAULT false NOT NULL,
	"is_healthy" boolean DEFAULT false NOT NULL,
	"is_tabaq_star" boolean DEFAULT false NOT NULL,
	"is_most_ordered" boolean DEFAULT false NOT NULL,
	"is_bestseller" boolean DEFAULT false NOT NULL,
	"is_chef_choice" boolean DEFAULT false NOT NULL,
	"is_new_item" boolean DEFAULT false NOT NULL,
	"allergens" jsonb DEFAULT '[]'::jsonb,
	"spice_level" integer DEFAULT 0,
	"prep_time_minutes" integer,
	"calories" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"menu_id" integer NOT NULL,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"description_en" text,
	"description_ar" text,
	"price_per_person" numeric(10, 2) NOT NULL,
	"min_guests" integer DEFAULT 10 NOT NULL,
	"max_guests" integer,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"image_url" text,
	"included_dishes" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"menu_id" integer NOT NULL,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menus" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_id" integer NOT NULL,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"type" "menu_type" DEFAULT 'food' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurant_stories" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"caption_en" text,
	"caption_ar" text,
	"media_urls" jsonb DEFAULT '[]'::jsonb,
	"media_type" text DEFAULT 'photo' NOT NULL,
	"status" "story_status" DEFAULT 'pending' NOT NULL,
	"admin_note" text,
	"view_count" integer DEFAULT 0 NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"restaurant_id" integer NOT NULL,
	"date" text NOT NULL,
	"time" text NOT NULL,
	"party_size" integer NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"table_type" "table_type" DEFAULT 'indoor',
	"occasion_id" integer,
	"special_requests" text,
	"pre_order_items" jsonb DEFAULT '[]'::jsonb,
	"reference_code" text NOT NULL,
	"invoice_ref" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_reference_code_unique" UNIQUE("reference_code")
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"restaurant_id" integer NOT NULL,
	"date" text NOT NULL,
	"time" text NOT NULL,
	"party_size" integer NOT NULL,
	"table_type" "table_type" DEFAULT 'indoor',
	"status" "waitlist_status" DEFAULT 'waiting' NOT NULL,
	"position" integer NOT NULL,
	"notified_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"type" "campaign_type" NOT NULL,
	"original_price" numeric(10, 2) NOT NULL,
	"deal_price" numeric(10, 2) NOT NULL,
	"discount_percent" numeric(5, 2) NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"initial_cap" integer,
	"monthly_cap" integer,
	"sold_count" integer DEFAULT 0 NOT NULL,
	"redeemed_count" integer DEFAULT 0 NOT NULL,
	"refunded_count" integer DEFAULT 0 NOT NULL,
	"monthly_sold_count" integer DEFAULT 0 NOT NULL,
	"monthly_cap_reset_at" timestamp,
	"validity_days" integer DEFAULT 60 NOT NULL,
	"redemption_validity_days" integer,
	"commission_percent" numeric(5, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref_code" text,
	"restaurant_id" integer NOT NULL,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"type" "campaign_type" NOT NULL,
	"title_en" text NOT NULL,
	"title_ar" text NOT NULL,
	"description_en" text,
	"description_ar" text,
	"highlights_en" jsonb DEFAULT '[]'::jsonb,
	"highlights_ar" jsonb DEFAULT '[]'::jsonb,
	"image_urls" jsonb DEFAULT '[]'::jsonb,
	"cover_image_index" integer DEFAULT 0,
	"fine_print" text,
	"fine_print_template_ids" jsonb DEFAULT '[]'::jsonb,
	"redemption_method" "redemption_method" DEFAULT 'on_site' NOT NULL,
	"redemption_instructions_en" text,
	"redemption_instructions_ar" text,
	"requires_reservation" boolean DEFAULT false NOT NULL,
	"booking_phone" text,
	"booking_whatsapp" text,
	"booking_link" text,
	"online_redemption_url" text,
	"valid_from" timestamp,
	"valid_until" timestamp,
	"max_per_user" integer,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"business_description_en" text,
	"business_description_ar" text,
	"website_url" text,
	"proof_of_pricing_urls" jsonb DEFAULT '[]'::jsonb,
	"proof_of_pricing_notes" text,
	"admin_notes" text,
	"rejection_reasons" jsonb DEFAULT '[]'::jsonb,
	"approved_by_id" integer,
	"approved_at" timestamp,
	"commission_override_percent" numeric(5, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "campaigns_ref_code_unique" UNIQUE("ref_code")
);
--> statement-breakpoint
CREATE TABLE "fine_print_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"text_en" text NOT NULL,
	"text_ar" text NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref_code" text,
	"restaurant_id" integer NOT NULL,
	"title_en" text NOT NULL,
	"title_ar" text NOT NULL,
	"description_en" text,
	"description_ar" text,
	"image_url" text,
	"discount_percent" numeric(5, 2),
	"original_price" numeric(10, 2),
	"discounted_price" numeric(10, 2),
	"currency" text DEFAULT 'SAR' NOT NULL,
	"valid_from" timestamp NOT NULL,
	"valid_until" timestamp NOT NULL,
	"total_capacity" integer,
	"remaining_capacity" integer,
	"is_active" boolean DEFAULT false NOT NULL,
	"approval_status" "offer_approval_status" DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"approved_by_id" integer,
	"approved_at" timestamp,
	"commission_override_percent" numeric(5, 2),
	"payment_model" "offer_payment_model",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "offers_ref_code_unique" UNIQUE("ref_code")
);
--> statement-breakpoint
CREATE TABLE "promo_code_redemptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"promo_code_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"voucher_id" integer,
	"discount_amount" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promo_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"type" "promo_code_type" NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"start_at" timestamp NOT NULL,
	"end_at" timestamp NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"max_redemptions" integer,
	"max_per_user" integer DEFAULT 1 NOT NULL,
	"max_total_discount" numeric(12, 2),
	"used_count" integer DEFAULT 0 NOT NULL,
	"total_discount_given" numeric(12, 2) DEFAULT '0' NOT NULL,
	"min_order_value" numeric(10, 2),
	"new_users_only" boolean DEFAULT false NOT NULL,
	"first_order_only" boolean DEFAULT false NOT NULL,
	"eligible_restaurant_ids" jsonb DEFAULT '[]'::jsonb,
	"eligible_category_ids" jsonb DEFAULT '[]'::jsonb,
	"allow_stack_with_voucher" boolean DEFAULT false NOT NULL,
	"allow_stack_with_other_promo" boolean DEFAULT false NOT NULL,
	"funded_by" "promo_code_funding" DEFAULT 'tabaq' NOT NULL,
	"merchant_funding_split" numeric(5, 2),
	"tabaq_funding_split" numeric(5, 2),
	"distribution_channel" text DEFAULT 'public',
	"created_by_id" integer,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "promo_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "redemptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref_code" text,
	"voucher_id" integer NOT NULL,
	"restaurant_id" integer NOT NULL,
	"staff_user_id" integer,
	"method" "redemption_method" DEFAULT 'on_site' NOT NULL,
	"amount_redeemed" numeric(10, 2),
	"balance_after" numeric(10, 2),
	"notes" text,
	"staff_branch" text,
	"ip_address" text,
	"device_info" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "redemptions_ref_code_unique" UNIQUE("ref_code")
);
--> statement-breakpoint
CREATE TABLE "vouchers" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref_code" text,
	"code" text NOT NULL,
	"campaign_id" integer,
	"campaign_option_id" integer,
	"offer_id" integer,
	"user_id" integer NOT NULL,
	"restaurant_id" integer NOT NULL,
	"face_value" numeric(10, 2),
	"purchase_price" numeric(10, 2),
	"value" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"redeemed_amount" numeric(10, 2) DEFAULT '0',
	"remaining_balance" numeric(10, 2),
	"status" "voucher_status" DEFAULT 'active' NOT NULL,
	"valid_from" timestamp,
	"valid_until" timestamp NOT NULL,
	"redemption_period_days" integer,
	"secure_token" text,
	"gift_message" text,
	"is_gift" boolean DEFAULT false NOT NULL,
	"gifter_user_id" integer,
	"recipient_user_id" integer,
	"gift_recipient_phone" text,
	"gift_recipient_email" text,
	"gift_delivery_status" text DEFAULT 'pending',
	"gift_scheduled_at" timestamp,
	"gift_theme" text,
	"redeemed_at" timestamp,
	"promo_code_id" integer,
	"promo_discount_amount" numeric(10, 2),
	"refund_requested_at" timestamp,
	"refund_reason" text,
	"refunded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vouchers_ref_code_unique" UNIQUE("ref_code"),
	CONSTRAINT "vouchers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "review_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"review_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"review_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"points_awarded" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"review_id" integer NOT NULL,
	"photo_url" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"restaurant_id" integer,
	"dish_id" integer,
	"rating_overall" numeric(3, 2) NOT NULL,
	"rating_food" numeric(3, 2),
	"rating_service" numeric(3, 2),
	"rating_ambiance" numeric(3, 2),
	"rating_value" numeric(3, 2),
	"text_en" text,
	"text_ar" text,
	"like_count" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"visit_date" text,
	"is_expert_review" boolean DEFAULT false NOT NULL,
	"rating_presentation" numeric(3, 2),
	"rating_ingredients" numeric(3, 2),
	"rating_technique" numeric(3, 2),
	"rating_creativity" numeric(3, 2),
	"rating_portion_size" numeric(3, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_id" integer NOT NULL,
	"title_en" text NOT NULL,
	"title_ar" text NOT NULL,
	"description_en" text,
	"description_ar" text,
	"image_url" text,
	"event_date" timestamp NOT NULL,
	"end_date" timestamp,
	"ticket_price" numeric(10, 2),
	"currency" text DEFAULT 'SAR' NOT NULL,
	"total_capacity" integer,
	"remaining_capacity" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_id" integer NOT NULL,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"description_en" text,
	"description_ar" text,
	"capacity" integer DEFAULT 0 NOT NULL,
	"min_party_size" integer DEFAULT 1,
	"max_party_size" integer,
	"is_private" boolean DEFAULT false,
	"image_url" text,
	"price_per_hour" numeric(10, 2),
	"currency" text DEFAULT 'SAR',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dish_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"dish_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "dish_tags_dish_id_tag_id_unique" UNIQUE("dish_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "restaurant_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "restaurant_tags_restaurant_id_tag_id_unique" UNIQUE("restaurant_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"slug" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "tags_name_en_unique" UNIQUE("name_en"),
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "points_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"action" "points_action" NOT NULL,
	"points" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"description" text,
	"ref_id" integer,
	"ref_type" text,
	"status" "points_status" DEFAULT 'redeemable' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_conversions" (
	"id" serial PRIMARY KEY NOT NULL,
	"referrer_id" integer NOT NULL,
	"referred_id" integer,
	"referral_code" text NOT NULL,
	"status" "referral_status" DEFAULT 'pending' NOT NULL,
	"points_awarded" boolean DEFAULT false NOT NULL,
	"referrer_points_earned" integer DEFAULT 0 NOT NULL,
	"referred_points_earned" integer DEFAULT 0 NOT NULL,
	"converted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"actor_uid" text,
	"actor_id" integer,
	"ip_address" text,
	"meta" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cron_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_name" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"records_processed" integer DEFAULT 0,
	"error_message" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp,
	"duration_ms" integer
);
--> statement-breakpoint
CREATE TABLE "partner_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref_code" text,
	"business_type" text,
	"name_en" text NOT NULL,
	"name_ar" text,
	"city" text,
	"address" text,
	"seating_capacity" integer,
	"cuisines" text[],
	"description" text,
	"phone" text,
	"email" text,
	"website" text,
	"owner_name" text,
	"owner_email" text,
	"cr_number" text,
	"plan" text,
	"extra_data" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" integer,
	"review_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "partner_applications_ref_code_unique" UNIQUE("ref_code")
);
--> statement-breakpoint
CREATE TABLE "platform_modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"module_id" text NOT NULL,
	"name_en" text NOT NULL,
	"description" text,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"version" text DEFAULT '1.0.0' NOT NULL,
	"dependencies" text DEFAULT '[]' NOT NULL,
	"settings" text DEFAULT '{}' NOT NULL,
	"updated_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "platform_modules_module_id_unique" UNIQUE("module_id")
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"is_secret" boolean DEFAULT false NOT NULL,
	"updated_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "platform_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "admin_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref_code" text NOT NULL,
	"restaurant_id" integer NOT NULL,
	"admin_user_id" integer,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"type" text DEFAULT 'general' NOT NULL,
	"related_offer_id" integer,
	"related_contract_id" integer,
	"related_invoice_id" integer,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_messages_ref_code_unique" UNIQUE("ref_code")
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref_code" text NOT NULL,
	"restaurant_id" integer NOT NULL,
	"status" "contract_status" DEFAULT 'draft' NOT NULL,
	"payment_model" "payment_model" DEFAULT 'full_collection' NOT NULL,
	"commission_percent" numeric(5, 2) DEFAULT '15.00' NOT NULL,
	"partial_collection_percent" numeric(5, 2),
	"settlement_days" integer DEFAULT 7 NOT NULL,
	"valid_from" timestamp,
	"valid_until" timestamp,
	"notes" text,
	"internal_notes" text,
	"approved_by_id" integer,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "contracts_ref_code_unique" UNIQUE("ref_code")
);
--> statement-breakpoint
CREATE TABLE "customer_invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref_code" text NOT NULL,
	"user_id" integer,
	"restaurant_id" integer,
	"source" "customer_invoice_source" NOT NULL,
	"order_id" integer,
	"booking_id" integer,
	"line_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"discount_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"delivery_fee" numeric(12, 2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(12, 2) DEFAULT '0',
	"tax_rate" numeric(6, 4) DEFAULT '0',
	"tax_name" text DEFAULT 'VAT',
	"total" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"payment_method" text,
	"promo_code" text,
	"points_used" integer DEFAULT 0,
	"points_monetary_value" numeric(12, 2) DEFAULT '0',
	"remaining_amount_charged" numeric(12, 2) DEFAULT '0',
	"gateway_response" jsonb,
	"status" "customer_invoice_status" DEFAULT 'paid' NOT NULL,
	"paid_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customer_invoices_ref_code_unique" UNIQUE("ref_code")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref_code" text NOT NULL,
	"restaurant_id" integer NOT NULL,
	"contract_id" integer,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"total_gross_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_commission_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_net_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"total_transactions" integer DEFAULT 0 NOT NULL,
	"due_date" timestamp,
	"paid_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_ref_code_unique" UNIQUE("ref_code")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref_code" text NOT NULL,
	"type" "transaction_type" NOT NULL,
	"status" "transaction_status" DEFAULT 'pending' NOT NULL,
	"gross_amount" numeric(12, 2) NOT NULL,
	"commission_percent" numeric(5, 2),
	"commission_amount" numeric(12, 2),
	"net_amount" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"restaurant_id" integer,
	"user_id" integer,
	"contract_id" integer,
	"voucher_id" integer,
	"offer_id" integer,
	"invoice_id" integer,
	"payment_model" "payment_model",
	"settlement_due_date" timestamp,
	"settled_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_ref_code_unique" UNIQUE("ref_code")
);
--> statement-breakpoint
CREATE TABLE "experience_booking_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"type" "experience_payment_type" NOT NULL,
	"status" "experience_payment_status" DEFAULT 'pending' NOT NULL,
	"payment_ref" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experience_bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference_code" text,
	"ref_code" text,
	"user_id" integer,
	"experience_id" integer NOT NULL,
	"provider_id" integer,
	"slot_id" integer,
	"guest_count" integer DEFAULT 1 NOT NULL,
	"guest_name" text,
	"guest_name_en" text,
	"guest_phone" text,
	"guest_email" text,
	"scheduled_date" text,
	"scheduled_time" text,
	"status" "experience_booking_status" DEFAULT 'pending' NOT NULL,
	"total_amount" numeric(10, 2),
	"deposit_amount" numeric(10, 2),
	"commission_amount" numeric(10, 2),
	"deposit_paid" boolean DEFAULT false NOT NULL,
	"full_paid" boolean DEFAULT false NOT NULL,
	"is_deposit_paid" boolean DEFAULT false NOT NULL,
	"is_full_paid" boolean DEFAULT false NOT NULL,
	"special_requests" text,
	"confirmed_at" timestamp,
	"cancel_reason" text,
	"cancelled_by" integer,
	"cancelled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "experience_bookings_reference_code_unique" UNIQUE("reference_code"),
	CONSTRAINT "experience_bookings_ref_code_unique" UNIQUE("ref_code")
);
--> statement-breakpoint
CREATE TABLE "experience_commissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"rate" numeric(5, 2) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" "commission_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "experience_commissions_booking_id_unique" UNIQUE("booking_id")
);
--> statement-breakpoint
CREATE TABLE "experience_gifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_user_id" integer NOT NULL,
	"recipient_email" text NOT NULL,
	"recipient_name" text NOT NULL,
	"experience_id" integer NOT NULL,
	"personal_message" text,
	"gift_card_design" "gift_card_design" DEFAULT 'classic' NOT NULL,
	"redeem_code" text NOT NULL,
	"qr_code_url" text,
	"status" "gift_status" DEFAULT 'sent' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"redeemed_at" timestamp,
	"redeemed_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "experience_gifts_redeem_code_unique" UNIQUE("redeem_code")
);
--> statement-breakpoint
CREATE TABLE "experience_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"experience_id" integer NOT NULL,
	"url" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experience_providers" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref_code" text,
	"user_id" integer,
	"business_name_en" text NOT NULL,
	"business_name_ar" text,
	"business_type" text,
	"contact_name" text,
	"contact_email" text NOT NULL,
	"contact_phone" text,
	"description" text,
	"description_en" text,
	"description_ar" text,
	"category_type" text,
	"city" text,
	"website" text,
	"instagram_handle" text,
	"logo_url" text,
	"cover_url" text,
	"cr_number" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_note" text,
	"reviewed_by" integer,
	"review_notes" text,
	"reviewed_at" timestamp,
	"extra_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "experience_providers_ref_code_unique" UNIQUE("ref_code")
);
--> statement-breakpoint
CREATE TABLE "experience_review_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"review_id" integer NOT NULL,
	"photo_url" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experience_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"experience_id" integer NOT NULL,
	"booking_id" integer,
	"rating" numeric(3, 2),
	"rating_food" numeric(3, 2),
	"rating_hospitality" numeric(3, 2),
	"rating_ambiance" numeric(3, 2),
	"rating_value" numeric(3, 2),
	"rating_overall" numeric(3, 2),
	"text_en" text,
	"text_ar" text,
	"provider_response_en" text,
	"provider_response_ar" text,
	"responded_at" timestamp,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experience_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"module_enabled" boolean DEFAULT true NOT NULL,
	"default_commission_percent" numeric(5, 2) DEFAULT '15',
	"default_deposit_percent" numeric(5, 2) DEFAULT '100',
	"refund_policy_en" text,
	"refund_policy_ar" text,
	"updated_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experience_slots" (
	"id" serial PRIMARY KEY NOT NULL,
	"experience_id" integer NOT NULL,
	"date" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"capacity" integer,
	"remaining_capacity" integer,
	"capacity_override" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurring_day" integer,
	"is_cancelled" boolean DEFAULT false NOT NULL,
	"booked_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experiences" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref_code" text,
	"slug" text,
	"title_en" text NOT NULL,
	"title_ar" text,
	"description_en" text,
	"description_ar" text,
	"category" text,
	"host_user_id" integer,
	"provider_id" integer,
	"highlights" text[],
	"tags" text[],
	"latitude" double precision,
	"longitude" double precision,
	"address" text,
	"city" text,
	"city_id" integer,
	"cover_image_url" text,
	"duration_minutes" integer,
	"price_per_person" numeric(10, 2),
	"deposit_amount" numeric(10, 2),
	"deposit_percent" numeric(5, 2) DEFAULT '100',
	"commission_percent" numeric(5, 2),
	"currency" text DEFAULT 'SAR' NOT NULL,
	"capacity" integer,
	"max_guests" integer,
	"min_guests" integer DEFAULT 1,
	"menu_details_en" text,
	"menu_details_ar" text,
	"rules_en" text,
	"rules_ar" text,
	"primary_image_url" text,
	"gallery_urls" text[],
	"avg_rating" double precision DEFAULT 0 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"total_bookings" integer DEFAULT 0 NOT NULL,
	"total_reviews" integer DEFAULT 0 NOT NULL,
	"status" "experience_status" DEFAULT 'draft' NOT NULL,
	"admin_note" text,
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"is_published" boolean DEFAULT false NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "experiences_ref_code_unique" UNIQUE("ref_code")
);
--> statement-breakpoint
CREATE TABLE "provider_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"business_name_en" text NOT NULL,
	"business_name_ar" text NOT NULL,
	"business_type" text NOT NULL,
	"contact_email" text NOT NULL,
	"contact_phone" text NOT NULL,
	"status" "provider_application_status" DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	"reviewed_by_admin_id" integer
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"application_id" integer,
	"business_name_en" text NOT NULL,
	"business_name_ar" text NOT NULL,
	"business_type" text NOT NULL,
	"contact_email" text NOT NULL,
	"contact_phone" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "providers_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "content_privacy" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"content_type" text NOT NULL,
	"visibility" text DEFAULT 'public' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_dishes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"dish_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_check_ins" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"restaurant_id" integer NOT NULL,
	"visit_date" text NOT NULL,
	"visit_time" text,
	"party_size" integer DEFAULT 1,
	"notes" text,
	"companion_names" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"restaurant_id" integer,
	"dish_id" integer,
	"note_en" text,
	"note_ar" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"method" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"note_from_user" text,
	"note_from_admin" text,
	"document_url" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visit_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"restaurant_id" integer,
	"title" text NOT NULL,
	"planned_date" text,
	"notes" text,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"theme_label" text,
	"reminder_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"slug" text NOT NULL,
	"description_en" text,
	"description_ar" text,
	"color" text DEFAULT '#e23744',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"author_id" integer NOT NULL,
	"category_id" integer,
	"title_en" text NOT NULL,
	"title_ar" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt_en" text,
	"excerpt_ar" text,
	"content_en" text,
	"content_ar" text,
	"cover_image_url" text,
	"status" "blog_post_status" DEFAULT 'draft' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"read_time_minutes" integer DEFAULT 5,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"meta_title_en" text,
	"meta_title_ar" text,
	"meta_description_en" text,
	"meta_description_ar" text,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "seo_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"path" text NOT NULL,
	"meta_title_en" text,
	"meta_title_ar" text,
	"meta_description_en" text,
	"meta_description_ar" text,
	"keywords" text,
	"is_indexed" boolean DEFAULT true NOT NULL,
	"is_followed" boolean DEFAULT true NOT NULL,
	"canonical_url" text,
	"sitemap_priority" numeric(2, 1) DEFAULT '0.8',
	"sitemap_changefreq" text DEFAULT 'weekly',
	"custom_json_ld" jsonb,
	"og_image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "seo_settings_path_unique" UNIQUE("path")
);
--> statement-breakpoint
CREATE TABLE "order_status_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"order_number" text NOT NULL,
	"old_status" text NOT NULL,
	"new_status" text NOT NULL,
	"reason" text,
	"actor_id" integer,
	"transitioned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"idempotency_key" text,
	"user_id" integer,
	"restaurant_id" integer,
	"items" jsonb DEFAULT '[]'::jsonb,
	"subtotal" numeric(10, 2) NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"delivery_fee" numeric(10, 2) DEFAULT '0',
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"tax_rate" numeric(6, 4) DEFAULT '0',
	"tax_name" text DEFAULT 'VAT',
	"country_code" text DEFAULT 'SA',
	"points_used" integer DEFAULT 0,
	"points_monetary_value" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"status" "order_status" DEFAULT 'placed' NOT NULL,
	"order_mode" "order_mode" DEFAULT 'delivery' NOT NULL,
	"payment_method" "order_payment" DEFAULT 'card' NOT NULL,
	"promo_code" text,
	"customer_name" text,
	"customer_phone" text,
	"delivery_address" text,
	"notes" text,
	"estimated_minutes" integer DEFAULT 35,
	"customer_invoice_ref" text,
	"payment_retry_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number"),
	CONSTRAINT "orders_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref_code" text,
	"order_id" integer,
	"order_number" text,
	"customer_id" integer,
	"supplier_id" integer,
	"reason" text NOT NULL,
	"status" "dispute_status" DEFAULT 'open' NOT NULL,
	"evidence" jsonb DEFAULT '[]'::jsonb,
	"resolution_notes" text,
	"refund_amount" numeric(10, 2),
	"gateway_response" jsonb,
	"resolved_by" integer,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "disputes_ref_code_unique" UNIQUE("ref_code")
);
--> statement-breakpoint
CREATE TABLE "tax_configurations" (
	"id" serial PRIMARY KEY NOT NULL,
	"country_code" text NOT NULL,
	"tax_name" text DEFAULT 'VAT' NOT NULL,
	"tax_rate" numeric(6, 4) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tax_configurations_country_code_unique" UNIQUE("country_code")
);
--> statement-breakpoint
CREATE TABLE "membership_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" text DEFAULT 'membership' NOT NULL,
	"membership_id" integer NOT NULL,
	"old_status" text,
	"new_status" text NOT NULL,
	"reason" text,
	"actor_id" integer,
	"transitioned_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref_code" text,
	"user_id" integer NOT NULL,
	"plan" "membership_plan" NOT NULL,
	"billing" "membership_billing" NOT NULL,
	"status" "membership_status" DEFAULT 'pending' NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"started_at" timestamp,
	"ends_at" timestamp,
	"renews_at" timestamp,
	"cancelled_at" timestamp,
	"suspended_at" timestamp,
	"cancellation_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_ref_code_unique" UNIQUE("ref_code")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_uid" text NOT NULL,
	"cr_document_url" text,
	"vat_document_url" text,
	"owner_id_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_staff" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_uid" text NOT NULL,
	"provider_uid" text NOT NULL,
	"email" text NOT NULL,
	"name_en" text,
	"password_hash" text,
	"role" "provider_staff_role" DEFAULT 'STAFF' NOT NULL,
	"status" "provider_staff_status" DEFAULT 'INVITED' NOT NULL,
	"invite_token" text,
	"invite_token_expires_at" timestamp,
	"invited_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "provider_staff_staff_uid_unique" UNIQUE("staff_uid"),
	CONSTRAINT "provider_staff_invite_token_unique" UNIQUE("invite_token")
);
--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocker_id_users_id_fk" FOREIGN KEY ("blocker_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocked_id_users_id_fk" FOREIGN KEY ("blocked_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_following_id_users_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_interests" ADD CONSTRAINT "user_interests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_mutes" ADD CONSTRAINT "user_mutes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notification_prefs" ADD CONSTRAINT "user_notification_prefs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opening_hours" ADD CONSTRAINT "opening_hours_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_categories" ADD CONSTRAINT "restaurant_categories_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_categories" ADD CONSTRAINT "restaurant_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_follows" ADD CONSTRAINT "restaurant_follows_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_follows" ADD CONSTRAINT "restaurant_follows_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_occasions" ADD CONSTRAINT "restaurant_occasions_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_occasions" ADD CONSTRAINT "restaurant_occasions_occasion_id_occasions_id_fk" FOREIGN KEY ("occasion_id") REFERENCES "public"."occasions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_saved_restaurants" ADD CONSTRAINT "user_saved_restaurants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_saved_restaurants" ADD CONSTRAINT "user_saved_restaurants_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dishes" ADD CONSTRAINT "dishes_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dishes" ADD CONSTRAINT "dishes_menu_section_id_menu_sections_id_fk" FOREIGN KEY ("menu_section_id") REFERENCES "public"."menu_sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_packages" ADD CONSTRAINT "menu_packages_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_sections" ADD CONSTRAINT "menu_sections_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menus" ADD CONSTRAINT "menus_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_stories" ADD CONSTRAINT "restaurant_stories_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_stories" ADD CONSTRAINT "restaurant_stories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_occasion_id_occasions_id_fk" FOREIGN KEY ("occasion_id") REFERENCES "public"."occasions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_options" ADD CONSTRAINT "campaign_options_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code_redemptions" ADD CONSTRAINT "promo_code_redemptions_promo_code_id_promo_codes_id_fk" FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code_redemptions" ADD CONSTRAINT "promo_code_redemptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code_redemptions" ADD CONSTRAINT "promo_code_redemptions_voucher_id_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."vouchers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_voucher_id_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."vouchers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_staff_user_id_users_id_fk" FOREIGN KEY ("staff_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_campaign_option_id_campaign_options_id_fk" FOREIGN KEY ("campaign_option_id") REFERENCES "public"."campaign_options"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_gifter_user_id_users_id_fk" FOREIGN KEY ("gifter_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_likes" ADD CONSTRAINT "review_likes_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_likes" ADD CONSTRAINT "review_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_photos" ADD CONSTRAINT "review_photos_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_dish_id_dishes_id_fk" FOREIGN KEY ("dish_id") REFERENCES "public"."dishes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dish_tags" ADD CONSTRAINT "dish_tags_dish_id_dishes_id_fk" FOREIGN KEY ("dish_id") REFERENCES "public"."dishes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dish_tags" ADD CONSTRAINT "dish_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_tags" ADD CONSTRAINT "restaurant_tags_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_tags" ADD CONSTRAINT "restaurant_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_transactions" ADD CONSTRAINT "points_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_conversions" ADD CONSTRAINT "referral_conversions_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_conversions" ADD CONSTRAINT "referral_conversions_referred_id_users_id_fk" FOREIGN KEY ("referred_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_messages" ADD CONSTRAINT "admin_messages_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_messages" ADD CONSTRAINT "admin_messages_admin_user_id_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_messages" ADD CONSTRAINT "admin_messages_related_offer_id_offers_id_fk" FOREIGN KEY ("related_offer_id") REFERENCES "public"."offers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_messages" ADD CONSTRAINT "admin_messages_related_contract_id_contracts_id_fk" FOREIGN KEY ("related_contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_messages" ADD CONSTRAINT "admin_messages_related_invoice_id_invoices_id_fk" FOREIGN KEY ("related_invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_invoices" ADD CONSTRAINT "customer_invoices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_invoices" ADD CONSTRAINT "customer_invoices_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_voucher_id_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."vouchers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_booking_payments" ADD CONSTRAINT "experience_booking_payments_booking_id_experience_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."experience_bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_bookings" ADD CONSTRAINT "experience_bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_bookings" ADD CONSTRAINT "experience_bookings_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_bookings" ADD CONSTRAINT "experience_bookings_provider_id_experience_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."experience_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_bookings" ADD CONSTRAINT "experience_bookings_slot_id_experience_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."experience_slots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_commissions" ADD CONSTRAINT "experience_commissions_booking_id_experience_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."experience_bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_gifts" ADD CONSTRAINT "experience_gifts_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_gifts" ADD CONSTRAINT "experience_gifts_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_gifts" ADD CONSTRAINT "experience_gifts_redeemed_by_user_id_users_id_fk" FOREIGN KEY ("redeemed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_images" ADD CONSTRAINT "experience_images_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_providers" ADD CONSTRAINT "experience_providers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_review_photos" ADD CONSTRAINT "experience_review_photos_review_id_experience_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."experience_reviews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_reviews" ADD CONSTRAINT "experience_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_reviews" ADD CONSTRAINT "experience_reviews_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_reviews" ADD CONSTRAINT "experience_reviews_booking_id_experience_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."experience_bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_slots" ADD CONSTRAINT "experience_slots_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_host_user_id_users_id_fk" FOREIGN KEY ("host_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_provider_id_experience_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."experience_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_applications" ADD CONSTRAINT "provider_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_applications" ADD CONSTRAINT "provider_applications_reviewed_by_admin_id_users_id_fk" FOREIGN KEY ("reviewed_by_admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "providers" ADD CONSTRAINT "providers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "providers" ADD CONSTRAINT "providers_application_id_provider_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."provider_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_privacy" ADD CONSTRAINT "content_privacy_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_dishes" ADD CONSTRAINT "saved_dishes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_dishes" ADD CONSTRAINT "saved_dishes_dish_id_dishes_id_fk" FOREIGN KEY ("dish_id") REFERENCES "public"."dishes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_check_ins" ADD CONSTRAINT "user_check_ins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_check_ins" ADD CONSTRAINT "user_check_ins_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_recommendations" ADD CONSTRAINT "user_recommendations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_recommendations" ADD CONSTRAINT "user_recommendations_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_recommendations" ADD CONSTRAINT "user_recommendations_dish_id_dishes_id_fk" FOREIGN KEY ("dish_id") REFERENCES "public"."dishes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_plans" ADD CONSTRAINT "visit_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_plans" ADD CONSTRAINT "visit_plans_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_category_id_blog_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."blog_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_log" ADD CONSTRAINT "order_status_log_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_supplier_id_restaurants_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_audit_log" ADD CONSTRAINT "membership_audit_log_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_audit_log" ADD CONSTRAINT "membership_audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_blocks_unique" ON "user_blocks" USING btree ("blocker_id","blocked_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_devices_unique" ON "user_devices" USING btree ("user_id","device_fingerprint");--> statement-breakpoint
CREATE UNIQUE INDEX "user_follows_unique" ON "user_follows" USING btree ("follower_id","following_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_interests_unique" ON "user_interests" USING btree ("user_id","interest_type","value");--> statement-breakpoint
CREATE UNIQUE INDEX "user_mutes_unique" ON "user_mutes" USING btree ("user_id","entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_notif_prefs_unique" ON "user_notification_prefs" USING btree ("user_id","notif_type");--> statement-breakpoint
CREATE UNIQUE INDEX "restaurant_follows_unique" ON "restaurant_follows" USING btree ("user_id","restaurant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_saved_restaurants_unique" ON "user_saved_restaurants" USING btree ("user_id","restaurant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "content_privacy_unique" ON "content_privacy" USING btree ("user_id","content_type");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_dishes_unique" ON "saved_dishes" USING btree ("user_id","dish_id");