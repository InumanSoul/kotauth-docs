---
title: Custom JWT Claims
description: How to attach per-user attributes and project them into JWT access and ID tokens using claim mappers.
sidebar:
  order: 9
---

import { Aside } from '@astrojs/starlight/components';

Custom JWT claims let you embed per-user metadata directly into access and ID tokens. Instead of making a separate API call to look up a user's billing plan, department, or feature flags, consuming services can read the value straight from the token payload.

The feature has two parts: **user attributes** (per-user key-value metadata) and **claim mappers** (tenant-level rules that project attributes into tokens).

## How it works

1. An admin or API caller sets an attribute on a user — for example, `plan = enterprise` or `department = engineering`.
2. A claim mapper is configured at the tenant level to project that attribute key into a specific JWT claim name — for example, attribute `plan` → claim `billing_plan`.
3. When Kotauth issues a token for that user, it loads all attributes, applies the matching mappers, and stamps the resulting claims into the JWT payload.
4. Consuming services read `billing_plan: "enterprise"` from the token without any additional API calls.

<Aside type="caution">
  Attribute values flow **unencrypted** into JWTs. JWTs are base64-encoded (not encrypted) and readable by anyone holding the token. Do not store sensitive PII (Social Security numbers, medical data, financial account numbers) in user attributes that are mapped to claims.
</Aside>

## User attributes

Attributes are simple key-value pairs stored per user. Keys are limited to 64 characters and values to 1024 characters. Values are opaque strings — if you need structured data, serialize it yourself (JSON, comma-separated, etc.).

Attributes are managed from the **user detail page** in the admin console (between Profile and Active Sessions) or via the REST API.

### Setting attributes via API

```bash
# Set an attribute
curl -X PUT "https://auth.example.com/t/myapp/api/v1/users/42/attributes/plan" \
  -H "Authorization: Bearer kauth_myapp_sk_..." \
  -H "Content-Type: application/json" \
  -d '{"value": "enterprise"}'

# List all attributes for a user
curl "https://auth.example.com/t/myapp/api/v1/users/42/attributes" \
  -H "Authorization: Bearer kauth_myapp_sk_..."
# → {"attributes": {"plan": "enterprise", "department": "engineering"}}

# Delete an attribute
curl -X DELETE "https://auth.example.com/t/myapp/api/v1/users/42/attributes/plan" \
  -H "Authorization: Bearer kauth_myapp_sk_..."
```

Required API scope: `user_attributes:read` for GET, `user_attributes:write` for PUT and DELETE.

## Claim mappers

Claim mappers are configured at the tenant (workspace) level. Each mapper connects one attribute key to one JWT claim name, with toggles for whether the claim appears in access tokens, ID tokens, or both.

### Configuring mappers via API

```bash
# Create a mapper: attribute "plan" → claim "billing_plan" in access tokens
curl -X PUT "https://auth.example.com/t/myapp/api/v1/claim-mappers/plan" \
  -H "Authorization: Bearer kauth_myapp_sk_..." \
  -H "Content-Type: application/json" \
  -d '{"claimName": "billing_plan", "includeInAccess": true, "includeInId": false}'

# List all mappers
curl "https://auth.example.com/t/myapp/api/v1/claim-mappers" \
  -H "Authorization: Bearer kauth_myapp_sk_..."

# Delete a mapper
curl -X DELETE "https://auth.example.com/t/myapp/api/v1/claim-mappers/plan" \
  -H "Authorization: Bearer kauth_myapp_sk_..."
```

Required API scope: `claim_mappers:read` for GET, `claim_mappers:write` for PUT and DELETE.

### Admin console

Navigate to **Settings → Claim Mappers** in the admin console. The settings page lists all configured mappers with their attribute key, claim name, and token type toggles. Use the **New Mapper** button to create a mapping, or click an existing one to edit.

## Reserved claim names

Kotauth blocks 41 standard OIDC and KotAuth claim names to prevent accidental overwrite:

`sub`, `iss`, `aud`, `exp`, `iat`, `nbf`, `jti`, `nonce`, `auth_time`, `acr`, `amr`, `azp`, `email`, `email_verified`, `name`, `preferred_username`, `given_name`, `family_name`, `middle_name`, `nickname`, `profile`, `picture`, `website`, `gender`, `birthdate`, `zoneinfo`, `locale`, `phone_number`, `phone_number_verified`, `address`, `updated_at`, `tenant_id`, `username`, `scope`, `client_id`, `realm_access`, `resource_access`.

Attempting to map an attribute to a reserved claim name returns a `400 Bad Request` with a specific error message.

## Limits and caching

Each tenant is limited to **20 claim mappers** to prevent JWT bloat. Claim mappers are cached in memory with a **60-second TTL** on the hot token-issuance path. Writes (create, update, delete) immediately invalidate the cache for the affected tenant.

## Propagation timing

Attribute and mapper changes take effect on the **next token issuance**. For existing sessions, the updated claims appear when the client refreshes its tokens — the refresh-token flow re-projects all claims on every renewal.

Worst-case staleness for mapper changes is bounded by the 60-second cache TTL. Attribute changes are always read fresh from the database on each token issuance.

## Audit events

Custom claim operations generate the following audit events:

- `ADMIN_USER_ATTRIBUTE_SET` — attribute created or updated
- `ADMIN_USER_ATTRIBUTE_DELETED` — attribute removed
- `ADMIN_CLAIM_MAPPER_CREATED` — new claim mapper configured
- `ADMIN_CLAIM_MAPPER_UPDATED` — claim mapper settings changed
- `ADMIN_CLAIM_MAPPER_DELETED` — claim mapper removed

## Example: billing plan in access token

A common use case is embedding a billing plan so downstream APIs can enforce feature gates without a separate lookup:

1. Set the attribute: `PUT /users/42/attributes/plan` with `{"value": "pro"}`
2. Create the mapper: `PUT /claim-mappers/plan` with `{"claimName": "billing_plan", "includeInAccess": true, "includeInId": false}`
3. When user 42 authenticates, their access token now contains `"billing_plan": "pro"`
4. Your API validates the token and reads `billing_plan` from the claims — no database call needed
5. When the user upgrades, update the attribute to `enterprise`. On next token refresh, the claim updates automatically.
