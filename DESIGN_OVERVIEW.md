# HouseHunt — Property Tracker
## Complete Design Overview & Handoff Brief

_A specification for designers to create high-fidelity designs for every screen and state._

---

## 1. Product Summary

**What it is:** A personal mobile app for tracking and comparing properties during a home search. The user is simultaneously (a) looking to **buy** a home and (b) looking for a short-term **1-month rental** (July). They need one place to log every property they view, categorize it, track its status, remember the broker, keep the listing link, add photos/notes, and compare favourites.

**Primary user:** An individual house-hunter in **Dubai**. Not an agent, not a team — a single person managing a stressful, parallel search.

**Core job-to-be-done:** "Help me remember and decide between all the places I'm seeing, for both buying and renting, without losing track."

**Platforms:**
- iOS & Android (React Native / Expo)
- Installable **PWA** (Add to Home Screen on iPhone) — must look native/full-screen in standalone mode.

---

## 2. Design Intent & Hard Constraints

These are fixed requirements — please design within them:

1. **Aesthetic:** Modern, classy, premium, calm. Inspired by **Apple's Human Interface Guidelines** (iOS system apps: Settings, Health, Wallet). Generous whitespace, grouped cards, soft depth.
2. **Color:** **Blue hues ONLY.** The entire palette is built from shades/tints of blue — deep navy, royal/azure blue, pale blue tints, and blue-tinted neutrals. **No** green/pink/orange/purple/red as accents. Even "neutral" greys must carry a cool blue undertone. Backgrounds are pale blue-white, not pure white/grey.
3. **Currency:** All prices in **AED** (UAE Dirham), e.g. `AED 2,200,000` or `AED 8,000/mo`.
4. **Mode:** **Light mode** only.
5. **Distinguish statuses using blue only:** The 5-stage status system must be visually distinguishable through fill style, darkness, and outline — not through different hues.

---

## 3. Information Architecture

```
App (Bottom Tab Bar)
├── Tab 1: Properties (home)
│     ├── Buy / Rent segmented control
│     ├── Status filter chips
│     ├── Paste-a-link import shortcut
│     ├── Property list (cards)
│     └── → Property Detail
│           └── → Add/Edit (modal)
│     └── → Add/Edit (modal, via + button)
└── Tab 2: Compare
      └── Side-by-side favourites (shortlisted + liked)
```

**Navigation model:**
- **Bottom tab bar** (2 tabs: *Properties*, *Compare*) with a frosted-glass/blur background.
- **Property Detail** pushes as a full screen (slide from right).
- **Add/Edit** presents as a **modal** (slide up from bottom).

---

## 4. Data Model — What a "Property" Contains

Every property record has these fields. Designers should account for all of them (and their empty states):

| Field | Type | Notes / Example |
|---|---|---|
| `type` | Buy or Rent | Determines which tab/section it belongs to |
| `title` | text | Nickname/headline, e.g. "Sunlit Garden Villa" |
| `address` | text | e.g. "Downtown Views, Zabeel 2, Dubai" |
| `price` | number | Shown in AED; may be empty ("Price TBD") |
| `price_period` | Total or /month | Rentals typically show `/mo` |
| `rooms` | text | e.g. "3 bed · 2 bath" or "Studio" |
| `size` | text | e.g. "884 sqft" or "95 m²" |
| `broker_name` | text | e.g. "Sarah Klein" or agency name |
| `broker_phone` | text | Enables Call / Text actions |
| `broker_email` | text | Enables Email action |
| `listing_url` | URL | The online listing; opens in browser |
| `photos` | image list | 0–many; user-added or auto-imported from listing |
| `rating` | 0–5 stars | Personal rating |
| `notes` | long text | Free-form personal notes |
| `viewing_date` | date + time | Scheduled/attended viewing; may be empty |
| `status` | 1 of 5 stages | See below |

### 4.1 Status Pipeline (5 stages, ordered)
`To View → Viewed → Liked → Shortlisted → Rejected`

