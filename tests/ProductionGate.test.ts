import { describe, expect, it } from "vitest";
import packageJson from "../package.json";
import nextConfig from "../next.config";
import robots from "../app/robots";
import sitemap from "../app/sitemap";
import { metadata as blocksMetadata } from "../app/blocks/page";
import {
  generateMetadata as generateBlockCategoryMetadata,
} from "../app/blocks/[category]/page";
import {
  generateMetadata as generateBlockMetadata,
} from "../app/blocks/[category]/[slug]/page";
import { metadata as commercialLicenseMetadata } from "../app/commercial-license/page";
import { metadata as designKitMetadata } from "../app/design-kit/page";
import { metadata as pricingMetadata } from "../app/pricing/page";
import { metadata as privacyMetadata } from "../app/privacy/page";
import { metadata as proMetadata } from "../app/pro/page";
import { metadata as refundMetadata } from "../app/refund/page";
import { metadata as templatesMetadata } from "../app/templates/page";
import {
  generateMetadata as generateTemplateMetadata,
} from "../app/templates/[slug]/page";
import { metadata as termsMetadata } from "../app/terms/page";
import {
  isProBlockDiscoverable,
  proBlockCategories,
  proBlocks,
  proTemplates,
} from "../app/data/pro-catalogue";
import {
  SECURITY_HEADERS,
  SENSITIVE_PATH_PATTERN,
  STRICT_TRANSPORT_SECURITY,
} from "../worker/security";

function expectIndexable(metadata: {
  robots?: unknown;
}) {
  expect(metadata.robots).toMatchObject({
    index: true,
    follow: true,
  });
}

function expectNoindexFollow(metadata: {
  robots?: unknown;
}) {
  expect(metadata.robots).toMatchObject({
    index: false,
    follow: true,
  });
}

describe("production runtime contract", () => {
  it("pins Vercel and local builds to the supported Node 22 major", () => {
    expect(packageJson.engines.node).toBe(">=22.13.0 <23");
  });
});

describe("native Next production headers", () => {
  it("matches the worker security policy and hardens every sensitive family", async () => {
    expect(typeof nextConfig.headers).toBe("function");
    const routes = await nextConfig.headers?.();
    expect(routes).toBeDefined();
    const global = routes?.find(({ source }) => source === "/:path*");
    expect(global).toBeDefined();
    const globalHeaders = Object.fromEntries(
      (global?.headers ?? []).map(({ key, value }) => [key, value]),
    );
    expect(globalHeaders).toMatchObject({
      ...SECURITY_HEADERS,
      "Strict-Transport-Security": STRICT_TRANSPORT_SECURITY,
    });

    for (const source of [
      "/api/:path*",
      "/auth/:path*",
      "/sign-in",
      "/account",
      "/checkout",
      "/downloads/:path*",
    ]) {
      const route = routes?.find((candidate) => candidate.source === source);
      expect(route?.headers).toEqual(
        expect.arrayContaining([
          { key: "Cache-Control", value: "private, no-store" },
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive",
          },
        ]),
      );
    }
    for (const pathname of [
      "/api/health",
      "/auth/callback",
      "/sign-in",
      "/account",
      "/checkout",
      "/downloads/grant",
    ]) {
      expect(SENSITIVE_PATH_PATTERN.test(pathname)).toBe(true);
    }
  });

  it("redirects every alternate production host to the canonical HTTPS apex", async () => {
    expect(typeof nextConfig.redirects).toBe("function");
    const redirects = await nextConfig.redirects?.();
    for (const hostPattern of [
      "www\\.gummyui\\.dev",
      "gummyui\\.vercel\\.app",
    ]) {
      expect(redirects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            source: "/:path*",
            destination: "https://gummyui.dev/:path*",
            permanent: true,
            has: [{ type: "host", value: hostPattern }],
          }),
        ]),
      );
    }
  });
});

