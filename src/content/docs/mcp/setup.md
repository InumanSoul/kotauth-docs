---
title: Setup & Configuration
description: Install and configure the Kotauth MCP server for Claude Desktop, Claude Code, Cursor, or any MCP client.
sidebar:
  order: 2
---

## Prerequisites

Before connecting the MCP server, you need three things from your Kotauth instance:

1. **Base URL** — the root URL of your Kotauth deployment (e.g. `https://auth.yourdomain.com`)
2. **Workspace slug** — the slug of the workspace you want to manage (e.g. `my-app`)
3. **API key** — a key with the scopes required for the tools you want to use

### Creating an API key

<Steps>

1. Open the admin console at `{baseUrl}/admin`
2. Navigate to the workspace you want to manage
3. Go to **Settings → API Keys**
4. Click **Create API Key** and select the scopes you need
5. Copy the key — it is shown exactly once

</Steps>

<Aside type="caution">
Store your API key in a secrets manager or environment variable. If you lose it, delete it and create a new one.
</Aside>

See the [scopes reference](#scope-reference) below for which scopes each tool requires.

## Installation

<Tabs>
<TabItem label="Claude Desktop">

Add the following to your Claude Desktop configuration file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "kotauth": {
      "command": "npx",
      "args": ["-y", "@kotauth/mcp"],
      "env": {
        "KOTAUTH_BASE_URL": "https://auth.yourdomain.com",
        "KOTAUTH_TENANT_SLUG": "my-app",
        "KOTAUTH_API_KEY": "kauth_my-app_sk_xxxxxxxx"
      }
    }
  }
}
```

Restart Claude Desktop. You should see a hammer icon indicating the MCP tools are available.

</TabItem>
<TabItem label="Claude Code">

Add the server from your terminal:

```bash
claude mcp add kotauth \
  -e KOTAUTH_BASE_URL=https://auth.yourdomain.com \
  -e KOTAUTH_TENANT_SLUG=my-app \
  -e KOTAUTH_API_KEY=kauth_my-app_sk_xxxxxxxx \
  -- npx -y @kotauth/mcp
```

The server is immediately available in your Claude Code session.

</TabItem>
<TabItem label="Direct (Node.js)">

Run the MCP server directly with environment variables:

```bash
KOTAUTH_BASE_URL=https://auth.yourdomain.com \
KOTAUTH_TENANT_SLUG=my-app \
KOTAUTH_API_KEY=kauth_my-app_sk_xxxxxxxx \
npx @kotauth/mcp
```

This is useful for testing with the [MCP Inspector](https://github.com/modelcontextprotocol/inspector):

```bash
KOTAUTH_BASE_URL=http://localhost:8080 \
KOTAUTH_TENANT_SLUG=master \
KOTAUTH_API_KEY=kauth_master_sk_xxxxxxxx \
npx @modelcontextprotocol/inspector node dist/index.js
```

</TabItem>
</Tabs>

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `KOTAUTH_BASE_URL` | Yes | Root URL of your Kotauth instance |
| `KOTAUTH_TENANT_SLUG` | Yes | Workspace slug to operate on |
| `KOTAUTH_API_KEY` | Yes | API key with required scopes |

Each MCP server instance is bound to a single workspace. To manage multiple workspaces, configure multiple MCP server entries with different slugs and API keys.

## Scope reference

The MCP server enforces the same scope model as the REST API. Each tool requires specific scopes on the API key:

| Tools | Required scope |
|---|---|
| `list_users`, `get_user` | `users:read` |
| `create_user`, `update_user`, `disable_user`, `assign_user_role`, `remove_user_role` | `users:write` |
| `list_roles` | `roles:read` |
| `create_role`, `delete_role` | `roles:write` |
| `list_groups` | `groups:read` |
| `create_group`, `delete_group`, `manage_group_member` | `groups:write` |
| `list_applications` | `applications:read` |
| `update_application` | `applications:write` |
| `list_sessions` | `sessions:read` |
| `revoke_session` | `sessions:write` |
| `query_audit_logs` | `audit_logs:read` |

<Aside type="tip">
For a read-only reporting key, select only the `:read` scopes. For a full administration key, select all scopes. Always follow the principle of least privilege.
</Aside>

## Verifying the connection

After setup, ask your AI assistant:

> List all users in this workspace.

If the connection is working, the assistant will call the `list_users` tool and return user data from your Kotauth instance. If you see an error, check that your base URL is reachable, the workspace slug is correct, and the API key has `users:read` scope.

## Updating

The MCP server is installed via `npx`, which always fetches the latest published version. To pin a specific version:

```json
"args": ["-y", "@kotauth/mcp@0.1.0"]
```

## Next steps

- [Tool Reference](/mcp/tools) — parameters, return types, and required scopes for all 21 tools
- [Examples & Recipes](/mcp/examples) — common workflows
