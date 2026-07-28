import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicTextPage } from "../../components/PublicTextPage";
import {
  getProTemplate,
  proTemplates,
} from "../../data/pro-catalogue";

export function generateStaticParams() {
  return proTemplates.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const template = getProTemplate(slug);
  if (!template) return {};
  return {
    title: `${template.name} Pro template status · Gummy UI`,
    description: `${template.brief} Boundary-safe implementation and release status.`,
    alternates: { canonical: `/templates/${template.slug}` },
    robots: { index: true, follow: true },
  };
}

export default async function ProTemplateDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const template = getProTemplate(slug);
  if (!template) notFound();

  return (
    <PublicTextPage
      eyebrow={`Private Pro template · ${template.status}`}
      title={template.name}
      lede={`${template.brief} The public page exposes only reviewed source-free metadata; private React, TypeScript, tests, and release files never enter this application.`}
    >
      <section>
        <h2>Product route contract</h2>
        <ul>
          {template.routes.map((route) => <li key={route}><code>{route}</code></li>)}
        </ul>
      </section>
      <section>
        <h2>State and quality contract</h2>
        <p>States: {template.states.join(", ")}.</p>
        <p>Requirements: {template.requirements.join(", ")}.</p>
      </section>
      <section>
        <h2>Source-free preview</h2>
        <p>
          {template.preview
            ? "A reviewed release-ready image is available on the isolated preview page."
            : "No public preview is published. Preview metadata remains private until release readiness and boundary review are complete."}
        </p>
        <p><Link href={`/templates/${template.slug}/preview`}>Open isolated preview status</Link></p>
      </section>
      <section>
        <h2>Availability boundary</h2>
        <p>
          Implemented does not mean verified, release-ready, entitled, sold,
          or deployed. Manual browser and assistive-technology review, approved
          commercial terms, a protected archive, and server-side entitlement
          delivery remain required.
        </p>
        <p><Link href="/templates">Return to all Pro templates</Link></p>
      </section>
    </PublicTextPage>
  );
}
