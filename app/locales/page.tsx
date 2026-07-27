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
    "Review Gummy UI language availability, fail-closed routing, human linguistic review, RTL verification, metadata, hreflang, sitemap, and publication gates.",
  alternates: {
    canonical: "/locales",
    languages: localeAlternatesForPath("/locales"),
  },
};

function statusLabel(status: (typeof locales)[number]["status"]): string {
  return status === "published"
    ? "Published"
    : "Pending linguistic review";
}

export default function LocalesPage() {
  return (
    <PublicTextPage
      eyebrow={`${publishedLocales.length} published · ${pendingLocales.length} awaiting review`}
      title="English is the only published language today."
      lede="Gummy UI has the routing, direction, and review foundations for the complete language roadmap. A locale is not linked, indexed, or described as available until its interface copy and rendered product have passed human linguistic review."
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
                  <th lang={locale.code} scope="row">
                    <span dir={locale.direction}>{locale.nativeName}</span>
                    <small>{locale.englishName}</small>
                  </th>
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
          <li>Review by a fluent human for terminology, tone, grammar, truncation, and culturally appropriate examples.</li>
          <li>Keyboard, zoom, responsive, dark-mode, and assistive-technology review of representative pages.</li>
          <li>Additional bidirectional and logical-layout review for Persian, Hebrew, and Arabic.</li>
          <li>Only then: route activation, switcher link, sitemap alternate, and public availability claim.</li>
        </ol>
        <p>The repository workflow and release evidence requirements are documented in <a href="/docs/markdown/guides/localisation.md">the localisation review guide</a>.</p>
      </section>
    </PublicTextPage>
  );
}
