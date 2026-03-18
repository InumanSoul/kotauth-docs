---
title: Production Checklist
description: What you need before going live with Kotauth in production.
sidebar:
  order: 3
---

import { Aside } from '@astrojs/starlight/components';

## Requirements

**Minimum hardware:** 512 MB RAM, 1 vCPU.

**PostgreSQL 14 or newer** is required. Kotauth manages its own schema via Flyway migrations.

**TLS is mandatory.** Kotauth does not handle TLS directly — it expects a reverse proxy to terminate it. Set `KAUTH_ENV=production` and ensure `KAUTH_BASE_URL` starts with `https://`. The server refuses to start otherwise.

---

## Reverse proxy setup

### Caddy (recommended)

Caddy handles TLS automatically via Let's Encrypt:

```
auth.yourdomain.com {
    reverse_proxy kotauth:8080
}
```

That's the entire Caddyfile configuration. Caddy provisions and renews the certificate automatically.

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
# docker-compose.yml labels
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
- `KAUTH_SECRET_KEY` is set to a securely generated 32+ byte hex string (`openssl rand -hex 32`)
- `DB_URL`, `DB_USER`, `DB_PASSWORD` point to your production PostgreSQL instance
- Database user has `CREATE`, `SELECT`, `INSERT`, `UPDATE`, `DELETE` permissions (needed for Flyway migrations on first boot)

---

## Security configuration

After startup, complete these steps in the admin console:

**Change the master workspace admin password.** Default credentials are printed in the startup log on first boot and must be rotated immediately.

**Configure SMTP.** Kotauth requires SMTP for email verification and password resets. Without it, users cannot verify their email or reset forgotten passwords. Set this up under **Settings → SMTP** in each workspace.

**Review password policy.** The default policy (minimum 8 characters) may not meet your requirements. Tighten it under **Settings → Security**.

**Set the MFA policy.** Decide whether MFA should be `optional`, `required`, or `required_for_admins`. For sensitive workspaces, `required` is the safe default.

**Create workspaces with meaningful slugs.** The workspace slug appears in every URL and cannot be changed after creation. Choose something permanent (e.g. `my-product`, not `test-1`).

---

## Database backup

Kotauth's entire state lives in PostgreSQL. Back up the database regularly using standard PostgreSQL tools:

```bash
pg_dump -h your-db-host -U kotauth kotauth_db > backup.sql
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
