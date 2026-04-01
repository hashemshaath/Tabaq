# Tabaq | طبق — Workspace

## Platform Polish — Session 8 (April 2026)

### Completed Fixes

**ProviderRegistrationPage — Error Display**
- Added inline error box above the Submit button, shown when submission fails
- Shows red bordered alert with error message from the API

**Footer — App Store Links**
- Replaced clickable `href="#"` anchors with non-interactive `<span>` elements
- Added "Coming Soon" label next to the download prompt
- Buttons now visually dimmed (`text-white/40`) with `cursor-not-allowed`

**API: Redemptions Route Fix**
- `GET /api/redemptions` was returning 404 because the route was registered at `"/"` instead of `"/redemptions"`
- Fixed path in `redemptions.ts` — Business Console CRM Scanner tab now works correctly

**Unused Page Cleanup**
- Deleted `EditProfilePage.tsx` (405 lines) — superseded by `AccountPage.tsx`
- Deleted `AccountSettingsPage.tsx` (582 lines) — superseded by `AccountPage.tsx`
- `/edit-profile` was already correctly routed to `AccountPage`

**Admin Panel: Promo Codes Modal**
- Replaced raw `prompt()` calls with a proper inline modal form
- Form has fields: Code, Discount Type (% / fixed), Discount Value, Usage Limit, Min Order Amount
- Code auto-uppercases and strips spaces; form resets after successful creation

**Admin Panel: Registrations Tab**
- "Approve All" button now loops through pending applications and patches each to `approved`
- Displays count `Approve All (N)` and is disabled when no pending applications exist
- "Contact Owner" button replaced: uses `tel:phone` or `mailto:email` based on applicant data

**Admin Panel: Demo Mode Toggle TS Fix**
- `onClick={toggleDemoMode}` was passing a `MouseEvent` to a function expecting `boolean`
- Fixed to `onClick={() => toggleDemoMode(!isDemoMode)}`

---

## Platform Hardening — Session 7 (April 2026)

### Authentication System Rebuild (/signin)
- **SignInPage.tsx fully rebuilt** (953 → 660 lines, cleaner architecture)
- **Three account modes**: Customer (عميل) / Restaurant (مطعم) / Admin (مسؤول)
- **Role-aware redirect**: `finishLogin()` now uses `roleDestination(user)` → admin→`/admin`, owner→`/business`, user→`/`
- **Admin tab**: Email+password only, dark security notice panel, no forgot-password shown
- **Restaurant tab**: Email+password only, orange info notice with partner link
- **Customer tab**: Three sub-tabs: Phone OTP | Email OTP | Password
- **Role validation**: Login from Admin tab rejects non-admins with proper error; Restaurant tab rejects non-owners
- **Already-logged-in redirect** also uses role-based routing (was always `/`)
- **Left branding panel**: Dynamic content changes based on selected account mode (user/restaurant/admin stats)
- **Trust badges, stats, full bilingual RTL/LTR** support

### Catering Packages — 15 packages seeded
- All 8 catering/buffet menus now have packages: Najd Village (2), Nakheel Palace (2), The Grill House (1+), Casa Levant, Maestro Italian, Spice Route India, Sushi Hana, Café Bateel
- `/api/catering/packages` returns all 15 packages with restaurant info, images, pricing, included dishes
- CateringPage now shows "15 باقة متاحة" with full package cards

### Suggested Users API Fix (T006)
- `/api/users/suggested` now excludes `is_admin=true` and `is_owner=true` accounts
- Also excludes users with empty usernames — only real food community members appear
- Returns 6 high-quality profiles: Faisal (7200pts), Khalid (5900pts), Sara (4100pts), Noura (3800pts), Lama (1450pts), Abdullah (980pts)

### TabaqGold Page — Real Testimonials (T004)
- Reviews query (`/api/reviews?sort=rating`) returns 3 five-star reviews from DB
- Real testimonials from Faisal Al-Otaibi (Nakheel Palace), Noura Al-Rashid (Najd Village), Sara Al-Mousa (Café Bateel)
- Fallback TESTIMONIALS updated to use pravatar URLs matching actual DB users (img=47, img=12, img=31)

### StaticPage / About — Realistic Stats (T005)
- Stats fixed: 2,400+ → **49+** partner restaurants, 18 Cities → **9 Cities**, 1.2M+ → **50K+** registered foodies

### Demo Accounts (from Session 6)
- admin@tabaq.sa / Tabaq@Admin2026 (is_admin=true → /admin)
- owner@tabaq.sa / Tabaq@Owner2026 (is_owner=true → /business)
- demo@tabaq.sa / Tabaq@User2026 (regular user → /)

---

## Restaurant Data Enrichment — Session 6 (April 2026)

### Logo URLs for All Restaurants
- All 12 restaurants now have `logo_url` set via initials-based branded logos (ui-avatars.com)
- Each restaurant gets a unique background colour matching their cuisine/brand identity

