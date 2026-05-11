cd /opt/sigmaconnect/bniconnect

cd /opt/sigmaconnect/bniconnect && git pull && docker compose up -d --build

docker compose logs backend
docker compose logs frontend

# ── Deployment ──

1. Update `.env` on VPS with `CLOUDFLARE_ZONE_ID` and `CLOUDFLARE_API_TOKEN` to automate cache purging.
2. Run the deployment script:
   ```bash
   cd /opt/sigmaconnect/bniconnect && bash scripts/deploy.sh
   ```

# ── Logs ──
docker compose logs -f frontend
docker compose logs -f backend