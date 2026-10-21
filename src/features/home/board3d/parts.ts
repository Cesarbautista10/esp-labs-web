import type { ActiveLesson, LessonEntry, PinUse } from "@/domain/lesson";
import type { PartName } from "@/ui/parts/registry";

// The parts of the DevKitC the board explorer points at, and which lessons use each one. The
// lessons are found from the content itself (pins, USB, BOOT, firmware, theme), so a new lesson
// shows up under its parts without touching this file.

export type PartId = "usb" | "buttons" | "rgb" | "module" | "antenna" | "headers";

export interface BoardPart {
  readonly id: PartId;
  readonly title: string;
  readonly part: PartName;
  readonly text: string;
  /** Which side of the model the callout sits on, on wide screens. */
  readonly side: "left" | "right";
}

export const BOARD_PARTS: readonly BoardPart[] = [
  {
    id: "usb",
    title: "USB-C ports",
    part: "usbc",
    text: "COM flashes the board and carries the serial monitor. USB is the S3's own port.",
    side: "left",
  },
  {
    id: "buttons",
    title: "BOOT and RST",
    part: "button",
    text: "RST restarts your program. BOOT is GPIO 0: a free push button once the board runs.",
    side: "left",
  },
  {
    id: "rgb",
    title: "RGB LED",
    part: "rgb-led",
    text: "One WS2812 on GPIO 48: 16 million colours from a single data pin.",
    side: "left",
  },
  {
    id: "module",
    title: "ESP32-S3 module",
    part: "module",
    text: "Two 240 MHz cores, 16 MB flash and 8 MB PSRAM under the metal can.",
    side: "right",
  },
  {
    id: "antenna",
    title: "PCB antenna",
    part: "antenna",
    text: "Wi-Fi 4 and Bluetooth 5 leave from this copper zigzag: keep it clear of metal.",
    side: "right",
  },
  {
    id: "headers",
    title: "Pin headers",
    part: "header",
    text: "44 pins: 3V3, 5V, GND and the GPIO you wire screens, readers and mics to.",
    side: "right",
  },
];

/** Every pin a lesson can use, across its variants. */
const pinsOf = (l: ActiveLesson): readonly PinUse[] => [
  ...(l.pins ?? []),
  ...(l.variants ?? []).flatMap((v) => v.pins ?? []),
];

const USES: Record<PartId, (l: ActiveLesson) => boolean> = {
  usb: (l) => Boolean(l.usb),
  buttons: (l) => Boolean(l.boot) || pinsOf(l).some((p) => p.pin === "0"),
  rgb: (l) => pinsOf(l).some((p) => p.pin === "48"),
  module: (l) => /(?:^|\s)-e\s/.test(l.cmd ?? ""),
  antenna: (l) => l.track === "wifi" || l.track === "ble",
  headers: (l) => pinsOf(l).some((p) => p.pin !== "48"),
};

/** The open lessons that use a part, in table-of-contents order. */
export function partLessons(part: PartId, lessons: readonly LessonEntry[]): ActiveLesson[] {
  return lessons.filter((l): l is ActiveLesson => l.kind === "lesson" && USES[part](l));
}
