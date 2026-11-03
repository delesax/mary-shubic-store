# Session log: Phase 1 repo setup + migration steps 0-7 (2026-11-03)

No secrets appear in this log. Env files, keys and dumps were never displayed; only names, sizes, permissions and counts were reported.

## Phase 1: repo setup and safeguards (complete)
- Step 0: Parent folder `Mary Shubic/` holds secret-looking files: `secret keys`, `ssh-key-2026-07-13.key`, `ssh-key-2026-07-14.key`, `.ssh/` (oracle_vm, config, known_hosts). User will move them. `catalogue-import` is actually at `tools/catalogue-import/` (inside the repo).
- Step 1: audit reports moved to `docs/`; `Tools` renamed to `tools`. `tools/site_audit.py` = 1102 lines.
- Step 2: `.env`, `apps/backend/.env`, `apps/storefront/.env`, `.env.local` git-ignored. `apps/storefront/.env.production` is NOT ignored (file does not exist; suggested rule `**/.env.*` not yet added).
- Step 3: `.claude/settings.json` (project-relative Read denies: .env, .env.*, *.pem, *.key, *.sql, *.dump, tools/catalogue-import/.venv/**) and `.claude/settings.local.json` (git-ignored; ~/.ssh, ~/.aws, .env* under ~/Project, six exact secret paths). Syntax checked against the Claude Code permissions docs (`//` = absolute path).
- `.gitignore` gained `tools/catalogue-import/` and `.claude/settings.local.json`.
- Step 4-6: `CLAUDE.md` written (13 lines). Staged by explicit path only; secret-pattern scan "none"; commit `8c11025`.
- Push failed with 403 over HTTPS (stale osxkeychain credential). Fixed by switching the remote to SSH and registering a new ed25519 key on GitHub. Pushed `8c11025`, then `f7b1a50` (docs/MIGRATION_PLAN.md). `git ls-files tools` lists only `tools/site_audit.py`.
- Step 7: `ssh -o BatchMode=yes` to `ms-prod` and `oracle-store`: both ok.

## Migration plan run (docs/MIGRATION_PLAN.md)
- Step 0: Read on `.env.deny-test` refused (deny rules active). The dummy file could not be created (Bash and Write both blocked), so nothing to delete.
- Step 1 baseline ms-prod: Ubuntu 24.04.5, 4 vCPU (DO-Regular, KVM), 7.8 GiB RAM, 154 GB disk (2% used), vmstat idle, steal 0%.
- Step 2 setup (done): user `deploy` (sudo NOPASSWD, in docker group, key copied from root), timezone Europe/London, 2 GB swap, ufw 22/80/443 only, fail2ban active, unattended-upgrades enabled, Docker 29.9.2 + Compose v5.7.0 from Docker apt repo, log rotation max-size 10m/max-file 3. Lockdown: `/etc/ssh/sshd_config.d/01-hardening.conf` (PermitRootLogin no, PasswordAuthentication no); verified deploy login ok, root refused, password refused.
- Step 3: repo cloned to `~/store` (f7b1a50). Old VM `~/store` is at `7fee095`, 5 commits behind origin/main, tree clean (only untracked `.env.bak-2026-10-24`; ignored `.env`, `build.log`). No modified compose, Caddyfile or Dockerfiles. No `apps/backend/.env` on old VM.
- Step 4: root `.env` piped without echo: 23 lines, mode 600, owner deploy, git-ignored, 0 lines with spaced `=`. Variable names: COOKIE_SECRET, JWT_SECRET, NEXT_PUBLIC_BASE_URL, NEXT_PUBLIC_DEFAULT_REGION, NEXT_PUBLIC_MEDUSA_BACKEND_URL, NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY, NEXT_PUBLIC_STRIPE_KEY, POSTGRES_PASSWORD, R2_ACCESS_KEY_ID, R2_ACCOUNT_ID, R2_BUCKET, R2_PUBLIC_URL, R2_SECRET_ACCESS_KEY, RESEND_API_KEY, RESEND_FROM_EMAIL, STRIPE_API_KEY, STRIPE_WEBHOOK_SECRET.
- Step 5: pg_dump -Fc from oracle-store (501 KB, PGDMP header ok) restored on ms-prod (exit 0). Row counts identical on both: products 28, orders 10, customers 5, regions 3.
- Step 6: `docker compose build --build-arg CACHEBUST=...` in tmux: 496 s, EXIT=0. All 5 containers (caddy, medusa, postgres, redis, storefront) Up, restart=unless-stopped.
- Step 7 (partial): public HTTPS via `curl --resolve` fails with TLS internal error because Caddy has no certs until DNS points here (expected). Inside the Docker network: medusa /health 200, /app 200, storefront /gb 200. Product page /gb/products/floral-panel-halter-swimsuit also works. Total request times inside the Docker network (includes `docker exec` overhead, so only an upper bound): /gb 7.07 s on a cold render, product page 1.78 s; no errors or timeouts in storefront or medusa logs. The earlier "hang" was my own test script (a wget piped to head), not the site. vmstat after the run: ~97-100% idle, steal 0, swap used 12 KB. `site_audit.py --vm ms-prod` not yet run. Proper TTFB for the public hostnames can only be measured after Caddy has certificates.

## Open issues
1. `~/.ssh/config` alias `ms-prod` still logs in as root, which is now refused. User must set `User deploy`. Meanwhile commands use `ssh -l deploy ms-prod`.
2. /gb took 7 s on a cold first render inside the Docker network; re-measure TTFB after cutover (warm cache, public path) and compare with oracle-store.
3. `apps/storefront/.env.production` not git-ignored; secret files still in parent folder.
4. Steps 8-10 pending (cutover checklist, DNS, backups to R2 via rclone, final summary).
