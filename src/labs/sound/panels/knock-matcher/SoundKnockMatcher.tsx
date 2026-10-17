import { type KeyboardEvent, useRef, useState } from "react";
import { Button } from "@/ui/Button";
import type { WidgetProps } from "@/widgets/types";
import { matchRhythm, type RhythmMatch } from "../../model/rhythm";
import { CanvasPanel } from "../canvas-panel/CanvasPanel";
import { Range } from "../controls";
import { drawKnocks } from "./knock-draw";

const PAUSE_MS = 1500;
const INTRO =
  "Knock a rhythm of 2-12 knocks (button or Space while the picture has focus). Wait 1.5 s: it becomes the secret. Then knock it again, faster or slower.";

interface Knocks {
  secret: number[];
  attempt: number[];
  open: number[];
  lastTap: number;
  result: RhythmMatch | null;
  caption: string;
}

const fresh = (): Knocks => ({
  secret: [],
  attempt: [],
  open: [],
  lastTap: 0,
  result: null,
  caption: INTRO,
});

/** S6 panel: the knock lock's matcher, with your own taps. */
export function SoundKnockMatcher(_: WidgetProps) {
  const [setting, setSetting] = useState(true);
  const [tolPct, setTolPct] = useState(12);
  const knocks = useRef<Knocks | null>(null);

  const tap = () => {
    const k = (knocks.current ??= fresh());
    const now = performance.now();
    if (k.open.length < 12) k.open.push(now);
    k.lastTap = now;
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code !== "Space") return;
    e.preventDefault();
    tap();
  };
  const clear = () => {
    knocks.current = fresh();
    setSetting(true);
  };

  return (
    <CanvasPanel
      h={250}
      label="The secret rhythm and your attempt drawn as knocks on two lines, both stretched to the same length, with the gaps compared."
      canvas={{ tabIndex: 0, onKeyDown, onPointerDown: tap, style: { cursor: "pointer" } }}
      controls={
        <>
          <Button pressed={setting} onClick={() => setSetting(!setting)}>
            {setting ? "recording: the secret" : "trying to open"}
          </Button>
          <Button onClick={tap}>👊 knock (or Space)</Button>
          <Button onClick={clear}>↺ start over</Button>
          <Range
            label="tolerance"
            ariaLabel="Tolerance in percent"
            min={3}
            max={30}
            value={tolPct}
            onChange={setTolPct}
            output={`${tolPct}%`}
          />
        </>
      }
      onFrame={({ g, C, caption }) => {
        const k = (knocks.current ??= fresh());
        const tol = tolPct / 100;
        const now = performance.now();
        if (k.open.length && now - k.lastTap > PAUSE_MS) {
          if (setting) {
            if (k.open.length >= 2) {
              k.secret = k.open;
              setSetting(false);
              k.caption = `Secret saved: ${k.secret.length} knocks over ${(((k.secret.at(-1) ?? 0) - (k.secret[0] ?? 0)) / 1000).toFixed(1)} s. Now knock it again, a bit faster or slower.`;
            } else k.caption = "A secret needs 2 knocks or more.";
          } else {
            k.attempt = k.open;
            const r = matchRhythm(k.secret, k.attempt, tol);
            k.result = r;
            k.caption = r.ok
              ? `OPEN, score ${r.score}: each gap within ${Math.round(tol * 100)}% of the secret's share, whatever the speed.`
              : `Locked: ${r.why}${r.errs.length ? ` (worst gap off by ${Math.round(r.worst * 100)}%)` : ""}.`;
          }
          k.open = [];
        }
        if (k.result && k.attempt.length) k.result = matchRhythm(k.secret, k.attempt, tol);
        caption(k.caption);
        drawKnocks(g, C, { ...k, setting, tol, quiet: Math.min(1, (now - k.lastTap) / PAUSE_MS) });
      }}
    />
  );
}
