# Restoring the database from backup

Nightly at 03:00 (Europe/London) `~/bin/backup-db.sh` on ms-prod takes a `pg_dump -Fc` of the `medusa` database, verifies it, uploads it to Cloudflare R2 and prunes local copies older than 14 days.

- Local copies: `~/backups/medusa-YYYYMMDD-HHMM.dump` on ms-prod
- Offsite copies: rclone remote `r2-backups`, bucket `mary-shubic-backups`, prefix `medusa/`
- Log: `~/backups/backup.log` (names and sizes only)

No credentials are needed in this document. rclone is already configured for the `deploy` user on ms-prod (`rclone config`, done by the owner).

## 1. Restore test (throwaway container, does not touch production)

Run on ms-prod as `deploy`. The test container uses a different name, no published ports, and a throwaway password, so it cannot clash with the live `postgres` service.

List the offsite dumps and pick one:

```bash
rclone lsf --format sp r2-backups:mary-shubic-backups/medusa/
```

Download it (replace the file name):

```bash
mkdir -p ~/restore-test && rclone copyto r2-backups:mary-shubic-backups/medusa/medusa-YYYYMMDD-HHMM.dump ~/restore-test/test.dump
```

Start a throwaway Postgres 15 (same major version as docker-compose.yml):

```bash
docker run -d --name pg-restore-test -e POSTGRES_PASSWORD=throwaway -e POSTGRES_USER=medusa -e POSTGRES_DB=medusa postgres:15-alpine
```

Wait until it is ready:

```bash
until docker exec pg-restore-test pg_isready -U medusa -d medusa; do sleep 1; done
```

Restore into it:

```bash
docker exec -i pg-restore-test pg_restore -U medusa -d medusa --no-owner --exit-on-error < ~/restore-test/test.dump
```

Compare row counts with production (values should match, or production is slightly ahead if orders came in after the dump):

```bash
docker exec pg-restore-test psql -U medusa -d medusa -tAc "select 'products', count(*) from product union all select 'orders', count(*) from \"order\" union all select 'customers', count(*) from customer union all select 'regions', count(*) from region"
```

```bash
cd ~/store && docker compose exec -T postgres psql -U medusa -d medusa -tAc "select 'products', count(*) from product union all select 'orders', count(*) from \"order\" union all select 'customers', count(*) from customer union all select 'regions', count(*) from region"
```

Clean up:

```bash
docker rm -f pg-restore-test && rm -rf ~/restore-test
```

Then tick the box in `docs/RESTORE_CHECKLIST.md`.

## 2. Real restore (disaster recovery)

Only after the owner decides. This replaces the live database.

1. Download the chosen dump to `~/dumps/` as in section 1.
2. Stop the app containers so nothing writes during the restore: `cd ~/store && docker compose stop medusa storefront`
3. Drop and recreate the database, then restore:
   - `docker compose exec -T postgres psql -U medusa -d postgres -c "DROP DATABASE medusa WITH (FORCE)"`
   - `docker compose exec -T postgres psql -U medusa -d postgres -c "CREATE DATABASE medusa OWNER medusa"`
   - `docker compose exec -T postgres pg_restore -U medusa -d medusa --no-owner < ~/dumps/<file>.dump`
4. Start the app again: `docker compose up -d medusa storefront`
5. Check `/health`, the admin at `/app`, and a storefront page.

Redis holds only cache and sessions, so it needs no restore.

## 3. If the backup stops working

- `tail ~/backups/backup.log` shows the last run. A failed run logs a FAIL line and exits non-zero.
- `crontab -l` should show `0 3 * * * /home/deploy/bin/backup-db.sh`.
- `rclone lsf r2-backups:mary-shubic-backups/medusa/` should show a file for every night.
