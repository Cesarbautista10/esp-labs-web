import { useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/media";
import { Button } from "@/ui/Button";
import { RichText } from "@/ui/RichText";
import type { WidgetProps } from "@/widgets/types";
import { Mic, type MicMode } from "../../model/mic";
import { CanvasPanel } from "../canvas-panel/CanvasPanel";
import { Spacer } from "../controls";
import styles from "../panel.module.css";
import { STEPS } from "./chain-data";
import { drawChain } from "./chain-draw";
import type { ChainSim } from "./chain-types";

const SOUNDS: readonly (readonly [MicMode | "clap", string])[] = [
  ["talk", "🗣 talk"],
  ["whistle", "〰 whistle"],
  ["clap", "👏 clap"],
  ["quiet", "🤫 quiet"],
];

/** S1 panel: from air to numbers, one stage at a time, every value live. */
export function SoundChain(_: WidgetProps) {
  const [at, setAt] = useState(0);
  const [playing, setPlaying] = useState(() => !prefersReducedMotion());
  const since = useRef(0);
  // Quiet first, so the level meter learns the quiet; then it talks.
  const sim = useRef<ChainSim | null>(null);
  const getSim = () => (sim.current ??= { mic: new Mic(), talking: false, dmaFill: 0, flying: -1 });

  const go = (next: number) => {
    since.current = 0;
    setAt((next + STEPS.length) % STEPS.length);
  };
  const step = STEPS[at] ?? STEPS[0];

  return (
    <CanvasPanel
      h={320}
      label="A pipeline of eight stages from air pressure to decibels, with the selected stage drawn live below."
      controls={
        <>
          <Button aria-label="Previous stage" onClick={() => go(at - 1)}>
            ◀
          </Button>
          <Button onClick={() => setPlaying(!playing)}>{playing ? "❚❚ Pause" : "▶ Play"}</Button>
          <Button aria-label="Next stage" onClick={() => go(at + 1)}>
            ▶
          </Button>
          <span className={styles.mono} aria-live="polite">
            {at + 1} / {STEPS.length}
          </span>
          <Spacer />
          {SOUNDS.map(([m, label]) => (
            <Button
              key={m}
              onClick={() => (m === "clap" ? getSim().mic.clap() : getSim().mic.say(m))}
            >
              {label}
            </Button>
          ))}
        </>
      }
      caption={
        step ? (
          <>
            <b>{step.title}</b>
            <br />
            <RichText text={step.text} />
          </>
        ) : null
      }
      onFrame={({ g, C, dt, t, reduce }) => {
        const s = getSim();
        s.mic.step(dt);
        if (!s.talking && s.mic.t > 0.7) {
          s.talking = true;
          s.mic.say("talk");
        }
        if (playing && (since.current += dt) > 9) go(at + 1);
        drawChain(g, C, at, s, t, dt, reduce);
      }}
    />
  );
}
