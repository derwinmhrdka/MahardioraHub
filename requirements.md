# DealHub — Requirements

## 1. What this is

A small website with two sections:

1. **Deals** — a curated catalog of affiliate products (Shopee for now). Visitors browse by category, view a product, and see related products in the same category. Clicking through takes them to the shop via your affiliate link.
2. **Secondhand** — your own personal items for sale. No checkout — a "Contact on WhatsApp" button is the entire buying flow.

Both sections share the same catalog structure (categories, product cards, product detail pages) so there's one codebase, not two.

## 2. Goals / non-functional requirements

These constraints matter more than any specific feature — they're the actual point of the brief:

- **Mobile-first.** Most visitors will land from a phone via a social post. Design and test mobile first, desktop second.
- **Fast.** No heavy client bundles, no unnecessary JS. Prefer server-rendered pages over client-side data fetching for anything that's just "show a list of products."
- **Low resource usage.** This runs on a cheap VPS (~$5/mo). Avoid anything that needs a lot of RAM at idle or under light load.
- **Easy to maintain solo.** One person (a software engineer with limited spare time) maintains this alongside a full-time job. Prefer fewer moving parts over more "correct" architecture. Avoid config-heavy tooling.
- **Not "AI-generated" looking.** No generic SaaS-card kit (identical rounded cards + soft grey shadow everywhere), no tracked-out ALL-CAPS eyebrow labels, no cream-background-plus-terracotta-accent look, no arrow "→" glued onto every button. Keep copy short and plain — this is not a landing page that needs to "sell" the concept to visitors, it's a catalog they're browsing with intent.
- **Minimal descriptions.** Product cards and detail pages should show only what's needed to make a buying decision (title, price, one-line note, image). No filler paragraphs.

## 3. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React via **Next.js** (App Router) | Server-rendered pages matter for SEO (organic Google traffic is a real growth channel for this), while still being React as requested. |
| Backend | Next.js API routes / server actions (same project) | One codebase, one deploy — avoids running a second Node process. |
| Database | **PostgreSQL**, containerized | Runs as its own Docker service alongside the app on the same VPS (see Section 3a). |
| ORM | **Prisma** | Type-safe schema, easy migrations, much easier to maintain solo than hand-written SQL as the schema grows. |
| Styling | Plain CSS or CSS modules — **no Tailwind requirement**, no component library | Keeps bundle size small; avoids the generic "shadcn look." Hand-written, intentional styling per the design notes below. |
| Hosting | Cheap VPS, everything containerized (see Section 3a) | As decided. |
| Auth (admin only) | Simple credential-based session (a signed cookie set after checking `ADMIN_USER`/`ADMIN_PASS` env vars) | No need for a full auth provider — there's exactly one admin (you). |

## 3a. Docker setup

Everything runs via `docker-compose`, three services:

```
services:
  app:     # the Next.js app, built from a multi-stage Dockerfile
  db:      # postgres:16, with a named volume so data survives container restarts
  caddy:   # reverse proxy in front of `app`, handles HTTPS automatically
```

- `app`'s Dockerfile should be a multi-stage build: install deps → build → copy only the production build + `node_modules` (production only) into a slim final image (e.g. `node:20-alpine`). This keeps the running image small, which matters on a low-memory VPS.
- `db` uses a named volume (e.g. `pgdata:/var/lib/postgresql/data`) so `docker compose down` doesn't wipe your data.
- `caddy` needs a `Caddyfile` pointing your domain at `app:3000` — Caddy handles Let's Encrypt certificates automatically, no manual cert renewal to maintain.
- `docker compose up -d --build` is the entire deploy step. No PM2, no manually configuring Nginx.

## 4. Data model (Postgres / Prisma schema, conceptually)

