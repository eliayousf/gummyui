import type { Metadata } from "next";
import Link from "next/link";
import { PublicTextPage } from "../components/PublicTextPage";
import { commercialFacts, commercialPolicy } from "../data/commercial";

export const metadata: Metadata = {
  title: "Contact Gummy UI support and licensing",
  description:
    "Contact the monitored Kreyd Labs address for Gummy UI support, privacy, security, billing, refund and licensing questions during UK business days.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <PublicTextPage
      eyebrow="One monitored route"
      title="Contact Gummy UI."
      lede={`Email ${commercialFacts.supportEmail} for support, privacy, security, billing, refunds and licensing. Messages are handled by the founder during UK business days.`}
    >
      <section>
        <h2>Email</h2>
        <p><a href={commercialFacts.supportHref}>{commercialFacts.supportEmail}</a></p>
        <p>Use a clear subject such as <strong>Support</strong>, <strong>Privacy request</strong>, <strong>Security report</strong>, <strong>Refund request</strong> or <strong>Licence question</strong>. Include an order identifier where relevant, but never send a password, recovery code, full card number or private key.</p>
      </section>
      <section>
        <h2>Company</h2>
        <p>{commercialFacts.legalName}, trading as {commercialFacts.tradingName}. Company number {commercialFacts.companyNumber}. Registered office: {commercialFacts.registeredAddress}.</p>
        <p>This site does not use a public contact form. Email records are handled under the <a href="/privacy">privacy notice</a>.</p>
      </section>
      <section>
        <h2>Route your request</h2>
        <div className="public-page__grid">
          <article>
            <h3>Product support</h3>
            <p>Name the registry item, framework, package manager and browser. Include the exact command, expected result and smallest reproduction that does not contain customer data or secrets.</p>
          </article>
          <article>
            <h3>Billing, refund or licence</h3>
            <p>Include the order or invoice identifier and the account email, but no card details. State whether the question concerns access, a team seat, cancellation, renewal, refund eligibility or permitted use.</p>
          </article>
          <article>
            <h3>Privacy</h3>
            <p>State the right you want to exercise and the account or order email involved. We may ask for proportionate evidence before disclosing, correcting, exporting or deleting personal data.</p>
          </article>
          <article>
            <h3>Security</h3>
            <p>Use the subject <strong>Security report</strong>. Describe the affected URL, impact and safe reproduction steps without accessing another person&apos;s data or sending exploit code before a secure route is agreed.</p>
          </article>
        </div>
      </section>
      <section>
        <h2>What to expect</h2>
        <p>We aim to send the first human reply within {commercialPolicy.supportFirstResponse}. This is a target, not an SLA, and resolution time depends on the request and the evidence available. Messages received outside UK business days are reviewed on the next business day.</p>
        <p>Keep the original email thread when adding evidence or asking for an update. That preserves the request history and reduces unnecessary identity checks. If the account email is unavailable, explain that constraint without sending identity documents until a proportionate verification route is agreed.</p>
        <p>Product questions can often be resolved faster through the <Link href="/support">support guide</Link> and <Link href="/docs/troubleshooting">troubleshooting checklist</Link>. Privacy rights, retention and identity checks are explained in the <Link href="/privacy">privacy notice</Link>; vulnerability-reporting boundaries are on the <Link href="/security">security page</Link>.</p>
      </section>
    </PublicTextPage>
  );
}
