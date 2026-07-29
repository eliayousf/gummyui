import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicTextPage } from "../../components/PublicTextPage";
import {
  getProBlockCategory,
  getProBlocksByCategory,
  isProBlockDiscoverable,
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
    title: `${category.name} React UI Pro blocks · Gummy UI`,
    description: `Explore ${category.count} original ${category.name} React UI compositions, their implementation status, and the source-free review and release boundary for Gummy UI Pro.`,
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
  const statuses = [...new Set(blocks.map(({ status }) => status))];
  const dependencies = [
    ...new Set(blocks.flatMap(({ dependencies }) => dependencies)),
  ];
  const requirements = [
    ...new Set(blocks.flatMap(({ requirements }) => requirements)),
  ];

  return (
    <PublicTextPage
      eyebrow={`Private Pro category · ${blocks.length} compositions`}
      title={category.name}
      lede={`${category.purpose} These records are manifest-derived and source-free; an implemented status does not imply manual verification, release readiness, entitlement protection, or availability for purchase.`}
    >
      <section>
        <h2>Manifest items</h2>
        <p>
          {statuses.length === 1
            ? `All ${blocks.length} records currently carry ${statuses[0]} status.`
            : `These ${blocks.length} records currently span ${statuses.join(", ")} status.`}
          {" "}A dedicated detail becomes internally discoverable only after
          release readiness and a reviewed public preview.
        </p>
        <ul className="pro-block-manifest">
          {blocks.map((block) => {
            const discoverable = isProBlockDiscoverable(block);
            return (
              <li id={block.slug} key={block.id}>
                <article className="pro-block-record">
                  <header>
                    <h3>
                      {discoverable ? (
                        <Link href={`/blocks/${category.slug}/${block.slug}`}>
                          {block.name}
                        </Link>
                      ) : block.name}
                    </h3>
                    {statuses.length > 1 ? <span>{block.status}</span> : null}
                  </header>
                </article>
              </li>
            );
          })}
        </ul>
      </section>
      <section>
        <h2>Category contract</h2>
        <dl>
          <div>
            <dt>Purpose</dt>
            <dd>{category.purpose}</dd>
          </div>
          <div>
            <dt>Declared dependencies</dt>
            <dd>{dependencies.join(", ") || "None declared"}</dd>
          </div>
          <div>
            <dt>Required review</dt>
            <dd>{requirements.join(", ")}</dd>
          </div>
        </dl>
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
