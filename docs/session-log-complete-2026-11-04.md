# Complete session log: repo setup, server migration, cutover, backups (2026-11-03 to 2026-11-04)

No secrets appear in this log. Env files, keys, tokens, rclone config, the healthchecks URL and database dumps were never read or displayed. Only file names, sizes, permissions, table names and row counts are reported.

## Current state (as of 2026-11-04 ~05:20 GMT)
- **Production is on ms-prod** (DigitalOcean London, 206.189.16.62, Ubuntu 24.04, 4 vCPU / 8 GB, 2 GB swap). Log in with `ssh -l deploy ms-prod` (the alias now also logs in as deploy).
- **oracle-store** (old Oracle VM, 145.241.217.196) is still running and was never modified.
- All six hostnames (maryshubic.com, www., api., and the same three on .co.uk) resolve to 206.189.16.62 with Let's Encrypt certificates (expire 2027-02-01). No AAAA records. media.maryshubic.com stays on Cloudflare R2.
- Stripe test checkout works end to end (order, payment, webhook 200, order-placed email via Resend).
- Nightly backups: cron 03:00 Europe/London runs `~/bin/backup-db.sh` (dump, validate, upload to R2, verify size, prune local copies older than 14 days, ping healthchecks.io). First automatic run (04 Nov 03:00) succeeded.
- Restore test passed on 2026-11-03.
- Git: everything is pushed to `origin/main` (latest code commit `913ed38`). Working tree clean (new audit reports are git-ignored).
- **Not yet deployed:** the security headers, report-only CSP and JSON-LD work (`913ed38`) is in the repo only. ms-prod still runs the previous Caddyfile and storefront image, so the audit's header and structured-data findings stay until it is deployed.
- Latest audit (docs/audit-report-20261104-0516.md): PASS 77, WARN 42, FAIL 21, INFO 36. The 21 FAILs are pre-existing and deliberately left alone.

## Standing rules followed throughout
- Never read, print, cat, grep or log secrets (.env, keys, tokens, rclone config, dumps, `~/.healthchecks-url`). Secrets move only by non-echoing pipes.
- Explicit-path `git add` only. One command at a time. Ask before state-changing commands and before every push.
- Long server commands run in tmux. Never touch DNS, Stripe, Resend or Cloudflare (the user does those). Never modify or delete anything on oracle-store.

## Phase 1: repo setup and safeguards (complete)
- Parent folder `Mary Shubic/` holds secret-looking files (`secret keys`, two `ssh-key-*.key`, `.ssh/`). The user moves them; deny rules cover their exact paths.
- Audit reports moved to `docs/`; `Tools` renamed to `tools`. `.gitignore` gained `tools/catalogue-import/` and `.claude/settings.local.json`.
- `.claude/settings.json` (committed) denies Read of `.env`, `.env.*`, `*.pem`, `*.key`, `*.sql`, `*.dump`, `tools/catalogue-import/.venv/**`. `.claude/settings.local.json` (git-ignored) denies `~/.ssh/**`, `~/.aws/**`, `.env*` under `~/Project`, and the six exact secret paths.
- `CLAUDE.md` (13 lines) written with the project rules. Pre-commit secret-pattern scan: none found.
- Push failed with HTTPS 403 (stale keychain credential). Fixed by switching the remote to SSH and registering a new ed25519 key. A combined `git commit && git push` was blocked by the classifier; I committed first, asked, and pushed after an explicit yes.
- Commits: `8c11025` (config, audit script, baseline report), `f7b1a50` (MIGRATION_PLAN), `f18936f` (session log).

