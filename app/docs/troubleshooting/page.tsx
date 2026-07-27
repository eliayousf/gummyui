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
    </PublicTextPage>
  );
}
