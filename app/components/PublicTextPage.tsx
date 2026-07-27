import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "./SiteChrome";

export function PublicTextPage({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  children: ReactNode;
}) {
  return (
    <>
      <a className="skip-link" href="#public-page">Skip to content</a>
      <SiteHeader />
      <main id="public-page" className="public-page">
        <header className="public-page__hero">
          <p className="showcase-kicker">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{lede}</p>
        </header>
        <div className="public-page__content">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}
