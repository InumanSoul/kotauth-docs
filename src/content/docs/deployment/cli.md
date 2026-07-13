---
title: CLI Commands
description: Built-in command-line tools for key generation, account recovery, audit verification, and tenant backup/restore.
sidebar:
  order: 5
---

Kotauth includes CLI subcommands accessible via `java -jar kauth.jar cli <command>`. These tools handle operations that should not require a running HTTP server or browser session.

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

This command is pure cryptography — it does not connect to the database or require any environment variables.

:::tip
You can also generate a key with `openssl rand -hex 32`, but the built-in command ensures the output meets Kotauth's requirements.
:::

---

## `reset-admin-mfa`

Resets MFA enrollment for a user on the master tenant. This is the recovery path when an admin loses access to their authenticator app and all recovery codes.

```bash
java -jar kauth.jar cli reset-admin-mfa --username=admin
```

Connects to the database directly (using `DB_*` environment variables) without running Flyway migrations or starting the HTTP server. Removes the TOTP secret and recovery codes for the specified user, forcing re-enrollment on next login.

| Option | Required | Description |
|---|---|---|
| `--username` | Yes | The username of the admin account to reset |

:::note
Only accounts on the master tenant can be reset via CLI. To reset MFA for users on other workspaces, use the admin console.
:::

---

## `reset-admin-passkeys`

Deletes all passkey (WebAuthn) credentials for a user on the master tenant. This is the recovery path when an admin has lost access to all enrolled authenticators and cannot sign in with a passkey.

```bash
java -jar kauth.jar cli reset-admin-passkeys --username=admin
```

Connects to the database directly. Removes all `webauthn_credentials` rows for the specified user, allowing them to re-enroll passkeys on their next login.

| Option | Required | Description |
|---|---|---|
| `--username` | Yes | The username of the admin account to reset |

:::note
This command is separate from `reset-admin-mfa` — passkeys and TOTP are independent mechanisms. If an admin needs both reset, run both commands.
:::

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

| Option | Required | Description |
|---|---|---|
| `--key` | No | An existing key to hash. If omitted, generates a new key. |
| `--tenant` | No | Tenant slug for the key prefix (used in generate mode) |

This command is pure computation — it does not connect to the database.

---

## `verify-audit-chain`

Verifies the HMAC integrity chain of the audit log for a tenant. Each audit log row carries `prev_hash` and `row_hash` values computed via HMAC-SHA256 keyed by `KAUTH_SECRET_KEY`. This command walks the chain and reports any breaks caused by tampering, deletion, or reordering.

```bash
java -jar kauth.jar cli verify-audit-chain --tenant=my-workspace
```

| Option | Required | Description |
|---|---|---|
| `--tenant` | Yes | Workspace slug to verify |

Output on success:

```
Audit chain for tenant 'my-workspace': 1,247 rows verified, chain intact.
```

Output on failure:

```
Audit chain for tenant 'my-workspace': BREAK at row 892.
  Expected prev_hash: a1b2c3...
  Actual prev_hash:   d4e5f6...
```

:::caution
Requires database connectivity and `KAUTH_SECRET_KEY` (the same key used when the rows were written). If the secret key has been rotated since the rows were written, the chain cannot be verified.
:::

---

## `export-tenant`

Exports a workspace as an encrypted archive file. Uses PBKDF2 (600,000 iterations) key derivation and AES-256-GCM encryption in a `bkp1` envelope format.

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

See [Backup & Restore](/deployment/backup-restore/) for archive format details, API endpoints, and schema compatibility.

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

:::caution
Importing a tenant with a slug that already exists will fail. Delete or rename the existing workspace first.
:::

See [Backup & Restore](/deployment/backup-restore/) for full documentation.