## Migration (docs/MIGRATION_PLAN.md)
- Step 0: deny rules proven by a refused Read (dummy file could not be created because Bash/Write were also blocked).
- Step 1 baseline: Ubuntu 24.04.5, 4 vCPU, 7.8 GiB RAM, 154 GB disk, steal 0%.
- Step 2 setup: user `deploy` (sudo NOPASSWD, docker group), Europe/London, 2 GB swap, ufw 22/80/443, fail2ban, unattended-upgrades, Docker 29.9.2 + Compose v5.7.0, log rotation 10m x 3. Lockdown via `/etc/ssh/sshd_config.d/01-hardening.conf` (PermitRootLogin no, PasswordAuthentication no); verified deploy ok, root and password refused.
- Step 3: repo cloned to `~/store`. Old VM was 5 commits behind with a clean tree.
- Step 4: root `.env` piped without echo (23 lines, mode 600, 0 lines with spaced `=`).
- Step 5: `pg_dump -Fc` from oracle-store (501 KB) restored on ms-prod; row counts identical (products 28, orders 10, customers 5, regions 3).
- Step 6: `docker compose build` in tmux 496 s, exit 0; all 5 containers Up with `unless-stopped`.
- Step 7: checked inside the Docker network before DNS: medusa /health 200, /app 200, storefront /gb 200, product page 200.

## DNS cutover (user edited DNS; I verified)
- Order: api, then www/apex on .com (Cloudflare), then .co.uk records at 20i (the .co.uk DNS is NOT in Cloudflare).
- Cloudflare edits initially hadn't gone live (authoritative NS still showed the old IP); the user fixed and saved, then I rechecked.
- Caddy hit certificate backoff after failed ACME challenges while DNS still pointed at the old server. With approval, I restarted only the caddy container (once per group) after authoritative DNS was confirmed. Certificates issued in 6-10 s.
- Verified all six hostnames over HTTPS, no AAAA records, sitemap URLs, API /health, admin /app, and a test checkout (order, payment, Stripe webhook 200, Resend email).
- Audit re-run on the live domain: saved as docs/audit-report-20261103-0725.{md,json}. No new FAILs from the move; 22 pre-existing FAILs.

## Phase D: backups to Cloudflare R2
- The user created the private bucket `mary-shubic-backups` and a token and ran `rclone config` himself (remote `r2-backups`). I never saw the keys.
- A user rclone test showed one transient `501 Not Implemented`. rclone is 1.75.2 and `no_check_bucket = true` is set in its config. The script therefore uses `rclone copyto --retries 3`, then verifies with `rclone lsf --format sp` that the object exists with the same size, and exits non-zero otherwise.
- `~/bin/backup-db.sh` (mode 700): flock against overlapping runs, stale `.tmp` cleanup, `pg_dump -Fc` in the postgres container, minimum size 50 KB, `pg_restore -l` integrity check, upload, size verification, local prune after 14 days. It logs only file names and sizes to `~/backups/backup.log`.
- First manual run 2026-11-03 09:21: `medusa-20261103-0921.dump`, 512,982 bytes, verified in R2.
- Cron: `0 3 * * * /home/deploy/bin/backup-db.sh` installed with approval. The crontab line later gained a `>> /home/deploy/backups/cron.out 2>&1` redirect that I did not add (presumably the user); left as is.
- First automatic run 2026-11-04 03:00: `medusa-20261104-0300.dump`, 512,982 bytes, uploaded and verified.

## Restore test (2026-11-03) and runbook
- Downloaded the newest dump from R2 (not the local copy) into a private `mktemp -d`; size matched (512,982). Restored into a throwaway `postgres:15-alpine` container (same tag as live) with `--network none`, trust auth, no ports, no bind mounts.
- `pg_restore --no-owner --no-privileges`: exit 0, zero errors, no output.
- Exact `count(*)` on all 141 public tables in restored and live databases: 0 differences. Key tables: product 28, product_variant 143, product_category 6, region 3, customer 5, order 11, cart 28, payment 11, payment_collection 13.
- Cleanup: container removed with `-v`, temp dir deleted, 0 leftovers. The five live containers kept the same IDs and uptimes (live DB was only queried with SELECT).
- `docs/RESTORE.md` corrected: `--network none` and trust auth instead of a password, wait for "ready to accept connections" twice (`pg_isready` can pass against the init-time temporary server), private temp dir, download from R2, compare every table (`counts.sql` plus `diff`), record live container IDs. Checklist `docs/RESTORE_CHECKLIST.md` records the result.
- Commits: `1996a2e` (RESTORE.md, RESTORE_CHECKLIST.md), `0c51b15` (result and corrections), `655fff8` (`.gitignore`: `docs/audit-report-*`; the 2026-10-29 baseline stays tracked).

