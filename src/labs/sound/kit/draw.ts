// Small canvas helpers every sound screen and panel shares.
import { DISPLAY_FONT, MONO_FONT, type ScopePalette } from "@/lib/canvas";
import { levelTone } from "../model/level";

export const mono = (px: number, bold = false) => `${bold ? "bold " : ""}${px}px ${MONO_FONT}`;
export const display = (px: number, bold = true) => `${bold ? "bold " : ""}${px}px ${DISPLAY_FONT}`;

/** The screen's two fonts: 8 px mono for small print, 12 px bold Archivo for values. */
export const S8 = mono(8);
export const B12 = display(12);

export type TextFn = (
  x: number,
  y: number,
  s: string,
  col: string,
  font?: string,
  align?: CanvasTextAlign,
) => void;

/** A text writer bound to one context (default: 11 px mono, the panels' size). */
export function textWriter(g: CanvasRenderingContext2D, defaultFont = mono(11)): TextFn {
  return (x, y, s, col, font = defaultFont, align = "left") => {
    g.font = font;
    g.fillStyle = col;
    g.textAlign = align;
    g.fillText(s, x, y);
    g.textAlign = "left";
  };
}

/** Calm, loud, very loud: the colour of a level in dB above the quiet. */
export const levelColour = (C: ScopePalette, above: number) => C[levelTone(above)];

/** A waveform the way sv::wave draws it: one column per pixel, min..max of the samples in it. */
export function drawWave(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  s: ArrayLike<number>,
  n: number,
  scale: number,
  col: string,
): void {
  const mid = y + h / 2;
  g.fillStyle = col;
  const k = (h / 2 - 1) / scale;
  for (let c = 0; c < w; c++) {
    const a = Math.floor((c * n) / w);
    const b = Math.max(a + 1, Math.floor(((c + 1) * n) / w));
    let lo = 1e9;
    let hi = -1e9;
    for (let i = a; i < b && i < n; i++) {
      const v = s[i] ?? 0;
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
    }
    const y0 = Math.max(y, Math.min(y + h - 1, mid - hi * k));
    const y1 = Math.max(y, Math.min(y + h - 1, mid - lo * k));
    g.fillRect(x + c, y0, 1, Math.max(1, y1 - y0 + 1));
  }
}

/** A labelled value on the board's screen: small grey label, bold value under it. */
export function drawStat(
  g: CanvasRenderingContext2D,
  C: ScopePalette,
  x: number,
  y: number,
  label: string,
  value: string,
  col?: string,
): void {
  const T = textWriter(g);
  T(x, y + 7, label, C.muted, S8);
  T(x, y + 24, value, col ?? C.ink, B12);
}

/** The largest absolute value in a list of samples. */
export function maxAbs(s: ArrayLike<number>, floor = 0): number {
  let m = floor;
  for (let i = 0; i < s.length; i++) m = Math.max(m, Math.abs(s[i] ?? 0));
  return m;
}
