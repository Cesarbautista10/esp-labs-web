// Analog mic vs digital mic, and one I2S frame carrying a sample on SCK, WS and SD.
import type { ScopePalette } from "@/lib/canvas";
import { display, mono, type TextFn, textWriter } from "../../kit/draw";

const hex = (v: number, n: number) =>
  (v >>> 0).toString(16).toUpperCase().padStart(n, "0").slice(-n);

/** A 24-bit sample from the slider (-100..100): a sliver of full scale, real voices are small. */
export const sampleOf = (slider: number) => Math.round((slider / 100) * 0.02 * 8388607) | 0;

function lane(
  g: CanvasRenderingContext2D,
  T: TextFn,
  C: ScopePalette,
  y: number,
  title: string,
  col: string,
  boxes: readonly (readonly [string, string])[],
): void {
  T(12, y + 22, title, col, display(12));
  boxes.forEach(([a, b], i) => {
    const x = 130 + i * 110;
    g.strokeStyle = col;
    g.beginPath();
    g.roundRect(x, y, 100, 36, 7);
    g.stroke();
    T(x + 50, y + 15, a, C.ink, mono(11), "center");
    T(x + 50, y + 29, b, C.muted, mono(9), "center");
    if (i) {
      g.fillStyle = col;
      g.fillRect(x - 10, y + 18, 10, 1.5);
    }
  });
}

export function drawMics(
  g: CanvasRenderingContext2D,
  C: ScopePalette,
  s24: number,
  tick: number,
): void {
  const T = textWriter(g);
  const small = mono(9);
  const slot = (s24 << 8) >>> 0; // the 32-bit left slot: 24 data bits, then 8 zeros
  g.fillStyle = C.paper;
  g.fillRect(0, 0, 680, 360);
  // The two paths.
  lane(g, T, C, 8, "KY-037", C.pink, [
    ["capsule", "a few mV"],
    ["+ bias", "~1.5 V on AO"],
    ["ESP32 ADC", "12-bit, 0.76 mV"],
    ["− average", "DMA, ring"],
    ["× 16", "int16"],
  ]);
  lane(g, T, C, 54, "INMP441", C.teal, [
    ["capsule", "+ its own amp"],
    ["24-bit ADC", "inside the mic"],
    ["I2S frames", "SCK · WS · SD"],
    [">> 8", "24-bit sample"],
    [">> 6", "int16 (+12 dB)"],
  ]);
  // The I2S frame: 64 SCK ticks = left slot (32) + right slot (32).
  const x0 = 70;
  const w = 600;
  const tw = w / 64;
  const yS = 128;
  const yW = 160;
  const yD = 192;
  T(12, yS + 12, "SCK", C.muted);
  T(12, yW + 12, "WS", C.muted);
  T(12, yD + 12, "SD", C.muted);
  g.strokeStyle = C.ink;
  g.beginPath();
  for (let i = 0; i < 64; i++) {
    const x = x0 + i * tw;
    g.moveTo(x, yS + 16);
    g.lineTo(x, yS);
    g.lineTo(x + tw / 2, yS);
    g.lineTo(x + tw / 2, yS + 16);
    g.lineTo(x + tw, yS + 16);
  }
  g.stroke();
  g.strokeStyle = C.amber;
  g.beginPath();
  g.moveTo(x0, yW + 16);
  g.lineTo(x0 + 32 * tw, yW + 16);
  g.lineTo(x0 + 32 * tw, yW);
  g.lineTo(x0 + w, yW);
  g.stroke();
  T(x0 + 16 * tw, yW - 2, "left slot (L/R → GND: the mic talks here)", C.amber, small, "center");
  T(x0 + 48 * tw, yW - 2, "right slot: nobody (zeros)", C.muted, small, "center");
  // SD: bit k of the slot goes out on tick k+1 (Philips: one tick after WS changes).
  for (let i = 0; i < 64; i++) {
    const x = x0 + i * tw;
    const k = i - 1;
    const bit = k >= 0 && k < 32 ? (slot >>> (31 - k)) & 1 : 0;
    const data = k >= 0 && k < 24;
    g.fillStyle = data && i <= tick ? C.teal : C.dim;
    g.globalAlpha = data ? 1 : 0.45;
    g.fillRect(x + 1, bit ? yD : yD + 12, tw - 2, 4);
    g.globalAlpha = 1;
    if (data && i <= tick && tw > 8) T(x + tw / 2, yD + 28, String(bit), C.ink, small, "center");
  }
  g.fillStyle = C.pink;
  g.fillRect(x0 + tick * tw, yS - 6, 1.5, yD + 34 - yS);
  T(x0, yD + 46, "bit 23 (the sign) first … bit 0", C.muted, small);
  T(x0 + 25 * tw, yD + 46, "8 padding zeros", C.muted, small);
  // What the board does with it.
  const got = Math.min(24, Math.max(0, tick));
  const partial = got ? slot >>> (32 - got) : 0;
  const y = 278;
  T(
    12,
    y,
    `read so far: ${got} of 24 bits${got ? `  ${partial.toString(2).padStart(got, "0")}` : ""}`,
    C.ink,
  );
  if (tick >= 25) {
    const dbfs = 20 * Math.log10(Math.max(1, Math.abs(s24 >> 6)) / 32768);
    T(
      12,
      y + 20,
      `left slot = 0x${hex(slot, 8)}  →  >> 8 = ${s24} (24-bit, ±8 388 608)  →  >> 6 = ${s24 >> 6} (int16)`,
      C.teal,
    );
    T(
      12,
      y + 40,
      `that's ${dbfs.toFixed(1)} dBFS; ≈ ${(dbfs + 111).toFixed(0)} dB SPL for a sine (dBFS + 111, from the datasheet's -26 dBFS at 94 dB SPL)`,
      C.muted,
      mono(10),
    );
  }
  T(
    12,
    y + 64,
    "SCK = 16 000 samples × 2 slots × 32 bits = 1.024 MHz, driven by the ESP32 (I2S0); the speaker uses I2S1",
    C.muted,
    mono(10),
  );
}
