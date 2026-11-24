---
title: Workspace
description: REST API endpoints for reading and changing workspace settings.
sidebar:
  order: 13
---

The workspace endpoints read and change the settings of the workspace that the API key belongs to. Everything the console's workspace settings pages can change is available here, so a workspace can be configured without the console. See [Provisioning Without the Console](/deployment/provisioning/).

**Required scopes:** `workspace:read` for `GET`, `workspace:write` for `PATCH`.

To create a workspace, see [Tenants API](/api/tenants/).

---

## Workspace object

```json
{
  "id": 3,
  "slug": "acme",
  "displayName": "Acme",
  "issuerUrl": null,
  "publicBaseUrl": "https://auth.acme.com",
  "tokenExpirySeconds": 300,
  "refreshTokenExpirySeconds": 86400,
  "registrationEnabled": false,
  "emailVerificationRequired": true,
  "passkeysEnabled": true,
  "maxConcurrentSessions": null,
  "signInMethods": { "password": true, "passkey": true, "magicLink": false, "emailOtp": true },
  "passwordPolicy": {
    "minLength": 12,
    "requireSpecial": false,
    "requireUppercase": true,
    "requireNumber": true,
    "historyCount": 5,
    "maxAgeDays": 0,
    "blacklistEnabled": true,
    "hibpCheckEnabled": true
  },
  "mfaPolicy": "optional",
  "lockoutMaxAttempts": 5,
  "lockoutDurationMinutes": 15,
  "magicLinkTtlMinutes": 15,
  "emailOtpSignupEnabled": false,
  "emailOtpLockoutThreshold": 10,
  "corsAllowCredentials": false,
  "portalLayout": "SIDEBAR",
  "loginIdentifierMode": "USERNAME",
  "defaultLocale": null,
  "emailDeliveryReady": true
}
```

| Field | Type | Description |
|---|---|---|
| `id` | integer | Internal workspace ID |
| `slug` | string | URL identifier used in every path (`/t/{slug}/...`) |
| `displayName` | string | Name shown on sign-in pages and emails |
| `issuerUrl` | string \| null | Explicit token issuer. Overrides the public domain and `KAUTH_BASE_URL`. |
| `publicBaseUrl` | string \| null | The workspace's own origin. Null when it is served on the instance address. See [Custom Domains](/deployment/custom-domains/). |
| `tokenExpirySeconds` | integer | Access-token lifetime. Applications can override it. |
| `refreshTokenExpirySeconds` | integer | Refresh-token lifetime |
| `registrationEnabled` | boolean | Whether users can sign up on the hosted pages |
| `emailVerificationRequired` | boolean | Whether users must verify their email before signing in |
| `passkeysEnabled` | boolean | Whether passkey sign-in is on |
| `maxConcurrentSessions` | integer \| null | Active sessions a user may hold **in one application**. Null means no limit. |
| `signInMethods` | object | Which sign-in methods are on: `password`, `passkey`, `magicLink`, `emailOtp` |
| `passwordPolicy` | object | Password rules |
| `mfaPolicy` | string | `optional`, `required`, or `required_admins` |
| `lockoutMaxAttempts` | integer | Failed password attempts before the account locks. `0` turns lockout off. |
| `lockoutDurationMinutes` | integer | How long a locked account stays locked |
| `magicLinkTtlMinutes` | integer | Magic-link expiry |
| `emailOtpSignupEnabled` | boolean | Whether an email code sent to an unknown address creates an account |
| `emailOtpLockoutThreshold` | integer | Wrong email codes, across requests, before the account locks. `0` turns it off. |
| `corsAllowCredentials` | boolean | Whether CORS responses allow credentials |
| `portalLayout` | string | `SIDEBAR` or `CENTERED` |
| `loginIdentifierMode` | string | `USERNAME`, `EMAIL`, or `EITHER`. See [Sign-in identifier](/authentication/email-password/). |
| `defaultLocale` | string \| null | Locale used when the browser asks for none the workspace has. Null means English. |
| `emailDeliveryReady` | boolean | True when SMTP is on and has a host and a from address. SMTP settings themselves are never returned. |

---

## Get workspace configuration

```http
GET /t/{slug}/api/v1/workspace
```

**Required scope:** `workspace:read`

**Response `200 OK`:** the workspace object.

---

## Update workspace settings

```http
PATCH /t/{slug}/api/v1/workspace
Content-Type: application/json
```

**Required scope:** `workspace:write`. Since v1.27.0.

Every field is optional, and only the fields in the body change. Unknown fields are refused with `400`, so a typo cannot pass as a no-op. For `issuerUrl`, `publicBaseUrl` and `defaultLocale`, an empty string clears the value.

```json
{
  "registrationEnabled": false,
  "mfaPolicy": "required",
  "tokenExpirySeconds": 600,
  "passwordPolicy": { "minLength": 12, "requireNumber": true },
  "signInMethods": { "emailOtp": true },
  "smtp": {
    "enabled": true,
    "host": "smtp.example.com",
    "port": 587,
    "username": "acme",
    "password": "…",
    "fromAddress": "no-reply@acme.example"
  }
}
```

| Field | Constraints |
|---|---|
| `displayName`, `issuerUrl` | |
| `publicBaseUrl` | An origin only (`https://host[:port]`, no path). `http` only for `localhost`. |
| `tokenExpirySeconds` | At least `60` |
| `refreshTokenExpirySeconds` | At least `tokenExpirySeconds` |
| `registrationEnabled`, `emailVerificationRequired`, `emailOtpSignupEnabled`, `corsAllowCredentials` | |
| `signInMethods` | At least one method stays on. Turning password off, or `magicLink`/`emailOtp` on, needs SMTP ready. Password cannot be turned off on `master`. |
| `passwordPolicy` | `minLength` 4–128, `historyCount` 0–24, `maxAgeDays` 0–365, plus the boolean rules |
| `mfaPolicy` | `optional`, `required`, `required_admins` |
| `lockoutMaxAttempts` | 0–100 |
| `lockoutDurationMinutes`, `magicLinkTtlMinutes` | 1–1440 |
| `emailOtpLockoutThreshold` | 0–50 |
| `maxConcurrentSessions` | 0–100. `0` removes the limit. |
| `loginIdentifierMode` | `USERNAME`, `EMAIL`, `EITHER` |
| `defaultLocale` | A locale the server ships or has mounted, such as `es` |
| `smtp` | `enabled`, `host`, `port` (1–65535), `username`, `password`, `fromAddress`, `fromName`, `tlsEnabled`. With `enabled: true`, `host` and a valid `fromAddress` are required. The password is write-only: absent or blank keeps the stored one. |

- `smtp` is applied first, so one request can set up email delivery and turn on email-based sign-in.
- The request runs the same validation and records the same audit events as the console. It applies in one transaction: if any field is refused (`422`), nothing changes.
- Sending the same body again is harmless.

**Response `200 OK`:** the updated workspace object.
