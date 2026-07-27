export const requiredLocaleCodes = [
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
] as const;

export type LocaleCode = (typeof requiredLocaleCodes)[number];
export type LocaleDirection = "ltr" | "rtl";
export type LocalePublicationStatus =
  | "published"
  | "pending-linguistic-review";

export interface LocaleDefinition {
  code: LocaleCode;
  englishName: string;
  nativeName: string;
  direction: LocaleDirection;
  status: LocalePublicationStatus;
}

/**
 * Native names identify languages; they are not translated interface copy.
 * A locale must not change to `published` until the review workflow in
 * docs/localisation.md is complete.
 */
export const locales = [
  {
    code: "en",
    englishName: "English",
    nativeName: "English",
    direction: "ltr",
    status: "published",
  },
  {
    code: "fr",
    englishName: "French",
    nativeName: "Français",
    direction: "ltr",
    status: "pending-linguistic-review",
  },
  {
    code: "es",
    englishName: "Spanish",
    nativeName: "Español",
    direction: "ltr",
    status: "pending-linguistic-review",
  },
  {
    code: "pt",
    englishName: "Portuguese",
    nativeName: "Português",
    direction: "ltr",
    status: "pending-linguistic-review",
  },
  {
    code: "it",
    englishName: "Italian",
    nativeName: "Italiano",
    direction: "ltr",
    status: "pending-linguistic-review",
  },
  {
    code: "nl",
    englishName: "Dutch",
    nativeName: "Nederlands",
    direction: "ltr",
    status: "pending-linguistic-review",
  },
  {
    code: "id",
    englishName: "Indonesian",
    nativeName: "Bahasa Indonesia",
    direction: "ltr",
    status: "pending-linguistic-review",
  },
  {
    code: "de",
    englishName: "German",
    nativeName: "Deutsch",
    direction: "ltr",
    status: "pending-linguistic-review",
  },
  {
    code: "pl",
    englishName: "Polish",
    nativeName: "Polski",
    direction: "ltr",
    status: "pending-linguistic-review",
  },
  {
    code: "tr",
    englishName: "Turkish",
    nativeName: "Türkçe",
    direction: "ltr",
    status: "pending-linguistic-review",
  },
  {
    code: "vi",
    englishName: "Vietnamese",
    nativeName: "Tiếng Việt",
    direction: "ltr",
    status: "pending-linguistic-review",
  },
  {
    code: "ja",
    englishName: "Japanese",
    nativeName: "日本語",
    direction: "ltr",
    status: "pending-linguistic-review",
  },
  {
    code: "zh-Hans",
    englishName: "Simplified Chinese",
    nativeName: "简体中文",
    direction: "ltr",
    status: "pending-linguistic-review",
  },
  {
    code: "ko",
    englishName: "Korean",
    nativeName: "한국어",
    direction: "ltr",
    status: "pending-linguistic-review",
  },
  {
    code: "hi",
    englishName: "Hindi",
    nativeName: "हिन्दी",
    direction: "ltr",
    status: "pending-linguistic-review",
  },
  {
    code: "ru",
    englishName: "Russian",
    nativeName: "Русский",
    direction: "ltr",
    status: "pending-linguistic-review",
  },
  {
    code: "uk",
    englishName: "Ukrainian",
    nativeName: "Українська",
    direction: "ltr",
    status: "pending-linguistic-review",
  },
  {
    code: "fa",
    englishName: "Persian",
    nativeName: "فارسی",
    direction: "rtl",
    status: "pending-linguistic-review",
  },
  {
    code: "he",
    englishName: "Hebrew",
    nativeName: "עברית",
    direction: "rtl",
    status: "pending-linguistic-review",
  },
  {
    code: "ar",
    englishName: "Arabic",
    nativeName: "العربية",
    direction: "rtl",
    status: "pending-linguistic-review",
  },
] as const satisfies readonly LocaleDefinition[];

export const defaultLocaleCode: LocaleCode = "en";

export const publishedLocales = locales.filter(
  (locale) => locale.status === "published",
);

export const pendingLocales = locales.filter(
  (locale) => locale.status === "pending-linguistic-review",
);

export function getLocale(code: string): LocaleDefinition | undefined {
  const normalisedCode = code.toLowerCase();
  return locales.find(
    (locale) => locale.code.toLowerCase() === normalisedCode,
  );
}

export function isPublishedLocaleCode(
  code: string,
): code is LocaleCode {
  return publishedLocales.some((locale) => locale.code === code);
}
