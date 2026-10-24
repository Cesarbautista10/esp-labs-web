import { describe, expect, it } from "vitest";
import { languageOptions } from "./language-options";

describe("languageOptions", () => {
  it("puts auto first, showing the language the browser asks for", () => {
    const [auto] = languageOptions("en", ["ja-JP"]);
    expect(auto).toMatchObject({ choice: "auto", locale: "ja", native: "日本語" });
  });

  it("names each language in itself and in the language on screen", () => {
    const fr = languageOptions("de", []).find((o) => o.choice === "fr");
    expect(fr).toMatchObject({ native: "Français", translated: "Französisch" });
  });

  it("does not repeat a name that is the same both ways", () => {
    const de = languageOptions("de", []).find((o) => o.choice === "de");
    expect(de?.translated).toBe("");
  });
});
