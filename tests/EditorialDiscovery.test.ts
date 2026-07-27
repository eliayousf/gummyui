import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  articleUrl,
  articles,
  getArticle,
} from "../app/data/articles";
import {
  generateMetadata,
  generateStaticParams,
} from "../app/blog/[slug]/page";
import { GET as getRss } from "../app/rss.xml/route";
import { GET as getLlms } from "../app/llms.txt/route";
import robots from "../app/robots";
import sitemap from "../app/sitemap";

function wordCount(value: string): number {
  return value.match(/\S+/g)?.length ?? 0;
}

describe("launch editorial manifest", () => {
  it("contains exactly 18 unique, substantial original articles", () => {
    expect(articles).toHaveLength(18);
    expect(new Set(articles.map(({ slug }) => slug)).size).toBe(18);
    expect(new Set(articles.map(({ title }) => title)).size).toBe(18);
    expect(new Set(articles.map(({ description }) => description)).size).toBe(18);

    for (const article of articles) {
      const paragraphs = article.sections.flatMap(
        ({ paragraphs: sectionParagraphs }) => sectionParagraphs,
      );
      const body = paragraphs.join(" ");

      expect(article.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(article.author).toBe("Gummy UI");
      expect(article.description.length).toBeGreaterThanOrEqual(120);
      expect(article.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(article.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(article.sections.length).toBeGreaterThanOrEqual(4);
      expect(paragraphs.length).toBeGreaterThanOrEqual(8);
      expect(wordCount(body)).toBeGreaterThanOrEqual(250);
      expect(new Set(article.sections.map(({ heading }) => heading)).size).toBe(
        article.sections.length,
      );
      expect(article.links.length).toBeGreaterThanOrEqual(3);
      expect(article.links.every(({ href }) => href.startsWith("/"))).toBe(true);
      expect(getArticle(article.slug)).toBe(article);
    }
  });

  it("creates one static route with canonical authorship metadata per article", async () => {
    expect(generateStaticParams()).toEqual(
      articles.map(({ slug }) => ({ slug })),
    );

    for (const article of articles) {
      const metadata = await generateMetadata({
        params: Promise.resolve({ slug: article.slug }),
      });
      expect(metadata.title).toBe(`${article.title} · Gummy UI`);
      expect(metadata.description).toBe(article.description);
      expect(metadata.authors).toEqual([{ name: "Gummy UI" }]);
      expect(metadata.alternates).toEqual({ canonical: articleUrl(article) });
      expect(metadata.openGraph).toMatchObject({
        type: "article",
        url: articleUrl(article),
        title: article.title,
        publishedTime: article.publishedAt,
        modifiedTime: article.updatedAt,
        authors: ["Gummy UI"],
      });
    }
  });

  it("renders semantic article structure and Article JSON-LD", async () => {
    const source = await readFile(
      path.join(process.cwd(), "app/blog/[slug]/page.tsx"),
      "utf8",
    );

    expect(source).toMatch(/<article className="public-page">/);
    expect(source).toMatch(/<section aria-label="Article details">/);
    expect(source).toMatch(/<time dateTime=/);
    expect(source).toMatch(/<nav aria-label="Breadcrumb">/);
    expect(source).toMatch(/"@type": "Article"/);
    expect(source).toMatch(/type="application\/ld\+json"/);
  });
});

describe("editorial discovery routes", () => {
  it("publishes every article through a valid RSS feed", async () => {
    const response = getRss();
    const body = await response.text();

    expect(response.headers.get("content-type")).toBe(
      "application/rss+xml; charset=utf-8",
    );
    expect(body).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(body.match(/<item>/g)).toHaveLength(18);
    expect(body).toContain(
      '<atom:link href="https://gummyui.dev/rss.xml" rel="self" type="application/rss+xml" />',
    );
    for (const article of articles) {
      expect(body).toContain(`<link>${articleUrl(article)}</link>`);
      expect(body).toContain(`<dc:creator>${article.author}</dc:creator>`);
    }
  });

  it("includes the blog and every canonical article in sitemap and llms.txt", async () => {
    const sitemapUrls = new Set(sitemap().map(({ url }) => url));
    const llms = await getLlms().text();

    expect(sitemapUrls.has("https://gummyui.dev/blog")).toBe(true);
    expect(llms).toContain("Original articles: https://gummyui.dev/blog");
    expect(llms).toContain("Article RSS: https://gummyui.dev/rss.xml");
    expect(llms).toContain(`## Original articles (${articles.length})`);
    expect(JSON.stringify(robots())).toContain("/blog/");
    expect(JSON.stringify(robots())).toContain("/rss.xml");

    for (const article of articles) {
      expect(sitemapUrls.has(articleUrl(article))).toBe(true);
      expect(llms).toContain(
        `[${article.title}](${articleUrl(article)}): ${article.description}`,
      );
    }
  });
});
