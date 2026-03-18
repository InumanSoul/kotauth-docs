---
title: Core Concepts
description: Understand workspaces, applications, users, roles, and tokens before integrating Kotauth.
sidebar:
  order: 3
---

Kotauth maps IAM concepts to five building blocks. Understanding how they relate to each other makes everything else — the auth flows, the API, the admin console — click into place.

## Workspace (Tenant)

A workspace is the top-level isolation boundary. Think of it as a realm or tenant. Every resource in Kotauth — users, applications, roles, groups, SMTP settings, signing keys — belongs to exactly one workspace. The same email address can exist independently in two different workspaces; they are completely separate identities.

You reference a workspace by its **slug** — a URL-safe identifier you choose when creating it. The slug appears in every URL:

```
/t/{slug}/login
/t/{slug}/.well-known/openid-configuration
/t/{slug}/api/v1/users
```

A single Kotauth instance handles as many workspaces as you need. The master workspace is reserved for platform administration.

## Application (OAuth Client)

An application is an OAuth2 client registered in a workspace. It represents a piece of software — a web app, mobile app, or backend service — that authenticates users or requests tokens from Kotauth.

Applications have two access types:

**Public** — no client secret. Used for single-page apps (SPAs) and mobile apps where a secret cannot be kept confidential. Must use PKCE with the Authorization Code flow.

**Confidential** — has a client secret. Used for server-side apps and backend services. Can use either the Authorization Code flow or the Client Credentials flow.

Each application has a list of allowed **redirect URIs** — Kotauth will only redirect back to these exact URIs after authorization.

## User

A user is an identity within a workspace. Users have a username, email, password (bcrypt-hashed), display name, and optional MFA enrollment. They can be enabled or disabled — disabling a user prevents login but preserves all data.

Users can be created by admins via the REST API or the admin console. They can also self-register if the workspace allows it, or be created automatically via social login.

## Role and Group

**Roles** are named permissions. They come in two scopes:

- `TENANT` scope — applies across the entire workspace. Useful for things like `admin`, `moderator`, or `viewer`.
- `CLIENT` scope — applies only within a specific application. Useful for fine-grained permissions that are meaningful only to one service.

**Groups** provide a hierarchy. A group can have a parent group, creating a tree. Users can be added to groups, and users inherit all roles assigned to their group and all ancestor groups. This lets you model organizational structures (e.g. `Engineering > Backend > On-call`) without manual role assignment per user.

Role assignments surface in issued access tokens as JWT claims:

```json
{
  "realm_access": {
    "roles": ["admin", "viewer"]
  },
  "resource_access": {
    "my-api": {
      "roles": ["orders:write"]
    }
  }
}
```

## Token

Kotauth issues three types of tokens:

**Access token** — a short-lived RS256-signed JWT (default: 5 minutes, configurable per application). Contains identity claims (`sub`, `email`, `name`), role claims, and standard OIDC claims. Verified by resource servers using the workspace's public key from the JWKS endpoint — no network call to Kotauth required.

**Refresh token** — a long-lived opaque token (default: 24 hours). Stored as a SHA-256 hash in the database. Exchanged at the token endpoint for a fresh access token and a new refresh token (rotation). Invalidated on use — possession of an old refresh token triggers session revocation.

**ID token** — a JWT issued alongside the access token containing the authenticated user's identity claims. Consumed by the client application, not resource servers.

## API Key

API keys authenticate machine-to-machine calls to the REST API. They are created in the admin console per workspace and carry a set of **scopes** (e.g. `users:read`, `roles:write`) that define which operations the key may perform. Keys are prefixed with `kauth_<slug>_` for easy identification in logs.

## Workspace Theme

Each workspace carries an optional `TenantTheme` — a set of CSS custom property values that Kotauth injects into every auth page at render time. The nine configurable tokens cover brand colors, backgrounds, borders, text, and corner radius. Two additional fields accept a logo URL and a favicon URL.

Three built-in presets exist: `DEFAULT` (Kotauth's dark theme), `LIGHT` (clean white), and `SIMPLE` (light with 8 px rounded corners). You can override any individual token from the admin console or via the REST API without touching code or triggering a rebuild.

Theme values affect **only the auth pages** (login, registration, MFA). The admin console always uses Kotauth's fixed dark theme, regardless of workspace settings.

## How it fits together

```
Workspace (my-app)
├── Application: web-frontend   (public, Authorization Code + PKCE)
├── Application: backend-api    (confidential, Client Credentials)
├── User: alice@example.com
│   ├── Role: admin             (tenant scope)
│   └── Group: Engineering
│       └── Role: deploy        (tenant scope, inherited)
├── Role: admin
├── Role: deploy
├── Group: Engineering
└── API Key: ci-deploy-key      (scopes: users:read, sessions:write)
```

When Alice logs in through `web-frontend`, she gets an access token with `realm_access.roles: ["admin", "deploy"]`. When `backend-api` authenticates with Client Credentials, it gets a token representing the service itself, not any user.
