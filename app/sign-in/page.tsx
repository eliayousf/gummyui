import type { Metadata } from "next";
import Link from "next/link";
import { PublicTextPage } from "../components/PublicTextPage";
import { accountPublicCopy } from "../../lib/commerce/account";

const copy = accountPublicCopy.signIn;

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

export default function SignInPage() {
  return (
    <PublicTextPage
      eyebrow={copy.eyebrow}
      title={copy.title}
      lede={copy.lede}
    >
      <section>
        <h2>{copy.sections[0].title}</h2>
        <p>{copy.sections[0].body}</p>
        <Link href="/auth/sign-in">{copy.sections[0].action}</Link>
      </section>
      <section>
        <h2>{copy.sections[1].title}</h2>
        <p>{copy.sections[1].body}</p>
        <Link href="/components">{copy.sections[1].action}</Link>
      </section>
    </PublicTextPage>
  );
}
