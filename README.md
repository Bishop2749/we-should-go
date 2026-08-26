# We Should Go

A collaborative map for friend groups — save the places you keep saying you should go, then actually go.

**Live:** https://we-should-go.vercel.app

Everyone in a group drops pins on a shared map: restaurants, bars, events, hikes, whatever. Friends react to them, mark what they want to try, check off what they've done, and turn a pin into a real plan with a date and an RSVP list. It started from the thing people say constantly and never act on — "we should go there."

## Features

**Map**
- Full-screen Google Map with color-coded, category-based pins
- Google Places autocomplete search
- Tap any Google POI to pull up details and save it in one step
- Geolocation with last-position persistence, custom recenter/zoom controls
- Filter panel: multi-select by neighborhood and category

**Social**
- Google OAuth sign-in via Supabase
- Friend invites — single-use links with 7-day expiry, shareable by link, email, or SMS; friendship is created automatically on first sign-in
- "Want to go" / "Been here" status per person, per place
- 🔥 / ✅ / 💯 reactions, surfaced as badges on the pin itself
- Activity feed of what the group has been adding and doing

**Events**
- Promote a location to a scheduled event with its own page and RSVP tracking
- Calendar view of everything coming up
- Per-event invites

**Curated content**
- A seeded layer of hand-picked LA spots, refreshed from local sources, so a brand-new group lands on a map that already has something on it

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Auth + data | Supabase (Google OAuth, Postgres, row-level security) |
| Maps | Google Maps JavaScript API, Places, Geocoding (`@vis.gl/react-google-maps`) |
| Messaging | Twilio (SMS invites, optional) |
| Hosting | Vercel, auto-deploying from `main` |
| Mobile | React Native / Expo (expo-router) — scaffold |

## Architecture

```
src/
  app/
    map/            # the main experience — map, panels, modals
    event/[id]/     # event detail + RSVP
    invite/[token]/ # invite landing + accept flow
    calendar/       # upcoming events
    login/
    auth/callback/  # Supabase OAuth redirect handler
    api/
      invite/create        # mint a single-use invite token
      events/create
      events/[id]/rsvp
      events/[id]/invite
  components/       # Map, cards, modals, filter + activity panels
  lib/supabase/     # browser and server clients
  proxy.ts          # session refresh on every request
supabase/           # SQL migrations, applied in order
mobile/             # Expo app (separate dependency tree)
```

Auth uses Supabase's SSR helpers: a browser client for interactive work, a server client for route handlers, and `proxy.ts` to keep the session fresh across requests. Invite tokens are single-use rows checked server-side, so an accepted or expired link can't be replayed.

## Running locally

Requires Node 20+.

```bash
npm install
cp .env.example .env.local   # then fill in your keys
npm run dev
```

Set up the database by running the SQL in `supabase/` against a Supabase project, in this order:

1. `schema.sql` — core `locations` table
2. `invites-migration.sql` — invites and friendships
3. `events-migration.sql` — events and RSVPs
4. `social-features.sql` — per-user status and pin reactions
5. `neon-schema.sql` + `neon-seed.sql` — optional curated pin layer
6. `mock-friends.sql` — optional test data

The Google Maps key needs Maps JavaScript, Places, and Geocoding enabled. Restrict it by HTTP referrer before deploying.

### Mobile

The Expo app in `mobile/` is an early scaffold — map view, login, shared Supabase client — and has its own dependency tree.

```bash
cd mobile
npm install
cp .env.example .env.local
npx expo start
```

## Notes

`mobile/` is excluded from the web build via `.vercelignore` and from type-checking via `tsconfig.json`; it's a separate app that happens to live in the same repo.
