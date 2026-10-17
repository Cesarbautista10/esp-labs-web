// "What the screen shows": each view with numbered callouts, and the example state it is drawn with.
import { bccOf, RF, withCrc } from "../protocol/bytes";
import { exampleCard } from "../protocol/card-memory";
import { EDGE } from "../edge/edge-data";
import type { RfidScreenState, TraceFrame } from "./rfid-screen";

/** [x, y] in screen pixels (320 × 170), then what that part means. */
export type ScreenPart = readonly [number, number, string];

export interface ScreenDoc {
  readonly when: string;
  readonly parts: readonly ScreenPart[];
}

export const SCREEN_DOCS: readonly ScreenDoc[] = [
  {
    when: "The first view to check after wiring (R1). Double-click runs the self-test.",
    parts: [
      [
        22,
        60,
        "The chip. Its centre glows teal while the chip answers; it can't glow if VersionReg reads 00h or FFh.",
      ],
      [
        96,
        42,
        "VersionReg: 92h = MFRC522 v2.0, 91h = v1.0, other values = a clone. 00h or FFh means nothing answered: check the wiring.",
      ],
      [
        212,
        42,
        "Self-test: “not run” until you type selftest (or double-click). Then “passed” (NXP chip, matches the datasheet), “consistent” (clone, two runs agree), “not supported” (a clone without it) or “FAILED”.",
      ],
      [
        96,
        84,
        "SPI clock: 4 MHz by default. Turns amber above the chip's 10 MHz rating (spi <MHz>).",
      ],
      [
        212,
        84,
        "How the reader task waits for the chip: “IRQ wire”, or “polling” if IRQ isn't wired (the firmware switches by itself and says so).",
      ],
      [96, 132, "Receiver gain, 18 to 48 dB (gain <0-7>); 33 dB by default."],
      [
        242,
        126,
        "Bus counters: SPI accesses and commands. They keep climbing, about 12 polls a second: the reader task is alive.",
      ],
      [304, 36, "Card dot: teal with a ring while a card is in the field. Same on every view."],
      [4, 164, "Footer, left: what a double-click does on this view."],
      [
        316,
        164,
        "Footer, right: the last result. Teal = fine, coral = a problem, amber with a growing line = busy.",
      ],
    ],
  },
  {
    when: "The view the board starts on. Shows the card in the field right now. Double-click runs inventory.",
    parts: [
      [14, 100, "The antenna and its field: always animating, card or not."],
      [36, 48, "A card appears here when one is in the field; the small square is its chip."],
      [136, 40, "The UID: the card's serial number, as the anticollision read it."],
      [136, 69, "The card type, decoded from SAK."],
      [
        136,
        90,
        "ATQA (00 04) and SAK (08): the card's answers to wake-up and select. UID size: 4, 7 or 10 bytes.",
      ],
      [
        136,
        133,
        "Read rate: how many of the last 20 polls found the card. 100 % = solid; amber or coral = edge of range.",
      ],
      [136, 151, "Only with two cards on the reader: the bit where their UIDs first differ (R3)."],
    ],
  },
  {
    when: "The sniffer: the frames of the last card wake-up or command. Double-click turns it on or off.",
    parts: [
      [20, 30, "Time in ms since the first frame of this exchange."],
      [46, 30, "> reader to card (amber), < card to reader (teal)."],
      [
        110,
        30,
        "The bytes on the air. Grey bytes were encrypted on the air (after authentication); you see the plain text.",
      ],
      [262, 30, "What the frame is: WUPA, ATQA, ANTICOLL, SELECT, SAK, HLTA, READ…"],
    ],
  },
  {
    when: "The last dump, block by block. Double-click runs dump (hold the card still).",
    parts: [
      [308, 37, "One column per sector, 0 to 15."],
      [17, 52, "Block 0 (amber): the maker's block with the UID. Read-only."],
      [
        100,
        70,
        "Data blocks: dark = all zeros, green = something written, blue = a value block (credits).",
      ],
      [
        100,
        106,
        "The bottom row: each sector's trailer (keys + access bits), coral. The lab never writes these.",
      ],
      [300, 143, "Which card this dump is from."],
    ],
  },
  {
    when: "The credit counter in blocks 8 and 9 (R5). Double-click adds 1 credit.",
    parts: [
      [96, 136, "One coin per 10 credits (up to 8)."],
      [100, 70, "The value in block 8, as the card computed it."],
      [100, 100, "The backup in block 9: the value before the last change."],
    ],
  },
  {
    when: "The last edge-lab experiment as a bar chart (R6). Double-click runs the next experiment.",
    parts: [
      [64, 37, "Which experiment."],
      [
        312,
        92,
        "One bar per setting tried, all on one scale; the value is written above each bar.",
      ],
      [145, 46, "An outlined bar marks the reference: the datasheet limit or the default."],
      [158, 154, "The conclusion in one line, also printed in the monitor with the full table."],
    ],
  },
];

const u = RF.card.uid;
const bcc = bccOf(u);
const EXAMPLE_FRAMES: readonly TraceFrame[] = [
  { dir: ">", bytes: [0x52], name: "WUPA", t: 0 },
  { dir: "<", bytes: [0x04, 0x00], name: "ATQA", t: 0.371 },
  { dir: ">", bytes: [0x93, 0x20], name: "ANTICOLL CL1", t: 0.64 },
  { dir: "<", bytes: [...u, bcc], name: "UID + BCC", t: 1.2 },
  { dir: ">", bytes: withCrc([0x93, 0x70, ...u, bcc]), name: "SELECT CL1", t: 1.5 },
  { dir: "<", bytes: withCrc([0x08]), name: "SAK", t: 2.58 },
  { dir: ">", bytes: withCrc([0x50, 0x00]), name: "HLTA", t: 2.79 },
];
const EXAMPLE_DUMP = { uid: u, mem: exampleCard(true) };
const NOTES = [
  "self-test passed: 64/64 bytes",
  "",
  "",
  "dump: 16 sectors read",
  "credits: 47",
  "SPI sweep: errors from 16 MHz",
] as const;

/**
 * The screen as it looks after R1-R6, for one view. The card and trace views show a card
 * present (and the card view a collision); the others don't.
 */
export function exampleScreen(view: number): RfidScreenState {
  return {
    view,
    uid: view >= 1 && view <= 3 ? u : null,
    rate: 100,
    taps: 3,
    polling: true,
    coll: view === 1 ? 23 : 0,
    selfTest: 1,
    gain: 4,
    irq: true,
    mhz: 4,
    trace: true,
    frames: EXAMPLE_FRAMES,
    dump: EXAMPLE_DUMP,
    credits: { v: 47, b: 50 },
    edge: EDGE[0] ?? null,
    busy: null,
    progress: 0,
    note: NOTES[view] ?? "",
    noteBad: false,
  };
}
