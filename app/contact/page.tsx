import type { Metadata } from "next";
import { PublicTextPage } from "../components/PublicTextPage";
import { commercialFacts } from "../data/commercial";

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
    </PublicTextPage>
  );
}
