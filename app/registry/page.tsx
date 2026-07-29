import type { Metadata } from "next";
import { PublicTextPage } from "../components/PublicTextPage";
import { componentCount, components } from "../data/catalogue";

export const metadata: Metadata = {
  title: "Gummy UI component registry · Editable React source",
  description: `Install ${componentCount} editable Gummy UI React and TypeScript components through shadcn-compatible registry payloads with explicit styles and dependencies.`,
  alternates: { canonical: "/registry" },
};

export default function RegistryPage() {
  return (
    <PublicTextPage
      eyebrow="shadcn-compatible source registry"
      title="Install source. Keep control."
      lede="Every public component arrives as readable TypeScript and CSS in your application. Dependencies are explicit; shared material is resolved by the registry."
    >
      <section>
        <h2>Start with the system base</h2>
        <p>Install the semantic theme before composing a custom selection of components.</p>
        <pre><code>npx shadcn@latest add https://gummyui.dev/r/gummy-base.json</code></pre>
      </section>
      <section>
        <h2>Package-manager forms</h2>
        <div className="public-page__grid">
          <article><h3>npm</h3><code>npx shadcn@latest add [url]</code></article>
          <article><h3>pnpm</h3><code>pnpm dlx shadcn@latest add [url]</code></article>
          <article><h3>Yarn</h3><code>yarn dlx shadcn@latest add [url]</code></article>
          <article><h3>Bun</h3><code>bunx shadcn@latest add [url]</code></article>
        </div>
      </section>
      <section>
        <h2>Public categories ({componentCount})</h2>
        <p>
          Base UI is canonical, so every component has one direct install
          payload below. Component pages and the machine-readable index also
          expose separate Radix payloads where an official primitive exists;
          choose one engine for that component. Combobox is clearly Base-only.
        </p>
        <ul className="public-page__link-list">
          {components.map((component) => (
            <li key={component.slug}>
              <strong>{component.name}</strong>
              <span>
                <a
                  href={`/r/${component.registryName}.json`}
                >
                  {component.name} Base registry
                </a>
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2>Machine-readable index</h2>
        <p>
          <a href="/api/catalogue">Open the catalogue API</a> or read{" "}
          <code>/llms.txt</code> for agent-friendly discovery.
        </p>
      </section>
      <section>
        <h2>Verify the installed result</h2>
        <p>
          Review every file the installer proposes before accepting it, then
          run your application&apos;s type, accessibility, and production-build
          checks. Keep the shared theme import singular, preserve visible
          labels and keyboard behavior, and test light, dark, reduced-motion,
          responsive, and RTL contexts that your product supports.
        </p>
        <p>
          Registry payloads are editable source, not a hosted runtime
          dependency. Updates never replace local changes automatically, so
          compare a newer payload deliberately and retain the application
          decisions that belong to your product.
        </p>
      </section>
    </PublicTextPage>
  );
}
