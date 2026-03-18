---
title: Roles
description: REST API endpoints for managing roles in a workspace.
sidebar:
  order: 3
---

Roles are named permissions assigned to users directly or through group membership. They surface in access token JWT claims.

**Required scopes:** `roles:read` for GET requests, `roles:write` for POST / PUT / DELETE.

---

## Role object

```json
{
  "id": 7,
  "name": "admin",
  "description": "Full workspace administrator",
  "scope": "TENANT",
  "tenantId": 1
}
```

| Field | Type | Description |
|---|---|---|
| `id` | integer | Internal numeric ID |
| `name` | string | Role name. Pattern: `[a-zA-Z0-9._-]+` |
| `description` | string \| null | Optional human-readable description |
| `scope` | `TENANT` \| `CLIENT` | `TENANT` = workspace-wide; `CLIENT` = application-scoped |
| `tenantId` | integer | The workspace this role belongs to |

**Scope behavior in JWT claims:**

- `TENANT` roles appear in `realm_access.roles`
- `CLIENT` roles appear in `resource_access.<clientId>.roles`

---

## List roles

```http
GET /t/{slug}/api/v1/roles
```

**Example request:**

```bash
curl https://auth.yourdomain.com/t/my-app/api/v1/roles \
  -H "Authorization: Bearer kauth_my-app_KEY"
```

**Response `200 OK`:**

```json
{
  "data": [
    { "id": 7, "name": "admin", "description": "Full workspace administrator", "scope": "TENANT", "tenantId": 1 },
    { "id": 8, "name": "viewer", "description": null, "scope": "TENANT", "tenantId": 1 }
  ],
  "meta": { "total": 2, "offset": 0, "limit": 20 }
}
```

---

## Create a role

```http
POST /t/{slug}/api/v1/roles
```

**Request body:**

```json
{
  "name": "moderator",
  "description": "Can manage user content",
  "scope": "tenant"
}
```

| Field | Required | Description |
|---|---|---|
| `name` | Yes | Pattern `[a-zA-Z0-9._-]+`, unique within scope in workspace |
| `description` | No | Optional description |
| `scope` | No | `tenant` or `client`. Default: `tenant` |

**Response `201 Created`:** Returns the created role object.

**Error responses:**

| Status | Condition |
|---|---|
| `409 Conflict` | Role name already exists in this scope |
| `422 Unprocessable` | Invalid name format |

---

## Get a role

```http
GET /t/{slug}/api/v1/roles/{roleId}
```

**Response `200 OK`:** Returns the role object.

---

## Update a role

```http
PUT /t/{slug}/api/v1/roles/{roleId}
```

Updates the role name and/or description. Changing the name does not affect existing assignments — roles are referenced by ID internally.

**Request body:**

```json
{
  "name": "moderator",
  "description": "Updated description"
}
```

| Field | Required | Description |
|---|---|---|
| `name` | Yes | New role name |
| `description` | No | New description (pass `null` to clear) |

**Response `200 OK`:** Returns the updated role object.

---

## Delete a role

```http
DELETE /t/{slug}/api/v1/roles/{roleId}
```

Permanently deletes the role and removes all user and group assignments. This action cannot be undone.

**Response `204 No Content`**
