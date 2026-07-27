import type { Metadata } from "next";
import Link from "next/link";
import { PublicTextPage } from "../components/PublicTextPage";

export const metadata: Metadata = {
  title: "Commercial licence status · Gummy UI Pro",
  description: "Review the pre-launch status of Gummy UI Pro commercial-use rights, seats, client work, redistribution, updates, termination, and legal-approval requirements.",
  alternates: { canonical: "/commercial-license" },
};

export default function CommercialLicensePage() {
  return (
    <PublicTextPage
      eyebrow="Commercial approval gate"
      title="The Pro licence is not final."
      lede="Paid use rights, seats, client work, redistribution limits, update access, termination, and remedies remain founder and legal-review decisions."
    >
      <section>
        <h2>What is already clear</h2>
        <p>The public component source is separately available under the <Link href="/license">MIT licence</Link>. The private Pro repository is proprietary and will be distributed only under approved commercial terms with server-side entitlement.</p>
      </section>
      <section>
        <h2>What must be approved</h2>
        <p>The final text must match the chosen Solo, Team, and Organisation plan architecture, actual delivery and update periods, permitted users and projects, contractor and client use, prohibited redistribution, support reality, refund behavior, governing entity, jurisdiction, privacy practices, and account termination behavior.</p>
      </section>
    </PublicTextPage>
  );
}
