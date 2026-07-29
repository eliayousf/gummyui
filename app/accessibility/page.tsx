import type { Metadata } from "next";
import { PublicTextPage } from "../components/PublicTextPage";
import { commercialFacts } from "../data/commercial";

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
        <h2>How to review an installed component</h2>
        <p>Begin with the task a person must complete, not the component&apos;s appearance. Confirm that names, roles, descriptions, headings, labels and error relationships still make sense when the component is read in document order. Then complete every action with a keyboard, checking focus entry, movement, activation, dismissal and restoration. Managed composites such as menus and tabs should follow their documented key contract; ordinary controls should retain native browser behavior.</p>
        <p>Repeat the task at 200% zoom and a narrow viewport, in light and dark themes, with a right-to-left boundary, and with reduced motion enabled. Check that content reflows without hiding actions, focus remains visible, status is not conveyed by colour alone, and animation is removed or simplified where motion is not essential.</p>
        <p>Automated tests can find missing names, invalid relationships and some contrast failures, but they cannot prove that instructions are understandable or that a workflow is usable. Record the browser, assistive technology, viewport and exact task with each manual result so a future release can reproduce it.</p>
      </section>
      <section>
        <h2>Report a barrier</h2>
        <p>Email <a href={commercialFacts.supportHref}>{commercialFacts.supportEmail}</a> with the page, component or task, what happened, and the browser or assistive technology involved. We aim to send a first reply within two UK business days. This is a target, not an SLA.</p>
      </section>
    </PublicTextPage>
  );
}
