---
title: Discovery & JWKS
description: OIDC discovery document and JSON Web Key Set endpoints.
sidebar:
  order: 2
---

## OIDC Discovery Document

```http
GET /t/{slug}/.well-known/openid-configuration
```

Returns the standard [OpenID Connect Discovery](https://openid.net/specs/openid-connect-discovery-1_0.html) document. OAuth2/OIDC libraries use this URL to auto-configure themselves — you only need to provide this one URL.

**No authentication required.**

**Example response:**

```json
{
  "issuer": "https://auth.yourdomain.com/t/my-app",
  "authorization_endpoint": "https://auth.yourdomain.com/t/my-app/authorize",
  "token_endpoint": "https://auth.yourdomain.com/t/my-app/protocol/openid-connect/token",
  "userinfo_endpoint": "https://auth.yourdomain.com/t/my-app/protocol/openid-connect/userinfo",
  "jwks_uri": "https://auth.yourdomain.com/t/my-app/protocol/openid-connect/certs",
  "end_session_endpoint": "https://auth.yourdomain.com/t/my-app/protocol/openid-connect/logout",
  "introspection_endpoint": "https://auth.yourdomain.com/t/my-app/protocol/openid-connect/introspect",
  "revocation_endpoint": "https://auth.yourdomain.com/t/my-app/protocol/openid-connect/revoke",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "client_credentials", "refresh_token"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"],
  "scopes_supported": ["openid", "profile", "email", "roles"],
  "token_endpoint_auth_methods_supported": ["client_secret_basic", "client_secret_post"],
  "claims_supported": [
    "sub", "iss", "aud", "exp", "iat",
    "name", "preferred_username", "email", "email_verified",
    "realm_access", "resource_access"
  ],
  "code_challenge_methods_supported": ["S256"]
}
```

**Usage with popular libraries:**

```js
// next-auth (Next.js)
providers: [
  {
    id: "kotauth",
    name: "Kotauth",
    type: "oidc",
    issuer: "https://auth.yourdomain.com/t/my-app",
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  }
]

// oidc-client-ts (SPA)
const userManager = new UserManager({
  authority: "https://auth.yourdomain.com/t/my-app",
  client_id: "my-spa",
  redirect_uri: "https://app.yourdomain.com/callback",
});
```

---

## JWKS (JSON Web Key Set)

```http
GET /t/{slug}/protocol/openid-connect/certs
```

Returns the workspace's public RSA key(s) in [JWK Set](https://www.rfc-editor.org/rfc/rfc7517) format. Resource servers use this endpoint to verify JWT signatures without contacting Kotauth per request.

**No authentication required.**

**Example response:**

```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "alg": "RS256",
      "kid": "1",
      "n": "sD4scG3...",
      "e": "AQAB"
    }
  ]
}
```

| Field | Description |
|---|---|
| `kty` | Key type — always `RSA` |
| `use` | Key usage — always `sig` (signature verification) |
| `alg` | Signing algorithm — always `RS256` |
| `kid` | Key ID — matches the `kid` header in issued JWTs |
| `n` | RSA modulus (base64url-encoded) |
| `e` | RSA public exponent (base64url-encoded) |

**Caching:** The JWKS endpoint response is safe to cache. Most JWT libraries cache it automatically and refresh when they encounter an unknown `kid`. The response does not include cache headers — configure your library's cache TTL to something reasonable (e.g. 5–15 minutes).
