---
title: Backup & Restore
description: Export and import encrypted tenant snapshots via CLI or admin API.
sidebar:
  order: 7
---

import { Aside } from '@astrojs/starlight/components';

Kotauth can export entire workspaces as encrypted, portable archive files. These snapshots contain all tenant data — users, roles, groups, applications, sessions, audit logs, attributes, claim mappers, and settings — in a single file that can be imported into another Kotauth instance.

## Use cases

- **Disaster recovery** — maintain encrypted backups of production workspaces
- **Environment promotion** — export from staging, import to production
- **Migration** — move a workspace between Kotauth instances
- **Testing** — snapshot a workspace before running destructive tests, restore afterward

## Archive format

Exports use the `bkp1` envelope format — a self-contained binary file containing:

| Section | Content |
|---|---|
| Magic bytes | Format identifier (`bkp1`) |
| Metadata | Schema version, tenant slug, export timestamp |
| Salt | 32-byte random salt for key derivation |
| IV | 12-byte initialization vector for AES-GCM |
| Ciphertext | AES-256-GCM encrypted tenant data |

Key derivation uses PBKDF2 with 600,000 iterations and the user-provided passphrase. The high iteration count ensures brute-force resistance even if the archive file is leaked.

<Aside type="caution">
Archive files are encrypted at rest, but you should still store them in a secure location. The passphrase is the only barrier to decryption — use a strong, unique passphrase and store it in a secrets manager.
</Aside>

## CLI usage

Export a workspace:

```bash
java -jar kauth.jar cli export-tenant \
  --slug=my-workspace \
  --output=/backups/my-workspace-2026-05-01.bkp1 \
  --passphrase="your-strong-passphrase"
```

With Docker Compose:

```bash
docker compose exec kauth java -jar kauth.jar cli export-tenant \
  --slug=my-workspace \
  --output=/data/backups/my-workspace.bkp1 \
  --passphrase="your-strong-passphrase"
```

Import a workspace:

```bash
java -jar kauth.jar cli import-tenant \
  --input=/backups/my-workspace-2026-05-01.bkp1 \
  --passphrase="your-strong-passphrase"
```

See [CLI Commands](/deployment/cli/) for full option reference.

## Admin API

The same operations are available via the REST API for programmatic backup workflows.

### Export

```
POST /admin/api/v1/tenants/{slug}/export
Content-Type: application/json
Authorization: Bearer {admin-api-key}

{
  "passphrase": "your-strong-passphrase"
}
```

Returns the encrypted `.bkp1` archive as a binary download (`application/octet-stream`).

### Import

```
POST /admin/api/v1/tenants/import
Content-Type: multipart/form-data
Authorization: Bearer {admin-api-key}

file: <archive.bkp1>
passphrase: your-strong-passphrase
```

Returns the imported tenant metadata on success.

## Schema compatibility

Each archive records the database schema version at the time of export. On import, Kotauth checks that the target instance has run at least that migration version. This prevents data corruption from missing columns or tables.

| Scenario | Result |
|---|---|
| Same schema version | Import succeeds |
| Target is newer (has more migrations) | Import succeeds — additional columns use defaults |
| Target is older (missing migrations) | Import fails with schema mismatch error |
