import { describe, expect, it } from "vitest";
import {
  INITIAL_SCROLL,
  nextScrollChrome,
  type ScrollChromeConfig,
  type ScrollMemory,
} from "./scroll-chrome";

const config: ScrollChromeConfig = { compactAfter: 80, hideAfter: 200, travel: 10 };
const run = (ys: number[], from: ScrollMemory = INITIAL_SCROLL) =>
  ys.reduce((m, y) => nextScrollChrome(m, y, config), from);

describe("nextScrollChrome", () => {
  it("is the full form at the top", () => {
    expect(run([0, 30, 80])).toMatchObject({ compact: false, hidden: false });
  });

  it("turns compact once you are past the top, without hiding yet", () => {
    expect(run([50, 120, 190])).toMatchObject({ compact: true, hidden: false });
  });

  it("hides while you scroll down past the hide line", () => {
    expect(run([100, 200, 260, 300])).toMatchObject({ compact: true, hidden: true });
  });

  it("comes back after a short scroll up", () => {
    expect(run([300, 400, 500, 480, 470])).toMatchObject({ hidden: false });
  });

  it("ignores jitter smaller than the travel", () => {
    const hidden = run([300, 400, 500]);
    expect(hidden.hidden).toBe(true);
    expect(run([495, 498, 494], hidden).hidden).toBe(true);
    expect(run([480], hidden).hidden).toBe(false);
  });

  it("always shows the full form again at the top", () => {
    expect(run([300, 400, 500, 60])).toMatchObject({ compact: false, hidden: false });
  });
});
