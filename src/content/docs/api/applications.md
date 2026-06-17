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
  ],
  "audience": "https://api.yourdomain.com"
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
| `audience` | string \| null | Custom JWT `aud` claim. Falls back to `clientId` if null. Max 200 characters. |

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

## Get default roles

```http
GET /t/{slug}/api/v1/applications/{appId}/default-roles
```

Returns the roles that are automatically assigned to users who self-register through this application (via password signup, social login, or Email OTP).

**Required scope:** `applications:read`

**Response `200 OK`:**

```json
{
  "data": [
    { "id": 3, "name": "viewer", "description": "Read-only access", "composite": false }
  ],
  "meta": { "total": 1 }
}
```

---

## Set default roles

```http
PUT /t/{slug}/api/v1/applications/{appId}/default-roles
Content-Type: application/json

{
  "roleIds": [3, 7]
}
```

Replaces the full set of default roles for the application. Pass an empty array to clear all default roles.

**Required scope:** `applications:write`

| Field | Required | Description |
|---|---|---|
| `roleIds` | Yes | Array of role IDs to auto-assign at registration. Full-set replace. |

**Response `200 OK`:** Returns the updated default roles in the same format as the GET endpoint.

:::note
Default roles are only applied during self-registration. Existing users are not affected when the default roles change. Admin-created users do not receive default roles.
:::

---

## Disable an application

```http
DELETE /t/{slug}/api/v1/applications/{appId}
```

Soft-disables the application. New authorization requests are rejected, but existing valid tokens continue to work until they expire.

To re-enable a disabled application, use the admin console.

**Response `204 No Content`**
