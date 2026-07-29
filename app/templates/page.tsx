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
      <section>
        <h2>Choose by product structure, not decoration</h2>
        <p>
          Each template describes a different information architecture,
          customer task, and operating model. Start with the routes and states
          your product genuinely needs, then compare its content hierarchy,
          navigation depth, data density, and conversion path with the public
          brief. A matching colour palette is not evidence that a template fits
          the product. Teams should expect to replace every demonstration name,
          claim, image, metric, integration, and policy reference with reviewed
          material from their own source of truth.
        </p>
        <p>
          The route contracts expose enough information to plan integration
          without revealing paid implementation. Inspect whether the proposed
          pages cover the real customer journey, where authentication or
          permission boundaries occur, and how loading, empty, error, success,
          offline, and denied states will be supplied by the application. The
          finished product remains responsible for its data model, server
          authorization, analytics consent, legal copy, support operation, and
          production monitoring.
        </p>
      </section>
      <section>
        <h2>What the status does—and does not—prove</h2>
        <p>
          An implemented record means the private repository contains the
          declared responsive source and automated evidence. It is not a
          customer release. Before any template can be sold or downloaded, its
          complete states must pass manual browser, keyboard, zoom,
          assistive-technology, dark-mode, reduced-motion, and RTL review. A
          versioned archive must then pass boundary inspection, receive
          checksums, enter protected storage, and be retrievable only through a
          current server-side entitlement. Until those gates are recorded, the
          public pages remain status reports rather than purchase promises.
        </p>
      </section>
    </PublicTextPage>
  );
}
