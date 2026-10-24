import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { initI18n } from "@/i18n/i18n";

// jsdom has no layout: give the few browser APIs the app calls a harmless stand-in.
Element.prototype.scrollIntoView ??= function scrollIntoView() {};
Element.prototype.scrollTo ??= function scrollTo() {};
window.matchMedia ??= (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  }) as MediaQueryList;

globalThis.ResizeObserver ??= class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

afterEach(() => cleanup());

// Components read their text through i18next; tests see the English source.
await initI18n();
