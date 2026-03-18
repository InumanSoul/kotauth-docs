---
title: Token Endpoint
description: Exchange authorization codes and refresh tokens for access tokens.
sidebar:
  order: 4
---

The token endpoint issues access tokens, refresh tokens, and ID tokens. It handles three grant types.

```
POST /t/{slug}/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded
```

## Authorization Code exchange

Exchange an authorization code for tokens. Used after the user completes the authorization flow.

**Request:**

```
grant_type=authorization_code
&code=SplxlOBeZQQYbYS6WxSbIA
&redirect_uri=https://app.yourdomain.com/callback
&client_id=my-spa
&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

For **confidential clients**, authenticate with HTTP Basic (`client_id:client_secret` base64-encoded in the `Authorization` header) or include `client_secret` in the form body.

**Response `200 OK`:**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 300,
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "scope": "openid profile email"
}
```

---

## Refresh token grant

Exchange a refresh token for a new access token and rotated refresh token.

**Request:**

```
grant_type=refresh_token
&refresh_token=CURRENT_REFRESH_TOKEN
&client_id=my-spa
```

**Response `200 OK`:** Same shape as the authorization code response, with new `access_token` and `refresh_token` values.

The old refresh token is immediately invalidated. Store the new refresh token and discard the old one. Using a revoked refresh token triggers session revocation.

---

## Client Credentials grant

Issue an access token for a machine client, with no user involved.

**Request:**

```
grant_type=client_credentials
&client_id=my-backend
&client_secret=MY_CLIENT_SECRET
&scope=openid
```

**Response `200 OK`:**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 300,
  "scope": "openid"
}
```

No refresh token is issued for this grant type. Request a new access token when the current one expires.

---

## Logout (End Session)

Revokes the session associated with the provided tokens and optionally redirects the user after logout.

```
GET /t/{slug}/protocol/openid-connect/logout
  ?id_token_hint=ID_TOKEN
  &post_logout_redirect_uri=https://app.yourdomain.com/logged-out
```

Or via POST:

```
POST /t/{slug}/protocol/openid-connect/logout
Content-Type: application/x-www-form-urlencoded

id_token_hint=ID_TOKEN&post_logout_redirect_uri=https://app.yourdomain.com/logged-out
```

| Parameter | Description |
|---|---|
| `id_token_hint` | The ID token issued during login. Used to identify the session. |
| `post_logout_redirect_uri` | Where to redirect after logout. Must be a registered redirect URI. |

---

## Error responses

Token endpoint errors use `application/json` with an `error` field:

```json
{
  "error": "invalid_grant",
  "error_description": "Authorization code expired or already used"
}
```

| Error | Description |
|---|---|
| `invalid_request` | Missing or malformed parameter |
| `invalid_client` | Client authentication failed |
| `invalid_grant` | Code expired, already used, or verifier mismatch |
| `unauthorized_client` | Client not allowed to use this grant type |
| `unsupported_grant_type` | Unrecognized grant type |
