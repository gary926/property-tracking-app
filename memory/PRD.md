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
- None (no auth, no third-party APIs). Photos via expo-image-picker stored as base64. Viewing date via @react-native-community/datetimepicker.

## Status
- MVP complete & fully tested (13/13 backend, all frontend flows green — iteration_1).

## Notes / Future ideas
- Map view of property locations
- Reminders for scheduled viewings
- Sort by price/rating
