---
title: Webhooks (API)
description: REST API endpoints for managing webhook endpoint subscriptions.
sidebar:
  order: 12
---

These endpoints manage webhook endpoint subscriptions programmatically. For an overview of how webhooks work, payload format, event types, and delivery behavior, see [Webhooks](/customization/webhooks/).

**Required scopes:** `webhooks:read` for GET requests, `webhooks:write` for POST / DELETE.

---

## Webhook endpoint object

```json
{
  "id": 7,
  "url": "https://yourapp.com/webhooks/kotauth",
  "description": "Production webhook receiver",
  "events": ["user.created", "login.failed"],
  "enabled": true,
  "createdAt": "2026-07-01T10:00:00Z"
}
```

| Field | Type | Description |
|---|---|---|
| `id` | integer | Internal numeric ID |
| `url` | string | HTTPS URL that receives webhook POST requests |
| `description` | string | Human-readable description |
| `events` | string[] | Event types this endpoint is subscribed to |
| `enabled` | boolean | Whether deliveries are active |
| `createdAt` | string | ISO-8601 creation timestamp |

---

## List webhook endpoints

```http
GET /t/{slug}/api/v1/webhooks
```

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": 7,
      "url": "https://yourapp.com/webhooks/kotauth",
      "description": "Production webhook receiver",
      "events": ["user.created", "login.failed"],
      "enabled": true,
      "createdAt": "2026-07-01T10:00:00Z"
    }
  ],
  "meta": { "total": 1, "offset": 0, "limit": 1 }
}
```

---

## Create a webhook endpoint

```http
POST /t/{slug}/api/v1/webhooks
Content-Type: application/json

{
  "url": "https://yourapp.com/webhooks/kotauth",
  "description": "Production webhook receiver",
  "events": ["user.created", "login.failed", "session.revoked"]
}
```

| Field | Required | Description |
|---|---|---|
| `url` | Yes | HTTPS URL to receive webhook deliveries |
| `description` | No | Description (defaults to empty string) |
| `events` | Yes | Array of event type strings to subscribe to |

**Response `201 Created`:**

```json
{
  "endpoint": {
    "id": 8,
    "url": "https://yourapp.com/webhooks/kotauth",
    "description": "Production webhook receiver",
    "events": ["user.created", "login.failed", "session.revoked"],
    "enabled": true,
    "createdAt": "2026-07-17T12:00:00Z"
  },
  "secret": "whsec_a1b2c3d4e5f6..."
}
```

:::caution
The `secret` is returned exactly once. Store it securely — you need it to verify the `X-KotAuth-Signature` header on incoming deliveries. If lost, delete the endpoint and create a new one.
:::

Unknown event names are rejected with `422 Unprocessable Entity` listing the invalid values.

---

## Delete a webhook endpoint

```http
DELETE /t/{slug}/api/v1/webhooks/{endpointId}
```

Permanently removes the endpoint. Pending deliveries in the retry queue are discarded.

**Path parameters:**

| Parameter | Type | Description |
|---|---|---|
| `endpointId` | integer | The endpoint's numeric ID |

**Response `204 No Content`**
