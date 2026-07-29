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
      <section>
        <h2>How to read a release entry</h2>
        <p>
          Each entry describes public work that exists in the tagged repository,
          not a roadmap promise. Catalogue counts come from the same typed data
          used to generate component pages and registry payloads. A component
          addition names the source that became available; a behavior change
          records what consumers may need to recheck; documentation and
          verification entries identify supporting work without presenting it
          as a new product feature.
        </p>
        <p>
          Gummy UI distributes editable source rather than a versioned runtime
          package, so teams remain in control of the copy installed in their own
          repository. Before taking an update, review the diff, compare any
          dependency or anatomy changes, and rerun the consuming product’s type,
          interaction, accessibility, visual, and browser checks. Existing MIT
          source does not silently change when a later registry version is
          published.
        </p>
      </section>
      <section>
        <h2>Public and Pro records stay separate</h2>
        <p>
          This page covers the open component system and public product
          foundation. A future paid release requires its own versioned archive,
          checksum, licence, protected-download evidence, and entitlement
          record. An implemented Pro status is therefore not listed here as a
          customer release, and no changelog entry should be read as proof that
          checkout or a protected download is available.
        </p>
      </section>
    </PublicTextPage>
  );
}
