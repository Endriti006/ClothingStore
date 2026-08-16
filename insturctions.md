Security Hardening Prompt — React + Node + Supabase + Stripe

How to use: Open this repo in your editor, open Copilot Chat, and paste the prompt below. Ask Copilot to go section by section rather than all at once — that gets you actual file-by-file fixes instead of generic advice.

Prompt to paste into Copilot

I have a full-stack e-commerce app:

Frontend: React
Backend: Node.js
Database/Auth: Supabase
Payments: Stripe

Review and harden the security of this application. Go through each area below, check my current implementation against it, flag any vulnerabilities you find, and fix them with production-ready code. Go file by file — start with the Stripe webhook handler and checkout routes, then Supabase RLS policies, then general API middleware, then the frontend.

1. Stripe / Payments
Confirm every webhook endpoint verifies the signature with stripe.webhooks.constructEvent() using the raw request body and the webhook secret. Flag any route that parses the body as JSON before verification (this breaks signature checking).
Confirm charge/order amounts are always computed server-side from the database — never trust a price, total, or quantity sent from the client.
Confirm the Stripe secret key only appears in server-side code and .env, never in any file that ships to the browser.
Add idempotency keys to PaymentIntent/Checkout Session creation to prevent duplicate charges on retry.
Confirm the checkout route checks that the authenticated user is actually allowed to purchase the item(s) requested.
Confirm raw card data never touches my server — only Stripe Elements/Checkout should collect it (PCI scope).
2. Supabase
Audit every table: is Row Level Security (RLS) enabled? List any table where it isn't.
Review RLS policies on user-owned data (orders, addresses, cart, payment records) — confirm a user can only read/write their own rows.
Confirm the service_role key is used only in trusted server-side code, never in the React app or any client-exposed env var (anything prefixed VITE_/REACT_APP_ is public).
Check anon-role permissions aren't broader than they need to be.
Review any Postgres functions for SQL injection risk or unsafe SECURITY DEFINER usage.
3. Backend API (Node.js)
Add input validation/sanitization on every route (e.g. zod or express-validator) — especially checkout, auth, and profile update endpoints.
Add rate limiting on sensitive routes (login, signup, password reset, checkout) with express-rate-limit or similar.
Lock down CORS to my actual frontend origin(s) — flag any origin: '*'.
Confirm all secrets load from environment variables, are never hardcoded, and are never written to logs.
Add centralized error handling that returns generic messages in production and never leaks stack traces.
Add helmet for secure HTTP headers and enforce HTTPS.
Check for injection risks (SQL/NoSQL), path traversal, and prototype pollution in any route that touches user input or file paths.
4. Authentication & Sessions
Confirm every protected route validates the JWT/session server-side — not just gated in the React UI.
Check where auth tokens are stored; prefer httpOnly cookies over localStorage to reduce XSS token theft.
Add brute-force protection on login (rate limit + lockout or CAPTCHA after repeated failures).
Confirm password reset / email verification tokens are short-lived and single-use.
5. Frontend (React)
Search for dangerouslySetInnerHTML and confirm any dynamic HTML is sanitized.
Add a Content Security Policy header restricting script sources.
Confirm anything security-sensitive (prices, admin controls, role checks) is enforced server-side, not just hidden/disabled in the UI.
Run npm audit and list any high/critical vulnerabilities in dependencies.
6. General / Deployment
Confirm .env* is in .gitignore and check git history for accidentally committed secrets.
Add logging for failed payments, failed logins, and unusual activity — without logging full card numbers, tokens, or passwords.
Give me a pre-launch checklist covering SSL, environment separation (dev/staging/prod), and backups.

For each issue found: briefly explain the vulnerability and its real-world impact, then show the corrected code.

Notes for you
Run this in a staging/test branch first — some fixes (RLS policy changes especially) can break existing functionality if a policy is stricter than what your current frontend expects.
Copilot's suggestions are a strong starting point, not a guarantee — for a live payment app, it's worth a second pass (human review, or a paid security audit) before going to production if you're handling real money at scale.
If you tell me which parts of the stack you're most unsure about (e.g. "I don't know if my RLS policies are right"), I can help you go through that section in more depth right now.