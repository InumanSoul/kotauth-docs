---
title: Production Checklist
description: What you need before going live with Kotauth in production.
sidebar:
  order: 3
---

## Requirements

**Minimum hardware:** 512 MB RAM, 1 vCPU.

**PostgreSQL 14 or newer** is required. Kotauth manages its own schema via Flyway migrations — no manual DDL needed.

**TLS is mandatory.** Kotauth does not handle TLS directly — it expects a reverse proxy to terminate it. Set `KAUTH_ENV=production` and ensure `KAUTH_BASE_URL` starts with `https://`. The server refuses to start otherwise.

---

## Docker Compose production stack

The fastest path is `docker-compose.prod.yml` at the repository root, which adds a [Caddy](https://caddyserver.com/) sidecar for automatic Let's Encrypt TLS.

**Prerequisites:** a domain pointing to your server and ports 80/443 open on the host firewall.

**1. Get the files**

```bash
mkdir kotauth && cd kotauth

curl -O https://raw.githubusercontent.com/inumansoul/kotauth/main/docker-compose.prod.yml
curl --create-dirs -o docker/Caddyfile \
  https://raw.githubusercontent.com/inumansoul/kotauth/main/docker/Caddyfile
curl -o .env.example \
  https://raw.githubusercontent.com/inumansoul/kotauth/main/.env.example
cp .env.example .env
```

**2. Fill in `.env` for production**

```dotenv
KAUTH_BASE_URL=https://auth.yourdomain.com
KAUTH_ENV=production
KAUTH_SECRET_KEY=        # openssl rand -hex 32

DB_NAME=kotauth_db
DB_USER=kotauth
DB_PASSWORD=             # strong unique password

DOMAIN=auth.yourdomain.com
ACME_EMAIL=you@yourdomain.com
```

For managed databases (RDS, Supabase, Neon), set `DB_URL` instead of `DB_HOST`/`DB_PORT`/`DB_NAME`. See [External Databases](/deployment/external-database/).

**3. Start**

```bash
docker compose -f docker-compose.prod.yml up -d
```

This brings up three services: `db` (PostgreSQL with a persistent volume), `app` (Kotauth from GHCR), and `caddy` (automatic TLS). Caddy obtains the certificate on first startup — port 80 must be reachable for the ACME HTTP-01 challenge.

To also enable Redis:

```bash
docker compose -f docker-compose.prod.yml --profile redis up -d
```

:::tip
Block port 8080 on the host firewall after starting — only Caddy should handle inbound traffic. For example: `ufw deny 8080`.
:::

---

## Manual reverse proxy setup

If you already have a reverse proxy, use `docker-compose.yml` (local/eval compose) and proxy to port 8080 directly. Set `KAUTH_TRUSTED_PROXY=true` and `KAUTH_ENV=production` in `.env`.

### Caddy (standalone)

```
auth.yourdomain.com {
    reverse_proxy kotauth:8080
}
```

### nginx

```nginx
server {
    listen 443 ssl;
    server_name auth.yourdomain.com;

    ssl_certificate     /etc/ssl/certs/fullchain.pem;
    ssl_certificate_key /etc/ssl/private/privkey.pem;

    location / {
        proxy_pass         http://kotauth:8080;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

### Traefik

```yaml
# Add these labels to the app service in your compose file
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.kotauth.rule=Host(`auth.yourdomain.com`)"
  - "traefik.http.routers.kotauth.entrypoints=websecure"
  - "traefik.http.routers.kotauth.tls.certresolver=letsencrypt"
  - "traefik.http.services.kotauth.loadbalancer.server.port=8080"
```

---

## Environment checklist

Before starting in production, verify:

- `KAUTH_ENV=production`
- `KAUTH_BASE_URL` starts with `https://`
- `KAUTH_SECRET_KEY` is a freshly generated 32+ byte hex string (use `java -jar kauth.jar cli generate-secret-key` or `openssl rand -hex 32`)
- `KAUTH_BOOTSTRAP_ADMIN_PASSWORD` is set (min 12 chars, mixed case + digit) — or capture the generated password from stdout on first boot
- `KAUTH_TRUSTED_PROXY=true` if behind a reverse proxy (rate limiting uses `X-Forwarded-For`)
- `DB_URL`, `DB_USER`, `DB_PASSWORD` point to your production PostgreSQL instance — `DB_PASSWORD` is required and must not be blank
- Database user has `CREATE`, `SELECT`, `INSERT`, `UPDATE`, `DELETE` permissions (required for Flyway migrations on first boot)
- Port 5432 is blocked on the host firewall — the database should never be publicly reachable

---

## Encryption at rest

`KAUTH_SECRET_KEY` derives the AES-256-GCM key used to encrypt sensitive data stored in the database:

- **RSA private keys** — each tenant's JWT signing key
- **SMTP credentials** — workspace SMTP passwords
- **TOTP secrets** — MFA enrollment seeds
- **Social provider secrets** — Google and GitHub OAuth client secrets
- **Audit log HMAC chain** — `KAUTH_SECRET_KEY` keys the HMAC-SHA256 that chains audit log rows for tamper detection

If `KAUTH_SECRET_KEY` is lost, all encrypted data becomes irrecoverable. Back up this value alongside your database backups.

---

## File-based secrets

For production deployments, avoid passing secrets as plain environment variables. Kotauth supports `*_FILE` sibling variables that read the value from a file at startup:

```dotenv
KAUTH_SECRET_KEY_FILE=/run/secrets/kauth_secret_key
DB_PASSWORD_FILE=/run/secrets/db_password
```

Compatible with Docker Swarm secrets, Kubernetes mounted secrets, and systemd `LoadCredential=`. See [Docker](/deployment/docker/#file-based-secrets) for a compose example.

---

## Container hardening

The Kotauth Docker image runs with security defaults:

- **Non-root user** — the process runs as `kotauth` (UID 10001, GID 10001), not root
- **No new privileges** — `no-new-privileges` security option is set in the compose files
- **Capability drop** — `cap_drop: ALL` removes all Linux capabilities
- **Read-only filesystem** — the runtime filesystem is read-only; only `/tmp` is writable

These settings are applied by default in the published compose files. If you run the image with `docker run`, add the equivalent flags:

```bash
docker run -d \
  --security-opt no-new-privileges \
  --cap-drop ALL \
  --read-only \
  --tmpfs /tmp \
  ghcr.io/inumansoul/kotauth:latest
```

---

## Security configuration

**Set the admin password.** As of v1.14.1, there are no hardcoded default credentials. Set `KAUTH_BOOTSTRAP_ADMIN_PASSWORD` in your environment before first boot — minimum 12 characters with uppercase, lowercase, and a digit. If unset, a random password is generated and printed to stdout once.

**Enable trusted proxy.** If Kotauth runs behind a reverse proxy, set `KAUTH_TRUSTED_PROXY=true` so rate limiting uses the real client IP from `X-Forwarded-For`. Leave it `false` when directly exposed.

**Configure SMTP.** Required for email verification, password resets, magic links, Email OTP, and user invitations. Set this up under **Settings → SMTP** in each workspace.

**Review password policy.** The default (minimum 8 characters) may not meet your requirements. Tighten it under **Settings → Security**.

**Set the MFA policy.** Decide whether MFA should be `optional`, `required`, or `required_for_admins`. For sensitive workspaces, `required` is the safe default.

**Provision API keys via environment.** For automated deployments, use `KAUTH_BOOTSTRAP_API_KEYS` to create API keys idempotently on startup. See [Environment Variables](/deployment/environment-variables/) and [CLI Commands](/deployment/cli/).

---

## Upgrading

Kotauth uses Flyway for schema migrations. Upgrades are handled automatically on startup — pull the new image and restart:

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

Flyway runs any pending migrations before the server begins accepting traffic. Always back up the database before upgrading between major versions.

To pin to a specific version, edit the `image` tag in your compose file:

```yaml
image: ghcr.io/inumansoul/kotauth:1.19.2
```

---

## Backups

### Database-level backup

Kotauth's entire state lives in PostgreSQL. Back up regularly using standard PostgreSQL tools:

```bash
# Docker Compose stack
docker exec kotauth-db pg_dump -U kotauth kotauth_db > backup_$(date +%Y%m%d).sql

# External database
pg_dump -h your-db-host -U kotauth kotauth_db > backup_$(date +%Y%m%d).sql
```

### Tenant-level backup

Kotauth also provides encrypted tenant snapshots via the CLI and admin API. These use PBKDF2 + AES-256-GCM and are portable across Kotauth instances. See [Backup & Restore](/deployment/backup-restore/) for full documentation.

---

## Audit log integrity

The audit log uses an HMAC chain for tamper detection. Each row carries `prev_hash` and `row_hash` computed via HMAC-SHA256 keyed by `KAUTH_SECRET_KEY`. Verify the chain at any time:

```bash
docker compose exec kauth java -jar kauth.jar cli verify-audit-chain --tenant=my-workspace
```

See [CLI Commands](/deployment/cli/) for details.

---

## Monitoring

Kotauth emits structured JSON logs to stdout. Key fields in each log line:

| Field | Description |
|---|---|
| `level` | `INFO`, `WARN`, `ERROR` |
| `message` | Human-readable description |
| `tenantSlug` | Workspace context (MDC) |
| `requestId` | `X-Request-Id` header value for tracing |
| `duration` | Request duration in milliseconds |

Route these logs to your observability stack (Loki, CloudWatch, Datadog, etc.). The audit log API is the authoritative source for security events — do not rely on application logs for compliance.

:::tip
The `X-Request-Id` header is generated per request and included in all log lines for that request. Include it in your reverse proxy access logs to correlate application logs with proxy logs during incident investigation.
:::
