# Tabaq | طبق — Workspace

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
  - **Admin Review Queue, Promo Codes & Settlement** tabs in AdminPanelPage
- Gifting system
- Social reviews and leaderboard/levels
- Referral & Points System (`/referral`) — unique codes, WhatsApp/Twitter sharing, points history
- Username System — claim @username on profile Settings tab, real-time availability check via `/api/username/check`
- Provider Registration (`/partners/register`) — 5-step wizard: business type, details, contact, owner, plan
- Restaurant business console (`/console`) with overview (contract info panel, refCode display), bookings, **offers** (approval status badges, revision notice, pending count, redemption progress, QR scanner CTA), reviews, menu, settings tabs
- Curated collections (`/collections`, `/collections/:id`) — 8 themed restaurant lists
- Michelin-style award badges (Excellence, Top Rated, Fine Dining, Hidden Gem) on RestaurantCard
- Trending/New indicators on restaurant cards
- Payments and wallet
- Admin CRM with fully live DB data across all tabs: Dashboard (8 real stats incl. Platform Revenue SAR + Gross Volume), **Restaurants**, **Users** (10 seeded community users with levels), **Bookings**, **Reviews** (37 total from real users), **Registrations**, **Contracts** (9 contracts, all payment models), **Finance** (revenue banner with commission/gross/net totals + 32 real transactions + invoices), **Messages**, **Offers** (approve/reject/revision workflow), **Modules** (toggle platform features)
- **Exclusive Deals section on Homepage**: dark violet gradient section with 4 Groupon-style mini deal cards, TABAQ10 promo banner, "View all deals" CTA — pulls from live `/api/offers` with fallback mock data
- **Leaderboard**: 10 real community users seeded (DB users 3–10: Noura, Faisal, Lama, Sultan, Rawan, Ahmed, Fatima, Khalid) with proper avatars and 21+ seeded reviews — full podium + rising explorers visible

**Pages**: HomePage, DiscoveryPage, CollectionsPage (list + detail), RestaurantDetailPage, DishDetailPage, BookingsPage, VouchersPage, OffersPage, LeaderboardPage, ProfilePage (with Settings tab + username management), FeedPage (world-class social feed with two-column layout, rich activity cards, trending restaurants/critics/dishes sidebar), NotificationsPage (`/notifications` — grouped notifications with 8 types, filter chips, mark read/dismiss), BusinessConsolePage (`/console`), UserDashboardPage (`/dashboard`), PartnerLandingPage (`/partners`), ProviderRegistrationPage (`/partners/register` — 5-step wizard), ReferralPage (`/referral`), AdminPanelPage (`/admin`), SignInPage, SearchPage, NotFound

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
- Auth: OTP-based auth via phone/email — users get JWT token stored in AuthContext
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
- **Task #9** (AI Features, SEO & Multilingual) — PENDING
