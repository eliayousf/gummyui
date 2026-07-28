# Staging customer journey — 28 July 2026

**Scope:** native Next.js 16 development runtime, the provisioned WorkOS
non-production AuthKit environment and the EU Convex development deployment.
This is staging evidence only. It does not pass a production North Star step.

## Control-plane state

- Convex development and production deployments exist in EU West.
- The WorkOS team and non-production AuthKit environment are provisioned.
- `convex.json` owns the localhost and production redirect, homepage and CORS
  contracts. Development credentials are injected only into ignored local
  environment state; no credential is committed.
- Production AuthKit remains blocked until a billing method is added in WorkOS.
- Customer checkout and every production webhook remain fail closed.

## Browser journey

The following journey ran against `http://localhost:3000` with the real staging
provider APIs and the real Convex development functions:

1. Google sign-in left Gummy UI, completed in hosted AuthKit and returned
   through `/auth/callback`.
2. The callback created the privacy-minimised account and personal-workspace
   projection. The unpaid account showed zero purchases, zero active licences
   and zero available releases.
3. A team workspace named `Gummy UI Sandbox QA` was created in WorkOS and
   projected into Convex.
4. Re-authentication for that organization recovered the organization session
   and showed the workspace with the current role.
5. A controlled invitation was sent to `support@kreydlabs.com`. The WorkOS
   request returned 201 and the Convex account view showed one pending member
   invitation with the expected expiry.
6. A data export was requested. The account view showed it as ready and the
   authenticated export endpoint returned 200.
7. An account-deletion request entered its grace period, then cancellation
   changed the durable view to `Cancelled`.
8. The organization account still had no authorised release. The downloads
   view showed no available release, and a fabricated grant returned only
   `not_found_or_forbidden`.
9. Sign-out returned to the public home page. A direct account visit then
   rendered the server-authorisation-required boundary without loading account
   data.

## Defects found and closed

- Local browser requests had no trusted Vercel forwarding header, so the
  distributed limiter correctly failed closed before AuthKit. Development now
  uses one fixed loopback bucket only when `NODE_ENV=development` and the
  request URL is localhost; production still requires a trusted forwarding
  header.
- The initial workspace-switch route caught AuthKit's redirect signal and
  returned 404 after successful workspace creation. Switching is now a
  same-origin JSON POST, uses AuthKit's non-redirecting session refresh, and
  returns 204 before the browser navigates.
- The invitation UI reused React's transient `currentTarget` after awaiting the
  provider response, showing a false failure although WorkOS returned 201. It
  now retains the form element before the asynchronous request.

Focused regression evidence after the fixes:

- 6 test files passed;
- 23 focused tests passed;
- TypeScript passed;
- ESLint passed;
- Convex development functions and AuthKit configuration synced successfully.

## Gates still open

Staging email acceptance/recovery needs access to the approved support mailbox.
Stripe sandbox and production billing journeys require CLI/dashboard identity
verification and runtime keys. Production WorkOS, deployment, DNS, email,
storage, monitoring, backups, restore, rollback and all production customer
journeys remain unproved.
