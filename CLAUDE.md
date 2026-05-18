# Project: Martell Media Facebook Dashboard

Internal dashboard for the Martell Media video team. Tracks Dan Martell's
Facebook page follower growth daily. Source of truth is a Google Sheet
that is updated daily.

Used by: Ollie, Arturo, Spencer, Sam, Dan.

---

## Visual constraints — NON-NEGOTIABLE

The single highest priority of this project is that the dashboard does NOT
look like a generic AI-generated SaaS analytics product. The aesthetic is
warm, light, energetic — cream backgrounds, mixed card surfaces (white +
yellow + dark), bold sans-serif numbers, yellow as a primary color not a
decoration.

### Do NOT use
- **Lucide icons.** Never import `lucide-react`. If an icon is needed, use
  a custom inline SVG or a typographic mark.
- **shadcn/ui defaults.** No `@/components/ui/*` patterns. Use the
  primitives in `frontend/src/components/primitives/`.
- **Recharts default styling.** Use D3 for charts. If Recharts is forced,
  every default is overridden.
- **Tailwind CSS.** This project uses CSS modules (or plain CSS) with the
  design tokens in `frontend/src/styles/tokens.css`. No utility classes.
- **Generic AI dashboard tells:** blurred glassmorphism, gradient mesh
  backgrounds, animated number counters that loop, skeleton loaders that
  look like the standard Tailwind shimmer, "Powered by..." footers,
  emoji icons in stat cards, gradient text.
- **Overused fonts.** Inter, Roboto, Arial, Geist, Space Grotesk, Manrope,
  Plus Jakarta Sans. All forbidden.
- **Pure-white pages.** The page background is cream (`--bg-page`). White
  is reserved for cards.

### Always use
- **Design tokens.** Every color, font-size, spacing, and radius comes
  from CSS variables in `frontend/src/styles/tokens.css`. No hardcoded
  hex values anywhere else. No magic numbers.
- **Primitives.** Every visual element composes through the primitives in
  `frontend/src/components/primitives/`. Do not invent new primitives
  without updating this file.
- **Bricolage Grotesque** for all UI text. **JetBrains Mono** for any
  tabular numeric data inside the chart or in compact stat displays.
- **Sentence case in copy.** "Week to date" not "WEEK TO DATE". The
  eyebrow-style uppercase labels from the v1 mock are out — warmer copy
  wins.

### Aesthetic direction
Warm light. Cream page background (#F8F2E2). Cards in three flavors:
white (default), yellow (#FFD23F — used for the most important / "today"
metric), dark (#1A1612 — used for contrast, currently the month-to-date
target card). Rounded card corners (20px). Pill-shaped buttons and
badges (999px). Soft warm shadows, not crisp borders. Big confident
Bricolage Grotesque numbers (clamp 48px–78px). Yellow is a primary
color — used liberally on the featured card, the chart bars, and the
progress bar fill.

The "one thing someone remembers" is the **yellow Yesterday card with
a fat positive number on it.** Everything else supports that moment.

---

## Code constraints

- **Stack:** Flask + Google Sheets API backend, Vite + React + TypeScript
  frontend.
- **Charts:** D3 first. If a wrapper is needed, visx. Recharts only as
  last resort and fully restyled.
- **Animation:** Motion (formerly Framer Motion) for React. CSS-only
  where possible. One staggered reveal on first page load; no animation
  on subsequent data refreshes.
- **State:** TanStack Query for server state. No Redux, no Zustand.
- **Auth:** Single shared password via `DASHBOARD_PASSWORD`. Set
  HTTP-only session cookie on login.
- **Data source:** Google Sheets, read via a Service Account. 5-minute
  in-memory cache on the backend; cache invalidates on `POST /api/refresh`.
- **No SQLite, no cron, no APScheduler.** The Sheet is the database; its
  daily update is the refresh.

---

## Working style

- Build feature by feature. Never "build the dashboard."
- Each prompt targets one component or one view. Each prompt explicitly
  references CLAUDE.md and tokens.css.
- TypeScript strict mode. No `any` without a justifying comment.
- Sparse, meaningful comments. No "// imports" headers.
