import { bleCrc24 } from "../../protocol/crc24";
import { ascii, hx, hxs, int8 } from "../../protocol/hex";

type Ad = readonly [type: number, data: readonly number[]];

interface Sample {
  readonly label: string;
  /** PDU type: 0 ADV_IND, 2 ADV_NONCONN_IND, 6 ADV_SCAN_IND. */
  readonly pdu: number;
  /** 1 = random address. */
  readonly txAdd: number;
  readonly addr: readonly number[];
  readonly ad: readonly Ad[];
}

export const SAMPLES = {
  phone: {
    label: "an iPhone",
    pdu: 0x0,
    txAdd: 1,
    addr: [0x5a, 0x3c, 0x91, 0x2e, 0x7b, 0x44],
    ad: [
      [0x01, [0x1a]],
      [0xff, [0x4c, 0x00, 0x10, 0x05, 0x01, 0x18, 0x7a, 0x9e, 0x3f]],
      [0x0a, [0x0c]],
    ],
  },
  jbl: {
    label: "a JBL speaker",
    pdu: 0x0,
    txAdd: 0,
    addr: [0x2c, 0x4f, 0xc2, 0x10, 0x8a, 0x61],
    ad: [
      [0x01, [0x06]],
      [0xff, [0x57, 0x00, 0x1d, 0x22, 0x01, 0x05, 0x64, 0x00, 0x00, 0x18, 0x03, 0x02, 0x00, 0x01]],
      [0x09, ascii("JBL Flip 6")],
    ],
  },
  keyboard: {
    label: "a BLE keyboard",
    pdu: 0x0,
    txAdd: 1,
    addr: [0xd4, 0x12, 0x8b, 0x77, 0x01, 0xe9],
    ad: [
      [0x01, [0x05]],
      [0x19, [0xc1, 0x03]],
      [0x03, [0x12, 0x18]],
      [0x09, ascii("MX Keys")],
    ],
  },
  bench: {
    label: "your B2 beacon",
    pdu: 0x2,
    txAdd: 0,
    addr: [0x7c, 0xdf, 0xa1, 0x0b, 0x5e, 0x3c],
    ad: [
      [0x01, [0x06]],
      [0x09, ascii("Bench B2")],
      [0xff, [0xff, 0xff, 0x01, 0x07, 0x00, 0x5e, 0x10, 0x2c, 0x01]],
    ],
  },
} as const satisfies Record<string, Sample>;

export type SampleKey = keyof typeof SAMPLES;
export const SAMPLE_KEYS = Object.keys(SAMPLES) as SampleKey[];

const b = (d: readonly number[], i: number) => d[i] ?? 0;
const pair = (d: readonly number[]) => hxs([b(d, 1), b(d, 0)]).replace(" ", "");

const AD_WHAT: Readonly<Record<number, (d: readonly number[]) => string>> = {
  0x01: (d) =>
    `Flags ${hx(b(d, 0))}: ${b(d, 0) & 2 ? "general discoverable" : b(d, 0) & 1 ? "limited discoverable (only for a while, like pairing mode)" : "not discoverable"}${b(d, 0) & 4 ? ", LE only (no Classic Bluetooth)" : ", Classic Bluetooth too"}.`,
  0x09: (d) =>
    `Complete name: “${String.fromCharCode(...d)}”. Plain ASCII, no terminating zero: the length byte says where it ends.`,
  0x0a: (d) =>
    `TX power ${int8(b(d, 0))} dBm: how loud it shouts, so a listener can estimate distance.`,
  0x19: (d) =>
    `Appearance ${pair(d)}h (little-endian ${hxs(d)}): 03C1 = keyboard. The category is the top 10 bits.`,
  0x03: (d) =>
    `Complete list of 16-bit services: ${pair(d)}h = HID, the keyboard/mouse service. A host knows from the advert that this can type.`,
  0xff: (d) => {
    const id = b(d, 0) | (b(d, 1) << 8);
    if (id === 0x004c)
      return `Manufacturer data, company 004Ch = Apple (written ${hxs(d.slice(0, 2))}: little-endian). Then type ${hx(b(d, 2))} = Nearby info, ${b(d, 3)} bytes of status (screen on, Wi-Fi on, an encrypted hint). This is how iPhones find each other.`;
    if (id === 0x0057)
      return "Manufacturer data, company 0057h = Harman (JBL). The rest is JBL's own format for its app: model, colour, battery, PartyBoost state. Nobody but JBL documents it.";
    if (id === 0xffff)
      return `Manufacturer data, company FFFFh = the test ID, used by our B2 beacon: version 01, presses ${b(d, 3) | (b(d, 4) << 8)}, temperature ${((b(d, 5) | (b(d, 6) << 8)) / 100).toFixed(2)} °C, uptime ${b(d, 7) | (b(d, 8) << 8)} s. All little-endian.`;
    return "Manufacturer data.";
  },
};

