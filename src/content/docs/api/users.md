---
title: Users
description: REST API endpoints for managing users in a workspace.
sidebar:
  order: 2
---

import { Aside } from '@astrojs/starlight/components';

Users are identity records within a workspace. The Users API covers listing, creating, updating, disabling, and role assignment.

**Required scopes:** `users:read` for GET requests, `users:write` for POST / PUT / DELETE.

---

## User object

```json
{
  "id": 42,
  "username": "alice",
  "email": "alice@example.com",
  "fullName": "Alice Smith",
  "emailVerified": true,
  "enabled": true,
  "mfaEnabled": false,
  "requiredActions": []
}
```

| Field | Type | Description |
|---|---|---|
| `id` | integer | Internal numeric ID |
| `username` | string | Unique within the workspace. Pattern: `[a-zA-Z0-9._-]+` |
| `email` | string | Email address |
| `fullName` | string | Display name |
| `emailVerified` | boolean | Whether the email has been verified |
| `enabled` | boolean | `false` = disabled, cannot log in |
| `mfaEnabled` | boolean | Whether the user has enrolled in MFA |
| `requiredActions` | string[] | Pending setup actions (e.g. `["SET_PASSWORD"]` for invited users). Empty when account is fully activated |

---

## List users

```http
GET /t/{slug}/api/v1/users
```

Returns a paginated list of users in the workspace. Optionally filter by a search string.

**Query parameters:**

| Parameter | Type | Description |
|---|---|---|
| `search` | string | Filter by username, email, or full name prefix (optional) |
| `offset` | integer | Pagination offset (default: 0) |
| `limit` | integer | Page size (default: 20, max: 100) |

**Example request:**

```bash
curl https://auth.yourdomain.com/t/my-app/api/v1/users?search=alice \
  -H "Authorization: Bearer kauth_my-app_KEY"
```

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": 42,
      "username": "alice",
      "email": "alice@example.com",
      "fullName": "Alice Smith",
      "emailVerified": true,
      "enabled": true,
      "mfaEnabled": false
    }
  ],
  "meta": { "total": 1, "offset": 0, "limit": 20 }
}
```

---

## Create a user

```http
POST /t/{slug}/api/v1/users
```

Creates a new user account. You can either set a password directly or send an invite email so the user sets their own password.

**Request body (with password):**

```json
{
  "username": "bob",
  "email": "bob@example.com",
  "fullName": "Bob Jones",
  "password": "correct-horse-battery"
}
```

**Request body (with invite):**

```json
{
  "username": "bob",
  "email": "bob@example.com",
  "fullName": "Bob Jones",
  "sendInvite": true
}
```

| Field | Required | Constraints |
|---|---|---|
| `username` | Yes | Pattern `[a-zA-Z0-9._-]+`, unique in workspace |
| `email` | Yes | Valid email, unique in workspace |
| `fullName` | Yes | Non-empty string |
| `password` | Conditional | Required unless `sendInvite` is `true`. Workspace password policy applies |
| `sendInvite` | No | When `true`, sends an invite email instead of setting a password. Requires SMTP to be configured. Default: `false` |

When `sendInvite` is `true`, the created user will have `requiredActions: ["SET_PASSWORD"]` and `emailVerified: false` until they complete the invite flow.

**Response `201 Created`:** Returns the created user object.

**Error responses:**

| Status | Condition |
|---|---|
| `409 Conflict` | Username or email already in use |
| `422 Unprocessable` | Validation error (e.g. invalid username format, policy violation) |

---

## Get a user

```http
GET /t/{slug}/api/v1/users/{userId}
```

**Path parameters:**

| Parameter | Type | Description |
|---|---|---|
| `userId` | integer | The user's numeric ID |

**Example request:**

```bash
curl https://auth.yourdomain.com/t/my-app/api/v1/users/42 \
  -H "Authorization: Bearer kauth_my-app_KEY"
```

**Response `200 OK`:** Returns the user object.

---

## Update a user

```http
PUT /t/{slug}/api/v1/users/{userId}
```

Updates a user's email and/or display name. Username changes are not supported through the API — use the admin console.

**Request body:**

```json
{
  "email": "alice-new@example.com",
  "fullName": "Alice M. Smith"
}
```

| Field | Required | Description |
|---|---|---|
| `email` | Yes | New email address |
| `fullName` | Yes | New display name |

**Response `200 OK`:** Returns the updated user object.

---

## Disable a user

```http
DELETE /t/{slug}/api/v1/users/{userId}
```

Soft-disables the user account. Disabled users cannot log in, but their data, roles, and session history are preserved. To permanently delete a user, use the admin console.

<Aside type="note">
This is a soft delete. The user record is not removed from the database — `enabled` is set to `false`. Existing active sessions are not revoked. To fully lock a user out, also revoke their sessions via the Sessions API.
</Aside>

**Response `204 No Content`**

---

## Assign a role to a user

```http
POST /t/{slug}/api/v1/users/{userId}/roles/{roleId}
```

Assigns the specified role directly to the user. This is in addition to any roles inherited through group membership.

**Path parameters:**

| Parameter | Type | Description |
|---|---|---|
| `userId` | integer | The user's numeric ID |
| `roleId` | integer | The role's numeric ID |

**Response `204 No Content`**

---

## Remove a role from a user

```http
DELETE /t/{slug}/api/v1/users/{userId}/roles/{roleId}
```

Removes a directly assigned role from the user. Roles inherited through group membership are not affected.

**Response `204 No Content`**

---

## Resend an invitation

```http
POST /t/{slug}/api/v1/users/{userId}/resend-invite
```

Resends the invite email for a user who has a pending `SET_PASSWORD` required action. Generates a new 72-hour token and invalidates any previous invite tokens for this user.

<Aside type="note">
  This endpoint requires SMTP to be configured for the workspace. It will return an error if the user does not have a pending invite (i.e. `SET_PASSWORD` is not in their `requiredActions`).
</Aside>

**Response `200 OK`**

**Error responses:**

| Status | Condition |
|---|---|
| `400 Bad Request` | User does not have a pending invite |
| `500 Internal Server Error` | SMTP not configured or email delivery failed |
