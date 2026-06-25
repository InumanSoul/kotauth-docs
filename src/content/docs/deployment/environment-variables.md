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

A 32+ character hex string used for AES-256-GCM encryption (SMTP passwords, RSA private keys at rest), HMAC-SHA256 signing of short-lived cookies (MFA pending, PKCE verifier, portal session), and HMAC-SHA256 keying of the audit log integrity chain.

```bash
# Generate a key:
java -jar kauth.jar cli generate-secret-key

# Or manually:
openssl rand -hex 32
```

```
KAUTH_SECRET_KEY=<paste output here>
```

Supports file-based injection via `KAUTH_SECRET_KEY_FILE`. See [File-based secrets](#file-based-secrets) below.

<Aside type="danger">
The server will not start without this key. There is no fallback in any environment.
</Aside>

<Aside type="danger">
If this key is rotated or lost: all encrypted data (SMTP passwords, RSA private keys) must be re-provisioned, all active sessions will be invalidated, and the audit log HMAC chain cannot be verified for rows written with the old key. Store it securely alongside your database credentials.
</Aside>

---

### `KAUTH_DEMO_MODE`

**Optional.** Default: `false`

When set to `true`, seeds two pre-configured workspaces with users, roles, groups, applications, webhooks, and audit history on startup. Renders a credential banner on all pages. Designed for public showcase deployments.

```
KAUTH_DEMO_MODE=true
```

---

### `KAUTH_TRUSTED_PROXY`

**Optional.** Default: `false`

When set to `true`, Kotauth installs Ktor's `XForwardedHeaders` plugin and trusts `X-Forwarded-For` and `X-Forwarded-Proto` headers from reverse proxies. This affects rate limiting (IP extraction) and HTTPS detection.

```
KAUTH_TRUSTED_PROXY=true
```

<Aside type="danger">
Only enable this when Kotauth runs behind a trusted reverse proxy (nginx, Caddy, Traefik, cloud load balancer). When `false`, forwarded headers are ignored entirely — this prevents rate-limit bypass via header spoofing on directly-exposed deployments.
</Aside>

---

### `KAUTH_BOOTSTRAP_ADMIN_PASSWORD`

**Optional.**

Sets the password for the initial admin account (`admin` on the `master` tenant) created on first startup when the database is empty.

```
KAUTH_BOOTSTRAP_ADMIN_PASSWORD=YourStr0ng!Password
```

**Validation rules:** minimum 12 characters, at least one uppercase letter, one lowercase letter, and one digit. Failing validation causes a fatal startup error.

**Behavior when not set:**
- In demo mode (`KAUTH_DEMO_MODE=true`): uses the demo password `Demo1234!`
- In normal mode: generates a random password and prints it to stdout on first boot

<Aside type="caution">
As of v1.14.1, there are no hardcoded default credentials. If you do not set this variable and miss the generated password in the startup log, you must re-seed the database.
</Aside>

---

### `KAUTH_BOOTSTRAP_API_KEYS`

**Optional.**

A JSON array of API keys to provision idempotently on startup. Useful for infrastructure-as-code and CI/CD pipelines.

```
KAUTH_BOOTSTRAP_API_KEYS='[{"tenant":"my-app","name":"ci-key","scopes":["users:read","users:write"],"keyHash":"sha256hex..."}]'
```

Each object in the array:

| Field | Required | Description |
|---|---|---|
| `tenant` | Yes | Workspace slug |
| `name` | Yes | Key display name (upsert key — identifies the key) |
| `scopes` | Yes | Array of scope strings |
| `keyHash` | Yes | SHA-256 hex digest of the raw API key |
| `keyPrefix` | No | Display prefix (default: `kauth_{tenant}` truncated to 16 chars) |

**Upsert behavior:**
- If no key with that `(tenant, name)` pair exists: created with `enabled=true`
- If a key exists and hash + scopes match: no-op
- If a key exists but hash or scopes differ: updated, re-enabled if previously disabled

<Aside type="danger">
Invalid JSON, unknown tenant slugs, or unknown scope names cause a fatal startup error (`exitProcess(1)`). Validate your configuration before deploying.
</Aside>

Use `java -jar kauth.jar cli hash-api-key` to generate the SHA-256 hash for the `keyHash` field. See [CLI Commands](/deployment/cli/).

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

PostgreSQL password. As of v1.14.0, the server refuses to start if this is blank or missing — there is no fallback.

```
DB_PASSWORD=<strong password>
```

---

## Redis

### `KAUTH_REDIS_URL`

**Optional.**

Redis connection URL. When set, Kotauth uses Redis for distributed session storage and rate limiting instead of in-memory stores. Required for multi-instance deployments.

```
KAUTH_REDIS_URL=redis://localhost:6379
```

With authentication and TLS:

```
KAUTH_REDIS_URL=rediss://:your-password@redis-host:6380
```

See [Redis](/deployment/redis/) for full setup instructions.

---

### `KAUTH_REDIS_POOL_SIZE`

**Optional.** Default: `8`

Maximum connections in the Lettuce connection pool.

```
KAUTH_REDIS_POOL_SIZE=8
```

---

### `KAUTH_REDIS_TIMEOUT_MS`

**Optional.** Default: `3000`

Connection and command timeout in milliseconds.

```
KAUTH_REDIS_TIMEOUT_MS=3000
```

---

### `KAUTH_REDIS_KEY_PREFIX`

**Optional.** Default: `kotauth:`

Prefix for all Redis keys. Useful when sharing a Redis instance with other services.

```
KAUTH_REDIS_KEY_PREFIX=kotauth:
```

---

### `KAUTH_REDIS_PASSWORD`

**Optional.**

Redis authentication password. Used when the Redis instance requires authentication and you prefer to set the password separately rather than embedding it in `KAUTH_REDIS_URL`.

```
KAUTH_REDIS_PASSWORD=your-redis-password
```

Supports file-based injection via `KAUTH_REDIS_PASSWORD_FILE`. See [File-based secrets](#file-based-secrets) below.

---

## Internationalization

### `KAUTH_I18N_BUNDLE_DIR`

**Optional.**

Path to a directory containing JSON translation bundles. Each file should be named with a locale code (e.g. `es.json`, `fr.json`). When not set, only English is available.

```
KAUTH_I18N_BUNDLE_DIR=/i18n
```

See [Internationalization](/customization/i18n/) for bundle format and Docker configuration.

---

## Auto-update

### `KAUTH_UPDATE_CHECK`

**Optional.** Default: `true`

When `true`, Kotauth queries a version manifest on startup and surfaces available updates in the admin console. Set to `false` for air-gapped deployments.

```
KAUTH_UPDATE_CHECK=false
```

---

### `KAUTH_UPDATE_CHECK_URL`

**Optional.**

Override the default version manifest URL. Useful for private registries or internal update servers. Must use `https://` — the server refuses to start if an HTTP URL is provided. The HTTP client follows zero redirects, and `releaseUrl` values from the manifest are restricted to `https://` schemes.

```
KAUTH_UPDATE_CHECK_URL=https://internal.example.com/kotauth/versions.json
```

---

## File-based secrets

Sensitive environment variables accept a `*_FILE` sibling that reads the value from a filesystem path at startup. The file contents are read and trimmed. When both `<NAME>` and `<NAME>_FILE` are set, the file value takes precedence.

| Variable | `_FILE` sibling |
|---|---|
| `KAUTH_SECRET_KEY` | `KAUTH_SECRET_KEY_FILE` |
| `DB_PASSWORD` | `DB_PASSWORD_FILE` |
| `KAUTH_REDIS_PASSWORD` | `KAUTH_REDIS_PASSWORD_FILE` |
| `KAUTH_BOOTSTRAP_ADMIN_PASSWORD` | `KAUTH_BOOTSTRAP_ADMIN_PASSWORD_FILE` |
| `KAUTH_BOOTSTRAP_API_KEYS` | `KAUTH_BOOTSTRAP_API_KEYS_FILE` |

Compatible with Docker Swarm secrets, Kubernetes mounted secrets, and systemd `LoadCredential=`. See [Docker — File-based secrets](/deployment/docker/#file-based-secrets) for a compose example.

---

## Docker production stack

These variables are only used when running `docker-compose.prod.yml` (the Caddy TLS production compose). They are not read by Kotauth itself.

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

```dotenv
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

```dotenv
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

```dotenv
KAUTH_BASE_URL=https://auth.yourdomain.com
KAUTH_ENV=production
KAUTH_SECRET_KEY=        # openssl rand -hex 32

# DB_URL overrides DB_HOST / DB_PORT / DB_NAME
DB_URL=jdbc:postgresql://your-managed-host:5432/kotauth_db?sslmode=require
DB_USER=kotauth
DB_PASSWORD=             # strong unique password
```

See [External Databases](/deployment/external-database/) for provider-specific examples.
