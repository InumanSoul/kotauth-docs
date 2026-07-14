---
title: Redis
description: Optional Redis sidecar for distributed session storage and rate limiting.
sidebar:
  order: 8
---

By default, Kotauth stores sessions and rate-limiting counters in memory. This works well for single-instance deployments but breaks when running multiple Kotauth instances behind a load balancer — sessions created on one instance are invisible to another, and rate limits are enforced per-instance rather than globally.

Adding a Redis sidecar upgrades both stores to distributed implementations. Sessions are shared across all instances, and rate limiting is enforced globally with atomic Lua scripts.

## Enabling Redis

Set the `KAUTH_REDIS_URL` environment variable to your Redis connection string:

```dotenv
KAUTH_REDIS_URL=redis://localhost:6379
```

With authentication:

```dotenv
KAUTH_REDIS_URL=redis://:your-password@redis-host:6379
```

With TLS (Redis 6+):

```dotenv
KAUTH_REDIS_URL=rediss://:your-password@redis-host:6380
```

When `KAUTH_REDIS_URL` is set, Kotauth automatically switches from in-memory to Redis-backed implementations for both sessions and rate limiting. No other configuration changes are required.

:::tip
If you are running a single Kotauth instance, Redis is optional. The in-memory stores are faster and have no external dependency. Add Redis when you need horizontal scaling or want sessions to survive container restarts.
:::

## What Redis stores

| Data | In-memory default | Redis behavior |
|---|---|---|
| User sessions | JVM heap, lost on restart | Persisted across restarts, shared across instances |
| Rate-limit counters | Per-instance counters | Global counters with atomic Lua scripts |

:::note
Redis is used only for ephemeral data (sessions and rate limits). All durable data — users, roles, applications, audit logs — is always stored in PostgreSQL.
:::

## Fail-closed semantics

If Redis becomes unavailable after startup, Kotauth rejects requests that require session validation or rate-limit checks rather than silently bypassing them. This fail-closed design ensures that a Redis outage does not degrade security guarantees.

Once Redis reconnects, operations resume automatically — the Lettuce client handles reconnection transparently.

## Connection tuning

Additional environment variables for Redis connection behavior:

| Variable | Default | Description |
|---|---|---|
| `KAUTH_REDIS_URL` | — | Redis connection URL (required to enable Redis) |
| `KAUTH_REDIS_POOL_SIZE` | `8` | Maximum connections in the Lettuce pool |
| `KAUTH_REDIS_TIMEOUT_MS` | `3000` | Connection and command timeout in milliseconds |
| `KAUTH_REDIS_KEY_PREFIX` | `kotauth:` | Prefix for all Redis keys (useful for shared Redis instances) |

## Docker Compose example

```yaml
services:
  kauth:
    image: ghcr.io/inumansoul/kotauth:latest
    environment:
      KAUTH_BASE_URL: https://auth.yourdomain.com
      KAUTH_SECRET_KEY: ${KAUTH_SECRET_KEY}
      KAUTH_REDIS_URL: redis://redis:6379
      DB_HOST: db
      DB_USER: kotauth
      DB_PASSWORD: ${DB_PASSWORD}
    depends_on:
      - db
      - redis

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: kotauth_db
      POSTGRES_USER: kotauth
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pg-data:/var/lib/postgresql/data

volumes:
  redis-data:
  pg-data:
```

## Rate limiting with Redis

Rate-limit counters use Lua scripts executed atomically on Redis. This ensures that concurrent requests across multiple Kotauth instances are counted accurately — a burst of login attempts spread across three instances hits the same counter.

The rate-limit tiers remain unchanged:

| Path | Limit |
|---|---|
| Login attempts | Per IP, per workspace |
| MFA challenges | 5 per 5 minutes per user |
| Password reset | 3 per 5 minutes per email |

## Next steps

- [Docker](/deployment/docker/) — container configuration and compose files
- [Production Checklist](/deployment/production/) — hardening for production deployments
- [Environment Variables](/deployment/environment-variables/) — full configuration reference
