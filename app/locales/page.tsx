import type { Metadata } from "next";
import { PublicTextPage } from "../components/PublicTextPage";
import {
  locales,
  pendingLocales,
  publishedLocales,
} from "../data/locales";
import { localeAlternatesForPath } from "../i18n/routing";

export const metadata: Metadata = {
  title: "Language availability · Gummy UI",
  description:
    "Review Gummy UI language availability, fail-closed routing, AI provenance, founder review, RTL verification, metadata and publication gates.",
  alternates: {
    canonical: "/locales",
    languages: localeAlternatesForPath("/locales"),
  },
};

function statusLabel(status: (typeof locales)[number]["status"]): string {
  return status === "published"
    ? "Published"
    : "Pending founder review and publication";
}

export default function LocalesPage() {
  return (
    <PublicTextPage
      eyebrow={`${publishedLocales.length} published · ${pendingLocales.length} awaiting review`}
      title="English is the only published language today."
      lede="Gummy UI has the routing, direction, and review foundations for the complete language roadmap. A locale is not linked, indexed, or described as available until AI-generated copy passes automated integrity checks, rendered QA and founder review."
    >
      <section>
        <h2>Language status</h2>
        <div className="locale-status-table__scroll">
          <table className="locale-status-table">
            <thead>
              <tr>
                <th scope="col">Language</th>
                <th scope="col">BCP 47</th>
                <th scope="col">Direction</th>
                <th scope="col">Publication</th>
              </tr>
            </thead>
            <tbody>
              {locales.map((locale) => (
                <tr key={locale.code}>
                  <td lang={locale.code} role="rowheader">
                    <span dir={locale.direction}>{locale.nativeName}</span>
                    <small>{locale.englishName}</small>
                  </td>
                  <td><code>{locale.code}</code></td>
                  <td><code>{locale.direction}</code></td>
                  <td>
                    <span
                      className="locale-status-table__status"
                      data-status={locale.status}
                    >
                      {statusLabel(locale.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2>What publication requires</h2>
        <ol>
          <li>A complete source dictionary with stable message identifiers and no untranslated fallbacks.</li>
          <li>Recorded AI model/version provenance followed by founder review for terminology, tone, grammar, truncation, and culturally appropriate examples.</li>
          <li>Keyboard, zoom, responsive, dark-mode, and assistive-technology review of representative pages.</li>
          <li>Additional bidirectional and logical-layout review for Persian, Hebrew, and Arabic.</li>
          <li>Only then: route activation, switcher link, sitemap alternate, and public availability claim.</li>
        </ol>
        <p>The repository workflow and release evidence requirements are documented in <a href="/docs/markdown/guides/localisation.md">the localisation review guide</a>.</p>
      </section>
      <section>
        <h2>How fail-closed language routing works</h2>
        <p>
          Draft dictionaries are review artefacts, not public locales. A
          pending language has no customer-facing route, switcher destination,
          search index entry, sitemap alternate, or availability claim. This
          prevents an incomplete draft from silently mixing with English or
          exposing untranslated navigation, legal, support, licence, pricing,
          and account language as though the experience were finished.
        </p>
        <p>
          When a locale is approved, its route must use one complete versioned
          dictionary and the correct document language and direction. Dates,
          numbers, currencies, names, keyboard input, validation, transactional
          email, and externally hosted identity or payment surfaces also need
          review; translating page paragraphs alone is insufficient. If a
          release later loses integrity, routing should fall back to the
          canonical English page rather than publish a partial mixture.
        </p>
      </section>
    </PublicTextPage>
  );
}
