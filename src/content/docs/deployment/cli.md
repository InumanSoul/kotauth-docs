---
title: CLI Commands
description: Built-in command-line tools for key generation and account recovery.
sidebar:
  order: 5
---

import { Aside } from '@astrojs/starlight/components';

Kotauth includes a set of CLI subcommands accessible via `java -jar kauth.jar cli <command>`. These tools handle operations that should not require a running HTTP server or browser session — key generation, emergency account recovery, etc.

## Usage

```bash
java -jar kauth.jar cli <command> [options]
```

When running with Docker Compose, use `docker compose exec`:

```bash
docker compose exec kauth java -jar kauth.jar cli <command> [options]
```

Or with the Makefile shortcuts:

```bash
make generate-key
make reset-mfa USER=admin
```

---

## `generate-secret-key`

Generates a cryptographically secure 32-byte hex string suitable for `KAUTH_SECRET_KEY`.

```bash
java -jar kauth.jar cli generate-secret-key
```

Output:

```
a1b2c3d4e5f6...  # 64-character hex string
```

This command is pure cryptography — it does not connect to the database or require any environment variables. Use it to provision a new key before first startup or when rotating an existing key.

<Aside type="tip">
You can also generate a key with `openssl rand -hex 32`, but the built-in command ensures the output meets Kotauth's requirements.
</Aside>

---

## `reset-admin-mfa`

Resets MFA enrollment for a user on the master tenant. This is the recovery path when an admin loses access to their authenticator app and all recovery codes.

```bash
java -jar kauth.jar cli reset-admin-mfa --username=admin
```

This command connects to the database directly (using `DB_*` environment variables) without running Flyway migrations or starting the HTTP server. It removes the TOTP secret and recovery codes for the specified user, forcing re-enrollment on the next login.

| Option | Required | Description |
|---|---|---|
| `--username` | Yes | The username of the admin account to reset |

<Aside type="caution">
This command requires database connectivity. The `DB_URL` (or `DB_HOST` / `DB_PORT` / `DB_NAME`), `DB_USER`, and `DB_PASSWORD` environment variables must be set.
</Aside>

<Aside type="note">
Only accounts on the master tenant can be reset via CLI. To reset MFA for users on other workspaces, use the admin console.
</Aside>
