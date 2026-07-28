import type { Metadata } from "next";
import Link from "next/link";
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
          Base UI is canonical. Components with an official Radix primitive
          also expose a separate Radix payload; choose one engine for that
          component. Combobox is clearly Base-only.
        </p>
        <ul className="public-page__link-list">
          {components.map((component) => (
            <li key={component.slug}>
              <Link href={`/components/${component.slug}`}>{component.name}</Link>
              <span>
                <a href={`/r/${component.registryName}.json`}>Base</a>
                {component.radixRegistryName ? (
                  <> · <a href={`/r/${component.radixRegistryName}.json`}>Radix</a></>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2>Machine-readable index</h2>
        <p><a href="/api/catalogue">Open the catalogue API</a> or read <a href="/llms.txt">llms.txt</a> for agent-friendly discovery.</p>
      </section>
    </PublicTextPage>
  );
}
