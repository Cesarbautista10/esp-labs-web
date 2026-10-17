// R1's register access over SPI: what the four wires carry for one 2-byte transfer.
import { hx } from "./bytes";

export interface Register {
  readonly name: string;
  readonly a: number;
  readonly v: number;
  readonly what: string;
}

export const REGS: readonly Register[] = [
  { name: "VersionReg", a: 0x37, v: 0x92, what: "92h = MFRC522 version 2.0" },
  { name: "ComIrqReg", a: 0x04, v: 0x14, what: "14h after reset: IdleIRq + LoAlertIRq" },
  { name: "TxControlReg", a: 0x14, v: 0x83, what: "83h: both antenna drivers on (bits 1-0)" },
  {
    name: "RFCfgReg",
    a: 0x26,
    v: 0x40,
    what: "40h: receiver gain 100b = 33 dB (48h straight after a reset)",
  },
];

export const FAULTS = {
  none: "wired correctly",
  miso: "MISO wire loose",
  power: "no 3.3 V",
  ss: "SDA (chip select) wire loose",
} as const;
export type Fault = keyof typeof FAULTS;

export interface SpiFrame {
  readonly r: Register;
  readonly read: boolean;
  readonly fault: Fault;
  readonly addr: number;
  readonly data: number;
  readonly answer: number;
  readonly mosi: readonly number[];
  readonly miso: readonly number[];
}

const bitsMsbFirst = (byte: number) => Array.from({ length: 8 }, (_, i) => (byte >> (7 - i)) & 1);

/** Address byte: read = 0x80 | reg << 1, write = reg << 1. A write sends 03h. */
export function spiFrame(r: Register, read: boolean, fault: Fault): SpiFrame {
  const addr = read ? 0x80 | (r.a << 1) : (r.a << 1) & 0x7e;
  const data = read ? 0x00 : 0x03;
  const answer = fault === "power" ? 0x00 : fault === "miso" || fault === "ss" ? 0xff : r.v;
  return {
    r,
    read,
    fault,
    addr,
    data,
    answer,
    mosi: [...bitsMsbFirst(addr), ...bitsMsbFirst(data)],
    miso: bitsMsbFirst(answer),
  };
}

export const BIT_NAMES = [
  "R/W",
  "A5",
  "A4",
  "A3",
  "A2",
  "A1",
  "A0",
  "0",
  "D7",
  "D6",
  "D5",
  "D4",
  "D3",
  "D2",
  "D1",
  "D0",
] as const;

/** The caption for the bit under the cursor: a key phrase and the explanation. */
export function bitCaption(f: SpiFrame, bit: number): readonly [string, string] {
  if (bit === 0)
    return [
      "bit 7 of the address byte:",
      `${f.read ? "1 = read" : "0 = write"}. MSB first; data changes on the falling clock edge and is read on the rising one (SPI mode 0).`,
    ];
  if (bit < 7)
    return [
      "bits 6-1:",
      `the register address ${hx(f.r.a)}h = ${f.r.a.toString(2).padStart(6, "0")}, one bit per clock. So ${f.r.name} ${f.read ? "reads" : "writes"} as ${hx(f.addr)}h.`,
    ];
  if (bit === 7) return ["bit 0:", "always 0. The chip has 64 registers, 6 bits are enough."];
  if (!f.read)
    return [
      "byte 1:",
      `the value to write, ${hx(f.data)}h. MISO carries nothing useful during a write.`,
    ];
  if (f.fault === "none")
    return [
      "byte 1 on MISO:",
      `${hx(f.answer)}h. ${f.r.what}. Meanwhile MOSI sends 00 (or the next address in a burst).`,
    ];
  if (f.fault === "power")
    return [
      "byte 1 on MISO:",
      "00h. An unpowered chip can't drive MISO high: every register reads 00. The firmware prints “nothing (MISO stuck low?)”: check 3.3V and GND.",
    ];
  return [
    "byte 1 on MISO:",
    `FFh (usually). Nobody drives MISO, so it floats high: every register reads FF. ${f.fault === "ss" ? "With SDA loose the chip is never selected and stays silent." : "The chip answers, but the wire never arrives."}`,
  ];
}
