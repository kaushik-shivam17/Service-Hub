# UrbanServe

A full-featured home services marketplace mobile app (Urban Company clone) built with Expo + Supabase.

## Run & Operate

- `pnpm --filter @workspace/mobile run dev` — start the Expo dev server
- `pnpm --filter @workspace/api-server run dev` — run the Express API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- Scan QR code from the preview pane URL bar to test on a physical device via Expo Go

## Required Environment Variables

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public API key |

## Database Setup

Run `artifacts/mobile/supabase/schema.sql` in your Supabase SQL editor (Dashboard → SQL Editor → New query).

This creates all tables, RLS policies, seed data, and the auto-profile trigger.

## Stack

- **Mobile**: Expo 54, Expo Router (file-based routing), React Native
- **Backend**: Supabase (Auth + PostgreSQL)
- **State**: React Query (@tanstack/react-query) for server state
- **Local fallback**: AsyncStorage when Supabase is not configured
- **UI**: Custom components, expo-linear-gradient, expo-image, @expo/vector-icons
- **Fonts**: Inter (400/500/600/700) via @expo-google-fonts
- **Monorepo**: pnpm workspaces

## Where things live

```
artifacts/mobile/
├── app/
│   ├── _layout.tsx              # Root layout — AuthProvider, QueryClient, fonts
│   ├── (auth)/                  # Login + Register screens
│   ├── (tabs)/                  # Main tab screens (Home, Services, Bookings, Profile)
│   ├── service/[id].tsx         # Service detail screen
│   └── booking/[serviceId].tsx  # 3-step booking flow
├── components/                  # Reusable UI components + Skeleton loaders
├── contexts/AuthContext.tsx     # Supabase auth + AsyncStorage fallback
├── data/mockData.ts             # Seed/fallback data
├── hooks/
│   ├── useAppData.ts            # useCategories, useServices, useService, useProviders
│   └── useBookings.ts           # Booking CRUD (Supabase + AsyncStorage fallback)
├── lib/supabase.ts              # Supabase client (graceful no-op if unconfigured)
├── supabase/schema.sql          # Full DB schema + RLS + seed data
└── types/index.ts               # Shared TypeScript interfaces
```

## Product

- **Auth**: Email/password via Supabase Auth; auto-creates user profile on signup
- **Home**: Personalized greeting, promotional banners, service categories, popular services, top professionals
- **Services**: Searchable + filterable catalog (8 categories, 12 services); real-time search against Supabase
- **Service Detail**: Price, duration, reviews, inclusions, available providers
- **Booking Flow**: 3-step (Date & Time → Address → Confirm); saved to Supabase with RLS
- **My Bookings**: Upcoming / Completed / Cancelled with cancel/rebook actions; pull-to-refresh
- **Profile**: Supabase-backed name/phone editing; sign out

## Architecture Decisions

- **Supabase-first with AsyncStorage fallback**: Every data operation tries Supabase if configured, falls back to local storage. This makes the app runnable in offline/demo mode without credentials.
- **React Query for all server state**: Stale-while-revalidate, automatic retries (2x), pull-to-refresh via `onRefresh`.
- **Skeleton loaders everywhere**: All data-driven screens show shimmer skeletons while loading, not spinners.
- **RLS enforced at DB level**: Bookings and profiles are protected; users can only access their own data.
- **File-based routing**: Expo Router with `(auth)` and `(tabs)` groups; auth redirect handled in root `_layout.tsx`.

## User Preferences

- Rupee (₹) pricing throughout
- Indian service market data (providers, categories, pricing)

## Gotchas

- Run `supabase/schema.sql` before testing Supabase features or bookings will fail with a foreign key error
- The app works fully without Supabase keys (mock auth + AsyncStorage) — useful for demos
- `EXPO_PUBLIC_` prefix is required for env vars to be available in the Expo bundle
