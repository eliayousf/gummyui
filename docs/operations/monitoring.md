# Monitoring and alerting — approval requirements

Status: redacted structured application logging, the optional Better Stack log
transport and four scheduled-job heartbeat adapters are implemented locally.
Better Stack's free service is configured with an uptime monitor, status page,
log source and four independent heartbeat monitors, and the corresponding
Vercel Production values are installed. No production deployment exists, so
real-origin checks, log ingestion, heartbeat receipt, thresholds and controlled
alert delivery are not proven. The distributed rate limiter is implemented
locally, but suspicious-decision logging and controlled alert receipts remain
launch gates.

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

## Scheduled-job heartbeat contract

Four independent Better Stack heartbeat monitors are configured, with each
generated secret success URL stored only in the matching Vercel Production
environment variable:

| Scheduled route         | Environment variable                             | Vercel schedule     |
| ----------------------- | ------------------------------------------------ | ------------------- |
| Email outbox            | `BETTER_STACK_HEARTBEAT_EMAIL_OUTBOX_URL`        | Every 5 minutes     |
| Privacy deletion jobs   | `BETTER_STACK_HEARTBEAT_PRIVACY_JOBS_URL`        | Daily at 02:15 UTC  |
| Encrypted backup        | `BETTER_STACK_HEARTBEAT_BACKUP_URL`              | Daily at 02:30 UTC  |
| Backup integrity verify | `BETTER_STACK_HEARTBEAT_BACKUP_VERIFY_URL`       | Sunday at 03:45 UTC |

Set each Better Stack expectation to the matching interval and allow a grace
period that exceeds the route's normal runtime. A missing heartbeat is the
alert: failed jobs deliberately do not send a success ping. Heartbeat delivery
is best-effort so a Better Stack outage cannot retry a completed destructive or
non-idempotent job.

The application accepts only the current official secret endpoint shape,
`https://uptime.betterstack.com/api/v1/heartbeat/<token>`. It refuses
non-HTTPS URLs, redirects, URL credentials, query strings, failure-reporting
suffixes and lookalike hosts. Keep these URL tokens out of logs, tickets,
screenshots and committed files.

Before launch, trigger each route once with controlled non-customer data,
confirm the job's own evidence first, then retain a redacted Better Stack
receipt showing the matching heartbeat monitor became healthy. Also trigger one
controlled job failure and retain evidence that no success heartbeat was sent
and the configured missing-heartbeat alert reached the approved destination.

## Alert quality

Alerts must route to a monitored founder-approved destination, identify the
environment and affected journey, avoid customer data and secrets, link to the
relevant runbook, and have a named owner and test cadence. A dashboard without
tested alert delivery is not operational monitoring.

Before production, each high-severity alert needs one controlled trigger and
receipt record. Uptime monitoring must originate outside the production
platform so platform-wide failures remain visible.
