# Stripe sandbox revenue evidence — 30 July 2026

This is redacted test-mode evidence. It contains no Checkout URL, customer,
session, payment, synthetic-email, secret or credential fingerprint.

## Two-offer purchase, cancellation and refund

Synthetic customers completed genuine Stripe Managed Payments Checkout
sessions for Individual Monthly and Individual Lifetime. The application
projected both genuine test `checkout.session.completed` events through its
loopback signature-verification path into the isolated Convex target and
attested exactly:

- two purchases;
- six licences;
- six entitlements;
- six seats; and
- protected-release authorization.

The monthly subscription was subsequently cancelled and the lifetime payment
received a succeeded full-amount test refund. The corresponding subscription
and refund events were projected. Final attestation proved monthly access
expired, lifetime access and seats were revoked, and no open protected-download
grant remained. The protected continuation was removed after reconciliation.

An attempted billing-anchor acceleration produced no renewal invoice. A later
direct-invoice repair was rejected by Stripe because Managed Payments
subscriptions do not permit direct invoice creation. Neither rejected approach
created an invoice or charge, and neither is counted as renewal evidence. The
latched incident recovery completed only cancellation and refund.

## Natural subscription renewal and failed payment

A separate test-clock customer completed a genuine Managed Payments Individual
Monthly Checkout. Four genuine Stripe test events were projected:

1. purchase;
2. a naturally generated, paid `subscription_cycle` invoice;
3. the next naturally generated failed-payment invoice; and
4. cancellation.

Isolated Convex attestation observed access transition from `active` to
`renewed`, `suspended` and `expired`, with exactly one purchase, three licences,
three entitlements, three seats, one paid renewal and one failed invoice. The
test clock and protected continuation were removed after reconciliation.

The real run exposed an additional Managed Payments constraint: Stripe rejects
direct `default_payment_method` updates for subscriptions created by Managed
Payments Checkout. The supported failed-payment exercise therefore removed the
synthetic saved Checkout card after an exact provider-state preflight, then
advanced the next natural test-clock cycle. No production payment method or
customer data was used.

## Evidence boundary

Event objects were retrieved from Stripe test mode and passed through the
application's signature verification with a dedicated loopback signing secret.
This proves application signature handling and exact isolated projection; it
does not prove provider delivery through the deployed production webhook
destination.

This evidence does not prove production email, tax/local-currency handling, a
real paid release, live money or a production customer. Production checkout
remains disabled, and the production-verified North Star remains 0 of 8.
