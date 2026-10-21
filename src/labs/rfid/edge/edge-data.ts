// R6's edge lab experiments. Example numbers are illustrative (a typical RC522 on 15 cm jumpers),
// not measured on your board. Each parser reads the exact table the firmware prints
// (kit/lib/rfid-lab-kit/src/edge.h).

export type Row = readonly [label: string, value: number];

export interface EdgeExperiment {
  readonly key: "spi" | "gain" | "timeout" | "timing" | "irq" | "crc" | "stress";
  readonly label: string;
  readonly cmd: string;
  readonly unit: string;
  readonly xTitle: string;
  readonly what: string;
  readonly look: string;
  readonly example: readonly Row[];
  /** Fixed top of the scale (percentages). */
  readonly max?: number;
  /** The bar outlined as the reference. */
  readonly mark?: string;
  readonly markText?: string;
  /** A dashed line after bar n. */
  readonly between?: number;
  readonly betweenText?: string;
  /** Dashed outlines behind the bars. */
  readonly ghost?: readonly number[];
  readonly ghostText?: string;
  parse(text: string): Row[];
}

const rows = (t: string, re: RegExp, f: (m: RegExpMatchArray) => Row) => [...t.matchAll(re)].map(f);
const num = (s: string | undefined) => Number(s ?? 0);

