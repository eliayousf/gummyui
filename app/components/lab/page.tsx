import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "../SiteChrome";

export const metadata: Metadata = {
  title: "Canonical Component Lab · Gummy UI",
  description: "Explore live default, hover, focus, disabled, validation, RTL, and reduced-motion evidence for all 57 editable Gummy UI component categories.",
  alternates: { canonical: "/components/lab" },
  robots: { index: false, follow: true },
};

export default function ComponentLabPage() {
  return (
    <>
      <a className="skip-link" href="#component-lab-index">
        Skip to component review guidance
      </a>
      <SiteHeader />
      <main
        id="component-lab-index"
        className="component-detail"
        data-production-component-lab="deferred"
      >
        <header className="component-detail__hero">
          <div>
            <p className="showcase-kicker">Production component review</p>
            <h1>Inspect one real component at a time.</h1>
            <p>
              The complete all-component workbench is reserved for development
              and release review. Production detail pages keep every public
              component documented and load their interactive preview only when
              requested.
            </p>
          </div>
          <span className="component-detail__mark" aria-hidden="true">57</span>
        </header>
        <section className="component-contract" aria-labelledby="lab-review-title">
          <div className="component-detail__section-heading">
            <p className="showcase-kicker">Focused evidence</p>
            <h2 id="lab-review-title">Choose the smallest useful surface.</h2>
          </div>
          <div>
            <article>
              <span aria-hidden="true">01</span>
              <h3>Browse all categories</h3>
              <p>Use the searchable catalogue to find the component and behavior contract you need.</p>
            </article>
            <article>
              <span aria-hidden="true">02</span>
              <h3>Load a live preview</h3>
              <p>Each detail page offers its real responsive, light, dark, RTL, and reduced-motion specimen on demand.</p>
            </article>
            <article>
              <span aria-hidden="true">03</span>
              <h3>Inspect editable source</h3>
              <p>Public registry source, anatomy, props, semantics, and keyboard guidance remain available without the full Lab payload.</p>
            </article>
          </div>
        </section>
        <nav className="component-detail__next" aria-label="Component review destinations">
          <Link href="/components">Browse all 57 components</Link>
          <Link href="/components/accordion">Open a live component preview</Link>
          <Link href="/themes">Open the Theme Builder</Link>
        </nav>
      </main>
      <SiteFooter />
    </>
  );
}
