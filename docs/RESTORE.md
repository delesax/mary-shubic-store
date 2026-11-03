# Restoring the database from backup

Nightly at 03:00 (Europe/London) `~/bin/backup-db.sh` on ms-prod takes a `pg_dump -Fc` of the `medusa` database, verifies it, uploads it to Cloudflare R2 and prunes local copies older than 14 days.

- Local copies: `~/backups/medusa-YYYYMMDD-HHMM.dump` on ms-prod
- Offsite copies: rclone remote `r2-backups`, bucket `mary-shubic-backups`, prefix `medusa/`
- Log: `~/backups/backup.log` (names and sizes only)

No credentials are needed in this document. rclone is already configured for the `deploy` user on ms-prod (`rclone config`, done by the owner).

## 1. Restore test (throwaway container, does not touch production)

Run on ms-prod as `deploy`. The test container has no network, no published ports, no bind mounts and no password, so it cannot reach or clash with the live `postgres` service. Production is only ever queried with SELECT. Last performed: see `docs/RESTORE_CHECKLIST.md`.

Confirm the live Postgres image tag, and use exactly that tag below (currently `postgres:15-alpine`):

```bash
cd ~/store && docker inspect --format '{{.Config.Image}}' "$(docker compose ps -q postgres)"
```

Record the live containers so you can prove afterwards that nothing was touched:

```bash
docker ps --format '{{.Names}} {{.ID}} {{.Status}}'
```

List the offsite dumps and pick the newest:

```bash
rclone lsf --format sp r2-backups:mary-shubic-backups/medusa/
```

Download it from R2 (not from `~/backups`, so the off-server copy is what gets proven) into a private temp directory, and check the size equals the listing:

```bash
D=$(mktemp -d) && chmod 700 "$D" && rclone copyto r2-backups:mary-shubic-backups/medusa/medusa-YYYYMMDD-HHMM.dump "$D/restore.dump" && echo "$D" && stat -c %s "$D/restore.dump"
```

Start the throwaway Postgres:

```bash
docker run -d --name restore-test-pg --network none -e POSTGRES_HOST_AUTH_METHOD=trust -e POSTGRES_USER=medusa postgres:15-alpine
```

Wait until it is really ready. `pg_isready` can succeed against the temporary server used during first-time init, so wait for the log line to appear twice:

```bash
until [ "$(docker logs restore-test-pg 2>&1 | grep -c 'ready to accept connections')" -ge 2 ]; do sleep 1; done; docker exec restore-test-pg pg_isready -U medusa -d postgres
```

Copy the dump in, create the database and restore (expect exit 0 and no output):

```bash
docker cp "$D/restore.dump" restore-test-pg:/tmp/restore.dump && docker exec restore-test-pg createdb -U medusa medusa_restore && docker exec restore-test-pg pg_restore -U medusa -d medusa_restore --no-owner --no-privileges /tmp/restore.dump; echo "exit=$?"
```

Compare exact row counts for every public table. Save this query as `counts.sql`:

```sql
select table_name, (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from public.%I', table_name), false, true, '')))[1]::text as n
from information_schema.tables
where table_schema = 'public' and table_type = 'BASE TABLE'
order by 1;
```

Run it against both databases and compare (from your Mac, piping the file in; production is SELECT only):

```bash
ssh ms-prod 'docker exec -i restore-test-pg psql -U medusa -d medusa_restore -tA -F"|"' < counts.sql > restored.txt
ssh ms-prod 'cd ~/store && docker compose exec -T postgres psql -U medusa -d medusa -tA -F"|"' < counts.sql > live.txt
diff restored.txt live.txt
```

No `diff` output means identical. Differences are only expected in order, cart, payment or session-type tables when the live site has had activity since the dump; check the newest `created_at` in the live table against the dump time. Products, variants, categories and regions must match exactly.

Clean up, then re-run `docker ps` and confirm the live containers kept their IDs and uptimes:

```bash
docker rm -f -v restore-test-pg && rm -rf "$D" && docker ps -a --format '{{.Names}}' | grep -c restore-test-pg
```

(The last count should be 0.) Then fill in the line in `docs/RESTORE_CHECKLIST.md`.

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
