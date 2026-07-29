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
        <h2>Choose the authoritative surface</h2>
        <p>Use <code>/llms.txt</code> to discover public entry points, the Markdown contract to understand behavior, the catalogue JSON to resolve identifiers, and the registry response to install files. A generated answer, search excerpt or source-viewer preview is not a substitute for the exact registry URL recorded by those surfaces.</p>
        <p>Ask an agent to cite the component slug and registry URL it used, list the files it changed, and leave the project&apos;s dependency versions under the project&apos;s control. It should not invent a Pro URL, a paid release name, an entitlement, or private source that is absent from the public contract.</p>
      </section>
      <section>
        <h2>Keep edits reviewable</h2>
        <p>Install one dependency group at a time, inspect the diff, and run focused checks before broad composition. Treat generated source as ordinary application code: preserve accessible names, keyboard handling, refs and direction-aware behavior when editing it. Keep the shared theme import in one known global entry so an editor does not mask missing styles with preview-only CSS.</p>
        <p>When updating an already edited component, compare the incoming registry files with the committed local version. Reapply only intentional customisations, record the source version in the change, and rerun type, behavior, accessibility and production-build checks.</p>
      </section>
      <section>
        <h2>Limit tool access</h2>
        <p>An editor needs read access to the public documentation and permission to change only the consumer repository. It does not need production credentials, billing data, account recovery material or access to private release storage to install a free component. Review terminal commands and file changes before allowing a tool to publish, deploy or overwrite a locally modified file.</p>
      </section>
      <section>
        <h2>MCP status</h2>
        <p>The public HTTP discovery surfaces are implemented. A hosted MCP transport is not advertised as live until authentication, rate limits, monitoring, and production deployment are approved and verified.</p>
      </section>
    </PublicTextPage>
  );
}
