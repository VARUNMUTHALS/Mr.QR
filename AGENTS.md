<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Base44 sandbox setup notes

- **Clerk is a hard boot requirement.** `src/proxy.ts` (middleware) and the `ClerkProvider` in `src/app/layout.tsx` validate the key format on every request; without valid `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` every route (including public ones) errors. Placeholder keys in `.env.base44-defaults` only allow the dev server to start, not pages to render.
- **Prisma has no migrations directory.** Schema is applied with `prisma db push` (see `docker-compose.base44.yml` web service command); never wait for `prisma migrate deploy`.
- **`package-lock.json` is out of sync with `package.json`** (missing `@emnapi/*` transitive deps). Use `npm install`, not `npm ci`. A `bun.lock` also exists but npm is used in the sandbox.
- The repo `dev` script pipes through `tee dev.log`; the Base44 compose command runs `npx next dev -p 3000` directly instead.
- `allowedDevOrigins` in `next.config.ts` is built from `BASE44_PUBLIC_HOST_SUFFIX` (sandbox preview origin); unset it falls back harmlessly to `3000-localhost`.
- Web healthcheck curls `/` and requires 2xx — it shows unhealthy while Clerk keys are placeholders, which correctly reflects that no page can render.
- Verify the stack with `docker compose -f docker-compose.base44.yml ps` and `curl http://localhost:3000/`; Postgres runs as the `postgres` service (db `dynamic_qr`, user `qruser`).
