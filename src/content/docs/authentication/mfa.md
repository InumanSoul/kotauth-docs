---
title: Multi-Factor Authentication
description: TOTP-based MFA with recovery codes and per-tenant policy enforcement.
sidebar:
  order: 6
---

Kotauth implements Time-based One-Time Password (TOTP) MFA per RFC 6238. Users enroll using any standard authenticator app (Google Authenticator, Authy, 1Password, etc.) and are prompted for a 6-digit code on subsequent logins.

## MFA policies

Each workspace sets one of three MFA policies in the admin console under **Settings → Security**:

| Policy | Behavior |
|---|---|
| `optional` | Users can enroll voluntarily. Not enforced at login. |
| `required` | All users must complete MFA enrollment before accessing the app or portal. |
| `required_for_admins` | Only users with the `admin` role are required to enroll. |

Changing the policy takes effect on the next login — it does not retroactively terminate existing sessions.

## Enrollment flow

Users enroll through the self-service portal at `/t/{slug}/account/mfa`.

1. The user clicks **Set up authenticator**
2. Kotauth generates a TOTP secret and displays a QR code
3. The user scans the QR code with their authenticator app
4. The user enters the 6-digit code to confirm enrollment
5. Kotauth displays **8 one-time recovery codes** — the user must save these

:::caution
Recovery codes are shown exactly once. They are stored as irreversible hashes. Losing all recovery codes and the authenticator device locks the user out — an admin must manually reset MFA from the admin console.
:::

## Login flow with MFA

When a user with MFA enabled submits their credentials on the login page, Kotauth issues a short-lived pending session cookie and redirects to the MFA challenge page. The user must enter a valid 6-digit TOTP code to complete login.

MFA challenges are rate-limited independently at **5 attempts per 5-minute window** per IP. Exceeding this limit returns `429 Too Many Requests` until the window resets. This prevents brute-forcing of 6-digit TOTP codes during the MFA pending window.

### TOTP replay protection

Each TOTP code is valid for only one verification per time step. After a code is successfully verified, Kotauth records the time step and rejects any subsequent attempt to use a code from the same or earlier time step. This makes TOTP replay structurally impossible — even if an attacker captures a valid code, it cannot be reused.

### Per-enrollment lockout

Failed TOTP verification attempts are tracked per MFA enrollment. After 5 consecutive failures, the enrollment is locked for the workspace's configured lockout duration. While locked, all TOTP challenges for that enrollment are rejected immediately. The lockout counter resets on successful verification.

This is independent of the IP-based rate limiting — an attacker who rotates IP addresses is still caught by the enrollment-level lockout.

## Recovery codes

Recovery codes are 8-character alphanumeric strings. Each code can be used exactly once. Using a recovery code logs the user in and allows them to re-enroll their authenticator.

Kotauth tracks which recovery codes have been used. Admins can see the count of remaining codes in the admin console.

## Admin management

From the admin console, admins can:

- **View** whether a user has MFA enabled and how many recovery codes remain
- **Reset** a user's MFA enrollment (removes the TOTP secret and recovery codes, forcing re-enrollment on next login)

Resetting MFA does not revoke the user's active sessions — consider revoking sessions as well if you suspect a compromised account.

## Authenticator app compatibility

Any RFC 6238-compliant TOTP app works. Tested and confirmed working:

- Google Authenticator
- Authy
- 1Password
- Bitwarden Authenticator
- Microsoft Authenticator
- Aegis Authenticator (Android)

Kotauth uses a 30-second time step and SHA-1, which are the TOTP defaults supported by all major apps.
