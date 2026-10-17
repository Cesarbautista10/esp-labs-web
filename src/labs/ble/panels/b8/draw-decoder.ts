import { hx } from "../../protocol/hex";
import { b8Extract, type HidField } from "../../protocol/hid";
import type { SvgPainter } from "../svg";

const MODIFIERS = ["L-Ctrl", "L-Shift", "L-Alt", "L-GUI", "R-Ctrl", "R-Shift", "AltGr", "R-GUI"];
const MUTED = "var(--scope-muted)";

/** What a field is, in words and in the colour the board's reports view uses. */
export function fieldInfo(f: HidField): { name: string; col: string } {
  if (f.constant) return { name: "padding", col: "var(--scope-dim)" };
  if (f.page === 7)
    return f.variable
      ? { name: MODIFIERS[f.usage - 0xe0] ?? "modifier", col: "var(--scope-amber)" }
      : { name: `key codes (${f.count} slots)`, col: "var(--scope-trace)" };
  if (f.page === 9) return { name: `button ${f.usage}`, col: "var(--scope-amber)" };
  if (f.page === 1)
    return f.usage === 0x30
      ? { name: "X (relative)", col: "var(--scope-blue)" }
      : f.usage === 0x31
        ? { name: "Y (relative)", col: "var(--scope-violet)" }
        : { name: "wheel", col: "var(--scope-coral)" };
  if (f.page === 12) return { name: "media key (consumer usage)", col: "var(--scope-trace)" };
  return { name: "other", col: MUTED };
}

export interface ReportFrame {
  readonly device: "keyboard" | "mouse";
  readonly id: number;
  readonly data: readonly number[];
  /** The fields of this report ID. */
  readonly fields: readonly HidField[];
  /** Index into `fields` lit on its own, or undefined for all. */
  readonly lit?: number;
  /** 0..1 while the packet flies to the board. */
  readonly flying?: number;
}

/** The report flying from the device to the board, its bytes and bits, each field coloured. */
export function drawDecoder(p: SvgPainter, r: ReportFrame): void {
  const { data, fields, lit } = r;
  p.clear();
  p.add("text", { x: 8, y: 16, "font-size": 12, fill: "var(--muted)" }, r.device);
  p.add(
    "text",
    { x: 672, y: 16, "font-size": 12, fill: "var(--muted)", "text-anchor": "end" },
    "board",
  );
  p.add("line", {
    x1: 70,
    y1: 12,
    x2: 620,
    y2: 12,
    stroke: "var(--line)",
    "stroke-dasharray": "3 4",
  });
  if (r.flying !== undefined)
    p.add("circle", { cx: 70 + r.flying * 550, cy: 12, r: 5, fill: "var(--ble)" });
  p.add(
    "text",
    { x: 8, y: 44, "font-size": 11, fill: "var(--muted)", "font-family": "var(--font-mono)" },
    `report ID ${r.id} (from 2908, not in the bytes)`,
  );
  const litField = lit === undefined ? undefined : fields[lit];
  const bw = Math.min(80, 600 / Math.max(1, data.length));
  data.forEach((byte, b) => {
    const x = 8 + b * bw;
    // The box takes the colour of the first data field in this byte (padding only if nothing else).
    const inByte = fields.filter(
      (f) =>
        f.bit < b * 8 + 8 &&
        f.bit + f.size * f.count > b * 8 &&
        (lit === undefined || f === litField),
    );
    const main = inByte.find((f) => !f.constant) ?? inByte[0];
    const col = main ? fieldInfo(main).col : MUTED;
    p.add("rect", {
      x,
      y: 52,
      width: bw - 6,
      height: 30,
      rx: 4,
      fill: "none",
      stroke: col,
      "stroke-width": lit !== undefined && col !== MUTED ? 2.5 : 1,
    });
    p.add(
      "text",
      {
        x: x + (bw - 6) / 2,
        y: 72,
        "text-anchor": "middle",
        "font-family": "var(--font-mono)",
        "font-size": 14,
        fill: col,
      },
      hx(byte),
    );
    // The 8 bits, bit 0 first: HID counts from the least significant bit.
    for (let k = 0; k < 8; k++) {
      const bit = b * 8 + k;
      const f = fields.find((ff) => bit >= ff.bit && bit < ff.bit + ff.size * ff.count);
      const hot = f && (lit === undefined || f === litField);
      p.add("rect", {
        x: x + k * ((bw - 6) / 8),
        y: 88,
        width: (bw - 6) / 8 - 1,
        height: 14,
        fill: hot ? fieldInfo(f).col : "var(--scope-dim)",
        opacity: (byte >> k) & 1 ? 1 : 0.3,
      });
    }
  });
  p.add(
    "text",
    { x: 8, y: 116, "font-size": 10, fill: "var(--muted)" },
    "bits, bit 0 first in each byte (bright = 1)",
  );
  if (litField) {
    const info = fieldInfo(litField);
    const n = litField.size * litField.count;
    const val =
      litField.count > 1
        ? Array.from({ length: litField.count }, (_, i) =>
            hx(b8Extract(data, litField.bit + i * litField.size, litField.size, false)),
          ).join(" ")
        : String(b8Extract(data, litField.bit, litField.size, litField.logMin < 0));
    p.add(
      "text",
      { x: 8, y: 140, "font-size": 13, fill: info.col, "font-weight": 600 },
      `${info.name}: ${n} bit${n === 1 ? "" : "s"} from bit ${litField.bit} = ${val}`,
    );
  }
}
