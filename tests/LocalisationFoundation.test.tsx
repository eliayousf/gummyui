import { cleanup, render, screen } from "@testing-library/react";
import { readFile } from "node:fs/promises";
import { afterEach, describe, expect, it } from "vitest";
import { LocaleSwitcher } from "../app/components/LocaleSwitcher";
import LocalesPage from "../app/locales/page";
import {
  defaultLocaleCode,
  locales,
  pendingLocales,
  publishedLocales,
  requiredLocaleCodes,
} from "../app/data/locales";
import {
  absoluteLocaleAlternatesForPath,
  localeAlternatesForPath,
  localePath,
  negotiatePublishedLocale,
  resolveLocaleRequest,
} from "../app/i18n/routing";
import { metadata as localesPageMetadata } from "../app/locales/page";
import sitemap from "../app/sitemap";
import { GET as getLlms } from "../app/llms.txt/route";
import robots from "../app/robots";

afterEach(cleanup);

const benchmarkLocaleCodes = [
  "en",
  "fr",
  "es",
  "pt",
  "it",
  "nl",
  "id",
  "de",
  "pl",
  "tr",
  "vi",
  "ja",
  "zh-Hans",
  "ko",
  "hi",
  "ru",
  "uk",
  "fa",
  "he",
  "ar",
];

describe("localisation manifest", () => {
  it("covers the complete benchmark without claiming pending translations", () => {
    expect(requiredLocaleCodes).toEqual(benchmarkLocaleCodes);
    expect(locales.map(({ code }) => code)).toEqual(benchmarkLocaleCodes);
    expect(new Set(locales.map(({ code }) => code)).size).toBe(20);
    expect(publishedLocales.map(({ code }) => code)).toEqual(["en"]);
    expect(pendingLocales).toHaveLength(19);
    expect(
      pendingLocales.every(
        ({ status }) => status === "pending-linguistic-review",
      ),
    ).toBe(true);
    expect(defaultLocaleCode).toBe("en");
  });

  it("marks only Persian, Hebrew, and Arabic as right-to-left", () => {
    expect(
      locales
        .filter(({ direction }) => direction === "rtl")
        .map(({ code }) => code),
    ).toEqual(["fa", "he", "ar"]);
  });

  it("keeps the generated reviewer manifest aligned and fail-closed", async () => {
    const generated = JSON.parse(
      await readFile(
        "app/i18n/generated/locale-manifest.json",
        "utf8",
      ),
    );

    expect(generated.locales.map(({ code }: { code: string }) => code)).toEqual(
      benchmarkLocaleCodes,
    );
    expect(generated.publicationEligibility).toEqual({
      routeableLocaleCodes: ["en"],
      hreflangLocaleCodes: ["en"],
      sitemapLocaleCodes: ["en"],
    });
    expect(
      generated.locales
        .filter(({ code }: { code: string }) => code !== "en")
        .every(
          (locale: {
            dictionaryPath: null;
            reviewer: null;
            reviewApproval: null;
            eligibleForRouting: boolean;
            eligibleForHreflang: boolean;
            eligibleForSitemap: boolean;
            publicationGate: string;
          }) =>
            locale.dictionaryPath === null &&
            locale.reviewer === null &&
            locale.reviewApproval === null &&
            !locale.eligibleForRouting &&
            !locale.eligibleForHreflang &&
            !locale.eligibleForSitemap &&
            locale.publicationGate === "closed",
        ),
    ).toBe(true);
  });
});

