---
title: Claim Mappers
description: REST API endpoints for configuring tenant-level rules that project user attributes into JWT claims.
sidebar:
  order: 9
---

import { Aside } from '@astrojs/starlight/components';

Claim mappers are tenant-level rules that project [user attributes](/api/user-attributes/) into JWT access and/or ID tokens. Each mapper connects one attribute key to one claim name, with toggles for which token types include the claim.

**Required scopes:** `claim_mappers:read` for GET, `claim_mappers:write` for PUT and DELETE.

<Aside type="caution">
  Attribute values flow **unencrypted** into JWTs. JWTs are base64-encoded and readable by anyone holding the token. Avoid mapping attributes that contain sensitive PII.
</Aside>

---

## Claim mapper object

```json
{
  "attributeKey": "plan",
  "claimName": "billing_plan",
  "includeInAccess": true,
  "includeInId": false
}
```

| Field | Type | Description |
|---|---|---|
| `attributeKey` | string | The user attribute key this mapper reads from |
| `claimName` | string | The JWT claim name the value is projected into (max 128 chars) |
| `includeInAccess` | boolean | Whether to include in access tokens |
| `includeInId` | boolean | Whether to include in ID tokens |

---

## List claim mappers

```http
GET /t/{slug}/api/v1/claim-mappers
```

Returns all claim mappers configured for the workspace.

**Example request:**

```bash
curl https://auth.yourdomain.com/t/my-app/api/v1/claim-mappers \
  -H "Authorization: Bearer kauth_my-app_KEY"
```

**Response `200 OK`:**

```json
{
  "mappers": [
    {
      "attributeKey": "plan",
      "claimName": "billing_plan",
      "includeInAccess": true,
      "includeInId": false
    },
    {
      "attributeKey": "department",
      "claimName": "org_department",
      "includeInAccess": true,
      "includeInId": true
    }
  ]
}
```

---

## Create or update a claim mapper

```http
PUT /t/{slug}/api/v1/claim-mappers/{attributeKey}
```

Creates the mapper if it does not exist, or updates it if it does. This is an upsert operation.

**Path parameters:**

| Parameter | Type | Description |
|---|---|---|
| `attributeKey` | string | The user attribute key to map |

**Request body:**

```json
{
  "claimName": "billing_plan",
  "includeInAccess": true,
  "includeInId": false
}
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `claimName` | string | Yes | — | JWT claim name (max 128 chars, must not be a reserved claim) |
| `includeInAccess` | boolean | No | `true` | Include this claim in access tokens |
| `includeInId` | boolean | No | `false` | Include this claim in ID tokens |

**Example request:**

```bash
curl -X PUT https://auth.yourdomain.com/t/my-app/api/v1/claim-mappers/plan \
  -H "Authorization: Bearer kauth_my-app_KEY" \
  -H "Content-Type: application/json" \
  -d '{"claimName": "billing_plan", "includeInAccess": true, "includeInId": false}'
```

**Response `204 No Content`**

**Error responses:**

| Status | Condition |
|---|---|
| `400 Bad Request` | Claim name is a reserved OIDC/KotAuth claim (sub, iss, email, etc.) |
| `409 Conflict` | Another mapper already uses this claim name, or the 20-mapper limit is reached |
| `422 Unprocessable Entity` | Claim name exceeds 128 characters or is empty |

---

## Delete a claim mapper

```http
DELETE /t/{slug}/api/v1/claim-mappers/{attributeKey}
```

Removes the mapper. The mapped claim will no longer appear in newly issued tokens. Existing tokens are unaffected until they expire.

**Path parameters:**

| Parameter | Type | Description |
|---|---|---|
| `attributeKey` | string | The attribute key of the mapper to remove |

**Example request:**

```bash
curl -X DELETE https://auth.yourdomain.com/t/my-app/api/v1/claim-mappers/plan \
  -H "Authorization: Bearer kauth_my-app_KEY"
```

**Response `204 No Content`**

**Error responses:**

| Status | Condition |
|---|---|
| `404 Not Found` | No mapper exists for this attribute key |
