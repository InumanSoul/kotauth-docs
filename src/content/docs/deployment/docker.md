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

The repository ships three compose files inside the `docker/` folder, each covering a different use case.

### Pre-built image (recommended)

`docker/docker-compose.yml` — uses the GHCR image, no build step. This is the recommended path for running Kotauth without cloning the repo.

```bash
docker compose -f docker/docker-compose.yml up -d
```

The compose file pulls `ghcr.io/inumansoul/kotauth:latest`, starts PostgreSQL 15, and wires them together. All configuration comes from `.env` at the project root.

### Build from source

`docker/docker-compose.dev.yml` — builds the image from the local `Dockerfile`. Used by contributors and anyone iterating on the source code.

```bash
# via Makefile (recommended)
make up

# or directly
docker compose -f docker/docker-compose.dev.yml up -d --build
```

The build context is the repo root, so Gradle and Node.js have access to the full source tree.

### External database (bring your own)

`docker/docker-compose.external-db.yml` — runs only the Kotauth container, no bundled PostgreSQL. Use this when connecting to a managed provider (RDS, Supabase, Neon) or any existing PostgreSQL instance.

```bash
docker compose -f docker/docker-compose.external-db.yml up -d
```

Requires `DB_URL`, `DB_USER`, and `DB_PASSWORD` in `.env`. See [External Databases](/deployment/external-database/) for provider-specific connection strings.

### Production with Caddy TLS

`docker/docker-compose.prod.yml` — an overlay that adds a Caddy sidecar for automatic Let's Encrypt TLS. Stack on top of either the pre-built or external-db compose file:

```bash
# With bundled database
docker compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml up -d

# With external database
docker compose -f docker/docker-compose.external-db.yml -f docker/docker-compose.prod.yml up -d
```

See [Production Checklist](/deployment/production/) for the full setup.

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
| Runtime size | ~85 MB |
| Build | 3-stage multi-stage |
| Port | `8080` |
| Startup time | ~3–5 seconds |

The image is built in three stages to keep the runtime lean:

**Stage 1 — CSS compilation (`node:20-slim`).** Installs `lightningcss-cli` via npm and compiles four CSS bundles — `kotauth-admin.css`, `kotauth-auth.css`, `kotauth-portal-sidenav.css`, and `kotauth-portal-tabnav.css`. Node.js is not present in the final image.

**Stage 2 — Kotlin build (`gradle:8-jdk17`).** Copies the compiled CSS bundles from Stage 1 and runs `gradle buildFatJar`. Gradle and the JDK are not present in the final image.

**Stage 3 — Runtime (`eclipse-temurin:17-jre`).** Copies only the fat JAR. Adds `curl` for the health check probe. No build tools, no source code.

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
Kotauth does not currently support horizontal scaling with session stickiness. Rate limiting is in-memory per instance. If you run multiple replicas, use a reverse proxy with session affinity or accept that rate limits apply per-instance rather than globally.
</Aside>