export const EDGE: readonly EdgeExperiment[] = [
  {
    key: "spi",
    label: "SPI clock",
    cmd: "edge spi",
    unit: "% bytes wrong",
    xTitle: "SPI clock (MHz)",
    what: "64 random bytes into the chip's FIFO and back, 20 times at each clock speed, plus VersionReg read twice.",
    look: "The MFRC522 is rated for 10 Mbit/s. Past that, your jumper wires decide: long or loose ones round off the clock edges, and MISO (the chip's weak output) usually fails first. At the default 4 MHz you want exactly 0.",
    example: [
      ["1", 0],
      ["2", 0],
      ["4", 0],
      ["8", 0],
      ["10", 0],
      ["13", 0],
      ["16", 0.4],
      ["20", 3.1],
      ["26", 22],
      ["40", 61],
    ],
    mark: "10",
    markText: "datasheet max",
    parse: (t) =>
      rows(t, /^\s*(\d+)\s+([\d.]+)\s*%\s+\d+\s*\/\s*\d+/gm, (m) => [m[1] ?? "", num(m[2])]),
  },
  {
    key: "gain",
    label: "Gain vs distance",
    cmd: "edge gain",
    unit: "% found",
    max: 100,
    xTitle: "receiver gain (dB)",
    what: "30 wake + select attempts at each receiver gain, with the card held still at one height.",
    look: "Gain makes the reader a better listener; it doesn't give the card more power. Close up every gain works. Further away low gains fail first, until even 48 dB can't help because the card has no power left (the R2 3D view shows why).",
    example: [
      ["18", 0],
      ["23", 13],
      ["33", 87],
      ["38", 100],
      ["43", 100],
      ["48", 100],
    ],
    mark: "33",
    markText: "default",
    parse: (t) => rows(t, /^\s*(\d+)\s*dB\s+(\d+)\s*%/gm, (m) => [m[1] ?? "", num(m[2])]),
  },
  {
    key: "timeout",
    label: "Card reply time",
    cmd: "edge timeout",
    unit: "% WUPA answered",
    max: 100,
    xTitle: "chip timer (µs unless marked ms)",
    what: "The chip's timer decides how long to wait for an answer after our frame. The test shrinks it step by step and counts answers to WUPA, 20 tries each.",
    look: "ISO 14443 says a card answers about 86 µs after the reader's last bit, and the timer counts in 25 µs ticks: expect answers to stop between 100 and 75 µs. The 25 ms default is 250 times longer than a card needs; it is what an empty poll costs.",
    example: [
      ["25ms", 100],
      ["5ms", 100],
      ["1ms", 100],
      ["500", 100],
      ["300", 100],
      ["200", 100],
      ["150", 100],
      ["120", 100],
      ["100", 95],
      ["80", 0],
      ["60", 0],
      ["40", 0],
    ],
    between: 8,
    betweenText: "ISO: ~86 µs",
    parse: (t) =>
      rows(t, /^\s*(\d+)\s*us\s+(\d+)\s*%\s+(\d+)\s*%/gm, (m) => [
        num(m[1]) >= 1000 ? `${num(m[1]) / 1000}ms` : (m[1] ?? ""),
        num(m[2]),
      ]),
  },
  {
    key: "timing",
    label: "Time per step",
    cmd: "edge timing",
    unit: "µs, average",
    xTitle: "protocol step",
    what: "40 full cycles of WUPA, the final SELECT frame, authentication and one block read, each timed from the command's start to its end.",
    look: "The dashed outline is pure air time at 106 kbit/s; everything above it is SPI traffic and the ESP32's own work. Authentication is three exchanges inside the chip, so expect it to be the slowest.",
    example: [
      ["WUPA", 480],
      ["SELECT", 1260],
      ["AUTH", 2350],
      ["READ", 2210],
    ],
    ghost: [360, 1140, 1950, 1990],
    ghostText: "air time alone",
    parse: (t) =>
      rows(t, /^\s*(WUPA|SELECT|AUTH|READ)\s+(\d+)\s+([\d.]+)\s+(\d+)/gm, (m) => [
        m[1] ?? "",
        num(m[3]),
      ]),
  },
  {
    key: "irq",
    label: "Polling vs IRQ",
    cmd: "edge irq",
    unit: "SPI accesses per WUPA",
    xTitle: "how the reader task waits",
    what: "30 WUPAs while polling ComIrqReg over SPI, then 30 sleeping until the IRQ wire fires, counting SPI accesses per command.",
    look: "With a card present both finish fast, but polling keeps the bus busy while it waits. Run it again with no card: every WUPA now waits out the 25 ms timer, and polling's count shoots up while IRQ's stays the same.",
    example: [
      ["poll", 37],
      ["irq", 16],
    ],
    parse: (t) =>
      rows(t, /^\s*(poll|irq)\s+([\d.]+)\s+([\d.]+)\s*$/gm, (m) => [m[1] ?? "", num(m[2])]),
  },
  {
    key: "crc",
    label: "CRC: chip vs CPU",
    cmd: "edge crc",
    unit: "µs per frame",
    xTitle: "who computes CRC_A",
    what: "300 random frames: CRC_A from the chip's coprocessor (bytes go over SPI and back) and from the ESP32 (the same five lines as rfid_format.h).",
    look: "Both must agree on every frame: 0 mismatches. The coprocessor itself is quick, but the SPI round trip costs far more than the ESP32 doing the maths: here offloading loses.",
    example: [
      ["chip", 95],
      ["ESP32", 0.6],
    ],
    parse: (t) => {
      const m = /chip coprocessor ([\d.]+) us\/frame.*?ESP32 ([\d.]+) us\/frame/s.exec(t);
      return m
        ? [
            ["chip", num(m[1])],
            ["ESP32", num(m[2])],
          ]
        : [];
    },
  },
  {
    key: "stress",
    label: "Stress run",
    cmd: "edge stress 500",
    unit: "cycles",
    xTitle: "outcome of each wake → select → auth → read cycle",
    what: "Hundreds of complete cycles in a row: wake, select, authenticate, read block 4, halt. Every outcome counted.",
    look: "Held still and close, expect 99 % or better. Lift or tilt the card slowly while it runs: misses start as “absent” (no answer), then CRC and protocol errors appear right at the edge of range.",
    example: [
      ["ok", 496],
      ["absent", 2],
      ["CRC", 1],
      ["proto", 1],
      ["coll", 0],
      ["NAK", 0],
      ["other", 0],
    ],
    mark: "ok",
    parse: (t) =>
      rows(t, /^\s*(ok|absent|CRC|proto|coll|NAK|other)\s+(\d+)\s*$/gm, (m) => [
        m[1] ?? "",
        num(m[2]),
      ]),
  },
];

/** Strips the serial monitor's time stamps ("14:02:07.123 > "). */
export const cleanMonitor = (t: string) => t.replace(/^\d{2}:\d{2}:\d{2}\.\d{3} > ?/gm, "");

/** Rounds a chart's top up to 1, 2, 4, 5 or 10 × 10ⁿ so the 4 grid lines land on plain numbers. */
export function niceTop(v: number): number {
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  return [1, 2, 4, 5, 10].map((k) => k * p).find((x) => x >= v) ?? 10 * p;
}