## healthchecks.io ping (2026-11-04)
- `~/bin/backup-db.sh` now has `HC_FILE="$HOME/.healthchecks-url"` and a `ping()` function: returns 0 if the file is unreadable, otherwise `curl -fsS -m 10 --retry 3 -o /dev/null "$(cat "$HC_FILE")${1:-}" >/dev/null 2>&1 || true`. `fail()` pings `/fail` before exiting 1; a success ping follows the "backup complete" log line. A ping can never change the backup's exit code. No `set -x`.
- Installed atomically (temp file, `bash -n`, `mv`), mode 700, 79 lines. Manual run: exit 0, `medusa-20261104-0457.dump` 512,982 bytes uploaded and verified. R2 now holds three dumps (0921, 0300, 0457), all 512,982 bytes. The rollback copy `backup-db.sh.prev` was removed at the user's request.
- Not verified: ping delivery (the script prints nothing by design). The user should check the healthchecks.io dashboard for a success ping at about 04:57 GMT.

## Audit script fix (2026-11-04)
- The `--vm` section judged backups by the newest file in `~/backups` (which was `backup.log`, 0.0 h / "tiny") and by crontab text only (no `pg_dump`/`rclone` there, since cron calls a script).
- `tools/site_audit.py` (now 1,103 lines) looks at `~/backups/*.dump` and at `pg_dump`/`rclone` inside `.sh` files that cron runs.
- Result (docs/audit-report-20261104-0516): Backup cron job PASS, OFF-VM backup copy PASS, Newest backup 0.1 h / 500 KB PASS. FAIL 22 to 21, WARN 44 to 42, no new FAILs. Commit `b3e6850`, pushed.

## Errors and fixes along the way
- Push 403 over HTTPS: switched to SSH and registered a key.
- `timeout` is missing on macOS and `sleep` chains were blocked: used Monitor until-loops.
- zsh does not word-split variables: used a shell function for `curl --resolve`.
- `pkill -f` inside ssh killed my own shell: avoided afterwards. The earlier product-page "hang" was my own `wget | head` test, not the site.
- psql quoting errors: fixed by sending SQL from a file over stdin.
- Caddy certificate backoff: see DNS cutover.
- A garbled quoting attempt at the table-count query ran as a no-op; replaced by `counts.sql`.

## Ignore rules cleanup (2026-11-04)
- `.gitignore` gained `*.tsbuildinfo`, `**/.env.*`, `!**/.env.example`, `!**/.env.template`. `apps/storefront/tsconfig.tsbuildinfo` was untracked with `git rm --cached` (525,274 bytes, still on disk; it is a build cache that regenerates, and `git pull` on ms-prod will delete the tracked copy there, which is harmless).
- Verified with `git check-ignore`: tsbuildinfo and `apps/storefront/.env.production` are now ignored; `apps/backend/.env.template` is still tracked and not ignored. No env file contents were read.
- Commit `3bee9e1`, pushed.

