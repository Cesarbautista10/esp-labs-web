import { useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/media";
import { Button } from "@/ui/Button";
import type { WidgetProps } from "@/widgets/types";
import { Fft } from "../../model/fft";
import { gauss } from "../../model/random";
import { CanvasPanel } from "../canvas-panel/CanvasPanel";
import { Range } from "../controls";
import styles from "../panel.module.css";
import { drawWhistleStep, WHISTLE_RATE } from "./whistle-draw";

const STEPS: readonly (readonly [string, string])[] = [
  [
    "512 samples",
    "The newest 512 samples from the ring: 32 ms of a whistle near 1 760 Hz, about 56 waves.",
  ],
  [
    "× window",
    "Multiplied by the Hann hump: zero at both ends, so the FFT sees no jump where the block repeats.",
  ],
  ["FFT", "256 bins, 31.25 Hz apart. Most are near the floor; a few around 1 760 Hz stand tall."],
  [
    "peak bin",
    "The tallest bin between 80 Hz and 4 kHz. Its clarity (how far above the average it stands) is well over 12 dB: a tone, not noise. Speech fails this test.",
  ],
  [
    "parabola",
    "The true pitch sits between bins. A parabola through the peak and its two neighbours puts it between them, much finer than 31 Hz.",
  ],
  [
    "Hz → note",
    "midi = 69 + 12 × log2(Hz / 440). The nearest whole number is the note; what's left × 100 is the cents. ±5 cents shows green on the tuner.",
  ],
];

interface WhistleSim {
  fft: Fft;
  s: Float32Array;
  ws: Float32Array;
  since: number;
}

/** S5 panel: from a whistle to a note, step by step. */
export function SoundWhistleSeq(_: WidgetProps) {
  const [at, setAt] = useState(0);
  const [playing, setPlaying] = useState(() => !prefersReducedMotion());
  const [hz, setHz] = useState(1763);
  const sim = useRef<WhistleSim | null>(null);

  const go = (step: number) => {
    setAt((step + STEPS.length) % STEPS.length);
    if (sim.current) sim.current.since = 0;
  };
  const [title, text] = STEPS[at] ?? ["", ""];

  return (
    <CanvasPanel
      h={280}
      label="Six steps from samples to a note name: the samples, the window, the FFT bins, the peak bin, the parabola between bins and the note with its cents."
      controls={
        <>
          <Button aria-label="Previous step" onClick={() => go(at - 1)}>
            ◀
          </Button>
          <Button onClick={() => setPlaying(!playing)}>{playing ? "❚❚ Pause" : "▶ Play"}</Button>
          <Button aria-label="Next step" onClick={() => go(at + 1)}>
            ▶
          </Button>
          <span className={styles.mono} aria-live="polite">
            {at + 1} / {STEPS.length}
          </span>
          <Range
            label="whistle"
            ariaLabel="Whistle frequency in Hz"
            min={600}
            max={3000}
            value={hz}
            onChange={setHz}
            output={`${hz} Hz`}
          />
        </>
      }
      caption={
        <>
          <b>
            {at + 1} · {title}
          </b>{" "}
          {text}
        </>
      }
      onFrame={({ g, C, dt }) => {
        const w = (sim.current ??= {
          fft: new Fft(512),
          s: new Float32Array(512),
          ws: new Float32Array(512),
          since: 0,
        });
        if (playing && (w.since += dt) > 5) {
          w.since = 0;
          setAt((a) => (a + 1) % STEPS.length);
        }
        for (let i = 0; i < 512; i++) {
          const v = 9000 * Math.sin((2 * Math.PI * hz * i) / WHISTLE_RATE) + gauss() * 300;
          w.s[i] = v;
          w.ws[i] = v * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / 511));
        }
        w.fft.run(w.s);
        drawWhistleStep(g, C, at, w.fft, w.s, w.ws, w.fft.peak(WHISTLE_RATE, 80, 4000));
      }}
    />
  );
}
