---
title: OIDC / OAuth2 Overview
description: Kotauth's OpenID Connect and OAuth2 protocol endpoints.
sidebar:
  order: 1
---

Kotauth is a fully compliant OpenID Connect Provider (OP). This section documents the protocol-level endpoints — the raw HTTP surface that OAuth2/OIDC libraries interact with.

If you're integrating an application, you likely don't need to read these pages directly. Instead, point your OAuth2 library at the discovery document URL and let the library handle the protocol. These pages are useful when debugging, implementing a custom integration, or understanding what happens under the hood.

## Endpoint overview

All protocol endpoints are scoped to a workspace under `/t/{workspaceSlug}/`:

| Endpoint | Path |
|---|---|
| [OIDC Discovery Document](#) | `/.well-known/openid-configuration` |
| [JWKS (Public Keys)](/oidc/discovery/) | `/protocol/openid-connect/certs` |
| [Authorization](/oidc/authorization/) | `/authorize` |
| [Token](/oidc/token/) | `/protocol/openid-connect/token` |
| [Userinfo](/oidc/userinfo/) | `/protocol/openid-connect/userinfo` |
| [Introspection](/oidc/introspection-revocation/) | `/protocol/openid-connect/introspect` |
| [Revocation](/oidc/introspection-revocation/) | `/protocol/openid-connect/revoke` |
| [End Session (Logout)](/oidc/introspection-revocation/) | `/protocol/openid-connect/logout` |

## Supported flows

| Flow | Grant type | Use case |
|---|---|---|
| Authorization Code + PKCE | `authorization_code` | User-facing apps |
| Client Credentials | `client_credentials` | Service-to-service |
| Refresh Token | `refresh_token` | Token renewal |

Implicit flow and Password grant are **not** supported. Both are deprecated in OAuth 2.1.

## Signing algorithm

All tokens are signed with **RS256** (RSA-SHA256). Each workspace has its own RSA key pair, generated automatically on workspace creation. The private key never leaves the Kotauth instance. The public key is available at the JWKS endpoint.

Key rotation is currently manual — a new key pair can be generated from the admin console. Old tokens signed with the previous key remain valid until they expire.

## Standards implemented

- [RFC 6749](https://www.rfc-editor.org/rfc/rfc6749) — The OAuth 2.0 Authorization Framework
- [RFC 7636](https://www.rfc-editor.org/rfc/rfc7636) — Proof Key for Code Exchange (PKCE)
- [RFC 7662](https://www.rfc-editor.org/rfc/rfc7662) — Token Introspection
- [RFC 7009](https://www.rfc-editor.org/rfc/rfc7009) — Token Revocation
- [RFC 8414](https://www.rfc-editor.org/rfc/rfc8414) — Authorization Server Metadata (Discovery)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [OpenID Connect Discovery 1.0](https://openid.net/specs/openid-connect-discovery-1_0.html)
