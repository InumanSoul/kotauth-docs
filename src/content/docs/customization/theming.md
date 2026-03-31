---
title: White-label Theming
description: Apply your brand identity to Kotauth's auth pages using CSS custom properties.
sidebar:
  order: 2
---

Kotauth's auth pages — login, registration, password reset, and MFA screens — are fully themeable per workspace. You can apply custom brand colors, adjust border radius, and supply your own logo and favicon, all without touching any code.

<Aside type="note">
Theming applies **only to the auth pages** (the screens users see when logging in). The admin console uses a fixed dark theme and is not affected by workspace theme settings.
</Aside>

## How theming works

Each workspace stores a `TenantTheme` configuration. When Kotauth renders an auth page, it serializes the theme as a CSS `:root` block and injects it as an inline `<style>` tag before the auth stylesheet link. The auth CSS (`kotauth-auth.css`) uses `var(--token)` throughout with no fallback defaults — the injected values are the sole source of truth for the page's visual identity.

This means theme changes take effect on the next page load — no rebuild, no redeployment.

<Aside type="note">
Because theme tokens are injected as an inline `<style>` block, Kotauth's Content-Security-Policy includes `'unsafe-inline'` in `style-src`. This is scoped to styles only — `script-src` is strictly `'self'` with no inline JavaScript permitted anywhere. All event handlers use delegated listeners and all JS is bundled with SRI integrity hashes.
</Aside>

## Configuring the theme

In the admin console, navigate to **Workspace → Settings → Branding**. You can set individual values or apply one of the built-in presets as a starting point.

## Built-in presets

Three presets ship with Kotauth:

### DEFAULT

Kotauth's standard dark theme. Used when no custom theme is configured.

| Token | Value |
|---|---|
| `--color-accent` | `#1FBCFF` |
| `--color-accent-hover` | `#0ea5d9` |
| `--color-bg` | `#09090b` |
| `--color-card` | `#18181b` |
| `--color-input` | `#27272a` |
| `--color-border` | `#3f3f46` |
| `--color-text` | `#fafafa` |
| `--color-muted` | `#a1a1aa` |
| `--radius` | `0px` |

### LIGHT

A clean white theme suitable for brands that use a light visual language.

| Token | Value |
|---|---|
| `--color-accent` | `#0ea5d9` |
| `--color-accent-hover` | `#0284c7` |
| `--color-bg` | `#f8fafc` |
| `--color-card` | `#ffffff` |
| `--color-input` | `#f1f5f9` |
| `--color-border` | `#e2e8f0` |
| `--color-text` | `#0f172a` |
| `--color-muted` | `#64748b` |
| `--radius` | `0px` |

### SIMPLE

A light theme with rounded corners — approachable, consumer-facing feel. Uses a near-black accent for maximum contrast.

| Token | Value |
|---|---|
| `--color-accent` | `#212121` |
| `--color-accent-hover` | `#000000` |
| `--color-bg` | `#fafafa` |
| `--color-card` | `#ffffff` |
| `--color-input` | `#f1f5f9` |
| `--color-border` | `#e2e8f0` |
| `--color-text` | `#0f172a` |
| `--color-muted` | `#64748b` |
| `--radius` | `8px` |

## CSS token reference

These are the tokens you can configure. All of them map to CSS custom properties injected into `:root` on every auth page.

| Property | CSS variable | Purpose |
|---|---|---|
| `accentColor` | `--color-accent` | Primary brand color — buttons, links, focus rings |
| `accentHoverColor` | `--color-accent-hover` | Button hover state |
| `bgDeep` | `--color-bg` | Page background |
| `bgCard` | `--color-card` | Card / form container background |
| `bgInput` | `--color-input` | Input field background |
| `borderColor` | `--color-border` | Input and card border color |
| `textPrimary` | `--color-text` | Headings and primary body text |
| `textMuted` | `--color-muted` | Secondary text, labels, hints |
| `borderRadius` | `--radius` | Corner radius applied to cards and inputs |

<Aside type="caution">
Functional colors — error states (red), success states (green), warning states (amber) — are fixed in the base stylesheet and are not configurable. This ensures accessibility contrast requirements are always met regardless of theme.
</Aside>

## Logo and favicon

In addition to the CSS tokens, you can supply:

- **Logo URL** (`logoUrl`) — displayed at the top of auth forms. Recommended size: 200 × 48 px. Any web-accessible URL is accepted; a relative path is resolved against `KAUTH_BASE_URL`.
- **Favicon URL** (`faviconUrl`) — the browser tab icon for auth pages. Recommended: 32 × 32 px SVG or PNG.

Both values are optional. If omitted, Kotauth's default logo and favicon are used.

## Custom theme via API

You can also set the theme programmatically via the REST API. Send the theme values as part of a workspace update request — refer to the REST API reference for the full schema.

```bash
curl -X PATCH https://auth.yourdomain.com/t/{workspace}/api/v1/settings/theme \
  -H "X-API-Key: kauth_myworkspace_..." \
  -H "Content-Type: application/json" \
  -d '{
    "accentColor": "#6366f1",
    "accentHoverColor": "#4f46e5",
    "bgDeep": "#0f0f11",
    "bgCard": "#1a1a1f",
    "bgInput": "#25252d",
    "borderColor": "#3a3a4a",
    "borderRadius": "6px",
    "textPrimary": "#f1f1f5",
    "textMuted": "#9191a8",
    "logoUrl": "https://cdn.yourapp.com/logo-white.svg"
  }'
```

## What is not themeable

The following are intentionally outside the scope of workspace-level theming:

- **Admin console** — always uses Kotauth's fixed dark theme; not tenant-controllable.
- **Typography** — font family and scale are fixed in the auth stylesheet.
- **Structural layout** — form width, spacing, and component structure are not configurable.
- **Functional colors** — error, success, and warning colors are fixed.

These constraints exist to maintain a baseline of usability and accessibility across all tenants.