### Nakheel Palace Menu Seeded (was 0 dishes → 8)
- Starters: Wagyu Carpaccio (⭐), Lobster Bisque, Foie Gras Torchon (chef's choice)
- Main Course: Wagyu Tomahawk 1kg (⭐ SAR 650), Whole Grilled Turbot, Lamb Rack Provençale
- Desserts: Valrhona Chocolate Soufflé (⭐, chef's choice), Arabic Mille-Feuille
- All 8 dishes have Unsplash images → photos tab jumps from 1 → 9

### Dish Images Filled In
- 25 dishes across all restaurants that had null `image_url` now have Unsplash food photography URLs
- Every single dish across all 12 restaurants now has an image (100% coverage)

### More Dishes for Under-Stocked Restaurants
Added 34 new dishes across 6 restaurants, bringing all to 7-10 dishes:
- Maestro Italian: 3 → 9 (Burrata, Carbonara ⭐, Risotto Tartufo ⭐, Tiramisu ⭐, Panna Cotta)
- Al Baik Express: 2 → 7 (Crispy Shrimp ⭐, Chicken Tenders, Broasted Meal ⭐, Family Bucket ⭐)
- Kana Sushi: 2 → 8 (Gyoza, Salmon Tartar ⭐, Dragon Roll ⭐, Salmon Sashimi ⭐, Rainbow Roll, Matcha Cake ⭐)
- Casa Levant: 3 → 8 (Mezze Platter ⭐, Fatayer Trio, Lamb Ouzi ⭐, Musakhan, Knafeh ⭐)
- Bahar Seafood: 3 → 8 (Shrimp Cocktail, Calamari, Hammour ⭐, Crab Biryani ⭐, Umm Ali)
- Spice Route India: 3 → 10 (Seekh Kebab ⭐, Papdi Chaat, Butter Chicken ⭐, Dal Makhani, Rogan Josh ⭐, Gulab Jamun ⭐, Kulfi Falooda)

### Photo Gallery Counts (all from cover + dish images)
- Spice Route India: 11 photos | Maestro Italian: 10 photos | Bahar/Nakheel/Kana/Casa: 9 each
- Al Baik: 8 | Sushi Hana: 7 | Najd Village: 6 | Café Bateel/Green Bowl/Grill House: 5

### Homepage Tabaq Stars Section
- New dishes with `is_tabaq_star = true` now appear in the homepage "نجوم طبق" section
- Nakheel Palace dishes (Wagyu Tomahawk, Soufflé) show alongside existing restaurants' stars

---

## Platform Enrichment & Gaps — Session 5 (April 2026)

### Feed Page — Public Access Fixed
- Removed `ProtectedRoute` wrapper from `/feed` route — community tab now accessible without login
- Community tab uses `useListReviews` (public); Following tab uses `useGetFeed` (requires auth with sign-in prompt)
- Story bar fetches from `/api/stories/recent` — 6 approved restaurant stories showing

### Reviews API — Sort by Rating
- Added `sort=rating` query param support to `GET /api/reviews` — orders by `ratingOverall DESC`
- TabaqGoldPage testimonials now correctly fetch the top 3 five-star reviews

### Tags System — End-to-End Complete
- `/api/tags` endpoint added to the API server (returns all 12 active tags)
- `tagId` filtering added to `GET /api/restaurants` list endpoint (joins `restaurant_tags` table)
- Tags displayed in RestaurantDetailPage "About" section as `bg-primary/10` chips
- Tags filter row added to DiscoveryPage below occasion chips — "المميزات" label + 12 tag chips
- Active tag chip appears in the filter chips row with a dismiss button
- `tagId` included in `activeFilterCount` for the filter badge

### Broken Link Fixed
- `ExperiencesConsolePage.tsx` line 657: `/providers/register` → `/partners/register`

### User Verification
- 4 top users marked `is_verified = true` (Khalid, Noura, Sara, Faisal)
- Credibility scores recomputed with +0.2 verified bonus; top score 0.92

### Featured Restaurants
- All 12 restaurants with `avg_rating >= 4.7 AND review_count >= 5` marked `is_featured = true`

### API Verification Summary
- `/api/catering/packages` → 10 packages (SAR 70–145/person, 30–800 guests) ✅
- `/api/experiences` → 5 published experiences ✅
- `/api/offers` → 5 active restaurant offers ✅
- `/api/blog/posts` → dynamic blog posts ✅
- `/api/stories/recent` → 6 approved stories for story bar ✅
- `/api/users/suggested` → 6 real user profiles with avatars ✅
- `/api/tags` → 12 active feature tags ✅

---

## Platform Audit & Completion — Session 4 (April 2026)

### T001: Duplicate ProviderRegisterPage
- Confirmed: only ONE file exists (`ProviderRegistrationPage.tsx`); no duplicate. No action needed.

### T002/T003: Catering Packages + API
- 13 catering packages already active across 6 menus; `GET /api/catering/packages` returns real records
- `POST /api/catering/inquiries` returns `CAT-` ref codes; all endpoints verified working

### T004: TabaqGoldPage Testimonials
- Already uses real reviews API — queries 5-star reviews with loading state + curated fallback

### T005: StaticPage Team
- Already has 8 professional bilingual team members with proper bios

### T006: FeedPage "People You May Know"
- Admin user (ID 1) given name "Tabaq Admin" + username "tabaq_admin"
- `/api/users/suggested` returns 8 complete profiles; `FeedPage` properly authenticated

### T007: Experiences Seeded
- 2 experience providers + 5 active published experiences seeded with bilingual descriptions:
  - Royal Kabsa Feast at Najd Village (SAR 320/person, Traditional Saudi)
  - Omakase Sushi Masterclass at Kana Sushi (SAR 480/person, Japanese)
  - Desert Sunset BBQ Experience (SAR 580/person, Outdoor & BBQ)
  - Saudi Coffee & Date Heritage Ceremony (SAR 185/person, Cultural & Coffee)
  - Chef's Table at Nakheel Palace (SAR 750/person, Fine Dining)
- Each experience has time slots Thu+Fri for 6 weeks; status `active` + `is_published=true`

### API_BASE Centralization (Complete)
All 18 frontend pages/components now use `${API_BASE}/api/...` for every fetch call.
Zero bare `/api/` fetch calls remain anywhere in `artifacts/tabaq/src/`.
Files fixed in this session:
- `FeedPage.tsx` — 3 bare calls (leaderboard, restaurants, trending dishes)
- `HomePage.tsx` — 6 bare calls (orders, bookings, leaderboard, tabaq-stars, occasions, categories)
- `UserDashboardPage.tsx` — 1 bare call (me/username)
- `OffersPage.tsx` — 1 bare call (promo-codes/apply)
- `ExperiencesConsolePage.tsx` — double-quote string calls (providers/me, experiences)
- `ProfilePage.tsx` — double-quote string calls (me/checkins, etc.)
- `RestaurantDetailPage.tsx` — 2 template-literal calls missing API_BASE prefix
- `AdminPanelPage.tsx` — 54 template-literal calls + single-quote calls, all fixed

### Navigation Fixes
- Footer `/settings` → `/account`
- AccountPage follower/following modals link to `/:username` (not `/user/:username`)

---

## Platform Enrichment — Session 3 (April 2026)

### Review Coverage Completed
- Added 8 authentic bilingual reviews for all 5 restaurants with zero coverage: Al Baik Express (2), Kana Sushi (2), Green Bowl (1), Bahar Seafood (2), Spice Route India (1)
- All 12 active restaurants now have at least 1 review; most have 2

### Blog Page — Dynamic Categories
- Replaced hardcoded `SAMPLE_CATEGORIES` (wrong IDs/slugs) with a live fetch from `/api/blog/categories`
- Category pills now reflect the actual DB categories: Dining Guides, Chef Stories, Food Trends, Restaurant News, Recipes
- Category filter → server-side `categoryId` param → correct posts returned per tab

### Auth Header Cleanup (continued)
- All remaining manual `Authorization: Bearer` strings replaced with `getAuthHeaders()`
- Removed `tokenRef` / cookie-reading from `SettingsContext`; now uses `getAuthHeaders()` throughout
- Removed redundant `credentials: 'include'` from JWT-authenticated API calls
- `menus.ts` duplicate catering routes (`/catering/packages`, `/catering/inquiries`) removed

### Blog Content Expanded
- 3 existing posts enriched to 1500+ characters with full HTML content, cover images, excerpts
- 3 new posts added (Chef Stories, Restaurant News, Recipes) — total 6 published posts
- All 5 blog categories now have at least one post

### Promo Codes
- 6 real codes seeded: TABAQ10 (10%), WELCOME20 (20%), EID25 (25%), SAVE50 (50 SAR fixed), RAMADAN15 (15%), VIPFOOD (30%)
- Fixed `OffersPage` bug: was checking `discountPercent` but API returns `discountAmount`

### FeedPage — People You May Know
- `/api/users/suggested` now returns `reviewCount` via subquery
- Added `username IS NOT NULL` filter so only complete profiles appear
- FeedPage card shows "· N reviews" social proof

---

## Codebase Cleanup & Refactor (April 2026)

### API_BASE Centralization
- Exported `API_BASE` from `artifacts/tabaq/src/lib/api.ts` as single source of truth
- Removed 25+ inline `const API_BASE = import.meta.env.BASE_URL...` definitions across 22 files
- All files now import from `@/lib/api` — no more scattered per-file constants

### Auth Pattern Fixes
- `FeedPage.tsx`: replaced wrong `localStorage.getItem('auth_token')` with `getAuthHeaders()` in 2 places
- `AccountSettingsPage.tsx`: removed redundant `'Content-Type': 'application/json'` duplication (headers: getAuthHeaders() is sufficient)
- `AdminPanelPage.tsx`: fixed convoluted `${apiBase.replace('/','')}/api/admin/stats`.replace(/^\//, '/')` → `${API_BASE}/api/admin/stats`

### Platform Audit & Completion
- **Duplicate route removed**: Deleted `ProviderRegisterPage.tsx`; `/partners/register` and `/providers/register` both serve `ProviderRegistrationPage`
- **Catering packages seeded**: 13 packages across 6 menus; `GET /api/catering/packages` returns real records; `POST /api/catering/inquiries` returns `CAT-` ref codes
- **Contact form wired**: `POST /api/contact` validates input, logs enquiry, returns ref code (`CNT-xxxxx`)
- **Suggested users fixed**: `/api/users/suggested` filters out null-name users; `FeedPage` "People You May Know" uses correct auth token
- **TabaqGoldPage testimonials**: Dynamic — queries top 5-star reviews from `/api/reviews?limit=3&sort=rating` with loading state; falls back to curated static testimonials if fewer than 3 five-star reviews exist
- **StaticPage team**: 8 team members with professional bios in English and Arabic; role text highlighted in primary color
- **Settlement batch implemented**: `POST /api/admin/settlement/create-batch` — full commission calculation per restaurant

---

## Admin Auth Hardening & 2FA (Task #2 — April 2026)

### Overview
Fully separate, hardened admin identity system — completely isolated from user accounts.

### New Schema (lib/db/src/schema/admin.ts)
- `admin_users` table: adm_uid, email, password_hash, role, status, two_factor_enabled, two_factor_secret, backup_codes (hashed), ip_allowlist, failed_login_count, locked_until, session tracking
- `admin_sessions` table: ses_uid, adm_uid, ip, user_agent, expires_at, revoked_at
- `audit_log` table: adm_uid, action, entity_type, entity_uid, ip, metadata

### New Admin Auth Library (artifacts/api-server/src/lib/admin-auth.ts)
- `signAdminToken` / `verifyAdminToken` — 8h JWT with type: "admin", role, permissions[], session_id
- `signPartialToken` / `verifyPartialToken` — 5min JWT for 2FA pending state
- `PERMISSION_MATRIX` — maps SUPER_ADMIN/ADMIN/FINANCE/SUPPORT/VIEWER → permission arrays
- TOTP helpers via `otpauth` package: generateTotpSecret, verifyTotp (±1 window), generateBackupCodes/hashBackupCode

### New Admin Auth Routes (artifacts/api-server/src/routes/admin-auth.ts)
- `POST /api/v1/admin/auth/setup` — first-admin bootstrap using ADMIN_SETUP_SECRET env; 404 if not set, 403 if admin already exists
- `POST /api/v1/admin/auth/login` — IP allowlist → status → lockout → bcrypt → 2FA branch; returns partial token or full JWT; generic error for all failures; 5 failed attempts → 30min lockout
- `POST /api/v1/admin/auth/2fa/verify` — TOTP with ±1 window, backup code support, max 3 attempts; increments partial token attempts
- `POST /api/v1/admin/auth/2fa/setup` — generates TOTP secret + otpauth URL
- `POST /api/v1/admin/auth/2fa/confirm-setup` — verifies first TOTP, enables 2FA, returns 10 raw backup codes once (stored hashed)
- `GET /api/v1/admin/auth/sessions` — list active sessions for current admin
- `DELETE /api/v1/admin/auth/sessions/:sesUid` — revoke specific session
- `DELETE /api/v1/admin/auth/sessions/all` — emergency revoke all sessions

### Updated Middleware (artifacts/api-server/src/middleware/requireAuth.ts)
- `requirePermission(permission)` — new middleware factory: verifies admin JWT, checks session not revoked/expired, enforces permission matrix, writes every request to audit_log, sets req.adminAuth

### Updated Admin Routes (all use requirePermission now)
- admin-stats: "admin:read"
- admin-finance: "finance:read"
- admin-offers: "offers:read"
- admin-referrals: "referrals:read"
- admin-experiences: "experiences:read"
- admin-settings: "settings:read" / "settings:write"
- ai-admin: "ai:use"

### Environment Variables Required
- `ADMIN_SETUP_SECRET` — must be set to enable the setup endpoint
- `JWT_SECRET` — shared with regular auth (admin JWTs use separate type claim)

---

## Audit Fixes (All 11 Implemented — April 2026)

### FIX 1: Invoice Wiring
`invoiceService.processBooking()` is now called from `POST /bookings`, generating a `TBQ-CINV-*` receipt and storing `invoiceRef` on the booking row. Schema: `bookings.invoice_ref` added.

### FIX 2: Promo Code Redemption Persistence
`POST /orders` now inserts a row into `promo_code_redemptions` and atomically increments `promo_codes.used_count` + `total_discount_given` after a promo is applied.

### FIX 3: Partial Voucher Balance
`POST /redemptions/redeem` now computes `remainingBalance = voucherBalance - requested`, updates `vouchers.remaining_balance`, and sets status to `partially_redeemed` or `redeemed` accordingly. (Schema columns `redeemed_amount` + `remaining_balance` already existed.)

### FIX 4: Payment Gateway
`lib/paymentGateway.ts` — abstraction over HyperPay / Stripe / mock. Switch with `PAYMENT_GATEWAY=hyperpay|stripe|mock` env var (default: `mock`).

### FIX 5: Notification System
`lib/notify.ts` — DB-backed notification helper writing to `notifications` table with `notifyAsync()` for fire-and-forget. Wired into bookings (create/update) and orders (create/status-update) flows.

### FIX 6: Cron Jobs (5 scheduled)
`lib/cron.ts` + `startCronJobs()` called from `index.ts`:
- `points_expiry_check` — daily 02:00
- `membership_auto_renewal` — daily 03:00
- `membership_expiry_warning` — daily 04:00
- `commission_batch_calculation` — 1st of month 05:00
- `abandoned_order_cleanup` — every 6 hours
Each run is logged to `cron_logs` table.

### FIX 7: Points Redemption
- `POST /orders` accepts `pointsToRedeem` to apply points as payment (100 pts = 1 SAR). Atomically deducted before order insert; logged to `points_transactions` with `action=redemption`.
- New endpoint: `POST /me/points/redeem` — standalone redemption with optimistic lock and notification.

### FIX 8: Membership Lifecycle
`lib/membership.ts` — state machine with allowed transitions. Routes: `GET /me/membership`, `POST /memberships`, `POST /memberships/:id/cancel`, `PATCH /memberships/:id/status` (admin), `GET /memberships/:id/audit` (admin). Schema: `memberships` + `membership_audit_log` tables.

### FIX 9: Order Status State Machine
`lib/orderStatus.ts` — enforces valid status transitions. New route: `PATCH /orders/:orderNumber/status` — restaurant owner can advance status; customer can cancel. Returns 422 with allowed transitions on invalid state.

### FIX 10: Dispute Workflow
`routes/disputes.ts` — full flow: `POST /disputes` (open), `PATCH /disputes/:id/review` (admin), `PATCH /disputes/:id/resolve` (admin, with REFUND/NO_REFUND/PARTIAL_REFUND decision + refund gateway call). Schema: `disputes` table.

### FIX 11: VAT
`lib/tax.ts` — `calculateTax(countryCode, subtotal)` returns `{ rate, taxAmount, taxName, totalWithTax }`. Saudi Arabia = 15%. Called in `POST /orders` and wired into customer invoice. Schema: `orders.tax_amount/tax_rate/tax_name/country_code` added.

### BONUS: RefCode regex fix
`lib/refcode.ts` — regex updated from `/[A-Z]{3}/` to `/[A-Z]{3,4}/` so `TBQ-CINV-*` refs parse correctly.

---

## Backend Audit Round 2 (All 6 Fixes — April 2026)

### A1: Admin bypass on order status PATCH
`PATCH /orders/:orderNumber/status` now accepts `isAdmin` tokens from any user, not just the restaurant owner. Non-admin outsiders still get 403. File: `routes/orders.ts`.

### A2: Mock gateway rawResponse
`mockInitPayment()` now returns `rawResponse: { transactionId, gateway, amount, currency, orderId, timestamp }`. Pre-existing invoices remain null (expected). File: `lib/paymentGateway.ts`.

### A3: Return flow
Three new endpoints in `routes/returns.ts`:
- `POST /api/orders/:orderNumber/return` — customer opens return (completed → return_requested)
- `POST /api/orders/:orderNumber/return/approve` — admin/owner approves (return_requested → returned). Side effects: credit note (`TBQ-CRDN-*`) + proportional points deduction.
- `POST /api/orders/:orderNumber/return/reject` — admin/owner rejects (return_requested → completed)
State machine in `lib/orderStatus.ts` updated: `completed→return_requested`, `return_requested→returned|completed`.

### A4: Barcode + ZATCA QR on invoices
`invoiceService.getByRef()` now augments response with `barcode` (= refCode) and `qrCode` (ZATCA Phase-1 TLV Base64). ZATCA utility: `lib/zatca.ts` — `generateZatcaQr({ sellerName, vatRegNumber, timestamp, totalAmount, vatAmount })`.

### A5: Partial voucher redemption
`POST /vouchers/:id/redeem` accepts optional `amountToRedeem`. If < remaining_balance: decrements balance, keeps `status=active`. If ≥ remaining_balance: sets `status=used`. File: `routes/offers.ts`.

### A6: Points pending/redeemable lifecycle
`lib/points.ts` extended: `logPointsTransaction(..., status: PointsStatus)`, `promotePointsToRedeemable()`, `cancelPendingPoints()`.
- CONFIRMED: pending points record created (balance unchanged)
- COMPLETED: `promotePointsToRedeemable()` → status=redeemable, balance credited
- CANCELLED: `cancelPendingPoints()` → status=cancelled, no balance change

---

## Financial Architecture (Centralized Invoice System)

### Central Invoice Service (`artifacts/api-server/src/services/invoiceService.ts`)
Single service used by ALL financial flows. Never create invoice logic elsewhere.

- `invoiceService.processOrder(params)` — creates customer invoice, logs financial transaction, awards loyalty points
- `invoiceService.processBooking(params)` — creates booking receipt
- `invoiceService.getByRef(refCode)` — fetch by ref code, includes `barcode` + `qrCode` (ZATCA TLV)
- `invoiceService.getForUser(userId)` — list user's invoices
- `invoiceService.voidInvoice(refCode)` / `refundInvoice(refCode)` — lifecycle management
- `invoiceService.createCreditNote(params)` — credit note for approved returns (source=return, status=credit, ref=TBQ-CRDN-*)

### Customer Invoices (`customer_invoices` table)
User-facing receipts for every paid transaction. Separate from B2B settlement invoices (`invoices` table).
- Source types: `order`, `booking`, `voucher_purchase`, `experience_booking`, `membership`
- Ref format: `TBQ-CINV-2026-000001`
- API: `GET /api/orders/:orderNumber/invoice`, `GET /api/me/invoices`

### B2B Settlement Invoices (`invoices` table)
Periodic settlement statements from Tabaq to restaurant partners. Admin-managed via `/admin/invoices`.

### Financial Transaction Ledger (`transactions` table)
Full audit trail of every monetary event. Auto-populated by `invoiceService.processOrder()` using the restaurant's commission rate from the `contracts` table.

### Idempotency (Orders)
`POST /api/orders` accepts an optional `idempotencyKey`. If the same key is submitted twice, the original order is returned with `idempotent: true`. Prevents duplicate charges on network retries.

### Points Audit Trail (Fixed)
`awardPoints()` now correctly returns the new balance. New `logPointsTransaction()` writes to `points_transactions` table on every points event. New `awardAndLog()` convenience function does both atomically.
- All flows now log: bookings (`booking_made`), reviews (`review_written`), orders (`order_placed`)
- Points for orders: ~1 pt per 10 SAR spent

### RefCode System
Standardized format `TBQ-{TYPE}-{YEAR}-{PADDED_ID}` across all entities. New types added: `CINV` (customer invoice), `ORD` (order).



## Design System (Zomato-Level Upgrade)

- **Font**: IBM Plex Sans Arabic (RTL) + IBM Plex Sans (LTR) — loaded via Google Fonts in `index.css`
- **Primary Color**: `#e23744` (Zomato Red, HSL 355 73% 55%) — used throughout as `--primary`
- **Background**: `#f8f9fb` (page), `#ffffff` (cards)
- **Typography**: H1: 26px/700, H2: 20px/600, H3: 17px/600, H4: 15px/600, Body: 14px
- **Shadows**: `.shadow-elevation-1/2/3/4` utility classes (soft, professional)
- **Spacing**: 8px grid system, `.section-gap` (48px), `.section-gap-sm` (32px)
- **Card hover**: `.card-hover` class with translateY(-1px) + shadow transition

## Auth Hardening (April 2026)

### OTP Flow
- **OTP generation**: `crypto.randomInt(100000, 999999)` — cryptographically secure, not Math.random
- **OTP storage**: SHA-256 hash stored in `otp_requests.otp_hash`; `code` column set to literal `"HASHED"` — plain-text OTP never persisted
- **OTP expiry**: hard-coded 5 minutes (removed env-configurable setting that allowed misconfig)
- **OTP attempt tracking**: `otp_requests.attempts` column; 3 wrong attempts voids the OTP row and blocks further verify attempts on it
- **Resend rate limit**: max 1 OTP request per 60 seconds per phone/email (enforced via DB count check before insert)
- **Phone normalization**: `normalizePhone()` in `lib/auth.ts` converts `05XXXXXXXX` → `+96605XXXXXXXX`, validates E.164 format, rejects invalid strings
- **Replay protection**: `used_at` set immediately on first successful verify; subsequent use of same OTP returns `invalid_otp`

### Email + Password Flow (NEW)
- `POST /auth/register` — validates email format, enforces password strength (8+ chars, 1 uppercase, 1 number), bcrypt-hashes with cost 12, returns `EMAIL_ALREADY_EXISTS` on collision, generates email OTP for verification (dev mode returns `devEmailOtp`)
- `POST /auth/login` — email + password, bcrypt compare, constant-time dummy hash for non-existent users (prevents timing attacks), blocks login if `isEmailVerified = false`
- `PATCH /me/password` — now functional: verifies `currentPassword` against stored hash, validates new password strength, writes new bcrypt hash to DB

### Failed Login Protection
- `users.failed_login_count` — incremented on every wrong OTP or wrong password
- `users.locked_until` — set to `NOW() + 15 minutes` after 5 consecutive failures
- Every `/auth/verify-otp` and `/auth/login` checks `locked_until` first and returns `ACCOUNT_LOCKED` with `retry_after` seconds
- On successful login: `failed_login_count` reset to 0, `locked_until` cleared

### JWT Hardening
- Access token expiry: **15 minutes** (was 30 days)
- JWT payload now includes: `sub` (user_uid), `userId`, `type: "access"`, `role`, `jti` (UUID v4), `iat`, `exp`
- `jti` claim on every token enables future per-token revocation

### Refresh Token System (NEW)
- `POST /auth/refresh` — accepts `refreshToken` in body or `x-refresh-token` header
- **Rotation**: old token revoked atomically, new access + refresh tokens issued
- **Replay protection**: revoked token reuse returns `invalid_refresh_token`
- Stored in `refresh_tokens` table: `token_hash` (SHA-256), `user_id`, `device_info`, `expires_at` (30 days), `is_revoked`
- Logout (`POST /auth/logout`) revokes the supplied refresh token in DB

### User UID
- `users.user_uid` column added: format `USR-YYYY-XXXXXXXX-HHHHHHHHH` (year, zero-padded id, 8-char hex suffix)
- Backfilled for all existing users during migration
- Unique index `users_user_uid_unique` enforced
- JWT `sub` claim = `user_uid` (not integer ID)
- `requireAuth` middleware now populates `req.auth.userUid`

### New DB Columns
- `users`: `user_uid`, `password_hash`, `failed_login_count`, `locked_until`, `last_login_at`, `last_login_ip`
- `otp_requests`: `otp_hash`, `attempts`
- New table: `refresh_tokens` (id, user_id, token_hash, device_info, expires_at, is_revoked, created_at)

## Username Login Extension (April 2026)

### Multi-Identifier Login
- `POST /auth/login` now accepts `email` **or** `identifier` field containing an email, phone, or username
- Detection order: `@` present → email path; digits-only with optional `+` prefix → phone path; anything else → username path
- Username lookup is case-insensitive via `LOWER(username)` SQL (using the partial index `idx_users_username`)
- Backward-compatible: existing callers sending `{ email: "user@..." }` continue to work unchanged

### Username Validation Rules (corrected)
- Regex: `/^[a-zA-Z0-9_-]{3,30}$/` — letters, numbers, underscores, hyphens ONLY (dots are NOT allowed)
- Reserved words: admin, tabaq, support, api (plus common platform paths)
- Stored lowercase; lookup is case-insensitive
- Single source of truth: `validateUsername()` exported from `lib/auth.ts`; `routes/username.ts` imports it

## Passcode (PIN) System (April 2026)

A 6-digit passcode system for mobile users, enabling fast re-login without OTP after first login.

### How It Works
1. User logs in normally (phone OTP or email+password).
2. App prompts user to set a 6-digit passcode via `POST /auth/passcode/set`.
3. On subsequent opens: user enters passcode — `POST /auth/passcode/login` issues full JWT.
4. "Forgot passcode" → request phone OTP, call `POST /auth/passcode/reset`.

### Passcode Validation Rules
- Exactly 6 digits (`/^\d{6}$/`)
- Not all-same (e.g. `111111`)
- Not strictly sequential ascending or descending (e.g. `123456`, `987654`)
- Hashed with bcrypt cost-10 (lighter than password cost-12 — PIN is short-lived by design)

### Constraints for Passcode Login
1. User must have a verified phone number
2. Passcode must have been set within the last 90 days (prompted to re-setup after expiry)
3. `device_fingerprint` must match a previously registered device for this user (new devices require full phone OTP first)

### Lockout
- 5 wrong attempts → 10-minute lock (`passcode_locked_until`)
- Correct passcode resets counter to 0

### Rate Limiting
- `POST /auth/passcode/login`: 10 requests per minute per `user_uid` (in-memory, keyed on `user_uid`)

### Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/passcode/set` | JWT required | Set/replace passcode; registers device |
| `POST` | `/api/auth/passcode/login` | Public | Login by user_uid + passcode + device_fingerprint |
| `POST` | `/api/auth/passcode/reset` | Public | Forgot-passcode: verify phone OTP, then set new passcode |
| `DELETE` | `/api/auth/passcode` | JWT required | Disable passcode login |

### New DB Columns (users table)
- `passcode_hash varchar(100)` — bcrypt hash
- `passcode_set_at timestamp`
- `passcode_failed_attempts smallint DEFAULT 0`
- `passcode_locked_until timestamp`

### New DB Table: `user_devices`
Tracks known devices per user. Required for passcode login device-fingerprint validation.
- `user_id`, `device_fingerprint` (unique pair), `device_info`, `first_seen_at`, `last_seen_at`

### New Files
- `artifacts/api-server/src/routes/passcode.ts` — all 4 passcode endpoints

---

### New Endpoint: `POST /auth/check-username`
Returns `{ available: boolean, reason: string | null }` — validates format, checks reserved words, then queries DB

### Username on Registration
- `POST /auth/register` and `POST /auth/verify-otp` both accept optional `{ username, displayName }` params
- `USERNAME_TAKEN` 409 returned on collision before DB insert

### New DB Columns (Username Extension)
- `users.display_name` (text, nullable) — free-form display name separate from `name_en` / `name_ar`
- `users.username` — existing column; old `users_username_unique` constraint replaced with partial case-insensitive index:
  `CREATE UNIQUE INDEX idx_users_username ON users(LOWER(username)) WHERE username IS NOT NULL`

### New/Modified Files
- `artifacts/api-server/src/lib/auth.ts` — `generateOtp` (crypto.randomInt), `hashOtp`, `normalizePhone`, `validateEmail`, `validatePasswordStrength`, `generateRefreshToken`, `hashRefreshToken`, new JWT payload interface
- `artifacts/api-server/src/routes/auth.ts` — fully hardened OTP + email/password + refresh + logout flows
- `artifacts/api-server/src/middleware/requireAuth.ts` — handles both old and new JWT payload shapes, exposes `userUid`, `role`, `jti` on `req.auth`
- `artifacts/api-server/src/routes/profile.ts` — `PATCH /me/password` now actually reads, compares, and writes bcrypt hashes
- `lib/db/src/schema/users.ts` — new columns + `refreshTokensTable`

---

## Production Readiness Upgrade — 8 Phases (April 2026)

### Phase 1 — Docker + Production Containerization
- `Dockerfile.api` — multi-stage build: deps → builder → runner (node:22-alpine, non-root user, HEALTHCHECK)
- `Dockerfile.web` — multi-stage build: Vite build → nginx:1.27-alpine serving SPA
- `docker-compose.yml` — local Docker development (postgres:16, redis:7, api, web)
- `docker-compose.prod.yml` — production deployment with replica scaling, env_file reference
- `docker/nginx.conf` — nginx SPA proxy: gzip, security headers, `/api/` proxy, SSE support (`proxy_buffering off`), asset caching

### Phase 2 — Environment Variables Documentation
- `.env.example` — complete audit of every env var grouped by domain (app, database, redis, auth, sms, smtp, storage/S3/R2, Sentry, analytics, firebase, payments, maps, AI, feature flags, CORS, RabbitMQ)
- All secrets are environment-variable-driven; no hardcoded credentials found
- `CORS_EXTRA_ORIGINS` support added to `app.ts` for additional production domains

### Phase 3 — Rate Limiting & API Protection
- `artifacts/api-server/src/middleware/rateLimiter.ts` — 5 configurable limiters:
  - `authRateLimiter` — 10 req/60s (OTP + verify-otp endpoints)
  - `paymentRateLimiter` — 20 req/60s (payment-sensitive routes)
  - `searchRateLimiter` — 60 req/60s (GET /search, /search/autocomplete)
  - `publicRateLimiter` — 200 req/60s (all routes via app.ts global middleware)
  - `aiRateLimiter` — 10 req/60s (AI generation + SEO endpoints)
- All limits configurable via env vars (`RATE_LIMIT_*_MAX`, `RATE_LIMIT_*_WINDOW_MS`)
- `TRUST_PROXY=true` support for correct IP detection behind nginx/load balancer
- Applied to: auth/OTP routes, search routes, AI routes, global API

### Phase 4 — Real Image Upload System
- `artifacts/api-server/src/services/storageService.ts` — storage provider abstraction
  - `local` provider — saves to filesystem, serves via `express.static` at `/uploads/`
  - `s3` provider — AWS S3 via `@aws-sdk/client-s3` (lazy-loaded, no cost in dev)
  - `r2` provider — Cloudflare R2 (S3-compatible), same SDK
  - Switch via `STORAGE_PROVIDER=local|s3|r2`
- `POST /api/upload` — authenticated multipart upload (multer), MIME + size validation, returns `{ url, key, size, mimeType }`
- `DELETE /api/upload?key=...` — admin-only file deletion
- File validation: JPEG/PNG/WebP/GIF/SVG only, 10MB max (configurable via `UPLOAD_MAX_SIZE_BYTES`)

### Phase 5 — Error Monitoring (Sentry)
- **Backend**: `artifacts/api-server/src/lib/sentry.ts` — `initSentry()` called as first import in `index.ts`
  - Disabled when `SENTRY_DSN` not set (dev-safe)
  - PII scrubbing: strips `password`, `code`, `otp`, `token`, `secret`, `key` from request bodies
  - Sampling: 10% traces in prod, 5% in staging, 0% in dev
  - `captureError()` / `captureMessage()` helpers for manual capture
- **Frontend**: `@sentry/react` integrated in `artifacts/tabaq/src/main.tsx`
  - Disabled when `VITE_SENTRY_DSN` not set
  - Browser Tracing + Session Replay (1% sessions, 10% on error)
  - `ErrorBoundary.componentDidCatch` now reports to Sentry
- `@sentry/node` + `@opentelemetry/api` added to esbuild externals in `build.mjs`

### Phase 6 — Real SMS OTP Activation
- `artifacts/api-server/src/services/smsService.ts` — provider abstraction:
  - `mock` (default) — logs code, never sends real SMS; `devCode` returned in dev mode
  - `unifonic` — Unifonic REST API (Saudi/MENA); configured via `UNIFONIC_APP_SID` + `UNIFONIC_SENDER_ID`
  - `twilio` — Twilio Messages API; configured via `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_FROM_NUMBER`
- `auth.ts` OTP flow updated: `sendOtp(phone, code)` called on every phone OTP request; SMS failure is logged but does not block the response
- Bilingual OTP message: Arabic + English in same SMS
- `isSmsDevMode()` used to conditionally expose `devCode` in response

### Phase 7 — Clean Architecture
- All new systems use centralized service layers (no duplication)
- `storageService.ts` — single upload abstraction used by upload route
- `smsService.ts` — single SMS abstraction used by auth route
- `sentry.ts` — single monitoring init used by index.ts entry point
- `rateLimiter.ts` — single rate limit config shared across all routes
- Global error handler added to `app.ts` (catches unhandled Express errors)
- Express `json()` and `urlencoded()` body size raised to 5MB (from default 100kb) to accommodate image data URLs during migration

### Phase 8 — Validation Results
- ✅ `/api/health` — 200 with DB ping latency
- ✅ `/api/healthz` — 200 liveness probe
- ✅ `/api/platform-settings/public` — 200 with 20 settings
- ✅ `/api/auth/request-otp` — 400 (body validation) with rate limiter active
- ✅ `/api/upload` — 401 (auth required)
- ✅ `/api/admin/ai/generate-content` — 401 (auth required)
- ✅ `/api/notifications/stream` — 401 (auth required)
- ✅ Sentry initialized with "SENTRY_DSN not set" log (correct dev behavior)
- ✅ Both workflows running (API + Frontend)
- ✅ Replit dev setup completely unchanged

---

## System Upgrade — 9-Phase Completion (April 2026)

### Phase 1 — Demo Mode System
- `demo_mode` key stored in `platform_settings` DB table (key/value)
- `DemoModeContext.tsx` — reads `demo_mode` from `/api/platform-settings/public` on mount; localStorage cache for offline fallback
- `useDemoMode()` hook exposes `{ isDemoMode, isLoading, toggleDemoMode(enabled) }`
- **Admin Panel → Modules tab**: Demo Mode toggle card (amber when active, shows production vs demo data status)
- `toggleDemoMode()` PUTs to `/api/admin/platform-settings` to persist across sessions

### Phase 2 — Platform Settings DB Migration
- `platformSettingsTable` (key/value) added to `lib/db/src/schema/platform.ts`, exported from schema index
- `artifacts/api-server/src/routes/admin-settings.ts`:
  - `GET /api/admin/platform-settings` — returns all settings (secrets masked unless `?reveal=1`)
  - `PUT /api/admin/platform-settings` — batch upsert key/value pairs
  - `GET /api/platform-settings/public` — unauthenticated endpoint returning safe public keys
- `SettingsContext.tsx` fully migrated from localStorage to DB API: loads on mount, saves via PUT, keeps localStorage as stale cache while loading

### Phase 5 — AI Content Generation (Admin)
- `artifacts/api-server/src/routes/ai-admin.ts`:
  - `POST /api/admin/ai/generate-content` — GPT-4o-mini content generation (name, bio, description, post, hashtags, menu, email, review response)
  - `POST /api/admin/ai/seo-suggestions` — AI-powered SEO title, description, keywords, slug suggestions
- Registered in `routes/index.ts`; uses Replit AI integration (no API key needed)

### Phase 6 — Real-Time SSE Notifications
- `GET /api/notifications/stream` — Server-Sent Events endpoint in `notifications.ts`; sends `unread_count` events every 30s; heartbeat every 25s; auto-cleanup on disconnect
- `useNotificationsStream(enabled)` hook (`artifacts/tabaq/src/hooks/use-notifications-stream.ts`):
  - Opens EventSource to SSE stream when user is logged in
  - Falls back to 30s polling if SSE unavailable or errors
  - Returns `{ unreadCount, isConnected, refresh }`
- `Header.tsx` notification bell now uses SSE hook instead of 60s polling interval

## Platform Settings (`/settings`)

New settings page with 6 sections (sidebar navigation + mobile tab scrollbar):
- **Analytics**: Google Analytics 4 ID, GTM Container ID, Meta Pixel ID — with live active/off status indicators
- **SEO**: Meta title, description (character count), keywords, OG image, Twitter handle, canonical domain
- **Email (SMTP)**: Host, port, email address, password (show/hide), From name
- **SMS Gateway**: Provider (Unifonic, Twilio, MessageBird, Vonage, STC, Mobily), API key, Sender ID
- **Google Maps**: API key with required APIs list
- **Firebase**: All 6 config fields for push notifications

Settings are persisted in **PostgreSQL DB** via `/api/admin/platform-settings` (migrated from localStorage). `SettingsContext.tsx` loads from API on mount; `saveAll()` is now `async` (returns `Promise<void>`).

## Analytics Infrastructure

`AnalyticsInjector.tsx` — dynamically injects scripts based on saved settings:
- **GA4**: Inserts `gtag.js` + init script when `googleAnalyticsId` is set
- **GTM**: Injects GTM snippet + noscript when `googleTagManagerId` is set  
- **Meta Pixel**: Injects Facebook pixel init when `metaPixelId` is set

## SEO Infrastructure (Comprehensive Upgrade)

### `use-page-meta.ts` (fully rewritten)
Supports: `titleEn/Ar`, `descriptionEn/Ar`, `keywords`, `imageUrl`, `type`, `canonical`, `noIndex`, `structuredData[]`.
Injects: canonical `<link>`, hreflang EN/AR/x-default alternates, og:locale, multiple JSON-LD `<script>` tags.

**Named schema builder exports:**
- `buildWebSiteSchema()` — WebSite + SearchAction (SitelinksSearchBox)
- `buildOrganizationSchema()` — Organization + ContactPoint + SameAs
- `buildRestaurantSchema(opts)` — LocalBusiness + AggregateRating + Menu + ReserveAction
- `buildMenuSchema(opts)` — Menu + MenuSection + MenuItem
- `buildArticleSchema(opts)` — Article + Author + Publisher
- `buildBreadcrumbSchema(items)` — BreadcrumbList
- `buildEventSchema(opts)` — FoodEvent
- `buildReviewSchema(opts)` — Review

**Wired to pages:**
- `HomePage` → WebSite + Organization JSON-LD
- `RestaurantDetailPage` → Restaurant + Menu + BreadcrumbList JSON-LD
- `BlogDetailPage` → Article + BreadcrumbList JSON-LD

### SEO API Routes (`artifacts/api-server/src/routes/seo.ts`)
- `GET /api/robots.txt` — dynamic robots.txt with crawl rules and sitemap reference
- `GET /api/sitemap.xml` — dynamic XML sitemap with restaurants, blog, profiles, hreflang
- `GET /api/admin/seo/overview` — stats (total indexed pages, restaurant/blog/profile counts)
- `GET/PUT/DELETE /api/admin/seo/settings` — per-page meta override CRUD

### `seoSettingsTable` (DB schema)
Path-keyed per-page SEO overrides: `metaTitleEn`, `metaTitleAr`, `metaDescriptionEn`, `metaDescriptionAr`, `keywords`, `isIndexed`, `isFollowed`, `sitemapPriority`, `sitemapChangefreq`.

### Admin SEO Dashboard (`AdminSeoTab` in `AdminPanelPage.tsx`)
4-sub-tab panel (Overview / Page Settings / Keywords / Sitemap & Robots):
- **Overview**: SEO score (12-item checklist), 4 stat cards, structured data coverage table
- **Page Settings**: 10 managed pages with per-page meta editor, SERP preview, indexability controls
- **Keywords**: Add/remove/track target keywords with volume + difficulty, AI suggestion chips
- **Sitemap & Robots**: Live view/regenerate sitemap, robots.txt viewer/editor, multilingual SEO status

### `index.html`
Added `<link rel="sitemap" href="/api/sitemap.xml">` for crawler discovery.

## Database Status

Database is seeded with real data:
- 8 restaurants (Nobu, Lusin, Najd Village, Sushi Sama, etc.) — all with `coverImageUrl` (Unsplash, cuisine-appropriate)
- 4 countries, 8 canonical cities (Riyadh=1, Jeddah=2, Dammam=3, Al Khobar=4, Makkah=5, Madinah=6, Abha=7, Tabuk=8)
- Categories, occasions, opening hours, menus, dishes with badge fields
- 6 offers with discount percentages
- 37 restaurant reviews total (16 original + 21 from community users; review_count + avg_rating updated on restaurants)
- 30 experience reviews (3 per experience × 10 experiences) — bilingual, all sub-ratings, verified, avgRating/reviewCount updated
- 12 community users — all with `username` populated (e.g. noura_alrashid, rawan_alharbi, faisal_alsaud)
- 49 follow relationships seeded — realistic social graph; Noura=10 followers, Faisal=8, Lama/Rawan=6 each
- 10 bookings, 6 contracts, 8 transactions, 4 invoices
- **10 food experiences** with time slots (6 each) — IDs 1-10, status=active:
  - EXP-001: Private Chef Wagyu Dinner — Riyadh, SAR 450, fine_dining
  - EXP-002: Omakase Sushi Masterclass — Riyadh, SAR 280, cooking_class
  - EXP-003: Desert Starlight Dining Al Ula — SAR 650, outdoor
  - EXP-004: Levantine Mezze & Bread Workshop — Jeddah, SAR 195, cooking_class
  - EXP-005: Dammam Corniche Seafood Grill — Dammam (cityId=3), SAR 220, outdoor
  - EXP-006: Makkah Heritage Dates & Qahwa — Makkah (cityId=4), SAR 145, cultural
  - EXP-007: Madinah Traditional Feast — Madinah (cityId=5), SAR 260, heritage
  - EXP-008: Jeddah Rooftop Dinner Red Sea — Jeddah, SAR 380, fine_dining
  - EXP-009: Riyadh Kabsa & Mandi Masterclass — Riyadh, SAR 240, cooking_class
  - EXP-010: Diriyah Night Street Food Walk — Riyadh, SAR 165, street_food
  - Seed script: `pnpm --filter @workspace/scripts run seed-experiences`
- **7 catering packages** across 4 restaurants: Najd Village (Heritage Iftar Buffet + Najdi Feast), Lusin (Prestige Gala Dinner + Executive Business Lunch), Sushi Sama (Omakase Buffet), Spice Route/Jeddah (Red Sea Seafood Banquet + Corniche Wedding Package); menus IDs 3-6 (type=catering/buffet)
- **12 users total** — user 1 (admin/Food Explorer), user 2 (blank), users 3-12 (community):
  - 3: Noura Al-Rashid, Master Chef, 3200pts — 4: Faisal Al-Saud, Food Critic, 2800pts
  - 5: Lama Al-Otaibi, Food Critic, 2100pts — 6: Sultan Al-Ghamdi, Food Critic, 1650pts
  - 7: Rawan Al-Harbi, Gourmet, 1420pts — 8: Ahmed Al-Dosari, Gourmet, 1180pts
  - 9: Fatima Al-Zahrani, Enthusiast, 890pts — 10: Khalid Al-Malki, Enthusiast, 720pts
  - 11: Sara Al-Mutairi, Enthusiast, 560pts — 12: Omar Al-Shehri, Explorer, 340pts
- **9 approved restaurant stories** across 6 restaurants (IDs 1,2,3,4,7,8) — powers the stories strip in FeedPage

---

## Session 8 — Social System, Notifications & CRM (New)

### DB Tables Added
- `user_notification_prefs` — per-user, per-type notification preferences (enabled, channels CSV)
- `user_interests` — user interest categories (cuisine, dish_type, event, preference)
- `user_mutes` — mute users or restaurants from appearing in feed
- `restaurant_follows.follow_type` — new column: 'all' | 'offers' | 'events' | 'new_dishes' | 'openings'

### API Endpoints Added
- `GET /api/notifications/preferences` — list all 12 notification types with user's enabled/channel settings
- `PATCH /api/notifications/preferences` — bulk update notification preferences
- `GET /api/me/interests` — get user interests with available groups
- `PUT /api/me/interests` — replace all user interests
- `GET /api/me/mutes` — list muted users/restaurants (enriched with names)
- `POST /api/me/mutes/:entityType/:entityId` — mute a user or restaurant
- `DELETE /api/me/mutes/:entityType/:entityId` — unmute
- `PATCH /api/restaurants/:id/follow` — update follow type preference
- `GET /api/analytics/restaurant/:id/overview` — CRM KPIs, booking charts, peak times, follower breakdown
- `GET /api/analytics/restaurant/:id/customers` — CRM customer list with segments (VIP/repeat/new/at_risk)

### Frontend Changes
- **NotificationsPage** — "Settings" slide-out panel with 12 notification types grouped into 4 sections, per-type enable/disable toggle + channel picker (in-app/email/SMS/push). "Interests" slide-out panel with 4 interest groups (cuisine, dish type, experiences, preferences) with multi-select chips.
- **BusinessConsolePage** — New "CRM & Analytics" tab: 8 KPI metric cards, booking-by-day bar chart, peak times list, follower type breakdown, customer segmentation table (VIP/repeat/new/at_risk filter chips), recent bookings with user detail
- **RestaurantDetailPage** — Follow button now opens a dropdown with 5 follow type options (all/offers/events/new_dishes/openings); when following, shows current preference with checkmark + option to change preference or unfollow

### Notification System Intelligence
- Notifications list now respects user's disabled notification types (filters them out from synthesis)

---

## Project Overview

**Tabaq** (طبق) is a comprehensive food and dining platform for the Middle East (primarily Saudi Arabia) with full bilingual Arabic RTL / English LTR support.

Features include:
- Restaurant & dish discovery with smart sort pills (Featured, Top Rated, Trending, New, Award Winners)
- Table reservations with inline waitlist when no slots available
- Exclusive Deals & Vouchers platform (Keeta-level quality):
  - **OffersPage**: Groupon-style cards, filter bar, deal detail with image gallery + tier selector + gift mode + real promo code input with validation + order summary + payment method selector (card/Apple Pay/STC Pay) + terms checkbox + "Complete Purchase" CTA + post-purchase QR display
  - **VouchersPage (Wallet)**: 4 tabs (Active/Used/Expired/Refunded), QR code display for active vouchers, validity progress bar, refund request modal with reason + details
  - **Campaign system**: DB tables for campaigns, options, promo codes, redemptions; full API routes
  - **Campaign Wizard** in BusinessConsolePage: 7-step modal (Basics → Options → Photos → Highlights → Fine Print → Redemption → Review & Submit)
  - **Admin Review Queue, Promo Codes & Settlement** tabs in AdminPanelPage — all three now wire to real APIs (`/api/campaigns?status=submitted`, `/api/promo-codes`, `/api/admin/transactions?status=pending`)
- Gifting system
- **Food Experiences module** (`/experiences`, `/experiences/:id`, `/gift-redeem/:code`):
  - `ExperiencesPage`: filterable/sortable grid+list of experiences (city, category, price range, min rating), sort pills, view toggle, search bar, 12 mock experiences
  - `ExperienceCard`: reusable card (grid + list layouts) with image, title (bilingual), category badge, duration, price/person, rating, city, Book CTA
  - `ExperienceDetailPage`: image gallery with thumbnails, tabbed layout (Overview, Details, Reviews, Policies), sticky booking widget, 3-step booking flow (date/slot/guests → guest details → payment with deposit option), in-page gifting flow with gift card design selector, recipient details, generated gift code
  - `GiftRedeemPage`: beautiful gradient gift card visual, redeem flow
  - Home page "Food Experiences" section with 6 featured cards (horizontal scroll on mobile, grid on desktop) + "Browse all" link
  - "Experiences" nav link added to Header (desktop + mobile) with ChefHat icon
- Social reviews and leaderboard/levels
- Referral & Points System (`/referral`) — unique codes, WhatsApp/Twitter sharing, points history
- Username System — claim @username on profile Settings tab, real-time availability check via `/api/username/check`
- Provider Registration (`/partners/register`) — 5-step wizard: business type, details, contact, owner, plan
- Restaurant business console (`/console`) with overview (contract info panel, refCode display), bookings, **offers** (approval status badges, revision notice, pending count, redemption progress, QR scanner CTA), reviews, menu, **settings tabs** — all dynamic: restaurant name (EN+AR), phone, address, website, refCode pulled live from `/api/me/restaurant`
- Curated collections (`/collections`, `/collections/:id`) — 8 themed restaurant lists
- **Michelin Guide Module** (`/michelin`, `/michelin/:id`):
  - `MichelinPage`: luxury dark (`#0d0d0f`) + gold (`#c9a84c`/amber-400) UI, hero with cinematic background, stats (6 starred, 2 Bib Gourmand, 3 cities), city filter tabs, restaurant cards with star badges, Bib Gourmand section, About Michelin panel
  - `MichelinDetailPage`: hero with MICHELIN STAR badge, "Reserve a Table" modal (date/time/guests/requests), photo gallery with lightbox, chef section, signature dishes, awards/recognition, contact info block
  - `michelin.ts`: 6 starred restaurants (Nobu, The Globe, Li Beirut, Taian Table, Najd Village, Mira) + 2 Bib Gourmand — all with full bilingual data, gallery images, signature dishes, awards, opening hours
  - Michelin Guide nav link added to Header (desktop + mobile) with Award icon
  - **Michelin Teaser on HomePage**: dark card with cinematic background, gold accents, star count stats, mini image previews of top restaurants, CTA button
- **Full Cart & Checkout Flow**:
  - `CartContext` (`/context/CartContext.tsx`): global cart state with addItem/removeItem/updateQty/clearCart, totalItems, totalPrice, currency — wraps entire app via CartProvider
  - **Cart icon in Header**: shopping bag icon with live item count badge (primary red), opens `CartDrawer` on click
  - `CartDrawer.tsx`: slide-in panel from the right — lists all items with qty stepper (trash icon at qty=1), delivery fee calculation (free ≥ SAR 100), subtotal/total breakdown, "Proceed to Checkout" CTA → links to `/checkout`
  - `CheckoutPage.tsx` at `/checkout`: 2-step flow (Details → Payment) + Order Confirmed screen — order mode toggle (Delivery/Pickup/Dine-in), contact form, delivery address, special instructions, 4 payment methods (Card/Apple Pay/STC Pay/Cash), card number/expiry/CVV fields with live formatting, place-order loading state, animated success screen with order number + ETA
  - MenuTab now uses CartContext (items persist across page navigation), floating order bar links directly to `/checkout`
- **Enhanced RestaurantDetailPage** (overview tab sections):
  - Popular Times: animated crowd indicator bar chart showing hourly busyness with current hour highlighted + busy/moderate/quiet label
  - Order Options: dine-in + pickup choice cards
  - Nearby Restaurants: live API list of 3 nearby venues with thumbnails, ratings, distance
  - **Chef's Highlights**: shows top 3 featured dishes from the menu with Crown ("Chef's Choice") or Flame ("Bestseller") badge; falls back to first 3 menu items if no badge flags; links to `/dishes/:id`
  - **Perfect For (Dining Experience Tags)**: 2-column grid of occasion chips (icon + label) e.g. "🌙 Romantic Date", "👨‍👩‍👧 Family Dinner" — sourced from real occasions data
- **Footer — Company column**: replaced Business column with Company column linking to `/about`, `/contact`, `/faq`, `/partners`, `/gold`
- **Luxury Dining section on HomePage**: 2×2 grid driven by `GET /api/restaurants?minRating=4.5&limit=6` (topRated query, first 4 results). Shows real name, cover image, cuisine tag, city, avgRating, reviewCount, and price label derived from `priceTier`. Badge auto-generated from avgRating (≥4.8 → "⭐ Top Rated", else "🍽️ Popular"). Positioned between Michelin Guide teaser and Food Experiences.
- **Upgraded MenuTab**: search bar across all dishes, dietary filter pills (All/Veg/Vegan/Healthy/Halal/Spicy), sort dropdown (Price ↑/↓, Calories ↑), filtering applied to all menu sections — sections hidden when no matches
- Michelin-style award badges (Excellence, Top Rated, Fine Dining, Hidden Gem) on RestaurantCard
- Trending/New indicators on restaurant cards
- Payments and wallet
- Admin CRM with fully live DB data across all tabs: Dashboard (8 real stats incl. Platform Revenue SAR + Gross Volume), **Restaurants**, **Users** (10 seeded community users with levels), **Bookings**, **Reviews** (37 total from real users), **Registrations**, **Contracts** (9 contracts, all payment models), **Finance** (revenue banner with commission/gross/net totals + 32 real transactions + invoices), **Messages**, **Offers** (approve/reject/revision workflow), **Modules** (toggle platform features)
- **Exclusive Deals section on Homepage**: dark violet gradient section with 4 Groupon-style mini deal cards, TABAQ10 promo banner, "View all deals" CTA — pulls from live `/api/offers` with fallback mock data
- **AI Recommendations section on Homepage**: between Tabaq Stars and Curated Collections — calls `GET /api/recommendations` (GPT-powered, with city filter, fallback to top-rated); shows 3 restaurant cards with sparkle badge and bilingual AI-generated reason quotes. Cached with React Query (staleTime: 10 min, gcTime: 15 min) to avoid repeated OpenAI calls. Backend also has 30-min in-memory cache per (city, lang, preferences) key — cache MISS takes ~4s (OpenAI), cache HIT returns in <5ms
- **Leaderboard**: 10 real community users seeded (DB users 3–10: Noura, Faisal, Lama, Sultan, Rawan, Ahmed, Fatima, Khalid) with proper avatars and 21+ seeded reviews — full podium + rising explorers visible

**Pages**: HomePage, DiscoveryPage, CollectionsPage (list + detail), RestaurantDetailPage, DishDetailPage (with Add to Cart: qty stepper, animated Add to Cart button, View Cart link when items in cart), BookingsPage (dual-tab: Tables + Experiences with ExperienceBookingCard), VouchersPage, OffersPage, LeaderboardPage, ProfilePage (with Settings tab + username management), FeedPage (world-class social feed with two-column layout, rich activity cards, trending restaurants/critics/dishes sidebar), NotificationsPage (`/notifications` — grouped notifications with 8 types, filter chips, mark read/dismiss), BusinessConsolePage (`/console`), UserDashboardPage (`/dashboard` — Settings tab has fully functional `PersonalInfoForm` + `NotificationPreferences` with toggle switches), PartnerLandingPage (`/partners`), ProviderRegistrationPage (`/partners/register` — 5-step wizard), ReferralPage (`/referral`), AdminPanelPage (`/admin`), SignInPage, SearchPage, TermsPage (`/terms`), PrivacyPage (`/privacy`), NotFound, **ExperiencesPage** (`/experiences`), **ExperienceDetailPage** (`/experiences/:id`), **GiftRedeemPage** (`/gift-redeem/:code`), **OrdersPage** (`/orders` — 5 mock orders with statuses: placed/preparing/out_for_delivery/delivered/cancelled; animated 4-step progress tracker; expandable item list; reorder button restores items to CartContext; Rate/View Restaurant CTAs; filter tabs All/Active/Completed/Cancelled; active order pulse banner; accessible from Header user dropdown as "My Orders"), **AboutPage** (`/about` — mission/story hero, full-width image, stats bar in primary red, mission+values grid, team section, dual CTA), **FAQPage** (`/faq` — 8 collapsible Q&As in accordion, link to Contact), **ContactPage** (`/contact` — split layout: contact form with name/email/subject/category/message + success state, contact info cards with email/phone/address/hours, quick links panel)

**Profile API**: `PATCH /api/me/profile` — updates `nameEn`, `nameAr`, `email`, `bio`, `avatarUrl` for the authenticated user. Validated email format, handles `email_taken` 409 conflict.

**Experience Bookings API**: `GET /api/me/experience-bookings` — returns user's experience bookings joined with experience title (bilingual), slot date/time, and cover image.

**Saved Restaurants** (full feature): `user_saved_restaurants` DB table; `GET /api/me/saved-restaurants`, `POST /api/me/saved-restaurants/:id`, `DELETE /api/me/saved-restaurants/:id`, `GET /api/me/saved-restaurants/:id` (check status). Dashboard Saved tab now fetches real data with skeleton loading, empty state, unsave button. RestaurantDetailPage has a Bookmark/BookmarkCheck save toggle button for logged-in users.

**Award badge logic** (client-side, `src/lib/awards.ts`):
- Excellence: 4.8+ rating, 30+ reviews
- Top Rated: 4.5+ rating, 15+ reviews
- Fine Dining: fine_dining tier + 4.0+
- Hidden Gem: 4.2+ rating, ≤8 reviews

**Primary Market**: Saudi Arabia / GCC  
**Currency default**: SAR  
**Fonts**: Cairo (Arabic), DM Sans (English body/UI), Sora (English display headings h1/h2 + `.font-display`) via Google Fonts. Sora applied globally to h1/h2 in LTR via CSS; Cairo for all RTL.

**Brand Colors**: Primary = Tabaq Purple `hsl(270 62% 47%)` (~`#7B28C8`) — matches official Tabaq logo. All `bg-primary`, `text-primary`, `border-primary` tokens use this purple. Logo file: `public/images/tabaq-logo.png`.

## Tech Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Routing**: Wouter
- **Data fetching**: React Query (@tanstack/react-query)
- **API client**: Auto-generated from OpenAPI spec via Orval
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle for API), Vite (frontend)
- **Animations**: Framer Motion

## Key Design Decisions

- User level titles: Food Explorer (0-99pts), Food Enthusiast (100-499), Gourmet (500-1499), Food Critic (1500-4999), Master Chef (5000+)
- Price tier enum: `budget | mid | upscale | fine_dining`
- Booking reference format: `TBQ-XXXXXXXX`
- Voucher code format: `VCH-XXXXXXXXXX`
- ID generation: `nanoid` (in api-server)
- Auth: OTP-based auth via phone/email — users get JWT token stored in `localStorage` under key `tabaq_token`; all authenticated API calls use `getAuthHeaders()` from `@/lib/api` which reads the token and returns `{ 'Content-Type': 'application/json', Authorization: 'Bearer <token>' }`; api-client-react hooks use `setAuthTokenGetter` configured in `AuthContext.tsx`
- No pop-up modals anywhere — all interactions (booking, reviews, vouchers, sign-in) are inline on the page
- Sign-in: dedicated `/signin` full-page route (no modal), accessed via Header button or Link
- Booking: inline "Book" tab in RestaurantDetailPage (BookingSection component)
- Reviews: inline InlineReviewComposer component at top of Reviews tab
- Vouchers: inline expandable OfferCard on the Offers page (no modal)
- RestaurantDetailPage: 5 tabs — Menu, Book, Reviews, Photos, Info

## Monorepo Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express 5 API server (port from PORT env)
│   └── tabaq/              # React+Vite frontend (previewPath: "/")
├── lib/
│   ├── api-spec/           # OpenAPI spec (openapi.yaml) + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks + fetch client
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json      # Shared TS options (composite, bundler, es2022)
├── tsconfig.json           # Root TS project references
└── package.json
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. Always typecheck from the root:

```bash
pnpm run typecheck    # tsc --build --emitDeclarationOnly
pnpm run build        # typecheck + build all packages
```

## Key Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. 

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App: `src/app.ts` — CORS, JSON parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts all sub-routers:
  - health, countries, categories, restaurants, dishes, menus, bookings, offers, reviews, users, search, events
  - referrals (`/me/referral`, `/referrals/use`)
  - username (`/username/check`, `/me/username`)
  - stories (`/restaurants/:id/stories`, `/admin/stories`)
  - admin-stats (`/admin/stats`, `/admin/modules`, `/admin/modules/:id`)
  - admin-offers, admin-referrals, addresses
  - users also has `/me/points/history`
- Depends on: `@workspace/db`, `@workspace/api-zod`

### `artifacts/tabaq` (`@workspace/tabaq`)

React + Vite frontend. Full bilingual RTL/LTR support.

- Language stored in `localStorage`, `dir="rtl"` on html when Arabic
- Pages: Home, Discovery (/restaurants), Restaurant Detail, Dish Detail, Offers, Leaderboard, Profile, Search, 404
- Components: RestaurantCard, DishCard, Header, Footer, various UI primitives (shadcn/ui)

### `lib/db` (`@workspace/db`)

Drizzle ORM with PostgreSQL. Schema files:

- `countries`, `cities` — location data
- `users` — profiles, username, referralCode, points, level, levelTitle
- `restaurants`, `restaurant_categories`, `restaurant_occasions`, `opening_hours`, `restaurant_follows`
- `categories`, `occasions`
- `menus`, `menu_sections`, `dishes` — dishes have: allergens (jsonb), prepTimeMinutes, isTabaqStar, isMostOrdered, isHealthy, isDairyFree, isNutFree, spiceLevel
- `restaurant_stories` — user-submitted photos/videos, status (pending/approved/rejected), admin approval workflow
- `bookings`
- `offers`, `vouchers`
- `reviews`, `review_likes` — reviews have expert mode fields: isExpertReview, ratingPresentation, ratingIngredients, ratingTechnique, ratingCreativity, ratingPortionSize
- `events`
- `loyalty` — pointsTransactionsTable, referralConversionsTable
- `platform` — platformModulesTable (feature flags with enable/disable)

Run schema push: `pnpm --filter @workspace/db run push` (or `push-force` for non-interactive)

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec covering all domains. Run codegen:

```bash
pnpm --filter @workspace/api-spec run codegen
```

Output goes to `lib/api-client-react/src/generated/` and `lib/api-zod/src/generated/`.

## Development Workflows

- **API Server**: `pnpm --filter @workspace/api-server run dev` (builds then starts on PORT)
- **Frontend**: `pnpm --filter @workspace/tabaq run dev`
- **DB push**: `pnpm --filter @workspace/db run push`
- **Codegen**: `pnpm --filter @workspace/api-spec run codegen`

## Feature Status

All core features COMPLETE and world-class:

- **Foundation & Core Infrastructure** — COMPLETE
- **Authentication & User System** (OTP, username, levels, points) — COMPLETE
- **Restaurant & Dish Discovery** (smart sort, awards, collections, stories) — COMPLETE
- **Bookings, Offers & Vouchers** (inline booking, QR/barcode, gift mode) — COMPLETE
- **Social Community & Reviews** (feed, comments, expert ratings) — COMPLETE
- **Restaurant Business Console** (`/console`) — COMPLETE
- **Payments, Wallet & Referral** (real API, points history, share) — COMPLETE
- **Admin Dashboard & CRM** (live stats, module management, offers) — COMPLETE
- **Username System** (real-time availability check, @handle claiming) — COMPLETE
- **Provider Registration** (5-step wizard, business types, plan selection) — COMPLETE
- **Restaurant Stories** (user-submitted photos/videos, admin approval, community grid) — COMPLETE (DB + API + frontend tab)
- **Enhanced Dish System** (Tabaq Star spotlight, Most Ordered scroll, allergen chips, spice flames, prep time, dietary badges) — COMPLETE (DB + API + frontend MenuTab)
- **Expert Critic Reviews** (dual-mode composer: Regular / Critic with professional subcriteria) — COMPLETE
- **Experiences Provider Module** (`/providers/register`, `/console/experiences`) — COMPLETE
  - Provider registration multi-step form (5 steps: host type, business info, sample experience, pricing/availability, media & review)
  - Provider route guard with pending approval status page
  - Experiences management list with status badges, bookings count, rating, edit/publish/delete actions
  - Full create/edit experience form (bilingual EN/AR fields, all required fields, gallery uploader)
  - Availability & slot management (add one-off slots with date/time/capacity, monthly calendar-style list)
  - Bookings management with accept/reject actions
  - Analytics dashboard with bar chart (revenue), line chart (bookings trend), top experiences table
  - Reviews with provider response submission
  - DB schema: `experience_providers`, `experiences`, `experience_slots`, `experience_bookings`, `experience_reviews`
  - API routes: `POST /provider-applications`, `GET/POST /providers/me`, experiences CRUD, slots, bookings, analytics, reviews
  - Additional DB tables: `experience_gifts`, `experience_commissions`, `experience_settings`, `provider_applications`
  - Auth fix: all fetch calls in ExperiencesConsolePage and ProviderRegisterPage use `getAuthHeaders()`
  - Schema corrected: `experience_bookings` uses `isDepositPaid: boolean("deposit_paid")` and `isFullPaid: boolean("full_paid")` matching actual DB columns; duplicate `ref_code` column removed
- **Task #2** (Experiences consumer frontend) — COMPLETE: ExperiencesPage (/experiences), ExperienceDetailPage (/experiences/:id), GiftRedeemPage (/gift-redeem/:code), ExperienceCard component; Header nav updated with Experiences link; seed data added (4 experiences, 6 slots each); category labels fixed (outdoor/cooking_class); slots API fixed to return array (not `{ slots: [...] }`)
- **Task #4** (Experiences admin controls) — IN PROGRESS
- **Task #5** (City & neighborhood filter) — COMPLETE: Added `neighborhood_id` int column to `restaurants` table (schema pushed); seeded neighborhood IDs for all 8 restaurants (Riyadh IDs 101-108, Jeddah 202); `/api/restaurants` and `/api/restaurants/featured` now accept `neighborhoodId` query param and filter by it; `HomePage` queries now pass `selectedNeighborhoodId` via `nbQuery`/`locQuery` alongside `cityId`, with a combined `locKey` cache key ensuring React Query refetches when neighborhood changes
- **Task #9** (AI Features, SEO & Multilingual) — PENDING

## Recent Audit Fixes (Production Polish Session)

- **Broken `/discovery` links** — Fixed 2 broken links in UserDashboardPage (Saved tab "Discover More" + empty state CTA) that pointed to nonexistent `/discovery`; corrected to `/restaurants`
- **Arabic cuisine tags** — API now returns `cuisineTypesAr: string[]` alongside `cuisineTypes: string[]` in `/api/restaurants`, `/api/restaurants/featured`, and `/api/search`. `RestaurantCard` and `DiscoveryPage` top-rated section now use `cuisineTypesAr` in Arabic mode (shows "ياباني", "مأكولات بحرية" instead of "Japanese", "Seafood")
- **OffersPage filter bilingual** — `CATEGORIES`, `CITIES`, `SORT_OPTIONS` converted from `string[]` to `{en, ar}[]`; filter chips and dropdowns now show Arabic labels in Arabic mode while maintaining English values for internal filtering logic
- **Search URL param fix** — `SearchPage` now reads `window.location.search` instead of wouter's `useLocation()` which doesn't include query strings; `/search?q=sushi` now pre-fills the search box and shows results immediately
- **addresses.ts TypeScript** — Fixed "not all code paths return a value" and `string | string[]` type errors; use `res.status(); return;` pattern and `req.params['id'] as string` casting
- **admin-finance.ts TypeScript** — Fixed all `return res.status()` early returns in async route handlers across contracts, transactions, invoices, and messages routes
- **Experiences admin tab** — Added full "Experiences" tab to AdminPanelPage with two sub-sections: (1) Provider Applications list (approve/reject workflow) and (2) All Experiences list (activate/suspend/set-pending controls); sidebar badge shows pending application count; queries: `GET /api/admin/experiences`, `GET /api/provider-applications`; mutations: `PATCH /api/admin/experiences/:id/status`, `PATCH /api/provider-applications/:id`
- **Functional header city picker** — Replaced hardcoded "Riyadh" button in Header with an interactive dropdown city picker. Fetches cities from `/api/countries/1/cities`, shows a popover dropdown, navigates to `/restaurants?cityId=X` on selection, persists selected city to localStorage, reflects URL-based city selection, closes on outside click
- **Dynamic SEO page titles** — Created `usePageMeta` hook (`src/hooks/use-page-meta.ts`) that sets `document.title`, `<meta name="description">`, and Open Graph tags dynamically per page. Applied to: HomePage, DiscoveryPage, ExperiencesPage, OffersPage, SearchPage, RestaurantDetailPage (uses actual restaurant name when data loads)
- **index.html meta tags** — Added full static meta suite: `<meta name="description">`, keywords, robots, theme-color, Open Graph (og:title, og:description, og:image, og:locale with ar_SA + en_US), Twitter Card (summary_large_image)

## Session 12 — Instagram-style Food Stories on FeedPage

### Overview
Added a complete Food Stories system to FeedPage — the premium social feature common to every top food platform (Zomato, TripAdvisor). This is the biggest visual upgrade to the feed since it was created.

### `StoriesStrip` component (in FeedPage.tsx)
- Horizontally scrollable row of story ring avatars — first item is always "Your Story" with a + icon overlay
- Gradient ring (red→orange→yellow) for unseen stories; gray ring for already-seen stories
- Restaurant stories have an "R" badge in the bottom corner
- User stories show their emoji badge (👑, 🍽️, ⭐, 🌱, 🌿, 🔥)
- Each ring is labeled with first name below the avatar
- "Your Story" redirects to profile check-in flow on click
- Clicking any other ring opens the StoryViewer full-screen overlay

### `StoryViewer` component (in FeedPage.tsx)
A production-quality full-screen story viewer:
- **Progress bars** — one per story in the group, auto-fills over 6 seconds then advances
- **Auto-advance** — timer pauses on mousedown, resumes on mouseup (hold to pause)
- **Tap navigation** — tap left 35% to go back, right 65% to advance
- **Keyboard** — Escape to close, ArrowLeft/ArrowRight to navigate
- **Desktop side arrows** — ChevronLeft/ChevronRight buttons hidden on mobile
- **Cross-group navigation** — advances to next story group automatically
- **Story type badge** — colour-coded pill showing "Check-in / تسجيل وصول", "Dish Spotlight / طبق مميز", "Offer / عرض", "Event / حدث", "New Menu / قائمة جديدة", "Recommendation / توصية"
- **Caption text** — bilingual, line-clamped to 4 lines
- **Location pill** — shows location pin + restaurant name (if check-in)
- **Dish/price pill** — shows dish name and SAR price (if dish_spotlight)
- **Restaurant CTA button** — "View [Restaurant Name]" links to `/restaurants/:id` and closes viewer
- **Reply input** — expands inline; pauses auto-advance while typing
- **Heart button** — per-story like toggle (red fill when liked)
- **Share button** — positioned alongside heart
- Gradient overlays: dark-to-transparent from top (for progress bars), dark-to-transparent from bottom (for content)
- Background: full-bleed cover image per story
- "Seen" status: closing the viewer marks the opened group as seen (gray ring thereafter)

### Story Data (`MOCK_STORY_GROUPS`)
7 story groups covering all types:
1. **Your Story** (me, "+" add prompt)
2. **Noura** (👑) — 2 stories: Reem Al-Bawadi check-in + Mezze dish spotlight
3. **Faisal** (🍽️) — 1 story: Sushi Sama recommendation
4. **Nobu** (restaurant, R badge) — 2 stories: Spring Omakase new menu + Black Cod Miso dish spotlight
5. **Lama** (⭐) — 1 story: Kunafa dish spotlight
6. **Zuma** (restaurant, R badge, seen) — 1 story: Chef's Table event announcement
7. **Sultan** (🌱, seen) — 1 story: Organic brunch check-in

### Story Types & Colors
| Type | Gradient | Icon |
|---|---|---|
| `checkin` | rose→orange | MapPin |
| `dish_spotlight` | amber→yellow | Utensils |
| `offer` | green→emerald | Tag |
| `event` | violet→purple | Sparkles |
| `new_menu` | blue→cyan | Eye |
| `recommendation` | pink→fuchsia | Star |

### Integration in FeedPage
- StoriesStrip inserted at the very top of the main feed column, above QuickShareCTA and tabs
- StoryViewer is rendered as a sibling of the main page div (full-screen fixed overlay)
- Non-"me" story groups are passed to the viewer (me ring is excluded from viewer)
- `viewerStartIndex` correctly maps from group list index to viewer array index
- Fully bilingual: all captions, type badges, placeholders, CTAs in AR/EN

## Session 11 — Comprehensive Profile System

### New DB Schema (`lib/db/src/schema/profile.ts`)
5 new tables pushed to production:
- **`user_check_ins`** — User visits/check-ins with restaurant, date, time, party size, notes, companion names, isPublic
- **`visit_plans`** — Future visit plans with title, restaurant (optional), planned date, notes, priority (low/medium/high), status (active/completed/cancelled), theme label, reminder toggle
- **`user_recommendations`** — Restaurant or dish recommendations with bilingual notes, visibility toggle
- **`saved_dishes`** — User's saved/favourite dishes (unique per user+dish)
- **`content_privacy`** — Per-content-type visibility settings (visits, reviews, favorites, activity, plans, recommendations) with values: public/followers/only_me

### New API Routes (`artifacts/api-server/src/routes/profile.ts`)
12 new endpoints wired into the main router:
- `GET/POST /api/me/checkins` · `DELETE /api/me/checkins/:id`
- `GET/POST /api/me/plans` · `PATCH/DELETE /api/me/plans/:id`
- `GET/POST /api/me/recommendations` · `DELETE /api/me/recommendations/:id`
- `GET /api/me/saved-dishes` · `POST/DELETE /api/me/saved-dishes/:dishId`
- `GET/PUT /api/me/content-privacy`
- `GET /api/me/blocked-users`

### ProfilePage Overhaul (`artifacts/tabaq/src/pages/ProfilePage.tsx`)
Complete rewrite from 4 tabs (915 lines) to 10 tabs (~900 effective lines of new logic):

**Tab 1 — Overview**
- 4 quick-action buttons: Log Visit, Write Review, Add Plan, Recommend
- 4 food-journey stat cards: Restaurants Visited, Reviews Written, Places Saved, Recommendations
- "Your Top Cuisines" horizontal bar chart (computed from check-in history)
- Recent Activity mini-feed (last 3 events) with link to full Activity tab
- Upcoming Plans preview card (active plans count + first 2 items)

**Tab 2 — Visits** (Check-in History)
- "Log Visit" button opens `CheckInDialog` — picks restaurant, date, time, party size, companions, notes
- Timeline of all check-ins: restaurant photo, name, date/time, party size, companion names, italic notes
- Per-card delete button

**Tab 3 — Reviews**
- Filter pills: All / Restaurants / Dishes
- Review cards: restaurant photo, name, star ratings, dish name (if dish review), review text, sub-ratings (food/service/ambiance), like count, visit date

**Tab 4 — Favourites**
- Toggle: Saved Restaurants | Saved Dishes
- Restaurants: 2-col photo grid with unsave heart button
- Dishes: list cards with dish image, name, restaurant, price, unsave button

**Tab 5 — Plans**
- "Add Plan" button opens `PlanDialog` — title, restaurant (optional), date, priority, theme label, notes, reminder toggle
- Active Plans section with priority badge, theme pill, date, reminder indicator, ✓ complete + delete actions
- Completed Plans section (greyed out, strikethrough title)

**Tab 6 — Recommendations**
- 2-col grid cards: restaurant cover photo, cuisine, dish name (if dish rec), bilingual note, date, share + delete actions
- Empty state with CTA

**Tab 7 — Activity** (existing, enhanced with check_in + bookmark event types)

**Tab 8 — Followers** (existing + block button per follower)

**Tab 9 — Following** (existing, unchanged)

**Tab 10 — Settings** (completely overhauled)
- **Account Privacy** — private/public toggle (existing, polished)
- **Content Visibility** — per-type picker (6 content types × 3 visibility options, saved to API)
- **Username** — existing debounced check + save
- **Blocked Users** — live list of blocked users with Unblock button (calls DELETE /api/users/:id/block)
- **Notification Preferences** — link to /notifications
- **Account** — Points History + Referral Programme links

### Inline Components (defined inside ProfilePage.tsx)
- `CheckInDialog` — full form modal for logging visits
- `PlanDialog` — full form modal for creating visit plans
- `EditProfileDialog` — modal for editing name + bio (calls PATCH /api/me/profile)
- `PrivacyCard` — account-level private/public toggle
- `StarRow` — reusable star rating display
- `EmptyState` — reusable empty state with icon, title, subtitle, action slot
- `PriorityBadge` — colored badge for plan priority

### Mock Data (for unauthenticated preview)
Rich mock data for all 6 new sections: MOCK_CHECK_INS (5 visits), MOCK_REVIEWS (4 reviews), MOCK_SAVED_RESTAURANTS (4), MOCK_SAVED_DISHES (4), MOCK_PLANS (4 with mixed status), MOCK_RECOMMENDATIONS (3 with dishes)

## Session 10 — Share Modal + Rate Your Last Visit

### ShareModal (`src/components/ShareModal.tsx`)
- Full-screen backdrop + bottom-sheet on mobile / centered modal on desktop
- Shows a **restaurant card preview**: cover image + gradient overlay, name, cuisine, city, URL preview, star rating
- Three share actions: (1) **Copy link** — clipboard API with green checkmark feedback; (2) **WhatsApp** — `wa.me/?text=` deep link with bilingual message; (3) **Native share** — wraps `navigator.share()` for mobile, only shows if supported
- Keyboard accessible (Escape closes), body scroll locked while open, RTL/LTR aware
- Wired into `RestaurantDetailPage.handleShare` — every restaurant's مشاركة button now opens this modal

### RateLastVisitSection (`src/pages/HomePage.tsx`)
- Inserted in `HomePage` between "Order Again" and "Occasions" sections
- Fetches real completed bookings from `/api/bookings` when user is logged in; falls back to 4 mock visits (Nobu, Nusr-Et, La Petite Maison, Zuma) for anonymous visitors
- Each card shows: cover photo, visit date + party size overlay, restaurant name, cuisine, **interactive 5-star inline rating** (hover effect, click to set), "Write Review" / "Submitting…" button
- Cards auto-dismiss after rating is submitted (600ms delay)
- Per-restaurant dismiss via ×, stored in `localStorage` key `tabaq_dismissed_rate`
- Header links to `/bookings`; when all cards dismissed the section disappears

## Production Polish — Session 3

- **"New Openings" section on HomePage** — 3-column grid (limit=6) between Featured Restaurants and Top-Rated rankings. Driven by real `GET /api/restaurants?limit=6&sortBy=newest` API query. Each card uses `RestaurantCard` with `isNew: true`. Shows skeleton loader while fetching. Section hidden when no results returned.
- **"Restaurant of the Week" cinematic hero on HomePage** — Full-bleed section showing the highest-rated restaurant (`topRated.data?.restaurants[0]`). Renders real `nameEn/Ar`, `coverImageUrl`, `cuisineTypes`, `cityNameEn/Ar`, `avgRating`, `reviewCount` from the API. Skeleton loading state included. CTA links to real `/restaurants/:id`. Removed fake critic quote, fake review count (734), and fake signature dishes from the old `RESTAURANT_OF_THE_WEEK` const.
- **Luxury Dining / Restaurant of the Week / New Openings all converted to real API data** — `RESTAURANT_OF_THE_WEEK` const (IDs 7 with fake 734 reviews), Luxury Dining hardcoded array (IDs 1,2,5,3 with fake 1240/980/1580/2100 reviews), and `NEW_OPENINGS` const (fake IDs 10-15) are all deleted. All three sections now use `topRated`/`newest` query data with skeleton loaders and empty-state handling.
- **Chef Profile section in RestaurantDetailPage** — "Meet the Chef / تعرف على الشيف" card in the Overview tab, inserted after About and before Chef's Highlights. Shows chef photo, name (bilingual), title, specialty, bio (line-clamp-3), years experience, awards count, and Michelin stars (Award icons). `CHEF_DATA` record keyed by restaurant ID (IDs 1–5). Chefs: Abdullah Al-Ghamdi (Najd Village, 18yr), Nora Al-Rasheed (Lusin, 14yr, 1⭐), Kenji Watanabe (Sushi Sama, 20yr), Marcus Sinclair (Nobu, 22yr, 2⭐), Andrei Constantin (The Globe, 16yr, 1⭐). Requires `Award` from lucide-react (added to imports).
- **"Pairs Well With" section in DishDetailPage** — 3-card grid before Reviews. Shows curated drink, side, and dessert pairings with color-coded category pills (blue=Drink, green=Side, amber=Dessert). Three rotating pairing sets (`DISH_PAIRING_SETS`) selected by `numericId % 3`. Pairings include: Saudi Coffee + Hummus + Umm Ali, Mint Lemonade + Mixed Salad + Baklava Trio, Rose Jallab + Stuffed Grape Leaves + Maamoul Cookies. Uses new `Sparkles` icon (added to imports).

---

## Session N — Spec Completion: Advanced Reservations, Blog Hub, Menu Badges, Leaderboard Profiles, Admin Menus

### T001–T002: DB Schema + API Updates (previously completed)
- `bookings.ts`: Added `tableType` enum (indoor/outdoor/vip/window_seat), `preOrderItems` jsonb, `waitlistTable`
- `menus.ts`: Added `isBestseller`, `isChefChoice`, `isNewItem`, `discountPercentage`, `galleryImages` to dishes; added `catering`/`home_kitchen` menu types; added `menuPackagesTable`
- `blog.ts`: New schema with `blogCategoriesTable`, `blogPostsTable`
- API routes: menus.ts full CRUD, blog.ts full CRUD, bookings.ts waitlist + crowd prediction + suggested times

### T003: Advanced Reservation (RestaurantDetailPage)
- `tableType` is now passed to the `createBooking` mutation call
- Table type selector UI (Indoor/Outdoor/VIP/Window) was already implemented in RestaurantDetailPage
- Crowd prediction badges on time slots, waitlist join button — already implemented

### T004: Enhanced Menu System
- `MenuTab.tsx`: Added `isBestseller`, `isChefChoice`, `isNewItem`, `discountPercentage`, `galleryImages` to `ExtendedDish` type
- New badge overlays in full card view: Chef's Choice (purple), Bestseller (red/primary), New (green), Discount % (red)
- Compact card view: inline badge row below price
- Discounted price display: shows sale price + strikethrough original
- **Admin Panel**: New "Menu Management" tab — restaurant dropdown selector, collapsible menu/section/dish tree, inline "Add Dish" form with badge checkboxes (Bestseller/Chef's Choice/New/Discount %), delete buttons

### T005: Blog & SEO Hub
- `BlogPage.tsx`: Full bilingual blog listing with hero, category pill filter, search, featured 2-column grid, trending sidebar, tag cloud, newsletter CTA, category sidebar
- `BlogDetailPage.tsx`: Full article view with breadcrumb, author bio card, table of contents sidebar, HTML content rendering via `dangerouslySetInnerHTML`, tag chips, share buttons (Facebook/X/Copy Link), reactions, related posts grid
- Sample articles: 6 bilingual posts (Riyadh restaurants, Saudi coffee culture, chef interview, Jeddah waterfront, Ramadan guide, new openings)
- Routes added to `App.tsx`: `/blog` → `BlogPage`, `/blog/:slug` → `BlogDetailPage`
- Footer updated: "Food Blog / مدونة الطعام" link added

### T006: Leaderboard + Profile Polish
- Leaderboard API (`users.ts`): `username` now included in both all-time and period-based responses
- `LeaderboardPage.tsx`: `username` mapped from API; top-3 cards and "Rising Explorers" list now have clickable avatars + names → `/user/:username`
- PublicProfilePage social links (Instagram/X/TikTok/Snapchat/Website) were already implemented

---

## Session 12 — Final Feature Completion

### T003 Complete: BookingsPage QuickBookPanel
- `BookingsPage.tsx`: Full inline `QuickBookPanel` component with step-by-step flow
  - **Table Type Cards**: Indoor 🪑 / Outdoor 🌿 / VIP Room 👑 / Window Seat 🌆 — visual cards with ring highlight on selection
  - **Date Strip**: 10-day scrollable date bar with weekday + date + month labels
  - **AI Suggested Times**: Purple "Sparkles" banner with recommended time chips (from `/api/restaurants/:id/suggested-times`); star overlay on all-times grid
  - **Crowd Prediction**: Per-slot `getCrowdLevel(hour)` indicator (Low/Moderate/Busy) with colored dot + label; busy warning banner when selected slot is peak time
  - **Waitlist**: "Join Waitlist Instead" button appears when a busy slot is selected; POSTs to `/api/waitlist`; success confirmation
  - **Special Requests**: Optional text input appears once restaurant + time selected
  - **Confirm Button**: POSTs to `/api/bookings` with `restaurantId`, `date`, `time`, `partySize`, `tableType`, `specialRequests`; shows success state + invalidates bookings query
  - **Toggle**: "New Reservation" header button opens/closes the panel inline; "حجز جديد" in AR

### T005 Complete: Blog API Integration Fixed
- `BlogPage.tsx`: `normalizedApiPosts` now maps `categoryNameEn/Ar` → `categoryEn/Ar`, `authorNameEn/Ar` → `authorName/authorAr`, `coverImageUrl` → `coverImage`, adds `trending` threshold at 500 views
- `BlogDetailPage.tsx`: Fixed API response parsing — API returns `{ post, related }`, was incorrectly spreading root object; now extracts `rawApiPost.post` properly; `relatedPosts` array wired to related posts grid with API-first fallback to `RELATED_POSTS`; `formatDate()` now guard-checks for empty/invalid dates; `publishedAt` uses raw ISO string for localization (Hijri date in AR locale)

### Blog Routes in DB (11 posts)
- `top-10-fine-dining-riyadh-2026`, `saudi-coffee-culture-guide`, `chef-kareem-interview-2026`, `explore-jeddah-waterfront-dining`, `ramadan-iftar-top-spots`, `new-restaurant-openings-q1-2026`, `riyadh-hidden-gems-2026`, `best-street-food-jeddah`, `vegan-friendly-restaurants-saudi`, `halal-fine-dining-comparison`, `cooking-classes-riyadh` — all `status='published'`

---

## Session 13 — Spec Audit & Final Feature Gaps

### Confirmed Already Implemented (T001–T006 audit)
- **DB Schema**: `tableTypeEnum`, `waitlistStatusEnum`, `waitlistTable`, `bookingsTable.tableType`, `bookingsTable.preOrderItems`, `menuTypeEnum` (catering/home_kitchen), `menuPackagesTable`, dish flags (`isBestseller`, `isChefChoice`, `isNewItem`, `discountPercentage`, `galleryImages`, `videoUrl`), full blog schema — ALL in place
- **API Routes**: crowd-prediction, suggested-times, waitlist CRUD, blog CRUD, admin menus CRUD (menus/sections/dishes/packages) — ALL in place
- **BookingsPage**: Table type cards, crowd prediction, suggested times, waitlist join — ALL done
- **MenuTab**: Bestseller/Chef's Choice/New/Discount badges — ALL done with visual overlays on both compact and standard cards
- **AdminPanelPage**: Menu Management tab with full CRUD for menus/sections/dishes — done
- **CateringPackagesSection** in MenuTab.tsx: already rendering packages for catering/buffet menus at line 602
- **LeaderboardPage**: Profile links via `/${entry.username}` on all user cards — done
- **PublicProfilePage**: Social media icons (Instagram, TikTok, Snapchat, Website) — done
- **Sitemap link**: `<link rel="sitemap" href="/api/sitemap.xml">` in `index.html` — done

### New: Pre-order Food in BookingsPage (QuickBookPanel)
- Added `preOrderQty` state (`Record<number, number>`) + `showPreOrder` toggle state
- Added `useQuery` fetching `GET /api/restaurants/:id/menus` → extracts up to 10 dishes (skips catering/home_kitchen), sorted bestsellers/chef's choice first
- `preOrderTotal` computed from qty × price
- Collapsible "Pre-order Food (optional)" panel appears when restaurant + time selected
  - Shows dish image, name (bilingual), price, and +/- counter per dish
  - Item count badge on collapsed header when items selected
  - Running total bar at bottom of expanded panel
- `handleBook` now passes `preOrderItems: [{dishId, name, quantity, price}]` to `POST /api/bookings`

### New: Gallery Images in MenuTab Dish Cards
- Added `Camera`, `ChevronLeft`, `ChevronRight` to lucide imports
- Standard (non-compact) dish card now shows:
  - Camera icon + count badge on the main image (bottom-right) when `galleryImages.length > 0`
  - Thumbnail strip below the image (4 thumbnails + "+N more" button)
  - Clicking any thumbnail opens a full lightbox modal (fixed overlay, prev/next navigation, close button, counter)
- Lightbox renders outside the `<Link>` wrapper using `<>` fragment to avoid navigation conflicts
- Works with `e.preventDefault()` + `e.stopPropagation()` pattern consistent with existing CounterButton

## Session — Platform Completion: Remaining Fixes

### DB Schema Additions
- Added `goldPlan text` (nullable), `goldBilling text` (nullable), `goldSince timestamp` (nullable) to `usersTable` — pushed to DB via drizzle-kit push

### New Backend Endpoints
- `GET /api/auth/me/membership` — returns current user's `goldPlan`, `goldBilling`, `goldSince` (requires auth)
- `PATCH /api/auth/me/membership` — updates user's gold plan; `plan` must be `gourmet | elite | explorer | null`; `billing` must be `monthly | annual`; sets `goldSince` when activating

### Bug Fixes
- **campaigns.ts `best_value` sort** — was using `desc(sql\`max_discount\`)` referencing a non-existent column; now uses a proper correlated subquery: `(SELECT MAX(discount_percent) FROM campaign_options WHERE campaign_id = campaigns.id)`
- **OrderTrackingPage** — removed hardcoded `DRIVER` constant (with fake Saudi name/rating/vehicle data); driver card now shows a generic "Driver Assigned" UI with live indicator and contact buttons
- **TabaqGoldPage** — replaced fake `setTimeout` simulation in `confirmUpgrade` with a real `PATCH /api/auth/me/membership` call; fetches current plan via `GET /api/auth/me/membership` and shows "Current Plan ✓" badge on the user's active plan card; shows error message on failure; success modal now says "Plan Activated!" not "Request Submitted"

## Session — Backend Security Hardening & Mock Data Removal

### Backend Security Fixes (all verified with 401 tests)
- `POST /events` — added `requireAuth` (previously unauthenticated)
- `POST/PATCH/DELETE /blog/posts`, `POST /blog/categories`, `GET /admin/blog/posts` — upgraded from `requireAuth` → `requireAdmin`
- `GET/PATCH /admin/stories` — upgraded from `requireAuth` → `requireAdmin`
- `GET/POST/PATCH /promo-codes` — upgraded from `requireAuth` → `requireAdmin`
- `POST /referrals/use` — added `requireAuth`; `newUserId` now comes from `req.auth.userId` (not request body)
- Fixed AI model name: `gpt-5-nano` → `gpt-4o-mini` in `recommendations.ts`

### New Backend Endpoints
- `GET /stories/recent` — returns recently approved stories grouped by restaurant for the Feed
- `GET /users/:userId/stories` — returns approved stories submitted by a specific user (for PublicProfile)

### Frontend Mock Data Removal (connected to real APIs)
- **VouchersPage** — removed `MOCK_VOUCHERS` fallback; shows real empty state when user has no vouchers
- **BlogPage** — removed `SAMPLE_POSTS` fallback; shows real empty state when no blog posts exist
- **FeedPage** — removed `MOCK_STORY_GROUPS`; now fetches `/api/stories/recent`, groups by restaurant, keeps "Your Story" placeholder
- **PublicProfilePage** — removed `generateStories()` fake function; now fetches `/api/users/:userId/stories` and maps to real media

## Session — Comprehensive Account Settings System

### AccountPage (`/account`)
- Unified account hub at `/account` replacing fragmented `/edit-profile` and `/account-settings` pages
- Both old routes now render AccountPage for backward compatibility
- Header user menu links to `/account`
- File: `artifacts/tabaq/src/pages/AccountPage.tsx` (~1640 lines)

**10 sections with real API integrations:**

1. **Personal Info** — name (EN/AR), bio, email, location, avatar upload (FileReader → data URL), social links. PATCH `/api/me/profile`
2. **Security** — Change password (PATCH `/api/me/password`), OTP auth status badge, active session display, sign-out
3. **Preferences** — Language toggle (EN/AR via `useLanguage`), theme (light/dark/system via localStorage), currency preference
4. **Notifications** — 8 notification toggles in 3 groups (Social, Bookings, Rewards). PATCH `/api/me/privacy-settings` with `notificationPrefs`
5. **Privacy** — Profile visibility (public/followers/private), content visibility per section, discovery toggles. PATCH `/api/me/privacy-settings`
6. **Addresses** — Full CRUD for delivery addresses. GET/POST/PUT/PATCH/DELETE `/api/me/addresses`. Fields: label (EN+AR), addressLine1/2, district, city, region, postalCode, contactName, contactPhone. Set-as-default, inline edit/delete. Empty state prompt.
7. **Social (Followers)** — Tab: Followers | Following. Real lists from `/api/users/:id/followers` and `/api/users/:id/following`. Unfollow per user
8. **Membership** — Points + level gradient card, next-level progress bar, referral code copy, Tabaq Gold teaser, points history
9. **Support** — Quick links (FAQ, Contact, About, Privacy, Terms), feedback form with confirmation state
10. **Delete Account** — 3-step flow (warning → type "DELETE" → scheduling confirmation)

**UI Architecture:**
- **Page header**: Avatar, display name, username + profile completion indicator (circular SVG on desktop, progress bar on mobile). RTL-aware back arrow.
- **Desktop sidebar**: Sticky panel with user identity card (avatar + name + email + completion bar + "Complete your profile" CTA) above nav links
- **Mobile**: Collapsible dropdown section selector
- Section headers with icon + description
- Reusable components: `SectionCard`, `ToggleRow`, `FormField`, `Input`, `Textarea`, `SaveBar`, `AddressForm`
- Loading spinners, success states, error messages per section
- Full RTL/LTR support via `lang` prop and `dir` attribute

## Bug Fixes & Content Enrichment (March 2026)

### Critical React Hooks Bug Fixed
- **BlogDetailPage.tsx**: `useMemo` was called after conditional early returns (React hooks ordering violation). Fixed by moving `rawContent` + `useMemo` computations before all early returns.

### Blog Content Enriched (All 6 Posts)
- Arabic content expanded from 160–372 chars to **1000–1250 chars** each (proper HTML with `<h2>`, `<h3>`, `<p>` structure)
- English content enriched for post 1 (1044→1513 chars)
- All 6 posts now have bilingual full-article content with 3–4 headings and multiple paragraphs each

### Duplicate-Key React Warning Fixed (BlogDetailPage.tsx)
- Root cause: `slugify()` strips Arabic characters, producing `""` or `"-"` for all Arabic headings → duplicate `key` props
- Fix: `slugify(text, idx)` now falls back to `heading-${idx}` when the ASCII result is 1 char or fewer
- `parseHeadings()` and `injectHeadingIds()` both pass a sequential `idx` counter to guarantee unique IDs for Arabic headings

## Password Reset & Change Flow (April 2026)

### New Endpoints — `POST /api/auth/password/*`

| Endpoint | Auth | Description |
|---|---|---|
| `POST /auth/password/forgot` | Public | Send OTP to email. Rate-limited: 3/hour per email (DB-level). Always returns safe "check your email" response (no user enumeration). Dev mode returns `devCode`. |
| `POST /auth/password/forgot-via-phone` | Public | Send OTP via SMS. Same rate-limit and safe-response pattern. |
| `POST /auth/password/verify-otp` | Public | Accepts `{email,otp}` or `{phone,otp}`. Verifies hash; 3-attempt lockout voids OTP. On success issues a 10-minute `reset_token` JWT (`type: "password_reset"`). |
| `POST /auth/password/reset` | reset_token | Accepts `{reset_token, new_password}`. Validates token type + expiry; validates password strength; updates hash; revokes **all** refresh tokens for the user; sends confirmation email. |
| `POST /auth/password/change` | Bearer JWT | Accepts `{current_password, new_password}`. Verifies current password; validates strength; updates hash; revokes all refresh tokens; sends confirmation email; writes `PASSWORD_CHANGED` audit log. |

### Infrastructure Added

- **`lib/audit.ts`** — `logAudit()` helper writing to `audit_logs` table. Actions: `PASSWORD_RESET_REQUESTED`, `PASSWORD_RESET_OTP_VERIFIED`, `PASSWORD_RESET_COMPLETED`, `PASSWORD_CHANGED`.
- **`audit_logs` DB table** — schema in `lib/db/src/schema/platform.ts` (`auditLogsTable`). Indexed on `actor_uid` and `created_at`.
- **`services/emailService.ts`** — `sendEmail()` with dev-mode console logging + SMTP from `platform_settings`. Templates: `passwordResetOtpEmail(otp, lang)` and `passwordChangedEmail(lang)` (bilingual EN/AR).
- **`lib/auth.ts`** — `signResetToken(userId, userUid)` (10-min JWT) and `verifyResetToken(token)` (checks `type === "password_reset"`).
- **nodemailer** — installed in `artifacts/api-server`.

### Security Properties
- OTP hash stored (not plaintext); lookup uses hash comparison.
- OTP expiry: 10 minutes; voided after 3 failed attempts.
- Per-email / per-phone rate limit: 3 OTPs per hour (enforced in DB).
- Reset token is single-use (stateless JWT — 10-min TTL).
- All refresh tokens revoked on successful reset (forces re-login on all devices).

## Session Management (April 2026)

### New Endpoints — `GET|DELETE /auth/sessions`

| Endpoint | Auth | Description |
|---|---|---|
| `GET /auth/sessions` | Bearer JWT | List all active (non-revoked, non-expired) refresh-token sessions for the current user. Returns `id`, `device` (parsed UA label), `ip_address`, `last_active`, `created_at`, `expires_at`, `is_current`. |
| `DELETE /auth/sessions/:id` | Bearer JWT | Revoke a specific session by ID. Only the session owner can revoke their own sessions. 409 if already revoked/expired. |
| `DELETE /auth/sessions` | Bearer JWT | Revoke all active sessions for the current user (global sign-out). |

### Supporting changes
- `refresh_tokens` table gained two new columns: `ip_address text` and `last_used_at timestamp` (ALTER TABLE migration applied).
- `buildTokens()` in `auth.ts` now accepts and stores `ipAddress`.
- `POST /auth/refresh` stamps `last_used_at` on the outgoing (rotated) token record.
- `POST /auth/login` and `POST /auth/verify-otp` both pass caller IP to `buildTokens`.
- `PATCH /me/password` (profile.ts) now revokes all refresh tokens and writes a `PASSWORD_CHANGED` audit log — matching the new `/auth/password/change` endpoint.
- Audit actions added: `SESSION_REVOKED`, `ALL_SESSIONS_REVOKED`.
- `parseDeviceLabel(ua)` helper in sessions.ts maps User-Agent strings to friendly names (iPhone, Android phone, Chrome, Firefox, Safari, curl, Postman, etc.).

## Security Settings UI (April 2026)

### AccountPage — Security tab rebuilt with live data

| Card | Before | After |
|---|---|---|
| Change Password | ✅ existed (via `PATCH /me/password`) | Updated to call new `POST /auth/password/change` endpoint |
| Sign-in Methods | Hardcoded "OTP via Phone" badge | **Dynamic** — fetches `/auth/me` and shows badges for each active method: Phone OTP, Email OTP, Password, PIN |
| PIN / Passcode | ❌ missing | **New** — full set/change/remove flow with 4-digit PIN boxes; calls `/auth/passcode/set` and `DELETE /auth/passcode` |
| Active Sessions | Static "Current Device" placeholder | **Live** — fetches `/auth/sessions`; shows device icon, IP, time ago; individual revoke (×) button per session; "Sign Out Everywhere" button |

### Security improvement — `/auth/me` response
- Raw `passwordHash` and `passcodeHash` bcrypt strings are now **stripped** from the response
- Replaced with computed boolean flags: `hasPassword: boolean`, `hasPasscode: boolean`
- Sensitive fields also stripped: `passcodeFailedAttempts`, `passcodeLockedUntil`

### UX details
- `PinBoxes` component: 4 auto-advancing password-type inputs matching the OTP box style
- `getDeviceFingerprint()`: generates a persistent UUID (stored in localStorage) used for passcode registration
- `timeAgo()`: bilingual relative time (EN: "5m ago" / AR: "منذ 5 دقيقة")
- `deviceIcon()`: maps device label to Smartphone / Tablet / Laptop / Wifi icon
- Session rows marked "Current" (first in list = most recent) — that session's revoke button is hidden
- "Sign Out Everywhere" only shown when more than one session exists

---

### Scratchpad
- **All 8 restaurants** have stories (13 total, all `status=approved`)
- **Experiences**: 10 seeded across all 5 Saudi cities (Riyadh×4, Jeddah×2, Dammam×1, Makkah×1, Madinah×1 + bonus Diriyah)
- **Blog heading IDs**: Arabic headings get `heading-0`, `heading-1`, … IDs; English headings get proper ASCII slugs
