# HouseHunt — Property Tracker

## Overview
Mobile app (Expo / React Native + FastAPI + MongoDB) to track and categorize properties for both **home purchase** and **short-term rental** (July). Clean, Apple HIG–inspired light UI.

## User Choices (locked)
- Two sections: **Buy** vs **Rent** (segmented control)
- Status pipeline: To View → Viewed → Liked → Shortlisted → Rejected
- Tracked fields: price (+ /mo for rentals), address, rooms, size, broker (name/phone/email), listing URL, photos, rating, notes, viewing date/time
- Smart feature: **Side-by-side comparison** of favourites (shortlisted + liked)
- Light mode only

## Architecture
- **Backend** `/app/backend/server.py`: single `properties` collection, CRUD at `/api/properties`. Pydantic models exclude `_id`.
- **Frontend** Expo Router:
  - `app/(tabs)/index.tsx` — Properties home (segmented Buy/Rent, status filter chips, cards)
  - `app/(tabs)/compare.tsx` — Side-by-side comparison
  - `app/property/[id].tsx` — Detail (photo gallery, status pipeline, broker call/text/email, rating, notes)
  - `app/property/edit.tsx` — Add/Edit form (photo picker w/ permissions, date picker, keyboard-aware)
  - Shared: `src/theme.ts`, `src/api.ts`, `src/components/*`

## Integrations
- **ScraperAPI** (key in backend `.env` as `SCRAPER_API_KEY`) — used as a fallback in `/api/properties/parse-link`.
- **Import-from-link** flow (`/api/properties/parse-link`):
  1. Fast direct fetch (requests) → parses Property Finder `__NEXT_DATA__` (full structured data) or OpenGraph for generic sites.
  2. If blocked/empty → ScraperAPI with `render=true`.
  3. If still empty → ScraperAPI with `ultra_premium=true` (residential proxies) for hard anti-bot sites (Bayut, Dubizzle).
  - NOTE: Bayut/Dubizzle serve CAPTCHA to datacenter proxies and need ScraperAPI **premium/residential proxies**, which require a PAID ScraperAPI plan. On the free trial plan the premium call returns 403 and the form shows "limited details". Code auto-works once the plan is upgraded — no changes needed.
- **Frontend entry points for import:**
  - Home screen "paste link" shortcut (link icon in header) → opens prefilled form via `prefillUrl` param, auto-runs parse.
  - Add/Edit form "Import from a listing link" card.
- Photos via expo-image-picker stored as base64; remote listing photos stored as URLs. Viewing date via @react-native-community/datetimepicker.
- Currency: AED, formatted manually (consistent on web + native Hermes).

## Status
- MVP complete & fully tested (13/13 backend, all frontend flows green — iteration_1).

## PWA (installable web app)
- `frontend/public/manifest.json` (standalone, theme #000, 3 icons incl. maskable), `public/sw.js` (network-first nav + cache shell, never caches /api), `public/apple-touch-icon.png` + `public/icons/*`.
- `web.output` is "single" (SPA), so `+html.tsx` is NOT applied — PWA tags are injected at runtime via `src/utils/pwa.ts` (`setupPWA()` called in `app/_layout.tsx`). iOS reads the live DOM at "Add to Home Screen", so it's installable on iPhone.
- Verified: manifest link, apple-mobile-web-app-capable/title, apple-touch-icon, theme-color, document title, and SW registration all present in the live DOM.
- Install: deploy via Publish → open the URL in iPhone Safari → Share → Add to Home Screen.

## Notes / Future ideas
- Map view of property locations
- Reminders for scheduled viewings
- Sort by price/rating
