import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// End to end through the real router, loaders and query client (only the network is faked).
// The first render waits for lazily loaded chunks, which a cold transform can make slow.
const LOAD = { timeout: 5000 };
describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ overview: [], facts: [], entries: [] }))),
    );
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
  });

  it("opens a lesson from its URL and remembers a ticked step", async () => {
    window.location.hash = "#/lessons/02";
    const { App } = await import("./App");
    render(<App />);
    expect(
      await screen.findByRole("heading", { name: "An LED on the breadboard" }, LOAD),
    ).toBeTruthy();

    const first = screen.getAllByRole("checkbox")[0]!;
    await userEvent.click(first);
    expect(JSON.parse(localStorage.getItem("esp-ticks") ?? "{}")).toEqual({ "02-0": true });
    expect(localStorage.getItem("esp-lesson")).toBe('"02"');
  });

  it("shows a 404 for an unknown lesson", async () => {
    window.location.hash = "#/lessons/Z9";
    const { App } = await import("./App");
    render(<App />);
    expect(await screen.findByText("Nothing on this pin.", undefined, LOAD)).toBeTruthy();
  });

  it("opens on the labs map, with the last lesson one click away", async () => {
    localStorage.setItem("esp-lesson", '"02"');
    window.location.hash = "#/";
    const { App } = await import("./App");
    render(<App />);
    expect(await screen.findByRole("heading", { name: "All labs" }, LOAD)).toBeTruthy();
    expect(screen.getByText("Pick up where you left off")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Continue the lab/ }).getAttribute("href")).toBe(
      "#/lessons/02",
    );
  });
});
