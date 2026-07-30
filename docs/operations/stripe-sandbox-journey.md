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
mutation, the CLI atomically upgrades or writes the schema-v3 continuation
record with `resumeAttemptedAt`.

After that marker is written, `resume` is intentionally single-attempt. Any
failure or process interruption retains the marked file, and every subsequent
`resume` invocation fails with `sandbox_resume_already_attempted`. Do not treat
the retained state or webhook deduplication as retry proof. Inspect the local
logs and Stripe test request log, clean up the synthetic test resources, remove
the marked continuation file, and start a fresh run.

`prepare` first reserves a private schema-v3 `preparing` record containing the
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
2. reserves the schema-v3 continuation state before provider mutation;
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

## Stage 2: single-attempt lifecycle projection

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
5. resets the monthly subscription billing anchor and projects the resulting
   paid invoice;
6. attaches Stripe's declined test payment token, resets the anchor again, and
   projects the resulting `invoice.payment_failed` event;
7. schedules and completes cancellation, projecting the subscription update
   and deletion;
8. requires a succeeded, full-amount lifetime refund and projects
   `refund.created`;
9. queries the same isolated Convex target by the two exact Checkout Session IDs
   and proves the monthly access expired, lifetime access and seats were
   revoked, and no open protected-download grant remains;
10. removes the continuation file only after all seven first-pass projections
   return `status: "applied"` and access revocation is attested.

The billing-anchor reset is an accelerated test invoice exercise. It is not a
scheduled renewal and must not be recorded as renewal evidence.

## Evidence and limits

Successful CLI output is redacted sandbox evidence, not production evidence:

- Stripe's hosted Checkout requires a human test-mode interaction between
  `prepare` and `resume`.
- Signed projection uses real Stripe test Event objects and a dedicated local
  signing secret. It proves first-pass signature validation and application
  projection; it does not prove delivery from a Stripe webhook destination.
- If Managed Payments rejects operator-side subscription or PaymentIntent
  mutation, the harness fails closed and the fixtures must be recreated.
- The failed-payment leg depends on Stripe's `tok_chargeDeclined` test token.
- The refund is a real test-mode full refund only. No production charge,
  customer, entitlement, email, or money is involved.
- This command does not provision prices, create webhook destinations, seed
  Convex identities, send email, toggle flags, or write production evidence.
