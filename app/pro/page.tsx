import type { Metadata } from "next";
import Link from "next/link";
import { PublicTextPage } from "../components/PublicTextPage";
import {
  proBlockCount,
  proCategoryCount,
  proCatalogueStatus,
  proDesignKitDefinitionCount,
  proDesignKitMaterializerVersion,
  proDesignKitStatus,
  proImplementedBlockCount,
  proImplementedTemplateCount,
  proSpecifiedBlockCount,
  proTemplateCount,
} from "../data/pro-catalogue";

export const metadata: Metadata = {
  title: "Gummy UI Pro implementation and release status",
  description: "Review boundary-safe implementation, verification, release, entitlement, and purchase status for Gummy UI Pro blocks, templates, and the design kit.",
  alternates: { canonical: "/pro" },
  robots: { index: true, follow: true },
};

export default function ProPage() {
  return (
    <PublicTextPage
      eyebrow={`Private catalogue · ${proCatalogueStatus}`}
      title="Pro is implemented and awaiting release review."
      lede={`${proImplementedBlockCount} private blocks and ${proImplementedTemplateCount} templates have responsive source and automated implementation evidence; ${proSpecifiedBlockCount} blocks remain specifications. No paid item is yet human-approved, release-ready, entitlement-protected, or purchasable.`}
    >
      <section>
        <h2>Approved specification envelope</h2>
        <div className="public-page__grid">
          <article><h3>{proBlockCount} blocks</h3><p>{proImplementedBlockCount} implemented and {proSpecifiedBlockCount} specified across {proCategoryCount} original categories; source remains private and status-gated.</p><Link href="/blocks">Review categories</Link></article>
          <article><h3>{proTemplateCount} templates</h3><p>{proImplementedTemplateCount} original complete products have private route, state, test, build, documentation, and preview evidence; manual and release gates remain.</p><Link href="/templates">Review template status</Link></article>
          <article><h3>{proDesignKitDefinitionCount} definitions</h3><p>Local materializer v{proDesignKitMaterializerVersion} is {proDesignKitStatus}; Figma Starter execution passed, while founder review, export, and release remain gated.</p><Link href="/design-kit">Review design-kit status</Link></article>
          <article><h3>Boundary-safe previews</h3><p>Only reviewed metadata and source-free raster imagery may cross into the public product; compiled or minified paid code remains private.</p></article>
        </div>
      </section>
      <section>
        <h2>Commercial model approved</h2>
        <p>Individual, Team and Organization monthly, yearly and lifetime prices, seats, update access, commercial-use rights, refund policy, support target and selling entity are approved and documented. <Link href="/pricing">Review pricing</Link> or read the <Link href="/commercial-license">commercial licence</Link>.</p>
        <p>Checkout remains closed until founder manual QA and Figma design review/export, versioned release packaging, Stripe entitlement delivery and production verification pass. No waiting-list submission is active.</p>
      </section>
      <section>
        <h2>What a customer release must contain</h2>
        <p>
          A purchasable version will include the paid source and documentation
          promised for the entitled offer, packaged as an immutable archive
          with a version, manifest, and checksum. The archive must be built from
          the reviewed private commit, inspected for secrets and public/private
          boundary mistakes, restored from protected storage, and downloaded
          through an expiring server-authorized route. Public previews can help
          evaluate the product, but they are never the delivery mechanism.
        </p>
        <p>
          The account area must derive access from verified payment and licence
          records rather than a browser flag. It must handle successful and
          failed payment, renewal, cancellation, refund, team membership,
          invitation, export, and deletion consistently. Transactional email,
          support, monitoring, backup, restore, and rollback evidence are part
          of the release gate because receiving source is only one part of a
          dependable purchase.
        </p>
      </section>
      <section>
        <h2>What you can evaluate today</h2>
        <p>
          The source-free catalogue lets prospective customers inspect the
          intended categories, composition names, product routes, requirements,
          implementation status, and design-kit scope without opening the paid
          repository. Status language is deliberately conservative. No current
          page, disabled checkout control, or implemented count should be
          interpreted as an offer to buy, a promise of a release date, or proof
          that a manual review has passed.
        </p>
      </section>
    </PublicTextPage>
  );
}