```
Category
  id            serial PK
  name          text
  slug          text unique

Product
  id              serial PK
  kind            enum('deal', 'secondhand')
  title           text
  categoryId      FK -> Category
  price           integer            -- store Rupiah as whole integer, no decimals
  imageUrl        text nullable
  shortNote       text nullable      -- one line, not a paragraph
  shopName        text nullable      -- 'deal' items only, e.g. "Shopee"
  affiliateLink   text nullable      -- 'deal' items only
  isActive        boolean default true   -- soft-hide instead of hard delete
  createdAt       timestamp default now()

Click
  id            serial PK
  productId     FK -> Product
  clickedAt     timestamp default now()

Setting
  id              integer PK, always 1 (singleton row)
  whatsappNumber  text     -- international format, no + or spaces
  siteName        text
  contactEmail    text nullable
```

Notes:
- `Product.kind` is the single field that distinguishes a "deal" from a "secondhand" listing — same table, same admin UI, same product card component, just conditional fields/rendering.
- `Click` exists from day one even though there's no dashboard for it yet — it's one extra `INSERT` on the redirect route, and having the data from the start beats trying to reconstruct it later.
- `Setting` holds business data that's likely to change without a redeploy — WhatsApp number, site name, contact email. This is deliberately in the database, not environment variables (see the env var policy below), and editable from `/admin/settings`.
- Deliberately no `Shop` table, no multi-marketplace price fields, no `InboxLink`/bot table yet — see Section 6 (Out of scope) and Section 7 (Future).

### Env var policy

Environment variables are for **secrets and deployment-time config only** — things that must exist before the app can even start, and that you'd never want visible in an admin UI or a database dump:

- `DATABASE_URL` — Postgres connection string
- `ADMIN_USER`, `ADMIN_PASS` — admin login credentials
- `TELEGRAM_BOT_TOKEN` — future, once the bot is built
- `PORT`, `NODE_ENV` — runtime config

Anything else — WhatsApp number, contact email, site name, or any other business/contact detail — lives in the `Setting` table and is edited through `/admin/settings`, never hardcoded into env vars. If a future feature needs a new piece of contact info or business config, the default should be "add a column to `Setting`," not "add an env var."

## 5. Pages / routes

| Route | Purpose |
|---|---|
| `/` | Homepage — category chips + a grid of active deal products (newest first) |
| `/deals/[categorySlug]` | Deal products filtered by category |
| `/deals/product/[id]` | Deal product detail — title, price, image, note, "Get this deal" button → redirect route below. Related products: same category, `kind = 'deal'`, excluding itself, limit 4. |
| `/secondhand` | Grid of your active secondhand items, newest first |
| `/secondhand/[id]` | Secondhand item detail — title, price, image, note, "Chat on WhatsApp" button. The number comes from `Setting.whatsappNumber` in the database (`https://wa.me/<number>?text=<prefilled message with item title>`), not an env var. |
| `/go/[productId]` | Redirect route: logs a row in `Click`, then 302-redirects to `affiliateLink`. This is the link you actually share on social media — never share the raw affiliate link directly, always share this one, so clicks get counted. |
| `/admin` (protected) | Login form if not authenticated |
| `/admin/products` (protected) | Table of all products (both kinds), add/edit/deactivate |
| `/admin/products/new`, `/admin/products/[id]/edit` (protected) | Form: kind, title, category, price, image URL, short note, and (if kind = deal) shop name + affiliate link |
| `/admin/categories` (protected) | Simple add/rename category list |
| `/admin/settings` (protected) | Edit the singleton `Setting` row — WhatsApp number, site name, contact email |

## 6. Out of scope (do not build these)

- **No checkout or payment integration.** The secondhand section is WhatsApp-only, by design.
- **No cross-marketplace price scraping or auto-sort.** Confirmed too risky (ToS violations, affiliate account bans) for what this project needs. Prices are entered manually by the admin.
- **No TikTok Shop integration.** TikTok's affiliate model is video/LIVE-based inside their app, not link-based, so it doesn't fit this site's model.
- **No Telegram bot in this build.** Nice-to-have, deliberately deferred — see below.

