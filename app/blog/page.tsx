import type { Metadata } from "next";
import Link from "next/link";
import { PublicTextPage } from "../components/PublicTextPage";
import { articles, formatArticleDate, siteUrl } from "../data/articles";

export const metadata: Metadata = {
  title: "Gummy UI articles · Accessible React and design systems",
  description:
    "Original Gummy UI field notes on accessible React component architecture, Gel Pop material, registry delivery, RTL, themes, testing, and honest product status.",
  alternates: {
    canonical: `${siteUrl}/blog`,
    types: {
      "application/rss+xml": `${siteUrl}/rss.xml`,
    },
  },
};

export default function BlogIndexPage() {
  return (
    <PublicTextPage
      eyebrow={`${articles.length} original field notes`}
      title="Design decisions, in the open."
      lede="Practical articles grounded in the implemented public component source, its documented behavior, and the work that still remains before production launch."
    >
      <section aria-labelledby="articles-title">
        <h2 id="articles-title">All articles</h2>
        <p>
          These articles explain current Gummy UI decisions without inventing
          customers, performance results, compatibility, or unavailable product
          capabilities. <a href="/rss.xml">Subscribe through RSS</a>.
        </p>
        <div className="public-page__grid">
          {articles.map((article) => (
            <article key={article.slug}>
              <p className="showcase-kicker">{article.eyebrow}</p>
              <h3>
                <Link href={`/blog/${article.slug}`}>{article.title}</Link>
              </h3>
              <p>{article.description}</p>
              <p>
                <span>By {article.author}</span>
                {" · "}
                <time dateTime={article.publishedAt}>
                  {formatArticleDate(article.publishedAt)}
                </time>
              </p>
            </article>
          ))}
        </div>
      </section>
      <section>
        <h2>Follow the source</h2>
        <p>
          Pair the editorial context with the <Link href="/components">component
          catalogue</Link>, <Link href="/docs">implementation documentation</Link>,
          and <Link href="/registry">editable-source registry</Link>. Product
          availability and launch gates remain explicit on the relevant status
          pages.
        </p>
      </section>
    </PublicTextPage>
  );
}
