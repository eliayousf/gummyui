# Stripe sandbox revenue journey

This operator harness exercises Stripe's real test-mode API and the
application's signed webhook projection. It cannot accept a live credential or
contact a non-loopback application origin.

The procedure has two stages because Stripe Checkout is a hosted customer
interaction. The CLI creates genuine test Checkout Sessions, but a person must
complete Stripe's hosted payment and consent screens.

The harness does not require or fall back to production Stripe credentials or
prices. It compares an ordinary webhook secret, when present, only to prevent
reuse as the dedicated sandbox signing secret. It emits only redacted counts
and fixed status labels. Checkout URLs and identifiers are written only to a
gitignored continuation file under
`work/stripe-sandbox/`, with directory mode `0700` and file mode `0600`.

## Safety contract

- `prepare` and `resume` are dry runs unless `--execute` is present.
- The execution confirmation must be exactly
  `RUN_GUMMYUI_STRIPE_SANDBOX_JOURNEY`.
- The runtime key must start with `rk_test_`; the separate ephemeral operator
  key must start with `sk_test_`.
- Any `rk_live_` or `sk_live_` input is rejected before a provider client is
  constructed.
- The application origin must be `localhost`, `127.0.0.1`, or `[::1]`.
  There is no remote-origin override.
- The sandbox webhook signing value must differ from
  `STRIPE_WEBHOOK_SECRET` when that ordinary variable is present in the CLI
  process. Run the application and CLI as separate processes so the application
  can use the dedicated sandbox value under its normal variable name.
- Before either Stripe stage, the loopback app must attest a Convex deployment
  that reports `isolated-test`, matches the expected target fingerprint, and
  contains the sandbox-namespaced account/workspace identity. Loopback alone is
  not accepted as evidence of data isolation.
- Continuation paths outside direct `work/stripe-sandbox/*.json` children,
  symlinks, group/world-readable files, duplicate prices, non-sandbox identity
  IDs, live Stripe resources, and mismatched account/workspace state fail
  closed.
- Webhook projection has a ten-second request timeout and succeeds only when
  the application returns HTTP 200 with
  `{ "received": true, "status": "applied" }`. An `ignored` event is never
  counted as evidence.
- Provider diagnostics and response bodies are not printed. Investigate fixed
  failure codes through Stripe's test-mode request log and local application
  logs.

## Single-attempt mutation contract

Checkout readiness and both runtime/operator account visibility are repeatable
and occur before the mutating stage. Immediately before the first lifecycle
mutation, the CLI atomically upgrades or writes the schema-v6 continuation
record with `resumeAttemptedAt`.

After that marker is written, `resume` is intentionally single-attempt. Any
failure or process interruption retains the marked file, and every subsequent
`resume` invocation fails with `sandbox_resume_already_attempted`. Do not treat
the retained state or webhook deduplication as retry proof. Inspect the local
logs and Stripe test request log, clean up the synthetic test resources, remove
the marked continuation file, and start a fresh run.

`prepare` first reserves a private schema-v6 `preparing` record containing the
stable run ID and timestamp. Stripe receives stable idempotency keys derived
from that run ID. A provider or process failure retains the reservation, so a
blind retry cannot create another pair. Inspect and discard or recover any
orphan test sessions, then remove the reservation and start clean.

## Prerequisites

Use the project dev shell:

```sh
nix develop
```

Prepare:

1. A dedicated restricted Stripe test key with the same least-privilege runtime
   permissions as production.
2. A separate standard test key, supplied ephemerally to this CLI only, for
   locating events, changing the synthetic subscription, and issuing the test
   refund. Never install this key in the application or Vercel.
3. Nine unique active test prices matching `app/data/commercial.ts` exactly:
   USD amount, monthly/yearly recurrence, or one-time lifetime mode.
4. A loopback application using:
   - the restricted test key as its Stripe server key;
   - the nine sandbox price IDs as its normal `STRIPE_PRICE_*` values;
   - `STRIPE_WEBHOOK_ENABLED=true`;
   - `STRIPE_CHECKOUT_ENABLED=false`;
   - a dedicated sandbox signing value under `STRIPE_WEBHOOK_SECRET`;
   - `STRIPE_SANDBOX_ATTESTATION_ENABLED=true`;
   - an isolated Convex deployment under both
     `NEXT_PUBLIC_CONVEX_URL` and `BACKUP_RESTORE_TARGET_CONVEX_URL`;
   - matching isolated server secrets under `CONVEX_SERVER_SECRET` and
     `BACKUP_RESTORE_TARGET_SERVER_SECRET`;
   - the target's `BACKUP_RESTORE_SECRET` and
     `BACKUP_RESTORE_TARGET_CLASS=isolated-test`;
   - a sandbox-namespaced account/workspace identity.
5. The same dedicated signing value under
   `STRIPE_SANDBOX_WEBHOOK_SECRET` in the separate CLI process. Do not also
   export it there as `STRIPE_WEBHOOK_SECRET`.
6. The isolated target URL under `STRIPE_SANDBOX_CONVEX_URL` in the CLI
   process. The CLI compares its SHA-256 fingerprint with the loopback app's
   Convex-backed attestation.

Set the blank `STRIPE_SANDBOX_*` values from `.env.example` through an ignored
environment file or secret manager. Do not paste keys into a command, terminal
transcript, issue, or committed file.

## Dry-run

```sh
npm run stripe:sandbox:journey -- prepare
npm run stripe:sandbox:journey -- resume
```

Dry-run does not require credentials, call Stripe, contact the application, or
write state.

## Stage 1: create test checkouts

Start the isolated application on the configured loopback origin, then run:

