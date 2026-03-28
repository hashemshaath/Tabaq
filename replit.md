# Tabaq | طبق — Workspace

## Project Overview

**Tabaq** (طبق) is a comprehensive food and dining platform for the Middle East (primarily Saudi Arabia) with full bilingual Arabic RTL / English LTR support.

Features include:
- Restaurant & dish discovery with smart sort pills (Featured, Top Rated, Trending, New, Award Winners)
- Table reservations with inline waitlist when no slots available
- Exclusive offers and vouchers
- Gifting system
- Social reviews and leaderboard/levels
- Restaurant business console (`/console`) with overview, bookings, reviews, menu, settings tabs
- Curated collections (`/collections`, `/collections/:id`) — 8 themed restaurant lists
- Michelin-style award badges (Excellence, Top Rated, Fine Dining, Hidden Gem) on RestaurantCard
- Trending/New indicators on restaurant cards
- Payments and wallet
- Admin CRM

**Pages**: HomePage, DiscoveryPage, CollectionsPage (list + detail), RestaurantDetailPage, DishDetailPage, BookingsPage, VouchersPage, OffersPage, LeaderboardPage, ProfilePage, FeedPage, BusinessConsolePage (`/console`), UserDashboardPage (`/dashboard`), PartnerLandingPage (`/partners`), AdminPanelPage (`/admin`), SignInPage, SearchPage, NotFound

**Award badge logic** (client-side, `src/lib/awards.ts`):
- Excellence: 4.8+ rating, 30+ reviews
- Top Rated: 4.5+ rating, 15+ reviews
- Fine Dining: fine_dining tier + 4.0+
- Hidden Gem: 4.2+ rating, ≤8 reviews

**Primary Market**: Saudi Arabia / GCC  
**Currency default**: SAR  
**Fonts**: Cairo (Arabic), DM Sans (English body/UI), Sora (English display headings h1/h2 + `.font-display`) via Google Fonts. Sora applied globally to h1/h2 in LTR via CSS; Cairo for all RTL.

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
- Depends on: `@workspace/db`, `@workspace/api-zod`

### `artifacts/tabaq` (`@workspace/tabaq`)

React + Vite frontend. Full bilingual RTL/LTR support.

- Language stored in `localStorage`, `dir="rtl"` on html when Arabic
- Pages: Home, Discovery (/restaurants), Restaurant Detail, Dish Detail, Offers, Leaderboard, Profile, Search, 404
- Components: RestaurantCard, DishCard, Header, Footer, various UI primitives (shadcn/ui)

### `lib/db` (`@workspace/db`)

Drizzle ORM with PostgreSQL. Schema files:

- `countries`, `cities` — location data
- `users` — user profiles with points and level system
- `restaurants`, `restaurant_categories`, `restaurant_occasions`, `opening_hours`, `restaurant_follows`
- `categories`, `occasions`
- `menus`, `menu_sections`, `dishes`
- `bookings`
- `offers`, `vouchers`
- `reviews`, `review_likes`
- `events`

Run schema push: `pnpm --filter @workspace/db run push`

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

## Task Progress

- **Task #1** (Foundation & Core Infrastructure) — COMPLETE
- **Task #2** (Authentication & User System) — PENDING
- **Task #3** (Restaurant & Dish Discovery) — PENDING
- **Task #4** (Bookings, Offers & Vouchers) — PENDING
- **Task #5** (Social Community & Reviews) — PENDING
- **Task #6** (Restaurant Business Console) — PENDING
- **Task #7** (Payments, Wallet & Referral) — PENDING
- **Task #8** (Admin Dashboard & CRM) — PENDING
- **Task #9** (AI Features, SEO & Multilingual) — PENDING
