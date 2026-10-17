import { useId, useRef, useState } from "react";
import { useFrameLoop } from "@/lib/animation";
import { context2d, scopePalette } from "@/lib/canvas";
import { useReducedMotion } from "@/lib/media";
import { Button } from "@/ui/Button";
import { Caption } from "@/ui/Caption";
import type { WidgetProps } from "@/widgets/types";
import styles from "../panels.module.css";
import { drawRadio, RADIO_H, RADIO_W } from "./draw-radio";
import { RadioSim } from "./radio-sim";

type Mode = "passive" | "active";

/** B1: three advertising channels and a scanner's listening window. */
export function BleRadio(_: WidgetProps) {
  const reduce = useReducedMotion();
  const [win, setWin] = useState(50);
  const [mode, setMode] = useState<Mode>("passive");
  const [playing, setPlaying] = useState(!reduce);
  const [sim] = useState(() => {
    const s = new RadioSim();
    s.step(600, 50);
    return s;
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const winId = useId();

  useFrameLoop(canvasRef, ({ dt }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (playing) sim.step(Math.min(dt * 1000, 50) / 20, win);
    drawRadio(context2d(canvas), scopePalette(), sim, win, mode === "active");
  });

  return (
    <div className={styles.wd}>
      <div className={styles.ctl}>
        <label htmlFor={winId}>listening window</label>
        <input
          id={winId}
          type="range"
          min={10}
          max={100}
          step={10}
          value={win}
          aria-label="Scan window in percent of the interval"
          onChange={(e) => {
            setWin(Number(e.target.value));
            sim.resetCounts();
          }}
        />
        <span className={styles.mono}>{win} %</span>
        <select
          className={styles.select}
          aria-label="Scan mode"
          value={mode}
          onChange={(e) => {
            setMode(e.target.value === "active" ? "active" : "passive");
            sim.resetCounts();
          }}
        >
          <option value="passive">passive scan</option>
          <option value="active">active scan</option>
        </select>
        <Button onClick={() => setPlaying((p) => !p)}>{playing ? "❚❚ Pause" : "▶ Play"}</Button>
      </div>
      <div className={styles.scroll}>
        <canvas
          ref={canvasRef}
          width={RADIO_W}
          height={RADIO_H}
          className={styles.full}
          role="img"
          aria-label="The 2.4 GHz band with the 40 Bluetooth channels and three Wi-Fi channels, and below it a timeline of advertising packets on channels 37, 38 and 39 and the scanner's listening windows."
        />
      </div>
      <Caption live>
        The board listens {win} % of the time, one channel per 100 ms. Each device sends every
        packet three times, once per channel, so a listener on any one channel still hears it.{" "}
        {mode === "active"
          ? "Active: every packet heard from a scannable device gets a scan request back, and the device answers with a second packet (more names, more data)."
          : "Passive: the board never transmits."}
      </Caption>
    </div>
  );
}
