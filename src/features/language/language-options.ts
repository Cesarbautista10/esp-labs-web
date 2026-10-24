import {
  LOCALE_INFO,
  type Locale,
  type LocaleChoice,
  LOCALES,
  matchLocale,
} from "@/i18n/locales";

// What the language pickers (top bar menu, Settings cards) list. Each language is named in
// itself, so a reader finds theirs whatever the page is in, and again in the language on screen,
// so everyone else can read the list too.

export interface LanguageOption {
  readonly choice: LocaleChoice;
  /** The language this option shows ("auto": the one the browser asks for). */
  readonly locale: Locale;
  /** "Français", in its own script. */
  readonly native: string;
  /** "French", in the language on screen; empty when it would repeat `native`. */
  readonly translated: string;
}

/** Every option, "auto" first, with names for a page shown in `shown`. */
export function languageOptions(shown: Locale, browser: readonly string[]): LanguageOption[] {
  const names = new Intl.DisplayNames([LOCALE_INFO[shown].tag], { type: "language" });
  const option = (choice: LocaleChoice, locale: Locale): LanguageOption => {
    const native = LOCALE_INFO[locale].nativeName;
    const translated = names.of(LOCALE_INFO[locale].tag) ?? "";
    return { choice, locale, native, translated: same(translated, native) ? "" : translated };
  };
  return [option("auto", matchLocale(browser)), ...LOCALES.map((l) => option(l, l))];
}

const same = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: "base" }) === 0;
