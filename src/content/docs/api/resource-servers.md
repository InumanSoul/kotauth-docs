---
title: Resource Servers
description: REST API endpoints for managing resource servers and application authorization bindings.
sidebar:
  order: 11
---

Resource servers represent the APIs that your OAuth applications access. Each resource server has a unique identifier (typically a URI like `https://api.yourdomain.com`), a display name, and a set of scopes it supports. Applications can be bound to specific resource servers, and the `resource` parameter in token requests is validated against these bindings per RFC 8707.

**Required scopes:** `resource_servers:read` for GET requests, `resource_servers:write` for POST / PUT / DELETE.

---

## Resource server object

```json
{
  "id": 3,
  "identifier": "https://api.yourdomain.com",
  "name": "Main API",
  "description": "Production backend API",
  "enabled": true,
  "scopes": ["read", "write", "admin"],
  "createdAt": "2026-07-01T10:00:00Z"
}
```

| Field | Type | Description |
|---|---|---|
| `id` | integer | Internal numeric ID |
| `identifier` | string | Unique URI identifying this resource server (used as the `resource` value in token requests) |
| `name` | string | Human-readable display name |
| `description` | string \| null | Optional description |
| `enabled` | boolean | Whether the resource server is active |
| `scopes` | string[] | Supported scope values |
| `createdAt` | string | ISO-8601 creation timestamp |

---

## List resource servers

```http
GET /t/{slug}/api/v1/resource-servers
```

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": 3,
      "identifier": "https://api.yourdomain.com",
      "name": "Main API",
      "description": null,
      "enabled": true,
      "scopes": ["read", "write"],
      "createdAt": "2026-07-01T10:00:00Z"
    }
  ],
  "meta": { "total": 1, "offset": 0, "limit": 1 }
}
```

---

## Create a resource server

```http
POST /t/{slug}/api/v1/resource-servers
Content-Type: application/json

{
  "identifier": "https://api.yourdomain.com",
  "name": "Main API",
  "description": "Production backend API",
  "scopes": ["read", "write", "admin"]
}
```

| Field | Required | Description |
|---|---|---|
| `identifier` | Yes | Unique URI for this resource server |
| `name` | Yes | Display name |
| `description` | No | Optional description |
| `scopes` | No | Array of supported scopes (defaults to empty) |

**Response `201 Created`:** Returns the created resource server object.

Returns `409 Conflict` if a resource server with the same `identifier` already exists in the workspace.

---

## Get a resource server

```http
GET /t/{slug}/api/v1/resource-servers/{id}
```

**Response `200 OK`:** Returns the resource server object.

---

## Update a resource server

```http
PUT /t/{slug}/api/v1/resource-servers/{id}
Content-Type: application/json

{
  "name": "Main API v2",
  "description": "Updated backend API",
  "scopes": ["read", "write", "admin", "billing"]
}
```

| Field | Required | Description |
|---|---|---|
| `name` | Yes | Display name |
| `description` | No | Optional description |
| `scopes` | No | Supported scopes (defaults to empty). Full-set replace. |

**Response `200 OK`:** Returns the updated resource server object.

---

## Delete a resource server

```http
DELETE /t/{slug}/api/v1/resource-servers/{id}
```

**Response `204 No Content`**

---

## List authorized resource servers for an application

```http
GET /t/{slug}/api/v1/applications/{appId}/authorized-resource-servers
```

Returns the resource servers that an application is authorized to request tokens for. When a token request includes a `resource` parameter, Kotauth validates the requested resource against this binding list.

**Required scope:** `resource_servers:read`

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": 3,
      "identifier": "https://api.yourdomain.com",
      "name": "Main API",
      "description": null,
      "enabled": true,
      "scopes": ["read", "write"],
      "createdAt": "2026-07-01T10:00:00Z"
    }
  ],
  "meta": { "total": 1, "offset": 0, "limit": 1 }
}
```

---

## Set authorized resource servers for an application

```http
PUT /t/{slug}/api/v1/applications/{appId}/authorized-resource-servers
Content-Type: application/json

{
  "resourceServerIds": [3, 5]
}
```

Full-set replace — the application will be authorized only for the specified resource servers. Pass an empty array to remove all bindings.

**Required scope:** `resource_servers:write`

| Field | Required | Description |
|---|---|---|
| `resourceServerIds` | Yes | Array of resource server IDs |

**Response `204 No Content`**
