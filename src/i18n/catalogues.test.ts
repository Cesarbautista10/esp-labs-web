import { describe, expect, it } from "vitest";
import { checkCatalogue } from "./catalogue-check";
import { LOCALES, SOURCE_LOCALE } from "./locales";
import { NAMESPACES } from "./namespaces";

const catalogues = import.meta.glob<unknown>("../locales/*/*.json", {
  import: "default",
  eager: true,
});
const catalogue = (locale: string, ns: string) => catalogues[`../locales/${locale}/${ns}.json`];

describe("interface catalogues", () => {
  it("every namespace has an English source", () => {
    expect(NAMESPACES.filter((ns) => catalogue(SOURCE_LOCALE, ns) === undefined)).toEqual([]);
  });

  it("no catalogue sits outside the known namespaces and languages", () => {
    const known = new Set(LOCALES.flatMap((l) => NAMESPACES.map((ns) => `../locales/${l}/${ns}.json`)));
    expect(Object.keys(catalogues).filter((path) => !known.has(path))).toEqual([]);
  });

  const pairs = LOCALES.filter((l) => l !== SOURCE_LOCALE).flatMap((locale) =>
    NAMESPACES.map((ns) => ({ locale, ns })),
  );
  it.each(pairs)("$locale/$ns fits the English source", ({ locale, ns }) => {
    const translated = catalogue(locale, ns);
    if (translated === undefined) return;
    expect(checkCatalogue(catalogue(SOURCE_LOCALE, ns), translated, locale)).toEqual([]);
  });
});
