import type { Metadata } from "next";
import Link from "next/link";
import { PublicTextPage } from "../components/PublicTextPage";
import { commercialFacts, commercialPolicy } from "../data/commercial";

export const metadata: Metadata = {
  title: "Gummy UI support and issue-routing guidance",
  description:
    "Find Gummy UI installation guidance and the monitored email route, support scope and two-UK-business-day Pro first-response target.",
  alternates: { canonical: "/support" },
};

export default function SupportPage() {
  return (
    <PublicTextPage
      eyebrow="Find the right path"
      title="Start with evidence."
      lede="Installation and component questions should include the registry URL, framework, package manager, reproduction, expected behavior, and the relevant browser or assistive technology."
    >
      <section>
        <h2>Self-service</h2>
        <div className="public-page__grid">
          <article><h3>Installation</h3><p>Registry commands, dependency behavior, and clean-source expectations.</p><Link href="/registry">Open registry guidance</Link></article>
          <article><h3>Component behavior</h3><p>Semantics, keyboard contracts, dependencies, and editable source.</p><Link href="/components">Browse components</Link></article>
          <article><h3>Machine discovery</h3><p>Catalogue JSON and LLM-readable canonical links.</p><Link href="/mcp">Open agent guidance</Link></article>
        </div>
      </section>
      <section>
        <h2>Human support</h2>
        <p>Email <a href={commercialFacts.supportHref}>{commercialFacts.supportEmail}</a>. Include the order identifier when the question concerns paid access, a refund or a licence. Do not email passwords, recovery codes, card details or identity documents.</p>
        <p>Paid support aims to send a first reply within {commercialPolicy.supportFirstResponse}. This is a target, not an SLA. Free-product questions may also use the public GitHub repository.</p>
      </section>
      <section>
        <h2>What support covers</h2>
        <p>Support covers account access, paid-file delivery, confirmed defects, installation guidance, licence questions and billing/refund routing. It does not include custom development, project architecture, debugging unrelated customer code, guaranteed feature work, legal advice or accessibility certification.</p>
        <p>Security reports should use the same monitored address with <strong>Security report</strong> in the subject and follow the <Link href="/security">security policy</Link>.</p>
      </section>
      <section>
        <h2>How a request is handled</h2>
        <ol>
          <li>We classify the request as product support, account access, billing, privacy, security or licensing so it follows the correct process.</li>
          <li>For a product defect, we reproduce the smallest reported case against the named registry item and environment. A public URL or minimal code sample is more useful than a screenshot alone.</li>
          <li>For an account, order or refund question, we verify only the identifiers needed to find the record. Support will not ask for a password, recovery code or full payment-card number.</li>
          <li>We reply with a documented fix, workaround, status or request for specific missing evidence. Confirmed public-component defects can be tracked in the public repository; private account and billing details stay in email.</li>
        </ol>
        <p>Remove customer data, secret values and proprietary application code from reproductions. If an attachment is necessary, describe it first and wait for a safe route. The response target measures the first human reply, not a guaranteed resolution time.</p>
      </section>
    </PublicTextPage>
  );
}
