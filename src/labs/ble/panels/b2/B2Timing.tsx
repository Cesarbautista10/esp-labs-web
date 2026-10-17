import { useId, useRef, useState } from "react";
import { useFrameLoop } from "@/lib/animation";
import { context2d, scopePalette } from "@/lib/canvas";
import { useReducedMotion } from "@/lib/media";
import { Button } from "@/ui/Button";
import type { WidgetProps } from "@/widgets/types";
import styles from "../panels.module.css";
import { drawTiming, TIMING_H, TIMING_W } from "./draw-timing";
import { lockstep, type TimingSettings, TimingSim } from "./timing-sim";

interface Slider {
  readonly key: "adv" | "si" | "win";
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly aria: string;
}

const SLIDERS: readonly Slider[] = [
  {
    key: "adv",
    label: "advert every",
    min: 20,
    max: 1000,
    step: 10,
    aria: "Advertising interval in ms",
  },
  { key: "si", label: "scan interval", min: 30, max: 400, step: 10, aria: "Scan interval in ms" },
  {
    key: "win",
    label: "window",
    min: 5,
    max: 100,
    step: 5,
    aria: "Scan window in percent of the scan interval",
  },
];

/** B2: advertising timing against a scanner's listening windows. */
export function B2Timing(_: WidgetProps) {
  const reduce = useReducedMotion();
  const [values, setValues] = useState({ adv: 100, si: 100, win: 30 });
  const [delay, setDelay] = useState(true);
  const [playing, setPlaying] = useState(!reduce);
  const [sim] = useState(() => new TimingSim());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // The result line changes with every event: written by the frame loop into empty nodes.
  const countRef = useRef<HTMLElement>(null);
  const restRef = useRef<HTMLSpanElement>(null);
  const warnRef = useRef<HTMLElement>(null);
  const tailRef = useRef<HTMLSpanElement>(null);
  const delayId = useId();

  const settings: TimingSettings = {
    adv: values.adv,
    si: values.si,
    win: Math.round((values.si * values.win) / 100),
    delay,
  };
  const shown = { adv: `${settings.adv} ms`, si: `${settings.si} ms`, win: `${settings.win} ms` };

  useFrameLoop(canvasRef, ({ dt }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // A quarter of real speed, so single events stay visible.
    sim.advance(playing ? Math.min(dt * 1000, 50) * 0.25 : 0, settings);
    drawTiming(context2d(canvas), scopePalette(), sim, settings);
    const pct = sim.total ? Math.round((sim.caught / sim.total) * 100) : 0;
    const stuck = lockstep(settings);
    if (countRef.current) countRef.current.textContent = `${sim.caught} of ${sim.total}`;
    if (restRef.current)
      restRef.current.textContent = ` advertising events heard (${pct} %). The scanner listens ${Math.round((settings.win / settings.si) * 100)} % of the time, one channel per scan interval${sim.firstCatch !== null ? `; first heard after ${Math.round(sim.firstCatch)} ms` : ""}. `;
    if (warnRef.current)
      warnRef.current.textContent = stuck
        ? "No random delay and intervals that divide evenly:"
        : "";
    if (tailRef.current)
      tailRef.current.textContent = stuck
        ? " the two clocks stay in lockstep, so the same packets get missed forever. That's what advDelay prevents."
        : "Longer interval = fewer chances = the phone notices the board later, but the battery lasts longer.";
  });

  return (
    <div className={styles.wd}>
      <div className={styles.ctl}>
        {SLIDERS.map((s) => (
          <label key={s.key}>
            {s.label}
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={values[s.key]}
              aria-label={s.aria}
              onChange={(e) => {
                setValues((v) => ({ ...v, [s.key]: Number(e.target.value) }));
                sim.reset();
              }}
            />
            <b className={styles.mono}>{shown[s.key]}</b>
          </label>
        ))}
        <label htmlFor={delayId}>
          <input
            id={delayId}
            type="checkbox"
            checked={delay}
            onChange={(e) => {
              setDelay(e.target.checked);
              sim.reset();
            }}
          />{" "}
          random 0-10 ms advDelay
        </label>
        <Button aria-label={playing ? "Pause" : "Play"} onClick={() => setPlaying((p) => !p)}>
          {playing ? "❚❚" : "▶"}
        </Button>
      </div>
      <div className={styles.scroll}>
        <canvas
          ref={canvasRef}
          width={TIMING_W}
          height={TIMING_H}
          className={styles.full}
          role="img"
          aria-label="Timeline: the board's advertising events on channels 37, 38 and 39, the scanner's listening windows, caught packets in green and missed ones in grey."
        />
      </div>
      <p className={styles.field}>
        <b ref={countRef} />
        <span ref={restRef} />
        <b ref={warnRef} />
        <span ref={tailRef} />
      </p>
    </div>
  );
}
