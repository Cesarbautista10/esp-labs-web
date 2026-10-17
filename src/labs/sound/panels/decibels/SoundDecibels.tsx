import { useState } from "react";
import { Button } from "@/ui/Button";
import type { WidgetProps } from "@/widgets/types";
import { CanvasPanel } from "../canvas-panel/CanvasPanel";
import { Range } from "../controls";
import { drawDecibels } from "./draw-decibels";

const STEPS: readonly (readonly [string, number])[] = [
  ["-6", -60],
  ["+6", 60],
  ["+20", 200],
];

/** S2 panel: what a decibel is. */
export function SoundDecibels(_: WidgetProps) {
  // Tenths of a dB above the quiet, like the original slider.
  const [tenths, setTenths] = useState(200);
  const db = tenths / 10;
  const ratio = Math.pow(10, db / 20);

  return (
    <CanvasPanel
      h={250}
      label="Two waves: the room's quiet and a louder sound you choose, with a decibel ruler showing that +6 dB doubles the height and +20 dB is ten times."
      controls={
        <>
          <Range
            label="how loud"
            ariaLabel="Decibels above the quiet, times ten"
            min={0}
            max={600}
            value={tenths}
            onChange={setTenths}
            output={`${db.toFixed(1)} dB = ×${ratio < 10 ? ratio.toFixed(2) : Math.round(ratio)}`}
          />
          {STEPS.map(([l, d]) => (
            <Button key={l} onClick={() => setTenths((v) => Math.max(0, Math.min(600, v + d)))}>
              {l} dB
            </Button>
          ))}
        </>
      }
      onFrame={({ g, C, t, reduce, caption }) => caption(drawDecibels(g, C, db, reduce ? 0 : t))}
    />
  );
}