```sh
npm run stripe:sandbox:journey -- prepare --execute
```

`prepare`:

1. proves the loopback app is connected to the expected isolated Convex target
   and seeded synthetic identity;
2. reserves the schema-v6 continuation state before provider mutation;
3. retrieves and validates all nine prices through the restricted runtime key;
4. creates one monthly subscription Checkout and one lifetime-payment Checkout
   through the application's `StripeManagedPaymentsService`;
5. retrieves both sessions and refuses a live, non-open, or non-Stripe result;
6. atomically promotes the reserved continuation to `ready`, retaining hosted
   URLs only in `work/stripe-sandbox/journey.json` without printing them.

Open both URLs locally from that protected file and complete them with Stripe
test-mode details and synthetic identity data. Never use a real customer email,
address, tax identifier, or payment instrument. Do not copy the URLs into chat
or durable logs.

Calling `resume` while a Checkout is incomplete stops during the repeatable
readiness check, before `resumeAttemptedAt` is written.

## Stage 2: single-attempt purchase, cancellation and refund

After both hosted test checkouts show success:

```sh
npm run stripe:sandbox:journey -- resume --execute
```

`resume`:

1. re-attests the expected isolated Convex target and synthetic identity;
2. revalidates all prices and both completed, paid Checkout Sessions through
   both the restricted runtime and standard test operator keys;
3. atomically records that the non-retryable mutation attempt has started;
4. projects both real `checkout.session.completed` events and immediately
   proves the exact checkout-linked purchases, six licences, six entitlements,
   six seats and protected-release authorization on the isolated target;
5. schedules and completes cancellation, projecting the subscription update
   and deletion;
6. requires a succeeded, full-amount lifetime refund and projects
   `refund.created`;
7. queries the same isolated Convex target by the two exact Checkout Session IDs
   and proves the monthly access expired, lifetime access and seats were
   revoked, and no open protected-download grant remains;
8. removes the continuation file only after all five first-pass projections
   return `status: "applied"` and access revocation is attested.

This two-offer command deliberately does not manufacture renewal invoices.
Stripe Managed Payments rejects direct subscription invoice creation and
default-payment-method changes. Natural renewal and failed-payment evidence
belongs to the separate test-clock journey below.

## Historical incident recovery operations

The schema-v6 parser retains three single-use, state-latched recovery operations
for the 30 July 2026 sandbox incident:

```sh
npm run stripe:sandbox:journey -- recover-anchor-no-invoice --execute
npm run stripe:sandbox:journey -- repair-invoice-create-rejected --execute
npm run stripe:sandbox:journey -- finish-managed-lifecycle --execute
```

They are not normal journey steps and cannot start from a fresh continuation.
The first operation was created after a billing-anchor reset advanced the
subscription without producing a renewal invoice. The second was created after
the controlled-invoice repair was rejected because Managed Payments
subscriptions do not permit direct invoice creation. Neither failed approach
created a charge or counts as renewal evidence. The final operation was allowed
only from the exact latched incident state; it completed cancellation and the
full test refund, attested access revocation and removed the continuation.

Do not replay these operations, loosen their state predicates or treat their
presence as a generic retry mechanism.

## Natural renewal and failure with a Stripe test clock

Use the same isolated loopback application, operator environment and protected
state directory:

```sh
npm run stripe:sandbox:test-clock -- prepare
npm run stripe:sandbox:test-clock -- resume
npm run stripe:sandbox:test-clock -- prepare --execute
```

`prepare --execute` creates a fresh Stripe test clock, synthetic customer and
one genuine Managed Payments Individual Monthly Checkout. Its URL exists only
in the mode-0600 protected continuation. Complete that Checkout with Stripe's
official test card and synthetic customer data, then run:

```sh
npm run stripe:sandbox:test-clock -- resume --execute
```

The resumable schema-v2 journal persists every target before advancing the
clock and records observed/finalized invoice IDs before projection. `resume`:

1. projects the exact Checkout event and attests active access;
2. advances to the next natural billing cycle, waits for Stripe to finalize and
   pay the `subscription_cycle` invoice, projects it and attests renewed access;
3. proves the provider state contains exactly the initial and renewal invoices,
   no later failure/cancellation, the expected saved Checkout card and no
   customer-level fallback;
4. detaches that synthetic saved card, journals the next cycle and advances it;
5. waits for the natural attempted, unpaid, open cycle invoice, projects the
   exact `invoice.payment_failed` event and attests suspended access;
6. journals and cancels the subscription, projects the deletion and attests
   expired access; and
7. deletes the test clock and continuation only after reconciliation.

Projection replay accepts Stripe/Convex `duplicate` only in this journaled
test-clock path and always follows it with authoritative state attestation.
Ordinary sandbox projection remains first-apply-only.

On 30 July 2026 this path completed with four genuine Stripe test events and
access states `active`, `renewed`, `suspended` and `expired`.

## Evidence and limits

Successful CLI output is redacted sandbox evidence, not production evidence:

- Stripe's hosted Checkout requires a controlled test-mode interaction between
  `prepare` and `resume`.
- Signed projection uses real Stripe test Event objects and a dedicated local
  signing secret. It proves first-pass signature validation and application
  projection; it does not prove delivery from a Stripe webhook destination.
- Managed Payments renewal and failed-payment proof comes only from natural
  test-clock cycles. The harness does not call unsupported direct invoice or
  subscription payment-method mutation APIs.
- The refund is a real test-mode full refund only. No production charge,
  customer, entitlement, email, or money is involved.
- This command does not provision prices, create webhook destinations, seed
  Convex identities, send email, toggle flags, or write production evidence.
