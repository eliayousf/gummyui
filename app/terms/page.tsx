import type { Metadata } from "next";
import { PublicTextPage } from "../components/PublicTextPage";

export const metadata: Metadata = {
  title: "Terms publication gate · Gummy UI",
  description: "Review why Gummy UI service terms, commercial terms, support, billing, cancellation, liability, data handling, and governing-law facts remain unpublished.",
  alternates: { canonical: "/terms" },
  robots: { index: false, follow: false },
};

export default function TermsPage() {
  return (
    <PublicTextPage
      eyebrow="Founder approval required"
      title="No service or commercial terms are published."
      lede="This local baseline is not a purchase offer or an active hosted service. Terms must describe the actual selling entity, product, services, support, data handling, licence, billing, cancellation, refund, liability, and governing-law position."
    >
      <section>
        <h2>Current public-source licence</h2>
        <p>The open-source component files are covered by the repository MIT licence. That licence is separate from future website terms and any future Pro commercial licence.</p>
      </section>
      <section>
        <h2>Publication gate</h2>
        <p>Service terms, commercial licence terms, refund policy, support commitments, prices, billing periods, tax handling, and account rules require founder approval and appropriate legal review before production launch.</p>
      </section>
    </PublicTextPage>
  );
}
