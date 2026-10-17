import { useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/media";
import { Button } from "@/ui/Button";
import type { WidgetProps } from "@/widgets/types";
import { CanvasPanel } from "../canvas-panel/CanvasPanel";
import { Range } from "../controls";
import { drawRecorder, FR, LEN, scenePoints } from "./recorder-timeline";

const END = LEN - FR;

interface Replay {
  cursor: number;
  readonly pts: readonly number[];
}

/** S4 panel: voice-activated recording, step by step. */
export function SoundRecorderTimeline(_: WidgetProps) {
  const [playing, setPlaying] = useState(() => !prefersReducedMotion());
  const [trig, setTrig] = useState(15);
  const [hold, setHold] = useState(1200);
  const sim = useRef<Replay | null>(null);
  const replay = () =>
    (sim.current ??= { cursor: prefersReducedMotion() ? END : 0, pts: scenePoints() });

  const nudge = (ms: number) => {
    setPlaying(false);
    const r = replay();
    r.cursor = Math.max(0, Math.min(END, r.cursor + ms));
  };

  return (
    <CanvasPanel
      h={300}
      label="Nine seconds of sound: a door bang and a sentence, the trigger and hold lines, and the recorder's state as the cursor moves: armed, recording, pre-roll and the clip that is kept or dropped."
      controls={
        <>
          <Button onClick={() => nudge(-100)}>◀ 0.1 s</Button>
          <Button
            onClick={() => {
              const r = replay();
              if (r.cursor >= END) r.cursor = 0;
              setPlaying((p) => !p);
            }}
          >
            {playing ? "❚❚ Pause" : "▶ Play"}
          </Button>
          <Button onClick={() => nudge(100)}>0.1 s ▶</Button>
          <Range
            label="trigger"
            ariaLabel="Trigger level in dB above the quiet"
            min={5}
            max={35}
            value={trig}
            onChange={setTrig}
            output={`${trig} dB`}
          />
          <Range
            label="hold"
            ariaLabel="Hold time in milliseconds"
            min={300}
            max={3000}
            step={100}
            value={hold}
            onChange={setHold}
            output={`${(hold / 1000).toFixed(1)} s`}
          />
        </>
      }
      onFrame={({ g, C, dt, caption }) => {
        const r = replay();
        if (playing) {
          r.cursor += dt * 1000;
          if (r.cursor >= END) {
            r.cursor = END;
            setPlaying(false);
          }
        }
        caption(drawRecorder(g, C, r.pts, r.cursor, trig, hold));
      }}
    />
  );
}
