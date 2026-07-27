import type { Metadata } from "next";
import Link from "next/link";
import { PublicTextPage } from "../components/PublicTextPage";
import { accountPublicCopy } from "../../lib/commerce/account";

const copy = accountPublicCopy.checkout;

export const metadata: Metadata = {
  title: copy.metadataTitle,
  description: copy.metadataDescription,
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
  },
};

export default function CheckoutUnavailablePage() {
  return (
    <PublicTextPage
      eyebrow={copy.eyebrow}
      title={copy.title}
      lede={copy.lede}
    >
      <section>
        <h2>{copy.sections[0].title}</h2>
        <p>{copy.sections[0].body}</p>
      </section>
      <section>
        <h2>{copy.sections[1].title}</h2>
        <p>{copy.sections[1].body}</p>
        <Link href="/pro">{copy.sections[1].action}</Link>
      </section>
    </PublicTextPage>
  );
}
