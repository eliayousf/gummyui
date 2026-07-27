import type { Metadata } from "next";
import { PublicTextPage } from "../components/PublicTextPage";

export const metadata: Metadata = {
  title: "Pricing approval gate · Gummy UI",
  description: "Gummy UI Pro pricing and commercial terms are not yet approved or published.",
  alternates: { canonical: "/pricing" },
  robots: { index: false, follow: false },
};

export default function PricingPage() {
  return (
    <PublicTextPage
      eyebrow="Founder approval required"
      title="No Pro price is published."
      lede="Plan architecture, plan names, amounts, billing intervals, seats, discounts, permitted use, update periods, support, refunds, and tax handling must be approved as one commercial system."
    >
      <section>
        <h2>Why this page is gated</h2>
        <p>Publishing an amount before checkout, entitlement, licence, invoicing, refunds, selling-entity details, and support operations agree would create a promise the product cannot yet keep.</p>
      </section>
      <section>
        <h2>Current public product</h2>
        <p>The 57-component catalogue is available as MIT-licensed source. Pro specifications are not a purchase offer and no checkout is active.</p>
      </section>
    </PublicTextPage>
  );
}