const PDU_NAMES: Readonly<Record<number, string>> = {
  0: "ADV_IND (connectable, scannable)",
  2: "ADV_NONCONN_IND (broadcast only)",
  6: "ADV_SCAN_IND (scannable)",
};
const AD_COLOURS = ["var(--ok)", "var(--warn)", "var(--copper)", "var(--w-sda)"] as const;

export interface PacketField {
  readonly name: string;
  readonly bytes: readonly number[];
  /** A CSS colour (a token reference). */
  readonly col: string;
  readonly what: string;
}

/** One advertising packet as sent on air, field by field, with what each field means. */
export function anatomy(key: SampleKey): { fields: PacketField[]; used: number } {
  const s: Sample = SAMPLES[key];
  const adData = s.ad.flatMap(([type, d]) => [d.length + 1, type, ...d]);
  const header = [s.pdu | (s.txAdd << 6), 6 + adData.length];
  const addrLE = [...s.addr].reverse();
  const pduBytes = [...header, ...addrLE, ...adData];
  const top = s.addr[0] ?? 0;
  const fields: PacketField[] = [
    {
      name: "preamble",
      bytes: [0xaa],
      col: "var(--muted)",
      what: "Preamble AAh: 10101010, so the receiver can lock onto the bit timing. Every advertising packet starts like this.",
    },
    {
      name: "access address",
      bytes: [0xd6, 0xbe, 0x89, 0x8e],
      col: "var(--muted)",
      what: "Access address 8E89BED6h (sent little-endian): the fixed value for all advertising. A connection later gets its own random one.",
    },
    {
      name: "header",
      bytes: header,
      col: "var(--w-cs)",
      what: `PDU header: type ${s.pdu} = ${PDU_NAMES[s.pdu] ?? ""}, TxAdd ${s.txAdd} = ${s.txAdd ? "random address" : "public address"}, then the length: ${header[1]} bytes follow (6 address + ${adData.length} data).`,
    },
    {
      name: "AdvA",
      bytes: addrLE,
      col: "var(--ble)",
      what: `The advertiser's address ${s.addr.map(hx).join(":")}, sent backwards (little-endian). ${s.txAdd ? (top >> 6 === 1 ? "Top bits 01: a resolvable private address that changes every ~15 min." : "A random address.") : "A public address, burnt in at the factory."}`,
    },
    ...s.ad.map(([type, d], i) => ({
      name: `AD ${i + 1}`,
      bytes: [d.length + 1, type, ...d],
      col: AD_COLOURS[i % 4] ?? "var(--ok)",
      what: `AD structure: length ${hx(d.length + 1)}, type ${hx(type)}. ${AD_WHAT[type]?.(d) ?? ""}`,
    })),
    {
      name: "CRC",
      bytes: bleCrc24(pduBytes),
      col: "var(--muted)",
      what: "CRC-24 over header, address and data: the receiver recomputes it and throws the packet away if one bit flipped. (On air every bit after the access address is also “whitened”, scrambled with a pattern that depends on the channel, to avoid long runs of zeros.)",
    },
  ];
  return { fields, used: adData.length };
}
