import type { Metadata } from "next";
import { PublicTextPage } from "../components/PublicTextPage";

export const metadata: Metadata = {
  title: "Gummy UI accessibility contract and verification status",
  description: "Review Gummy UI's WCAG 2.2 AA target, native and Base UI semantics, keyboard and touch expectations, automated evidence, and outstanding manual release gates.",
  alternates: { canonical: "/accessibility" },
};

export default function AccessibilityPage() {
  return (
    <PublicTextPage
      eyebrow="Accessibility is component behavior"
      title="A visible, testable contract."
      lede="Gummy UI targets WCAG 2.2 AA for the public website and shipped component states. Automated checks support—but never replace—keyboard, screen-reader, zoom, contrast, touch, RTL, and reduced-motion review."
    >
      <section>
        <h2>What every component must provide</h2>
        <ul>
          <li>Native semantics first, with Base UI where managed focus or composite behavior is required.</li>
          <li>Visible labels, instructions, validation, and non-colour-only state cues.</li>
          <li>Complete keyboard paths, visible focus, 44px touch targets where applicable, and focus restoration.</li>
          <li>Light and dark contrast, 200% zoom/reflow, RTL, and reduced-motion behavior.</li>
          <li>Automated axe coverage plus behavior tests against real rendered source.</li>
        </ul>
      </section>
      <section>
        <h2>Current evidence</h2>
        <p>The local catalogue test suite covers all nine dependency groups, including representative axe checks, native relationships, focus movement, controlled state, RTL keys, and clean registry installation. Manual browser and assistive-technology smoke tests are recorded as a release gate rather than represented as already complete.</p>
      </section>
      <section>
        <h2>Report a barrier</h2>
        <p>The production accessibility contact channel is not yet published. Before launch, this page must identify a monitored owner, expected response time, and an alternative contact method.</p>
      </section>
    </PublicTextPage>
  );
}
