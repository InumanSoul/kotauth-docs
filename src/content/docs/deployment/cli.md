---
title: CLI Commands
description: Built-in command-line tools for key generation, account recovery, and tenant backup/restore.
sidebar:
  order: 5
---

import { Aside } from '@astrojs/starlight/components';

Kotauth includes a set of CLI subcommands accessible via `java -jar kauth.jar cli <command>`. These tools handle operations that should not require a running HTTP server or browser session — key generation, emergency account recovery, tenant backup/restore, etc.

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

---

## `hash-api-key`

Generates or hashes an API key for use with `KAUTH_BOOTSTRAP_API_KEYS`.

**Generate a new key:**

```bash
java -jar kauth.jar cli hash-api-key --tenant=my-app
```

Output:

```
plaintext: kauth_my-app_a1b2c3d4e5f6...
sha256:    9f86d081884c7d659a2feaa0...
```

The `plaintext` value is what API consumers use in the `Authorization` header. The `sha256` value goes into the `keyHash` field of `KAUTH_BOOTSTRAP_API_KEYS`.

**Hash an existing key:**

```bash
java -jar kauth.jar cli hash-api-key --key=kauth_my-app_sk_xxxxxxxx
```

Output:

```
sha256: 9f86d081884c7d659a2feaa0...
```

| Option | Required | Description |
|---|---|---|
| `--key` | No | An existing key to hash. If omitted, generates a new key. |
| `--tenant` | No | Tenant slug for the key prefix (used in generate mode) |

This command is pure computation — it does not connect to the database.

---

## `export-tenant`

Exports a workspace as an encrypted archive file. The archive uses the `bkp1` envelope format with PBKDF2 (600,000 iterations) key derivation and AES-256-GCM encryption.

```bash
java -jar kauth.jar cli export-tenant \
  --slug=my-workspace \
  --output=/backups/my-workspace.bkp1 \
  --passphrase="your-strong-passphrase"
```

| Option | Required | Description |
|---|---|---|
| `--slug` | Yes | Workspace slug to export |
| `--output` | Yes | Output file path |
| `--passphrase` | Yes | Encryption passphrase |

The archive contains all tenant data: users, roles, groups, applications, sessions, audit logs, attributes, claim mappers, and settings.

<Aside type="caution">
This command requires database connectivity. The `DB_URL` (or `DB_HOST` / `DB_PORT` / `DB_NAME`), `DB_USER`, and `DB_PASSWORD` environment variables must be set.
</Aside>

---

## `import-tenant`

Imports a workspace from an encrypted archive file. Validates schema-version compatibility before applying any data.

```bash
java -jar kauth.jar cli import-tenant \
  --input=/backups/my-workspace.bkp1 \
  --passphrase="your-strong-passphrase"
```

| Option | Required | Description |
|---|---|---|
| `--input` | Yes | Archive file path |
| `--passphrase` | Yes | Decryption passphrase |

<Aside type="caution">
Importing a tenant with a slug that already exists will fail. Delete or rename the existing workspace first.
</Aside>

<Aside type="caution">
This command requires database connectivity. The `DB_URL` (or `DB_HOST` / `DB_PORT` / `DB_NAME`), `DB_USER`, and `DB_PASSWORD` environment variables must be set.
</Aside>

See [Backup & Restore](/deployment/backup-restore/) for full documentation on the archive format, API endpoints, and schema compatibility.
