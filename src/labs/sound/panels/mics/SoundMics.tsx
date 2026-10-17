import { useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/media";
import { Button } from "@/ui/Button";
import type { WidgetProps } from "@/widgets/types";
import { CanvasPanel } from "../canvas-panel/CanvasPanel";
import { Range } from "../controls";
import { drawMics, sampleOf } from "./mics-draw";

/** S1 panel: the KY-037's analog path, the INMP441's digital one, and an I2S frame tick by tick. */
export function SoundMics(_: WidgetProps) {
  const [playing, setPlaying] = useState(() => !prefersReducedMotion());
  const [value, setValue] = useState(37);
  // The SCK tick the cursor is on: advanced by the frame loop, so not React state.
  const tick = useRef<number | null>(null);
  const acc = useRef(0);
  const s24 = sampleOf(value);

  return (
    <CanvasPanel
      h={360}
      label="Top: the KY-037's analog path and the INMP441's digital path. Below: an I2S frame on the SCK, WS and SD wires, a cursor reading the sample bit by bit, and the sample turned into a 16-bit number."
      controls={
        <>
          <Button onClick={() => setPlaying(!playing)}>{playing ? "❚❚ Pause" : "▶ Play"}</Button>
          <Button
            aria-label="One clock tick"
            onClick={() => {
              setPlaying(false);
              tick.current = ((tick.current ?? 0) + 1) % 64;
            }}
          >
            tick ▶
          </Button>
          <Range
            label="sound pressure"
            ariaLabel="The sample's value, as a share of full scale"
            min={-100}
            max={100}
            value={value}
            onChange={setValue}
            output={`${s24} (24-bit)`}
          />
        </>
      }
      onFrame={({ g, C, dt, reduce, caption }) => {
        tick.current ??= reduce ? 63 : 0;
        if (playing && (acc.current += dt) > 0.12) {
          acc.current = 0;
          tick.current = (tick.current + 1) % 64;
        }
        drawMics(g, C, s24, tick.current);
        caption(
          tick.current < 25
            ? "Each tick of SCK, the mic puts one bit on SD; the ESP32 reads it on the rising edge. WS says whose turn it is: low = the left slot."
            : "Why >> 6 and not >> 8 more? Taking the top 16 bits would leave a quiet room near zero. Keeping 6 more low bits is 12 dB of gain: a voice uses real numbers, and only a clap right at the mic (about 114 dB SPL) clips.",
        );
      }}
    />
  );
}
