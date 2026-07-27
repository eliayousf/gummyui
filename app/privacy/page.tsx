import type { Metadata } from "next";
import { PublicTextPage } from "../components/PublicTextPage";

export const metadata: Metadata = {
  title: "Gummy UI privacy and data-processing status",
  description: "Review Gummy UI browser-local data behavior and the controller, provider, consent, retention, transfer, rights, and deletion facts required before launch.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <PublicTextPage
      eyebrow="Pre-launch data status"
      title="No customer system is active."
      lede="This local baseline does not operate accounts, checkout, analytics, marketing consent, support intake, or production monitoring. A production privacy notice must describe the services actually selected and configured."
    >
      <section>
        <h2>Local behavior</h2>
        <p>The theme choice is stored in browser local storage. The theme builder also remains browser-local. Public catalogue and registry requests require no account and this baseline creates no customer record.</p>
      </section>
      <section>
        <h2>Before production</h2>
        <p>Data controller identity, service providers, purposes, lawful bases, cookie and consent behavior, retention, international transfers, rights requests, security contact, account deletion, and purchase records require founder approval plus legal review.</p>
      </section>
    </PublicTextPage>
  );
}
