---
title: API Keys
description: REST API endpoints for managing API keys programmatically.
sidebar:
  order: 10
---

API keys authenticate requests to the REST API. Each key carries a set of scopes that restrict which operations it may perform. Keys can be created, listed, and revoked through the API itself, enabling infrastructure-as-code workflows.

**Required scopes:** `api_keys:read` for GET requests, `api_keys:write` for POST / DELETE.

---

## API key object

```json
{
  "id": 12,
  "name": "CI Pipeline",
  "keyPrefix": "kauth_my",
  "scopes": ["users:read", "users:write"],
  "expiresAt": "2027-01-01T00:00:00Z",
  "lastUsedAt": "2026-07-15T14:30:00Z",
  "enabled": true,
  "bootstrapName": null,
  "createdAt": "2026-06-01T10:00:00Z"
}
```

| Field | Type | Description |
|---|---|---|
| `id` | integer | Internal numeric ID |
| `name` | string | Human-readable key name |
| `keyPrefix` | string | First 8 characters of the raw key — for identification in logs |
| `scopes` | string[] | Granted scopes |
| `expiresAt` | string \| null | ISO-8601 expiry instant. `null` = never expires |
| `lastUsedAt` | string \| null | Last time this key was used to authenticate a request |
| `enabled` | boolean | Whether the key is active |
| `bootstrapName` | string \| null | Non-null if provisioned via `KAUTH_BOOTSTRAP_API_KEYS` env var |
| `createdAt` | string | ISO-8601 creation timestamp |

---

## List API keys

```http
GET /t/{slug}/api/v1/api-keys
```

Returns all API keys for the workspace. The raw key value is never returned — only the `keyPrefix` for identification.

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": 12,
      "name": "CI Pipeline",
      "keyPrefix": "kauth_my",
      "scopes": ["users:read", "users:write"],
      "expiresAt": null,
      "lastUsedAt": "2026-07-15T14:30:00Z",
      "enabled": true,
      "bootstrapName": null,
      "createdAt": "2026-06-01T10:00:00Z"
    }
  ],
  "meta": { "total": 1, "offset": 0, "limit": 1 }
}
```

---

## Create an API key

```http
POST /t/{slug}/api/v1/api-keys
Content-Type: application/json

{
  "name": "CI Pipeline",
  "scopes": ["users:read", "users:write"],
  "expiresAt": "2027-01-01T00:00:00Z"
}
```

| Field | Required | Description |
|---|---|---|
| `name` | Yes | Display name for the key |
| `scopes` | Yes | Array of scope strings to grant |
| `expiresAt` | No | ISO-8601 instant. Omit for a non-expiring key |

**Response `201 Created`:**

```json
{
  "apiKey": {
    "id": 13,
    "name": "CI Pipeline",
    "keyPrefix": "kauth_my",
    "scopes": ["users:read", "users:write"],
    "expiresAt": "2027-01-01T00:00:00Z",
    "lastUsedAt": null,
    "enabled": true,
    "bootstrapName": null,
    "createdAt": "2026-07-17T12:00:00Z"
  },
  "rawKey": "kauth_my-app_a1b2c3d4e5f6..."
}
```

:::caution
The `rawKey` is returned exactly once. Store it in a secrets manager immediately. It cannot be retrieved again — if lost, delete the key and create a new one.
:::

---

## Delete an API key

```http
DELETE /t/{slug}/api/v1/api-keys/{id}
```

Revokes the API key permanently. Any subsequent requests using this key will receive `401 Unauthorized`.

**Path parameters:**

| Parameter | Type | Description |
|---|---|---|
| `id` | integer | The API key's numeric ID |

**Response `204 No Content`**

:::note
Bootstrap-provisioned keys (those created via `KAUTH_BOOTSTRAP_API_KEYS`) cannot be deleted through the API. The request returns `403 Forbidden` with the message "Bootstrap-provisioned keys can only be revoked via KAUTH_BOOTSTRAP_API_KEYS." Remove the key from the environment variable and restart to revoke it.
:::
