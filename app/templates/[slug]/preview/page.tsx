import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicTextPage } from "../../../components/PublicTextPage";
import {
  getProTemplate,
  proTemplates,
} from "../../../data/pro-catalogue";

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
    title: `${template.name} isolated preview status · Gummy UI`,
    description: `Source-free preview publication status for the private ${template.name} Pro template.`,
    alternates: { canonical: `/templates/${template.slug}/preview` },
    robots: { index: false, follow: false, noarchive: true },
  };
}

export default async function ProTemplatePreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const template = getProTemplate(slug);
  if (!template) notFound();

  return (
    <PublicTextPage
      eyebrow={`Source-free isolated preview · ${template.status}`}
      title={template.name}
      lede="This route can display only a reviewed raster preview. Compiled or editable paid template source is forbidden in the public application and its deployment artifacts."
    >
      <section>
        <h2>Preview publication</h2>
        {template.preview ? (
          <Image
            src={`/${template.preview}`}
            alt={`${template.name} source-free template preview`}
            width={1280}
            height={720}
            priority
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
        ) : (
          <p>
            No public image has been approved. The private implementation and
            deterministic evidence exist, but release-ready review, entitlement
            delivery, and publication approval remain open.
          </p>
        )}
      </section>
      <section>
        <h2>Why this is image-only</h2>
        <p>
          A minified JavaScript bundle or compiled editable design would still
          disclose proprietary implementation. The public boundary therefore
          permits only reviewed, source-free imagery and safe manifest facts.
        </p>
        <p><Link href={`/templates/${template.slug}`}>Return to template status</Link></p>
      </section>
    </PublicTextPage>
  );
}
