---
title: Authorization Endpoint
description: The OAuth2 authorization endpoint — where the login flow starts.
sidebar:
  order: 3
---

The authorization endpoint is where an OAuth2/OIDC flow begins. Your application redirects the user's browser here; Kotauth handles authentication and redirects back with an authorization code.

```
GET /t/{slug}/protocol/openid-connect/auth
```

**No authentication required** — this endpoint is accessed by the user's browser.

## Request parameters

| Parameter | Required | Description |
|---|---|---|
| `response_type` | Yes | Must be `code` |
| `client_id` | Yes | Your application's `client_id` |
| `redirect_uri` | Yes | Must exactly match a URI registered in the application. Query strings are allowed; fragments are not. |
| `scope` | Yes | Space-separated scopes. Must include `openid` for OIDC. |
| `state` | Recommended | Opaque random value. Returned unchanged in the callback. Verify it to prevent CSRF. |
| `nonce` | Recommended | Random value included in the ID token `nonce` claim. Prevents replay attacks. |
| `code_challenge` | Required (public clients) | `base64url(sha256(code_verifier))` |
| `code_challenge_method` | Required (public clients) | Must be `S256` |
| `prompt` | No | `login` forces re-authentication even if a session exists |

## Example

```
GET https://auth.yourdomain.com/t/my-app/protocol/openid-connect/auth
  ?response_type=code
  &client_id=my-spa
  &redirect_uri=https%3A%2F%2Fapp.yourdomain.com%2Fcallback
  &scope=openid%20profile%20email
  &state=xK9mP2vL
  &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
  &code_challenge_method=S256
```

## Success response

After successful authentication, Kotauth redirects to your `redirect_uri`:

```
https://app.yourdomain.com/callback
  ?code=SplxlOBeZQQYbYS6WxSbIA
  &state=xK9mP2vL
```

The `code` is valid for **15 minutes** and can be used exactly once.

## Error response

If authentication fails or the user denies consent, Kotauth redirects to `redirect_uri` with error parameters:

```
https://app.yourdomain.com/callback
  ?error=access_denied
  &error_description=User+denied+access
  &state=xK9mP2vL
```

Common error codes:

| Error | Description |
|---|---|
| `invalid_request` | Missing or malformed parameter |
| `unauthorized_client` | `client_id` not registered |
| `access_denied` | User denied or account disabled |
| `invalid_scope` | Requested scope not supported |

If the `redirect_uri` is invalid or `client_id` is unknown, Kotauth shows an error page instead of redirecting — this prevents open redirect vulnerabilities.