describe("commercial and Pro discovery contract", () => {
  it("keeps every public commercial and marketing landing page indexable", () => {
    for (const metadata of [
      pricingMetadata,
      proMetadata,
      blocksMetadata,
      templatesMetadata,
      designKitMetadata,
      commercialLicenseMetadata,
      refundMetadata,
      termsMetadata,
      privacyMetadata,
    ]) {
      expectIndexable(metadata);
    }
  });

  it("indexes category and template discovery while consolidating unreleased block details", async () => {
    const category = proBlockCategories[0];
    const block = proBlocks[0];
    const template = proTemplates[0];
    expect(category).toBeDefined();
    expect(block).toBeDefined();
    expect(template).toBeDefined();

    expectIndexable(
      await generateBlockCategoryMetadata({
        params: Promise.resolve({ category: category.slug }),
      }),
    );
    const blockMetadata = await generateBlockMetadata({
      params: Promise.resolve({
        category: block.category,
        slug: block.slug,
      }),
    });
    expectNoindexFollow(blockMetadata);
    expect(blockMetadata.alternates).toEqual({
      canonical: `/blocks/${block.category}`,
    });
    expectIndexable(
      await generateTemplateMetadata({
        params: Promise.resolve({ slug: template.slug }),
      }),
    );
  });

  it("publishes substantive, bounded metadata for every Pro block category", async () => {
    for (const category of proBlockCategories) {
      const metadata = await generateBlockCategoryMetadata({
        params: Promise.resolve({ category: category.slug }),
      });
      expect(metadata.title).toBeTypeOf("string");
      expect(metadata.description).toBeTypeOf("string");
      expect(String(metadata.title).length).toBeGreaterThanOrEqual(30);
      expect(String(metadata.title).length).toBeLessThanOrEqual(60);
      expect(String(metadata.description).length).toBeGreaterThanOrEqual(120);
      expect(String(metadata.description).length).toBeLessThanOrEqual(160);
    }
  });

  it("aligns robots and sitemap with indexable canonicals", () => {
    const robotRules = robots().rules;
    expect(Array.isArray(robotRules)).toBe(false);
    if (Array.isArray(robotRules)) return;
    const allowed = new Set(
      Array.isArray(robotRules.allow)
        ? robotRules.allow
        : [robotRules.allow].filter(Boolean),
    );
    const disallowed = new Set(
      Array.isArray(robotRules.disallow)
        ? robotRules.disallow
        : [robotRules.disallow].filter(Boolean),
    );
    for (const route of [
      "/pro",
      "/blocks",
      "/templates",
      "/design-kit",
      "/pricing",
      "/commercial-license",
      "/refund",
      "/terms",
      "/privacy",
    ]) {
      expect(allowed.has(route) || allowed.has(`${route}/`)).toBe(true);
      expect(disallowed.has(route)).toBe(false);
      expect(disallowed.has(`${route}/`)).toBe(false);
    }
    expect(disallowed.has("/components/lab$")).toBe(true);
    expect(disallowed.has("/components/lab")).toBe(false);

    const sitemapPaths = new Set(
      sitemap().map(({ url }) => new URL(url).pathname),
    );
    for (const nonHtmlResource of [
      "/changelog.xml",
      "/docs/markdown/catalogue.md",
      "/docs/markdown/components/button.md",
      "/docs/markdown/guides/installation.md",
    ]) {
      expect(sitemapPaths.has(nonHtmlResource)).toBe(false);
    }
    for (const route of [
      "/pro",
      "/blocks",
      "/templates",
      "/design-kit",
      "/pricing",
      "/commercial-license",
      "/refund",
      "/terms",
      "/privacy",
    ]) {
      expect(sitemapPaths.has(route)).toBe(true);
    }
    for (const category of proBlockCategories) {
      expect(sitemapPaths.has(`/blocks/${category.slug}`)).toBe(true);
    }
    for (const block of proBlocks) {
      expect(
        sitemapPaths.has(`/blocks/${block.category}/${block.slug}`),
      ).toBe(isProBlockDiscoverable(block));
    }
    for (const template of proTemplates) {
      expect(sitemapPaths.has(`/templates/${template.slug}`)).toBe(true);
      expect(
        sitemapPaths.has(`/templates/${template.slug}/preview`),
      ).toBe(false);
    }
    for (const route of ["/sign-in", "/account", "/checkout"]) {
      expect(sitemapPaths.has(route)).toBe(false);
    }
  });
});
