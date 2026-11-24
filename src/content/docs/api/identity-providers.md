---
title: Identity Providers
description: REST API for the social and OIDC identity providers a workspace signs users in with.
sidebar:
  order: 14
---

Manage the [social](/authentication/social-login/) and [OIDC](/authentication/oidc-brokering/) identity providers a workspace signs users in with. Since v1.23.0.

**Required scopes:** `identity_providers:read` for `GET`, `identity_providers:write` for `PUT` and `DELETE`.

The client secret is write-only: no response ever includes it.

---

## Identity provider object

```json
{
  "key": "entra",
  "kind": "oidc",
  "clientId": "6f1c…",
  "enabled": true,
  "displayName": "Acme SSO",
  "issuer": "https://login.microsoftonline.com/{tenant-id}/v2.0",
  "authorizationEndpoint": null,
  "tokenEndpoint": null,
  "jwksUri": null,
  "scopes": "openid profile email",
  "jitEnabled": true,
  "jitAllowedDomains": ["acme.com"],
  "createdAt": "2026-09-03T12:00:00Z",
  "updatedAt": "2026-09-03T12:00:00Z"
}
```

| Field | Type | Description |
|---|---|---|
| `key` | string | `[a-z0-9-]{1,32}`. Appears in the callback path; cannot change. |
| `kind` | `oauth2` \| `oidc` | `oauth2` for the built-in `google` and `github` keys, `oidc` for every other key |
| `clientId` | string | Client ID registered at the provider |
| `enabled` | boolean | Whether the provider's button shows on the sign-in page |
| `displayName` | string \| null | Sign-in button label (max 64) |
| `issuer` | string \| null | Issuer URL. Required for `oidc`. |
| `authorizationEndpoint`, `tokenEndpoint`, `jwksUri` | string \| null | Pins for an issuer without a discovery document. Null means read from discovery. |
| `scopes` | string | Space-separated. `oidc` providers must include `openid`. |
| `jitEnabled` | boolean | Whether a first sign-in may create an account |
| `jitAllowedDomains` | string[] | Email domains a first sign-in may create an account for. **An empty list creates nobody**, even with `jitEnabled`. |

---

## List providers

```http
GET /t/{slug}/api/v1/identity-providers
```

**Response `200 OK`:** `{ "providers": [ … ] }`

## Get a provider

```http
GET /t/{slug}/api/v1/identity-providers/{key}
```

**Response `200 OK`:** the provider. `404` if it is not configured.

## Create or update a provider

```http
PUT /t/{slug}/api/v1/identity-providers/{key}
Content-Type: application/json

{
  "clientId": "6f1c…",
  "clientSecret": "…",
  "displayName": "Acme SSO",
  "issuer": "https://login.microsoftonline.com/{tenant-id}/v2.0",
  "scopes": "openid profile email",
  "jitEnabled": true,
  "jitAllowedDomains": ["acme.com"]
}
```

Creates the provider when `{key}` is new (`201`), otherwise updates it (`200`).

| Field | Required | Description |
|---|---|---|
| `clientId` | Yes | |
| `clientSecret` | On create | Write-only. Omit on update to keep the stored secret. Stored encrypted. |
| `kind` | No | Defaults from the key. `google`/`github` must stay `oauth2`. |
| `enabled` | No | Default `true` |
| `displayName`, `issuer`, `authorizationEndpoint`, `tokenEndpoint`, `jwksUri`, `scopes` | No | Every URL must be `https` (`http` on loopback only). |
| `jitEnabled` | No | **Omit to keep** the stored value. |
| `jitAllowedDomains` | No | **Omit to keep** the stored list; send `[]` to clear it. Each entry must be a bare domain (no `@`, scheme or path). Values are trimmed, lowercased and de-duplicated. |

Invalid values answer `422`.

## Delete a provider

```http
DELETE /t/{slug}/api/v1/identity-providers/{key}
```

**Response `204 No Content`.** `404` if it is not configured.
