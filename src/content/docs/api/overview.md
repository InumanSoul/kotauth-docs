---
title: Overview & Authentication
description: How to authenticate with the Kotauth REST API and understand error responses.
sidebar:
  order: 1
---

The Kotauth REST API v1 is a machine-to-machine interface for managing workspace resources programmatically. It covers the full lifecycle of users, roles, groups, applications, sessions, audit logs, webhooks, resource servers, and API keys.

:::tip
Prefer natural language over HTTP? The [`@kotauth/mcp`](/mcp/overview) package lets AI assistants like Claude and Cursor call these same endpoints through the Model Context Protocol — no code required.
:::

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

:::caution
API keys are shown exactly once at creation. Store them in a secrets manager. If a key is lost, delete it and generate a new one.
:::

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
| `applications:read` | List and retrieve applications |
| `applications:write` | Create, update, delete applications; manage default roles |
| `sessions:read` | List active sessions |
| `sessions:write` | Revoke sessions |
| `audit_logs:read` | Read audit log events |
| `user_attributes:read` | Read per-user custom attributes |
| `user_attributes:write` | Set and delete per-user custom attributes |
| `claim_mappers:read` | List claim mapper configurations |
| `claim_mappers:write` | Create, update, delete claim mappers |
| `workspace:read` | Read workspace configuration |
| `webhooks:read` | List webhook endpoint subscriptions |
| `webhooks:write` | Create and delete webhook endpoints |
| `resource_servers:read` | List resource servers and application bindings |
| `resource_servers:write` | Create, update, delete resource servers; manage application bindings |
| `api_keys:read` | List API keys |
| `api_keys:write` | Create and revoke API keys |
| `auth:send-otp` | Send Email OTP challenges |
| `auth:verify-otp` | Verify Email OTP codes and receive authorization codes |

Always issue API keys with the minimum scope required. A key used for read-only reporting should not have `write` scopes.

## Rate limiting

Write operations (`POST`, `PUT`, `PATCH`, `DELETE`) are rate-limited to **60 requests per 60-second window** per API key per workspace. Read operations (`GET`) are unrestricted.

When the limit is exceeded, the API returns `429 Too Many Requests` with a `Retry-After` header indicating how many seconds to wait:

```json
{
  "type": "https://kotauth.dev/errors/429",
  "title": "Rate limit exceeded",
  "status": 429,
  "detail": "API write rate limit exceeded for this key in this workspace. Retry after 60 seconds."
}
```

The rate limit is scoped to the combination of API key prefix and workspace slug, so different keys hitting the same workspace have independent counters.

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
