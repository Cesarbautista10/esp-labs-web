// S6 panel: the secret rhythm and your attempt, both stretched to the same length.
import type { ScopePalette } from "@/lib/canvas";
import { display, mono, textWriter } from "../../kit/draw";
import type { RhythmMatch } from "../../model/rhythm";

export interface KnockPicture {
  secret: readonly number[];
  attempt: readonly number[];
  open: readonly number[];
  setting: boolean;
  result: RhythmMatch | null;
  /** 0..1 of the 1.5 s pause that ends a pattern. */
  quiet: number;
  tol: number;
}

function row(
  g: CanvasRenderingContext2D,
  C: ScopePalette,
  y: number,
  r: readonly number[],
  col: string,
  label: string,
  errs: readonly number[] | null,
  tol: number,
): void {
  const T = textWriter(g);
  const x0 = 120;
  const w = 520;
  const first = r[0] ?? 0;
  const len = r.length > 1 ? (r.at(-1) ?? 0) - first : 1;
  T(14, y + 14, label, C.muted);
  g.fillStyle = C.dim;
  g.fillRect(x0, y + 10, w, 1);
  r.forEach((v, i) => {
    const x = x0 + ((v - first) / len) * w;
    g.fillStyle = col;
    g.beginPath();
    g.roundRect(x - 3, y, 6, 22, 2);
    g.fill();
    const next = r[i + 1];
    if (next === undefined) return;
    const nx = x0 + ((next - first) / len) * w;
    const share = (next - v) / len;
    T((x + nx) / 2, y - 4, `${Math.round(share * 100)}%`, C.ink, mono(10), "center");
    const err = errs?.[i];
    if (err !== undefined) {
      g.fillStyle = err <= tol / 2 ? C.teal : err <= tol ? C.amber : C.coral;
      g.fillRect(x + 5, y + 26, Math.max(1, nx - x - 10), 4);
    }
  });
  if (r.length > 1)
    T(x0 + w, y + 46, `${(len / 1000).toFixed(2)} s long`, C.muted, mono(10), "right");
}

export function drawKnocks(g: CanvasRenderingContext2D, C: ScopePalette, k: KnockPicture): void {
  const T = textWriter(g);
  g.fillStyle = C.paper;
  g.fillRect(0, 0, 680, 250);
  if (k.secret.length) row(g, C, 40, k.secret, C.pink, "secret", null, k.tol);
  else T(120, 54, "no secret yet: knock one", C.amber);
  if (k.open.length) {
    row(g, C, 140, k.open, C.amber, k.setting ? "new secret…" : "knocking…", null, k.tol);
    g.fillStyle = C.amber;
    g.fillRect(120, 230, 520 * k.quiet, 3);
    T(120, 246, "1.5 s of quiet ends the pattern", C.muted, mono(10));
  } else if (k.attempt.length)
    row(g, C, 140, k.attempt, C.ink, "your knock", k.result?.errs ?? null, k.tol);
  if (k.result && !k.open.length)
    T(
      640,
      22,
      k.result.ok ? "OPEN" : "LOCKED",
      k.result.ok ? C.teal : C.coral,
      display(16),
      "right",
    );
}
