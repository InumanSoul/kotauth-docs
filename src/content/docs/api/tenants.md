---
title: Tenants (Workspaces)
description: Create a workspace over the API with a master key.
sidebar:
  order: 15
---

Create a workspace without the console. Since v1.27.0. For the full flow, from a bootstrap key to a configured workspace, see [Provisioning Without the Console](/deployment/provisioning/).

**Required:** a **master** workspace API key with the `tenants:write` scope. A workspace key holding that scope is refused.

## Create a workspace

```http
POST /admin/api/v1/tenants
Authorization: Bearer kauth_master_…
Content-Type: application/json

{
  "slug": "acme",
  "displayName": "Acme",
  "registrationEnabled": false,
  "emailVerificationRequired": true
}
```

| Field | Required | Default |
|---|---|---|
| `slug` | Yes | Lowercase letters, digits and hyphens. `master` is reserved. |
| `displayName` | Yes | |
| `issuerUrl` | No | Derived from `KAUTH_BASE_URL` |
| `registrationEnabled` | No | `true` |
| `emailVerificationRequired` | No | `false` |

The workspace is created in one transaction, the same way the console creates one. It has an active signing key, the built-in `kotauth-portal` client and the `admin` and `user` roles. Its discovery document, JWKS and token endpoint work straight away. Bootstrap keys declared for it with `awaitTenant` are provisioned in the same transaction.

| Status | Meaning |
|---|---|
| `201` | Created. The body is the [workspace object](/api/workspace/#workspace-object). |
| `400` | The body is not JSON, or lacks `slug` or `displayName` |
| `401` | No key, or a key that is not a master key |
| `403` | A master key without `tenants:write` |
| `409` | A workspace with that slug already exists. It is never modified. |
| `422` | The slug or display name is invalid |

Because `409` leaves the existing workspace untouched, a provisioning script can create every workspace on each run and treat `409` as "already there".

To change a workspace's settings afterwards, use [`PATCH /workspace`](/api/workspace/#update-workspace-settings) with a key of that workspace.