Suggested blue-only visual language (designers may refine, but keep it blue-only and clearly rankable):
| Status | Meaning | Visual treatment idea |
|---|---|---|
| **To View** | Not seen yet, lowest intent | Outline only (white fill, blue border + text) |
| **Viewed** | Seen it | Soft pale-blue fill, blue text |
| **Liked** | High intent | Solid royal-blue fill, white text |
| **Shortlisted** | Highest intent | Solid **deep navy** fill, white text (feels "premium/locked-in") |
| **Rejected** | Dismissed | Muted ghost chip, blue-grey text, optional strikethrough |

Each status should also have a small **icon** idea (e.g., circle, eye, heart, star, x) rendered in the blue system.

---

## 5. Screen-by-Screen Specifications

> For **every** screen, please deliver: default state, **loading**, **empty**, **error**, and where relevant **filled/long-content** states. Note the safe-area (notch / home indicator) and that the bottom tab bar floats above content.

### SCREEN 1 — Properties (Home) `Tab 1`
**Purpose:** The command center. Browse, filter, and jump into any property; entry point to add.

**Layout regions (top → bottom):**
1. **Header block**
   - Eyebrow label (small uppercase, e.g. "HOUSE HUNT")
   - Large title: **"Properties"**
   - Two circular action buttons top-right:
     - **Paste link** button (link icon) — toggles the import bar
     - **Add** button (+ icon) — the primary FAB-style action (deep navy)
2. **Segmented control:** two segments — **Buy** and **Rent · July** (icons: home / bed). One active at a time.
3. **Paste-a-link bar** (appears when the link button is tapped):
   - Helper line: "Paste a listing link — we'll detect Buy/Rent and fill the details."
   - Text input (URL) + a **Detect** button (sparkle icon)
4. **Status filter chips** (horizontal scroll): `All`, `To View`, `Viewed`, `Liked`, `Shortlisted`, `Rejected` — each shows a **count**. Active chip is filled blue.
5. **Property list** (vertical scroll) of **Property Cards** (see Components §6.1).
6. **Empty state** (see below).

**Interactions:**
- Switching Buy/Rent reloads the list and resets filter to All.
- Tapping a chip filters the list.
- Tapping a card → Property Detail.
- Pull-to-refresh on the list.
- Tapping + → Add/Edit modal (pre-set to current Buy/Rent).
- Tapping Detect → parses the link and opens the Add/Edit modal pre-filled.

**States to design:**
- **Loading:** spinner while list loads.
- **Empty (no properties):** friendly icon + "No homes to buy yet" / "No rentals yet" + subtext + a primary "Add a property" button.
- **Empty (filtered):** "Nothing here yet" + hint to change filter.

---

### SCREEN 2 — Property Detail `pushed`
**Purpose:** Everything about one property; change its status/rating; contact broker; open listing; edit/delete.

**Layout regions (top → bottom):**
1. **Hero photo gallery:** full-width, swipeable, with page dots. Uses a fallback image if no photos.
2. **Floating buttons over hero:** Back (top-left); Edit + Delete (top-right) — circular, frosted.
3. **Content sheet** (rounded top corners, overlapping hero slightly):
   - **Price** (large, in accent blue), **Title**, **Address** (with location pin).
   - **Quick-fact tiles:** Rooms, Size (side-by-side cards with icons).
   - **STATUS** section: horizontal row of the 5 status chips; tapping one sets the status (active chip filled).
   - **Rating card:** editable 5-star rating.
   - **Online listing card:** icon + "Online listing" + URL; opens in browser.
   - **Viewing card:** icon + "Viewing" + formatted date/time (only if set).
   - **Broker section:** avatar with initials + name; action row: **Call**, **Text**, **Email** (only the ones with data).
   - **Notes section:** free-text block.

**Interactions:** change status (instant), change rating (instant), open listing (browser), call/sms/mailto, edit (→ modal), delete (confirm dialog).

**States to design:** loading; property with **no photos** (fallback); minimal property (only title + status, everything else empty — cards for empty fields are hidden); very long notes/title.

---

