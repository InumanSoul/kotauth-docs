---
title: Userinfo Endpoint
description: Retrieve claims about the authenticated user using an access token.
sidebar:
  order: 5
---

The userinfo endpoint returns identity claims about the currently authenticated user, as specified by [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html#UserInfo).

```
GET /t/{slug}/protocol/openid-connect/userinfo
Authorization: Bearer ACCESS_TOKEN
```

**Authentication required** — pass a valid access token with the `openid` scope.

## Response

The claims returned depend on the scopes granted to the access token:

```json
{
  "sub": "3f6c1e2a-8b4d-4c7e-9a51-2d0f6b8e7c13",
  "name": "Alice Smith",
  "preferred_username": "alice",
  "email": "alice@example.com",
  "email_verified": true
}
```

| Claim | Scope required | Description |
|---|---|---|
| `sub` | `openid` | Subject — a stable, opaque string that identifies the user in this workspace |
| `name` | `profile` | User's full display name |
| `preferred_username` | `profile` | User's username |
| `email` | `email` | User's email address |
| `email_verified` | `email` | Whether the email has been verified |

:::note[Store `sub` as text]
Since v1.31.0, new users get a random UUID as their `sub`. Users created before keep the numeric value they had, as a string. Treat `sub` as an opaque string and never parse it as a number.
:::

## When to use this endpoint

Most applications should prefer **reading claims from the ID token** or access token JWT directly, rather than calling the userinfo endpoint. The ID token is already signed and contains the same claims — decoding it locally is faster and avoids a network round-trip.

The userinfo endpoint is useful when:

- Your access token is opaque (not a JWT)
- You need the most current claim values (the token was issued before the user updated their profile)
- Your OIDC library requires it as part of its standard flow

## Error responses

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing, expired, or malformed access token |
| `403 Forbidden` | Token does not have the `openid` scope |
