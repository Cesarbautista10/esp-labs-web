// The UNIT Electronics PULSAR C6 (Arduino Nano layout), USB-C at the top, as its pinout drawing
// lists each row top to bottom. Pins are named by ESP32-C6 GPIO number.
import type { PinSide, PinUse } from "./lesson";

export const HEADER: Readonly<Record<PinSide, readonly string[]>> = {
  L: ["6", "3V3", "14", "0", "1", "3", "4", "22", "23", "5", "NEO", "5V", "RST", "GND", "VIN"],
  R: ["2", "7", "18", "13", "12", "21", "20", "19", "15", "9", "8", "GND", "RST", "17", "16"],
};

/** The on-board WS2812B data line. */
export const RGB_PIN = "8";
/** The BOOT button: a strapping pin, free as an input once the board runs. */
export const BOOT_PIN = "9";

const ALIAS: Readonly<Record<string, string>> = { "16": "TX 16", "17": "RX 17", NEO: "NEO OUT" };

/** Strapping, USB, UART and on-board parts (RGB data, microSD CS): usable, but best left alone. */
const AVOID = new Set(["8", "9", "15", "12", "13", "16", "17", "19", "NEO"]);

export type PinClass = "power" | "gnd" | "avoid" | "safe";

export function classifyPin(pin: string): PinClass {
  if (pin === "3V3" || pin === "5V" || pin === "VIN") return "power";
  if (pin === "GND") return "gnd";
  if (pin === "RST" || AVOID.has(pin)) return "avoid";
  return "safe";
}

export const pinLabel = (pin: string) => ALIAS[pin] ?? pin;

/** Header position of a pin a lesson uses: its explicit index, else its first appearance. */
export const pinIndex = (use: PinUse) => use.idx ?? HEADER[use.side].indexOf(use.pin);

/**
 * Whether a lesson's pin is on this board's header where the lesson says. Lessons wired for
 * another board can name pins this header does not have; those are left untagged.
 */
export function onHeader(use: PinUse): boolean {
  const i = pinIndex(use);
  return HEADER[use.side][i] === use.pin;
}
