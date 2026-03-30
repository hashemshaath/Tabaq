# Tabaq | طبق — Workspace

## Design System (Zomato-Level Upgrade)

- **Font**: IBM Plex Sans Arabic (RTL) + IBM Plex Sans (LTR) — loaded via Google Fonts in `index.css`
- **Primary Color**: `#e23744` (Zomato Red, HSL 355 73% 55%) — used throughout as `--primary`
- **Background**: `#f8f9fb` (page), `#ffffff` (cards)
- **Typography**: H1: 26px/700, H2: 20px/600, H3: 17px/600, H4: 15px/600, Body: 14px
- **Shadows**: `.shadow-elevation-1/2/3/4` utility classes (soft, professional)
- **Spacing**: 8px grid system, `.section-gap` (48px), `.section-gap-sm` (32px)
- **Card hover**: `.card-hover` class with translateY(-1px) + shadow transition

## Platform Settings (`/settings`)

New settings page with 6 sections (sidebar navigation + mobile tab scrollbar):
- **Analytics**: Google Analytics 4 ID, GTM Container ID, Meta Pixel ID — with live active/off status indicators
- **SEO**: Meta title, description (character count), keywords, OG image, Twitter handle, canonical domain
- **Email (SMTP)**: Host, port, email address, password (show/hide), From name
- **SMS Gateway**: Provider (Unifonic, Twilio, MessageBird, Vonage, STC, Mobily), API key, Sender ID
- **Google Maps**: API key with required APIs list
- **Firebase**: All 6 config fields for push notifications

Settings are persisted in `localStorage` key `tabaq_platform_settings` via `SettingsContext.tsx`.

## Analytics Infrastructure

`AnalyticsInjector.tsx` — dynamically injects scripts based on saved settings:
- **GA4**: Inserts `gtag.js` + init script when `googleAnalyticsId` is set
- **GTM**: Injects GTM snippet + noscript when `googleTagManagerId` is set  
- **Meta Pixel**: Injects Facebook pixel init when `metaPixelId` is set

## Enhanced SEO (`use-page-meta.ts`)

Now supports: `keywords`, `imageUrl`, `type` (website/article/restaurant), and `structuredData` for JSON-LD schema.org injection. Also exports `buildRestaurantSchema()` helper.

## Database Status

Database is seeded with real data:
- 8 restaurants (Nobu, Lusin, Najd Village, Sushi Sama, etc.)
- 4 countries, 7 cities (Riyadh, Jeddah, Dammam, Dubai, etc.)
- Categories, occasions, opening hours, menus, dishes
- 6 offers with discount percentages
- 16 reviews (2 per restaurant, ratings updated)
- 10 bookings, 6 contracts, 8 transactions, 4 invoices

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
- **Enhanced RestaurantDetailPage** (6 new sections in overview tab):
  - Popular Times: animated crowd indicator bar chart showing hourly busyness with current hour highlighted + busy/moderate/quiet label
  - Order Options: dine-in + pickup choice cards
  - Nearby Restaurants: live API list of 3 nearby venues with thumbnails, ratings, distance
- **Upgraded MenuTab**: search bar across all dishes, dietary filter pills (All/Veg/Vegan/Healthy/Halal/Spicy), sort dropdown (Price ↑/↓, Calories ↑), filtering applied to all menu sections — sections hidden when no matches
- Michelin-style award badges (Excellence, Top Rated, Fine Dining, Hidden Gem) on RestaurantCard
- Trending/New indicators on restaurant cards
- Payments and wallet
- Admin CRM with fully live DB data across all tabs: Dashboard (8 real stats incl. Platform Revenue SAR + Gross Volume), **Restaurants**, **Users** (10 seeded community users with levels), **Bookings**, **Reviews** (37 total from real users), **Registrations**, **Contracts** (9 contracts, all payment models), **Finance** (revenue banner with commission/gross/net totals + 32 real transactions + invoices), **Messages**, **Offers** (approve/reject/revision workflow), **Modules** (toggle platform features)
- **Exclusive Deals section on Homepage**: dark violet gradient section with 4 Groupon-style mini deal cards, TABAQ10 promo banner, "View all deals" CTA — pulls from live `/api/offers` with fallback mock data
- **AI Recommendations section on Homepage**: between Tabaq Stars and Curated Collections — calls `GET /api/recommendations` (GPT-powered, with city filter, fallback to top-rated); shows 3 restaurant cards with sparkle badge and bilingual AI-generated reason quotes. Cached with React Query (staleTime: 10 min, gcTime: 15 min) to avoid repeated OpenAI calls. Backend also has 30-min in-memory cache per (city, lang, preferences) key — cache MISS takes ~4s (OpenAI), cache HIT returns in <5ms
- **Leaderboard**: 10 real community users seeded (DB users 3–10: Noura, Faisal, Lama, Sultan, Rawan, Ahmed, Fatima, Khalid) with proper avatars and 21+ seeded reviews — full podium + rising explorers visible

**Pages**: HomePage, DiscoveryPage, CollectionsPage (list + detail), RestaurantDetailPage, DishDetailPage, BookingsPage (dual-tab: Tables + Experiences with ExperienceBookingCard), VouchersPage, OffersPage, LeaderboardPage, ProfilePage (with Settings tab + username management), FeedPage (world-class social feed with two-column layout, rich activity cards, trending restaurants/critics/dishes sidebar), NotificationsPage (`/notifications` — grouped notifications with 8 types, filter chips, mark read/dismiss), BusinessConsolePage (`/console`), UserDashboardPage (`/dashboard` — Settings tab has fully functional `PersonalInfoForm` + `NotificationPreferences` with toggle switches), PartnerLandingPage (`/partners`), ProviderRegistrationPage (`/partners/register` — 5-step wizard), ReferralPage (`/referral`), AdminPanelPage (`/admin`), SignInPage, SearchPage, TermsPage (`/terms`), PrivacyPage (`/privacy`), NotFound, **ExperiencesPage** (`/experiences`), **ExperienceDetailPage** (`/experiences/:id`), **GiftRedeemPage** (`/gift-redeem/:code`)

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
- **Task #5** (City & neighborhood filter) — IN PROGRESS
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