## Security headers and JSON-LD (2026-11-04, repo only, not deployed)
- **Where:** headers are set in the `Caddyfile` (covers storefront, API and admin `/app`, redirects and static files, and needs no storefront rebuild). Two snippets: `security_headers` and `csp_report_only`.
- **All five site blocks:** `Strict-Transport-Security: max-age=300` (no `includeSubDomains`, no `preload`; raise later once every subdomain is confirmed on HTTPS), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `X-Frame-Options: SAMEORIGIN`.
- **Storefront blocks only:** `Content-Security-Policy-Report-Only` (not enforced) allowing Stripe (js.stripe.com, `*.js.stripe.com`, api.stripe.com, hooks.stripe.com, per Stripe's CSP docs), Stripe Link (`link.com`), `media.maryshubic.com`, `*.amazonaws.com` (demo images) and both API hosts, with `unsafe-inline` for Next.js inline scripts and styles. No `report-uri`, so violations only appear in the browser console. Do not enforce before checkout has been tested with it in place.
- **Admin and API:** get the five headers but no CSP. Nothing in the repo embeds the admin in an iframe. Not tested live (the task excluded the server).
- **Checks run:** `caddy validate` (local Docker) passed; the adapted config shows header handlers run before the proxy and the redirect, and the CSP only on `www`.
- **JSON-LD:** the existing `ProductJsonLd` gained `BreadcrumbList` (Home, Shop, collection if present, product), a product-level `sku` (single-variant products only; multi-variant products keep `sku` per offer) and stock-aware availability via the new `variantInStock` helper in `stock.ts` (a missing stock figure counts as in stock, not sold out). `itemCondition` is `NewCondition` unless `metadata.condition` says otherwise. New site-wide `Organization` and `WebSite` component in the root layout; legal name, address and company number are `TODO_*` constants and are not emitted while they still start with `TODO`. No `SearchAction` (no search route).
- **og:image:** homepage metadata points at a new `public/images/og-default.png` (1200x630, wordmark on ivory), a stand-in until model photography exists.
- **Validation:** strict typecheck of the touched files and a render test of both components with four sample products (single variant, multi-variant with one out of stock, unknown stock figure, pre-owned metadata); all output parsed as JSON and a `</script>` in a product title stayed escaped. A full `next build` and a fetch of built pages were not possible locally (no storefront `node_modules`, pages need a Medusa backend). Not checked: real `metadata.condition` values on products.
- **Commit:** `913ed38`, pushed.

## Commit history for this work (oldest first)
`8c11025` config, audit script, baseline; `f7b1a50` migration plan; `f18936f` first session log; `1996a2e` restore runbook and checklist; `0c51b15` restore test record; `655fff8` ignore generated audit reports; `b3e6850` audit backup-check fix; `3bee9e1` ignore rules for generated and env files; `d6244ce`, `f6b41a3`, `d11023a` this log; `913ed38` security headers and JSON-LD. All of these are pushed to `origin/main`.

## Still open
1. Cloudflare: add a 30-day lifecycle rule on the `medusa/` prefix, and confirm the R2 token is scoped to this one bucket with Object Read & Write only.
2. Confirm the healthchecks.io success ping arrived, and that tonight's 03:00 run pings too.
3. Tick "first automated run confirmed" in `docs/RESTORE_CHECKLIST.md` (the 04 Nov 03:00 run did upload). Repeat the restore test periodically.
4. Move the secret files out of the parent `Mary Shubic/` folder (the `**/.env.*` ignore rule is done, see above).
5. Clean up the demo S3 image URLs (10 images, 4 thumbnails) before launch.
6. 21 pre-existing audit FAILs (deliberately not fixed). Internet scanners probe `/webhook` paths (404, harmless).
7. Re-measure TTFB: `/gb` took about 7 s on a cold first render inside the Docker network; compare warm public timings with oracle-store.
8. Old VM (oracle-store) containers are still running by design. Retire it later, only when the user decides.
9. Deploy `913ed38` on ms-prod (in tmux, one command at a time): `git pull`; `docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile` (headers, no downtime); rebuild and recreate the storefront per `CLAUDE.md` (JSON-LD). Then verify with `curl --compressed -sI` and the JSON-LD on a product page, and open checkout once with the browser console open to look for CSP report-only messages (add any missing hosts before ever enforcing). Re-run the audit afterwards.
10. Supply the legal name, registered address and company number in `site-json-ld/index.tsx`. Replace `og-default.png` with real model photography when available.
11. Later: raise HSTS above `max-age=300` after checking every subdomain over HTTPS; consider enforcing the CSP only after a clean report-only period; check real `metadata.condition` values on products.
