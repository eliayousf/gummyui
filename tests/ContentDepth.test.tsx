import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ProBlockCategoryPage from "../app/blocks/[category]/page";
import ChangelogPage from "../app/changelog/page";
import CommunityPage from "../app/community/page";
import CommunitySubmitPage from "../app/community/submit/page";
import ComponentDetailPage from "../app/components/[slug]/page";
import DesignKitPage from "../app/design-kit/page";
import LicensePage from "../app/license/page";
import LocalesPage from "../app/locales/page";
import McpPage from "../app/mcp/page";
import ProPage from "../app/pro/page";
import RtlPage from "../app/rtl/page";
import SecurityPage from "../app/security/page";
import StudioPage from "../app/studio/page";
import ProTemplateDetailPage from "../app/templates/[slug]/page";
import TemplatesPage from "../app/templates/page";
import {
  proBlockCategories,
  proTemplates,
} from "../app/data/pro-catalogue";

const auditAffectedComponentSlugs = [
  "alert",
  "aspect-ratio",
  "avatar",
  "breadcrumb",
  "button-group",
  "checkbox",
  "combobox",
  "command",
  "date-picker",
  "empty",
  "input-group",
  "kbd",
  "native-select",
  "pagination",
  "progress",
  "separator",
  "sidebar",
  "skeleton",
  "spinner",
  "table",
  "textarea",
  "typography",
] as const;

function mainWordCount(markup: string): number {
  const main = markup.match(/<main\b[^>]*>([\s\S]*?)<\/main>/iu)?.[1] ?? "";
  const visibleText = main
    .replace(/<(script|style|noscript|svg)\b[\s\S]*?<\/\1>/giu, " ")
    .replace(/<[^>]+>/gu, " ")
    .replace(/&(?:nbsp|#160);/giu, " ")
    .replace(/&(?:amp|#38);/giu, "&")
    .replace(/&(?:quot|#34);/giu, "\"")
    .replace(/&(?:apos|#39|#x27);/giu, "'")
    .replace(/&(?:lt|#60);/giu, "<")
    .replace(/&(?:gt|#62);/giu, ">");

  return visibleText.match(
    /[\p{L}\p{N}]+(?:['’.-][\p{L}\p{N}]+)*/gu,
  )?.length ?? 0;
}

function expectSubstantiveMain(markup: string) {
  expect(mainWordCount(markup)).toBeGreaterThanOrEqual(300);
}

describe("audit-facing content depth", () => {
  it("keeps every indexable Pro block category above the thin-content floor", async () => {
    for (const category of proBlockCategories) {
      const page = await ProBlockCategoryPage({
        params: Promise.resolve({ category: category.slug }),
      });
      expectSubstantiveMain(renderToStaticMarkup(page));
    }
  });

  it("keeps every audit-affected component detail above the thin-content floor", async () => {
    for (const slug of auditAffectedComponentSlugs) {
      const page = await ComponentDetailPage({
        params: Promise.resolve({ slug }),
      });
      expectSubstantiveMain(renderToStaticMarkup(page));
    }
  });

  it("keeps the template index and every template detail above the thin-content floor", async () => {
    expectSubstantiveMain(renderToStaticMarkup(<TemplatesPage />));

    for (const template of proTemplates) {
      const page = await ProTemplateDetailPage({
        params: Promise.resolve({ slug: template.slug }),
      });
      expectSubstantiveMain(renderToStaticMarkup(page));
    }
  });

  it.each([
    ["changelog", ChangelogPage],
    ["community", CommunityPage],
    ["community submission", CommunitySubmitPage],
    ["design kit", DesignKitPage],
    ["licence", LicensePage],
    ["locales", LocalesPage],
    ["MCP", McpPage],
    ["Pro", ProPage],
    ["RTL", RtlPage],
    ["security", SecurityPage],
    ["studio", StudioPage],
  ])("keeps the %s page above the thin-content floor", (_name, Page) => {
    expectSubstantiveMain(renderToStaticMarkup(<Page />));
  });
});
