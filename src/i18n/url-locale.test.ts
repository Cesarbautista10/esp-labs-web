import { describe, expect, it } from "vitest";
import { localeInUrl, searchWithLocale } from "./url-locale";

describe("localeInUrl", () => {
  it("reads ?lang from the hash route, then from the page URL", () => {
    expect(localeInUrl("https://x.dev/#/lessons/02?variant=a&lang=ar")).toBe("ar");
    expect(localeInUrl("https://x.dev/?lang=ja#/lessons/02")).toBe("ja");
    expect(localeInUrl("https://x.dev/?lang=ja#/?lang=de")).toBe("de");
  });

  it("ignores missing and unsupported languages", () => {
    expect(localeInUrl("https://x.dev/#/lessons/02")).toBeUndefined();
    expect(localeInUrl("https://x.dev/#/?lang=pt")).toBeUndefined();
  });
});

describe("searchWithLocale", () => {
  it("sets the language and keeps the other parameters", () => {
    expect(searchWithLocale("?variant=b&lang=fr", "de")).toBe("?variant=b&lang=de");
    expect(searchWithLocale("", "zh")).toBe("?lang=zh");
  });
});
