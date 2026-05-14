# UrbanServe

A full-featured home services marketplace mobile app (Urban Company clone) built with Expo, Express, and PostgreSQL.

## Run & Operate

- `pnpm --filter @workspace/mobile run dev` — start the Expo dev server (port 18115)
- `pnpm --filter @workspace/api-server run dev` — run the Express API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/db run push` — push database schema changes
- Scan QR code from the preview pane URL bar to test on a physical device via Expo Go

## Required Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (auto-provisioned by Replit) |
| `JWT_SECRET` | Secret key for signing JWTs (set in Replit Secrets) |
| `EXPO_PUBLIC_SUPABASE_URL` | Optional: Supabase project URL (legacy, not required) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Optional: Supabase anon key (legacy, not required) |

## Stack

- **Mobile**: Expo 54, Expo Router (file-based routing), React Native
- **Backend**: Express v5, custom JWT auth (bcryptjs + jsonwebtoken)
- **Database**: PostgreSQL via Drizzle ORM (Replit-provisioned)
- **State**: React Query (@tanstack/react-query) for server state
- **Local fallback**: AsyncStorage when API is unreachable
- **UI**: Custom components, expo-linear-gradient, expo-image, @expo/vector-icons, lucide-react-native
- **Fonts**: Inter (400/500/600/700) via @expo-google-fonts
- **Monorepo**: pnpm workspaces

## Where things live

```
artifacts/
├── api-server/
│   ├── src/
│   │   ├── routes/          # auth.ts, bookings.ts, services.ts, etc.
│   │   ├── middlewares/     # authenticate.ts (JWT verification)
│   │   └── lib/             # auth.ts (bcrypt + JWT helpers)
│   └── build.mjs            # esbuild bundler script
└── mobile/
    ├── app/
    │   ├── _layout.tsx              # Root layout — AuthProvider, QueryClient, fonts
    │   ├── (auth)/                  # Login + Register screens
    │   ├── (tabs)/                  # Main tab screens (Home, Services, Bookings, Profile)
    │   ├── service/[id].tsx         # Service detail screen
    │   └── booking/[serviceId].tsx  # 3-step booking flow
    ├── components/                  # Reusable UI components + Skeleton loaders
    ├── contexts/AuthContext.tsx     # Auth state (signIn / signUp / signOut)
    ├── data/mockData.ts             # Seed/fallback data
    ├── hooks/
    │   ├── useAppData.ts            # useCategories, useServices, useService, useProviders
    │   └── useBookings.ts           # Booking CRUD
    ├── lib/
    │   ├── apiClient.ts             # Axios client with JWT header injection
    │   └── supabase.ts              # Optional Supabase client (graceful no-op if unconfigured)
    └── types/index.ts               # Shared TypeScript interfaces

lib/
├── db/                              # Drizzle ORM schema + PostgreSQL connection
├── api-spec/                        # OpenAPI spec + Orval codegen config
├── api-zod/                         # Generated Zod validation schemas
└── api-client-react/                # Generated TanStack Query hooks
```

## Product

- **Auth**: Email/password via custom Express API; JWT stored in AsyncStorage; 30-day expiry
- **Home**: Personalized greeting, promotional banners, service categories, popular services, top professionals
- **Services**: Searchable + filterable catalog (8 categories, 12 services)
- **Service Detail**: Price, duration, reviews, inclusions, available providers
- **Booking Flow**: 3-step (Date & Time → Address → Confirm); saved to PostgreSQL via API
- **My Bookings**: Upcoming / Completed / Cancelled with cancel/rebook actions; pull-to-refresh
- **Profile**: Name/phone editing; sign out

## Architecture Decisions

- **Custom JWT auth**: Register/login hit `/api/auth/*` on the Express server. Tokens are stored in AsyncStorage and sent as `Authorization: Bearer <token>` on every request.
- **Drizzle ORM**: Schema lives in `lib/db/src/schema/`. Run `pnpm --filter @workspace/db run push` to sync schema to the database.
- **React Query for all server state**: Stale-while-revalidate, automatic retries (2x), pull-to-refresh via `onRefresh`.
- **Skeleton loaders everywhere**: All data-driven screens show shimmer skeletons while loading, not spinners.
- **OpenAPI codegen**: `lib/api-spec/openapi.yaml` is the source of truth. Run `pnpm --filter @workspace/api-spec run codegen` to regenerate Zod schemas and React Query hooks.
- **File-based routing**: Expo Router with `(auth)` and `(tabs)` groups; auth redirect handled in root `_layout.tsx`.

## User Preferences

- Rupee (₹) pricing throughout
- Indian service market data (providers, categories, pricing)

## Gotchas

- `DATABASE_URL` must be set before starting the API server — it throws on missing connection string
- `JWT_SECRET` must be set for auth to work (set in Replit Secrets)
- `EXPO_PUBLIC_` prefix is required for env vars to be available in the Expo bundle
- The Supabase client is optional and only used as a legacy fallback — the app runs fully without it
