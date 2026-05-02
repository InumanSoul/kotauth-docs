---
title: Admin Impersonation
description: Act as any user for debugging and support without knowing their password.
sidebar:
  order: 10
---

import { Aside } from '@astrojs/starlight/components';

Admin impersonation lets administrators access the application as another user without requiring that user's password. This is useful for reproducing bugs, verifying permission configurations, and providing support.

## How it works

When an admin impersonates a user, Kotauth creates a secondary session for the target user while keeping the admin's original session alive underneath. The impersonated session carries a standard access token with an additional `act` claim (per [RFC 8693](https://www.rfc-editor.org/rfc/rfc8693)) identifying the admin who initiated the impersonation.

```json
{
  "sub": "42",
  "username": "target-user",
  "act": {
    "sub": "1",
    "username": "admin"
  },
  "realm_access": {
    "roles": ["user"]
  }
}
```

The `act` claim creates a full audit trail — any action taken during impersonation is attributable to the admin, not the target user.

## Starting impersonation

From the admin console:

1. Navigate to **Users** and select the user you want to impersonate
2. Click **Impersonate** on the user detail page
3. Kotauth creates an impersonated session and redirects you to the portal as that user

The admin console shows a banner indicating you are currently impersonating a user, with a button to end the impersonation and return to your admin session.

## Dual-session model

Impersonation uses a dual-session architecture:

| Session | Owner | Purpose |
|---|---|---|
| Admin session | The administrator | Preserved underneath, restored when impersonation ends |
| Impersonated session | The target user | Active session with `act` claim identifying the admin |

Both sessions exist simultaneously. The admin session is suspended (not terminated) while the impersonated session is active.

## Cascade revocation

Revoking the admin session automatically terminates any active impersonated session. This prevents orphaned impersonation sessions from persisting after the admin has logged out.

| Action | Effect |
|---|---|
| Admin ends impersonation | Impersonated session terminated, admin session restored |
| Admin session revoked | Both admin and impersonated sessions terminated |
| Impersonated session revoked independently | Only impersonated session terminated, admin session unaffected |

## Audit trail

All impersonation events are recorded in the audit log:

| Event | Description |
|---|---|
| `ADMIN_IMPERSONATION_STARTED` | Admin began impersonating a user |
| `ADMIN_IMPERSONATION_ENDED` | Admin ended impersonation |

Actions taken during impersonation are logged under the target user's ID, but the `act` claim in the token identifies the admin. Resource servers consuming Kotauth tokens should inspect the `act` claim when present to attribute actions correctly.

## Security considerations

- Only users with the `admin` role on the master tenant can impersonate other users
- Admins cannot impersonate other admins
- Impersonation sessions respect the same token TTLs and security policies as regular sessions
- The `act` claim is signed as part of the JWT — it cannot be forged or stripped by the client

<Aside type="caution">
Impersonation bypasses the target user's authentication credentials but does not bypass their authorization. The impersonated session has exactly the same roles and permissions as the target user — no more, no less.
</Aside>

## Next steps

- [Token Lifecycle](/authentication/token-lifecycle/) — access tokens, refresh tokens, and revocation
- [Custom JWT Claims](/authentication/custom-claims/) — project user attributes into tokens
