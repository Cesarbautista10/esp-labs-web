import { useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/media";
import { Button } from "@/ui/Button";
import type { WidgetProps } from "@/widgets/types";
import { CanvasPanel } from "../canvas-panel/CanvasPanel";
import { Range, Select } from "../controls";
import { drawClapMachine, ENV, type EnvKey, N, randomJitter } from "./clap-machine";

const ENV_OPTIONS = (Object.keys(ENV) as EnvKey[]).map((k) => [k, ENV[k].label] as const);

interface Replay {
  cursor: number;
  acc: number;
  readonly jitter: readonly number[];
}

/** S3 panel: is it a clap? The detector, one 4 ms frame at a time. */
export function SoundClapMachine(_: WidgetProps) {
  const [env, setEnv] = useState<EnvKey>("clap");
  const [playing, setPlaying] = useState(() => !prefersReducedMotion());
  const [rise, setRise] = useState(18);
  const [relRaw, setRel] = useState(8);
  const rel = Math.min(relRaw, rise - 1);
  const sim = useRef<Replay | null>(null);
  const replay = () =>
    (sim.current ??= {
      cursor: prefersReducedMotion() ? N - 1 : 0,
      acc: 0,
      jitter: randomJitter(),
    });

  const nudge = (d: number) => {
    setPlaying(false);
    const r = replay();
    r.cursor = Math.max(0, Math.min(N - 1, r.cursor + d));
  };

  return (
    <CanvasPanel
      h={330}
      label="A loudness envelope over 1.2 seconds with the rise and release thresholds, a cursor, and the detector's three states with the events it has produced so far."
      controls={
        <>
          <Select
            ariaLabel="Which sound"
            value={env}
            options={ENV_OPTIONS}
            onChange={(k) => {
              setEnv(k);
              const reduce = prefersReducedMotion();
              replay().cursor = reduce ? N - 1 : 0;
              setPlaying(!reduce);
            }}
          />
          <Button aria-label="One frame back" onClick={() => nudge(-1)}>
            ◀ 4 ms
          </Button>
          <Button
            onClick={() => {
              const r = replay();
              if (r.cursor >= N - 1) r.cursor = 0;
              setPlaying((p) => !p);
            }}
          >
            {playing ? "❚❚ Pause" : "▶ Play"}
          </Button>
          <Button aria-label="One frame on" onClick={() => nudge(1)}>
            4 ms ▶
          </Button>
          <Range
            label="rise"
            ariaLabel="Rise threshold in dB"
            min={6}
            max={40}
            value={rise}
            onChange={setRise}
            output={`${rise} dB`}
          />
          <Range
            label="release"
            ariaLabel="Release threshold in dB"
            min={2}
            max={20}
            value={relRaw}
            onChange={setRel}
            output={`${rel} dB`}
          />
        </>
      }
      onFrame={({ g, C, dt, caption }) => {
        const r = replay();
        if (playing) {
          r.acc += dt;
          while (r.acc > 0.016) {
            r.acc -= 0.016;
            if (r.cursor < N - 1) r.cursor++;
            else setPlaying(false);
          }
        }
        caption(drawClapMachine(g, C, env, r.cursor, rise, rel, r.jitter));
      }}
    />
  );
}
