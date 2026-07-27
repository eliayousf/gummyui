# Incident response — pre-production runbook

Status: procedure drafted; production owner, alert destinations, service
credentials, and communication channels are not yet approved or operational.

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
2. Assign the founder-approved incident commander. This role is currently
   unassigned and must be approved before production launch.
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
