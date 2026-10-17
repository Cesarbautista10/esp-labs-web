import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// End to end through the real router, loaders and query client (only the network is faked).
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
    expect(await screen.findByRole("heading", { name: "An LED on the breadboard" })).toBeTruthy();

    const first = screen.getAllByRole("checkbox")[0]!;
    await userEvent.click(first);
    expect(JSON.parse(localStorage.getItem("esp-ticks") ?? "{}")).toEqual({ "02-0": true });
    expect(localStorage.getItem("esp-lesson")).toBe('"02"');
  });

  it("shows a 404 for an unknown lesson", async () => {
    window.location.hash = "#/lessons/Z9";
    const { App } = await import("./App");
    render(<App />);
    expect(await screen.findByText("Nothing on this pin.")).toBeTruthy();
  });
});
