---
title: Key Rotation
description: How to rotate RS256 signing keys per workspace with zero-downtime key rollover.
sidebar:
  order: 6
---

import { Aside } from '@astrojs/starlight/components';

Kotauth supports admin-initiated signing key rotation per workspace. You can generate a new RS256 key pair, promote it to the active signing key, and keep the previous key available for token verification until you're ready to retire it. This allows zero-downtime key rollover without invalidating tokens that are still in flight.

## How it works

Each workspace in Kotauth has one or more RS256 key pairs stored in the `tenant_keys` table. Exactly one key per workspace is marked as **active** — this is the key used to sign new tokens. Other keys can be in one of two states:

| State | Signs new tokens | In JWKS | Verifies existing tokens |
|---|---|---|---|
| **Active** | Yes | Yes | Yes |
| **Verification only** | No | Yes | Yes |
| **Retired** | No | No | No |

When you rotate a key:

1. A new RS256 key pair is generated and encrypted at rest with AES-256-GCM.
2. The new key is promoted to **active** and begins signing all new tokens.
3. The previous active key is demoted to **verification only** — it remains in the JWKS endpoint so clients can still verify tokens signed with it.
4. All issued tokens include a `kid` (Key ID) header per RFC 7517. Token verification reads this header to select the correct public key.

When you retire a key:

1. The key is removed from the JWKS endpoint.
2. Any tokens signed with that key will fail verification.
3. You cannot retire the currently active key — rotate first, then retire the old one.

## When to rotate

Rotate signing keys when:

- Your security policy requires periodic key rotation (e.g. every 90 days).
- You suspect a key may have been compromised.
- Compliance requirements mandate regular cryptographic material rotation.
- You're performing a security audit and want fresh key material.

<Aside type="tip">
  After rotating, wait for your longest-lived token TTL to expire before retiring the old key. This ensures all tokens signed with the previous key have naturally expired.
</Aside>

## Rotating keys from the admin console

1. Navigate to the workspace in the admin console.
2. Open **Settings > Signing Keys** from the sidebar.
3. Click **Rotate Signing Key**. A new key is generated and promoted immediately.
4. The previous key appears in the table with status "Verification only".
5. Once you're confident all old tokens have expired, click **Retire** to remove it from JWKS.

The key management page shows a history of all keys with their Key ID, creation timestamp, and current status.

## JWT kid header

All tokens issued by Kotauth include a `kid` (Key ID) claim in the JWT header:

```json
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

This applies to access tokens, ID tokens, and client credentials tokens. OIDC-compliant client libraries use the `kid` to look up the correct public key from the JWKS endpoint (`/t/{slug}/.well-known/jwks.json`).

Tokens issued before key rotation was introduced (pre-v1.5.2) do not have a `kid` header. Kotauth handles this gracefully by falling back to the active key for verification.

## Audit events

| Event | When | Details |
|---|---|---|
| `ADMIN_KEY_ROTATED` | A new signing key is promoted to active | `new_key_id`, `previous_key_id` |
| `ADMIN_KEY_RETIRED` | A key is removed from JWKS | `retired_key_id` |

## JWKS endpoint behavior

The JWKS endpoint at `/t/{slug}/.well-known/jwks.json` returns public keys for all **active** and **verification-only** keys. Retired keys are excluded. This means:

- After rotation: both the new and old public keys are in JWKS.
- After retirement: only the new public key remains.
- Clients that cache JWKS should refresh periodically to pick up rotations.
