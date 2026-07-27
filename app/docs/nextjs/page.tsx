import type { Metadata } from "next";
import { PublicTextPage } from "../../components/PublicTextPage";

export const metadata: Metadata = {
  title: "Install Gummy UI in Next.js App Router",
  description: "Install editable Gummy UI React and TypeScript source into a clean Next.js App Router project, configure its shared styles, and verify the production build.",
  alternates: { canonical: "/docs/nextjs" },
};

export default function NextJsGuidePage() {
  return (
    <PublicTextPage
      eyebrow="Framework guide"
      title="Next.js: editable source, clean boundaries."
      lede="The registry writes React, TypeScript, and CSS into your App Router project. The clean fixture proves the consumer owns its dependencies and never imports from the Gummy UI website."
    >
      <section>
        <h2>Install</h2>
        <pre><code>npx shadcn@latest add https://gummyui.dev/r/gummy-base.json https://gummyui.dev/r/gummy-button.json</code></pre>
        <p>Import <code>@/components/gummy-theme.css</code> and <code>@/components/gummy-button.css</code> from the root layout or global stylesheet. Import the component from <code>@/components/ui/gummy-button</code>.</p>
      </section>
      <section>
        <h2>App Router behavior</h2>
        <p>Interactive registry source declares its own client boundary where needed. Keep Server Components as the default in your application and move only stateful composition behind a client boundary.</p>
      </section>
      <section>
        <h2>Verify</h2>
        <p>Run your project&apos;s TypeScript, lint, behavior, accessibility, and production-build checks after installation. Gummy UI&apos;s release gate performs the independent typecheck and build in a fresh temporary Next.js consumer.</p>
      </section>
    </PublicTextPage>
  );
}
