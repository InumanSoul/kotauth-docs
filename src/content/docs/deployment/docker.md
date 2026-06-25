---
title: Docker
description: Running Kotauth with Docker and Docker Compose.
sidebar:
  order: 2
---

import { Aside, Tabs, TabItem } from '@astrojs/starlight/components';

Kotauth ships as a single Docker image published to GitHub Container Registry. It requires a PostgreSQL database — everything else is self-contained.

## Available images

Images are published on every tagged release. Use a pinned tag in production — never `latest` in a long-running deployment.

| Tag | Description |
|---|---|
| `ghcr.io/inumansoul/kotauth:latest` | Latest stable release |
| `ghcr.io/inumansoul/kotauth:1` | Latest patch in the `1.x` line |
| `ghcr.io/inumansoul/kotauth:1.1` | Latest patch in `1.1.x` |
| `ghcr.io/inumansoul/kotauth:1.1.2` | Exact version pin |

Pre-release tags (e.g. `1.0.1-rc1`) are published but do not move the `latest` or major/minor tags.

```bash
docker pull ghcr.io/inumansoul/kotauth:latest
```

---

## Docker Compose

The repository ships two compose files at the project root.

### `docker-compose.yml` — Local and evaluation

Bundles PostgreSQL, builds from source via `--build`, and optionally starts Redis behind `--profile redis`. Used by `make up` and for local evaluation.

```bash
# Pull the pre-built image and start
docker compose up -d

# Or build from source (contributors)
make up
```

Redis for distributed sessions and rate limiting:

```bash
docker compose --profile redis up -d
```

### `docker-compose.prod.yml` — Production with Caddy TLS

Adds a [Caddy](https://caddyserver.com/) sidecar for automatic Let's Encrypt TLS. `KAUTH_TRUSTED_PROXY=true` is baked in. Same `--profile redis` option.

```bash
docker compose -f docker-compose.prod.yml up -d
```

See [Production Checklist](/deployment/production/) for the full setup.

### Using an external database

Both compose files bundle a PostgreSQL service. To connect to a managed database instead (RDS, Supabase, Neon), set `DB_URL` in your `.env` file — the bundled `db` service runs idle or can be removed by hand. See [External Databases](/deployment/external-database/).

### Demo mode

Set `KAUTH_DEMO_MODE=true` in `.env` to seed two pre-configured workspaces with users, roles, and applications on startup. A credential banner renders on all pages.

---

## Running the image directly

If you already have a PostgreSQL database and prefer `docker run`:

```bash
docker run -d \
  --name kotauth \
  -p 8080:8080 \
  -e KAUTH_BASE_URL=https://auth.yourdomain.com \
  -e KAUTH_ENV=production \
  -e KAUTH_SECRET_KEY=$(openssl rand -hex 32) \
  -e DB_URL=jdbc:postgresql://your-db-host:5432/kotauth_db \
  -e DB_USER=kotauth \
  -e DB_PASSWORD=your-password \
  ghcr.io/inumansoul/kotauth:latest
```

---

## Image details

| Property | Value |
|---|---|
| Runtime base | `eclipse-temurin:17-jre` |
| Runtime size | ~120 MB |
| Build | 3-stage multi-stage |
| Port | `8080` |
| User | `kotauth` (UID 10001, GID 10001) |
| Startup time | ~3–5 seconds |

The image is built in three stages to keep the runtime lean:

**Stage 1 — CSS compilation (`node:20-slim`).** Installs `lightningcss-cli` via npm and compiles four CSS bundles — `kotauth-admin.css`, `kotauth-auth.css`, `kotauth-portal-sidenav.css`, and `kotauth-portal-tabnav.css`. Node.js is not present in the final image.

**Stage 2 — Kotlin build (`gradle:8-jdk17`).** Copies the compiled CSS bundles from Stage 1 and runs `gradle buildFatJar`. Gradle and the JDK are not present in the final image.

**Stage 3 — Runtime (`eclipse-temurin:17-jre`).** Copies only the fat JAR. Adds `curl` for the health check probe. Runs as non-root user `kotauth` (UID 10001) with `no-new-privileges`, `cap_drop: ALL`, and a read-only filesystem. No build tools, no source code.

---

## Health checks

Kotauth exposes two health endpoints for container orchestration:

| Endpoint | Purpose |
|---|---|
| `GET /health` | Liveness — is the process running? |
| `GET /health/ready` | Readiness — is the database connected and migrations applied? |

Use `/health/ready` for readiness probes and `/health` for liveness probes.

```yaml
healthcheck:
  test: ["CMD-SHELL", "curl -sf http://localhost:8080/health/ready || exit 1"]
  interval: 10s
  timeout: 5s
  retries: 6
  start_period: 30s
```

---

## File-based secrets

Sensitive environment variables accept a `*_FILE` sibling that reads the value from a file at startup. This is the recommended approach for Docker Swarm secrets, Kubernetes mounted secrets, and systemd `LoadCredential=`.

Supported variables: `KAUTH_SECRET_KEY`, `DB_PASSWORD`, `KAUTH_REDIS_PASSWORD`, `KAUTH_BOOTSTRAP_ADMIN_PASSWORD`, `KAUTH_BOOTSTRAP_API_KEYS`.

```yaml
# Docker Swarm example
services:
  kauth:
    image: ghcr.io/inumansoul/kotauth:latest
    environment:
      KAUTH_SECRET_KEY_FILE: /run/secrets/kauth_secret_key
      DB_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - kauth_secret_key
      - db_password
```

When both `<NAME>` and `<NAME>_FILE` are set, the file value takes precedence.

See [Environment Variables](/deployment/environment-variables/) for the full list.

---

## Kubernetes deployment

A minimal Kubernetes deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kotauth
spec:
  replicas: 1
  selector:
    matchLabels:
      app: kotauth
  template:
    metadata:
      labels:
        app: kotauth
    spec:
      containers:
        - name: kotauth
          image: ghcr.io/inumansoul/kotauth:1
          ports:
            - containerPort: 8080
          env:
            - name: KAUTH_BASE_URL
              value: "https://auth.yourdomain.com"
            - name: KAUTH_ENV
              value: "production"
            - name: KAUTH_SECRET_KEY
              valueFrom:
                secretKeyRef:
                  name: kotauth-secrets
                  key: secret-key
            - name: DB_URL
              value: "jdbc:postgresql://postgres-svc:5432/kotauth_db"
            - name: DB_USER
              valueFrom:
                secretKeyRef:
                  name: kotauth-secrets
                  key: db-user
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: kotauth-secrets
                  key: db-password
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 10
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 8080
            initialDelaySeconds: 10
```

<Aside type="note">
For multi-replica deployments, enable Redis (`KAUTH_REDIS_URL`) for shared sessions and global rate limiting. Without Redis, sessions and rate-limit counters are per-instance. See [Redis](/deployment/redis/).
</Aside>
