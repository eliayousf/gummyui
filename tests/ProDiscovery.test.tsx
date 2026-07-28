import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ProBlockDetailPage, {
  generateMetadata as generateBlockMetadata,
  generateStaticParams as generateBlockParams,
} from "../app/blocks/[category]/[slug]/page";
import ProBlockCategoryPage, {
  generateStaticParams as generateCategoryParams,
} from "../app/blocks/[category]/page";
import ProTemplateDetailPage, {
  generateMetadata as generateTemplateMetadata,
  generateStaticParams as generateTemplateParams,
} from "../app/templates/[slug]/page";
import ProTemplatePreviewPage, {
  generateMetadata as generatePreviewMetadata,
  generateStaticParams as generatePreviewParams,
} from "../app/templates/[slug]/preview/page";
import { metadata as designKitMetadata } from "../app/design-kit/page";
import {
  proBlockCount,
  proCategoryCount,
  proTemplateCount,
} from "../app/data/pro-catalogue";
import robots from "../app/robots";
import sitemap from "../app/sitemap";

describe("boundary-safe Pro discovery", () => {
  it("provides one category and source-free detail route for every manifest block", async () => {
    const categoryParams = generateCategoryParams();
    const blockParams = generateBlockParams();

    expect(categoryParams).toHaveLength(proCategoryCount);
    expect(blockParams).toHaveLength(proBlockCount);
    expect(new Set(blockParams.map(({ category, slug }) => `${category}/${slug}`)).size)
      .toBe(proBlockCount);

    const categoryHtml = renderToStaticMarkup(
      await ProBlockCategoryPage({
        params: Promise.resolve({ category: "about" }),
      }),
    );
    const blockHtml = renderToStaticMarkup(
      await ProBlockDetailPage({
        params: Promise.resolve({
          category: "about",
          slug: "origin-ribbon",
        }),
      }),
    );
    const metadata = await generateBlockMetadata({
      params: Promise.resolve({
        category: "about",
        slug: "origin-ribbon",
      }),
    });

    expect(categoryHtml).toContain("Origin ribbon");
    expect(blockHtml).toContain("No public preview is published");
    expect(blockHtml).not.toMatch(
      /gummyui-pro|\.tsx|releasePath|implementationEvidence|sourceReference|\/Users\//,
    );
    expect(metadata.alternates).toEqual({ canonical: "/blocks/about/origin-ribbon" });
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
  });

  it("provides source-free status and isolated image-preview routes for all six templates", async () => {
    const templateParams = generateTemplateParams();
    const previewParams = generatePreviewParams();

    expect(templateParams).toHaveLength(proTemplateCount);
    expect(previewParams).toEqual(templateParams);

    const templateHtml = renderToStaticMarkup(
      await ProTemplateDetailPage({
        params: Promise.resolve({ slug: "relay-forge" }),
      }),
    );
    const previewHtml = renderToStaticMarkup(
      await ProTemplatePreviewPage({
        params: Promise.resolve({ slug: "relay-forge" }),
      }),
    );
    const templateMetadata = await generateTemplateMetadata({
      params: Promise.resolve({ slug: "relay-forge" }),
    });
    const previewMetadata = await generatePreviewMetadata({
      params: Promise.resolve({ slug: "relay-forge" }),
    });

    expect(templateHtml).toContain("Relay Forge");
    expect(templateHtml).toContain("Implemented does not mean verified");
    expect(previewHtml).toContain("No public image has been approved");
    expect(previewHtml).toContain("image-only");
    expect(`${templateHtml}${previewHtml}`).not.toMatch(
      /gummyui-pro|\.tsx|releasePath|implementationEvidence|sourceReference|\/Users\//,
    );
    expect(templateMetadata.alternates).toEqual({
      canonical: "/templates/relay-forge",
    });
    expect(previewMetadata.robots).toMatchObject({
      index: false,
      follow: false,
      noarchive: true,
    });
    expect(designKitMetadata.robots).toMatchObject({
      index: true,
      follow: true,
    });
    const robotRules = JSON.stringify(robots());
    for (const route of [
      "/pro",
      "/blocks",
      "/templates",
      "/design-kit",
      "/templates/*/preview",
    ]) {
      expect(robotRules).toContain(route);
    }
    const sitemapUrls = new Set(sitemap().map(({ url }) => url));
    for (const route of ["/pro", "/blocks", "/templates", "/design-kit"]) {
      expect(sitemapUrls.has(`https://gummyui.dev${route}`)).toBe(true);
    }
  });
});
