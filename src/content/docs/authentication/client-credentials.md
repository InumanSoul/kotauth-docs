---
title: Client Credentials
description: Machine-to-machine authentication for backend services and background jobs.
sidebar:
  order: 4
---

import { Aside } from '@astrojs/starlight/components';

The Client Credentials flow authenticates a service or application itself — there is no user involved. Use this for backend-to-backend calls, background workers, CI/CD pipelines, and any automated process that needs to act on its own behalf.

<Aside type="tip">
**When to use this flow:** Any non-interactive, machine-to-machine scenario. If a human is logging in, use the Authorization Code flow instead.
</Aside>

## Requirements

- A **confidential** application registered in the workspace (not public — public clients cannot use Client Credentials)
- The application's `client_id` and `client_secret`

The `client_secret` is shown once when the application is created in the admin console. Store it securely.

## Requesting a token

```http
POST /t/{slug}/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET
&scope=openid
```

Alternatively, use HTTP Basic authentication:

```http
POST /t/{slug}/protocol/openid-connect/token
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&scope=openid
```

## Response

```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 300
}
```

No refresh token is issued for Client Credentials. When the access token expires, request a new one using the same call above.

## Token contents

The access token is a standard RS256 JWT. Since no user is involved, identity claims like `email` and `name` are absent. The `sub` claim is set to the application's `client_id`.

```json
{
  "iss": "https://auth.yourdomain.com/t/my-app",
  "sub": "my-backend-service",
  "aud": "my-backend-service",
  "exp": 1735689600,
  "iat": 1735689300
}
```

Client roles assigned to the application in the admin console appear in `resource_access`:

```json
{
  "resource_access": {
    "my-backend-service": {
      "roles": ["data:read", "data:write"]
    }
  }
}
```

## Verifying tokens on resource servers

Resource servers verify the token using the workspace JWKS endpoint — no network call to Kotauth needed per request:

```
GET /t/{slug}/protocol/openid-connect/certs
```

Most OAuth2 libraries and API gateways support JWKS-based verification out of the box. Configure them with the OIDC discovery document URL:

```
/t/{slug}/.well-known/openid-configuration
```

## Token caching

Client Credentials tokens are stateless and cheaply re-issuable. A common pattern is to cache the token until a few seconds before its expiry, then request a new one. Do not request a new token on every API call — this adds unnecessary latency and load.

```js
// Pseudocode — cache the token, refresh before expiry
let token = null;
let expiresAt = 0;

async function getToken() {
  if (!token || Date.now() >= expiresAt - 30_000) {
    const res = await requestClientCredentialsToken();
    token = res.access_token;
    expiresAt = Date.now() + res.expires_in * 1000;
  }
  return token;
}
```
