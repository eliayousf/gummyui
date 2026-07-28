# Better Stack missing-heartbeat drill — 28 July 2026

**Classification:** controlled monitoring exercise; no customer data, paid
source, production job failure or credential disclosure.

The live email-outbox heartbeat was found configured with a five-day
expectation even though Vercel runs the job every five minutes. The monitor was
corrected to the production contract: a five-minute expectation with a
five-minute grace period.

To prove failure detection without risking a backup or destructive job, only
that monitor's expectation and grace period were temporarily shortened to one
minute. No heartbeat was sent during the test window. Better Stack changed the
monitor to Down, opened incident `994928414` with cause `Missed heartbeat`, and
recorded an email sent to `support@kreydlabs.com`.

Recovery was controlled and complete:

1. the production five-minute expectation and five-minute grace period were
   restored;
2. a single recovery heartbeat returned HTTP 200;
3. the incident resolved and the monitor returned Up; and
4. the other three production heartbeat monitors were not modified.

No heartbeat URL, provider token, email body or personal data is retained in
this record.
