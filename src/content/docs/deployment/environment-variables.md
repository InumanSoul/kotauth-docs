---
title: Environment Variables
description: All environment variables Kotauth reads at startup.
sidebar:
  order: 1
---

import { Aside } from '@astrojs/starlight/components';

All configuration is passed to Kotauth via environment variables. Variables marked **Required** cause a fatal startup error if missing. Variables marked **Recommended** degrade functionality if absent but do not block startup.

---

## Core

### `KAUTH_BASE_URL`

**Required.**

The public base URL of the Kotauth instance. Used as the OIDC issuer (`iss` claim), in OIDC discovery documents, OAuth2 redirect URI validation, and email links.

```
KAUTH_BASE_URL=https://auth.yourdomain.com
```

Rules:
- Must start with `https://` when `KAUTH_ENV=production`. The server refuses to start otherwise.
- HTTP is allowed for `localhost` in development mode.
- No trailing slash.

---

### `KAUTH_ENV`

**Optional.** Default: `development`

Controls startup validation strictness.

| Value | Behavior |
|---|---|
| `development` | HTTP allowed, startup warnings printed |
| `production` | HTTPS required, default JWT secret rejected, strict cookie flags enforced |

```
KAUTH_ENV=production
```

---

### `KAUTH_SECRET_KEY`

**Required.**

A 32+ character hex string used for AES-256-GCM encryption (SMTP passwords, RSA private keys at rest) and HMAC-SHA256 signing of short-lived cookies (MFA pending, PKCE verifier, portal session).

```bash
# Generate a key:
java -jar kauth.jar cli generate-secret-key

# Or manually:
openssl rand -hex 32
```

```
KAUTH_SECRET_KEY=<paste output here>
```

<Aside type="danger">
The server will not start without this key. There is no fallback in any environment.
</Aside>

<Aside type="danger">
If this key is rotated or lost: all encrypted data (SMTP passwords, RSA private keys) must be re-provisioned and all active sessions will be invalidated. Store it securely alongside your database credentials.
</Aside>

---

### `KAUTH_DEMO_MODE`

**Optional.** Default: `false`

When set to `true`, seeds two pre-configured workspaces with users, roles, groups, applications, webhooks, and audit history on startup. Renders a credential banner on all pages. Designed for public showcase deployments.

```
KAUTH_DEMO_MODE=true
```

---

## Database

Kotauth connects to PostgreSQL using a standard JDBC URL. You can either provide the full URL directly via `DB_URL`, or let the compose stack construct it from the individual component variables.

### `DB_URL`

**Optional override.**

Full PostgreSQL JDBC connection URL. When set, takes full precedence — `DB_HOST`, `DB_PORT`, and `DB_NAME` are ignored entirely.

Use this to connect to an external or managed database, or whenever you need to append JDBC parameters such as SSL mode:

```
DB_URL=jdbc:postgresql://your-host:5432/kotauth_db?sslmode=require
```

When `DB_URL` is not set, the bundled compose stack constructs it automatically from `DB_HOST`, `DB_PORT`, and `DB_NAME`.

See [External Databases](/deployment/external-database/) for provider-specific connection strings.

---

### `DB_HOST`

**Optional.** Default (in Docker Compose): `db`

Hostname of the PostgreSQL server. Used to construct the JDBC URL when `DB_URL` is not set.

```
# Bundled db service (default for local / Docker Compose)
DB_HOST=db

# External server
DB_HOST=xxx.rds.amazonaws.com
```

---

### `DB_PORT`

**Optional.** Default: `5432`

Port of the PostgreSQL server. Used to construct the JDBC URL when `DB_URL` is not set.

```
DB_PORT=5432
```

Common non-default ports: `6432` for PgBouncer, `5433` for a non-standard local instance.

<Aside type="caution">
If using PgBouncer in transaction pooling mode, Flyway migrations will fail — Flyway requires a persistent session connection. Use session pooling mode, or connect directly to PostgreSQL for migrations.
</Aside>

---

### `DB_POOL_MAX_SIZE`

**Optional.** Default: `10`

