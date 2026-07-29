import type { Metadata } from "next";
import Link from "next/link";
import { PublicTextPage } from "./components/PublicTextPage";

export const metadata: Metadata = {
  title: "Page not found · Gummy UI",
  description:
    "The requested Gummy UI page could not be found. Continue to the public component catalogue, documentation, pricing, or support.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFoundPage() {
  return (
    <PublicTextPage
      eyebrow="404 · Page not found"
      title="This page is not here."
      lede="The address may have changed or the link may be incomplete. Nothing has been charged and no account action has been taken."
    >
      <section>
        <h2>Choose a verified route</h2>
        <p>
          Browse the public component catalogue, read the documentation, or
          review Gummy UI Pro pricing and licence terms before purchasing.
        </p>
        <p>
          <Link href="/components">Browse components</Link>
          {" · "}
          <Link href="/docs">Read the docs</Link>
          {" · "}
          <Link href="/pro">Review Gummy UI Pro</Link>
        </p>
      </section>
      <section>
        <h2>Still stuck?</h2>
        <p>
          Email <a href="mailto:support@kreydlabs.com">support@kreydlabs.com</a>{" "}
          with the address you expected to open. Never include passwords,
          recovery codes, payment details, or licence files.
        </p>
      </section>
    </PublicTextPage>
  );
}
