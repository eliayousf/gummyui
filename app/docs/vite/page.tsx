import type { Metadata } from "next";
import { PublicTextPage } from "../../components/PublicTextPage";

export const metadata: Metadata = {
  title: "Install Gummy UI in React and Vite",
  description: "Install editable Gummy UI React and TypeScript source into a clean Vite project, align registry aliases and shared styles, then verify a production build.",
  alternates: { canonical: "/docs/vite" },
};

export default function ViteGuidePage() {
  return (
    <PublicTextPage
      eyebrow="Framework guide"
      title="Vite: source that belongs to your app."
      lede="Configure a React and TypeScript project with a shadcn components manifest and an @ alias, then install the same public registry payloads used by the Next.js path."
    >
      <section>
        <h2>Install</h2>
        <pre><code>npx shadcn@latest add https://gummyui.dev/r/gummy-base.json https://gummyui.dev/r/gummy-button.json</code></pre>
        <p>Import the generated <code>components/gummy-theme.css</code> and component stylesheet from <code>src/index.css</code>. Import the component from <code>../components/ui/gummy-button</code> or your configured alias.</p>
      </section>
      <section>
        <h2>Required alias</h2>
        <p>Keep the <code>@/*</code> TypeScript alias and matching Vite resolution aligned with <code>components.json</code>. This lets the registry place public UI source predictably without reaching back into this website.</p>
      </section>
      <section>
        <h2>Verify</h2>
        <p>Run strict type checking and a production Vite build. The committed clean fixture repeats both checks after a real shadcn installation in an isolated temporary project.</p>
      </section>
    </PublicTextPage>
  );
}
