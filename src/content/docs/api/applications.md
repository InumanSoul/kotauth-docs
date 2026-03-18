---
title: Applications
description: REST API endpoints for managing OAuth applications (clients) in a workspace.
sidebar:
  order: 5
---

Applications are OAuth2 clients registered in a workspace. They represent pieces of software — SPAs, mobile apps, backend services — that authenticate users or request tokens from Kotauth.

**Required scopes:** `applications:read` for GET requests, `applications:write` for PUT / DELETE.

:::note
Applications cannot be created via the REST API — use the admin console. Creation involves generating a client secret and configuring settings that are better handled through a human-in-the-loop UI.
:::

---

## Application object

```json
{
  "id": 5,
  "clientId": "my-spa",
  "name": "My SPA",
  "description": "Frontend web application",
  "accessType": "public",
  "enabled": true,
  "redirectUris": [
    "https://app.yourdomain.com/callback",
    "http://localhost:3000/callback"
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `id` | integer | Internal numeric ID |
| `clientId` | string | The OAuth2 `client_id` — what you pass to OAuth2 libraries |
| `name` | string | Human-readable application name |
| `description` | string \| null | Optional description |
| `accessType` | `public` \| `confidential` | Public = no secret, must use PKCE; Confidential = has client secret |
| `enabled` | boolean | `false` = disabled, blocks new logins |
| `redirectUris` | string[] | Allowed OAuth2 redirect URIs |

---

## List applications

```http
GET /t/{slug}/api/v1/applications
```

**Example request:**

```bash
curl https://auth.yourdomain.com/t/my-app/api/v1/applications \
  -H "Authorization: Bearer kauth_my-app_KEY"
```

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": 5,
      "clientId": "my-spa",
      "name": "My SPA",
      "description": null,
      "accessType": "public",
      "enabled": true,
      "redirectUris": ["https://app.yourdomain.com/callback"]
    }
  ],
  "meta": { "total": 1, "offset": 0, "limit": 20 }
}
```

---

## Get an application

```http
GET /t/{slug}/api/v1/applications/{appId}
```

**Path parameters:**

| Parameter | Type | Description |
|---|---|---|
| `appId` | integer | The application's numeric ID |

**Response `200 OK`:** Returns the application object.

---

## Update an application

```http
PUT /t/{slug}/api/v1/applications/{appId}
```

Updates the application's name, description, access type, and allowed redirect URIs. Changing `accessType` between `public` and `confidential` affects which OAuth2 flows the app can use.

**Request body:**

```json
{
  "name": "My SPA v2",
  "description": "Updated frontend application",
  "accessType": "public",
  "redirectUris": [
    "https://app.yourdomain.com/callback",
    "https://staging.yourdomain.com/callback"
  ]
}
```

| Field | Required | Description |
|---|---|---|
| `name` | Yes | Display name |
| `description` | No | Optional description (pass `null` to clear) |
| `accessType` | Yes | `public` or `confidential` |
| `redirectUris` | Yes | Array of allowed redirect URIs. Must be exact matches. |

**Response `200 OK`:** Returns the updated application object.

---

## Disable an application

```http
DELETE /t/{slug}/api/v1/applications/{appId}
```

Soft-disables the application. New authorization requests are rejected, but existing valid tokens continue to work until they expire.

To re-enable a disabled application, use the admin console.

**Response `204 No Content`**
