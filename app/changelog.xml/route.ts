import { publicReleases } from "../data/changelog";

const siteUrl = "https://gummyui.dev";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function rssDate(date: string) {
  return new Date(`${date}T12:00:00Z`).toUTCString();
}

export function GET() {
  const items = publicReleases
    .map((release) => `    <item>
      <title>${escapeXml(`Gummy UI ${release.version}: ${release.title}`)}</title>
      <link>${siteUrl}/changelog#v${release.version.replaceAll(".", "-")}</link>
      <guid isPermaLink="false">gummyui-public-${release.version}</guid>
      <description>${escapeXml(release.copy)}</description>
      <pubDate>${rssDate(release.date)}</pubDate>
    </item>`)
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Gummy UI public changelog</title>
    <link>${siteUrl}/changelog</link>
    <description>Versioned changes to the MIT-licensed Gummy UI component catalogue and registry.</description>
    <language>en-gb</language>
    <lastBuildDate>${rssDate(publicReleases[0].date)}</lastBuildDate>
    <atom:link href="${siteUrl}/changelog.xml" rel="self" type="application/rss+xml" />
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
