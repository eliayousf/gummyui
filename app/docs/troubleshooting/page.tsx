import type { Metadata } from "next";
import { PublicTextPage } from "../../components/PublicTextPage";

export const metadata: Metadata = {
  title: "Troubleshooting Gummy UI installation",
  description: "Resolve Gummy UI registry URLs, generated styles, Base UI dependencies, theme, RTL, reduced-motion, import-alias, and editable-source viewing issues.",
  alternates: { canonical: "/docs/troubleshooting" },
};

export default function TroubleshootingPage() {
  const issues = [
    ["Registry item returns 404", "Use the exact registryUrl from the catalogue or component contract. Registry names use gummy-{slug}."],
    ["Component has no Gummy material", "Import the generated shared theme and component style files once from the global stylesheet or root layout."],
    ["Base UI cannot be resolved", "Install through the registry command so the declared @base-ui/react dependency is installed with the editable source."],
    ["Dark or RTL behavior is missing", "Set data-theme=\"dark\" for the dark environment and a real dir boundary for bidirectional layout."],
    ["Motion remains enabled", "Check the generated styles are loaded and no application rule overrides prefers-reduced-motion: reduce."],
    ["Source viewer cannot load", "Open the public registry URL directly; its JSON contains the same editable public files used by the viewer."],
  ] as const;

  return (
    <PublicTextPage
      eyebrow="Troubleshooting"
      title="Trace the contract, not a screenshot."
      lede="Most installation issues reduce to an incorrect registry URL, missing generated CSS, a mismatched import alias, or an application override."
    >
      {issues.map(([title, copy]) => (
        <section key={title}>
          <h2>{title}</h2>
          <p>{copy}</p>
        </section>
      ))}
      <section>
        <h2>Use a repeatable diagnostic sequence</h2>
        <ol>
          <li>Open the registry URL from the component contract and confirm the response names the expected item.</li>
          <li>Inspect the installed file paths and imports. Check that the TypeScript alias, bundler alias and <code>components.json</code> agree.</li>
          <li>Confirm the shared theme loads before the component stylesheet and that application overrides load after both.</li>
          <li>Reproduce the problem with the smallest component state in a clean route. Remove surrounding layout and providers one at a time rather than changing the installed semantics.</li>
          <li>Run type checking and the production build, then verify keyboard, focus, zoom, direction and reduced-motion behavior in the browser where the issue occurs.</li>
        </ol>
        <p>Compare behavior with the published component contract rather than trying to match a screenshot pixel for pixel. Fonts, application tokens and viewport conditions can change appearance without changing the required interaction.</p>
      </section>
      <section>
        <h2>Prepare a useful support report</h2>
        <p>Include the exact registry URL, installed item name, framework and version, package manager, browser, relevant assistive technology, reproduction steps, expected behavior and actual behavior. Paste the smallest safe error excerpt. Remove access tokens, environment variables, customer data, proprietary source and full build logs that may contain local paths or secrets.</p>
        <p>If the clean reproduction still fails, send those details through the <a href="/support">support route</a>. If the clean version works, add your application layers back until the responsible alias, provider, stylesheet or override is identified.</p>
      </section>
    </PublicTextPage>
  );
}
