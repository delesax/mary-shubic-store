# Backup and restore checklist (before go-live)

- [x] Nightly backup script written and run once by hand (2026-11-03, 512,982 bytes, verified in R2)
- [x] Cron entry installed for `deploy` on ms-prod: 03:00 daily (2026-11-03)
- [x] First automated run confirmed in `~/backups/backup.log` and in R2 (2026-11-04 03:00 run: `medusa-20261104-0300.dump`, 512,982 bytes, verified)
- [ ] R2 lifecycle rule: delete objects under `medusa/` after 30 days (Cloudflare dashboard, owner)
- [ ] R2 API token scoped to the `mary-shubic-backups` bucket only, Object Read & Write (owner)
- [x] restore test performed on 2026-11-03: dump `medusa-20261103-0921.dump` (512,982 bytes) downloaded from R2, restored with pg_restore exit 0 and no errors into a throwaway `postgres:15-alpine` container (`--network none`); exact counts matched live for all 141 public tables (0 differences); throwaway container and temp files removed; live containers untouched
- [ ] repeat the restore test periodically (for example monthly) and after any change to the backup script
