// B3 "The Bench service, live": the GATT rows and the ATT packets each operation sends.
import { ascii, hx } from "../../protocol/hex";

export type Op = "read" | "write" | "subscribe" | "notify";

export interface GattRow {
  readonly name: string;
  readonly uuid: string;
  /** Value handle. */
  readonly h: number;
  readonly props: string;
  /** The CCCD's handle (value handle + 1) for notifying rows. */
  readonly cccd?: number;
  readonly ops: Partial<Record<Op, readonly number[]>>;
  show(v: readonly number[]): string;
}

const at = (v: readonly number[], i: number) => v[i] ?? 0;

export const GATT_ROWS: readonly GattRow[] = [
  {
    name: "LED",
    uuid: "ba5e0001",
    h: 0x10,
    props: "read · write",
    ops: { read: [0xff, 0x50, 0x00], write: [0x00, 0x80, 0xff] },
    show: (v) => `R ${at(v, 0)} G ${at(v, 1)} B ${at(v, 2)}`,
  },
  {
    name: "Message",
    uuid: "ba5e0002",
    h: 0x13,
    props: "read · write",
    ops: { write: ascii("hi bench") },
    show: (v) => `“${String.fromCharCode(...v)}”`,
  },
  {
    name: "Button",
    uuid: "ba5e0003",
    h: 0x16,
    props: "read · notify",
    cccd: 0x17,
    ops: { subscribe: [0x01, 0x00], notify: [0x02, 0x08, 0x00] },
    show: (v) =>
      v.length === 2
        ? "CCCD = notifications on"
        : `gesture ${at(v, 0)} (${["", "click", "double", "long"][at(v, 0)] ?? ""}), count ${at(v, 1) | (at(v, 2) << 8)}`,
  },
  {
    name: "Temperature",
    uuid: "ba5e0004",
    h: 0x1a,
    props: "read · notify",
    ops: { read: [0x2e, 0x10] },
    show: (v) => `${(((at(v, 1) << 24) >> 16) | at(v, 0)) / 100} °C`,
  },
  {
    name: "Uptime",
    uuid: "ba5e0005",
    h: 0x1e,
    props: "read",
    ops: { read: [0x2c, 0x01, 0x00, 0x00] },
    show: (v) => `${at(v, 0) | (at(v, 1) << 8) | (at(v, 2) << 16)} s`,
  },
];

interface OpSpec {
  req(r: GattRow, v: readonly number[]): number[];
  rsp: ((r: GattRow, v: readonly number[]) => number[]) | null;
  /** "in": the phone asks the board; "out": the board sends on its own. */
  dir: "in" | "out";
  what: string;
}

export const OPS: Readonly<Record<Op, OpSpec>> = {
  read: {
    req: (r) => [0x0a, r.h, 0x00],
    rsp: (_, v) => [0x0b, ...v],
    dir: "in",
    what: "Read Request (0A) + handle → Read Response (0B) + value",
  },
  write: {
    req: (r, v) => [0x12, r.h, 0x00, ...v],
    rsp: () => [0x13],
    dir: "in",
    what: "Write Request (12) + handle + value → Write Response (13)",
  },
  subscribe: {
    req: (r, v) => [0x12, r.cccd ?? r.h + 1, 0x00, ...v],
    rsp: () => [0x13],
    dir: "in",
    what: "a Write Request into the CCCD descriptor (handle + 1): 01 00 = notifications on",
  },
  notify: {
    req: (r, v) => [0x1b, r.h, 0x00, ...v],
    rsp: null,
    dir: "out",
    what: "Handle Value Notification (1B) + handle + value, no answer",
  },
};

export const handleLabel = (r: GattRow): string => `${r.uuid} · ${hx(r.h)}h · ${r.props}`;
