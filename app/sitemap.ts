import type { MetadataRoute } from "next";
import { articles } from "./data/articles";
import { components } from "./data/catalogue";
import {
  isProBlockDiscoverable,
  proBlockCategories,
  proBlocks,
  proTemplates,
} from "./data/pro-catalogue";
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
    "/terms",
    "/pro",
    "/blocks",
    "/templates",
    "/design-kit",
    "/pricing",
    "/changelog",
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
    ...proBlockCategories.map((category) => ({
      url: `${baseUrl}/blocks/${category.slug}`,
      lastModified: new Date("2026-07-28"),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: {
        languages: absoluteLocaleAlternatesForPath(
          `/blocks/${category.slug}`,
        ),
      },
    })),
    ...proBlocks.filter(isProBlockDiscoverable).map((block) => ({
      url: `${baseUrl}/blocks/${block.category}/${block.slug}`,
      lastModified: new Date("2026-07-28"),
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: {
        languages: absoluteLocaleAlternatesForPath(
          `/blocks/${block.category}/${block.slug}`,
        ),
      },
    })),
    ...proTemplates.map((template) => ({
      url: `${baseUrl}/templates/${template.slug}`,
      lastModified: new Date("2026-07-28"),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: {
        languages: absoluteLocaleAlternatesForPath(
          `/templates/${template.slug}`,
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
