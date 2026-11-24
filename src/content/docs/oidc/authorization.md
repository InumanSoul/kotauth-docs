---
title: Authorization Endpoint
description: The OAuth2 authorization endpoint — where the login flow starts.
sidebar:
  order: 3
---

The authorization endpoint is where an OAuth2/OIDC flow begins. Your application redirects the user's browser here; Kotauth handles authentication and redirects back with an authorization code.

```
GET /t/{slug}/authorize
```

**No authentication required** — this endpoint is accessed by the user's browser.

The legacy path `/t/{slug}/protocol/openid-connect/auth` is still supported as a redirect to `/authorize` for backward compatibility.

## Request parameters

| Parameter | Required | Description |
|---|---|---|
| `response_type` | Yes | Must be `code` |
| `client_id` | Yes | Your application's `client_id` |
| `redirect_uri` | Yes | Must exactly match a URI registered in the application. Query strings are allowed; fragments are not. Public clients get one exception for native apps, see [Loopback redirect URIs](#loopback-redirect-uris). |
| `scope` | Yes | Space-separated scopes. Must include `openid` for OIDC. |
| `state` | Recommended | Opaque random value. Returned unchanged in the callback. Verify it to prevent CSRF. |
| `nonce` | Recommended | Random value included in the ID token `nonce` claim. Prevents replay attacks. |
| `code_challenge` | Required (public clients) | `base64url(sha256(code_verifier))` |
| `code_challenge_method` | Required (public clients) | Must be `S256` |
| `prompt` | No | `login` forces re-authentication even if a session exists. `none` checks the session without showing any page (see [Silent SSO](/oidc/silent-sso/)). |
| `acr_values` | No | `http://schemas.openid.net/pape/policies/2007/06/multi-factor` makes this sign-in require a second factor, whatever the workspace policy. Other values are ignored. See [MFA → Step-up](/authentication/mfa/#step-up-per-request). |
| `resource` | No | [RFC 8707](https://www.rfc-editor.org/rfc/rfc8707) resource indicator of the API the token is for. Repeatable. |

## Loopback redirect URIs

A native app binds an ephemeral port at sign-in time and cannot know it in advance ([RFC 8252 §7.3](https://www.rfc-editor.org/rfc/rfc8252#section-7.3)). For **public** clients, a registered `http://127.0.0.1/callback` or `http://[::1]/callback` matches a request on any port. Only the port is ignored: scheme, host, path and query must still match. `localhost` is excluded, because it resolves through the name service and can be redirected; register the literal address instead.

## Example

```
GET https://auth.yourdomain.com/t/my-app/authorize
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

If the `redirect_uri` is not registered, the `client_id` is unknown, or the client is disabled, Kotauth refuses the request up front with a `400` page that says sign-in was stopped and why, instead of showing the sign-in form or redirecting. This prevents open redirects and keeps phishing links from showing the real sign-in page. With `prompt=none`, the same refusal is a JSON `400`.
