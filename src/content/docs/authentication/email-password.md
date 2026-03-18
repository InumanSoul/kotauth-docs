---
title: Email & Password
description: How Kotauth handles direct email and password authentication.
sidebar:
  order: 2
---

import { Aside } from '@astrojs/starlight/components';

Email and password authentication is the baseline login method in every Kotauth workspace. Users submit credentials to Kotauth's hosted login page — your application never receives or handles passwords directly.

## How it works

1. Your application redirects the user to `/t/{slug}/login` (or Kotauth redirects them there as part of an OAuth2 Authorization Code flow).
2. The user enters their username or email and password.
3. Kotauth verifies the credentials, enforces MFA if required, and issues an authorization code.
4. The code is exchanged for access and refresh tokens at the token endpoint.

## Password storage

Passwords are hashed with **bcrypt** at cost factor 10. Raw passwords are never stored or logged.

## Password policies

Each workspace defines its own password policy, configurable in the admin console under **Settings → Security**:

| Policy setting | Description |
|---|---|
| Minimum length | Default: 8 characters |
| Require uppercase | At least one A–Z character |
| Require lowercase | At least one a–z character |
| Require numbers | At least one 0–9 digit |
| Require symbols | At least one non-alphanumeric character |
| Maximum age (days) | Force password change after N days. `0` = no expiry |
| History depth | Prevent reuse of last N passwords. `0` = no history |
| Blacklist | Reject specific passwords (e.g. common passwords) |

## Rate limiting

Login attempts are rate-limited at **5 attempts per minute per IP address**. After exceeding the limit, further attempts return `429 Too Many Requests` until the window resets.

<Aside type="caution">
Rate limiting is in-memory per instance. If you run multiple Kotauth replicas behind a load balancer, each instance maintains its own counter. Consider a reverse proxy with shared rate limiting for high-availability deployments.
</Aside>

## Password reset

Users can request a password reset from the login page. Kotauth sends an email with a time-limited reset link (default: 1 hour). On clicking the link, the user sets a new password and all existing sessions are revoked.

Password reset requires SMTP to be configured in the workspace settings.

## Email verification

On registration, Kotauth sends a verification email with a 24-hour token. Unverified accounts can still log in unless the workspace policy requires verification first. Verification status is available as the `email_verified` claim in access tokens.

## Self-service portal

Authenticated users can change their own password at `/t/{slug}/account/password` without admin involvement. The current password is required to set a new one.
