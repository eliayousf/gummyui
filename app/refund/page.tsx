import type { Metadata } from "next";
import { PublicTextPage } from "../components/PublicTextPage";

export const metadata: Metadata = {
  title: "Refund policy status · Gummy UI",
  description: "Review Gummy UI refund eligibility, statutory rights, access revocation, request handling, and the approvals required before commerce opens.",
  alternates: { canonical: "/refund" },
};

export default function RefundPage() {
  return (
    <PublicTextPage
      eyebrow="Commercial approval gate"
      title="Refund terms are not yet approved."
      lede="Gummy UI does not currently sell paid products, collect payment, or promise a refund period."
    >
      <section>
        <h2>Before commerce opens</h2>
        <p>The founder must approve the selling entity, product delivery model, statutory and contractual rights, refund eligibility, request route, decision owner, processing behavior, and interaction with access revocation. Appropriate legal and accounting review is required before final terms are represented as approved.</p>
      </section>
    </PublicTextPage>
  );
}