Maximum number of connections in the HikariCP pool.

```
DB_POOL_MAX_SIZE=10
```

---

### `DB_POOL_MIN_IDLE`

**Optional.** Default: `2`

Minimum idle connections maintained by HikariCP.

```
DB_POOL_MIN_IDLE=2
```

---

### `DB_NAME`

**Optional.** Default (in Docker Compose): `kotauth_db`

Database name. Used to construct the JDBC URL when `DB_URL` is not set, and to initialize the bundled `db` service.

```
DB_NAME=kotauth_db
```

---

### `DB_USER`

**Required.**

PostgreSQL username.

```
DB_USER=kotauth
```

---

### `DB_PASSWORD`

**Required.**

PostgreSQL password.

```
DB_PASSWORD=<strong password>
```

---

## Docker production stack

These variables are only used when running `docker/docker-compose.prod.yml` (the Caddy TLS overlay). They are not read by Kotauth itself.

### `DOMAIN`

**Required by `docker-compose.prod.yml`.**

The public domain Caddy will serve and obtain a TLS certificate for.

```
DOMAIN=auth.yourdomain.com
```

### `ACME_EMAIL`

**Required by `docker-compose.prod.yml`.**

Email address sent to Let's Encrypt for certificate notifications.

```
ACME_EMAIL=you@yourdomain.com
```

---

## Per-tenant settings

These are not environment variables — they are configured per workspace through the admin console. Documented here for reference.

### Token lifetimes

| Setting | Default | Notes |
|---|---|---|
| Access token TTL | 300s (5 min) | Configurable per application |
| Refresh token TTL | 86400s (24h) | Workspace-wide |
| Email verification token | 24h | Fixed |
| Password reset token | 1h | Fixed |

### Password policy

- Minimum length (default: 8, range: 4–128)
- Require uppercase / lowercase / numbers / symbols
- Maximum age in days (0 = no expiry, range: 0–365)
- Password history depth — prevent reuse of last N passwords (0 = no history check, range: 0–24)
- Blacklist enabled — reject known-compromised passwords

### Account lockout

- Maximum failed attempts before lockout (default: 0 = disabled, range: 0–100)
- Lockout duration in minutes (default: 15, range: 1–1440)
- Admin can manually unlock users from the admin console
- Locked users receive an email notification with a password reset link (requires SMTP)

### MFA policy

| Value | Behavior |
|---|---|
| `optional` | Users can enroll but are not required to |
| `required` | All users must complete MFA before accessing the portal |
| `required_for_admins` | Only users with the `admin` role are required to enroll |

### SMTP

- Host, port, username, password (AES-256-GCM encrypted at rest)
- From address and display name
- TLS mode: `NONE`, `STARTTLS`, or `SSL`

---

## Example configurations

### Local development

```env
KAUTH_BASE_URL=http://localhost:8080
KAUTH_ENV=development
KAUTH_SECRET_KEY=        # openssl rand -hex 32

DB_HOST=db
DB_PORT=5432
DB_NAME=kotauth_db
DB_USER=kotauth
DB_PASSWORD=changeme
```

### Production — bundled PostgreSQL

```env
KAUTH_BASE_URL=https://auth.yourdomain.com
KAUTH_ENV=production
KAUTH_SECRET_KEY=        # openssl rand -hex 32

DB_HOST=db
DB_PORT=5432
DB_NAME=kotauth_db
DB_USER=kotauth
DB_PASSWORD=             # strong unique password

DOMAIN=auth.yourdomain.com
ACME_EMAIL=you@yourdomain.com
```

### Production — external managed database

```env
KAUTH_BASE_URL=https://auth.yourdomain.com
KAUTH_ENV=production
KAUTH_SECRET_KEY=        # openssl rand -hex 32

# DB_URL overrides DB_HOST / DB_PORT / DB_NAME
DB_URL=jdbc:postgresql://your-managed-host:5432/kotauth_db?sslmode=require
DB_USER=kotauth
DB_PASSWORD=             # strong unique password
```

See [External Databases](/deployment/external-database/) for provider-specific examples.
