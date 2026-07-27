import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "../../components/SiteChrome";
import {
  articleUrl,
  articles,
  formatArticleDate,
  getArticle,
  siteUrl,
} from "../../data/articles";

export function generateStaticParams() {
  return articles.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};

  return {
    title: `${article.title} · Gummy UI`,
    description: article.description,
    authors: [{ name: article.author }],
    creator: article.author,
    publisher: article.author,
    alternates: { canonical: articleUrl(article) },
    openGraph: {
      type: "article",
      url: articleUrl(article),
      title: article.title,
      description: article.description,
      siteName: "Gummy UI",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.author],
      images: [
        {
          url: `${siteUrl}/og.png`,
          width: 1200,
          height: 630,
          alt: "Gummy UI product composition",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
      images: [`${siteUrl}/og.png`],
    },
  };
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    url: articleUrl(article),
    mainEntityOfPage: articleUrl(article),
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      "@type": "Organization",
      name: article.author,
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Gummy UI",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/favicon.svg`,
      },
    },
    image: `${siteUrl}/og.png`,
    isPartOf: {
      "@type": "Blog",
      name: "Gummy UI articles",
      url: `${siteUrl}/blog`,
    },
  };

  return (
    <>
      <a className="skip-link" href="#article-content">
        Skip to article
      </a>
      <SiteHeader />
      <main id="article-content">
        <article className="public-page">
          <header className="public-page__hero">
            <p className="showcase-kicker">{article.eyebrow}</p>
            <h1>{article.title}</h1>
            <p>{article.description}</p>
          </header>
          <div className="public-page__content">
            <section aria-label="Article details">
              <p>
                By <strong>{article.author}</strong>
                {" · Published "}
                <time dateTime={article.publishedAt}>
                  {formatArticleDate(article.publishedAt)}
                </time>
                {article.updatedAt !== article.publishedAt ? (
                  <>
                    {" · Updated "}
                    <time dateTime={article.updatedAt}>
                      {formatArticleDate(article.updatedAt)}
                    </time>
                  </>
                ) : null}
              </p>
              <nav aria-label="Breadcrumb">
                <Link href="/blog">Articles</Link>
                {" / "}
                <span aria-current="page">{article.title}</span>
              </nav>
            </section>
            {article.sections.map((section) => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ))}
            <section aria-labelledby="continue-title">
              <h2 id="continue-title">Continue with the implementation</h2>
              <ul className="public-page__link-list">
                {article.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                    <span aria-hidden="true">→</span>
                  </li>
                ))}
              </ul>
              <p>
                <Link href="/blog">Return to all Gummy UI articles</Link>
              </p>
            </section>
          </div>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c"),
            }}
          />
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
