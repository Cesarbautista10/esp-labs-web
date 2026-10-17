// B2 "Build an advertisement": the fields you can place, the board's modes as presets, and the
// two 31-byte packets that result.
import { B2_UUID, b2Url } from "../../protocol/advertising";

export type FieldKey =
  "flags" | "name" | "tx" | "app" | "svc16" | "svc128" | "maker" | "ibeacon" | "url";
export type Place = "" | "adv" | "rsp";
export type Placement = Partial<Record<FieldKey, Place>>;

export interface BuilderField {
  readonly k: FieldKey;
  readonly name: string;
  readonly type: number;
  /** A CSS colour (token reference). */
  readonly col: string;
  readonly why: string;
  data(name: string, url: string): number[];
}

export const BUILDER_FIELDS: readonly BuilderField[] = [
  {
    k: "flags",
    name: "Flags",
    type: 0x01,
    col: "var(--ble)",
    data: () => [0x06],
    why: "02 01 06: LE General Discoverable, Classic not supported. Phones skip adverts that aren't discoverable.",
  },
  {
    k: "name",
    name: "Name",
    type: 0x09,
    col: "var(--scope-amber)",
    data: (name) => [...name].map((c) => c.charCodeAt(0) & 0x7f),
    why: "Complete Local Name: what people read in the list. Each letter is one byte.",
  },
  {
    k: "tx",
    name: "TX power",
    type: 0x0a,
    col: "var(--scope-trace)",
    data: () => [9],
    why: "The power the board sends with (+9 dBm). A phone compares it with the RSSI it measures to guess distance.",
  },
  {
    k: "app",
    name: "Appearance",
    type: 0x19,
    col: "var(--scope-violet)",
    data: () => [0x40, 0x05],
    why: "0540 = generic sensor. Phones pick an icon from it (0x03C1 would be a keyboard).",
  },
  {
    k: "svc16",
    name: "16-bit service",
    type: 0x03,
    col: "var(--scope-coral)",
    data: () => [0x0f, 0x18],
    why: "180F, the Battery service, little-endian: standard services fit in 2 bytes.",
  },
  {
    k: "svc128",
    name: "128-bit service",
    type: 0x07,
    col: "var(--w-dc)",
    data: () => [...B2_UUID].reverse(),
    why: "The Bench service UUID: our own services need the full 16 bytes, more than half the budget. B3 puts it here so apps can filter by it.",
  },
  {
    k: "maker",
    name: "Maker FFFF",
    type: 0xff,
    col: "var(--w-scl)",
    data: () => [0xff, 0xff, 0x01, 0x01, 0x00, 0x2e, 0x10, 0x2c, 0x01],
    why: "Manufacturer data: 2 bytes company ID (FFFF = test), then anything you like: B2's version, presses, temperature, uptime.",
  },
  {
    k: "ibeacon",
    name: "iBeacon",
    type: 0xff,
    col: "var(--w-btn)",
    data: () => [0x4c, 0x00, 0x02, 0x15, ...B2_UUID, 0x00, 0x01, 0x00, 0x02, -59 & 255],
    why: "Apple's manufacturer data: 4C 00 02 15, UUID, major, minor, power at 1 m. 27 bytes: nothing else but Flags fits.",
  },
  {
    k: "url",
    name: "Eddystone-URL",
    type: 0x16,
    col: "var(--w-res)",
    data: (_, url) => [0xaa, 0xfe, ...(b2Url(url) ?? [])],
    why: "Service data for FEAA: frame 10, power at 0 m, scheme byte, then the URL with .com/ and friends as single bytes.",
  },
];

export const PRESETS = {
  bench: { flags: "adv", name: "adv", maker: "adv", tx: "rsp", app: "rsp" },
  ibeacon: { flags: "adv", ibeacon: "adv", name: "rsp" },
  url: { flags: "adv", svc16: "adv", url: "adv", name: "rsp" },
  name: { flags: "adv", name: "adv", tx: "adv" },
  b3: { flags: "adv", svc128: "adv", name: "rsp", app: "rsp" },
} as const satisfies Record<string, Placement>;

export type PresetKey = keyof typeof PRESETS;
export const PRESET_KEYS = Object.keys(PRESETS) as PresetKey[];

export interface Cell {
  readonly b: number;
  /** Index of its field in BUILDER_FIELDS. */
  readonly i: number;
  /** Length or type byte. */
  readonly head: boolean;
}

/** The bytes of one packet ("adv" or "rsp"), in field order. */
export function packetCells(
  place: Placement,
  where: "adv" | "rsp",
  name: string,
  url: string,
): Cell[] {
  const cells: Cell[] = [];
  BUILDER_FIELDS.forEach((f, i) => {
    if (place[f.k] !== where) return;
    const d = f.data(name, url);
    [d.length + 1, f.type, ...d].forEach((b, j) => cells.push({ b, i, head: j < 2 }));
  });
  return cells;
}
