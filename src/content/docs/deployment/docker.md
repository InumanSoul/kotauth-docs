---
title: Docker
description: Running Kotauth with Docker and Docker Compose.
sidebar:
  order: 2
---

import { Aside } from '@astrojs/starlight/components';

Kotauth ships as a single Docker image. It requires a PostgreSQL database — everything else is self-contained.

## Docker Compose (recommended for local dev)

The repository includes a `docker-compose.yml` that starts Kotauth and PostgreSQL together:

```yaml
services:
  kotauth:
    build: .
    ports:
      - "8080:8080"
    environment:
      KAUTH_BASE_URL: http://localhost:8080
      KAUTH_SECRET_KEY: ${KAUTH_SECRET_KEY}
      DB_URL: jdbc:postgresql://db:5432/kotauth_db
      DB_USER: postgres
      DB_PASSWORD: postgres
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: kotauth_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - kotauth_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  kotauth_data:
```

Start with:

```bash
docker compose up
```

Database migrations run automatically on first boot via Flyway. No manual setup needed.

## Running the image directly

If you already have a PostgreSQL database:

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
  ghcr.io/your-org/kotauth:latest
```

## Image details

| Property | Value |
|---|---|
| Runtime base | `eclipse-temurin:17-jre` |
| Runtime size | ~85 MB |
| Build | 3-stage multi-stage |
| Port | `8080` |
| Startup time | ~3–5 seconds |

The image is built in three stages to keep the runtime lean:

**Stage 1 — CSS compilation (`node:20-slim`).** Installs `lightningcss-cli` via npm and compiles two CSS bundles — `kotauth-admin.css` (admin console, fixed dark theme) and `kotauth-auth.css` (auth pages, no `:root` defaults — token values are injected by `TenantTheme` at runtime). Node.js is not present in the final image.

**Stage 2 — Kotlin build (`gradle:8-jdk17`).** Copies the compiled CSS bundles from Stage 1 into `src/main/resources/static/` and runs `gradle buildFatJar`, skipping the CSS Gradle tasks since the output already exists. Gradle and the JDK are not present in the final image.

**Stage 3 — Runtime (`eclipse-temurin:17-jre`).** Copies only the fat JAR from Stage 2. Adds `curl` for the health check probe. No build tools, no Node.js, no source code.

## Health checks

Kotauth exposes two health endpoints for container orchestration:

| Endpoint | Purpose |
|---|---|
| `GET /health` | Liveness — is the process running? |
| `GET /health/ready` | Readiness — is the database connected and migrations applied? |

Configure your orchestrator to use `/health/ready` for readiness probes and `/health` for liveness probes.

**Docker health check:**

```yaml
healthcheck:
  test: ["CMD", "wget", "-qO-", "http://localhost:8080/health/ready"]
  interval: 10s
  timeout: 5s
  retries: 3
  start_period: 15s
```

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
          image: ghcr.io/your-org/kotauth:latest
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
