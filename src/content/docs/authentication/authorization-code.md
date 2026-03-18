---
title: Authorization Code + PKCE
description: The standard OAuth2 flow for web apps, SPAs, and mobile apps.
sidebar:
  order: 3
---

import { Aside, Steps } from '@astrojs/starlight/components';

The Authorization Code flow with PKCE (Proof Key for Code Exchange) is the correct flow for virtually all user-facing applications. It keeps tokens out of the browser URL and protects against authorization code interception attacks.

<Aside type="tip">
**When to use this flow:** Any application where a human user logs in — SPAs, mobile apps, server-side web apps. PKCE is required for public clients (SPAs, mobile) and strongly recommended for confidential clients.
</Aside>

## Flow overview

```
Your App          Kotauth           User's Browser
   │                │                    │
   │──── 1. Redirect to /auth ──────────>│
   │                │<─── 2. Login ──────│
   │                │──── 3. Redirect ──>│
   │<─── 4. code ───────────────────────│
   │──── 5. Exchange code ──>│
   │<─── 6. access + refresh tokens ────│
```

## Step by step

<Steps>

1. **Generate PKCE values**

   Before redirecting, generate a `code_verifier` (a random 43–128 character string) and its `code_challenge` (SHA-256 hash of the verifier, base64url-encoded):

   ```js
   const codeVerifier = generateRandomString(64);
   const codeChallenge = base64url(sha256(codeVerifier));
   ```

   Store the `code_verifier` in session storage — you'll need it in step 5.

2. **Redirect to the authorization endpoint**

   ```
   GET /t/{slug}/protocol/openid-connect/auth
     ?response_type=code
     &client_id=YOUR_CLIENT_ID
     &redirect_uri=https://yourapp.com/callback
     &scope=openid profile email
     &state=RANDOM_STATE_VALUE
     &code_challenge=CODE_CHALLENGE
     &code_challenge_method=S256
   ```

   | Parameter | Required | Description |
   |---|---|---|
   | `response_type` | Yes | Must be `code` |
   | `client_id` | Yes | Your application's client ID |
   | `redirect_uri` | Yes | Must exactly match a registered redirect URI |
   | `scope` | Yes | Space-separated. Include `openid` for OIDC |
   | `state` | Recommended | Opaque value to prevent CSRF; verify it on return |
   | `code_challenge` | Yes (public clients) | SHA-256 of code verifier, base64url-encoded |
   | `code_challenge_method` | Yes (public clients) | Must be `S256` |

3. **User authenticates**

   Kotauth presents the login page. The user enters credentials (and completes MFA if required). This step is entirely handled by Kotauth — your app is not involved.

4. **Receive the authorization code**

   Kotauth redirects back to your `redirect_uri` with a short-lived authorization code:

   ```
   https://yourapp.com/callback?code=AUTH_CODE&state=YOUR_STATE
   ```

   Verify the `state` value matches what you sent in step 2.

5. **Exchange the code for tokens**

   ```http
   POST /t/{slug}/protocol/openid-connect/token
   Content-Type: application/x-www-form-urlencoded

   grant_type=authorization_code
   &code=AUTH_CODE
   &redirect_uri=https://yourapp.com/callback
   &client_id=YOUR_CLIENT_ID
   &code_verifier=YOUR_CODE_VERIFIER
   ```

   For **confidential clients**, include `client_secret` as well (or use HTTP Basic auth).

6. **Receive tokens**

   ```json
   {
     "access_token": "eyJ...",
     "token_type": "Bearer",
     "expires_in": 300,
     "refresh_token": "eyJ...",
     "id_token": "eyJ...",
     "scope": "openid profile email"
   }
   ```

</Steps>

## Refreshing tokens

Access tokens are short-lived (default: 5 minutes). When one expires, use the refresh token to get a new pair:

```http
POST /t/{slug}/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=CURRENT_REFRESH_TOKEN
&client_id=YOUR_CLIENT_ID
```

<Aside type="caution">
Refresh tokens rotate on every use. Always store the new refresh token returned in the response and discard the old one. Using a revoked refresh token invalidates the entire session.
</Aside>

## Logging out

To end the session:

```
GET /t/{slug}/protocol/openid-connect/logout
  ?id_token_hint=ID_TOKEN
  &post_logout_redirect_uri=https://yourapp.com/logged-out
```

Kotauth revokes the session and redirects to `post_logout_redirect_uri`.

## Scopes

| Scope | Claims included |
|---|---|
| `openid` | `sub`, `iss`, `aud`, `exp`, `iat` |
| `profile` | `name`, `preferred_username` |
| `email` | `email`, `email_verified` |
| `roles` | `realm_access`, `resource_access` |
