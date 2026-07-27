import type { Metadata } from "next";
import { PublicTextPage } from "../../components/PublicTextPage";

export const metadata: Metadata = {
  title: "Editor and AI setup · Gummy UI",
  description: "Configure editors and coding agents to use Gummy UI's public Markdown, JSON, registry, and source contracts safely without exposing private Pro source.",
  alternates: { canonical: "/docs/editor-setup" },
};

export default function EditorSetupPage() {
  return (
    <PublicTextPage
      eyebrow="Editor and agent setup"
      title="One public contract for humans and agents."
      lede="VS Code, Cursor, Claude Code, and other HTTP-capable tools can read the same source-grounded Markdown and catalogue endpoints. No private source is discoverable through them."
    >
      <section>
        <h2>Discovery sequence</h2>
        <ol>
          <li>Start with <a href="/llms.txt"><code>/llms.txt</code></a>.</li>
          <li>Read the <a href="/docs/markdown/catalogue.md">Markdown catalogue</a> and a component behavior contract.</li>
          <li>Install only the exact registry URL in that contract.</li>
          <li>Run the consumer&apos;s type, lint, behavior, and accessibility checks.</li>
        </ol>
      </section>
      <section>
        <h2>TypeScript setup</h2>
        <p>Use the workspace TypeScript version, strict mode, and the same import aliases declared in <code>components.json</code>. The delivered source remains editable and participates in your application&apos;s own compiler and test gates.</p>
      </section>
      <section>
        <h2>MCP status</h2>
        <p>The public HTTP discovery surfaces are implemented. A hosted MCP transport is not advertised as live until authentication, rate limits, monitoring, and production deployment are approved and verified.</p>
      </section>
    </PublicTextPage>
  );
}
