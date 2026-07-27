import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/components/",
        "/docs/",
        "/registry",
        "/themes",
        "/rtl",
        "/locales",
        "/mcp",
        "/blog/",
        "/rss.xml",
        "/changelog.xml",
        "/llms.txt",
      ],
      disallow: [
        "/api/",
        "/sign-in",
        "/account",
        "/account/",
        "/checkout",
        "/checkout/",
        "/downloads/",
        "/components/lab",
        "/pro",
        "/blocks",
        "/blocks/",
        "/templates",
        "/templates/",
        "/design-kit",
        "/pricing",
        "/terms",
        "/preview/private/",
        "/templates/*/preview",
      ],
    },
    sitemap: "https://gummyui.dev/sitemap.xml",
    host: "https://gummyui.dev",
  };
}
