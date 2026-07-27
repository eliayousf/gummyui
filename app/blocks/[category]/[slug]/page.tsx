import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicTextPage } from "../../../components/PublicTextPage";
import {
  getProBlock,
  getProBlockCategory,
  proBlocks,
} from "../../../data/pro-catalogue";

export function generateStaticParams() {
  return proBlocks.map(({ category, slug }) => ({ category, slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const block = getProBlock(category, slug);
  if (!block) return {};
  return {
    title: `${block.name} Pro block status · Gummy UI`,
    description: `${block.purpose} Boundary-safe implementation and release status for ${block.name}.`,
    alternates: { canonical: `/blocks/${block.category}/${block.slug}` },
    robots: { index: false, follow: true },
  };
}

export default async function ProBlockDetailPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category: categorySlug, slug } = await params;
  const block = getProBlock(categorySlug, slug);
  const category = getProBlockCategory(categorySlug);
  if (!block || !category) notFound();

  return (
    <PublicTextPage
      eyebrow={`${category.name} · ${block.status}`}
      title={block.name}
      lede={`${block.purpose} This page is generated from reviewed source-free metadata and does not expose paid implementation files.`}
    >
      <section>
        <h2>Implementation contract</h2>
        <dl>
          <div><dt>Status</dt><dd>{block.status}</dd></div>
          <div><dt>Dependencies</dt><dd>{block.dependencies.join(", ")}</dd></div>
          <div><dt>Required review</dt><dd>{block.requirements.join(", ")}</dd></div>
        </dl>
      </section>
      <section>
        <h2>Responsive image preview</h2>
        {block.preview ? (
          <>
            <Image
              src={`/${block.preview}`}
              alt={`${block.name} responsive Pro block preview`}
              width={1280}
              height={720}
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
            <p>
              The image is source-free preview evidence. It is not an editable
              download and does not by itself establish release readiness.
            </p>
          </>
        ) : (
          <p>
            No public preview is published. A preview path is exported only
            after this item reaches <code>release-ready</code> and its
            source-free image passes the private boundary gate.
          </p>
        )}
      </section>
      <section>
        <h2>Availability boundary</h2>
        <p>
          This item is not represented as purchasable or downloadable.
          Protected delivery remains gated on approved commercial terms,
          server-side entitlement, a verified release archive, and production
          service approval.
        </p>
        <p>
          <Link href={`/blocks/${category.slug}`}>
            Return to {category.name}
          </Link>
        </p>
      </section>
    </PublicTextPage>
  );
}
