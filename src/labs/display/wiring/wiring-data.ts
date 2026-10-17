// The display's 8 jumper wires, in the order lesson 03 places them, and the ESP32 left header.
import type { CSSProperties } from "react";
import { HEADER } from "@/domain/board";

export interface DisplayWire {
  /** Pin label on the display module. */
  readonly disp: string;
  /** Pin label on the ESP32. */
  readonly esp: string;
  /** Position on the ESP32 left header, top (0) to bottom (21). */
  readonly idx: number;
  /** Wire colour token. */
  readonly color: `--${string}`;
  readonly what: string;
  /** Seconds per dash cycle when signals flow; 0 = a steady line (power, reset, backlight). */
  readonly speed: number;
}

export const WIRES: readonly DisplayWire[] = [
  {
    disp: "GND",
    esp: "GND",
    idx: 21,
    color: "--w-gnd",
    what: "Ground first. Both boards need the same 0 V reference, or no signal makes sense.",
    speed: 0,
  },
  {
    disp: "VCC",
    esp: "3V3",
    idx: 0,
    color: "--w-vcc",
    what: "Power for the screen. Use 3V3, not 5V: the ESP32's pins speak 3.3 V.",
    speed: 0,
  },
  {
    disp: "SCL",
    esp: "GPIO 12",
    idx: 17,
    color: "--w-scl",
    what: "SPI clock. The ESP ticks this line once per bit, 40 million times a second.",
    speed: 0.35,
  },
  {
    disp: "SDA",
    esp: "GPIO 11",
    idx: 16,
    color: "--w-sda",
    what: "SPI data (MOSI). The bits themselves: the screen reads one on every clock tick.",
    speed: 0.6,
  },
  {
    disp: "RES",
    esp: "GPIO 8",
    idx: 11,
    color: "--w-res",
    what: "Reset. Pulled low once at start-up to reboot the screen's controller chip.",
    speed: 0,
  },
  {
    disp: "DC",
    esp: "GPIO 9",
    idx: 14,
    color: "--w-dc",
    what: "Data/Command. Low means the byte is a command, high means it is pixel data.",
    speed: 1.6,
  },
  {
    disp: "CS",
    esp: "GPIO 10",
    idx: 15,
    color: "--w-cs",
    what: "Chip select. Low means “I'm talking to you”. Lets several devices share one SPI bus.",
    speed: 2.4,
  },
  {
    disp: "BLK",
    esp: "GPIO 7",
    idx: 6,
    color: "--w-blk",
    what: "Backlight. High switches the light on. Without it the screen looks dead even while drawing.",
    speed: 0,
  },
];

export const LEFT_HEADER = HEADER.L;

/** "4" → "GPIO 4"; power and control pins keep their name. */
export const headerLabel = (pin: string) => (/^\d+$/.test(pin) ? `GPIO ${pin}` : pin);

/** CSS custom properties for inline styles, e.g. cssVars({ "--speed": "0.35s" }). */
export const cssVars = (vars: Record<`--${string}`, string>) => vars as CSSProperties;
