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
import { getComponentPreviewStylesheet } from "../../data/component-preview-styles";

const componentUsageGuidance = {
  alert:
    "Use an alert for information that belongs in the current page flow, then match its urgency to the actual consequence. Give the message a concise heading, describe the next useful action, and do not rely on colour or an icon to communicate status. Reserve interruptive dialogs or live announcements for changes that genuinely need immediate attention; repeated static guidance should remain ordinary page content.",
  "aspect-ratio":
    "Use a fixed aspect ratio when media needs predictable geometry before it loads or while it changes across sources. Supply meaningful alternative text when the image carries information, and an empty alternative when it is decorative. Choose object-fit behavior deliberately so important content is not cropped. Test unusually tall, wide, missing, and slow media, plus zoom and small containers, before treating the reserved frame as complete.",
  avatar:
    "Use an avatar as supporting identity, never as the only way to distinguish a person or organisation. Keep the visible name nearby and define a stable fallback for missing, blocked, or undecodable images. Decide whether the image itself needs alternative text or whether adjacent text already supplies the name. Test long international names, duplicate initials, slow images, privacy-restricted accounts, and high-density group layouts.",
  breadcrumb:
    "Use breadcrumbs for a real hierarchy, not as a duplicate of browser history or the primary navigation. Each ancestor should link to its canonical level, while the current page remains clearly identified without a misleading link. Shorten presentation only when the full hierarchy is still available to assistive technology. Test deep paths, long translated labels, narrow screens, keyboard focus, and structured metadata against the visible trail.",
  "button-group":
    "Use a button group when actions are closely related and benefit from shared placement; unrelated primary decisions should remain separate. Labels must describe each result without depending on icon recognition or position. Decide how focus and wrapping behave at small widths, and keep destructive actions visually and semantically distinct. Test loading, disabled, permission-denied, and partial-success states so grouped controls do not imply an action completed.",
  checkbox:
    "Use a checkbox for an independent yes-or-no choice, or a group in which several options may be selected. Write a visible label that names the state positively, connect help and validation text programmatically, and use the indeterminate state only when it represents a genuine mixed selection. Test keyboard toggling, error recovery, high zoom, long labels, and server rejection; visual selection alone is not saved consent.",
  combobox:
    "Use a combobox when customers need to search or choose from a substantial option set; a native select is usually clearer for a short stable list. Keep the typed value, highlighted option, and committed selection distinct. Announce result counts and empty states without excessive chatter. Test free text, exact matches, long results, async failure, touch input, escape, blur, and reopening after a selection.",
  command:
    "Use a command interface for experienced customers who need fast access to many named actions or destinations. It should complement, not replace, discoverable navigation. Results need clear grouping, unique labels, accurate keyboard hints, and safe handling for unavailable or destructive actions. Test no match, fuzzy match, repeated names, permission changes, focus restoration, escape, and mobile input before advertising the palette as a shortcut.",
  "date-picker":
    "Use a date picker to support, rather than prevent, direct and correctly formatted date entry. State the expected date meaning, locale, time-zone boundary, allowed range, and unavailable dates in nearby guidance. Preserve keyboard movement and a route back to the invoking field. Test month and year boundaries, leap days, minimum and maximum values, typed errors, RTL layout, high zoom, and server-side validation.",
  empty:
    "Use an empty state to explain why expected content is absent and what a customer can realistically do next. Distinguish a new workspace, filtered zero results, removed access, provider failure, and a product with no available records; those situations need different language and actions. Avoid celebratory illustration that masks an error. Test whether the proposed action is authorized, reachable, and still useful on a narrow screen.",
  "input-group":
    "Use an input group when an adjoining control, unit, prefix, or action changes how one field is interpreted. Keep a visible field label outside decorative affixes, and ensure buttons have names that make sense without relying on position. Do not make a currency symbol, domain suffix, or reveal control part of the submitted value accidentally. Test long units, password managers, validation, zoom, and touch targets.",
  kbd:
    "Use keyboard notation to document a real supported shortcut, not to make ordinary text look technical. Name keys according to the target platform when conventions differ, explain the action in words, and avoid presenting a shortcut as the sole route to functionality. Check the sequence against the application, operating-system conflicts, remapped keyboards, speech input, mobile environments, and international layouts before publishing the instruction.",
  "native-select":
    "Use the native select for a short, stable set of mutually exclusive choices where platform behavior is an advantage. Provide a visible label, an honest placeholder only when no value is valid, and server validation for every submitted option. Group lengthy lists carefully rather than simulating search. Test keyboard and touch selection, long translations, disabled choices, validation recovery, high zoom, and forced-colour settings.",
  pagination:
    "Use pagination when a large collection is divided into stable, addressable pages and customers benefit from returning to a position. Keep page links crawlable where appropriate, identify the current page, preserve active filters, and give previous and next actions descriptive names. Test first, last, empty, and single-page results; deleted records; long totals; narrow layouts; keyboard order; and back-button restoration.",
  progress:
    "Use progress when the application can report a meaningful amount completed or an honestly indeterminate wait. Pair the visual track with an accessible name and current value, and describe what is happening when duration is unknown. Never advance a decorative percentage independently of real work. Test zero, completion, pause, failure, cancellation, slow updates, reduced motion, and background-tab recovery before relying on it for reassurance.",
  separator:
    "Use a separator only when it clarifies the relationship between neighbouring regions or items. A purely decorative line should stay out of the accessibility tree; a semantic separator should match the actual horizontal or vertical structure. Do not use repeated rules instead of headings or spacing. Test the boundary in stacked mobile layouts, forced colours, high zoom, print, and RTL to confirm it still communicates the intended grouping.",
  sidebar:
    "Use a sidebar for stable workspace navigation or complementary content that remains useful beside the main task. Keep DOM order logical when the layout collapses, identify the current destination, and provide a labelled small-screen alternative. Collapsed icons need accessible names and discoverable meaning. Test long labels, nested groups, restricted links, zoom, RTL, focus return, and browser history without duplicating interactive controls.",
  skeleton:
    "Use a skeleton only while the shape of incoming content is reasonably known and the wait is brief. Keep it silent or expose one concise loading status rather than making every placeholder discoverable. Avoid mimicking loaded controls that cannot yet be used, and respect reduced motion. Test immediate data, slow data, failure, empty results, layout changes, and repeated refreshes so the placeholder never becomes misleading permanent content.",
  spinner:
    "Use a spinner for a short indeterminate operation when no honest completion fraction exists. Pair it with text that says what is being attempted and update that status when the operation succeeds, fails, or can be retried. Disable only the controls that truly conflict. Test instant completion, long waits, cancellation, reduced motion, screen-reader announcements, and route changes so loading feedback never traps a customer.",
  table:
    "Use a table when rows and columns express relationships that customers need to compare. Give data columns clear headers, add a caption or nearby heading, and keep actions associated with the correct row. For responsive layouts, preserve those relationships rather than visually flattening cells without labels. Test empty and large data sets, sorting, long values, horizontal scrolling, keyboard controls, and assistive-technology navigation.",
  textarea:
    "Use a textarea for genuinely multi-line input and state what kind of content, length, and formatting the service accepts. Connect a visible label, guidance, validation, and any character count without announcing every keystroke. Preserve entered text after recoverable errors and validate again on the server. Test pasting, long unbroken content, spellcheck, resizing, mobile keyboards, high zoom, and sensitive-data warnings.",
  typography:
    "Use the typography primitives to preserve document structure while applying consistent visual rhythm. Choose heading levels from the page outline, not the desired size, and keep paragraphs, lists, quotations, and code semantically accurate. Confirm readable line length, text scaling, link distinction, and sufficient contrast across themes. Test long translations, bidirectional text, narrow screens, user font overrides, print, and 200 percent zoom.",
} satisfies Record<string, string>;

function getComponentUsageGuidance(slug: string) {
  return Object.hasOwn(componentUsageGuidance, slug)
    ? componentUsageGuidance[slug as keyof typeof componentUsageGuidance]
    : undefined;
}

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
  const previewStylesheet = getComponentPreviewStylesheet(component.slug);
  const group = catalogueGroups.find(({ id }) => id === component.group)!;
  const usageGuidance = getComponentUsageGuidance(component.slug);
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
        {usageGuidance ? (
          <section className="component-troubleshooting" aria-labelledby="usage-title">
            <div className="component-detail__section-heading">
              <p className="showcase-kicker">Implementation decisions</p>
              <h2 id="usage-title">When to use {component.name}</h2>
            </div>
            <p>{usageGuidance}</p>
          </section>
        ) : null}
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
        <ComponentInspector
          slug={component.slug}
          componentName={component.name}
          previewStylesheet={previewStylesheet}
        />
        {component.radixRegistryName ? (
          <RadixComponentInspector
            slug={component.slug}
            componentName={component.name}
            previewStylesheet={previewStylesheet!}
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
