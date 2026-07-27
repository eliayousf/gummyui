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
    </PublicTextPage>
  );
}
