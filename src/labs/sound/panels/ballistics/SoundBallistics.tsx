import { useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/media";
import { Button } from "@/ui/Button";
import type { WidgetProps } from "@/widgets/types";
import { CanvasPanel } from "../canvas-panel/CanvasPanel";
import { Select } from "../controls";
import { drawBallistics, Replay, SCENES, type SceneKey } from "./ballistics";

const SCENE_OPTIONS = (Object.keys(SCENES) as SceneKey[]).map((k) => [k, SCENES[k].label] as const);

/** S2 panel: fast, slow and the floor, replayed. */
export function SoundBallistics(_: WidgetProps) {
  const [scene, setScene] = useState<SceneKey>("talk");
  const [playing, setPlaying] = useState(() => !prefersReducedMotion());
  const [speed, setSpeed] = useState(2);
  const replay = useRef<Replay | null>(null);

  const restart = () => {
    replay.current = null;
  };

  return (
    <CanvasPanel
      h={280}
      label="A replay of a sound scene: the instant level, the fast and slow meters, the peak hold and the noise floor over time."
      controls={
        <>
          <Select
            ariaLabel="Scene"
            value={scene}
            options={SCENE_OPTIONS}
            onChange={(k) => {
              setScene(k);
              restart();
            }}
          />
          <Button onClick={() => setPlaying((p) => !p)}>{playing ? "❚❚ Pause" : "▶ Play"}</Button>
          <Button onClick={() => setSpeed((s) => (s === 1 ? 2 : s === 2 ? 6 : 1))}>
            speed ×{speed}
          </Button>
          <Button onClick={restart}>↺ restart</Button>
        </>
      }
      onFrame={({ g, C, dt, reduce, caption }) => {
        let r = replay.current;
        if (!r || r.scene !== scene) r = replay.current = new Replay(scene, reduce);
        if (playing) r.advance(dt * speed);
        caption(drawBallistics(g, C, r));
      }}
    />
  );
}
