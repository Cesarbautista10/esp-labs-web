import { useRef, useState } from "react";
import { useFrameLoop } from "@/lib/animation";
import { useReducedMotion } from "@/lib/media";
import { Button, ButtonRow } from "@/ui/Button";
import { Caption } from "@/ui/Caption";
import type { WidgetProps } from "@/widgets/types";
import { quantise } from "../../protocol/midi";
import styles from "../panels.module.css";
import { SvgPainter } from "../svg";

const INTERVALS = [7.5, 15, 30] as const;
const RHYTHMS = [
  [62.5, "sixteenths at 240 bpm (62.5 ms)"],
  [40, "a fast trill (40 ms)"],
  [125, "eighths at 240 bpm (125 ms)"],
] as const;
const X0 = 150;
const X1 = 670;
const WINDOW = 400;
const x = (ms: number) => X0 + (ms / WINDOW) * (X1 - X0);

function draw(p: SvgPainter, interval: number, step: number, sweep: number) {
  const T = (xx: number, y: number, s: string) =>
    p.add(
      "text",
      { x: xx, y, fill: "var(--muted)", "font-size": 12 * 1.3, "font-family": "var(--font-body)" },
      s,
    );
  p.clear();
  const { notes, sent } = quantise(step, interval, WINDOW);
  const lanes = [
    ["you play", 40],
    ["radio events", 90],
    ["synth: on arrival", 140],
    ["synth: timestamps", 190],
  ] as const;
  lanes.forEach(([s, y]) => {
    T(8, y + 4, s);
    p.add("line", { x1: X0, y1: y, x2: X1, y2: y, stroke: "var(--line)" });
  });
  for (let e = 0; e <= WINDOW; e += interval)
    p.add("line", {
      x1: x(e),
      y1: 82,
      x2: x(e),
      y2: 98,
      stroke: "var(--scope-blue)",
      "stroke-width": 1.5,
    });
  notes.forEach((t, i) => {
    if (t > sweep) return;
    p.add("circle", { cx: x(t), cy: 40, r: 5, fill: "var(--w-cs)" });
    const out = sent[i] ?? t;
    if (out > sweep) return;
    p.add("line", { x1: x(t), y1: 45, x2: x(out), y2: 86, stroke: "var(--scope-amber)" });
    p.add("circle", { cx: x(out), cy: 140, r: 5, fill: "var(--danger)" });
    // With timestamps: played at the original spacing, a fixed small delay later (one interval).
    p.add("circle", { cx: x(t + interval), cy: 190, r: 5, fill: "var(--ok)" });
  });
}

/** B7: notes quantised to connection events, and what timestamps give back. */
export function B7Latency(_: WidgetProps) {
  const reduce = useReducedMotion();
  const [interval, setIntervalMs] = useState<number>(15);
  const [step, setStep] = useState<number>(62.5);
  const svgRef = useRef<SVGSVGElement>(null);
  const { err } = quantise(step, interval, WINDOW);

  useFrameLoop(svgRef, ({ now }) => {
    if (svgRef.current)
      draw(
        new SvgPainter(svgRef.current),
        interval,
        step,
        reduce ? WINDOW : (now / 8) % (WINDOW + 60),
      );
  });

  return (
    <div className={styles.wd}>
      <ButtonRow role="group" aria-label="Interval and rhythm">
        {INTERVALS.map((v) => (
          <Button key={v} pressed={v === interval} onClick={() => setIntervalMs(v)}>
            {v} ms
          </Button>
        ))}
        <label className={styles.ctl}>
          play
          <select
            className={styles.select}
            aria-label="Rhythm"
            value={step}
            onChange={(e) => setStep(Number(e.target.value))}
          >
            {RHYTHMS.map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </ButtonRow>
      <div className={styles.scroll}>
        <svg
          ref={svgRef}
          viewBox="0 0 680 230"
          className={styles.full}
          role="img"
          aria-label="Notes played, the connection events that carry them, and when two kinds of synth play them"
        />
      </div>
      <Caption live>
        Interval {interval} ms: each note waits 0 to {interval} ms for the next radio event. A synth
        that plays notes on arrival moves the gaps between them by up to {err.toFixed(1)} ms (red).
        With the timestamps it keeps your timing exactly and plays everything {interval} ms late
        (green).
      </Caption>
    </div>
  );
}
