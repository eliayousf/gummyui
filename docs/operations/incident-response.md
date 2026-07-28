# Incident response — pre-production runbook

Status: procedure implemented and exercised for contained Better Stack, cron
and backup-recovery credential events. Production provider credentials,
`support@kreydlabs.com`, uptime monitoring, structured logs, backup/restore and
release rollback are operational. A controlled support-path message has been
sent through Gmail, and a separate controlled production-sender message was
recorded sent and delivered by Resend, both without customer data. The named
incident commander, backup owner,
and customer-update decision owner remain founder approvals before launch.
Better Stack's controlled sample incident records email delivery to and opening
by the approved support address. A separate genuine missing-heartbeat drill on
the email-outbox monitor opened an incident, sent the configured email alert,
and returned Up after the production schedule was restored and a recovery
heartbeat passed.

## Severity

- **SEV-1:** confirmed paid-source, credential, customer-data, payment, or
  entitlement exposure; complete production outage; or active account takeover.
- **SEV-2:** material degradation, incorrect access decision, failed webhook or
  email processing, monitoring blind spot, or recoverable data-integrity issue.
- **SEV-3:** contained defect without unauthorised access or material customer
  impact.

## First response

1. Record detection time, reporter, affected environment, observable symptoms,
   and the evidence source without copying secrets or customer data into public
   systems.
2. Assign the founder-approved incident commander. No durable named owner is
   recorded yet.
3. Contain the affected surface: disable the narrow route or integration,
   revoke exposed credentials, invalidate signed links or sessions, and stop
   unsafe releases. Do not destroy logs or evidence.
4. Preserve structured logs, provider event identifiers, release manifests,
   checksums, relevant configuration versions, and a timestamped action log.
5. Restore from a known-good release or backup only after its checksum and
   entitlement boundary are independently verified.

## Communication

No response-time promise or public security contact is approved. Before
launch, the founder must approve:

- the incident commander and backup owner;
- the private vulnerability and customer-support destinations;
- legal/privacy escalation and notification decision owners;
- provider escalation contacts; and
- an accurate customer-update process.

Public statements must distinguish investigation, confirmed facts, containment,
recovery, and verification. Never guess affected counts or causes.

## Closure evidence

An incident closes only after the affected journey is re-tested, credentials
and sessions are handled, monitoring is restored, data integrity is checked,
customer/legal decisions are recorded, the cause and contributing controls are
documented, and a dated follow-up owner exists for every corrective action.
