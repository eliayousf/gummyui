import type { Metadata } from "next";
import Link from "next/link";
import { PublicTextPage } from "../components/PublicTextPage";
import { commercialFacts } from "../data/commercial";

export const metadata: Metadata = {
  title: "Gummy UI terms of sale and website use",
  description:
    "Read the Gummy UI terms covering the website, accounts, subscriptions and lifetime digital purchases, delivery, taxes, support, liability and governing law.",
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <PublicTextPage
      eyebrow={`Terms v1.0 · effective ${commercialFacts.effectiveDate}`}
      title="Terms for the website and paid product."
      lede={`${commercialFacts.legalName}, trading as ${commercialFacts.tradingName}, operates gummyui.dev and licenses Gummy UI Pro. These terms apply when you use the website, create an account or place an order.`}
    >
      <section>
        <h2>1. Who we are</h2>
        <p>{commercialFacts.legalName} is a private limited company registered in the United Kingdom under company number {commercialFacts.companyNumber}. Our registered office is {commercialFacts.registeredAddress}. We are not VAT registered.</p>
        <p>Contact us at <a href={commercialFacts.supportHref}>{commercialFacts.supportEmail}</a>.</p>
      </section>
      <section>
        <h2>2. Website and account use</h2>
        <p>You must be at least 18 years old, or the age needed to enter this contract where you live, and able to bind the person or organisation named in an order. Information you give us must be accurate and you must protect your sign-in methods. Tell us promptly if you believe an account or paid file has been misused.</p>
        <p>You must not interfere with the website, bypass access controls, scrape private surfaces, probe systems without written authorisation, upload malware, impersonate another person or use the service unlawfully.</p>
      </section>
      <section>
        <h2>3. Orders, prices and payment</h2>
        <p>Paid plans are monthly subscriptions, yearly subscriptions or one-time lifetime purchases in USD. The price, billing period, included products, seat allowance and licence shown at checkout form part of your order. For an eligible Managed Payments order, Link acts as merchant of record; Stripe may display a local currency, collect required taxes, perform fraud checks and send payment receipts, invoices and subscription notices.</p>
        <p>Customers manage Managed Payments orders, payment methods and subscription cancellation through Link. Gummy UI continues to provide product access and product support at <a href={commercialFacts.supportHref}>{commercialFacts.supportEmail}</a>.</p>
        <p>Monthly and yearly plans renew automatically until cancelled. You may cancel before the next renewal; access continues until the end of the paid period. Except where the refund policy or mandatory law applies, cancelling does not refund the current period.</p>
        <p>An order is accepted only when payment is confirmed and we send or make available the order confirmation. We may reject or refund an order affected by an obvious pricing error, sanctions restriction, fraud risk, unsupported country or product unavailability.</p>
      </section>
      <section>
        <h2>4. Digital delivery and cancellation</h2>
        <p>Paid products are supplied digitally through an entitlement-protected account. Before immediate delivery during a statutory cancellation period, a consumer must expressly request immediate supply and acknowledge that the cancellation right may be lost once supply begins. If that acknowledgement is not given, delivery will wait until the applicable cancellation period ends.</p>
        <p>Our additional goodwill refund is described in the <Link href="/refund">refund policy</Link>. It does not reduce rights for faulty, misdescribed or unavailable digital content.</p>
      </section>
      <section>
        <h2>5. Licences and seats</h2>
        <p>The public component repository is licensed under the <Link href="/license">MIT licence</Link>. Paid blocks, templates and design-kit files are governed by the <Link href="/commercial-license">Gummy UI Pro commercial licence</Link>. Buying files does not transfer their intellectual-property ownership.</p>
        <p>Individual plans cover one named user. Team plans cover up to five named users. Organization plans cover unlimited named users in one purchasing organisation. Account sharing, public paid source and redistribution outside the commercial licence are prohibited.</p>
      </section>
      <section>
        <h2>6. Updates, availability and support</h2>
        <p>Monthly and yearly plans require an active subscription for new downloads, future updates and paid support. A lifetime purchase includes those benefits for the commercial lifetime of Gummy UI Pro. We may improve, replace or discontinue features and delivery methods, but a change does not remove the continuing licence to versions already lawfully delivered for use under the commercial licence.</p>
        <p>Support aims to send a first reply within two UK business days. It is not an SLA and does not include custom development or a guarantee that an issue can be resolved.</p>
      </section>
      <section>
        <h2>7. Suspension and ending access</h2>
        <p>We may suspend an account or download while investigating fraud, security risk, chargeback, licence breach or unlawful use. We may end access for a material breach, normally after giving 14 days to fix a breach that can reasonably be fixed. Ending account access does not remove a valid continuing licence to files already delivered unless the purchase is refunded, reversed or the licence itself ends for breach.</p>
      </section>
      <section>
        <h2>8. Consumer rights, warranties and liability</h2>
        <p>Nothing in these terms excludes a consumer right or other liability that cannot lawfully be excluded. We will provide digital content as described and exercise reasonable care and skill in services we agree to provide.</p>
        <p>Subject to mandatory law, the website and public open-source material are provided without warranties. Nothing limits liability for fraud, fraudulent misrepresentation, death or personal injury caused by negligence. Otherwise, to the extent the law permits, our total liability connected with a paid order is limited to the amount paid for that order and we are not liable for indirect or consequential loss.</p>
      </section>
      <section>
        <h2>9. Privacy, changes and law</h2>
        <p>The <Link href="/privacy">privacy notice</Link> explains how personal data is used. We may update these terms for legal, security or product reasons. Material changes apply prospectively and will be brought to account holders&apos; attention; they do not rewrite a completed lifetime purchase or a subscription period already paid for unfairly.</p>
        <p>These terms are governed by the law of England and Wales. Courts in England and Wales have jurisdiction, while consumers keep mandatory local rights and any local court access required by applicable law.</p>
      </section>
    </PublicTextPage>
  );
}
