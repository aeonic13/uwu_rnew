# Rentra

Student-housing rental platform (myrentra.com): tenants browse listings, pre-qualify, apply solo or as a roommate group, add a cosigner, sign a lease, and pay rent; landlords list, screen, collect rent, and manage deposits, expenses, taxes and documents. Two user types: `student` (tenant) and `owner` (landlord).

## Stack

- Frontend: React 18 + Vite + react-router-dom (lazy routes) + Tailwind + lucide-react. Plain JS/JSX, PropTypes, no TypeScript.
- Backend: Express (ESM) + Prisma + Postgres. JWT auth (`Authorization: Bearer`), helmet, express-rate-limit.
- Integrations: Plaid (income/identity), Moov (ACH, sandbox only), Cloudinary (uploads), Resend with SendGrid fallback (email), pdfkit (lease PDFs).
- Secrets: `dotenvx` wraps every npm script. Local frontend config is `.env.local`; server config is `server/.env` (gitignored, not in this checkout).

## Commands

Run from the repo root unless noted.

```bash
npm run dev            # Vite on http://localhost:3000
npm run server         # Express on http://localhost:5000 (nodemon)
npm run dev:all        # both
npm test               # frontend vitest (jsdom)
cd server && npm test  # server vitest (pure unit tests, no DB needed)
npm run lint           # eslint, must be 0 errors before commit
npm run build          # vite build, must be clean before pushing
npm run test:e2e       # Playwright smoke against https://myrentra.com (SMOKE_BASE_URL overrides)
cd server && npm run db:seed   # seed data, all seed users use password123
```

Husky runs lint-staged (eslint --fix + prettier) on commit. Before declaring work done: lint 0 errors, both test suites green, `vite build` clean.

## Layout

- `src/routes/index.jsx` — the router. Every real page is lazy-loaded here. Owner screens that are not real yet route to `ComingSoon`.
- `src/features/<area>/` — page components by domain: listings, applications, messaging, groups, housemates, cosigner, owner, payments, profile, auth, legal, landing.
- `src/contexts/` — Auth, Listings, Favorites, Groups, Messaging, Applications providers, composed in `contexts/index.jsx` (outer to inner in that order). `useAuth()` is the most-used hook.
- `src/services/` — one axios service module per API area over `api.js`. The response interceptor unwraps `response.data` and turns errors into `Error(message)`, so callers get plain data and catch plain errors.
- `src/*.jsx` at the root (30+ files: EnhancedMessaging, RentCollectionSystem, TaxCenter, ...) are legacy mock screens kept as design references. They are not routed. `UniversitySearch.jsx` is the one exception that is still routed. Do not wire the others back in without making them real.
- `server/index.js` — mounts every router under `/api/<area>` and serves `/health`.
- `server/routes/<area>.js` — one Express router per area, `authenticate` middleware per route, Prisma calls inline.
- `server/utils/` — email templates, Plaid, Moov, Cloudinary, screening/income math, housemate matching, saved-search matching.
- `server/prisma/schema.prisma` + `migrations/` — schema changes always ship as a migration; `migrate deploy` runs at container start on Railway.
- Root `*.md` files are mostly historical planning docs. `MVP_LAUNCH_PLAN.md` tracks launch blockers. `WARP.md` describes an older state-based routing design and is out of date.

## Conventions

- API errors are `{ error: { message } }` with a proper status. The client relies on that shape.
- Landlord-facing emails and app notifications go through `server/utils/email.js` helpers, never raw SDK calls in routes.
- Frontend calls the API only through `src/services/*`, never axios or fetch directly in components.
- Honest UI over mock UI: if a feature has no backend, gate it behind `ComingSoon` or show an empty state, do not fake data.
- Applications: group applications create one `Application` per member linked by `groupId`. Listing-inquiry conversations auto-promote from Inquiries to Direct once an application exists.
- Blocks (`UserBlock`) are enforced in housemate matching and in messaging start/send.

## Deploy

Push to `main` deploys both sides automatically.

- Frontend: Vercel project `rentra` → myrentra.com. SPA rewrite for non-`/api` paths.
- Backend: Railway → rentra-production.up.railway.app. `railway.toml` runs `prisma migrate deploy && node index.js` at start. Never put `migrate deploy` in the build command: `DATABASE_URL` is not available at build time.
- Railway deploys sometimes fail on the first healthcheck attempt. Retry with `git commit --allow-empty` and push.
- Verify: `gh api repos/aeonic13/uwu_rnew/deployments` then curl `/health`.

## Gotchas

- `.env.local` points `VITE_API_URL` at the production Railway API. Local `npm run dev` talks to production data unless you override it to `http://localhost:5000/api`.
- `src/services/api.js` defaults to port 5001 but the server listens on 5000. Always set `VITE_API_URL` explicitly.
- Prisma client is generated at build; after editing the schema run `npx prisma generate` in `server/`.
- The frontend vitest config excludes `server/`, `e2e/` and `.claude/`.
- Repo is a git remote named `uwu_rnew`; the product is Rentra.

## Codebase questions

`graphify-out/` holds a knowledge graph of the code (gitignored). For "what touches X" or "how does A reach B" questions, use `python -m graphify path "A" "B"` or `python -m graphify explain "X"`, or `/graphify query "<question>"`. Refresh after code changes with `python -m graphify update .` (AST only, no LLM cost). Grep is still fine for anything small.
