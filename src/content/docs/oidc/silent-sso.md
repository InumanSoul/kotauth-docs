---
title: Silent SSO
description: Check for existing sessions without user interaction using prompt=none, max_age, and id_token_hint.
sidebar:
  order: 7
---

Kotauth supports OIDC silent SSO parameters that let resource providers check for existing sessions, force re-authentication, or verify session identity — all without requiring user interaction.

## prompt parameter

The `prompt` parameter on the authorization endpoint controls whether and how the user is prompted during authentication.

### prompt=none

Checks for an existing session without showing any UI. If the user has an active session, tokens are issued immediately and the user is redirected back with an authorization code. If no session exists, Kotauth returns an error to the redirect URI.

```
GET /t/{slug}/authorize?
  client_id=my-app&
  response_type=code&
  redirect_uri=https://app.example.com/callback&
  prompt=none
```

Success: redirect to `redirect_uri` with `?code=...`

Failure: redirect to `redirect_uri` with `?error=login_required`

This is the primary mechanism for silent SSO — your application can check if the user is already authenticated without showing a login page.

### prompt=login

Forces the user to re-authenticate even if they have an active session. The existing session is not terminated — a new authentication is required to proceed.

```
GET /t/{slug}/authorize?
  client_id=my-app&
  response_type=code&
  redirect_uri=https://app.example.com/callback&
  prompt=login
```

### prompt=consent

Reserved for future use. Currently behaves the same as an unspecified prompt (shows login if no session, proceeds if session exists).

## max_age parameter

Specifies the maximum age of the authentication in seconds. If the user's session is older than `max_age`, they are forced to re-authenticate.

```
GET /t/{slug}/authorize?
  client_id=my-app&
  response_type=code&
  redirect_uri=https://app.example.com/callback&
  max_age=3600
```

This example requires that the user authenticated within the last hour. If their session is older, they see the login page.

The `auth_time` claim in the resulting ID token reflects when the user actually authenticated, allowing the client to verify the session age independently.

## id_token_hint parameter

Passes a previously issued ID token to verify session identity. Kotauth validates that the `sub` claim in the hint matches the currently authenticated user.

```
GET /t/{slug}/authorize?
  client_id=my-app&
  response_type=code&
  redirect_uri=https://app.example.com/callback&
  prompt=none&
  id_token_hint=eyJhbG...
```

If the session belongs to a different user than the one in the hint, Kotauth returns `?error=login_required` instead of issuing tokens for the wrong user.

:::tip
Combining `prompt=none` with `id_token_hint` is the safest way to do silent SSO — it verifies both that a session exists and that it belongs to the expected user.
:::

## auth_time claim

ID tokens include an `auth_time` claim (Unix timestamp) indicating when the user's current session was created through active authentication. This lets clients independently verify session age without relying solely on `max_age`.

```json
{
  "sub": "42",
  "auth_time": 1714380000,
  "iat": 1714383600,
  "exp": 1714383900
}
```

## Portal silent SSO

The self-service portal uses a `KOTAUTH_SSO` path-scoped cookie to detect existing sessions without a full authorization round-trip. When a user visits the portal, this cookie is checked first — if present and valid, the portal loads immediately without redirecting through the authorization flow.

## Next steps

- [Authorization Endpoint](/oidc/authorization/) — full authorization endpoint reference
- [Discovery & JWKS](/oidc/discovery/) — OIDC discovery and key endpoints
- [Token Endpoint](/oidc/token/) — token issuance and grant types
