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
        <h2>Prepare the consumer project</h2>
        <p>Check <code>components.json</code> before installing. Its component and utility aliases must resolve inside the application, and its CSS entry should identify the stylesheet that owns application-wide styles. If your project uses a <code>src</code> directory, keep the alias and registry destination aligned with that layout rather than moving generated files after every install.</p>
        <p>The shared Gummy theme defines material tokens and environmental behavior; the component stylesheet defines only that component&apos;s presentation. Load each generated stylesheet once in a stable global entry. Do not import CSS from <code>gummyui.dev</code> at runtime, because the installed files are the versioned source your project owns.</p>
      </section>
      <section>
        <h2>Compose across server and client boundaries</h2>
        <p>A Server Component may render a client component and pass serialisable content or configuration into it. Keep data fetching, authentication checks and sensitive server work outside the installed UI source. If you wrap a Gummy component, preserve its label relationships, keyboard behavior, forwarded ref and focus handling rather than replacing them with click-only containers.</p>
        <p>After composition, exercise the real route—not only an isolated preview. Check loading, empty, error and disabled states, then navigate away and back to catch hydration, focus-restoration or layout problems.</p>
      </section>
      <section>
        <h2>Update safely</h2>
        <p>Registry installation writes editable files, so a later install can conflict with changes you made locally. Review the proposed diff before accepting an overwrite. Carry intentional local changes forward, re-run the component&apos;s behavior contract, and commit the installed source with the application so production does not depend on a network fetch.</p>
      </section>
      <section>
        <h2>Verify</h2>
        <p>Run your project&apos;s TypeScript, lint, behavior, accessibility, and production-build checks after installation. Gummy UI&apos;s release gate performs the independent typecheck and build in a fresh temporary Next.js consumer.</p>
      </section>
    </PublicTextPage>
  );
}
