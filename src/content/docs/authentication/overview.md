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

## The hosted login page

For all user-facing flows, Kotauth provides a hosted login and registration UI at:

```
/t/{workspaceSlug}/login
/t/{workspaceSlug}/register
```

Your application redirects users to this page — you never handle passwords directly. Kotauth authenticates the user and redirects back to your application with an authorization code, which is then exchanged for tokens.

This means you can add or change authentication methods (MFA, new social providers) without modifying your application code.

## Token format

All tokens are RS256-signed JWTs. Each workspace has its own key pair — the private key signs tokens, the public key is published at the JWKS endpoint. Resource servers can verify tokens offline using the public key without a network call to Kotauth.

```
/t/{workspaceSlug}/protocol/openid-connect/certs
```

## Security defaults

All flows enforce the following by default:

- Rate limiting: 5 login attempts per minute per IP before temporary lockout
- PKCE is required for public clients (SPAs and mobile apps)
- Refresh tokens rotate on every use — possession of a revoked token triggers full session revocation
- Sessions store only the hashed token value — raw tokens never persist to the database
- HTTPS is enforced in production mode (`KAUTH_ENV=production`)
