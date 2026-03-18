---
title: Sessions
description: REST API endpoints for listing and revoking active user sessions.
sidebar:
  order: 6
---

Sessions represent active authenticated connections between a user and Kotauth. Each session is backed by a refresh token — revoking a session immediately invalidates the refresh token and prevents new access tokens from being issued.

**Required scopes:** `sessions:read` for GET, `sessions:write` for DELETE.

---

## Session object

```json
{
  "id": 88,
  "userId": 42,
  "clientId": 5,
  "scopes": "openid profile email",
  "ipAddress": "192.168.1.10",
  "createdAt": "2025-01-01T12:00:00Z",
  "expiresAt": "2025-01-02T12:00:00Z"
}
```

| Field | Type | Description |
|---|---|---|
| `id` | integer | Internal session ID |
| `userId` | integer | The user this session belongs to |
| `clientId` | integer \| null | The OAuth application that created this session, if applicable |
| `scopes` | string | Space-separated scopes granted to this session |
| `ipAddress` | string \| null | IP address at the time of login |
| `createdAt` | datetime | When the session was created |
| `expiresAt` | datetime | When the refresh token expires |

---

## List active sessions

```http
GET /t/{slug}/api/v1/sessions
```

Returns all currently active (non-expired, non-revoked) sessions for the workspace.

**Example request:**

```bash
curl https://auth.yourdomain.com/t/my-app/api/v1/sessions \
  -H "Authorization: Bearer kauth_my-app_KEY"
```

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": 88,
      "userId": 42,
      "clientId": 5,
      "scopes": "openid profile email",
      "ipAddress": "203.0.113.5",
      "createdAt": "2025-01-01T12:00:00Z",
      "expiresAt": "2025-01-02T12:00:00Z"
    }
  ],
  "meta": { "total": 1, "offset": 0, "limit": 20 }
}
```

---

## Revoke a session

```http
DELETE /t/{slug}/api/v1/sessions/{sessionId}
```

Immediately revokes the session by invalidating its refresh token. The user will need to re-authenticate to get new tokens.

:::note
Active access tokens already issued for this session remain valid until they expire (default: 5 minutes). If immediate revocation is critical, set a shorter access token TTL on the application.
:::

**Path parameters:**

| Parameter | Type | Description |
|---|---|---|
| `sessionId` | integer | The session's numeric ID |

**Example request:**

```bash
curl -X DELETE https://auth.yourdomain.com/t/my-app/api/v1/sessions/88 \
  -H "Authorization: Bearer kauth_my-app_KEY"
```

**Response `204 No Content`**

**Error responses:**

| Status | Condition |
|---|---|
| `404 Not Found` | Session does not exist or has already expired |
