---
title: Email Branding
description: Customize transactional email appearance per workspace — brand name, color, logo, support email, and sender display name.
sidebar:
  order: 4
---

import { Aside } from '@astrojs/starlight/components';

Every workspace can customize the appearance of transactional emails — password resets, email verifications, OTP codes, account lockout notifications, and user invitations. Branding is configured through the admin console and applies to all outbound emails for the workspace.

## Configurable fields

| Field | Description | Default |
|---|---|---|
| **Brand name** | Displayed as the workspace name in email headers and subject lines | Workspace display name |
| **Brand color** | Hex color for the CTA button background in emails | Theme accent color |
| **Brand logo URL** | Logo image displayed in the email header | Theme logo URL |
| **Support email** | Rendered as a mailto link in the email footer | Not shown |
| **From display name** | The human-readable part of the `From:` header (e.g. `"Acme Auth" <noreply@...>`) | SMTP from name or workspace display name |

All fields are optional. When unset, Kotauth falls back to the workspace's theme values or SMTP configuration.

## Configuration

Navigate to **Settings → Branding** in the admin console for the workspace.

The form fields correspond to the configurable fields above. Changes take effect on the next email sent — no restart required.

### Validation rules

- **Brand color** must be a valid hex color matching `#RGB`, `#RRGGBB`, or similar patterns (3, 4, 6, or 8 hex digits with `#` prefix).
- **Support email** must contain an `@` character.
- **Brand logo URL** must use `http://` or `https://` scheme with a non-empty host.
- Blank values are treated as "unset" and fall back to defaults.

## How it applies to emails

When Kotauth sends a transactional email, it resolves each branding property with a fallback chain:

**Logo**: `brandLogoUrl` → `theme.logoUrl` → no logo

**Button color**: `brandColorHex` → `theme.accentColor` → default blue

**Sender name**: `fromDisplayName` → `smtpFromName` → workspace display name

**Workspace label in header**: `brandName` → workspace display name

**Footer support link**: `supportEmail` → not rendered

<Aside type="note">
The envelope sender address (the actual email address in the `From:` header) is always determined by the SMTP configuration, not by email branding. This ensures DKIM, SPF, and DMARC alignment is controlled by the operator, not per-workspace admins.
</Aside>

## Example

A workspace named "Acme" with the following branding:

| Field | Value |
|---|---|
| Brand name | Acme Identity |
| Brand color | `#2563EB` |
| Brand logo URL | `https://cdn.acme.com/logo.png` |
| Support email | `support@acme.com` |
| From display name | Acme Security |

Produces emails with:

- `From: Acme Security <noreply@auth.acme.com>`
- Header showing the Acme logo
- "Acme Identity" as the workspace label
- Blue (`#2563EB`) CTA buttons
- A "Contact support" mailto link to `support@acme.com` in the footer

<Aside type="tip">
Test your branding by triggering a password reset or email verification after saving changes. The admin console does not include an email preview — send a real email to verify the result.
</Aside>
