---
title: Audit Logs
description: REST API endpoint for querying the workspace audit trail.
sidebar:
  order: 7
---

Kotauth maintains an immutable audit trail of security-relevant events. Events are append-only — they cannot be modified or deleted. Use the audit log API to build compliance reporting, detect anomalies, and investigate incidents.

**Required scope:** `audit_logs:read`

---

## Audit event object

```json
{
  "eventType": "LOGIN_SUCCESS",
  "userId": 42,
  "clientId": 5,
  "ipAddress": "203.0.113.5",
  "createdAt": "2025-01-01T12:00:00Z",
  "details": {
    "method": "password"
  }
}
```

| Field | Type | Description |
|---|---|---|
| `eventType` | string | The event category (see table below) |
| `userId` | integer \| null | User involved, if applicable |
| `clientId` | integer \| null | Application involved, if applicable |
| `ipAddress` | string \| null | IP address of the request |
| `createdAt` | datetime | When the event occurred |
| `details` | object | Event-specific key-value metadata |

---

## List audit events

```http
GET /t/{slug}/api/v1/audit-logs
```

**Query parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `limit` | integer | 50 | Number of events to return (max: 200) |
| `offset` | integer | 0 | Pagination offset |
| `eventType` | string | — | Filter by event type (e.g. `LOGIN_SUCCESS`) |
| `userId` | integer | — | Filter by user ID |

**Example request:**

```bash
# Get the last 10 failed logins
curl "https://auth.yourdomain.com/t/my-app/api/v1/audit-logs?eventType=LOGIN_FAILURE&limit=10" \
  -H "Authorization: Bearer kauth_my-app_KEY"
```

**Response `200 OK`:**

```json
{
  "data": [
    {
      "eventType": "LOGIN_FAILURE",
      "userId": null,
      "clientId": null,
      "ipAddress": "198.51.100.42",
      "createdAt": "2025-01-01T11:59:00Z",
      "details": {
        "username": "alice",
        "reason": "invalid_credentials"
      }
    }
  ],
  "meta": { "total": 1, "offset": 0, "limit": 10 }
}
```

---

## Event types

### Authentication

| Event type | Description |
|---|---|
| `LOGIN_SUCCESS` | Successful username/password login |
| `LOGIN_FAILURE` | Failed login attempt (wrong password, unknown user) |
| `LOGIN_MFA_REQUIRED` | MFA challenge initiated |
| `LOGIN_MFA_SUCCESS` | MFA challenge completed successfully |
| `LOGIN_MFA_FAILURE` | MFA challenge failed (wrong code) |
| `LOGOUT` | User-initiated logout |
| `SESSION_REVOKED` | Session revoked by admin or via API |
| `TOKEN_REFRESHED` | Refresh token exchanged for new tokens |
| `TOKEN_REVOKED` | Token explicitly revoked via revocation endpoint |

### Social login

| Event type | Description |
|---|---|
| `SOCIAL_LOGIN_SUCCESS` | Successful social provider authentication |
| `SOCIAL_LOGIN_FAILURE` | Failed social provider authentication |
| `SOCIAL_ACCOUNT_LINKED` | Social identity linked to existing account |
| `SOCIAL_ACCOUNT_CREATED` | New account created via social login |

### Account management

| Event type | Description |
|---|---|
| `USER_REGISTERED` | User self-registered |
| `USER_EMAIL_VERIFICATION_SENT` | Verification email dispatched |
| `USER_EMAIL_VERIFIED` | User verified their email |
| `USER_PASSWORD_RESET_REQUESTED` | Password reset email requested |
| `USER_PASSWORD_RESET_COMPLETED` | Password reset successfully applied |
| `USER_PASSWORD_CHANGED` | Password changed via self-service portal |
| `USER_MFA_ENROLLED` | User completed TOTP enrollment |
| `USER_MFA_DISABLED` | User disabled their MFA |
| `USER_RECOVERY_CODE_USED` | Recovery code consumed during login |

### Admin actions

| Event type | Description |
|---|---|
| `ADMIN_USER_CREATED` | Admin created a user via API or console |
| `ADMIN_USER_UPDATED` | Admin updated a user's profile |
| `ADMIN_USER_DISABLED` | Admin disabled a user |
| `ADMIN_USER_MFA_RESET` | Admin reset a user's MFA enrollment |
| `ADMIN_ROLE_CREATED` | Role created |
| `ADMIN_ROLE_UPDATED` | Role updated |
| `ADMIN_ROLE_DELETED` | Role deleted |
| `ADMIN_ROLE_ASSIGNED` | Role assigned to user |
| `ADMIN_ROLE_UNASSIGNED` | Role removed from user |
| `ADMIN_GROUP_CREATED` | Group created |
| `ADMIN_GROUP_UPDATED` | Group updated |
| `ADMIN_GROUP_DELETED` | Group deleted |
| `ADMIN_GROUP_MEMBER_ADDED` | User added to group |
| `ADMIN_GROUP_MEMBER_REMOVED` | User removed from group |
| `ADMIN_APPLICATION_UPDATED` | Application settings updated |
| `ADMIN_APPLICATION_DISABLED` | Application disabled |
| `ADMIN_SESSION_REVOKED` | Session revoked by admin |
| `ADMIN_API_KEY_CREATED` | API key created |
| `ADMIN_API_KEY_DELETED` | API key deleted |
| `ADMIN_SETTINGS_UPDATED` | Workspace settings changed |
