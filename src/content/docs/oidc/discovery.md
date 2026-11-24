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
  "revocation_endpoint": "https://auth.yourdomain.com/t/my-app/protocol/openid-connect/revoke",
  "introspection_endpoint": "https://auth.yourdomain.com/t/my-app/protocol/openid-connect/introspect",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "client_credentials", "refresh_token"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"],
  "token_endpoint_auth_methods_supported": ["client_secret_post", "client_secret_basic", "none"],
  "scopes_supported": ["openid", "profile", "email", "orders:read"],
  "claims_supported": [
    "sub", "iss", "aud", "exp", "iat",
    "email", "email_verified", "name", "preferred_username",
    "auth_time", "amr", "acr"
  ],
  "acr_values_supported": ["http://schemas.openid.net/pape/policies/2007/06/multi-factor"],
  "code_challenge_methods_supported": ["S256"],
  "resource_indicators_supported": true,
  "prompt_values_supported": ["none", "login", "consent", "select_account"]
}
```

**Notes:**

- **`issuer`** is the same value the tokens carry. It is the workspace's **Issuer URL** when one is set, otherwise the workspace's [public domain](/deployment/custom-domains/) plus `/t/{slug}`, otherwise `KAUTH_BASE_URL` plus `/t/{slug}`.
- **`scopes_supported`** lists `openid`, `profile` and `email`, plus every scope declared by the workspace's enabled [resource servers](/api/resource-servers/).
- **`none`** in `token_endpoint_auth_methods_supported` is how public clients authenticate (no secret, PKCE required).
- **`acr_values_supported`** advertises multi-factor step-up. See [MFA → Step-up](/authentication/mfa/#step-up-per-request).

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
