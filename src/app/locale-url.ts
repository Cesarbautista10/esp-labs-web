import type { DataRouter } from "react-router";
import { i18n } from "@/i18n/i18n";
import { localeChoiceStore } from "@/i18n/locale-store";
import { isLocale } from "@/i18n/locales";
import { LANG_PARAM, searchWithLocale } from "@/i18n/url-locale";

/**
 * Keeps ?lang= in the URL in step with the language on screen, so any URL the reader copies
 * opens in the same language. A URL that names another language (a shared link, an edited
 * address) wins and becomes the reader's choice; a URL without one gets the current language.
 */
export function syncLocaleWithUrl(router: DataRouter): void {
  /** Puts the language on screen into the current URL (no new history entry). */
  const write = () => {
    // Mid-navigation the location is still the old one: wait for the router to settle.
    if (!router.state.initialized || router.state.navigation.state !== "idle") return;
    const { location } = router.state;
    const shown = i18n.resolvedLanguage;
    if (!isLocale(shown) || new URLSearchParams(location.search).get(LANG_PARAM) === shown) return;
    // Not from inside the router's own update: let it finish committing this navigation first.
    queueMicrotask(() => void router.navigate(
      {
        pathname: location.pathname,
        search: searchWithLocale(location.search, shown),
        hash: location.hash,
      },
      { replace: true, preventScrollReset: true },
    ));
  };
  /** After a navigation: a URL naming another language switches to it, else it gets ours. */
  const read = () => {
    if (router.state.navigation.state !== "idle") return;
    const asked = new URLSearchParams(router.state.location.search).get(LANG_PARAM);
    if (isLocale(asked) && asked !== i18n.resolvedLanguage) localeChoiceStore.set(asked);
    else write();
  };
  router.subscribe(read);
  i18n.on("languageChanged", write);
  write();
}
