import type { Metadata } from "next";
import { PublicTextPage } from "../components/PublicTextPage";

export const metadata: Metadata = {
  title: "Gummy UI contact and support status",
  description: "Review Gummy UI's current pre-launch contact, support, privacy, and security-channel status, including the monitored operations required before launch.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <PublicTextPage
      eyebrow="Pre-launch contact status"
      title="No unattended inbox pretending to be support."
      lede="A monitored contact destination, response owner, and data-handling process must be approved before this site launches."
    >
      <section>
        <h2>Current status</h2>
        <p>Gummy UI is a local pre-launch project. It does not currently accept sales, support, press, partnership, privacy, or vulnerability-report submissions, and it does not collect contact-form data.</p>
      </section>
      <section>
        <h2>Launch requirement</h2>
        <p>The production contact surface will name the actual monitored destination, responsible owner, purpose, retention behavior, and realistic response expectation after those operational facts are approved and verified.</p>
      </section>
    </PublicTextPage>
  );
}
