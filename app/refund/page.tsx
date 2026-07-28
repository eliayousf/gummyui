import type { Metadata } from "next";
import Link from "next/link";
import { PublicTextPage } from "../components/PublicTextPage";
import { commercialFacts, commercialPolicy } from "../data/commercial";

export const metadata: Metadata = {
  title: "Gummy UI refund policy",
  description:
    "Read the 14-day unopened-digital-files refund policy, statutory-rights protection, request process, access revocation and payment-provider handling.",
  alternates: { canonical: "/refund" },
  robots: { index: true, follow: true },
};

export default function RefundPage() {
  return (
    <PublicTextPage
      eyebrow={`Refund Policy v1.0 · effective ${commercialFacts.effectiveDate}`}
      title="Fourteen days, before paid files are accessed."
      lede={`You may request our goodwill refund within ${commercialPolicy.refundDays} days of purchase only if no paid file from that order has been accessed. Your mandatory legal rights are separate and remain unchanged.`}
    >
      <section>
        <h2>Goodwill eligibility</h2>
        <p>Send the request from the purchasing email address to <a href={commercialFacts.supportHref}>{commercialFacts.supportEmail}</a> within 14 calendar days of purchase and include the order identifier.</p>
        <p>A paid file is “accessed” when an authorised account views, copies, downloads or otherwise retrieves any paid block source, template archive, design-kit file or paid release from the order. For a subscription renewal, the relevant period starts when that renewal is charged. Previewing public source-free images or reading public documentation does not count as paid-file access.</p>
      </section>
      <section>
        <h2>When the goodwill refund does not apply</h2>
        <p>The change-of-mind goodwill refund is not available after any paid file has been accessed, after 14 days, for a previously refunded product, or where there is evidence of account, payment or refund abuse.</p>
        <p>This limitation does not remove any remedy required by law or our responsibility to correct a duplicate, fraudulent or provider-error charge.</p>
      </section>
      <section>
        <h2>Faulty or misdescribed digital content</h2>
        <p>If paid content is faulty, unavailable, materially different from its description or otherwise covered by mandatory consumer law, contact us with enough detail to investigate. Statutory repair, replacement, price-reduction or refund rights apply regardless of this goodwill policy.</p>
      </section>
      <section>
        <h2>What happens after approval</h2>
        <p>We submit an approved refund through the payment provider. The provider controls the time taken for funds to appear. We will confirm the decision and any provider reference by email.</p>
        <p>A full refund ends the related paid licence and entitlement. You must stop using and delete refunded paid files and copies, except where applicable law provides otherwise. A partial correction affects only the part stated in the confirmation.</p>
      </section>
      <section>
        <h2>Subscription cancellation</h2>
        <p>You may cancel a monthly or yearly subscription before its next renewal. Cancellation stops the next recurring charge and access continues until the end of the paid period. It does not automatically refund the current period; the goodwill and mandatory-rights rules above still apply.</p>
      </section>
      <section>
        <h2>Immediate digital delivery</h2>
        <p>At checkout, a consumer who wants paid files immediately must expressly request supply during the cancellation period and acknowledge that the statutory cancellation right may be lost once supply begins. If immediate supply does not begin, statutory cancellation rights continue as applicable.</p>
        <p>See the <Link href="/terms">terms of sale</Link> and <Link href="/commercial-license">commercial licence</Link> for the full contract.</p>
      </section>
    </PublicTextPage>
  );
}
