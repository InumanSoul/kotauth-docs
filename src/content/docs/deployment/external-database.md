---
title: External Databases
description: Connecting Kotauth to a managed or external PostgreSQL database.
sidebar:
  order: 4
---

import { Aside, Tabs, TabItem } from '@astrojs/starlight/components';

By default, Kotauth's Docker Compose stack starts a bundled PostgreSQL 15 container. For production deployments, you'll often want to connect to a managed database service instead — RDS, Supabase, Neon, Railway, Render, or your own self-managed PostgreSQL server.

Kotauth connects to PostgreSQL via a standard JDBC URL. All connection configuration is done through environment variables — no code changes required.

---

## How connection is configured

There are two ways to specify the database connection. **`DB_URL` always wins** when set.

**Option A — Full JDBC URL (recommended for external databases)**

Set `DB_URL` directly in `.env`. All other `DB_*` variables are ignored.

```env
DB_URL=jdbc:postgresql://your-host:5432/kotauth_db?sslmode=require
DB_USER=kotauth
DB_PASSWORD=your-password
```

**Option B — Component variables (default for the bundled stack)**

Let the compose file construct the URL from parts. Useful when using the bundled `db` service or a simple external server that doesn't need extra JDBC parameters.

```env
DB_HOST=db         # defaults to the Docker service name
DB_PORT=5432
DB_NAME=kotauth_db
DB_USER=kotauth
DB_PASSWORD=your-password
```

The compose stack resolves these to: `jdbc:postgresql://db:5432/kotauth_db`

---

## Skipping the bundled database

Use `docker/docker-compose.external-db.yml` instead of the default compose file. It runs only the Kotauth container — no bundled PostgreSQL.

```bash
docker compose -f docker/docker-compose.external-db.yml up -d
```

Set `DB_URL`, `DB_USER`, and `DB_PASSWORD` in your `.env` file. The compose file will fail fast with a clear error if any of these are missing.

For production with TLS, layer the Caddy overlay on top:

```bash
docker compose -f docker/docker-compose.external-db.yml -f docker/docker-compose.prod.yml up -d
```

<Aside type="note">
The default `docker/docker-compose.yml` bundles PostgreSQL and wires everything automatically. Only use `docker-compose.external-db.yml` when you're connecting to your own database.
</Aside>

---

## SSL and connection parameters

Most managed PostgreSQL providers require or recommend SSL. Append parameters as a query string to `DB_URL`:

| Parameter | Values | Notes |
|---|---|---|
| `sslmode` | `require`, `verify-ca`, `verify-full`, `disable` | `require` is the minimum for most managed providers |
| `ssl` | `true` | Alternative to `sslmode=require` for some providers |
| `channel_binding` | `disable` | Required for Neon with certain client versions |
| `connectTimeout` | seconds | Max time to wait for a connection |
| `socketTimeout` | seconds | Max time to wait for a response |

Example with multiple parameters:

```
DB_URL=jdbc:postgresql://your-host:5432/kotauth_db?sslmode=require&connectTimeout=10
```

---

## Provider-specific connection strings

<Tabs>
<TabItem label="AWS RDS">

Find your endpoint in the RDS console under **Connectivity & security → Endpoint**.

```env
DB_URL=jdbc:postgresql://xxx.yyy.us-east-1.rds.amazonaws.com:5432/kotauth_db?sslmode=require
DB_USER=kotauth
DB_PASSWORD=your-password
```

**IAM authentication** is not currently supported — use standard username/password credentials.

For RDS Proxy, use the proxy endpoint instead of the RDS instance endpoint. RDS Proxy uses session pinning for transactions, which is compatible with Flyway.

</TabItem>
<TabItem label="Supabase">

Use the **Session mode** pooler (port 5432) — not the Transaction mode pooler. Flyway requires persistent session connections and will fail on the transaction pooler.

Find your connection string in the Supabase dashboard under **Project Settings → Database → Connection string → JDBC**.

```env
DB_URL=jdbc:postgresql://aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
DB_USER=postgres.your-project-ref
DB_PASSWORD=your-password
```

