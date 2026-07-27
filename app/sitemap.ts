import type { MetadataRoute } from "next";
import { articles } from "./data/articles";
import { components } from "./data/catalogue";
import { markdownGuideSlugs } from "./data/markdown-docs";
import { absoluteLocaleAlternatesForPath } from "./i18n/routing";

const baseUrl = "https://gummyui.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/components",
    "/docs",
    "/docs/nextjs",
    "/docs/vite",
    "/docs/editor-setup",
    "/docs/troubleshooting",
    "/registry",
    "/themes",
    "/studio",
    "/community",
    "/community/submit",
    "/rtl",
    "/mcp",
    "/locales",
    "/accessibility",
    "/security",
    "/support",
    "/contact",
    "/license",
    "/commercial-license",
    "/refund",
    "/changelog",
    "/changelog.xml",
    "/blog",
    "/privacy",
  ];
  return [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route || "/"}`,
      lastModified: new Date("2026-07-26"),
      changeFrequency: route === "" ? "weekly" as const : "monthly" as const,
      priority: route === "" ? 1 : route === "/components" ? 0.9 : 0.7,
      alternates: {
        languages: absoluteLocaleAlternatesForPath(route),
      },
    })),
    ...components.map((component) => ({
      url: `${baseUrl}/components/${component.slug}`,
      lastModified: new Date("2026-07-26"),
      changeFrequency: "monthly" as const,
      priority: 0.8,
      alternates: {
        languages: absoluteLocaleAlternatesForPath(
          `/components/${component.slug}`,
        ),
      },
    })),
    {
      url: `${baseUrl}/docs/markdown/catalogue.md`,
      lastModified: new Date("2026-07-26"),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: {
        languages: absoluteLocaleAlternatesForPath(
          "/docs/markdown/catalogue.md",
        ),
      },
    },
    ...components.map((component) => ({
      url: `${baseUrl}/docs/markdown/components/${component.slug}.md`,
      lastModified: new Date("2026-07-26"),
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: {
        languages: absoluteLocaleAlternatesForPath(
          `/docs/markdown/components/${component.slug}.md`,
        ),
      },
    })),
    ...markdownGuideSlugs.map((guide) => ({
      url: `${baseUrl}/docs/markdown/guides/${guide}.md`,
      lastModified: new Date("2026-07-26"),
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: {
        languages: absoluteLocaleAlternatesForPath(
          `/docs/markdown/guides/${guide}.md`,
        ),
      },
    })),
    ...articles.map((article) => ({
      url: `${baseUrl}/blog/${article.slug}`,
      lastModified: new Date(article.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: {
        languages: absoluteLocaleAlternatesForPath(
          `/blog/${article.slug}`,
        ),
      },
    })),
  ];
}
