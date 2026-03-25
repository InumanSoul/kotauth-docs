---
title: Quickstart
description: Get a Kotauth instance running locally with Docker Compose in under five minutes.
sidebar:
  order: 2
---

import { Steps, Aside, Tabs, TabItem } from '@astrojs/starlight/components';

You need **Docker** and **Docker Compose**. Nothing else. No JDK, no database client, no external dependencies.

<Tabs>
<TabItem label="Pre-built image (fastest)">

No repo clone required. Pull the image directly from GitHub Container Registry.

#### Option A: Zero-config quickstart (fastest)

One command, demo data pre-loaded — ideal for a first look.

```bash
curl -O https://raw.githubusercontent.com/inumansoul/kotauth/main/docker-compose.quickstart.yml
docker compose -f docker-compose.quickstart.yml up -d
```

Open **http://localhost:8080/admin** — two demo workspaces are ready with users, roles, and applications. Credentials are shown in the banner.

When you're ready to configure your own instance, use Option B below.

#### Option B: Configure your own instance

<Steps>

1. **Grab the compose file and env template**

   ```bash
   mkdir kotauth && cd kotauth
   curl --create-dirs -o docker/docker-compose.yml \
     https://raw.githubusercontent.com/inumansoul/kotauth/main/docker/docker-compose.yml
   curl -o .env.example \
     https://raw.githubusercontent.com/inumansoul/kotauth/main/.env.example
   cp .env.example .env
   ```

2. **Set your secret key**

   Open `.env` and generate a secret key:

   ```bash
   KAUTH_SECRET_KEY=        # paste output of: openssl rand -hex 32
   ```

   `KAUTH_BASE_URL` defaults to `http://localhost:8080`. Change it if deploying remotely.

   <Aside type="caution">
   Do not skip `KAUTH_SECRET_KEY`. Without it, SMTP configuration cannot be saved and sessions will be lost on every container restart.
   </Aside>

3. **Start the stack**

   ```bash
   docker compose -f docker/docker-compose.yml up -d
   ```

   Kotauth pulls from GHCR and starts on port `8080`. PostgreSQL is bundled — no external database needed. Flyway runs all migrations automatically on first boot.

4. **Open the admin console**

   ```
   http://localhost:8080/admin
   ```

   On first run, master workspace admin credentials are printed to the startup log. Find them with:

   ```bash
   docker compose -f docker/docker-compose.yml logs kotauth | grep "Admin credentials"
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

</TabItem>
<TabItem label="Build from source">

For contributors or anyone iterating on the source code.

<Steps>

1. **Clone the repository**

   ```bash
   git clone https://github.com/inumansoul/kotauth.git
   cd kotauth
   ```

2. **Create your `.env` file**

   ```bash
   cp .env.example .env
   ```

   Open `.env` and set `KAUTH_SECRET_KEY`:

   ```bash
   KAUTH_SECRET_KEY=        # paste output of: openssl rand -hex 32
   ```

3. **Build and start**

   ```bash
   make up
   ```

   This builds the image from the local Dockerfile via `docker/docker-compose.dev.yml` and starts the full stack. Flyway runs all migrations on first boot.

   Run `make help` to see all available developer targets. The most useful ones:

   ```bash
   make up        # build from source and start all services
   make down      # stop containers
   make nuke      # stop and wipe volumes (destroys the database)
   make logs      # follow app container logs
   make test      # run unit/integration tests
   make e2e       # run E2E browser tests (Playwright, headless)
   make lint      # run ktlint check
   make build     # full CI-equivalent build (CSS + lint + tests + JAR)
   make health    # probe the local health endpoint
   ```

4. **Open the admin console**

   ```
   http://localhost:8080/admin
   ```

   Find your initial admin credentials:

   ```bash
   docker compose -f docker/docker-compose.dev.yml logs kotauth | grep "Admin credentials"
   ```

   <Aside type="caution">Change the master workspace admin password immediately after first login.</Aside>

5. **Create a workspace and verify OIDC**

   Same as the pre-built path — create a workspace in the admin console, then visit:

   ```
   http://localhost:8080/t/my-app/.well-known/openid-configuration
   ```

</Steps>

</TabItem>
</Tabs>

---

## What's running

After startup you have:

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
