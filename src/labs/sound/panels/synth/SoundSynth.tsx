import { type PointerEvent, useRef, useState } from "react";
import { Button } from "@/ui/Button";
import { ChoiceGroup } from "@/ui/ChoiceGroup";
import type { WidgetProps } from "@/widgets/types";
import { browserAudio } from "../../audio/browser-audio";
import { useBrowserAudio } from "../../audio/use-browser-audio";
import { midiHz } from "../../model/tune";
import { CanvasPanel } from "../canvas-panel/CanvasPanel";
import { LiveText, Spacer, useLiveText } from "../controls";
import shared from "../panel.module.css";
import {
  dragHandle,
  drawSynth,
  type Envelope,
  H,
  type HandleKey,
  handleAt,
  NOTE_MS,
  synthCaption,
  type SynthWave,
  W,
} from "./synth-draw";
import styles from "./synth.module.css";

const WAVES: readonly SynthWave[] = ["sine", "square", "triangle", "saw"];
const NOTES = [
  "C4",
  "D4",
  "E4",
  "F4",
  "G4",
  "A4",
  "B4",
  "C5",
  "D5",
  "E5",
  "F5",
  "G5",
  "A5",
  "B5",
] as const;

interface SynthSim {
  hz: number;
  env: Envelope;
  drag: HandleKey | null;
  /** performance.now() when the last key was pressed, while its dot rides the envelope. */
  dotAt: number | null;
}

/** Canvas coordinates of a pointer event. */
function canvasPoint(e: PointerEvent<HTMLCanvasElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
}

/** S7 panel: a synth to play with (in the browser, after a click). */
export function SoundSynth(_: WidgetProps) {
  useBrowserAudio();
  const [wave, setWave] = useState<SynthWave>("triangle");
  const sim = useRef<SynthSim | null>(null);
  const [infoRef, writeInfo] = useLiveText();
  const get = () =>
    (sim.current ??= { hz: 440, env: { a: 6, d: 80, s: 0.65, r: 90 }, drag: null, dotAt: null });

  /** `at`: the click's time stamp (same clock as performance.now()). */
  function play(note: string, at: number) {
    const s = get();
    s.hz = midiHz(note);
    // A click: browser sound may start here.
    browserAudio.setOn(true);
    browserAudio.tone(s.hz, NOTE_MS, wave, 0, [s.env.a, s.env.d, s.env.s, s.env.r]);
    s.dotAt = at;
  }

  return (
    <CanvasPanel
      h={H}
      label="The wave's shape, its harmonics up to 8 kHz with the ones that fold back at 16 kHz in red, and the ADSR envelope with four handles to drag."
      controls={
        <>
          <ChoiceGroup
            label="Wave"
            value={wave}
            onChange={setWave}
            choices={WAVES.map((w) => ({ key: w, label: w }))}
          />
          <Spacer />
          <LiveText spanRef={infoRef} />
          <div
            className={`${shared.keys} ${styles.full}`}
            role="group"
            aria-label="Keys: play a note"
          >
            {NOTES.map((n) => (
              <Button key={n} onClick={(e) => play(n, e.timeStamp)}>
                {n}
              </Button>
            ))}
          </div>
        </>
      }
      canvas={{
        style: { touchAction: "none" },
        onPointerDown: (e) => {
          const s = get();
          const p = canvasPoint(e);
          s.drag = handleAt(s.env, p.x, p.y);
          if (s.drag) e.currentTarget.setPointerCapture(e.pointerId);
        },
        onPointerMove: (e) => {
          const s = get();
          if (!s.drag) return;
          const p = canvasPoint(e);
          dragHandle(s.env, s.drag, p.x, p.y);
        },
        onPointerUp: () => {
          get().drag = null;
        },
        onPointerCancel: () => {
          get().drag = null;
        },
      }}
      onFrame={({ g, C, caption }) => {
        const s = get();
        const { env } = s;
        writeInfo(
          `${wave} · ${s.hz.toFixed(1)} Hz · adsr ${env.a.toFixed(0)} ${env.d.toFixed(0)} ${(env.s * 100).toFixed(0)}% ${env.r.toFixed(0)}`,
        );
        const aliased = drawSynth(g, C, wave, s.hz, env, s.drag, s.dotAt);
        if (s.dotAt !== null && performance.now() - s.dotAt > NOTE_MS + 200) s.dotAt = null;
        caption(synthCaption(wave, aliased));
      }}
    />
  );
}
