---
title: Magic-Link Passwordless
description: Email-based passwordless authentication with same-device binding and MFA invariant.
sidebar:
  order: 3
---

Kotauth supports passwordless authentication via magic links — short-lived tokens delivered by email that authenticate a user without requiring a password. This provides a frictionless login experience while maintaining the same security guarantees as password-based auth.

## How it works
1. The user enters their email address on the login page and clicks **Sign in with magic link**
2. Kotauth generates a 15-minute one-time token, stores it, and sends an email with a login link
3. The user clicks the link in their email
4. Kotauth validates the token, verifies same-device binding, and creates a session
5. If MFA is enrolled, the user completes the TOTP challenge before the session is fully activated
## Same-device binding

When a magic link is requested, Kotauth sets a `KOTAUTH_AUTH_CONTEXT` cookie in the browser that initiated the request. When the link is clicked, the server verifies this cookie is present before consuming the token.

This prevents a class of attacks where an attacker intercepts the magic-link email and tries to use it from a different device. Without the context cookie, the token is rejected and remains unconsumed — the legitimate user can still click the link from their original browser.

:::note
Cross-device magic links (e.g. requesting from desktop and clicking on mobile) are not supported by design. The same-device binding is a deliberate security choice — if a user needs to authenticate on a different device, they should request a new magic link from that device.
:::

## User-enumeration safety

Magic-link requests return the same response regardless of whether the email address exists in the workspace. Response timing is consistent to prevent timing-based enumeration attacks. If the email does not exist, no email is sent, but the user sees the same confirmation message.

## MFA invariant

Magic links authenticate the first factor only. If a user has TOTP MFA enrolled, they are still required to complete the TOTP challenge after clicking the magic link. The magic link replaces the password, not the entire authentication flow.

This means magic links are compatible with any MFA policy (`optional`, `required`, or `required_for_admins`).

## Passwordless-only mode

Workspaces can disable password login entirely from the **Sign-in Methods** grid in the admin console under **Settings → Security**. When enabled:

- The login page shows only passwordless methods (magic links, passkeys, email OTP) — no password field
- Password-based authentication endpoints reject requests with `403 Forbidden`
- Users can still enroll in MFA for second-factor protection
- Existing passwords are preserved in the database but cannot be used to authenticate

:::caution
Before enabling passwordless-only mode, ensure SMTP is configured and tested. Without working email delivery, users will be unable to authenticate.
:::

## REST API

Two endpoints support programmatic magic-link flows:

### Send magic link

```
POST /t/{slug}/magic-link/send
Content-Type: application/json

{
  "email": "user@example.com"
}
```

Returns `200 OK` with a confirmation message regardless of whether the email exists (user-enumeration safe).

### Consume magic link

```
GET /t/{slug}/magic-link/consume?token={token}
```

Validates the token and `KOTAUTH_AUTH_CONTEXT` cookie. On success, creates a session and redirects to the portal or the original OAuth redirect URI.

## Token lifecycle

| Property | Value |
|---|---|
| Expiry | 15 minutes |
| Usage | One-time — consumed on first valid use |
| Storage | Database with tenant scoping |
| Invalidation | Automatic on expiry, manual on new token generation for the same email |

When a new magic link is requested for an email that already has a pending token, the old token is invalidated and a new one is issued.

## Next steps

- [Passkeys & WebAuthn](/authentication/passkeys/) — biometric and hardware-key passwordless sign-in
- [Email & Password](/authentication/email-password/) — traditional password-based authentication
- [Multi-Factor Authentication](/authentication/mfa/) — TOTP enrollment and recovery codes
- [Token Lifecycle](/authentication/token-lifecycle/) — access tokens, refresh tokens, and revocation
