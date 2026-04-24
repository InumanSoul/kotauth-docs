---
title: User Attributes
description: REST API endpoints for managing per-user key-value metadata that can be projected into JWT claims.
sidebar:
  order: 8
---

User attributes are per-user key-value metadata stored alongside the user record. Attributes are opaque strings — Kotauth does not interpret the values. When combined with [claim mappers](/api/claim-mappers/), attributes can be projected into JWT access and ID tokens.

**Required scopes:** `user_attributes:read` for GET, `user_attributes:write` for PUT and DELETE.

---

## Attributes response object

```json
{
  "attributes": {
    "plan": "enterprise",
    "department": "engineering",
    "employee_id": "E-4217"
  }
}
```

| Field | Type | Description |
|---|---|---|
| `attributes` | object | Key-value map of all attributes for the user |

Attribute keys are limited to **64 characters**. Values are limited to **1024 characters**.

---

## List user attributes

```http
GET /t/{slug}/api/v1/users/{userId}/attributes
```

Returns all attributes for the specified user as a key-value map.

**Path parameters:**

| Parameter | Type | Description |
|---|---|---|
| `userId` | integer | The user's numeric ID |

**Example request:**

```bash
curl https://auth.yourdomain.com/t/my-app/api/v1/users/42/attributes \
  -H "Authorization: Bearer kauth_my-app_KEY"
```

**Response `200 OK`:**

```json
{
  "attributes": {
    "plan": "enterprise",
    "department": "engineering"
  }
}
```

---

## Set a user attribute

```http
PUT /t/{slug}/api/v1/users/{userId}/attributes/{key}
```

Creates the attribute if it does not exist, or updates it if it does. This is an upsert operation.

**Path parameters:**

| Parameter | Type | Description |
|---|---|---|
| `userId` | integer | The user's numeric ID |
| `key` | string | Attribute key (max 64 characters) |

**Request body:**

```json
{
  "value": "enterprise"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `value` | string | Yes | Attribute value (max 1024 characters) |

**Example request:**

```bash
curl -X PUT https://auth.yourdomain.com/t/my-app/api/v1/users/42/attributes/plan \
  -H "Authorization: Bearer kauth_my-app_KEY" \
  -H "Content-Type: application/json" \
  -d '{"value": "enterprise"}'
```

**Response `204 No Content`**

**Error responses:**

| Status | Condition |
|---|---|
| `404 Not Found` | User does not exist in this workspace |
| `422 Unprocessable Entity` | Key exceeds 64 characters or value exceeds 1024 characters |

---

## Delete a user attribute

```http
DELETE /t/{slug}/api/v1/users/{userId}/attributes/{key}
```

Removes the attribute from the user. If a claim mapper references this key, the claim will no longer appear in newly issued tokens.

**Path parameters:**

| Parameter | Type | Description |
|---|---|---|
| `userId` | integer | The user's numeric ID |
| `key` | string | Attribute key to delete |

**Example request:**

```bash
curl -X DELETE https://auth.yourdomain.com/t/my-app/api/v1/users/42/attributes/plan \
  -H "Authorization: Bearer kauth_my-app_KEY"
```

**Response `204 No Content`**

**Error responses:**

| Status | Condition |
|---|---|
| `404 Not Found` | User or attribute does not exist |
