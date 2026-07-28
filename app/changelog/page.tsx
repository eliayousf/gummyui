import type { Metadata } from "next";
import { PublicTextPage } from "../components/PublicTextPage";
import { publicReleases } from "../data/changelog";

export const metadata: Metadata = {
  title: "Changelog for Gummy UI components and releases",
  description:
    "Follow verified Gummy UI component, registry, documentation and product-foundation changes, with dated public release notes and catalogue counts.",
  alternates: { canonical: "/changelog" },
};

export default function ChangelogPage() {
  return (
    <PublicTextPage
      eyebrow="Public release record"
      title="Built in dependency order."
      lede="Dates, behavior changes, registry additions, and verification evidence are recorded with the source. Counts come from the catalogue manifest."
    >
      <section className="public-changelog">
        {publicReleases.map((release) => (
          <article id={`v${release.version.replaceAll(".", "-")}`} key={release.version}>
            <span>{release.version}</span>
            <div><h2>{release.title}</h2><p>{release.copy}</p></div>
            <time dateTime={release.date}>
              {new Intl.DateTimeFormat("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                timeZone: "UTC",
              }).format(new Date(`${release.date}T00:00:00Z`))}
            </time>
          </article>
        ))}
      </section>
      <section>
        <h2>Source record</h2>
        <p>The repository-level <code>docs/changelog.md</code> is the detailed canonical release log. Subscribe to the <a href="/changelog.xml">public changelog RSS feed</a> for version summaries.</p>
      </section>
    </PublicTextPage>
  );
}
