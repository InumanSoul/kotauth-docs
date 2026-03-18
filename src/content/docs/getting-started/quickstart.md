---
title: Quickstart
description: Get a Kotauth instance running locally with Docker Compose in under five minutes.
sidebar:
  order: 2
---

import { Steps, Aside } from '@astrojs/starlight/components';

You need **Docker** and **Docker Compose**. Nothing else. No JDK, no database client, no external dependencies.

<Steps>

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/kotauth.git
   cd kotauth
   ```

2. **Create your `.env` file**

   ```bash
   cp .env.example .env
   ```

   The defaults work for local development. Optionally set a persistent secret key so sessions survive container restarts:

   ```bash
   echo "KAUTH_SECRET_KEY=$(openssl rand -hex 32)" >> .env
   echo "KAUTH_BASE_URL=http://localhost:8080" >> .env
   ```

3. **Start the stack**

   ```bash
   docker compose up
   ```

   Kotauth starts on port `8080`. Flyway runs all database migrations automatically on first boot — no manual schema setup needed.

4. **Open the admin console**

   ```
   http://localhost:8080/admin
   ```

   On first run, the master workspace admin credentials are printed to the startup log. Find them with:

   ```bash
   docker compose logs kotauth | grep "Admin credentials"
   ```

   <Aside type="caution">Change the master workspace admin password immediately after first login.</Aside>

5. **Create a workspace**

   In the admin console, click **New Workspace** and enter a slug (e.g. `my-app`). A workspace is a fully isolated tenant — it gets its own user directory, applications, signing keys, and settings.

6. **Verify OIDC discovery**

   Your workspace's OIDC discovery document is immediately available:

   ```
   http://localhost:8080/t/my-app/.well-known/openid-configuration
   ```

   This is the URL you'll give to any OAuth2 / OIDC library as the `issuer` or `discovery URL`.

</Steps>

## What's running

After `docker compose up` you have:

| URL | Description |
|-----|-------------|
| `http://localhost:8080/admin` | Admin console |
| `http://localhost:8080/t/{slug}/login` | Login page for workspace `slug` |
| `http://localhost:8080/t/{slug}/.well-known/openid-configuration` | OIDC discovery document |
| `http://localhost:8080/t/{slug}/api/v1/docs` | Swagger UI (REST API) |
| `http://localhost:8080/health` | Liveness probe |
| `http://localhost:8080/health/ready` | Readiness probe |

## Create your first application

Once inside your workspace in the admin console:

1. Go to **Applications → New Application**
2. Set the type: **Public** (for SPAs / mobile) or **Confidential** (for server-side apps)
3. Add your redirect URI (e.g. `http://localhost:3000/callback`)
4. Copy the `client_id` — this is what you pass to your OAuth2 library

Your app is now registered. Point your OAuth2 library at the discovery document URL and use the `client_id`. Done.

## What's next

- [Core Concepts](/getting-started/core-concepts/) — understand how workspaces, applications, and tokens relate
- [Authorization Code + PKCE](/authentication/authorization-code/) — the standard flow for SPAs and mobile apps
- [REST API Overview](/api/overview/) — manage users, roles, and sessions programmatically
