import type { Metadata } from "next";
import Link from "next/link";
import { PublicTextPage } from "../components/PublicTextPage";
import {
  proCatalogueStatus,
  proImplementedTemplateCount,
  proSpecifiedTemplateCount,
  proTemplateCount,
  proTemplates,
} from "../data/pro-catalogue";

export const metadata: Metadata = {
  title: "Pro template implementation status · Gummy UI",
  description: "Review implementation, preview, manual verification, protected release, and publication status for six private Gummy UI Pro templates.",
  alternates: { canonical: "/templates" },
  robots: { index: true, follow: true },
};

export default function TemplatesPage() {
  return (
    <PublicTextPage
      eyebrow={`Complete-product briefs · ${proCatalogueStatus}`}
      title={`${proTemplateCount} original product implementations.`}
      lede={`${proImplementedTemplateCount} templates have complete private source, route, state, test, build, documentation, and deterministic preview evidence; ${proSpecifiedTemplateCount} remain specified. Manual multi-browser and assistive-technology review, protected releases, entitlement delivery, and publication remain open.`}
    >
      <section>
        <h2>Template briefs</h2>
        <div className="public-page__grid">
          {proTemplates.map((template) => (
            <article key={template.slug}>
              <p className="showcase-kicker">{template.kind}</p>
              <h3>{template.name}</h3>
              <p>Status: {template.status}</p>
              <Link href={`/templates/${template.slug}`}>Review {template.name}</Link>
            </article>
          ))}
        </div>
      </section>
    </PublicTextPage>
  );
}
