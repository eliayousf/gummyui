import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicTextPage } from "../../components/PublicTextPage";
import {
  getProBlockCategory,
  getProBlocksByCategory,
  proBlockCategories,
} from "../../data/pro-catalogue";

export function generateStaticParams() {
  return proBlockCategories.map(({ slug: category }) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = getProBlockCategory(categorySlug);
  if (!category) return {};
  return {
    title: `${category.name} Gummy UI Pro blocks · Implementation status`,
    description: `Review boundary-safe implementation, state, preview, manual verification, protected release, entitlement, and purchase status for ${category.count} original ${category.name} compositions in Gummy UI Pro.`,
    alternates: { canonical: `/blocks/${category.slug}` },
    robots: { index: true, follow: true },
  };
}

export default async function ProBlockCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categorySlug } = await params;
  const category = getProBlockCategory(categorySlug);
  if (!category) notFound();
  const blocks = getProBlocksByCategory(category.slug);

  return (
    <PublicTextPage
      eyebrow={`Private Pro category · ${blocks.length} compositions`}
      title={category.name}
      lede={`${category.purpose} These records are manifest-derived and source-free; an implemented status does not imply manual verification, release readiness, entitlement protection, or availability for purchase.`}
    >
      <section>
        <h2>Manifest items</h2>
        <ul className="public-page__link-list">
          {blocks.map((block) => (
            <li key={block.id}>
              <Link href={`/blocks/${category.slug}/${block.slug}`}>
                {block.name}
              </Link>
              <span>{block.status}</span>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2>Boundary</h2>
        <p>
          Public pages contain only approved names, purposes, dependency
          aliases, requirements, status, and any future reviewed image preview.
          Editable paid source, test paths, release locations, and entitlement
          details remain private.
        </p>
        <p><Link href="/blocks">Return to all Pro block categories</Link></p>
      </section>
    </PublicTextPage>
  );
}
