import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ComponentInspector } from "../../components/ComponentInspector";
import { RadixComponentInspector } from "../../components/RadixComponentInspector";
import { RegistrySourceViewer, CopyTextButton } from "../../components/RegistrySourceViewer";
import { SiteFooter, SiteHeader } from "../../components/SiteChrome";
import {
  catalogueGroups,
  components,
  getComponent,
} from "../../data/catalogue";
import { getComponentApi } from "../../data/component-api";

export function generateStaticParams() {
  return components.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const component = getComponent(slug);
  if (!component) return {};
  const standardDescription = `${component.description} Editable MIT-licensed TypeScript source with documented semantics and keyboard behavior.`;
  const compactDescription = `${component.description} MIT-licensed TypeScript source, semantics, keyboard behavior, and usage.`;
  return {
    title: `${component.name} React component · Gummy UI`,
    description:
      standardDescription.length <= 160
        ? standardDescription
        : compactDescription,
    alternates: { canonical: `/components/${component.slug}` },
  };
}

export default async function ComponentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const component = getComponent(slug);
  if (!component) notFound();
  const api = getComponentApi(component.slug);
  if (!api) notFound();
  const group = catalogueGroups.find(({ id }) => id === component.group)!;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: `Gummy ${component.name}`,
    description: component.description,
    programmingLanguage: ["TypeScript", "React"],
    codeRepository: "https://github.com/gummyui/gummyui",
    license: "https://opensource.org/license/mit",
    isPartOf: { "@type": "SoftwareApplication", name: "Gummy UI" },
  };
  return (
    <>
      <a className="skip-link" href="#component-detail">Skip to component documentation</a>
      <SiteHeader />
      <main id="component-detail" className="component-detail">
        <nav className="component-detail__breadcrumb" aria-label="Breadcrumb">
          <ol>
            <li><Link href="/components">Components</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">{component.name}</li>
          </ol>
        </nav>
        <header className="component-detail__hero">
          <div>
            <p className="showcase-kicker">{group.label} · stable · MIT</p>
            <h1>{component.name}</h1>
            <p>{component.description}</p>
          </div>
          <span className="component-detail__mark" aria-hidden="true">{component.name.slice(0, 1)}</span>
        </header>
        <section className="component-install" aria-labelledby="install-title">
          <div>
            <p className="showcase-kicker">Install editable source</p>
            <h2 id="install-title">Add {component.name}</h2>
          </div>
          <div className="component-install__options">
            <div className="component-install__command">
              <span>Base UI / canonical</span>
              <code tabIndex={0}>{component.installCommand}</code>
              <CopyTextButton value={component.installCommand} label="Copy command" />
            </div>
            {component.radixInstallCommand ? (
              <div className="component-install__command">
                <span>Radix UI counterpart</span>
                <code tabIndex={0}>{component.radixInstallCommand}</code>
                <CopyTextButton value={component.radixInstallCommand} label="Copy Radix command" />
              </div>
            ) : null}
            {component.dependencies.length ? (
              <p>
                Canonical dependency: {component.dependencies.join(", ")}.
                {component.radixDependency
                  ? ` Radix counterpart: ${component.radixDependency}.`
                  : component.slug === "combobox"
                    ? " Combobox remains Base-only because Radix does not publish a Combobox primitive."
                    : ""}
                {" "}Registry dependencies are resolved automatically.
              </p>
            ) : (
              <p>No package dependency beyond React. Shared Gummy material is resolved automatically.</p>
            )}
          </div>
        </section>
        <section className="component-contract" aria-labelledby="contract-title">
          <div className="component-detail__section-heading">
            <p className="showcase-kicker">Behavior contract</p>
            <h2 id="contract-title">Semantics before surface</h2>
          </div>
          <div>
            <article>
              <span aria-hidden="true">01</span>
              <h3>Semantics</h3>
              <p>{component.semantics}</p>
            </article>
            <article>
              <span aria-hidden="true">02</span>
              <h3>Keyboard</h3>
              <p>{component.keyboard}</p>
            </article>
            <article>
              <span aria-hidden="true">03</span>
              <h3>System support</h3>
              <p>Light and dark themes, logical RTL layout, reduced motion, responsive content, and forwarded public refs.</p>
            </article>
          </div>
        </section>
        <section className="component-api-docs" aria-labelledby="api-title">
          <div className="component-detail__section-heading">
            <p className="showcase-kicker">Source-derived reference</p>
            <h2 id="api-title">Anatomy and public API</h2>
          </div>
          <div className="component-api-docs__grid">
            <article>
              <h3>Exported anatomy</h3>
              <p>These public React parts are read directly from the canonical source during the documentation build.</p>
              <ul>
                {api.components.map((part) => <li key={part}><code>{part}</code></li>)}
                {api.hooks.map((hook) => <li key={hook}><code>{hook}</code> hook</li>)}
              </ul>
            </article>
            <article>
              <h3>Prop contracts</h3>
              {api.types.length ? api.types.map((type) => (
                <div className="component-api-docs__type" key={type.name}>
                  <h4><code>{type.name}</code></h4>
                  {type.extends.map((base) => (
                    <p key={base}><span>Composes</span> <code>{base}</code></p>
                  ))}
                  {type.props.length ? (
                    <dl>
                      {type.props.map((property) => (
                        <div key={property.name}>
                          <dt><code>{property.name}{property.optional ? "?" : ""}</code></dt>
                          <dd><code>{property.type}</code></dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                </div>
              )) : (
                <p>Each exported part accepts the underlying native, Base UI, or documented Radix prop contract. Inspect the selected source below for exact generic types.</p>
              )}
            </article>
          </div>
        </section>
        <section className="component-troubleshooting" aria-labelledby="troubleshooting-title">
          <div className="component-detail__section-heading">
            <p className="showcase-kicker">Troubleshooting</p>
            <h2 id="troubleshooting-title">Check behavior before surface.</h2>
          </div>
          <ul>
            <li>If the material is missing, confirm the registry-installed shared and component CSS files are imported once.</li>
            <li>If interaction differs, preserve this contract: {component.keyboard}</li>
            <li>If assistive output differs, preserve this semantic foundation: {component.semantics}</li>
            <li>If dark, RTL, or reduced-motion behavior is missing, verify the nearest theme, direction, and media-query boundaries rather than adding page-local overrides.</li>
          </ul>
        </section>
        <section className="component-live-proof" aria-labelledby="live-proof-title">
          <div className="component-detail__section-heading">
            <p className="showcase-kicker">Live product source</p>
            <h2 id="live-proof-title">Inspect the canonical states</h2>
          </div>
          <p>
            The Component Lab exercises real source across default, focus,
            disabled, responsive, dark, reduced-motion, and RTL contexts.
          </p>
          <Link href="/components/lab">Open the live Component Lab <span aria-hidden="true">↗</span></Link>
        </section>
        <ComponentInspector slug={component.slug} componentName={component.name} />
        {component.radixRegistryName ? (
          <RadixComponentInspector
            slug={component.slug}
            componentName={component.name}
          />
        ) : null}
        <section className="component-source-section" aria-labelledby="source-title">
          <div className="component-detail__section-heading">
            <p className="showcase-kicker">Editable source</p>
            <h2 id="source-title">Read before you install</h2>
          </div>
          <h3>Canonical Base UI or native source</h3>
          <RegistrySourceViewer registryName={component.registryName} />
          {component.radixRegistryName ? (
            <>
              <h3>Radix UI counterpart</h3>
              <RegistrySourceViewer registryName={component.radixRegistryName} />
            </>
          ) : null}
        </section>
        <nav className="component-detail__next" aria-label="Component catalogue">
          <Link href="/components">← Back to all components</Link>
          <a href={`/r/${component.registryName}.json`}>Registry JSON ↗</a>
          {component.radixRegistryName ? (
            <a href={`/r/${component.radixRegistryName}.json`}>Radix registry JSON ↗</a>
          ) : null}
        </nav>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </main>
      <SiteFooter />
    </>
  );
}