### SCREEN 3 — Add / Edit Property `modal`
**Purpose:** Create or edit a property. Also the destination of the "paste link" auto-fill.

**Layout regions (top → bottom):**
1. **Modal header:** "Cancel" (left) · Title "New Property" / "Edit" (center) · spacer (right).
2. **Import-from-link card** (highlighted, pale-blue): sparkle icon + "Import from a listing link" + helper text + URL input + a download/submit button. Shows a spinner while parsing.
3. **Type toggle:** To Buy / To Rent (segmented).
4. **Photos row** (horizontal): an "Add" tile (camera icon) + thumbnails, each with a remove (×) badge. Photos come from camera or library.
5. **Details group** (iOS grouped form card): Title, Address, **Price** (+ Total / /mo toggle), Rooms, Size.
6. **Listing group:** Online link (URL).
7. **Broker group:** Name, Phone, Email.
8. **Status:** horizontal selectable chips (5 statuses).
9. **Rating card:** editable stars.
10. **Viewing date row:** opens a date+time picker; shows chosen value with a clear (×) option.
11. **Notes group:** multi-line text.
12. **Sticky bottom bar:** primary **"Add Property"** / **"Save Changes"** button (full-width), stays above the keyboard.

**Interactions:** all standard inputs; keyboard-aware scrolling; photo permission prompts (camera/library) with graceful denial handling; date picker (inline on iOS); import auto-fills fields.

**States to design:** empty new form; parsing (import spinner); import "limited details" notice; edit mode (pre-filled); validation (needs a title or address); saving (button spinner); keyboard-open layout.

---

### SCREEN 4 — Compare `Tab 2`
**Purpose:** Decide between the favourites — a side-by-side comparison of shortlisted + liked properties.

**Layout regions:**
1. **Header:** eyebrow "DECIDE" + title "Compare".
2. **Buy / Rent segmented control.**
3. **Comparison:** horizontally scrolling **columns**, one per favourite. Each column: photo, title, then a stacked attribute list — **Status, Price, Address, Rooms, Size, Rating, Broker, Viewing** (alternating row shading). Tapping a column → that property's Detail.
4. A small hint line: "N favourites · swipe to see more".

**States to design:**
- **Empty (< 2 favourites):** icon + "Shortlist to compare" + "Mark at least 2 homes as Shortlisted or Liked to see them side by side."
- Loading.

---

### GLOBAL — Bottom Tab Bar
- Two items: **Properties** (home icon), **Compare** (swap/arrows icon).
- Frosted-glass/blur background, thin top hairline.
- Active = accent blue; inactive = blue-grey.
- Floats above content (content has bottom padding to clear it).

---

## 6. Component Inventory

### 6.1 Property Card (list item)
- Left: square photo thumbnail (rounded), fallback if none.
- Right column: **Price** (AED, accent blue) + optional inline star rating; **Title**; **Address**; meta line (rooms · size); bottom row: **status badge** (small) + optional viewing date (calendar icon).
- Whole card tappable; card has soft shadow + rounded corners.

### 6.2 Status Badge / Status Chip
- **Badge** (read-only, small): dot + label, styled per status (§4.1).
- **Chip** (interactive, in Detail & Add/Edit): larger, filled when active.

### 6.3 Star Rating
- 5 stars, filled = blue, empty = blue-grey. Read-only variant (badge) and editable variant (tappable, supports tap-again-to-clear).

### 6.4 Segmented Control
- Rounded track on a blue-grey fill; active segment = white pill with soft shadow + icon + label.

### 6.5 Filter Chip
- Pill; inactive = white with subtle border; active = filled blue with white text; includes a count number.

### 6.6 Grouped Form Card & Field
- White rounded card; each field = small uppercase label above value/input; hairline separators between rows.

### 6.7 Icon Circle + Info Row
- Small tinted circle (pale blue) with an icon + a title/subtitle — used for listing link, viewing date, broker.

### 6.8 Primary Button / FAB / Floating circular buttons
- Primary: full-width, pill or rounded, solid blue, white text.
- Add FAB: circular, **deep navy**, white +, elevated with a blue-tinted shadow.
- Detail overlay buttons: circular, frosted white.

