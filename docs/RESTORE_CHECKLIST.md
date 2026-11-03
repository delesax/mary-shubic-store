# Backup and restore checklist (before go-live)

- [x] Nightly backup script written and run once by hand (2026-11-03, 512,982 bytes, verified in R2)
- [x] Cron entry installed for `deploy` on ms-prod: 03:00 daily (2026-11-03)
- [ ] First automated run confirmed in `~/backups/backup.log` and in R2 (check on 2026-11-04)
- [ ] R2 lifecycle rule: delete objects under `medusa/` after 30 days (Cloudflare dashboard, owner)
- [ ] R2 API token scoped to the `mary-shubic-backups` bucket only, Object Read & Write (owner)
- [ ] restore test performed on ____-__-__ (follow docs/RESTORE.md section 1; row counts matched: yes / no)