<Aside type="caution">
The username for Supabase's pooler includes the project reference as a prefix: `postgres.your-project-ref`. Use this exact format or connections will be rejected.
</Aside>

</TabItem>
<TabItem label="Neon">

Find your connection string in the Neon console under **Connection Details**. Select **JDBC** format.

```env
DB_URL=jdbc:postgresql://ep-xxx-yyy.us-east-2.aws.neon.tech/kotauth_db?sslmode=require&channel_binding=disable
DB_USER=kotauth_owner
DB_PASSWORD=your-password
```

`channel_binding=disable` is required with some JDBC driver versions when connecting to Neon.

Neon branches work the same way — just swap the endpoint for your branch's host.

</TabItem>
<TabItem label="Railway">

Find your connection details in the Railway dashboard under your PostgreSQL service → **Connect → Public**.

```env
DB_URL=jdbc:postgresql://monorail.proxy.rlwy.net:PORT/railway?sslmode=require
DB_USER=postgres
DB_PASSWORD=your-password
```

Replace `PORT` with the port shown in your Railway dashboard — it is randomised per service.

</TabItem>
<TabItem label="Render">

Find your connection details in the Render dashboard under your PostgreSQL service → **Info → Connections**.

Use the **External Database URL** for connections from outside Render's network, or the **Internal Database URL** if Kotauth is also running on Render (same region).

```env
# External (outside Render)
DB_URL=jdbc:postgresql://dpg-xxx.oregon-postgres.render.com:5432/kotauth_db?sslmode=require
DB_USER=kotauth_user
DB_PASSWORD=your-password
```

</TabItem>
<TabItem label="Self-managed">

For a self-managed PostgreSQL server (bare metal, EC2, VPS):

```env
# Without SSL (private network / same host)
DB_URL=jdbc:postgresql://your-postgres-host:5432/kotauth_db
DB_USER=kotauth
DB_PASSWORD=your-password

# With SSL
DB_URL=jdbc:postgresql://your-postgres-host:5432/kotauth_db?sslmode=require
DB_USER=kotauth
DB_PASSWORD=your-password
```

Or using component variables (no JDBC parameters needed):

```env
DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=kotauth_db
DB_USER=kotauth
DB_PASSWORD=your-password
```

</TabItem>
</Tabs>

---

## Database user permissions

The database user must have the following permissions. Flyway needs `CREATE` on first boot to run migrations; subsequent restarts only need DML permissions.

```sql
-- Create the database and user
CREATE DATABASE kotauth_db;
CREATE USER kotauth WITH PASSWORD 'your-password';

-- Permissions needed for Flyway migrations (first boot)
GRANT CREATE ON DATABASE kotauth_db TO kotauth;

-- Permissions needed for normal operation
GRANT CONNECT ON DATABASE kotauth_db TO kotauth;
GRANT USAGE ON SCHEMA public TO kotauth;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO kotauth;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO kotauth;

-- Ensure future tables/sequences are also accessible
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO kotauth;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO kotauth;
```

On managed services, grant the user the `rds_iam` role (RDS) or equivalent — check your provider's documentation for the minimum required privileges.

---

## PgBouncer compatibility

<Aside type="caution">
PgBouncer in **transaction pooling** mode is incompatible with Flyway migrations. Flyway uses `SET` commands and advisory locks that require a persistent session. Use **session pooling** mode, or connect directly to PostgreSQL for the initial migration run.
</Aside>

If your infrastructure uses PgBouncer in session pooling mode, it works transparently:

```env
DB_URL=jdbc:postgresql://your-pgbouncer-host:6432/kotauth_db?sslmode=require
```

---

## Verifying the connection

After setting your environment variables, check that Kotauth can reach the database:

```bash
# Docker Compose
docker compose -f docker/docker-compose.yml logs app | grep -E "migration|Flyway|DB|error"

# Or use the health endpoint
curl -s http://localhost:8080/health/ready
# {"status":"UP"} means migrations completed and DB is reachable
```

If the database is unreachable, Kotauth will log the JDBC connection error and exit. The container will be restarted by Docker's `restart: unless-stopped` policy — check the logs after a few seconds to see the error details.