### 6.9 Empty States
- Centered icon-in-circle + title + supportive subtext + (optional) primary action. One per context (no properties, filtered-empty, compare-empty).

---

## 7. Current Design System (reference — feel free to elevate)

> This is what's implemented today. Use as a **baseline**; you're welcome to refine toward something more premium while respecting the constraints in §2.

**Color palette (blue-only):**
| Token | Hex | Use |
|---|---|---|
| App background | `#F4F7FB` | Screen background (pale blue-white) |
| Surface | `#FFFFFF` | Cards |
| Surface highlight | `#F8FAFC` | Alt rows |
| Text primary | `#0A1423` | Headlines (near-black navy) |
| Text secondary | `#5B6C82` | Body |
| Text tertiary | `#8A9CB0` | Captions/muted |
| Accent (primary) | `#0F52BA` | Buttons, price, active states |
| Accent hover | `#0B3D8A` | Pressed |
| Deep navy | `#041B3B` | FAB, "Shortlisted" |
| Accent subtle | `#E8F0FE` | Pale fills, icon circles |
| Azure | `#2F6FE0` | Highlights, stars |
| Border subtle | `#E2E8F0` | Hairlines, tracks |
| Border medium | `#CBD5E1` | Stronger dividers |

**Typography:** System/SF Pro. Scale: Large title 34/700 · Title 24–28 · Card title 18–20/600 · Body 16–17 · Subhead 15 · Footnote 13 · Caption 12/600 uppercase. Tight negative letter-spacing on large text.

**Spacing:** 8-pt grid. Screen padding 20px; card padding 16px; item gap 12px; section gap 32px.

**Corner radii:** small 8 · medium 12–16 · large 20–24 · pill 999.

**Shadows:** soft, diffuse, blue-tinted. Cards: `0 4px 16–20px rgba(10,20,35,0.05)`. FAB: blue-tinted `rgba(15,82,186,0.25)`.

**Effects:** frosted-glass blur on tab bar / sticky headers.

---

## 8. Motion & Interaction Notes
- Subtle press states on all tappable elements (scale/opacity).
- Status/rating changes feel instant with a light haptic.
- Modal slides up; detail pushes from right; gallery swipes horizontally with dot indicators.
- Keyboard-aware forms; sticky save button rises with the keyboard.
- Prefer 60fps micro-animations over heavy transitions.

---

## 9. Content & Tone
- Warm, concise, encouraging. Example empty copy: "Start tracking the places you're viewing. Add photos, brokers, and notes all in one spot."
- Money always formatted as AED; rentals suffixed `/mo`.
- Dates shown friendly: "Sat, Jul 12" (list) / "Sat, Jul 12, 3:30 PM" (detail).

---

## 10. Deliverables Checklist for Designers
Please provide, in a shared file (Figma preferred):

1. **Design system / style page:** color tokens, type scale, spacing, radii, shadows, icon set, component library (all §6 components with variants + states).
2. **The 4 core screens** in high fidelity: Properties (home), Property Detail, Add/Edit, Compare.
3. **All key states** per screen: default, loading, empty, filtered-empty, error, filled/long-content, keyboard-open (forms).
4. **The status system** visualized across all 5 stages (badge + chip + pipeline).
5. **Light-mode only**, blue-only palette, iPhone frame + Android note; account for safe areas and the floating tab bar.
6. **App icon / home-screen icon** concept (used for the installable PWA), plus a splash concept — blue, minimal, classy.
7. Optional but welcome: a short **motion spec** for the key transitions.

---

## 11. Screen List (quick index for file organization)
1. Properties — Home (default / empty / filtered-empty / loading / paste-link open)
2. Property Detail (full / no-photos / minimal / long-notes / loading)
3. Add / Edit Property (new / parsing / edit / validation / saving / keyboard)
4. Compare (populated / empty / loading)
5. Bottom Tab Bar (Properties active / Compare active)
6. App icon + splash
7. Design system / component library page
