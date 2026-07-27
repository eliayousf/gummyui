import {
  defaultLocaleCode,
  getLocale,
  isPublishedLocaleCode,
  locales,
  publishedLocales,
  type LocaleCode,
  type LocaleDefinition,
} from "../data/locales";

export const localeRouting = Object.freeze({
  defaultLocale: defaultLocaleCode,
  strategy: "unprefixed-default",
  /**
   * Locale prefixes become routeable only after their locale is published.
   * English is deliberately unprefixed.
   */
  publishedPrefixes: publishedLocales
    .filter(({ code }) => code !== defaultLocaleCode)
    .map(({ code }) => code),
});

function normalisePathname(pathname: string): string {
  const withoutQuery = pathname.split(/[?#]/, 1)[0] || "/";
  const withLeadingSlash = withoutQuery.startsWith("/")
    ? withoutQuery
    : `/${withoutQuery}`;

  return withLeadingSlash.length > 1
    ? withLeadingSlash.replace(/\/+$/, "")
    : withLeadingSlash;
}

function localeFromLanguageRange(range: string): LocaleDefinition | undefined {
  const normalised = range.trim().toLowerCase();
  const rangeBase = normalised.split("-")[0];

  return publishedLocales.find(({ code }) => {
    const candidate = code.toLowerCase();
    return candidate === normalised || candidate.split("-")[0] === rangeBase;
  });
}

export function negotiatePublishedLocale(
  acceptLanguage: string | null | undefined,
): LocaleDefinition {
  if (!acceptLanguage) {
    return getLocale(defaultLocaleCode)!;
  }

  const rankedRanges = acceptLanguage
    .split(",")
    .map((entry, index) => {
      const [range, ...parameters] = entry.trim().split(";");
      const qParameter = parameters.find((parameter) =>
        parameter.trim().startsWith("q="),
      );
      const quality = qParameter
        ? Number.parseFloat(qParameter.trim().slice(2))
        : 1;

      return {
        range,
        quality: Number.isFinite(quality) ? quality : 0,
        index,
      };
    })
    .filter(({ range, quality }) => range !== "*" && quality > 0)
    .sort((left, right) =>
      right.quality - left.quality || left.index - right.index,
    );

  for (const { range } of rankedRanges) {
    const locale = localeFromLanguageRange(range);
    if (locale) {
      return locale;
    }
  }

  return getLocale(defaultLocaleCode)!;
}

export interface LocaleRequestResolution {
  locale: LocaleDefinition;
  pathname: string;
  requestedLocale: LocaleDefinition | null;
  status: "published" | "unavailable-locale";
}

/**
 * Resolve a route without ever treating a pending locale as translated.
 * A host adapter can use `unavailable-locale` to serve a 404 or a language
 * status page; it must not silently expose English under that locale prefix.
 */
export function resolveLocaleRequest({
  pathname,
  acceptLanguage,
}: {
  pathname: string;
  acceptLanguage?: string | null;
}): LocaleRequestResolution {
  const normalisedPathname = normalisePathname(pathname);
  const [, firstSegment = "", ...remainingSegments] =
    normalisedPathname.split("/");
  const requestedLocale = getLocale(firstSegment);

  if (requestedLocale && !isPublishedLocaleCode(requestedLocale.code)) {
    return {
      locale: getLocale(defaultLocaleCode)!,
      pathname: `/${remainingSegments.join("/")}`.replace(/\/$/, "") || "/",
      requestedLocale,
      status: "unavailable-locale",
    };
  }

  if (requestedLocale) {
    return {
      locale: requestedLocale,
      pathname: `/${remainingSegments.join("/")}`.replace(/\/$/, "") || "/",
      requestedLocale,
      status: "published",
    };
  }

  return {
    locale: negotiatePublishedLocale(acceptLanguage),
    pathname: normalisedPathname,
    requestedLocale: null,
    status: "published",
  };
}

export function localePath(locale: LocaleCode, pathname: string): string {
  if (!isPublishedLocaleCode(locale)) {
    throw new Error(
      `Locale "${locale}" is not published and cannot receive a public route.`,
    );
  }

  const normalisedPathname = normalisePathname(pathname);
  if (locale === defaultLocaleCode) {
    return normalisedPathname;
  }

  return normalisedPathname === "/"
    ? `/${locale}`
    : `/${locale}${normalisedPathname}`;
}

export function localeAlternatesForPath(
  pathname: string,
): Record<string, string> {
  const languages = Object.fromEntries(
    publishedLocales.map(({ code }) => [
      code,
      localePath(code, pathname),
    ]),
  );

  return {
    ...languages,
    "x-default": localePath(defaultLocaleCode, pathname),
  };
}

export function absoluteLocaleAlternatesForPath(
  pathname: string,
  baseUrl = "https://gummyui.dev",
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(localeAlternatesForPath(pathname)).map(([locale, path]) => [
      locale,
      new URL(path, baseUrl).toString(),
    ]),
  );
}

export function isKnownLocalePrefix(value: string): boolean {
  return locales.some(({ code }) => code === value);
}
