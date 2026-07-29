import type { Metadata } from "next";
import { PublicTextPage } from "../components/PublicTextPage";

export const metadata: Metadata = {
  title: "AI and MCP discovery · Gummy UI",
  description: "Discover the machine-readable Gummy UI catalogue, registry payloads, LLM index, health endpoint, agent installation policy, and hosted MCP transport status.",
  alternates: { canonical: "/mcp" },
};

export default function McpPage() {
  return (
    <PublicTextPage
      eyebrow="AI and agent discovery"
      title="A catalogue agents can inspect safely."
      lede="Public metadata exposes names, semantics, keyboard contracts, dependencies, docs, and registry URLs without exposing any paid source."
    >
      <section>
        <h2>Discovery endpoints</h2>
        <div className="public-page__grid">
          <article><h3>Catalogue JSON</h3><p>All 57 definitions from the same manifest that builds the website.</p><a href="/api/catalogue">/api/catalogue</a></article>
          <article><h3>LLM index</h3><p>Concise agent-readable descriptions and canonical links.</p><a href="/llms.txt">/llms.txt</a></article>
          <article><h3>Registry payload</h3><p>Editable source plus explicit package and registry dependencies.</p><code>/r/gummy-button.json</code></article>
          <article><h3>Health</h3><p>Public service and catalogue-count signal without private diagnostics.</p><a href="/api/health">/api/health</a></article>
        </div>
      </section>
      <section>
        <h2>Agent installation policy</h2>
        <ol>
          <li>Read the component detail and behavior contract.</li>
          <li>Install through the canonical registry URL.</li>
          <li>Keep the copied source editable in the consuming repository.</li>
          <li>Preserve native, Base UI, or Radix UI semantics while changing visual tokens.</li>
          <li>Never infer or request paid source from public preview metadata.</li>
        </ol>
      </section>
      <section>
        <h2>MCP transport status</h2>
        <p>The public HTTP catalogue and registry contracts are implemented. A hosted MCP transport remains a release gate: it will not be advertised as live until authentication, rate limits, monitoring, and production deployment are approved.</p>
      </section>
      <section>
        <h2>Safe automated consumption</h2>
        <p>
          An agent should treat catalogue metadata as a discovery aid and the
          registry response as code proposed for the consuming repository.
          Before writing files, it should identify the requested component,
          show the destination paths, resolve declared dependencies, and allow
          existing local changes to take priority. After installation, normal
          formatting, type, interaction, accessibility, and production-build
          checks still apply; a successful HTTP response is not verification of
          the resulting product.
        </p>
        <p>
          Registry source is public and MIT licensed, but prompts, logs, build
          output, or provider calls must not be used to reconstruct private Pro
          assets. Public Pro metadata can answer whether an item is specified,
          implemented, verified, or release-ready. It cannot grant an
          entitlement or name a private path, archive, test, or source file.
        </p>
      </section>
      <section>
        <h2>Reliability and versioning</h2>
        <p>
          Consumers should pin reviewed source in their own version control
          rather than depending on this site at application runtime. If a
          future hosted transport is released, its authentication and rate
          limits will protect service availability, not change the licence or
          make agent output trustworthy by default. Health responses remain
          intentionally narrow so monitoring can detect service state without
          exposing credentials, customer records, or private diagnostics.
        </p>
      </section>
    </PublicTextPage>
  );
}
