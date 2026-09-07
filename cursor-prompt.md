You are building "DealHub" — a small affiliate deal aggregator + personal secondhand marketplace site. Full requirements are in `requirements.md` in this repo — read it fully before writing code.

Build this as:
- **Next.js (App Router)**, TypeScript, deployed as a standard Node server (not static export, not edge runtime).
- **Docker.** Write a multi-stage `Dockerfile` for the app (deps → build → slim `node:20-alpine` runtime image) and a `docker-compose.yml` with three services: `app` (the Next.js container), `db` (`postgres:16` with a named volume so data persists), and `caddy` (reverse proxy in front of `app`, handling HTTPS via a `Caddyfile`). `docker compose up -d --build` should be the entire deploy step.
- **PostgreSQL** via **Prisma** as the ORM. Set up `schema.prisma` matching the data model in `requirements.md` section 4 (Category, Product, Click, Setting). `DATABASE_URL` points at the `db` service.
- **Plain CSS / CSS Modules only.** No Tailwind, no component library (no shadcn, no MUI). Keep the client JS bundle minimal — most pages should be server components with no client-side data fetching.
- No auth library — implement a minimal cookie-session admin login using `ADMIN_USER` / `ADMIN_PASS` env vars, protecting everything under `/admin`.

**Strict env var policy — read this carefully:** environment variables are for secrets and deploy-time config ONLY (`DATABASE_URL`, `ADMIN_USER`, `ADMIN_PASS`, `PORT`, `NODE_ENV`). Any business/contact data — WhatsApp number, site name, contact email — must live in the `Setting` table in the database and be editable via `/admin/settings`, never read from `process.env`. If you find yourself wanting to add a new env var for anything other than a credential or deploy-time config, put it in the `Setting` table instead.

Build all the pages and routes listed in `requirements.md` section 5, including:
- The `/go/[productId]` redirect route that logs a `Click` row then 302s to the product's `affiliateLink`. This is the single most important route — every shared link on social media points here, never directly to the affiliate link.
- The admin CRUD screens for products, categories, and a `/admin/settings` page for editing the singleton `Setting` row (WhatsApp number, site name, contact email) — plain HTML forms, server actions for mutations, no client-side form library needed.
- The "related products" logic on deal product pages: same category, `kind = 'deal'`, excluding the current product, limit 4.
- The WhatsApp contact button on secondhand items, reading the number from `Setting.whatsappNumber` (query it in the server component, do not read it from an env var), linking to `https://wa.me/<number>?text=<url-encoded message mentioning the item title>`.

**Architecture — follow requirements.md section 8 exactly.** Put all business logic in a `lib/` service layer (e.g. `lib/products.ts`, `lib/settings.ts`) as plain, framework-agnostic functions — no Prisma calls inline in components or route handlers, no direct dependence on Next.js `Request`/`Response` inside `lib/`. Admin pages and server actions call these functions rather than talking to Prisma directly. This is specifically so a Telegram bot webhook or other future integration can later call the same functions as a new entry point, without touching existing code. Add short comments (not code) in `schema.prisma` and `lib/products.ts` marking where `InboxLink` and a Shopee-link-conversion step would hook in later — do not implement either.

Do NOT build (explicitly out of scope, see requirements.md section 6):
- Any checkout/payment flow.
- Any scraping, price-comparison, or auto-sort across marketplaces.
- Any TikTok integration.
- The Telegram bot — leave a short comment in the Prisma schema noting where an `InboxLink` model would go later, but don't build it now.

Design it properly, don't default to a generic template look — follow the design notes in `requirements.md` section 8 closely (specific deliberate color palette grounded in the "budget-conscious deal hunting" subject matter, system font stack, flat cards with thin borders instead of drop shadows, mobile-first with a horizontally scrollable category-chip row). Keep copy minimal — product cards show only title, price, one-line note, and image; no filler marketing copy anywhere.

After scaffolding, give me:
1. The Prisma schema and a seed script with a handful of example categories/products (some `deal`, some `secondhand`) and a default `Setting` row, so I can see it working immediately.
2. The `Dockerfile`, `docker-compose.yml`, and `Caddyfile`.
3. Instructions for running locally: which `.env` variables are needed (secrets/config only, per the policy above), how to run `docker compose up -d --build`, and how to run the Prisma migration + seed inside the running `app` container.
