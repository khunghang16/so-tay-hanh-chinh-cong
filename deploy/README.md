# Deploy — Sổ tay điện tử HCC

Auto-deploy of the static flipbook to the shared GCP VM `wintrade`
(project `wintrade-498209`, IP `35.198.246.101`), co-hosted next to hcc/wintrade
behind the shared Traefik + Let's Encrypt.

- **Trigger:** push to `main` (or manual `workflow_dispatch`).
- **What runs:** [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) —
  rsync the static files into `/opt/apps/sotay-hcc/site`, then `docker compose up -d`
  an `nginx:alpine` container ([`docker-compose.yml`](docker-compose.yml) +
  [`nginx.conf`](nginx.conf)).
- **URL:** https://sotay.35-198-246-101.nip.io (nip.io → VM IP, no DNS to manage).
- **No build / no DB.** Pure static; nginx serves with HTTP Range (206) so `<video>`
  plays/seeks correctly.

## Videos are NOT deployed by CI

The ~1.7GB of videos are uploaded separately (another member) into
`/opt/apps/sotay-hcc/site/files/editor/files/extfile/`. The deploy rsync
**excludes that path from both transfer and `--delete`**, so CI never overwrites
or removes the videos.

## Required GitHub secrets (repo `khunghang16/so-tay-hanh-chinh-cong`)

| Secret | Value |
|---|---|
| `GCP_HOST` | `35.198.246.101` |
| `GCP_USER` | `deploy` |
| `GCP_SSH_KEY` | contents of the `deploy` user's private key (`~/.ssh/wintrade_deploy`) |

## One-time VM bootstrap

The first deploy creates everything on the VM (`mkdir`, `.env`, compose up).
Nothing to pre-create manually — just ensure the three secrets are set and the
`deploy` user's public key is in its `~/.ssh/authorized_keys` (already true,
shared with hcc/wintrade deploys).