describe("published-locale routing", () => {
  it("negotiates only reviewed locales", () => {
    expect(negotiatePublishedLocale("fr-FR,fr;q=0.9").code).toBe("en");
    expect(negotiatePublishedLocale("ar,en;q=0.4").code).toBe("en");
    expect(negotiatePublishedLocale("en-GB;q=0.7").code).toBe("en");
    expect(
      resolveLocaleRequest({ pathname: "/FR/components/button" }),
    ).toMatchObject({
      requestedLocale: { code: "fr" },
      status: "unavailable-locale",
    });
  });

  it("makes pending prefixes unavailable instead of serving English under them", () => {
    expect(
      resolveLocaleRequest({
        pathname: "/fr/components/button",
        acceptLanguage: "fr",
      }),
    ).toMatchObject({
      locale: { code: "en" },
      requestedLocale: { code: "fr" },
      pathname: "/components/button",
      status: "unavailable-locale",
    });
    expect(() => localePath("fr", "/components")).toThrow(
      /not published/,
    );

    for (const locale of pendingLocales) {
      expect(
        resolveLocaleRequest({
          pathname: `/${locale.code}/components/button`,
          acceptLanguage: locale.code,
        }),
      ).toMatchObject({
        locale: { code: "en" },
        requestedLocale: { code: locale.code },
        pathname: "/components/button",
        status: "unavailable-locale",
      });
      expect(() => localePath(locale.code, "/components/button")).toThrow(
        /not published/,
      );
    }
  });

  it("keeps reviewed English on the unprefixed canonical route", () => {
    expect(localePath("en", "/components/button/")).toBe(
      "/components/button",
    );
    expect(
      resolveLocaleRequest({
        pathname: "/components/button?view=preview",
        acceptLanguage: "en-GB",
      }),
    ).toMatchObject({
      locale: { code: "en" },
      requestedLocale: null,
      pathname: "/components/button",
      status: "published",
    });
  });
});

describe("locale discoverability", () => {
  it("keeps language cells as semantic row headers and data cells for each column", () => {
    const { container } = render(<LocalesPage />);
    const languageHeader = screen.getByRole("columnheader", {
      name: "Language",
    });
    const rowHeaders = screen.getAllByRole("rowheader");

    expect(languageHeader.tagName).toBe("TH");
    expect(rowHeaders).toHaveLength(locales.length);
    expect(rowHeaders.every((cell) => cell.tagName === "TD")).toBe(true);
    expect(
      container.querySelectorAll("tbody tr > td:first-child"),
    ).toHaveLength(locales.length);
  });

  it("emits hreflang equivalents for published pages only", () => {
    expect(localeAlternatesForPath("/components/button")).toEqual({
      en: "/components/button",
      "x-default": "/components/button",
    });
    expect(
      absoluteLocaleAlternatesForPath("/components/button"),
    ).toEqual({
      en: "https://gummyui.dev/components/button",
      "x-default": "https://gummyui.dev/components/button",
    });
    expect(localesPageMetadata.alternates).toEqual({
      canonical: "/locales",
      languages: {
        en: "/locales",
        "x-default": "/locales",
      },
    });

    for (const entry of sitemap()) {
      expect(entry.alternates?.languages).toEqual({
        en: entry.url,
        "x-default": entry.url,
      });
      expect(JSON.stringify(entry.alternates)).not.toMatch(
        /"(fr|es|pt|it|nl|id|de|pl|tr|vi|ja|zh-Hans|ko|hi|ru|uk|fa|he|ar)":/,
      );
    }
  });

  it("renders only published locales as switch targets", () => {
    render(<LocaleSwitcher currentPath="/components/button" />);

    const localeLinks = screen.getAllByRole("link");
    expect(
      localeLinks.find((link) => link.getAttribute("hreflang") === "en"),
    ).toHaveAttribute("href", "/components/button");
    expect(
      localeLinks.filter((link) => link.hasAttribute("hreflang")),
    ).toHaveLength(1);
    expect(
      screen.getByText("19 more locales are awaiting founder review and publication."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Français/ })).not.toBeInTheDocument();
  });

  it("makes the honest publication status discoverable", async () => {
    const llms = await getLlms().text();

    expect(llms).toContain(
      "Language publication status: https://gummyui.dev/locales",
    );
    expect(llms).toContain(
      "https://gummyui.dev/docs/markdown/guides/localisation.md",
    );
    expect(JSON.stringify(robots())).toContain("/locales");
  });
});
