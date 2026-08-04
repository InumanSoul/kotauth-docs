---
title: Workspace
description: REST API endpoint for reading workspace configuration.
sidebar:
  order: 13
---

The workspace endpoint returns the current configuration of the workspace resolved from the API key's tenant context. This is a read-only endpoint — workspace settings are managed through the admin console.

**Required scope:** `workspace:read`

---

## Workspace object

```json
{
  "id": 2,
  "slug": "my-app",
  "displayName": "My App",
  "issuerUrl": "https://auth.yourdomain.com/t/my-app",
  "tokenExpirySeconds": 300,
  "refreshTokenExpirySeconds": 2592000,
  "registrationEnabled": true,
  "emailVerificationRequired": true,
  "passkeysEnabled": true,
  "maxConcurrentSessions": null,
  "signInMethods": {
    "password": true,
    "passkey": true,
    "magicLink": true,
    "emailOtp": true
  },
  "passwordPolicy": {
    "minLength": 8,
    "requireSpecial": false,
    "requireUppercase": false,
    "requireNumber": false,
    "historyCount": 0,
    "maxAgeDays": 0,
    "blacklistEnabled": true,
    "hibpCheckEnabled": true
  },
  "mfaPolicy": "optional",
  "lockoutMaxAttempts": 5,
  "lockoutDurationMinutes": 15,
  "magicLinkTtlMinutes": 15,
  "emailOtpSignupEnabled": true,
  "emailOtpLockoutThreshold": 5,
  "corsAllowCredentials": false,
  "portalLayout": "sidenav"
}
```

| Field | Type | Description |
|---|---|---|
| `id` | integer | Internal workspace ID |
| `slug` | string | URL-safe workspace identifier |
| `displayName` | string | Human-readable workspace name |
| `issuerUrl` | string \| null | JWT `iss` claim base URL |
| `tokenExpirySeconds` | integer | Access token lifetime in seconds |
| `refreshTokenExpirySeconds` | integer | Refresh token lifetime in seconds |
| `registrationEnabled` | boolean | Whether self-registration is allowed |
| `emailVerificationRequired` | boolean | Whether email verification is enforced |
| `passkeysEnabled` | boolean | Whether passkey sign-in is enabled |
| `maxConcurrentSessions` | integer \| null | Session limit per user. `null` = unlimited |
| `signInMethods` | object | Which sign-in methods are enabled |
| `passwordPolicy` | object | Password strength and history rules |
| `mfaPolicy` | string | `optional`, `required`, or `required_for_admins` |
| `lockoutMaxAttempts` | integer | Failed login attempts before lockout |
| `lockoutDurationMinutes` | integer | Lockout duration |
| `magicLinkTtlMinutes` | integer | Magic link token expiry |
| `emailOtpSignupEnabled` | boolean | Whether Email OTP creates accounts for unknown emails |
| `emailOtpLockoutThreshold` | integer | Cross-challenge OTP failure threshold |
| `corsAllowCredentials` | boolean | CORS `Access-Control-Allow-Credentials` setting |
| `portalLayout` | string | User portal layout (`sidenav` or `tabnav`) |

:::note
Sensitive configuration values like SMTP credentials and secret keys are never included in this response.
:::

---

## Get workspace configuration

```http
GET /t/{slug}/api/v1/workspace
```

**Response `200 OK`:** Returns the workspace object.
