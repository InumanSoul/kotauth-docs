---
title: Introspection, Revocation & Logout
description: Check token validity, revoke tokens, and initiate RP logout via the RFC 7662, RFC 7009, and OIDC end-session endpoints.
sidebar:
  order: 6
---

## Token Introspection (RFC 7662)

The introspection endpoint lets a resource server check whether a token is currently active and retrieve its metadata. This is a server-to-server call — never make it from a browser.

```
POST /t/{slug}/protocol/openid-connect/introspect
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/x-www-form-urlencoded

token=ACCESS_OR_REFRESH_TOKEN&token_type_hint=access_token
```

**Authentication required** — confidential clients must authenticate using either HTTP Basic auth (`client_secret_basic`) or form body parameters (`client_secret_post`). The client must be of type `confidential` and enabled. Unauthenticated or public-client requests are rejected with `401 invalid_client`.

:::caution
As of v1.14.0, client authentication is **required** on both the introspection and revocation endpoints. This is a breaking change from earlier versions that allowed unauthenticated access. Update your resource servers to include client credentials.
:::

### Parameters

| Parameter | Required | Description |
|---|---|---|
| `token` | Yes | The token to inspect |
| `token_type_hint` | No | `access_token` or `refresh_token`. Helps Kotauth search efficiently. |

### Active token response

```json
{
  "active": true,
  "sub": "42",
  "username": "alice",
  "email": "alice@example.com",
  "scope": "openid profile email",
  "client_id": "my-spa",
  "exp": 1735689600,
  "iat": 1735689300,
  "iss": "https://auth.yourdomain.com/t/my-app"
}
```

### Inactive token response

```json
{
  "active": false
}
```

An `active: false` response means the token is expired, revoked, never existed, or was issued by a different tenant. Kotauth enforces issuer validation on introspection — a token minted for tenant A returns `active: false` when introspected against tenant B, even if the token is otherwise valid. The response body contains no other claims.

### When to use introspection

Introspection is a network call to Kotauth per request — avoid it in high-throughput paths. Prefer local JWT verification using the JWKS endpoint.

Use introspection when:

- You need real-time revocation information (a user was disabled after a token was issued)
- Your resource server cannot or does not want to handle JWT verification
- You need to inspect a refresh token (which is opaque)

---

## Token Revocation (RFC 7009)

The revocation endpoint immediately invalidates a token. Once revoked, the token cannot be used for any purpose.

```
POST /t/{slug}/protocol/openid-connect/revoke
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/x-www-form-urlencoded

token=TOKEN_TO_REVOKE&token_type_hint=refresh_token
```

**Authentication required** — same as introspection. Confidential clients must authenticate via `client_secret_basic` or `client_secret_post`.

### Parameters

| Parameter | Required | Description |
|---|---|---|
| `token` | Yes | The token to revoke |
| `token_type_hint` | No | `access_token` or `refresh_token` |

### Response

Always returns `200 OK`, even if the token was already revoked or never existed. Per RFC 7009, the server must not reveal whether a token existed.

```http
HTTP/1.1 200 OK
```

### Access token revocation

Revoking an access token marks it as revoked in the database. However, resource servers that verify tokens locally (via JWKS) will not be aware of the revocation until the token expires. If immediate revocation is required, use a short access token TTL or check revocation via introspection.

### Refresh token revocation

Revoking a refresh token invalidates the entire session — the session record is removed and no new access tokens can be issued for that session. This is the preferred method for logging out from a server-side application.

---

## End-Session Logout (RP-Initiated)

The end-session endpoint implements OpenID Connect RP-Initiated Logout. It revokes the server-side session, clears the session cookie, and optionally redirects the user back to the application.

```
GET /t/{slug}/protocol/openid-connect/logout
```

### Parameters

| Parameter | Required | Description |
|---|---|---|
| `id_token_hint` | Recommended | The ID token originally issued to the client. Allows Kotauth to identify the session without requiring a session cookie. |
| `post_logout_redirect_uri` | No | Where to redirect the user after logout. Must share the same origin as the request to prevent open redirect attacks. |

### Example

```
GET /t/my-app/protocol/openid-connect/logout
  ?id_token_hint=eyJhbGciOiJSUzI1NiIs...
  &post_logout_redirect_uri=https://myapp.com/logged-out
```

### Behavior

1. Kotauth validates the `id_token_hint` and identifies the associated session.
2. The session is revoked in the database (refresh token invalidated).
3. The session cookie is cleared.
4. If `post_logout_redirect_uri` is provided and passes origin validation, the user is redirected there. Otherwise, the user sees the Kotauth login page.

### Security

- **Open redirect prevention** — the `post_logout_redirect_uri` is validated against the `KAUTH_BASE_URL` origin. URIs with a different scheme, host, or port are rejected. Protocol-relative URIs (`//evil.com`), backslash-prefixed URIs (`/\evil.com`), and URIs with `userInfo` components are all blocked. Invalid URIs fall back to the workspace's authorization endpoint.
- Both GET and POST methods are supported.
- If no `id_token_hint` is provided, the session is still cleared from the cookie, but Kotauth cannot verify which session to revoke server-side.

### When to use end-session vs. revocation

Use the **end-session endpoint** when you need to log out a user from a browser session — it handles cookie cleanup and user-facing redirects. Use the **revocation endpoint** for server-to-server token invalidation where no browser redirect is needed.
