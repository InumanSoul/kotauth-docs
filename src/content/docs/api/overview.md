---
title: Overview & Authentication
description: How to authenticate with the Kotauth REST API and understand error responses.
sidebar:
  order: 1
---

import { Aside } from '@astrojs/starlight/components';

The Kotauth REST API v1 is a machine-to-machine interface for managing workspace resources programmatically. It covers the full lifecycle of users, roles, groups, applications, sessions, and audit logs.

<Aside type="tip">
Prefer natural language over HTTP? The [`@kotauth/mcp`](/mcp/overview) package lets AI assistants like Claude and Cursor call these same endpoints through the Model Context Protocol — no code required.
</Aside>

**Base URL:**

```
{baseUrl}/t/{workspaceSlug}/api/v1
```

For example: `https://auth.yourdomain.com/t/my-app/api/v1`

An interactive Swagger UI is available on every running instance at:

```
/t/{workspaceSlug}/api/v1/docs
```

Swagger UI assets are bundled inside the application JAR — no external CDN requests are made. This means API documentation works in air-gapped and firewalled environments without additional configuration.

## Authentication

All API endpoints require an **API key** passed as a Bearer token:

```http
Authorization: Bearer kauth_my-app_abcdef1234567890
```

API keys are created and managed in the admin console under **Settings → API Keys** for each workspace. The key format is `kauth_<workspaceSlug>_<random>` — the prefix makes them easy to identify in logs and secret scanners.

<Aside type="caution">
API keys are shown exactly once at creation. Store them in a secrets manager. If a key is lost, delete it and generate a new one.
</Aside>

## Scopes

Each API key carries a set of scopes that restrict which operations it may perform. Attempting an operation without the required scope returns `403 Forbidden`.

| Scope | Grants access to |
|---|---|
| `users:read` | List and retrieve users |
| `users:write` | Create, update, disable users; assign and remove roles |
| `roles:read` | List and retrieve roles |
| `roles:write` | Create, update, delete roles |
| `groups:read` | List and retrieve groups |
| `groups:write` | Create, update, delete groups; manage members |
| `applications:read` | List and retrieve applications |
| `applications:write` | Update and disable applications |
| `sessions:read` | List active sessions |
| `sessions:write` | Revoke sessions |
| `audit_logs:read` | Read audit log events |

Always issue API keys with the minimum scope required. A key used for read-only reporting should not have `write` scopes.

## Pagination

List endpoints return paginated results with a `meta` object:

```json
{
  "data": [...],
  "meta": {
    "total": 143,
    "offset": 0,
    "limit": 20
  }
}
```

Use `offset` and `limit` query parameters to paginate:

```
GET /users?offset=20&limit=20
```

## Error format

All errors follow [RFC 7807 Problem Details](https://www.rfc-editor.org/rfc/rfc7807) with `Content-Type: application/problem+json`:

```json
{
  "type": "https://kotauth.dev/errors/422",
  "title": "Validation Error",
  "status": 422,
  "detail": "Username may only contain letters, digits, dots, underscores, and hyphens."
}
```

### Common error codes

| Status | Meaning |
|---|---|
| `400` | Bad request — malformed JSON or missing required fields |
| `401` | Missing or invalid API key |
| `403` | Valid key but insufficient scope |
| `404` | Resource not found |
| `409` | Conflict — resource already exists (e.g. duplicate username) |
| `422` | Validation error — request is well-formed but semantically invalid |
| `429` | Rate limit exceeded |
| `500` | Internal server error |
