---
title: Examples & Recipes
description: Common MCP workflows for managing Kotauth identity resources through AI assistants.
sidebar:
  order: 4
---

These examples show natural language prompts and the MCP tools the AI assistant calls behind the scenes. The exact wording doesn't matter — the assistant interprets your intent and selects the right tools.

## Onboard a new team member

**Prompt:**

> Create a user for Jane Doe with username jdoe and email jane.doe@acme.com, then assign her the "editor" role.

**What happens:**

1. `create_user` — creates the account with the given username, email, and a generated password
2. `list_roles` — finds the "editor" role and its ID
3. `assign_user_role` — assigns the role to the new user

**Required scopes:** `users:write`, `roles:read`

---

## Investigate a failed login

**Prompt:**

> Show me the last 10 failed login attempts.

**What happens:**

1. `query_audit_logs` with `eventType: "LOGIN_FAILED"` and `limit: 10`

The assistant returns a table of failed attempts with timestamps, usernames, and IP addresses from the audit log details.

**Required scopes:** `audit_logs:read`

---

## Revoke sessions for a compromised account

**Prompt:**

> Find all active sessions for user ID 42 and revoke them.

**What happens:**

1. `list_sessions` — lists all active sessions
2. The assistant filters for sessions belonging to user 42
3. `revoke_session` — called once for each matching session

**Required scopes:** `sessions:read`, `sessions:write`

---

## Set up a role hierarchy

**Prompt:**

> Create a "viewer" role, an "editor" role, and a "managers" group. Add user 15 to the managers group and assign the editor role to the group.

**What happens:**

1. `create_role` × 2 — creates "viewer" and "editor" roles
2. `create_group` — creates the "managers" group
3. `manage_group_member` — adds user 15 to the group
4. The assistant notes that assigning roles to groups is done through the admin console or REST API directly (MCP tools manage group membership, not group-role assignments)

<Aside type="note">
The MCP server currently supports assigning roles to individual users via `assign_user_role`. Group-level role assignments are managed through the admin console or the REST API directly.
</Aside>

**Required scopes:** `roles:write`, `groups:write`

---

## Audit who accessed the system today

**Prompt:**

> Show me all successful logins from today.

**What happens:**

1. `query_audit_logs` with `eventType: "LOGIN_SUCCESS"` and `limit: 200`

The assistant filters the results by today's date and presents a summary of who logged in, when, and from which IP.

**Required scopes:** `audit_logs:read`

---

## Update an OAuth application's redirect URIs

**Prompt:**

> Add https://staging.acme.com/callback to the redirect URIs for the "acme-web" application.

**What happens:**

1. `list_applications` — finds "acme-web" and its current redirect URIs
2. `update_application` — sends the updated `redirectUris` array with the new URI appended

**Required scopes:** `applications:read`, `applications:write`

---

## Quick user lookup

**Prompt:**

> Find the user with email alice@example.com and show me their details.

**What happens:**

1. `list_users` with `search: "alice@example.com"`
2. `get_user` with the matched user's ID for full details including MFA status

**Required scopes:** `users:read`

---

## Bulk operations

MCP tools execute one operation at a time, but the AI assistant can chain them. For example:

> Disable users 12, 15, and 23 — they've all left the company.

The assistant calls `disable_user` three times, once for each user ID, and confirms each result.

<Aside type="tip">
For large batch operations (50+ users), consider using the REST API directly with a script. MCP is best suited for ad-hoc administration tasks where you'd otherwise navigate the admin console or write one-off curl commands.
</Aside>

## npm package

The `@kotauth/mcp` package is published on npm:

[**npmjs.com/package/@kotauth/mcp**](https://www.npmjs.com/package/@kotauth/mcp)

For source code, issues, and contributions:

[**github.com/kotauth/kotauth-mcp**](https://github.com/kotauth/kotauth-mcp)
