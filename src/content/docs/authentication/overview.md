---
title: Authentication Overview
description: The authentication flows and methods supported by Kotauth.
sidebar:
  order: 1
---

Kotauth supports several authentication flows, covering every common integration pattern. Choosing the right one depends on your application type and whether a human user is involved.

## Flows at a glance

| Flow | Use case | Requires user? |
|------|----------|---------------|
| [Authorization Code + PKCE](/authentication/authorization-code/) | SPAs, mobile, server-side apps | Yes |
| [Client Credentials](/authentication/client-credentials/) | Service-to-service, background jobs | No |
| [Social Login](/authentication/social-login/) | Google or GitHub as the identity provider | Yes |
| [Email & Password](/authentication/email-password/) | Direct login via Kotauth's hosted login page | Yes |
| [Magic-Link Passwordless](/authentication/magic-links/) | Email-based passwordless login (one-time link) | Yes |
| [Email OTP Passwordless](/authentication/email-otp/) | Email-based passwordless login (6-digit code) | Yes |

## How it works

Your application redirects users to the Kotauth authorization endpoint:

```
/t/{workspaceSlug}/authorize
```

Kotauth presents the hosted login page, authenticates the user (including MFA if required), and redirects back to your application with an authorization code, which is then exchanged for tokens. You never handle passwords directly.

This means you can add or change authentication methods (MFA, new social providers, account lockout) without modifying your application code.

## Token format

All tokens are RS256-signed JWTs. Each workspace has its own key pair — the private key signs tokens, the public key is published at the JWKS endpoint. Resource servers can verify tokens offline using the public key without a network call to Kotauth.

```
/t/{workspaceSlug}/protocol/openid-connect/certs
```

## Security defaults

All flows enforce the following by default:

- Rate limiting: 5 login attempts per minute per IP per workspace, 5 MFA attempts per 5 minutes, 3 password reset attempts per 5 minutes
- PKCE is required for public clients (SPAs and mobile apps)
- Refresh tokens rotate on every use — replaying a previously rotated token revokes all sessions for the user (family revocation)
- Confidential clients must authenticate (Basic or POST) on refresh, introspection, and revocation endpoints
- TOTP codes are single-use per time step — replay of an already-consumed code is rejected
- Login error responses are normalized — all rejection branches return the same message with timing equalization to prevent user enumeration
- Sessions store only the hashed token value — raw tokens never persist to the database
- HTTPS is enforced in production mode (`KAUTH_ENV=production`)
