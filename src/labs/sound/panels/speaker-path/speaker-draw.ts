// S7 panel: samples → I2S1 → class D pulses → the cone; the squared volume; the echo guard.
import type { ScopePalette } from "@/lib/canvas";
import { display, levelColour, mono, textWriter } from "../../kit/draw";

/** Volume 0-100 → the gain every sample is multiplied by (squared, like the board). */
export const volumeGain = (vol: number) => (vol / 100) ** 2;

/** `t`: seconds for the waves; `tt`: the slowed phase of the samples; `loopT`: 0-6 s of the echo-guard loop. */
export function drawSpeakerPath(
  g: CanvasRenderingContext2D,
  C: ScopePalette,
  vol: number,
  t: number,
  tt: number,
  loopT: number,
): void {
  const T = textWriter(g);
  const gain = volumeGain(vol);
  const small = mono(10);
  g.fillStyle = C.paper;
  g.fillRect(0, 0, 680, 400);
  // 1. Samples.
  T(12, 16, "samples (16-bit)", C.muted);
  for (let i = 0; i < 24; i++) {
    const v = Math.sin((i / 24) * Math.PI * 2 + tt * 6) * gain;
    g.fillStyle = C.pink;
    g.fillRect(14 + i * 5, 60 - v * 30, 3, 3);
  }
  // 2. I2S1.
  g.strokeStyle = C.violet;
  g.beginPath();
  g.roundRect(140, 26, 136, 64, 8);
  g.stroke();
  T(208, 46, "I2S1", C.ink, display(12), "center");
  T(208, 62, "BCLK 39 · LRC 38", C.muted, mono(9), "center");
  T(208, 76, "DIN 47 · L = R", C.muted, mono(9), "center");
  // 3. Class D: pulses whose width follows the sample.
  T(290, 16, "MAX98357A: on/off ~300 000 times a second", C.muted);
  g.strokeStyle = C.amber;
  g.beginPath();
  for (let k = 0; k < 28; k++) {
    const v = Math.sin((k / 28) * Math.PI * 2 + tt * 6) * gain;
    const duty = 0.5 + 0.45 * v;
    const x = 290 + k * 9;
    g.moveTo(x, 80);
    g.lineTo(x, 34);
    g.lineTo(x + 9 * duty, 34);
    g.lineTo(x + 9 * duty, 80);
    g.lineTo(x + 9, 80);
  }
  g.stroke();
  // 4. The cone follows the average.
  const cone = Math.sin(tt * 6 * 4.6) * gain;
  const cx = 600 + cone * 12;
  g.fillStyle = C.dim;
  g.fillRect(580, 30, 8, 60);
  g.strokeStyle = C.ink;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(588, 40);
  g.lineTo(cx + 30, 22);
  g.moveTo(588, 80);
  g.lineTo(cx + 30, 98);
  g.moveTo(cx + 30, 22);
  g.lineTo(cx + 30, 98);
  g.stroke();
  g.lineWidth = 1;
  for (let k = 0; k < 3; k++) {
    const r = ((t * 30 + k * 14) % 42) + 8;
    g.strokeStyle = C.pink;
    g.globalAlpha = gain * (1 - r / 52);
    g.beginPath();
    g.arc(cx + 34, 60, r, -0.7, 0.7);
    g.stroke();
  }
  g.globalAlpha = 1;
  T(605, 116, "the cone", C.muted, small, "center");
  // Volume is squared.
  const gx = 20;
  const gy = 160;
  const gw = 150;
  const gh = 90;
  g.strokeStyle = C.dim;
  g.strokeRect(gx, gy, gw, gh);
  g.strokeStyle = C.teal;
  g.beginPath();
  for (let i = 0; i <= 100; i++) {
    const x = gx + (i / 100) * gw;
    const y = gy + gh - (i / 100) ** 2 * gh;
    if (i) g.lineTo(x, y);
    else g.moveTo(x, y);
  }
  g.stroke();
  g.fillStyle = C.ink;
  g.beginPath();
  g.arc(gx + (vol / 100) * gw, gy + gh - gain * gh, 4, 0, 7);
  g.fill();
  T(gx, gy - 6, "vol → loudness (squared: 50 = a quarter)", C.muted, small);
  drawEchoGuard(g, C, loopT);
  T(
    12,
    334,
    "Volume is squared because ears hear ratios: 100 → 50 is −12 dB, a quarter of the power.",
    C.muted,
    small,
  );
  T(
    12,
    352,
    "The mic and the speaker share the room: while the speaker plays (and 200 ms after), the",
    C.muted,
    small,
  );
  T(
    12,
    368,
    "detectors get no frames. A beep is never a clap. S8's live effects read the ring instead.",
    C.muted,
    small,
  );
}

/** The echo guard, a 6 s loop: a beep, a clap during it (ignored), a clap later (heard). */
function drawEchoGuard(g: CanvasRenderingContext2D, C: ScopePalette, loopT: number): void {
  const T = textWriter(g);
  const ex = 300;
  const ew = 360;
  const ey = 160;
  const xOf = (s: number) => ex + (s / 6) * ew;
  T(ex, ey - 6, "the echo guard: the mic hears the board's own beep", C.muted, mono(10));
  g.fillStyle = C.violet;
  g.globalAlpha = 0.18;
  g.fillRect(xOf(1), ey, xOf(1.6) - xOf(1), 130);
  g.globalAlpha = 1;
  for (const [l, y] of [
    ["speaker", ey + 20],
    ["mic", ey + 60],
    ["to the lab", ey + 100],
  ] as const)
    T(ex - 4, y + 4, l, C.muted, mono(9), "right");
  g.fillStyle = C.pink;
  g.fillRect(xOf(1), ey + 14, xOf(1.4) - xOf(1), 12);
  for (let s = 0; s < 6; s += 0.02) {
    let lv = 3 + Math.random() * 2;
    if (s >= 1 && s < 1.4) lv = 26;
    if (s >= 1.25 && s < 1.32) lv = 40;
    if (s >= 3.5 && s < 3.58) lv = 38 - (s - 3.5) * 200;
    g.fillStyle = s <= loopT ? levelColour(C, lv) : C.dim;
    g.fillRect(xOf(s), ey + 76 - lv * 0.8, 2, lv * 0.8);
  }
  g.fillStyle = C.teal;
  g.fillRect(ex, ey + 96, xOf(1) - ex, 8);
  g.fillRect(xOf(1.6), ey + 96, ex + ew - xOf(1.6), 8);
  T(xOf(1.3), ey + 124, "muted: beep + 200 ms", C.violet, mono(9), "center");
  if (loopT > 1.3) T(xOf(1.28), ey + 48, "✗", C.coral, mono(13, true), "center");
  if (loopT > 3.55) T(xOf(3.54), ey + 48, "✓ clap", C.teal, mono(12, true), "center");
  g.fillStyle = C.ink;
  g.fillRect(xOf(loopT), ey + 8, 1.5, 104);
}
