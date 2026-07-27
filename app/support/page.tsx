import type { Metadata } from "next";
import Link from "next/link";
import { PublicTextPage } from "../components/PublicTextPage";

export const metadata: Metadata = {
  title: "Gummy UI support and issue-routing guidance",
  description: "Find installation, component behavior, registry, and machine-discovery guidance, plus the honest pre-launch status of monitored human support.",
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
        <h2>Human support status</h2>
        <p>The public repository and monitored support channel have not been launched, and no response-time promise is published. Those details require an accountable owner before deployment. Pro support entitlements cannot be stated until pricing and commercial licence terms are approved.</p>
      </section>
    </PublicTextPage>
  );
}
