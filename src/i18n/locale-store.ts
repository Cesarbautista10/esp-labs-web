import { createPersistentStore, useStore } from "@/lib/storage";
import { isLocaleChoice, type LocaleChoice } from "./locales";

// The reader's language choice, per browser. A stale or hand-edited value means "auto".
const raw = createPersistentStore<unknown>("esp-locale", "auto");

const read = (): LocaleChoice => {
  const value = raw.get();
  return isLocaleChoice(value) ? value : "auto";
};

export const localeChoiceStore = {
  get: read,
  subscribe: raw.subscribe,
  set: (choice: LocaleChoice) => raw.set(choice),
};

export const useLocaleChoice = (): LocaleChoice => useStore(localeChoiceStore);

/** The browser's language preferences, most preferred first. */
export const browserLanguages = (): readonly string[] =>
  typeof navigator === "undefined" ? [] : (navigator.languages ?? [navigator.language]);
