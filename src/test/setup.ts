import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

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

afterEach(() => cleanup());
