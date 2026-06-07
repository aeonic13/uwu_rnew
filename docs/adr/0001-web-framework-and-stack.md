# Web framework and stack for the MVP

We need a server-rendered (SEO-critical, public listing pages), correctness-sensitive (money flows + legal lease/cosigner contracts) web app, built and maintained by 2 React-experienced-but-React-averse developers who are willing to rewrite for the best long-term fit. We chose **SvelteKit + TypeScript + PostgreSQL + Prisma**, deployed on a long-running Node host (Railway/Render/Fly, not pure serverless), with all business logic in a framework-agnostic TypeScript service layer and realtime messaging via a managed service or `adapter-node` websockets. Reason: end-to-end static typing protects the highest-risk code (`Transaction`, `Agreement` signing, `Application` status transitions) at compile time, it drops React without discarding our existing Postgres schema, Prisma, and Node payment integrations (Plaid/Moov/Stripe), and the isolated domain layer keeps a future mobile API reversible.

## Status

accepted

## Considered Options

- **Next.js (App Router) + TS** — the obvious default, but doubles down on React, which the team dislikes; retained only as the cheap fallback since it shares the TS/Prisma/Postgres foundation and domain layer.
- **Remix / React Router 7** — same React objection.
- **Rails 8 + Hotwire** — best built-in velocity (auth, jobs, ActionCable realtime, admin), but dynamically typed exactly where our domain is riskiest, and would discard the existing Node/Prisma/payments work. The right choice only if velocity-from-conventions later outweighs compile-time safety.
- **Pure SPA (current Vite setup)** — rejected: not server-rendered, so public listing pages are invisible to search crawlers.

## Consequences

- Smaller ecosystem and hiring pool than React; some integrations must be assembled rather than adopted.
- Pure-serverless hosting is avoided to support persistent websocket connections for messaging.
- Business logic must stay decoupled from SvelteKit request/response objects so it remains portable to a standalone API later.
