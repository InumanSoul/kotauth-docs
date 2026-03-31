---
title: Production Checklist
description: What you need before going live with Kotauth in production.
sidebar:
  order: 3
---

import { Aside } from '@astrojs/starlight/components';

## Requirements

**Minimum hardware:** 512 MB RAM, 1 vCPU.

**PostgreSQL 14 or newer** is required. Kotauth manages its own schema via Flyway migrations — no manual DDL needed.

**TLS is mandatory.** Kotauth does not handle TLS directly — it expects a reverse proxy to terminate it. Set `KAUTH_ENV=production` and ensure `KAUTH_BASE_URL` starts with `https://`. The server refuses to start otherwise.

---

## Docker Compose production stack

The fastest path to a production deployment is the bundled `docker/docker-compose.prod.yml`, which adds a [Caddy](https://caddyserver.com/) sidecar to the base stack. Caddy handles automatic TLS certificate provisioning and renewal via Let's Encrypt — no manual certificate management required.

**Prerequisites:** a domain pointing to your server and ports 80/443 open on the host firewall.

**1. Get the files**

```bash
mkdir kotauth && cd kotauth

curl --create-dirs -o docker/docker-compose.yml \
  https://raw.githubusercontent.com/inumansoul/kotauth/main/docker/docker-compose.yml
curl --create-dirs -o docker/docker-compose.prod.yml \
  https://raw.githubusercontent.com/inumansoul/kotauth/main/docker/docker-compose.prod.yml
curl --create-dirs -o docker/Caddyfile \
  https://raw.githubusercontent.com/inumansoul/kotauth/main/docker/Caddyfile
curl -o .env.example \
  https://raw.githubusercontent.com/inumansoul/kotauth/main/.env.example
cp .env.example .env
```

**2. Fill in `.env` for production**

```env
KAUTH_BASE_URL=https://auth.yourdomain.com
KAUTH_ENV=production
KAUTH_SECRET_KEY=        # openssl rand -hex 32

DB_NAME=kotauth_db
DB_USER=kotauth
DB_PASSWORD=             # strong unique password

DOMAIN=auth.yourdomain.com
ACME_EMAIL=you@yourdomain.com
```

**3. Start**

```bash
docker compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml up -d
```

This brings up three services: `db` (PostgreSQL with a persistent volume), `app` (Kotauth from GHCR), and `caddy` (automatic TLS). Caddy obtains the certificate on first startup — this requires port 80 to be reachable for the ACME HTTP-01 challenge.

<Aside type="tip">
Block port 8080 on the host firewall after starting — only Caddy should handle inbound traffic. For example: `ufw deny 8080`.
</Aside>

---

## Manual reverse proxy setup

If you already have a reverse proxy running on the host, skip the Caddy overlay and proxy to port 8080 directly.

### Caddy (standalone)

```
auth.yourdomain.com {
    reverse_proxy kotauth:8080
}
```

That's the entire Caddyfile. Caddy provisions and renews the certificate automatically.

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
- `DB_URL`, `DB_USER`, `DB_PASSWORD` point to your production PostgreSQL instance
- Database user has `CREATE`, `SELECT`, `INSERT`, `UPDATE`, `DELETE` permissions (required for Flyway migrations on first boot)
- Port 5432 is blocked on the host firewall — the database should never be publicly reachable

---

## Encryption at rest

`KAUTH_SECRET_KEY` derives the AES-256-GCM key used to encrypt sensitive data stored in the database. This currently covers:

- **RSA private keys** — each tenant's JWT signing key is encrypted before being persisted. Existing plaintext keys are automatically migrated to encrypted form on first startup after upgrading to v1.3.0+.
- **SMTP credentials** — passwords for workspace SMTP configurations.
- **TOTP secrets** — MFA enrollment seeds.

If `KAUTH_SECRET_KEY` is lost, all encrypted data becomes irrecoverable. Back up this value alongside your database backups.

---

## HTTP compression and caching

Kotauth enables gzip and deflate compression on all HTTP responses. Static assets (CSS bundles, JavaScript, Swagger UI files) are served with long-lived `Cache-Control` headers. No additional reverse proxy configuration is needed for compression — Ktor handles it at the application level.

---

## Security configuration

After startup, complete these steps in the admin console:

**Change the master workspace admin password.** Default credentials are printed in the startup log on first boot and must be rotated immediately.

**Configure SMTP.** Required for email verification and password resets. Without it, users cannot verify their email or reset forgotten passwords. Set this up under **Settings → SMTP** in each workspace.

**Review password policy.** The default (minimum 8 characters) may not meet your requirements. Tighten it under **Settings → Security**.

**Set the MFA policy.** Decide whether MFA should be `optional`, `required`, or `required_for_admins`. For sensitive workspaces, `required` is the safe default.

**Create workspaces with meaningful slugs.** The workspace slug appears in every URL and cannot be changed after creation. Choose something permanent (e.g. `my-product`, not `test-1`).

---

## Upgrading

Kotauth uses Flyway for schema migrations. Upgrades are handled automatically on startup — pull the new image and restart:

```bash
docker compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml pull
docker compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml up -d
```

Flyway runs any pending migrations before the server begins accepting traffic. Always back up the database before upgrading between major versions.

To pin to a specific version rather than tracking `latest`, edit `docker/docker-compose.yml`:

```yaml
# change:
image: ghcr.io/inumansoul/kotauth:latest
# to:
image: ghcr.io/inumansoul/kotauth:1.0.1
```

---

## Database backup

Kotauth's entire state lives in PostgreSQL. Back up regularly using standard PostgreSQL tools:

```bash
# Docker Compose stack
docker exec kotauth-db pg_dump -U kotauth kotauth_db > backup_$(date +%Y%m%d).sql

# External database
pg_dump -h your-db-host -U kotauth kotauth_db > backup_$(date +%Y%m%d).sql
```

Restore:

```bash
cat backup_20260101.sql | docker exec -i kotauth-db psql -U kotauth -d kotauth_db
```

There is no Kotauth-specific backup procedure — standard PostgreSQL backup and restore works fully.

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

<Aside type="tip">
The `X-Request-Id` header is generated per request and included in all log lines for that request. Include it in your reverse proxy access logs to correlate application logs with proxy logs during incident investigation.
</Aside>
