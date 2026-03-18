---
title: Groups
description: REST API endpoints for managing groups and group membership in a workspace.
sidebar:
  order: 4
---

Groups provide a hierarchical way to organize users. Users inherit all roles assigned to their group and all ancestor groups. This lets you model org structures without manually assigning roles to every user.

**Required scopes:** `groups:read` for GET requests, `groups:write` for POST / PUT / DELETE.

---

## Group object

```json
{
  "id": 3,
  "name": "Engineering",
  "description": "Engineering team",
  "parentGroupId": null,
  "tenantId": 1
}
```

| Field | Type | Description |
|---|---|---|
| `id` | integer | Internal numeric ID |
| `name` | string | Group name |
| `description` | string \| null | Optional description |
| `parentGroupId` | integer \| null | Parent group ID for hierarchy, or `null` for root groups |
| `tenantId` | integer | The workspace this group belongs to |

---

## List groups

```http
GET /t/{slug}/api/v1/groups
```

Returns all groups in the workspace, including nested groups.

**Example request:**

```bash
curl https://auth.yourdomain.com/t/my-app/api/v1/groups \
  -H "Authorization: Bearer kauth_my-app_KEY"
```

**Response `200 OK`:**

```json
{
  "data": [
    { "id": 3, "name": "Engineering", "description": null, "parentGroupId": null, "tenantId": 1 },
    { "id": 4, "name": "Backend",     "description": null, "parentGroupId": 3,    "tenantId": 1 }
  ],
  "meta": { "total": 2, "offset": 0, "limit": 20 }
}
```

---

## Create a group

```http
POST /t/{slug}/api/v1/groups
```

**Request body:**

```json
{
  "name": "Backend",
  "description": "Backend engineering",
  "parentGroupId": 3
}
```

| Field | Required | Description |
|---|---|---|
| `name` | Yes | Group name (non-empty) |
| `description` | No | Optional description |
| `parentGroupId` | No | ID of parent group. Omit for a root group. |

**Response `201 Created`:** Returns the created group object.

---

## Get a group

```http
GET /t/{slug}/api/v1/groups/{groupId}
```

**Response `200 OK`:** Returns the group object.

---

## Update a group

```http
PUT /t/{slug}/api/v1/groups/{groupId}
```

**Request body:**

```json
{
  "name": "Backend Platform",
  "description": "Updated description"
}
```

**Response `200 OK`:** Returns the updated group object.

---

## Delete a group

```http
DELETE /t/{slug}/api/v1/groups/{groupId}
```

Deletes the group and removes all user memberships. Child groups are **not** deleted — they become root groups.

**Response `204 No Content`**

---

## Add a user to a group

```http
POST /t/{slug}/api/v1/groups/{groupId}/members/{userId}
```

Adds the user to the group. The user immediately inherits all roles assigned to the group and its ancestors.

**Path parameters:**

| Parameter | Type | Description |
|---|---|---|
| `groupId` | integer | The group's numeric ID |
| `userId` | integer | The user's numeric ID |

**Response `204 No Content`**

---

## Remove a user from a group

```http
DELETE /t/{slug}/api/v1/groups/{groupId}/members/{userId}
```

Removes the user from the group. Role inheritance from this group is revoked immediately and reflected in subsequent tokens.

**Response `204 No Content`**
