import type { Metadata } from "next";
import { PublicTextPage } from "../components/PublicTextPage";
import { commercialFacts } from "../data/commercial";

export const metadata: Metadata = {
  title: "Gummy UI security and disclosure status",
  description: "Review the Gummy UI public-source boundary, fail-closed commerce contracts, vulnerability-reporting gate, and security controls required for release.",
  alternates: { canonical: "/security" },
};

export default function SecurityPage() {
  return (
    <PublicTextPage
      eyebrow="Public-source security"
      title="Small surface. Explicit boundary."
      lede="The open-source catalogue needs no customer database, account backend, or payment runtime. Provider-neutral account and commerce contracts are implemented locally, but production services, paid source, credentials, and customer data remain outside this public application baseline."
    >
      <section>
        <h2>Current controls</h2>
        <ul>
          <li>Public registry payloads are generated only from allowlisted public source paths.</li>
          <li>Paid Pro source must never enter the public repository or build output.</li>
          <li>Health output contains no secrets or private diagnostics.</li>
          <li>Type checking, dependency locking, lint, tests, and production builds are release gates.</li>
          <li>Account and checkout information architecture is present but fails closed while no approved identity, billing, storage, or email adapter is configured.</li>
          <li>Protected-download and webhook contracts require current server authorization, signed and replay-resistant evidence, and verified provider events; their public routes return indistinguishable unavailable responses until production adapters are approved and connected.</li>
        </ul>
      </section>
      <section>
        <h2>Vulnerability reporting</h2>
        <p>Email <a href={commercialFacts.supportHref}>{commercialFacts.supportEmail}</a> with <strong>Security report</strong> in the subject. Do not submit sensitive vulnerability details through a public issue. Include affected URLs, impact and reproducible steps, but never include another person&apos;s data or a destructive proof.</p>
        <p>We aim to acknowledge a valid report within two UK business days. This is a target, not an SLA or a bug-bounty promise. Do not access unnecessary data, disrupt service, use social engineering or demand payment.</p>
      </section>
      <section>
        <h2>Commercial infrastructure</h2>
        <p>Provider-neutral schemas, authorization rules, email intents, audit records, and backup-verification contracts are implemented and tested locally. Convex is connected to an EU development deployment; WorkOS, Stripe Managed Payments, Resend, Better Stack, Backblaze and Vercel are approved but not yet fully production-connected. Local and development contracts are not evidence that every production control is active.</p>
      </section>
    </PublicTextPage>
  );
}
