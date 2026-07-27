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
          <li>Preserve native or Base UI semantics while changing visual tokens.</li>
          <li>Never infer or request paid source from public preview metadata.</li>
        </ol>
      </section>
      <section>
        <h2>MCP transport status</h2>
        <p>The public HTTP catalogue and registry contracts are implemented. A hosted MCP transport remains a release gate: it will not be advertised as live until authentication, rate limits, monitoring, and production deployment are approved.</p>
      </section>
    </PublicTextPage>
  );
}
