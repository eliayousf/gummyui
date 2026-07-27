import Link from "next/link";
import {
  defaultLocaleCode,
  pendingLocales,
  publishedLocales,
} from "../data/locales";
import { localePath } from "../i18n/routing";

export function LocaleSwitcher({
  currentPath,
}: {
  currentPath: string;
}) {
  const currentLocale =
    publishedLocales.find(({ code }) => code === defaultLocaleCode) ??
    publishedLocales[0];

  return (
    <details className="locale-switcher">
      <summary
        aria-label={`Language: ${currentLocale.englishName}`}
        title={`Language: ${currentLocale.englishName}`}
      >
        <span aria-hidden="true">文</span>
        <span>{currentLocale.code.toUpperCase()}</span>
      </summary>
      <div className="locale-switcher__menu">
        <p>Published language</p>
        {publishedLocales.map((locale) => (
          <Link
            aria-current={locale.code === currentLocale.code ? "page" : undefined}
            href={localePath(locale.code, currentPath)}
            hrefLang={locale.code}
            key={locale.code}
            lang={locale.code}
          >
            <span>{locale.nativeName}</span>
            <small>{locale.code}</small>
          </Link>
        ))}
        <p>
          {pendingLocales.length} more locales are awaiting human linguistic
          review.
        </p>
        <Link className="locale-switcher__status" href="/locales">
          Translation status
        </Link>
      </div>
    </details>
  );
}
