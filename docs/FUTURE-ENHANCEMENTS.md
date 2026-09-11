# Future / deferred system enhancements

Tracking file for production/scalability items that are **not implemented yet**.
Update status when an item ships.

| ID | Item | Status | Notes |
|----|------|--------|-------|
| 4 | Object storage for uploads (S3 / R2 / MinIO + CDN) | deferred | Local Docker volume `uploads` still used. Needed before multi-instance app. |
| 10 | Security headers (CSP/HSTS) + strict production secrets policy | deferred | Skip for now; keep strong `AUTH_SECRET` manually in `.env`. |
| 11 | Postgres connection pooling (PgBouncer / Prisma Accelerate) | deferred | Needed when running 2+ Next replicas. |
| — | Redis-backed rate limit / shared cache | deferred | Current rate limit is **in-memory** (one process). |
| — | Sentry / APM error tracking | deferred | Structured JSON logs exist; no external APM yet. |
| — | Horizontal app replicas behind load balancer | deferred | Blocked by local uploads (#4) + pooling (#11). |
| — | Font subset / critical-only loading | deferred | Optional perf polish. |
| — | Migrate component imports off root shims to domain paths | deferred | Shims still re-export `@/components/<domain>/…`. |

## Ops notes

- Order expiry: Docker entrypoint loops `GET http://127.0.0.1:3000/api/cron/expire-orders` every 60s.
- External cron may also call `/api/cron/expire-orders` (use `CRON_SECRET` / Bearer when not localhost).
- Health: `GET /api/health` (also used by Docker healthcheck).

## Already implemented (this pass)

- Remove root `force-dynamic` + cache settings/products (`unstable_cache` + tags)
- Public catalog ISR (`revalidate = 60`) + `SiteHeader` Suspense isolation
- Private routes explicitly `force-dynamic` (checkout / orders / admin / login)
- Product catalog DB indexes
- Admin role check in middleware (JWT role)
- In-memory rate limit on uploads / proof / cancel / buyer / simulate
- `SmartImage` (`next/image`) on catalog/banner surfaces
- Order expiry via Docker entrypoint cron loop + `/api/cron/expire-orders`
- Structured JSON logging + `/api/health` + Docker healthcheck
