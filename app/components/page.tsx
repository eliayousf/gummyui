import type { Metadata } from "next";
import { CatalogueSearch } from "../components/CatalogueSearch";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { catalogueGroups, componentCount, components } from "../data/catalogue";

export const metadata: Metadata = {
  title: "React component catalogue · Gummy UI",
  description: `Explore ${componentCount} open-source React component categories with editable native, Base UI and Radix UI source, documented accessibility, RTL and dark mode.`,
  alternates: { canonical: "/components" },
};

export default function ComponentsPage() {
  return (
    <>
      <a className="skip-link" href="#component-catalogue">Skip to component catalogue</a>
      <SiteHeader />
      <main id="component-catalogue" className="catalogue-shell">
        <header className="catalogue-hero">
          <div>
            <p className="showcase-kicker">Open-source component catalogue</p>
            <h1>{componentCount} deliberate foundations.</h1>
            <p>
              Each category ships editable React and TypeScript source, a
              shadcn-compatible registry payload, documented semantics, tested
              keyboard behavior, RTL, dark mode, and reduced motion.
            </p>
          </div>
          <dl>
            <div><dt>{componentCount}</dt><dd>component categories</dd></div>
            <div><dt>{catalogueGroups.length}</dt><dd>product families</dd></div>
            <div><dt>MIT</dt><dd>source licence</dd></div>
          </dl>
        </header>
        <CatalogueSearch components={components} groups={catalogueGroups} />
      </main>
      <SiteFooter />
    </>
  );
}
