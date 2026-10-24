import { isLocale, type Locale } from "./locales";

// The language rides in the URL as ?lang=fr, so a shared link opens in the language it was
// shared in. The guide uses hash URLs (#/lessons/02?lang=fr); a plain ?lang=fr before the hash
// is read too, for links typed by hand. Pure: the router glue lives in app/locale-url.ts.

export const LANG_PARAM = "lang";

/** The supported language a URL asks for, if any. */
export function localeInUrl(href: string): Locale | undefined {
  const url = new URL(href);
  const hashQuery = url.hash.includes("?") ? url.hash.slice(url.hash.indexOf("?")) : "";
  const asked =
    new URLSearchParams(hashQuery).get(LANG_PARAM) ?? url.searchParams.get(LANG_PARAM);
  return isLocale(asked) ? asked : undefined;
}

/** A router search string carrying the language, every other parameter kept in its place. */
export function searchWithLocale(search: string, locale: Locale): string {
  const params = new URLSearchParams(search);
  params.set(LANG_PARAM, locale);
  return `?${params.toString()}`;
}
