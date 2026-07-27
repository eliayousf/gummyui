# Monitoring and alerting — approval requirements

Status: monitoring contract drafted; providers, destinations, thresholds,
on-call owner, and costs are not approved or active.

## Required signals

- public home, component catalogue, registry item, catalogue API, health, and
  account-route availability;
- authentication starts, callbacks, recovery, session rejection, and suspicious
  rate-limit events;
- checkout, portal, webhook signature failure, duplicate delivery, invoice,
  cancellation, refund, and failed-payment processing;
- entitlement decision, signed-link creation, expired-link rejection, stale
  membership rejection, and protected download failures;
- transactional email acceptance, delivery, bounce, complaint, and template
  failures;
- database and object-store errors, backup completion, restore-test status, and
  storage growth;
- application exceptions, latency, saturation, and release-to-error
  correlation; and
- public/private source leakage, dependency, secret, and source-map scan gates.

## Alert quality

Alerts must route to a monitored founder-approved destination, identify the
environment and affected journey, avoid customer data and secrets, link to the
relevant runbook, and have a named owner and test cadence. A dashboard without
tested alert delivery is not operational monitoring.

Before production, each high-severity alert needs one controlled trigger and
receipt record. Uptime monitoring must originate outside the production
platform so platform-wide failures remain visible.
