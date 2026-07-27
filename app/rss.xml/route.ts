import { articleUrl, articles, siteUrl } from "../data/articles";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function rssDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toUTCString();
}

export function GET() {
  const latestUpdate = [...articles]
    .map(({ updatedAt }) => updatedAt)
    .sort()
    .at(-1)!;
  const items = articles
    .map(
      (article) => `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${articleUrl(article)}</link>
      <guid isPermaLink="true">${articleUrl(article)}</guid>
      <description>${escapeXml(article.description)}</description>
      <dc:creator>${escapeXml(article.author)}</dc:creator>
      <pubDate>${rssDate(article.publishedAt)}</pubDate>
    </item>`,
    )
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Gummy UI articles</title>
    <link>${siteUrl}/blog</link>
    <description>Original field notes about the implemented Gummy UI component system.</description>
    <language>en-gb</language>
    <lastBuildDate>${rssDate(latestUpdate)}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=3600",
      "x-content-type-options": "nosniff",
    },
  });
}