## 7. Future roadmap (not built now, but keep the schema/routes compatible)

- **Telegram bot for adding products.** Drop a link in Telegram → bot saves it to a future `InboxLink` table (`rawLink`, `telegramChatId`, `status`) → admin later fills in title/category/price from the admin panel. When you build this, it's an additive migration, not a rework.
- **Shopee Affiliate Open API integration**, once you're an approved Shopee affiliate with Open API credentials (App ID + App Secret from the affiliate dashboard's "Open API" section):
  - `generateShortLink` — paste a normal Shopee product URL into the admin form, auto-convert it to your tracked affiliate link instead of doing this manually on Shopee's own dashboard.
  - `productOfferV2` — later, search Shopee's catalog by keyword and auto-sort by price *within Shopee only* (this is safe because it's official, sanctioned data — not scraping). Cross-marketplace comparison remains out of scope regardless, per Section 6.

## 8. Architecture guidelines (build for extension, don't build the extensions)

None of the items in Section 7 (Telegram bot, Shopee Open API, any AI-assisted tooling) get built now. But the codebase should be structured so adding them later is additive — new files, not rewritten ones. Concretely:

- **Business logic lives in a `lib/` service layer, not inside route handlers or React components.** e.g. `lib/products.ts` exports plain functions like `createProduct()`, `getRelatedProducts()`, `logClick()`. Admin server actions call these functions; they don't talk to Prisma directly inline. This matters because a future Telegram bot webhook or an AI auto-tagging script would call the *same* `createProduct()` function — the entry point changes, the logic doesn't.
- **Keep Prisma calls out of UI components entirely.** Components/pages call service functions from `lib/`, never `prisma.product.findMany()` directly. This is what makes the service layer swappable/extendable without touching every page.
- **Settings are already schema-driven (Section 4), not hardcoded** — so a future integration needing new config (e.g. a Shopee `appId`/`appSecret` pair, once that's built) is a new column on `Setting` or a new small table, not a new env var and not a scattered config change.
- **Don't build an internal "API" now, but keep service functions pure and framework-agnostic** — no direct dependence on Next.js `Request`/`Response` objects inside `lib/`. That's what would let you expose a real API route or a bot webhook later that just calls the existing functions, instead of duplicating logic.
- **Leave the noted-but-unbuilt pieces as comments, not code**: a one-line comment in `schema.prisma` near where `InboxLink` would go, and a short comment in `lib/products.ts` near where a Shopee-link-conversion step would hook in. Comments cost nothing and save you from rediscovering the right seam later; actual implementation stays out per Section 6/7.

The test for "did we do this right": adding the Telegram bot later should mean writing a new webhook file that imports and calls existing `lib/` functions — not modifying `lib/products.ts`, not touching the Prisma schema beyond one additive migration, and not touching any existing page or admin screen.

## 9. Design notes (for whoever builds the UI — human or Cursor)

- Pick a deliberate, small color palette (4–6 colors) grounded in "practical deal-hunting for budget-conscious parents," not a generic template. Avoid the cream-background-plus-terracotta-accent combination and near-black-with-one-neon-accent combination — both read as generic AI output at this point.
- Use the system font stack (`-apple-system, "Segoe UI", Roboto, sans-serif` or similar) instead of loading a webfont — one less network request, faster first paint, and a legitimate design choice given the "fast" requirement rather than a corner cut.
- Flat design over heavy shadows: thin 1px borders instead of soft drop-shadows on every card.
- Product grid: 2 columns on mobile, more on wider screens.
- Category navigation as a horizontally scrollable row of chips on mobile, not a dropdown or hamburger menu — one tap to switch categories.
- Give the "Deals" and "Secondhand" sections a distinct accent color each, since that's a meaningful semantic difference (not decoration) — helps a visitor instantly tell which mode they're in.
