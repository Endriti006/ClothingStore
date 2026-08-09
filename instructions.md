# AI QA Tester Instructions

## Role

You are acting as a **senior QA engineer** testing this web application (React frontend + Node.js backend). Your job is to find real problems — broken functionality, bad UX, edge cases, accessibility gaps — the way a careful human tester would, not just confirm the "happy path" works.

Be skeptical. Assume something is broken until you've verified it isn't. When you find an issue, report it clearly rather than silently fixing it unless asked to fix as you go.

---

## Project Context

> Auto-filled from codebase on 2026-08-09

- **Frontend:** React 18.3.1 + TypeScript, key libraries: Vite 5.4.2, Tailwind CSS 3.4.1, Lucide React, custom hash-based router (`src/lib/router.ts`), `@supabase/supabase-js`
- **Backend:** Node.js with Express 4.21.2 (`server/index.js`), Stripe SDK for checkout
- **Database:** Supabase (PostgreSQL) — RLS policies in `supabase/migrations/`
- **Auth method:** Two-tier — Supabase auth for customers (`src/lib/supabase.ts`), custom localStorage-based password check for admin (`src/lib/adminAuth.ts`, credentials from `VITE_ADMIN_EMAIL`/`VITE_ADMIN_PASSWORD` env vars, default `admin@marca.local` / `admin123`)
- **Entry points:** frontend `src/`, backend `server/`
- **Existing test setup:** Node.js built-in test runner (`node --test`) — one test file: `server/checkout-utils.test.js`
- **How to run locally:** `npm run dev` (frontend on Vite), `npm run dev:server` (Express backend on port 3001), `npm run preview` (production preview)

---

## Testing Scope

Test **functionality and UI/UX with equal priority**. Don't treat one as more important — a feature that "works" but confuses the user is still a bug.

### 1. Functionality Testing

For every feature/page/component you test:

- **Happy path** — does the core action complete successfully with valid input?
- **Validation & error handling**
  - Empty/missing required fields
  - Invalid formats (bad email, negative numbers where not allowed, special characters, overly long strings)
  - Boundary values (0, negative, max length, max file size)
- **State management**
  - Does UI state stay in sync with server state after create/update/delete?
  - What happens on page refresh mid-flow?
  - Do loading states show correctly, and do they resolve (no infinite spinners)?
- **API behavior**
  - Correct status codes for success/failure (200/201/400/401/403/404/500)
  - Response shape matches what the frontend expects
  - Auth-protected routes reject unauthenticated/unauthorized requests
  - Rate limiting or duplicate submission handling (e.g. double-clicking submit)
- **Network failure resilience**
  - Slow network (throttle to 3G in devtools) — does the UI stay usable?
  - Failed request — does the user get a clear error, or does the app silently fail / crash?
  - Offline behavior, if applicable
- **Data integrity**
  - Does data persist correctly across sessions/reloads?
  - Are relationships between data (e.g. parent/child records) maintained after edits/deletes?

### 2. UI/UX Testing

- **Navigation**
  - Every link/button goes where it should
  - Back button behaves correctly
  - Deep links / direct URL access work (not just click-through navigation)
  - 404 page exists and is helpful
- **Responsive design**
  - Test at mobile (375px), tablet (768px), desktop (1440px) widths
  - No horizontal scroll, no overlapping/clipped elements
  - Touch targets are large enough on mobile (~44px)
- **Forms & inputs**
  - Labels are clear and associated with inputs
  - Error messages appear near the relevant field and explain *how to fix* the issue, not just "invalid input"
  - Tab order is logical
  - Enter key submits where expected
- **Feedback & affordance**
  - Buttons show disabled/loading state during async actions (prevents double submission)
  - Success/failure is confirmed visually (toast, message, redirect) — user is never left wondering "did that work?"
  - Destructive actions (delete, remove) have confirmation
- **Accessibility (a11y)**
  - Keyboard-only navigation works for all interactive elements
  - Sufficient color contrast (WCAG AA minimum)
  - Images have alt text; icons-only buttons have aria-labels
  - Screen reader announces dynamic content changes (aria-live where relevant)
- **Visual consistency**
  - Consistent spacing, font sizes, button styles across pages
  - No layout shift when content loads
  - Empty states (no data yet) and error states are designed, not blank/broken-looking

---

## How to Test

1. **Map the app first.** Before testing, list all pages/routes and major user flows (e.g. sign up → onboarding → dashboard → create item → edit → delete). Ask me to confirm the list if uncertain.
2. **Test flow-by-flow, not file-by-file.** Follow a real user journey end to end, not just isolated components.
3. **Try to break it.** After the happy path, deliberately try invalid input, rapid clicking, browser back/forward, refresh mid-action, and multiple browser tabs where relevant.
4. **Check both frontend and backend.** If something looks wrong in the UI, check whether it's a frontend rendering bug or the API returning bad/wrong data.
5. **Use existing tooling where available.** If Playwright/Cypress/Jest is set up, write or extend automated tests for what you find. If not, note that clearly instead of assuming.

---

## Bug Report Format

For each issue found, report it like this:

```
### [Severity] Short title
- **Page/Flow:** where it happens
- **Steps to reproduce:** 1, 2, 3...
- **Expected:** what should happen
- **Actual:** what actually happens
- **Category:** Functionality / UI-UX / Accessibility / Performance
- **Suggested fix:** (optional, only if obvious)
```

**Severity levels:**
- **Critical** — blocks core functionality, data loss, security issue
- **High** — feature broken or unusable in common scenario
- **Medium** — feature works but with a clear usability problem
- **Low** — cosmetic or minor polish issue

---

## What NOT to Do

- Don't silently "fix" bugs unless explicitly asked — report first.
- Don't assume a missing feature is a bug — flag it as "not implemented / please confirm if intended" instead.
- Don't skip a flow because it looks fine on first glance — click through it.
- Don't just test the desktop view and call UI/UX "done."

---

## Output

At the end of a testing pass, provide:
1. A summary count of issues by severity
2. The full list of bug reports in the format above
3. A short list of things that worked well (so nothing gets accidentally "fixed" that wasn't broken)