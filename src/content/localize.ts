import { type Locale, SOURCE_LOCALE } from "@/i18n/locales";
import { applyOverlay, type TextPolicy } from "@/i18n/overlay";

// Translations of the long-form content, laid over the English source when a track, the
// phrasebook or the tours load. Which fields count as text: ./text-policies.ts.

/** Content catalogues: src/locales/<locale>/content/<name>.json, e.g. "lessons/rfid". */
const OVERLAYS = import.meta.glob<unknown>("../locales/*/content/**/*.json", {
  import: "default",
});

/** A language's translation of one content catalogue; undefined when it has none. */
export async function loadOverlay(locale: Locale, name: string): Promise<unknown> {
  if (locale === SOURCE_LOCALE) return undefined;
  return OVERLAYS[`../locales/${locale}/content/${name}.json`]?.();
}

/** Loads a content catalogue's translation and lays it over the source. */
export async function localize<T>(
  source: T,
  locale: Locale,
  name: string,
  policy: TextPolicy,
): Promise<T> {
  return applyOverlay(source, await loadOverlay(locale, name), policy);
}
