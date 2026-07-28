# Better Stack source-token rotation — 28 July 2026

**Classification:** contained configuration exposure; no customer data, paid
source, read access or provider-administration capability involved.

During production monitoring setup, an ingestion-only Better Stack source token
was rendered in operator-tool output. The source had received no application
events. The token could only submit log records to that one source; it could not
read logs or manage the Better Stack account.

Containment was immediate:

1. a replacement EU production source was created;
2. its credential and ingest host were installed in Vercel Production;
3. the exposed source and an intermediate replacement were both removed; and
4. the source list was checked to confirm that only the final production source
   remains.

The final replacement token is not recorded in either repository, this incident
record, screenshots, or retained command output. Repository secret scanning is
required before release. The replacement source still needs deployed-origin
ingestion and controlled alert-receipt proof before monitoring can pass.
