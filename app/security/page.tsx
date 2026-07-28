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
      lede="The open-source catalogue needs no customer database or payment runtime. Production hosting, identity, database, email, monitoring and backup adapters are connected behind server-only controls; paid source, credentials and customer data remain outside the public repository and build."
    >
      <section>
        <h2>Current controls</h2>
        <ul>
          <li>Public registry payloads are generated only from allowlisted public source paths.</li>
          <li>Paid Pro source must never enter the public repository or build output.</li>
          <li>Health output contains no secrets or private diagnostics.</li>
          <li>Type checking, dependency locking, lint, tests, and production builds are release gates.</li>
          <li>Production identity, database, email, monitoring and backup adapters are server-only. Checkout remains disabled until the restricted Stripe runtime key, release archive and complete customer journey pass.</li>
          <li>Protected-download and webhook contracts require current server authorization, signed and replay-resistant evidence, and verified provider events; their public routes return indistinguishable unavailable responses until paid launch gates pass.</li>
        </ul>
      </section>
      <section>
        <h2>Vulnerability reporting</h2>
        <p>Email <a href={commercialFacts.supportHref}>{commercialFacts.supportEmail}</a> with <strong>Security report</strong> in the subject. Do not submit sensitive vulnerability details through a public issue. Include affected URLs, impact and reproducible steps, but never include another person&apos;s data or a destructive proof.</p>
        <p>We aim to acknowledge a valid report within two UK business days. This is a target, not an SLA or a bug-bounty promise. Do not access unnecessary data, disrupt service, use social engineering or demand payment.</p>
      </section>
      <section>
        <h2>Commercial infrastructure</h2>
        <p>Vercel serves the production origin; WorkOS, Convex, Resend, Better Stack and Backblaze B2 are configured behind it. Stripe products, prices and signed webhooks exist, but checkout stays disabled while its least-privilege runtime key and the protected paid release remain gated. Configuration alone is not treated as evidence of a complete customer journey.</p>
      </section>
    </PublicTextPage>
  );
}
