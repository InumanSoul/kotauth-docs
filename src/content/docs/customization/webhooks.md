---
title: Webhooks
description: React to identity events in real time with HMAC-signed webhook deliveries.
sidebar:
  order: 1
---

Kotauth can push a signed HTTP POST to any URL you control whenever a significant identity event occurs in your workspace — a new user registered, a login failed, a session was revoked. This lets your application react in real time without polling the Kotauth API.

## How it works

1. You register a webhook endpoint URL in the admin console.
2. Kotauth selects which event types that endpoint subscribes to.
3. When an event fires, Kotauth builds a JSON payload, signs it with HMAC-SHA256, and sends it via HTTP POST — asynchronously in a background coroutine so delivery never blocks the auth flow.
4. If delivery fails (non-2xx response or connection error), Kotauth retries automatically on a fixed schedule.

## Registering an endpoint

In the admin console, navigate to **Workspace → Webhooks → Add Endpoint**. Provide:

- **URL** — must start with `http://` or `https://`. Maximum 2048 characters.
- **Events** — select one or more event types to subscribe to.
- **Description** — optional label shown in the admin console.

On save, Kotauth generates a random 32-byte hex **signing secret**. This value is shown exactly once — copy it immediately and store it securely. It is not recoverable; if lost, delete the endpoint and create a new one.

## Payload format

Every delivery is an HTTP POST with `Content-Type: application/json`. The body follows this envelope:

```json
{
  "event": "user.created",
  "timestamp": "2026-03-17T12:00:00.000Z",
  "data": {
    "userId": "123",
    "email": "alice@example.com",
    "tenantId": "42"
  }
}
```

| Field | Type | Description |
|---|---|---|
| `event` | string | One of the event type strings listed below |
| `timestamp` | string | ISO 8601 UTC timestamp of when the event occurred |
| `data` | object | Event-specific key-value pairs |

## Event types

| Event | Trigger |
|---|---|
| `user.created` | A new user account is created |
| `user.updated` | A user's profile, password, or MFA enrollment changes |
| `user.deleted` | A user account is permanently deleted |
| `login.success` | A user completes authentication successfully |
| `login.failed` | An authentication attempt fails (wrong password, locked account, etc.) |
| `password.reset` | A password reset is completed |
| `mfa.enrolled` | A user successfully enrolls in MFA |
| `session.revoked` | A session is invalidated (logout, admin revocation, or refresh token theft detection) |

## Signature verification

Every request includes a signature in the `X-KotAuth-Signature` header:

```
X-KotAuth-Signature: sha256=a1b2c3d4e5f6...
```

The value is `sha256=` followed by the lowercase hex HMAC-SHA256 of the raw request body, keyed with the endpoint's signing secret.

**Always verify this signature before processing the payload.** Without verification, an attacker who knows your endpoint URL could send forged events.

### Verification examples

```javascript
// Node.js
const crypto = require('crypto');

function verifyWebhook(rawBody, signatureHeader, secret) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(rawBody)          // use the raw bytes, not a parsed object
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signatureHeader),
    Buffer.from(expected),
  );
}
```

```python
# Python
import hmac
import hashlib

def verify_webhook(raw_body: bytes, signature_header: str, secret: str) -> bool:
    expected = 'sha256=' + hmac.new(
        secret.encode(),
        raw_body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(signature_header, expected)
```

<Aside type="caution">
Compute the HMAC over the **raw request body bytes**, not over a parsed/re-serialized JSON object. JSON serialization is not guaranteed to produce the same byte sequence, which will cause signature mismatches.
</Aside>

## Retry schedule

Kotauth attempts delivery up to three times per event:

| Attempt | Delay |
|---|---|
| 1 | Immediate |
| 2 | 5 minutes after first failure |
| 3 | 30 minutes after second failure |

A delivery is considered successful when your endpoint returns any 2xx HTTP status code within a 10-second read timeout (5-second connect timeout). Any other outcome — non-2xx status, timeout, connection refused — counts as a failure.

After three failed attempts the delivery is marked **FAILED** and no further retries occur. The failure is recorded in the delivery log (see below) for operator inspection.

<Aside type="note">
Webhook delivery is fire-and-forget from the auth flow's perspective. A failing webhook endpoint does not delay or block login, token issuance, or any other auth operation.
</Aside>

## Delivery statuses

| Status | Meaning |
|---|---|
| `PENDING` | Delivery is queued or being retried |
| `DELIVERED` | Endpoint returned a 2xx response |
| `FAILED` | All retry attempts exhausted without a 2xx response |

## Delivery log

The admin console shows recent delivery history under **Workspace → Webhooks → [Endpoint] → Deliveries**. Each record includes the event type, timestamp, HTTP response code, attempt count, and current status. Use this log to debug integration issues before checking your own application logs.

## Endpoint management

| Action | Effect |
|---|---|
| **Disable** | Endpoint is paused — no new deliveries. Re-enable to resume. |
| **Delete** | Endpoint and its delivery history are removed permanently. |
| **Rotate secret** | Delete and recreate the endpoint. Update the secret in your receiving application before recreating. |
