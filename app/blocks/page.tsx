import type { Metadata } from "next";
import Link from "next/link";
import { PublicTextPage } from "../components/PublicTextPage";
import {
  proBlockCategories,
  proBlockCount,
  proCatalogueStatus,
  proImplementedBlockCount,
  proSpecifiedBlockCount,
} from "../data/pro-catalogue";

export const metadata: Metadata = {
  title: "Pro block catalogue specification · Gummy UI",
  description: "Review boundary-safe category counts, implementation, manual verification, protected release and purchase status for the private Gummy UI Pro block catalogue.",
  alternates: { canonical: "/blocks" },
  robots: { index: true, follow: true },
};

export default function BlocksPage() {
  return (
    <PublicTextPage
      eyebrow={`Private source · ${proCatalogueStatus}`}
      title={`${proBlockCount} original blocks in a gated private catalogue.`}
      lede={`${proImplementedBlockCount} have reached implemented status and ${proSpecifiedBlockCount} remain specified. The public site exposes no editable paid source, release location, entitlement detail, or unreviewed preview.`}
    >
      <section>
        <h2>Category envelope</h2>
        <div className="pro-category-grid">
          {proBlockCategories.map((category) => (
            <article key={category.slug}>
              <span>{category.count}</span>
              <h3>{category.name}</h3>
              <p>Status varies by manifest item; category counts do not imply release readiness.</p>
              <Link href={`/blocks/${category.slug}`}>Review {category.name} blocks</Link>
            </article>
          ))}
        </div>
      </section>
      <section>
        <h2>Availability</h2>
        <p>Implemented means responsive private source, state handling, automated block tests, public-component reuse contracts, actual private browser renders, and clean-download evidence exist. No block is represented as verified, release-ready, entitlement-protected, or purchasable; human multi-browser, real-device, assistive-technology, painted-contrast, design-kit, approved-archive, and production-entitlement gates remain.</p>
      </section>
    </PublicTextPage>
  );
}
