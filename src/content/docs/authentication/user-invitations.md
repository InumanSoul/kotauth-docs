---
title: User Invitations
description: How to invite users via email with branded activation links instead of setting passwords directly.
sidebar:
  order: 8
---

import { Aside } from '@astrojs/starlight/components';

User invitations let admins onboard new users without setting passwords on their behalf. Instead of creating a user with a pre-set password, the admin triggers a branded invite email that contains a secure activation link. The invited user clicks the link, sets their own password, and their account becomes active.

<Aside type="note">
  Invite emails require SMTP to be configured for the workspace. If SMTP is not set up, the admin console disables the invite option and shows a prompt to configure it under **Settings > SMTP**.
</Aside>

## How it works

1. An admin creates a new user from the admin console and selects **Send invite email** (the default when SMTP is configured).
2. Kotauth stores the user with a sentinel password hash (`!`) and adds `SET_PASSWORD` to the user's required actions.
3. A secure random token is generated with a **72-hour expiry** and stored with `purpose = INVITE`.
4. A branded email is sent to the user with a "Set your password" call-to-action linking to `/t/{slug}/accept-invite?token=...`.
5. The user opens the link, enters a password that satisfies the workspace's password policy, and submits.
6. Kotauth hashes the token, validates it (purpose, expiry, usage), sets the password, clears the `SET_PASSWORD` action, marks the email as verified, and records the password in history if enabled.
7. The user can now sign in normally.

## Required actions

Kotauth uses a **required actions** model to track pending user setup steps. Required actions are stored as a PostgreSQL `text[]` array on the user record, making the system extensible without requiring database migrations for new action types.

Currently supported actions:

| Action | Trigger | Resolution |
|---|---|---|
| `SET_PASSWORD` | User created via invite | User sets a password via the accept-invite page |

Users with pending required actions cannot authenticate via the normal login flow. The login page displays an actionable message directing them to check their email or ask an admin to resend the invite.

## Token purpose separation

Invite tokens and password-reset tokens share the same underlying `password_reset_tokens` table but are distinguished by a `purpose` column:

| Purpose | Expiry | Use case |
|---|---|---|
| `PASSWORD_RESET` | 1 hour | Self-service password recovery |
| `INVITE` | 72 hours | Admin-initiated user onboarding |

Cross-purpose token usage is rejected at the service layer. An invite token cannot be used on the password reset endpoint, and vice versa. When a new invite is sent (including resends), only previous invite tokens for that user are invalidated — existing password reset tokens remain intact.

## Resending invitations

Admins can resend an invite from the user detail page in the admin console. Resending generates a fresh token (invalidating the previous one) and dispatches a new invite email. The user detail page shows an **"Invite pending"** badge for users who haven't yet completed setup.

## Audit events

| Event | When |
|---|---|
| `USER_INVITE_SENT` | Admin creates a user with invite, or resends an invite |
| `USER_INVITE_ACCEPTED` | User successfully sets their password via the invite link |

## API usage

When creating a user via the REST API, pass `sendInvite: true` in the request body and omit the `password` field:

```bash
curl -X POST https://your-instance.com/t/acme/api/v1/users \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice@example.com",
    "firstName": "Alice",
    "lastName": "Smith",
    "sendInvite": true
  }'
```

The response includes `requiredActions: ["SET_PASSWORD"]` and `emailVerified: false` until the user completes the invite flow.

To resend an invite:

```bash
curl -X POST https://your-instance.com/t/acme/api/v1/users/{id}/resend-invite \
  -H "Authorization: Bearer $API_KEY"
```
