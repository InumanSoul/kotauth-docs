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

## Account lockout

Kotauth can automatically lock accounts after repeated failed login attempts, protecting against brute-force attacks. Account lockout is disabled by default and configured per workspace in the admin console under **Settings → Security**.

| Setting | Default | Description |
|---|---|---|
| Max failed attempts | 0 (disabled) | Number of consecutive failed logins before the account is locked. Set to 0 to disable lockout entirely. |
| Lockout duration (minutes) | 15 | How long the account remains locked before automatic unlock. |

When an account is locked:

- All login attempts are rejected with an "account locked" message, regardless of whether the password is correct.
- If SMTP is configured, the user receives an email notification with the lockout duration and a password reset link.
- An `ACCOUNT_LOCKED` audit event is recorded.
- Admins can manually unlock accounts from the user detail page in the admin console. This records an `ACCOUNT_UNLOCKED` audit event.
- The failed attempt counter resets on a successful login.

<Aside type="tip">
Account lockout works alongside rate limiting — rate limiting protects against high-volume attacks from a single IP, while lockout protects individual accounts regardless of the attacker's IP.
</Aside>

## Rate limiting

Login attempts are rate-limited at **5 attempts per minute per IP address** per workspace. After exceeding the limit, further attempts return `429 Too Many Requests` until the window resets.

<Aside type="caution">
Rate limiting is in-memory per instance. If you run multiple Kotauth replicas behind a load balancer, each instance maintains its own counter. Consider a reverse proxy with shared rate limiting for high-availability deployments.
</Aside>

## Password reset

Users can request a password reset from the login page. Kotauth sends an email with a time-limited reset link (default: 1 hour). On clicking the link, the user sets a new password and all existing sessions are revoked. A password changed notification email is sent to the user.

Password reset requests are rate-limited at **3 attempts per 5-minute window** per IP to prevent abuse of the email delivery pipeline.

Password reset requires SMTP to be configured in the workspace settings.

## Email verification

On registration, Kotauth sends a verification email with a 24-hour token. Unverified accounts can still log in unless the workspace policy requires verification first. Verification status is available as the `email_verified` claim in access tokens.

## Security notifications

Kotauth sends security notification emails when significant account events occur (requires SMTP to be configured):

| Event | Email sent | Content |
|---|---|---|
| Password changed (any path) | Yes | Informational notification. No action links to prevent phishing surface. |
| Account locked | Yes | Includes lockout duration and a password reset link. |
| Password reset completed | Yes | Confirmation that the password was changed via reset link. |

All notification emails are sent asynchronously — they do not block the authentication flow.

## Self-service portal

Authenticated users can change their own password at `/t/{slug}/account/password` without admin involvement. The current password is required to set a new one. When the password is changed, all existing sessions are revoked and a security notification email is sent.
