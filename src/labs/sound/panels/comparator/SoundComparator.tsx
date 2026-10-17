import { type PointerEvent, useRef, useState } from "react";
import type { WidgetProps } from "@/widgets/types";
import { CanvasPanel } from "../canvas-panel/CanvasPanel";
import { Range } from "../controls";
import styles from "../panel.module.css";
import { drawComparator } from "./comparator-draw";
import { ComparatorSim, potFromY } from "./comparator-sim";

const H = 290;

/** S1 panel: the LM393 comparator and its pot; drag the dashed line or the slider. */
export function SoundComparator(_: WidgetProps) {
  const [pot, setPot] = useState(10);
  const sim = useRef<ComparatorSim | null>(null);
  const dragging = useRef(false);

  const fromPointer = (e: PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPot(potFromY(((e.clientY - r.top) / r.height) * H));
  };

  return (
    <CanvasPanel
      h={H}
      label="The AO wave over the last two seconds with the pot's threshold line, and the DO output below it: high wherever the wave is above the line."
      controls={
        <>
          <Range
            label="pot: threshold above the bias"
            ariaLabel="Comparator threshold in millivolts above the bias"
            min={1}
            max={120}
            value={pot}
            onChange={setPot}
            output={`${pot} mV`}
          />
          <span className={styles.mono}>drag the dashed line too</span>
        </>
      }
      canvas={{
        style: { cursor: "ns-resize", touchAction: "none" },
        onPointerDown: (e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          fromPointer(e);
        },
        onPointerMove: (e) => {
          if (dragging.current) fromPointer(e);
        },
        onPointerUp: () => {
          dragging.current = false;
        },
        onPointerCancel: () => {
          dragging.current = false;
        },
      }}
      onFrame={({ g, C, dt, t, caption }) => {
        const s = (sim.current ??= new ComparatorSim());
        s.mic.potMv = pot;
        s.step(dt, t);
        drawComparator(g, C, s);
        caption(
          `Threshold ${pot} mV above the bias. Each wave crest above the dashed line is one rising edge on DO (amber); a clap makes dozens, which is why S3 listens to AO, not DO.`,
        );
      }}
    />
  );
}
