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
        <h2>Align the three paths</h2>
        <p>The alias in the application TypeScript configuration, the resolver alias in <code>vite.config</code>, and the aliases in <code>components.json</code> must describe the same source directory. Test the alias from both application code and a test file: an editor can appear satisfied while the production bundler or test runner uses a different resolver.</p>
        <p>Keep generated UI source inside the repository and import it locally. The registry endpoint is an installation input, not a browser runtime dependency, so a deployed application should continue to render if the catalogue site is unavailable.</p>
      </section>
      <section>
        <h2>Load styles in a stable order</h2>
        <p>Import the shared theme before the component stylesheet and application overrides. Loading the shared file more than once can make cascade order difficult to reason about; importing it from one root CSS entry makes light, dark, direction and reduced-motion behavior consistent across routes.</p>
        <p>If the component appears structurally correct but visually plain, inspect the built CSS request and computed custom properties before changing the component. If only one state is wrong, look for an application selector with greater specificity or a later source order.</p>
      </section>
      <section>
        <h2>Integrate and update</h2>
        <p>Render the installed component through the application&apos;s normal React root and providers. Preserve native labels, refs and keyboard events when wrapping it. For an update, inspect the registry diff before replacing editable source, retain intentional local modifications, and rerun the documented behavior checks instead of judging compatibility from a screenshot.</p>
      </section>
      <section>
        <h2>Verify</h2>
        <p>Run strict type checking and a production Vite build. The committed clean fixture repeats both checks after a real shadcn installation in an isolated temporary project.</p>
      </section>
    </PublicTextPage>
  );
}
