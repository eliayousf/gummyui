# Isolated restore query proof — 28 July 2026

This is production-provider recovery evidence, not a customer transaction and
not a paid-release delivery. The existing empty Convex development restore
target was classified `isolated-test`, had all 25 schema tables empty, used
secrets distinct from production and had no payment, email, authentication,
cron, download-storage or public-routing integration.

The fail-closed operator runner restored all 24 durable tables in the fixed
sequence, with one synthetic release record and no ephemeral rate-limit state.
It then used only the target's protected commerce mutation to create a
synthetic identity and completed purchase. No real provider identifier, email
address, customer record or paid archive was used.

The retained redacted result was:

```json
{
  "schemaVersion": "convex-commerce-v1",
  "targetClass": "isolated-test",
  "targetFingerprint": "e876780b5116fb05b77355dc5d801da879da63dbfdf4a02b664375cb4d8ffdd7",
  "restoredTableCount": 24,
  "seededReleaseCount": 1,
  "queryItemCounts": {
    "overview": 5,
    "downloads": 1,
    "team": 3,
    "security": 3
  },
  "paidAccessAuthorized": true,
  "oneUseGrantConsumed": true,
  "replayDenied": true,
  "expiredGrantDenied": true,
  "refundedAccessDenied": true,
  "auditEventCount": 3,
  "externalIntegrationsInvoked": false
}
```

This proves representative account, team, licence, entitlement, release,
single-use download, expiry, refund revocation and audit-query semantics after
an isolated restore. It does not prove a real B2 release archive, production
customer identity, Stripe payment, Resend delivery or customer-facing signed
download. Those gates remain closed.

The isolated target now deliberately contains only the synthetic drill records
and must be deleted through the Convex dashboard after founder authentication.
It must never receive production routing or provider credentials.
