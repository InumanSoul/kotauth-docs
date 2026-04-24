---
title: Tool Reference
description: Complete reference for all 25 MCP tools — parameters, required scopes, and behavior.
sidebar:
  order: 3
---

This page documents every tool exposed by `@kotauth/mcp`. Tools are grouped by domain and follow the same resource model as the [REST API](/api/overview).

All tools require a valid API key with the appropriate scope. Calling a tool without the required scope returns a `403 Forbidden` error.

---

## Users

**Read scope:** `users:read` · **Write scope:** `users:write`

### list_users

List users in the workspace with optional filtering.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `search` | string | No | Filter by username, email, or name prefix |

Returns a paginated list of user objects.

### get_user

Get detailed information about a specific user.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `userId` | integer | Yes | User ID |

Returns the full user object including email verification and MFA status.

### create_user

Create a new user in the workspace.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `username` | string | Yes | Unique username (alphanumeric, dots, underscores, hyphens) |
| `email` | string | Yes | Email address |
| `fullName` | string | No | Display name |
| `password` | string | Yes | Initial password (min 4 characters) |

Returns the created user object. The username must be unique within the workspace.

### update_user

Update an existing user's profile.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `userId` | integer | Yes | User ID |
| `email` | string | No | New email address |
| `fullName` | string | No | New display name |

Omitted fields retain their current values (partial update).

### disable_user

Soft-delete a user. The user's data is preserved but they can no longer authenticate.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `userId` | integer | Yes | User ID to disable |

### assign_user_role

Assign a role to a user.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `userId` | integer | Yes | User ID |
| `roleId` | integer | Yes | Role ID to assign |

### remove_user_role

Remove a role from a user.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `userId` | integer | Yes | User ID |
| `roleId` | integer | Yes | Role ID to remove |

---

## Roles

**Read scope:** `roles:read` · **Write scope:** `roles:write`

### list_roles

List all roles in the workspace with their scope and description.

No parameters.

### create_role

Create a new role.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | Role name (alphanumeric, dots, underscores, hyphens) |
| `description` | string | No | Human-readable description |
| `scope` | string | No | `"tenant"` (default) or `"client"` |

### delete_role

Permanently delete a role. Users and groups that had this role lose it immediately.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `roleId` | integer | Yes | Role ID to delete |

<Aside type="caution">
Role deletion is irreversible. All users and groups that held this role lose the associated permissions immediately.
</Aside>

---

## Groups

**Read scope:** `groups:read` · **Write scope:** `groups:write`

### list_groups

List all groups with their hierarchy and parent relationships.

No parameters.

### create_group

Create a new group, optionally nested under a parent.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | Group name |
| `description` | string | No | Group description |
| `parentGroupId` | integer | No | Parent group ID for nesting |

### delete_group

Delete a group. Members lose any roles inherited through this group.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `groupId` | integer | Yes | Group ID to delete |

### manage_group_member

Add or remove a user from a group. Users inherit all roles assigned to their groups.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `groupId` | integer | Yes | Group ID |
| `userId` | integer | Yes | User ID |
| `action` | string | Yes | `"add"` or `"remove"` |

---

## Applications

**Read scope:** `applications:read` · **Write scope:** `applications:write`

### list_applications

List all OAuth2/OIDC clients registered in the workspace.

No parameters.

### update_application

Update an OAuth application's configuration.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `applicationId` | integer | Yes | Application ID |
| `name` | string | No | New application name |
| `description` | string | No | New description |
| `accessType` | string | No | `"public"` or `"confidential"` |
| `redirectUris` | string[] | No | Allowed redirect URIs |

Omitted fields retain their current values (partial update).

---

## Sessions

**Read scope:** `sessions:read` · **Write scope:** `sessions:write`

### list_sessions

List all active sessions in the workspace with IP addresses and expiry times.

No parameters.

### revoke_session

Force-terminate a session. The user must re-authenticate.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `sessionId` | integer | Yes | Session ID to revoke |

---

## Audit Logs

**Read scope:** `audit_logs:read`

### query_audit_logs

Query the immutable audit log with optional filters.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `eventType` | string | No | Filter by event type (e.g. `LOGIN_SUCCESS`, `ADMIN_USER_CREATED`) |
| `userId` | integer | No | Filter by user ID |
| `limit` | integer | No | Number of events to return (1–200, default: 50) |
| `offset` | integer | No | Pagination offset (default: 0) |

Common event types include: `LOGIN_SUCCESS`, `LOGIN_FAILED`, `ADMIN_USER_CREATED`, `ADMIN_USER_UPDATED`, `ADMIN_ROLE_ASSIGNED`, `MFA_ENROLLMENT_STARTED`, `SESSION_REVOKED`, `PASSWORD_RESET_COMPLETED`.

---

## User Attributes

**Read scope:** `user_attributes:read` · **Write scope:** `user_attributes:write`

### list_user_attributes

List all custom attributes for a user. Returns a key-value map.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `userId` | integer | Yes | User ID |

### set_user_attribute

Set a key-value attribute on a user. Creates the attribute if it doesn't exist, updates it if it does.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `userId` | integer | Yes | User ID |
| `key` | string | Yes | Attribute key (max 64 chars) |
| `value` | string | Yes | Attribute value (max 1024 chars) |

If a [claim mapper](#claim-mappers) exists for this key, the value will appear in newly issued JWTs.

### delete_user_attribute

Remove an attribute from a user.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `userId` | integer | Yes | User ID |
| `key` | string | Yes | Attribute key to delete |

---

## Claim Mappers

**Read scope:** `claim_mappers:read` · **Write scope:** `claim_mappers:write`

### list_claim_mappers

List all claim mappers configured for the workspace.

No parameters.

### set_claim_mapper

Create or update a claim mapper. Maps a user attribute key to a JWT claim name.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `attributeKey` | string | Yes | User attribute key to map |
| `claimName` | string | Yes | JWT claim name (max 128 chars, must not be a reserved OIDC claim) |
| `includeInAccess` | boolean | No | Include in access tokens (default: `true`) |
| `includeInId` | boolean | No | Include in ID tokens (default: `false`) |

<Aside type="caution">
Reserved OIDC claim names (`sub`, `iss`, `aud`, `email`, etc.) are blocked. Attempting to use a reserved name returns a `400 Bad Request`. Each tenant is limited to 20 mappers.
</Aside>

### delete_claim_mapper

Remove a claim mapper. The mapped claim will no longer appear in newly issued tokens.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `attributeKey` | string | Yes | Attribute key of the mapper to delete |

---

## Error handling

All tools return structured errors following [RFC 9457 Problem Details](https://www.rfc-editor.org/rfc/rfc9457):

```json
{
  "type": "https://kotauth.dev/errors/403",
  "title": "Forbidden",
  "status": 403,
  "detail": "API key does not have the required scope: users:write"
}
```

Common error scenarios:

| Status | Cause |
|---|---|
| `401` | Invalid or missing API key |
| `403` | API key lacks the required scope |
| `404` | Resource not found (wrong ID or workspace) |
| `409` | Conflict — duplicate username or role name |
| `422` | Validation error — invalid email format, password too short, etc. |
