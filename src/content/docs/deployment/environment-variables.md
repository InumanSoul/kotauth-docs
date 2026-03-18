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
| `development` | HTTP allowed, default secrets tolerated, startup warnings printed |
| `production` | HTTPS required, default JWT secret rejected, strict cookie flags enforced |

```
KAUTH_ENV=production
```

---

### `KAUTH_SECRET_KEY`

**Recommended.**

A 32+ character hex string used for AES-256-GCM encryption of SMTP passwords stored in the database and HMAC-SHA256 signing of short-lived cookies (MFA pending, PKCE verifier, portal session).

```
KAUTH_SECRET_KEY=a2c35a1bfe82492eb087c5a29b28fc2b1fc2505da2a6f5dd37201c2bf4df39b3
```

Generate one with:

```bash
openssl rand -hex 32
```

<Aside type="caution">
If not set: SMTP configuration cannot be saved, and sessions use a random key generated at startup — sessions do not survive a container restart. A warning is printed but the server still starts.
</Aside>

---

## Database

### `DB_URL`

**Required.**

PostgreSQL JDBC connection URL.

```
DB_URL=jdbc:postgresql://db:5432/kotauth_db
```

Kotauth runs Flyway migrations on startup. The database and schema are created automatically — only the server, database name, and credentials need to exist beforehand.

---

### `DB_USER`

**Required.**

```
DB_USER=postgres
```

---

### `DB_PASSWORD`

**Required.**

```
DB_PASSWORD=changeme
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

- Minimum length (default: 8)
- Require uppercase / lowercase / numbers / symbols
- Maximum age in days (0 = no expiry)
- Password history depth (0 = no history check)

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
KAUTH_SECRET_KEY=a2c35a1bfe82492eb087c5a29b28fc2b1fc2505da2a6f5dd37201c2bf4df39b3
# DB is injected by docker-compose — no need to set here
```

### Production

```env
KAUTH_BASE_URL=https://auth.yourdomain.com
KAUTH_ENV=production
KAUTH_SECRET_KEY=<openssl rand -hex 32>
DB_URL=jdbc:postgresql://your-db-host:5432/kotauth_db
DB_USER=kotauth
DB_PASSWORD=<strong password>
```
