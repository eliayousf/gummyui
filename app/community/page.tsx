import type { Metadata } from "next";
import Link from "next/link";
import { PublicTextPage } from "../components/PublicTextPage";
import { showcaseCount, showcaseEntries } from "../data/showcase";

export const metadata: Metadata = {
  title: "Gummy UI community showcase and submission status",
  description: "Explore permissioned products built with Gummy UI and the evidence, consent, privacy, accessibility, maintenance, and removal checks required for submission.",
  alternates: { canonical: "/community" },
};

export default function CommunityPage() {
  return (
    <PublicTextPage
      eyebrow="Community showcase"
      title="Real work, when there is real work."
      lede={`${showcaseCount} permissioned ${showcaseCount === 1 ? "project is" : "projects are"} currently published. Gummy UI does not invent customer sites, logos, quotes, or community numbers.`}
    >
      {showcaseEntries.length ? (
        <section className="public-page__grid" aria-label="Community projects">
          {showcaseEntries.map((entry) => (
            <article key={entry.url}>
              <h2>{entry.name}</h2>
              <p>{entry.description}</p>
              <a href={entry.url} rel="noreferrer">Visit project</a>
            </article>
          ))}
        </section>
      ) : (
        <section>
          <h2>The first slot is intentionally empty.</h2>
          <p>No public product has yet been verified as a permissioned Gummy UI implementation. This page will populate from the reviewed showcase manifest rather than a hand-written marketing count.</p>
          <p><Link href="/community/submit">Read the submission and evidence requirements</Link>.</p>
        </section>
      )}
      <section>
        <h2>Publication standard</h2>
        <p>Every entry must identify a publicly reachable product, show meaningful use of Gummy UI, have the submitter’s permission to publish its name and link, and contain no unsupported performance, accessibility, or commercial claim.</p>
      </section>
      <section>
        <h2>What visitors can expect from an entry</h2>
        <p>
          A published project will include a factual description supplied or
          approved by someone authorized to represent it. Review checks the
          destination, the visible use of Gummy UI, publication permission, and
          basic suitability for a public audience. It does not turn the project
          into an official example application, customer testimonial, or claim
          that every part of the linked site uses Gummy UI.
        </p>
        <p>
          Entries will not be ranked by payment, traffic, company size, or
          private relationship. A project with one careful use of the public
          components can be more informative than a large product with an
          unverifiable attribution. Any supplied screenshot must have an
          identified rights holder and must not expose account, analytics,
          customer, or other confidential information.
        </p>
      </section>
      <section>
        <h2>Corrections and removal</h2>
        <p>
          Project owners will be able to request a correction or removal
          through the monitored support channel. Gummy UI may also remove an
          entry if its destination becomes unsafe, inaccessible, materially
          different from the approved submission, or no longer demonstrates the
          library. Removal changes only this showcase; it makes no judgment
          about the project’s quality and does not affect the MIT licence of any
          public component source already used.
        </p>
        <p>
          Visitors can report a broken destination, misleading attribution, or
          privacy concern to the same support channel. Reports are checked
          against the reviewed entry before copy or media changes.
        </p>
      </section>
    </PublicTextPage>
  );
}
