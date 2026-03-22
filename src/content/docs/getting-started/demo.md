---
title: Live Demo
description: Explore Kotauth without installing anything. A public instance with pre-seeded data is available at demo.kotauth.com.
sidebar:
  order: 3
---

import { Aside, Steps, Tabs, TabItem } from '@astrojs/starlight/components';

A public Kotauth instance is running at **[demo.kotauth.com](https://demo.kotauth.com)** with realistic pre-seeded data. No Docker install, no `.env` file, no setup — just open it and explore.

## What's in the demo

The demo seeds two complete workspaces on startup:

**Acme Corp** (`/t/acme/...`) — a mature workspace with:
- 4 users: Sarah Chen (admin), Alex Kumar (developer), Maria Santos (viewer), James Wilson (developer)
- Roles: admin, user, developer, viewer
- Groups: Engineering, Product (with role inheritance)
- 2 registered OAuth applications with client credentials
- Webhook endpoints subscribed to identity events
- Backdated audit log entries showing realistic activity

**StartupLabs** (`/t/startuplabs/...`) — a smaller workspace with:
- 2 users: Lisa Park (admin), Tom Chen (developer)
- Roles: admin, user
- 1 registered OAuth application
- Separate audit history

<Aside type="tip">
  Admin credentials for each workspace are shown in the blue banner at the top of every page. You can log in immediately.
</Aside>

## What you can do

Once logged in as an admin, you can explore:

- **User management** — search, filter, view profiles with roles/groups/member-since dates
- **RBAC** — create roles and groups, assign users, see composite inheritance in action
- **OAuth applications** — inspect registered clients, view client IDs and redirect URIs
- **Audit logs** — filter by event type, see timestamped entries for every auth operation
- **API keys** — view scoped keys with SHA-256 hashed storage
- **Webhook endpoints** — see configured URLs and delivery history
- **White-label theming** — each workspace has independent CSS theming
- **Self-service portal** — visit `/t/acme/account` to see the user-facing portal

## Data resets

The demo instance resets periodically. Any changes you make (new users, modified roles, etc.) will be reverted on the next restart. The seed service is idempotent — it creates data only if it doesn't already exist.

## Deploy your own demo

You can run the same demo instance locally with a single environment variable:

<Tabs>
<TabItem label="Docker Compose">

Add this to your `.env` file:

```bash
KAUTH_DEMO_MODE=true
```

Then start normally:

```bash
docker compose up -d
```

Kotauth will seed both workspaces on startup. The demo banner with admin credentials will appear on all pages.

</TabItem>
<TabItem label="Environment variable only">

If you're running the container directly:

```bash
docker run -e KAUTH_DEMO_MODE=true \
  -e KAUTH_BASE_URL=http://localhost:8080 \
  -e KAUTH_SECRET_KEY=your-32-char-key-here \
  -p 8080:8080 \
  ghcr.io/inumansoul/kotauth:latest
```

</TabItem>
</Tabs>

<Aside type="caution">
  Demo mode is designed for showcases and evaluation. Do not enable it in production — it creates users with known passwords and displays credentials on every page.
</Aside>

## How it works

When `KAUTH_DEMO_MODE=true`:

1. **DemoSeedService** runs after Flyway migrations on startup
2. Creates tenants, users (with bcrypt-hashed passwords), roles, groups, applications, webhooks, and audit entries
3. All seed operations are idempotent — safe to restart without duplicating data
4. A **demo banner** renders at the top of every page showing workspace credentials
5. The banner is CSS-only (no JavaScript) and uses `position: sticky` to stay visible while scrolling

The seed data is designed to demonstrate every major Kotauth feature in a realistic context, not just populate empty tables.
