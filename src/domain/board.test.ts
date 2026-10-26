import { describe, expect, it } from "vitest";
import { BOOT_PIN, classifyPin, HEADER, onHeader, pinIndex, RGB_PIN } from "./board";

describe("the PULSAR C6 header", () => {
  it("has the Arduino Nano's two rows of 15", () => {
    expect(HEADER.L).toHaveLength(15);
    expect(HEADER.R).toHaveLength(15);
  });

  it("names each GPIO once", () => {
    const gpio = [...HEADER.L, ...HEADER.R].filter((p) => /^\d+$/.test(p));
    expect(new Set(gpio).size).toBe(gpio.length);
  });

  it("puts BOOT and the RGB data line on the header, marked to avoid", () => {
    expect(HEADER.R).toContain(BOOT_PIN);
    expect(HEADER.R).toContain(RGB_PIN);
    expect(classifyPin(BOOT_PIN)).toBe("avoid");
    expect(classifyPin(RGB_PIN)).toBe("avoid");
  });

  it("classifies power, ground and free pins", () => {
    expect(classifyPin("VIN")).toBe("power");
    expect(classifyPin("GND")).toBe("gnd");
    expect(classifyPin("4")).toBe("safe");
  });
});

describe("onHeader", () => {
  it("finds a pin by name, or by its explicit index", () => {
    expect(onHeader({ pin: "4", role: "LED", side: "L" })).toBe(true);
    expect(pinIndex({ pin: "GND", role: "G", side: "R" })).toBe(11);
    expect(onHeader({ pin: "GND", idx: 13, role: "G", side: "L" })).toBe(true);
  });

  it("rejects pins this board does not have where the lesson puts them", () => {
    expect(onHeader({ pin: "48", role: "RGB", side: "R" })).toBe(false);
    expect(onHeader({ pin: "4", role: "LED", side: "R" })).toBe(false);
    expect(onHeader({ pin: "GND", idx: 20, role: "G", side: "R" })).toBe(false);
  });
});
