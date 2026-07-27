# Security policy

## Supported surface

The pre-launch public surface is the MIT component source, generated registry,
documentation application, catalogue API, and health endpoint in this
repository. Accounts, checkout, entitlements, downloads, webhooks, customer
records, and production support systems are not active.

## Reporting status

Do not publish sensitive vulnerability details in an issue, discussion, pull
request, or community channel. A monitored private disclosure channel and
response owner must be approved before this repository or site is launched.
Until then, this local baseline cannot truthfully promise a reporting address
or response time.

## Release controls

Every public release must pass type checking, lint, behavior and accessibility
tests, registry clean-install verification, production build, rendered-output
tests, dependency review, secret scanning, and repository-boundary review.
Production deployment additionally requires HTTPS, the response security
headers in `worker/security.ts`, monitoring ownership, and an incident and
rollback procedure.

Paid source, credentials, customer data, signing material, and entitlement
records must never enter this repository or its public build output.
